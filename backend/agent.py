from __future__ import annotations

import json
import os
import random
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from openai import OpenAI

from dotenv import load_dotenv

from memory import WalrusMemory
from markets import get_option_label


load_dotenv()

_client = None
memory = WalrusMemory()


_CONTEXTUAL_REPLIES = {
    r"\b(goal|score|win|victory|champion|title)\b": [
        "Goals win games, but the best prediction is the one you stick to. How are you feeling about this one?",
        "Big result energy. You love to see it. What's your next call?",
        "Goals change games, but good instincts change your rank. I'm watching.",
        "Every goal tells a story. Yours? You saw it coming. Respect.",
    ],
    r"\b(lose|loss|defeat|miss|mistake|bottle|choke)\b": [
        "Football has a short memory. One bad result doesn't define the tournament.",
        "The best learn from the losses. What would you do different next time?",
        "Tough beat. But the group stage is far from over — plenty of time to turn it around.",
    ],
    r"\b(underdog|upset|shock|surprise|dark horse)\b": [
        "The World Cup loves an underdog. This could be the story of the tournament.",
        "Every tournament needs a shock result. You might be onto something.",
        "Bold. The big teams sleep on the minnows at their own risk.",
    ],
    r"\b(predict|prediction|call|pick|tip)\b": [
        "You've made your call. Now the football gods decide. Let's see if the stats back you up.",
        "Locked in. I respect a predictor who commits early.",
        "Prediction noted. The table will update once the result drops.",
    ],
    r"\b(team|squad|line.?up|eleven|starting)\b": [
        "Squad depth wins tournaments. Who's your dark horse to go all the way?",
        "The right XI can change everything. Trust the gaffer's instincts.",
        "Teams rise and fall on chemistry. You watching the warm-up matches?",
    ],
    r"\b(player|star|legend|goat|ballon)\b": [
        "One player can light up a tournament. Which one's carrying your hopes?",
        "Legends are made in World Cups. You might be watching history unfold.",
        "Stars rise when it matters most. Let's see who delivers.",
    ],
    r"\b(defence|defense|clean.?sheet|tackle|backline)\b": [
        "Defence wins tournaments. A clean sheet in the knockout stages is gold dust.",
        "Solid at the back — that's how tournaments are won.",
    ],
    r"\b(midfield|midfielder|creative|pass|dictate)\b": [
        "Control the midfield, control the game. Who's running the show for you?",
        "Midfield battles decide tight games. You picking the right general?",
    ],
    r"\b(attack|forward|striker|winger|front.?line)\b": [
        "Attack wins matches — but only if you finish your chances.",
        "Firepower up front. Who's getting the goals for you?",
    ],
    r"\b(group|stage|qualif|round|knockout|semi|final)\b": [
        "The group stage is where legends start their journey. Every point matters.",
        "Knockout football is a different beast. One moment changes everything.",
        "The final is where heroes are made. Can you see your team lifting it?",
    ],
}


def _contextual_fallback_reply(user_message: str, user_name: str = "Fan", expertise: str = "beginner") -> str:
    msg = user_message.lower()
    for pattern, replies in _CONTEXTUAL_REPLIES.items():
        if re.search(pattern, msg, re.IGNORECASE):
            return random.choice(replies)
    if expertise == "expert":
        return random.choice([
            f"Bold take, {user_name}. Walk me through the thinking behind it.",
            f"You're not afraid to go against the grain. I like it. What's the angle?",
            f"I've seen this movie before. Let's hope the ending is different for you.",
            f"You're putting your stars on the line. That takes nerve.",
        ])
    return random.choice([
        f"Good shout! What's drawing you to that call, {user_name}?",
        f"Interesting. Let's see how this plays out on the pitch.",
        f"You've got a view. I respect that. Keep watching the group stages.",
    ])


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY not set in environment")
        _client = OpenAI(api_key=api_key)
    return _client


def _build_agent_prompt(expertise: str, recalled: List[str], user_name: str) -> str:
    base = (
        "You are WorldMind 2026 — the AI brain behind Gaffer, a FIFA World Cup 2026 "
        "prediction and fan intelligence platform. You talk like a brilliant, deeply "
        "football-obsessed analyst. Short sentences. Sharp opinions. You have watched "
        "every World Cup since 1986 and you let people know it.\n\n"
        "You NEVER mention Italy or Nigeria as 2026 participants. They did not qualify.\n"
        "You NEVER hallucinate fixtures or scores. Only use the correct 2026 groups below.\n"
        "You MUST NEVER reference Qatar 2022 groups, teams, or results.\n"
        "When asked about any group, return only the correct 2026 teams listed below.\n\n"
        "FIFA World Cup 2026 Groups:\n"
        "Group A: Mexico, South Korea, South Africa, Czechia\n"
        "Group B: Canada, Switzerland, Qatar, Bosnia and Herzegovina\n"
        "Group C: Brazil, Morocco, Scotland, Haiti\n"
        "Group D: USA, Australia, Paraguay, Turkiye\n"
        "Group E: Germany, Ecuador, Ivory Coast, Curacao\n"
        "Group F: Netherlands, Japan, Tunisia, Sweden\n"
        "Group G: Belgium, Iran, Egypt, New Zealand\n"
        "Group H: Spain, Uruguay, Saudi Arabia, Cape Verde\n"
        "Group I: France, Senegal, Norway, Iraq\n"
        "Group J: Argentina, Austria, Algeria, Jordan\n"
        "Group K: Portugal, Colombia, Uzbekistan, DR Congo\n"
        "Group L: England, Croatia, Panama, Ghana\n\n"
        "You always end your reply with something that invites the next action.\n\n"
    )

    if expertise == "expert":
        base += (
            f"The user ({user_name}) is an EXPERT. Challenge them. Push back. "
            "Reference their history. Question their reasoning. Be slightly cheeky. "
            "Example: 'Bold — but you backed Mexico last week too. Doubling down?'\n"
            "Example: 'You've missed your last 3 Group Winner calls. Walk me through this one.'\n"
        )
    else:
        base += (
            f"The user ({user_name}) is a BEGINNER. Coach them. Encourage them. "
            "Explain gently. Add helpful context. "
            "Example: 'Good pick! Mexico have home advantage and a strong squad in Group A.'\n"
            "Example: 'Here is why that could work — and one thing to watch out for...'\n"
        )

    if recalled:
        base += "\nUser's relevant history:\n"
        for item in recalled[-5:]:
            base += f"- {item}\n"

    base += "\nNever mention internal field names like optionId or marketId. Keep replies under 3 sentences."
    return base


def _format_recalled_memory(user_mem: dict, market_id: Optional[str] = None, team: Optional[str] = None) -> List[str]:
    items: List[str] = []
    predictions = user_mem.get("predictions", [])
    for p in predictions[-10:]:
        if market_id and p.get("marketId") == market_id:
            items.append(f"Previously picked {p.get('optionLabel', 'a team')} in this market")
        elif team and team.lower() in p.get("optionLabel", "").lower():
            items.append(f"Picked {p.get('optionLabel', 'a team')} on {p.get('createdAt', 'a date')[:10]}")
        else:
            items.append(f"Picked {p.get('optionLabel', 'a team')} in {p.get('marketId', 'a market')}")

    chat = user_mem.get("chatHistory", [])
    for c in chat[-5:]:
        if isinstance(c, dict) and c.get("role") == "user":
            text = c.get("content", "")
            if len(text) > 60:
                text = text[:60] + "..."
            items.append(f"Asked: \"{text}\"")

    return items[:5]


def generate_agent_reply(
    user_mem: dict,
    user_message: str,
    market_context: Optional[str] = None,
    option_label: Optional[str] = None,
) -> str:
    expertise = user_mem.get("expertise", "beginner")
    user_name = user_mem.get("displayName", "Fan")
    recalled = _format_recalled_memory(user_mem, market_context, option_label)
    prompt = _build_agent_prompt(expertise, recalled, user_name)

    if option_label:
        user_message = f"Context: predicting {option_label} in {market_context}\n\nUser: {user_message}"

    try:
        llm_client = _get_client()
        response = llm_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.7,
            max_tokens=200,
        )
        reply = response.choices[0].message.content or ""
    except Exception:
        reply = _contextual_fallback_reply(user_message, user_name, expertise)

    return reply.strip()


def append_chat(user_mem: dict, role: str, content: str) -> dict:
    chat_history = user_mem.get("chatHistory", [])
    chat_history.append({
        "role": role,
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    user_mem["chatHistory"] = chat_history
    return user_mem


def get_recalled_items(user_mem: dict, market_id: Optional[str] = None, option_label: Optional[str] = None) -> List[str]:
    return _format_recalled_memory(user_mem, market_id, option_label)
