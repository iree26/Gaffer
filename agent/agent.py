import json
import os
import uuid
from datetime import datetime, timezone

from openai import OpenAI

from dotenv import load_dotenv

load_dotenv()

from memory import WalrusMemory
from prompt import SYSTEM_PROMPT
from tools import TOOL_DEFINITIONS, execute_tool
from stars import get_label, format_star_badge, get_knowledge_rating


client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
memory = WalrusMemory()

FIFA_NATIONS = [
    "canada", "mexico", "united states", "usa",
    "australia", "iraq", "iran", "japan", "jordan", "qatar", "saudi arabia", "south korea", "uzbekistan",
    "algeria", "cape verde", "dr congo", "egypt", "ghana", "ivory coast", "morocco", "senegal", "south africa", "tunisia",
    "curacao", "haiti", "panama",
    "argentina", "brazil", "colombia", "ecuador", "paraguay", "uruguay",
    "new zealand",
    "austria", "belgium", "bosnia and herzegovina", "croatia", "czechia", "england", "france",
    "germany", "netherlands", "norway", "portugal", "scotland", "spain", "sweden", "switzerland", "turkiye",
]


def _detect_nation(user_message: str, current_nation: str | None) -> str | None:
    if current_nation:
        return current_nation
    msg_lower = user_message.lower().strip()
    for nation in FIFA_NATIONS:
        if nation in msg_lower:
            return nation.title()
    return None


def _build_memory_context(mem: dict | None) -> str:
    if not mem:
        return "USER STATE: New user — no existing memory."
    parts = [
        "USER STATE:",
        f"- Language: {mem.get('language', 'unknown')}",
        f"- Nation: {mem.get('nation', 'not set')}",
        f"- Stars: {mem.get('stars', 'not set')} {mem.get('star_label', '')}",
        f"- Knowledge Rating: {mem.get('knowledge_rating', 'not set')}",
        f"- Quiz completed: {mem.get('quiz_completed', False)}",
        f"- Quiz score: {mem.get('quiz_score', 'N/A')}",
        f"- Total prediction points: {mem.get('total_points', 0)}",
    ]
    predictions = mem.get("predictions", [])
    if predictions:
        parts.append(f"- Recent predictions ({len(predictions)} total):")
        for p in predictions[-3:]:
            parts.append(f"  • {p.get('match', '?')} → {p.get('prediction', '?')} ({p.get('confidence', '?')}) [{p.get('outcome', 'pending')}]")
    hot_takes = mem.get("hot_takes", [])
    if hot_takes:
        parts.append(f"- Recent hot takes: {' | '.join(hot_takes[-2:])}")
    comments = mem.get("comment_history", [])
    if comments:
        parts.append(f"- Comments made: {len(comments)}")
        parts.append(f"  Latest: {comments[-1].get('comment', '')[:80]}")
    return "\n".join(parts)


def chat(
    user_id: str,
    user_message: str,
    conversation_history: list | None = None,
) -> dict:
    if conversation_history is None:
        conversation_history = []

    mem = memory.read(user_id)
    memory_context = _build_memory_context(mem)
    system = f"{SYSTEM_PROMPT}\n\n{memory_context}"

    messages: list[dict] = [
        {"role": "system", "content": system},
        *conversation_history,
        {"role": "user", "content": user_message},
    ]

    tools_called: list[str] = []

    for _round in range(3):
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=TOOL_DEFINITIONS,
            tool_choice="auto",
            temperature=0.3,
        )

        choice = response.choices[0]
        msg = choice.message

        if msg.content:
            response_text = msg.content
        else:
            response_text = ""

        if not msg.tool_calls:
            break

        messages.append(msg)
        for tc in msg.tool_calls:
            tool_name = tc.function.name
            try:
                tool_args = json.loads(tc.function.arguments)
            except json.JSONDecodeError:
                tool_args = {}
            result = execute_tool(tool_name, tool_args)
            tools_called.append(tool_name)
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result, ensure_ascii=False),
            })
    else:
        response_text = "I've processed all the information. What else would you like to know?"

    if mem is None:
        mem = {}

    mem["last_seen"] = datetime.now(timezone.utc).isoformat()

    nation = _detect_nation(user_message, mem.get("nation"))
    if nation:
        mem["nation"] = nation

    for tc in getattr(msg, "tool_calls", []) or []:
        if tc.function.name == "make_prediction":
            try:
                pred_args = json.loads(tc.function.arguments)
                pred = {
                    "id": str(uuid.uuid4()),
                    "match": pred_args.get("match", ""),
                    "prediction": pred_args.get("predicted_winner", ""),
                    "confidence": pred_args.get("confidence", ""),
                    "reasoning": pred_args.get("reasoning", ""),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "outcome": "pending",
                }
                predictions = mem.get("predictions", [])
                predictions.append(pred)
                mem["predictions"] = predictions
            except Exception:
                pass
        elif tc.function.name == "store_quiz_result":
            try:
                q_args = json.loads(tc.function.arguments)
                mem["quiz_score"] = q_args.get("quiz_score", 0)
                mem["quiz_completed"] = True
                mem["stars"] = q_args.get("stars", 0.5)
                from stars import get_knowledge_rating
                mem["knowledge_rating"] = get_knowledge_rating(mem["quiz_score"])
                quiz_history = mem.get("quiz_history", [])
                quiz_history.append({
                    "score": q_args.get("quiz_score", 0),
                    "stars": q_args.get("stars", 0.5),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                mem["quiz_history"] = quiz_history
            except Exception:
                pass
        elif tc.function.name == "store_comment":
            try:
                c_args = json.loads(tc.function.arguments)
                comment_entry = {
                    "module": "comment",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "comment": c_args.get("comment", ""),
                    "context": c_args.get("context", ""),
                    "sentiment": c_args.get("sentiment", "neutral"),
                }
                comment_history = mem.get("comment_history", [])
                comment_history.append(comment_entry)
                mem["comment_history"] = comment_history
            except Exception:
                pass

    try:
        if len(user_message) > 20:
            hot_takes = mem.get("hot_takes", [])
            hot_takes.append(user_message)
            mem["hot_takes"] = hot_takes[-10:]
    except Exception:
        pass

    memory.write(user_id, mem)

    return {
        "response": response_text,
        "memory_updated": True,
        "tools_called": tools_called,
        "user_id": user_id,
    }


def _run_cli():
    print("WorldMind 2026 — FIFA World Cup AI Agent")
    print("Type 'quit' to exit, 'clear' to reset session history.\n")

    user_id = input("Enter your user ID (or press Enter for anonymous): ").strip()
    if not user_id:
        user_id = f"cli_{uuid.uuid4().hex[:8]}"
        print(f"Using user ID: {user_id}")

    session_history: list[dict] = []

    while True:
        try:
            user_input = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if user_input.lower() in ("quit", "exit"):
            print("Goodbye!")
            break
        if user_input.lower() == "clear":
            session_history.clear()
            print("Session history cleared.")
            continue
        if not user_input:
            continue

        result = chat(user_id, user_input, session_history)

        print(f"\nWORLDMIND: {result['response']}")

        if result["tools_called"]:
            print(f"[Tools used: {', '.join(result['tools_called'])}]")

        session_history.append({"role": "user", "content": user_input})
        session_history.append({"role": "assistant", "content": result["response"]})

        if len(session_history) > 40:
            session_history = session_history[-40:]


if __name__ == "__main__":
    _run_cli()
