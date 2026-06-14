from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from openai import OpenAI

from dotenv import load_dotenv

from memory import WalrusMemory
from markets import get_option_label


load_dotenv()

_client = None
memory = WalrusMemory()


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
        if expertise == "expert":
            reply = f"Interesting pick. What is your reasoning behind {option_label or 'this'}?"
        else:
            reply = f"Solid pick! {option_label or 'This team'} has some real strengths. Want me to break it down?"

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
