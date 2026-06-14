import os
import uuid
from datetime import datetime, timezone

import httpx

from memory import WalrusMemory
from stars import (
    quiz_score_to_stars,
    build_star_update,
    format_star_badge,
    get_label,
    get_knowledge_rating,
    get_knowledge_emoji,
    get_prediction_points,
)
from data.scraper import FootballScraper


memory = WalrusMemory()
scraper = FootballScraper()

BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search"


def _brave_api_key() -> str:
    return os.environ.get("BRAVE_API_KEY", "")


_polls: dict[str, dict] = {}
_comments: dict[str, list[dict]] = {}
_standings_cache: dict[str, dict] = {}


TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_live_fixtures",
            "description": "Get today's and upcoming World Cup fixtures with scores, dates, and venues",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_team_form",
            "description": "Get a team's last 5 match results with form string (W/D/L) and form rating",
            "parameters": {
                "type": "object",
                "properties": {"team_name": {"type": "string", "description": "Team name e.g. Brazil, Argentina, England"}},
                "required": ["team_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_standings",
            "description": "Get group standings (team, points, goal diff). Set compact=true for a concise summary (much faster). Filter by group letter (A-L) for a single group.",
            "parameters": {
                "type": "object",
                "properties": {
                    "group": {"type": "string", "description": "Group letter (A-L) or empty for all groups"},
                    "compact": {"type": "boolean", "description": "Return concise summary (team + pts + gd only) — much faster and recommended for overviews"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "make_prediction",
            "description": "Log an official match prediction for a user",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User ID"},
                    "match": {"type": "string", "description": "Match description e.g. Brazil vs Argentina"},
                    "predicted_winner": {"type": "string", "description": "Predicted winner team name"},
                    "confidence": {"type": "string", "enum": ["low", "medium", "high"]},
                    "reasoning": {"type": "string", "description": "2-3 punchy reasons"},
                },
                "required": ["user_id", "match", "predicted_winner", "confidence", "reasoning"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_leaderboard",
            "description": "Get top users ranked by stars and accuracy",
            "parameters": {
                "type": "object",
                "properties": {"limit": {"type": "integer", "description": "Number of top users to return"}},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_poll",
            "description": "Create a poll when a debate or hot topic arises",
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {"type": "string", "description": "Poll question"},
                    "options": {"type": "array", "items": {"type": "string"}, "description": "List of poll options"},
                },
                "required": ["question", "options"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_poll_results",
            "description": "Get poll results with vote counts and percentages",
            "parameters": {
                "type": "object",
                "properties": {"poll_id": {"type": "string", "description": "Poll ID"}},
                "required": ["poll_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "post_comment",
            "description": "Post a fan comment on a match with star badge",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User ID"},
                    "match_id": {"type": "string", "description": "Match ID"},
                    "comment_text": {"type": "string", "description": "Comment text"},
                    "language": {"type": "string", "description": "Language code e.g. en, es, fr"},
                },
                "required": ["user_id", "match_id", "comment_text", "language"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_comments",
            "description": "Fetch recent comments for a match",
            "parameters": {
                "type": "object",
                "properties": {
                    "match_id": {"type": "string", "description": "Match ID"},
                    "limit": {"type": "integer", "description": "Number of comments to return"},
                },
                "required": ["match_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_player_stats",
            "description": "Search for a player's stats and information",
            "parameters": {
                "type": "object",
                "properties": {"player_name": {"type": "string", "description": "Player name"}},
                "required": ["player_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for real-time football information: scorelines, match events, confirmed/expected lineups, transfers, news. Use this when you need live data not in the internal database or when answering about specific match events, goalscorers, cards, or substitutions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query (e.g. 'Brazil vs Argentina lineup confirmed 2026', 'Morocco vs Portugal score goalscorers')"},
                    "count": {"type": "integer", "description": "Number of results to return (1-10, default 5)"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_match_report",
            "description": "Get a detailed match report for a completed match: goalscorers, assists, cards, substitutions, key moments, lineups, and statistics. ALWAYS use this when a user asks what happened in a specific match.",
            "parameters": {
                "type": "object",
                "properties": {
                    "match": {"type": "string", "description": "Match e.g. 'Mexico vs South Africa'"},
                    "date": {"type": "string", "description": "Date or tournament context e.g. 'World Cup 2026', 'June 14 2026'"},
                },
                "required": ["match"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_live_updates",
            "description": "Get live match updates for a match currently in progress. Returns current score, key events, and match stats. Call this repeatedly every 3-5 minutes for fresh updates when a user is tracking a live game.",
            "parameters": {
                "type": "object",
                "properties": {
                    "match": {"type": "string", "description": "Match e.g. 'Brazil vs Morocco'"},
                    "date": {"type": "string", "description": "Optional date context e.g. 'June 13 2026'"},
                },
                "required": ["match"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "store_quiz_result",
            "description": "Store quiz result and calculate initial star rating after quiz completion",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User ID"},
                    "quiz_score": {"type": "number", "description": "Quiz score out of ~100"},
                    "stars": {"type": "number", "description": "Initial star rating 0.5-5.0"},
                },
                "required": ["user_id", "quiz_score", "stars"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "recalculate_stars",
            "description": "Recalculate star rating after a prediction outcome is confirmed",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User ID"},
                    "outcome": {"type": "string", "enum": ["correct", "incorrect"], "description": "Prediction outcome"},
                },
                "required": ["user_id", "outcome"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "store_comment",
            "description": "Store a fan comment/hot take with sentiment analysis for Module 2",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User ID"},
                    "comment": {"type": "string", "description": "Comment text"},
                    "context": {"type": "string", "description": "Match or topic context"},
                    "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral", "spicy"], "description": "Comment sentiment"},
                },
                "required": ["user_id", "comment", "sentiment"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "store_standings_snapshot",
            "description": "Store a standings snapshot for Module 4 live tracking",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User ID"},
                    "group": {"type": "string", "description": "Group letter A-L"},
                    "standings": {
                        "type": "array",
                        "items": {"type": "object"},
                        "description": "Current standings for the group",
                    },
                },
                "required": ["user_id", "group", "standings"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_fan_profile",
            "description": "Get the full fan profile and tournament story for a user (Module 5)",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User ID"},
                },
                "required": ["user_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "resolve_prediction",
            "description": "Resolve a pending prediction with actual result and award points",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User ID"},
                    "prediction_id": {"type": "string", "description": "Prediction ID to resolve"},
                    "actual_home_score": {"type": "integer", "description": "Actual home team score"},
                    "actual_away_score": {"type": "integer", "description": "Actual away team score"},
                },
                "required": ["user_id", "prediction_id", "actual_home_score", "actual_away_score"],
            },
        },
    },
]


def _get_live_fixtures(args: dict) -> dict:
    result = scraper.get_fixtures()
    return {"status": "ok", "fixtures": result.get("fixtures", []), "source": result.get("source"), "fetched_at": result.get("fetched_at")}


def _get_team_form(args: dict) -> dict:
    team_name = args["team_name"]
    result = scraper.get_team_form(team_name)
    return {
        "status": "ok",
        "team": result.get("team"),
        "last_5": result.get("last_5", []),
        "form_string": result.get("form_string"),
        "wins": result.get("wins"),
        "draws": result.get("draws"),
        "losses": result.get("losses"),
        "form_rating": result.get("form_rating"),
        "source": result.get("source"),
    }


def _get_standings(args: dict) -> dict:
    group = args.get("group", "")
    compact = args.get("compact", False)
    result = scraper.get_standings(group if group else None)
    if compact:
        summary = {}
        for g, teams in result.items():
            summary[g] = [
                {"team": t["team"], "pts": t["points"], "gd": t["gd"]}
                for t in teams
            ]
        return {"status": "ok", "standings": summary, "compact": True}
    return {"status": "ok", "standings": result}


def _make_prediction(args: dict) -> dict:
    user_id = args["user_id"]
    user_mem = memory.read(user_id) or {}
    prediction = {
        "id": str(uuid.uuid4()),
        "match": args["match"],
        "prediction": args["predicted_winner"],
        "confidence": args["confidence"],
        "reasoning": args["reasoning"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "outcome": "pending",
    }
    predictions = user_mem.get("predictions", [])
    predictions.append(prediction)
    user_mem["predictions"] = predictions
    memory.write(user_id, user_mem)
    stars = user_mem.get("stars", 0.5)
    label = get_label(stars)
    return {
        "status": "logged",
        "prediction_id": prediction["id"],
        "match": args["match"],
        "pick": args["predicted_winner"],
        "stars": stars,
        "label": label,
        "message": f"Prediction logged with {stars:.1f}⭐ {label} confidence!",
    }


def _store_quiz_result(args: dict) -> dict:
    user_id = args["user_id"]
    quiz_score = args["quiz_score"]
    stars = args["stars"]
    user_mem = memory.read(user_id) or {}
    user_mem["quiz_score"] = quiz_score
    user_mem["quiz_completed"] = True
    user_mem["stars"] = stars
    user_mem["star_label"] = get_label(stars)
    star_history = user_mem.get("star_history", [])
    star_history.append({
        "stars": stars,
        "reason": f"Quiz completed with score {quiz_score}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    user_mem["star_history"] = star_history[-20:]
    memory.write(user_id, user_mem)
    return {
        "status": "stored",
        "stars": stars,
        "label": get_label(stars),
        "quiz_score": quiz_score,
    }


def _store_comment(args: dict) -> dict:
    user_id = args["user_id"]
    user_mem = memory.read(user_id) or {}
    comment = {
        "module": "comment",
        "user_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "comment": args["comment"],
        "context": args.get("context", ""),
        "sentiment": args["sentiment"],
    }
    comment_history = user_mem.get("comment_history", [])
    comment_history.append(comment)
    user_mem["comment_history"] = comment_history
    memory.write(user_id, user_mem)
    return {"status": "stored", "comment_count": len(comment_history)}


def _store_standings_snapshot(args: dict) -> dict:
    user_id = args["user_id"]
    user_mem = memory.read(user_id) or {}
    snapshot = {
        "module": "standings",
        "snapshot_time": datetime.now(timezone.utc).isoformat(),
        "group": args["group"],
        "standings": args["standings"],
    }
    standings_history = user_mem.get("standings_history", [])
    standings_history.append(snapshot)
    user_mem["standings_history"] = standings_history
    memory.write(user_id, user_mem)
    return {"status": "stored", "snapshots": len(standings_history)}


def _get_fan_profile(args: dict) -> dict:
    user_id = args["user_id"]
    user_mem = memory.read(user_id)
    if not user_mem:
        return {"error": f"User {user_id} not found", "tool": "get_fan_profile"}

    predictions = user_mem.get("predictions", [])
    total_preds = len(predictions)
    correct_preds = sum(1 for p in predictions if p.get("outcome") == "correct")
    accuracy = round(correct_preds / total_preds * 100) if total_preds > 0 else 0

    total_points = user_mem.get("total_points", 0)
    stars = user_mem.get("stars", 0.5)
    star_label = user_mem.get("star_label", "Newcomer")
    quiz_score = user_mem.get("quiz_score", 0)
    knowledge_rating = get_knowledge_rating(quiz_score)
    knowledge_emoji = get_knowledge_emoji(quiz_score)

    comment_history = user_mem.get("comment_history", [])
    comment_count = len(comment_history)
    hottest_take = max(comment_history, key=lambda c: 1 if c.get("sentiment") == "spicy" else 0) if comment_history else None

    star_history = user_mem.get("star_history", [])
    active_since = star_history[0]["timestamp"] if star_history else "Unknown"

    quiz_history = user_mem.get("quiz_history", [])

    badges = []
    if correct_preds >= 3:
        badges.append({"badge": "Sharpshooter", "description": "3 exact scores correct"})
    if quiz_score >= 95:
        badges.append({"badge": "Quiz Legend", "description": "95%+ on Expert difficulty"})
    if comment_count >= 10:
        badges.append({"badge": "Hot Take King", "description": "10+ spicy comments"})

    return {
        "status": "ok",
        "user_id": user_id,
        "nation": user_mem.get("nation", "Not set"),
        "stars": stars,
        "star_label": star_label,
        "quiz_score": quiz_score,
        "knowledge_rating": f"{knowledge_emoji} {knowledge_rating}",
        "total_predictions": total_preds,
        "correct_predictions": correct_preds,
        "accuracy": f"{accuracy}%",
        "total_points": total_points,
        "comment_count": comment_count,
        "hottest_take": hottest_take["comment"] if hottest_take else None,
        "active_since": active_since,
        "badges": badges,
        "quiz_history_count": len(quiz_history),
    }


def _resolve_prediction(args: dict) -> dict:
    user_id = args["user_id"]
    pred_id = args["prediction_id"]
    actual_home = args["actual_home_score"]
    actual_away = args["actual_away_score"]
    user_mem = memory.read(user_id)
    if not user_mem:
        return {"error": f"User {user_id} not found", "tool": "resolve_prediction"}
    predictions = user_mem.get("predictions", [])
    target = None
    for p in predictions:
        if p.get("id") == pred_id:
            target = p
            break
    if not target:
        return {"error": f"Prediction {pred_id} not found", "tool": "resolve_prediction"}
    if target.get("resolved"):
        return {"error": "Prediction already resolved", "tool": "resolve_prediction"}
    points = get_prediction_points(target, actual_home, actual_away)
    target["resolved"] = True
    target["points_earned"] = points
    target["resolved_at"] = datetime.now(timezone.utc).isoformat()
    if points >= 3:
        target["outcome"] = "correct"
    elif points >= 1:
        target["outcome"] = "partial"
    else:
        target["outcome"] = "incorrect"
    user_mem["predictions"] = predictions
    total_points = user_mem.get("total_points", 0) + points
    user_mem["total_points"] = total_points
    memory.write(user_id, user_mem)
    if target["outcome"] == "correct":
        _recalculate_stars({"user_id": user_id, "outcome": "correct"})
    elif target["outcome"] == "incorrect":
        _recalculate_stars({"user_id": user_id, "outcome": "incorrect"})
    return {
        "status": "resolved",
        "prediction_id": pred_id,
        "points_awarded": points,
        "total_points": total_points,
        "outcome": target["outcome"],
    }


def _recalculate_stars(args: dict) -> dict:
    user_id = args["user_id"]
    outcome = args["outcome"]
    user_mem = memory.read(user_id)
    if user_mem is None:
        return {"error": f"User {user_id} not found", "tool": "recalculate_stars"}
    update = build_star_update(user_mem, outcome)
    user_mem["stars"] = update["stars"]
    user_mem["star_label"] = update["star_label"]
    user_mem["correct_predictions"] = update["correct_predictions"]
    user_mem["total_predictions"] = update["total_predictions"]
    user_mem["live_accuracy"] = update["live_accuracy"]
    user_mem["star_history"] = update["star_history"]
    memory.write(user_id, user_mem)
    return {
        "status": "updated",
        "stars": update["stars"],
        "label": update["star_label"],
        "live_accuracy": update["live_accuracy"],
        "trend": update["trend"],
    }


def _get_leaderboard(args: dict) -> dict:
    limit = args.get("limit", 10)
    user_ids = memory.all_users()
    entries = []
    for uid in user_ids:
        user_mem = memory.read(uid)
        if user_mem and user_mem.get("quiz_completed"):
            entries.append({
                "user_id": uid,
                "nation": user_mem.get("nation", "Unknown"),
                "stars": user_mem.get("stars", 0.5),
                "label": user_mem.get("star_label", "Newcomer"),
                "live_accuracy": user_mem.get("live_accuracy", 0),
                "total_predictions": user_mem.get("total_predictions", 0),
            })
    entries.sort(key=lambda x: (-x["stars"], -x["live_accuracy"]))
    return {"status": "ok", "leaderboard": entries[:limit]}


def _create_poll(args: dict) -> dict:
    poll_id = f"poll_{uuid.uuid4().hex[:8]}"
    options = args["options"]
    _polls[poll_id] = {
        "id": poll_id,
        "question": args["question"],
        "options": {opt: 0 for opt in options},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    return {"status": "created", "poll_id": poll_id, "question": args["question"]}


def _get_poll_results(args: dict) -> dict:
    poll_id = args["poll_id"]
    poll = _polls.get(poll_id)
    if not poll:
        return {"error": f"Poll {poll_id} not found", "tool": "get_poll_results"}
    total_votes = sum(poll["options"].values())
    results = []
    for opt, count in poll["options"].items():
        pct = round(count / total_votes * 100, 1) if total_votes > 0 else 0.0
        results.append({"option": opt, "votes": count, "percentage": pct})
    return {
        "status": "ok",
        "poll_id": poll_id,
        "question": poll["question"],
        "total_votes": total_votes,
        "results": results,
    }


def _post_comment(args: dict) -> dict:
    user_id = args["user_id"]
    match_id = args["match_id"]
    comment_text = args["comment_text"]
    language = args["language"]
    user_mem = memory.read(user_id) or {}
    badge = format_star_badge(user_mem)
    comment = {
        "user_id": user_id,
        "match_id": match_id,
        "comment_text": comment_text,
        "language": language,
        "badge": badge,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if match_id not in _comments:
        _comments[match_id] = []
    _comments[match_id].append(comment)
    return {"status": "posted", "badge": badge, "comment_id": str(uuid.uuid4())}


def _get_comments(args: dict) -> dict:
    match_id = args["match_id"]
    limit = args.get("limit", 20)
    match_comments = _comments.get(match_id, [])
    return {
        "status": "ok",
        "match_id": match_id,
        "count": len(match_comments),
        "comments": match_comments[-limit:],
    }


def _search_player_stats(args: dict) -> dict:
    player_name = args["player_name"]
    result = scraper.get_player_stats(player_name)
    return {
        "status": "ok",
        "name": result.get("name"),
        "team": result.get("team"),
        "position": result.get("position"),
        "age": result.get("age"),
        "jersey": result.get("jersey"),
        "source": result.get("source"),
    }


def _web_search(args: dict) -> dict:
    query = args["query"]
    count = min(args.get("count", 5), 10)
    api_key = _brave_api_key()
    if not api_key:
        return {"status": "error", "error": "Brave Search API key not configured", "query": query}
    try:
        resp = httpx.get(
            BRAVE_SEARCH_URL,
            headers={
                "X-Subscription-Token": api_key,
                "Accept": "application/json",
            },
            params={"q": query, "count": count},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        results = []
        for r in data.get("web", {}).get("results", []):
            results.append({
                "title": r.get("title"),
                "url": r.get("url"),
                "snippet": r.get("description"),
            })
        return {
            "status": "ok",
            "query": query,
            "results": results,
            "result_count": len(results),
        }
    except httpx.TimeoutException:
        return {"status": "error", "error": "Search request timed out", "query": query}
    except Exception as e:
        return {"status": "error", "error": str(e), "query": query}


def _get_match_report(args: dict) -> dict:
    match = args["match"]
    date = args.get("date", "World Cup 2026")
    return _web_search({
        "query": f"{match} {date} match report goalscorers goals cards highlights",
        "count": 7,
    })


def _get_live_updates(args: dict) -> dict:
    match = args["match"]
    date = args.get("date", "2026")
    return _web_search({
        "query": f"{match} {date} live score updates",
        "count": 5,
    })


_TOOL_MAP = {
    "get_live_fixtures": _get_live_fixtures,
    "get_team_form": _get_team_form,
    "get_standings": _get_standings,
    "make_prediction": _make_prediction,
    "get_leaderboard": _get_leaderboard,
    "create_poll": _create_poll,
    "get_poll_results": _get_poll_results,
    "post_comment": _post_comment,
    "get_comments": _get_comments,
    "search_player_stats": _search_player_stats,
    "web_search": _web_search,
    "get_match_report": _get_match_report,
    "get_live_updates": _get_live_updates,
    "store_quiz_result": _store_quiz_result,
    "recalculate_stars": _recalculate_stars,
    "store_comment": _store_comment,
    "store_standings_snapshot": _store_standings_snapshot,
    "get_fan_profile": _get_fan_profile,
    "resolve_prediction": _resolve_prediction,
}


def execute_tool(tool_name: str, args: dict) -> dict:
    handler = _TOOL_MAP.get(tool_name)
    if not handler:
        return {"error": f"Unknown tool: {tool_name}"}
    try:
        return handler(args)
    except Exception as e:
        return {"error": str(e), "tool": tool_name}
