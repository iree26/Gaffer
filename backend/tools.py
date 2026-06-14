from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from memory import WalrusMemory
from stars import compute_display_stars, compute_rank, compute_leaderboard, compute_all_ranks
from markets import get_option_label, get_market_by_id, GROUPS, FLAGS, _MARKETS

memory = WalrusMemory()


def create_user(user_id: str, display_name: str, expertise: str, quiz_score: int,
                quiz_baseline: float, quiz_answers: list) -> dict:
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
    }
    memory.write(user_id, user_data)
    return user_data


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
            else:
                pred["result"] = "MISS"

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

    # Recompute all ranks
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
