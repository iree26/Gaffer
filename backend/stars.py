import math
from typing import Dict, List, Tuple


def compute_display_stars(quiz_baseline: float, live_accuracy: float, n: int) -> float:
    w = min(n / 10, 1)
    live_stars = live_accuracy * 5
    blended = (1 - w) * quiz_baseline + w * live_stars
    snapped = round(blended * 2) / 2
    return max(0.5, min(5.0, snapped))


def compute_rank(user_id: str, all_users_data: Dict[str, dict]) -> int:
    entries: List[Tuple[float, int, float, str]] = []
    for uid, data in all_users_data.items():
        ds = data.get("displayStars", 0.5)
        n = data.get("n", 0)
        acc = data.get("liveAccuracy", 0.0)
        entries.append((ds, n, acc, uid))

    entries.sort(key=lambda x: (-x[0], -x[1], -x[2]))

    for i, (_, _, _, uid) in enumerate(entries):
        if uid == user_id:
            return i + 1
    return len(entries) + 1


def compute_all_ranks(all_users_data: Dict[str, dict]) -> Dict[str, int]:
    entries: List[Tuple[float, int, float, str]] = []
    for uid, data in all_users_data.items():
        ds = data.get("displayStars", 0.5)
        n = data.get("n", 0)
        acc = data.get("liveAccuracy", 0.0)
        entries.append((ds, n, acc, uid))

    entries.sort(key=lambda x: (-x[0], -x[1], -x[2]))

    ranks: Dict[str, int] = {}
    for i, (_, _, _, uid) in enumerate(entries):
        ranks[uid] = i + 1
    return ranks


def compute_leaderboard(all_users_data: Dict[str, dict]) -> Tuple[List[dict], List[dict]]:
    entries: List[Tuple[float, int, float, str, str]] = []
    for uid, data in all_users_data.items():
        ds = data.get("displayStars", 0.5)
        n = data.get("n", 0)
        acc = data.get("liveAccuracy", 0.0)
        name = data.get("displayName", uid)
        entries.append((ds, n, acc, uid, name))

    entries.sort(key=lambda x: (-x[0], -x[1], -x[2]))

    top = []
    for i, (ds, n, acc, uid, name) in enumerate(entries[:10]):
        top.append({"displayName": name, "displayStars": ds, "rank": i + 1})

    bottom = []
    total = len(entries)
    for i, (ds, n, acc, uid, name) in enumerate(entries[-5:]):
        bottom.append({"displayName": name, "displayStars": ds, "rank": total - (len(entries[-5:]) - 1 - i)})

    if not bottom and total > 0:
        bottom.append({"displayName": entries[-1][4], "displayStars": entries[-1][0], "rank": total})

    return top, bottom
