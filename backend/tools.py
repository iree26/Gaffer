from __future__ import annotations

import random
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from memory import WalrusMemory
from stars import compute_display_stars, compute_rank, compute_leaderboard, compute_all_ranks
from markets import get_option_label, get_market_by_id, GROUPS, FLAGS, _MARKETS

memory = WalrusMemory()


def create_user(user_id: str, display_name: str, expertise: str, quiz_score: int,
                quiz_baseline: float, quiz_answers: list) -> dict:
    all_users = memory.all_users()
    is_early = len(all_users) < 100
    badges = ["🌟 Early Adopter"] if is_early else []

    user_data = {
        "userId": user_id,
        "displayName": display_name or user_id,
        "expertise": expertise,
        "quizBaseline": quiz_baseline,
        "liveAccuracy": 0.0,
        "n": 0,
        "hitCount": 0,
        "resolvedCount": 0,
        "quizScore": quiz_score,
        "quizAnswers": quiz_answers,
        "predictions": [],
        "chatHistory": [],
        "commentIds": [],
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "displayStars": quiz_baseline,
        "badges": badges,
        "followers": [],
        "following": [],
        "followers_count": 0,
        "following_count": 0,
        "current_streak": 0,
        "best_streak": 0,
        "last_5_calls": [],
        "correct_predictions": 0,
        "predictions_count": 0,
        "posts_count": 0,
        "hot_takes_count": 0,
        "challenges_won": 0,
        "challenges_lost": 0,
        "country_allegiance": None,
        "flag_emoji": None,
        "quiz_seen_questions": [],
    }
    memory.write(user_id, user_data)
    return user_data


def get_user_public(user_id: str) -> Optional[dict]:
    user_mem = memory.read(user_id)
    if not user_mem:
        return None
    return {
        "id": user_mem.get("userId", user_id),
        "displayName": user_mem.get("displayName", user_id),
        "expertise": user_mem.get("expertise", "beginner"),
        "displayStars": user_mem.get("displayStars", 0.5),
        "rank": user_mem.get("rank", 0),
        "createdAt": user_mem.get("createdAt", ""),
    }


def get_leaderboard_data() -> Tuple[List[dict], List[dict]]:
    all_user_ids = memory.all_users()
    all_data = {}
    for uid in all_user_ids:
        u = memory.read(uid)
        if u:
            all_data[uid] = u
    return compute_leaderboard(all_data)


def store_prediction(user_id: str, market_id: str, option_id: str,
                     option_label: str, reasoning: Optional[str]) -> dict:
    user_mem = memory.read(user_id)
    if not user_mem:
        return {"error": "User not found"}

    predictions = user_mem.get("predictions", [])
    new_pred = {
        "userId": user_id,
        "marketId": market_id,
        "optionId": option_id,
        "optionLabel": option_label,
        "reasoning": reasoning or "",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "result": "PENDING",
    }
    predictions.append(new_pred)
    user_mem["predictions"] = predictions
    user_mem["predictions_count"] = user_mem.get("predictions_count", 0) + 1
    memory.write(user_id, user_mem)
    return new_pred


def store_comment(user_id: str, market_id: str, text: str) -> dict:
    user_mem = memory.read(user_id)
    if not user_mem:
        return {"error": "User not found"}

    display_name = user_mem.get("displayName", user_id)
    display_stars = user_mem.get("displayStars", 0.5)
    comment_id = f"c_{uuid.uuid4().hex[:8]}_{int(datetime.now().timestamp() * 1000)}"

    comment = {
        "id": comment_id,
        "marketId": market_id,
        "userId": user_id,
        "displayName": display_name,
        "displayStars": display_stars,
        "text": text,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    comment_ids = user_mem.get("commentIds", [])
    comment_ids.append(comment_id)
    user_mem["commentIds"] = comment_ids
    memory.write(user_id, user_mem)
    return comment


def resolve_market(market_id: str, result_option_id: str) -> List[dict]:
    updated_users: List[dict] = []
    all_user_ids = memory.all_users()

    for uid in all_user_ids:
        user_mem = memory.read(uid)
        if not user_mem:
            continue

        predictions = user_mem.get("predictions", [])
        changed = False

        for pred in predictions:
            if pred.get("marketId") != market_id:
                continue
            if pred.get("result") != "PENDING":
                continue

            if pred.get("optionId") == result_option_id:
                pred["result"] = "HIT"
                user_mem["hitCount"] = user_mem.get("hitCount", 0) + 1
                user_mem["correct_predictions"] = user_mem.get("correct_predictions", 0) + 1
                user_mem["current_streak"] = user_mem.get("current_streak", 0) + 1
                bs = user_mem.get("best_streak", 0)
                cs = user_mem["current_streak"]
                if cs > bs:
                    user_mem["best_streak"] = cs
                last5 = user_mem.get("last_5_calls", [])
                last5.append({"market": market_id, "pick": pred.get("optionLabel", ""), "result": "HIT ✅"})
                user_mem["last_5_calls"] = last5[-5:]
            else:
                pred["result"] = "MISS"
                user_mem["current_streak"] = 0
                last5 = user_mem.get("last_5_calls", [])
                last5.append({"market": market_id, "pick": pred.get("optionLabel", ""), "result": "MISS ❌"})
                user_mem["last_5_calls"] = last5[-5:]

            user_mem["n"] = user_mem.get("n", 0) + 1
            user_mem["resolvedCount"] = user_mem.get("resolvedCount", 0) + 1

            n = user_mem["n"]
            hit_count = user_mem["hitCount"]
            user_mem["liveAccuracy"] = hit_count / n if n > 0 else 0.0

            quiz_baseline = user_mem.get("quizBaseline", 0.0)
            live_acc = user_mem["liveAccuracy"]
            user_mem["displayStars"] = compute_display_stars(quiz_baseline, live_acc, n)
            user_mem["predictions"] = predictions
            changed = True

        if changed:
            memory.write(uid, user_mem)
            updated_users.append(user_mem)

    all_data = {}
    for uid in all_user_ids:
        u = memory.read(uid)
        if u:
            all_data[uid] = u

    ranks = compute_all_ranks(all_data)
    for uid, rank in ranks.items():
        u = memory.read(uid)
        if u:
            u["rank"] = rank
            memory.write(uid, u)

    return updated_users


# ── Badge awarding ───────────────────────────────────────────────────────

BADGE_RULES = {
    "🌟 Early Adopter": lambda u, all_count: all_count <= 100 and "🌟 Early Adopter" not in u.get("badges", []),
    "🧠 Tactician": lambda u, _: 70 <= u.get("quizScore", 0) <= 89,
    "👑 World Cup Legend": lambda u, _: u.get("quizScore", 0) >= 90,
    "🎯 Sharp Eye": lambda u, _: u.get("liveAccuracy", 0) >= 0.6,
    "🔥 Hot Take King": lambda u, _: u.get("hot_takes_count", 0) >= 10,
    "📊 Top Caller": lambda u, _: u.get("rank", 999) == 1,
    "✅ Perfect Call": lambda u, _: False,
    "🔥 On Fire": lambda u, _: u.get("current_streak", 0) >= 5,
    "⚡ Unstoppable": lambda u, _: u.get("current_streak", 0) >= 10,
    "👥 Social Butterfly": lambda u, _: u.get("followers_count", 0) >= 50,
    "💬 Loud Mouth": lambda u, _: u.get("posts_count", 0) >= 50,
    "⚔️ Challenger": lambda u, _: u.get("challenges_won", 0) >= 5,
    "🏆 Champion": lambda u, _: False,
}


def check_and_award_badges(user_id: str) -> List[str]:
    user_mem = memory.read(user_id)
    if not user_mem:
        return []
    all_count = len(memory.all_users())
    badges = user_mem.get("badges", [])
    new_badges = []
    for badge_name, rule in BADGE_RULES.items():
        if badge_name not in badges and rule(user_mem, all_count):
            badges.append(badge_name)
            new_badges.append(badge_name)
    if new_badges:
        user_mem["badges"] = badges
        memory.write(user_id, user_mem)
    return new_badges


def get_streak_label(current_streak: int) -> str:
    if current_streak >= 10:
        return "👑 Legendary Caller"
    if current_streak >= 8:
        return "🔥🔥🔥 Unstoppable"
    if current_streak >= 5:
        return "🔥🔥 On Fire"
    if current_streak >= 3:
        return "🔥 Warming Up"
    if current_streak > 0:
        return "🌱 Getting Started"
    return "❄️ Cold Spell"


# ── Bracket scoring ──────────────────────────────────────────────────────

BRACKET_POINTS = {
    "round_of_32": 1,
    "round_of_16": 2,
    "quarterfinals": 3,
    "semifinals": 5,
    "finalist": 8,
    "winner": 15,
}


def score_bracket(bracket: dict, actual: dict) -> int:
    points = 0
    for round_name, base_pts in [("round_of_32", 1), ("round_of_16", 2), ("quarterfinals", 3),
                                  ("semifinals", 5)]:
        picks = bracket.get(round_name, [])
        actuals = actual.get(round_name, [])
        for pick in picks:
            if pick in actuals:
                points += base_pts
    if bracket.get("finalist_1") in actual.get("finalists", []):
        points += 8
    if bracket.get("finalist_2") in actual.get("finalists", []):
        points += 8
    if bracket.get("winner") == actual.get("winner"):
        points += 15
    return points
