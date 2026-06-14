from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import (
    CardEventRequest,
    CardEventResponse,
    ChatRequest,
    ChatResponse,
    Comment,
    CommentPostBody,
    CommentPostRequest,
    CommentsResponse,
    FanProfileResponse,
    GroupStandingsResponse,
    LeaderboardResponse,
    LineupResponse,
    Market,
    MarketsResponse,
    MarketResolveRequest,
    MatchUpdateRequest,
    MatchUpdateResponse,
    PredictRequest,
    PredictResponse,
    PredictResponseUser,
    PredictionResolveRequest,
    PredictionSubmitRequest,
    PredictionSubmitResponse,
    QuizAnswerRequest,
    QuizAnswerResponse,
    QuizRequest,
    QuizResponse,
    QuizResultResponse,
    QuizStartRequest,
    QuizStartResponse,
    RegisterRequest,
    UserCommentsResponse,
    UserPublic,
)
from memory import WalrusMemory
from quiz import score_quiz, compute_baseline
from stars import compute_display_stars, compute_rank, compute_leaderboard, compute_all_ranks
from markets import get_all_markets, get_market_by_id, get_option_label, set_market_result, GROUPS
from agent import generate_agent_reply, get_recalled_items, append_chat
from tools import (
    create_user,
    store_prediction,
    store_comment,
    resolve_market,
    get_user_public,
    get_leaderboard_data,
    memory,
)

load_dotenv()

app = FastAPI(title="Gaffer — WorldMind 2026 Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── In-memory comment store (per market) ─────────────────────────────────

_comments_store: Dict[str, List[dict]] = {}


# ── POST /signup/quiz ────────────────────────────────────────────────────

@app.post("/signup/quiz", response_model=QuizResponse)
def signup_quiz(body: QuizRequest):
    if not body.userId:
        raise HTTPException(400, "userId required")
    if body.expertise not in ("expert", "beginner"):
        raise HTTPException(400, "expertise must be 'expert' or 'beginner'")
    if not body.answers or len(body.answers) < 5:
        raise HTTPException(400, "At least 5 answers required")

    quiz_score = score_quiz(body.answers)
    quiz_baseline = compute_baseline(quiz_score)

    display_name = body.userId.replace("u_", "")

    create_user(
        user_id=body.userId,
        display_name=display_name,
        expertise=body.expertise,
        quiz_score=quiz_score,
        quiz_baseline=quiz_baseline,
        quiz_answers=body.answers,
    )

    return QuizResponse(quizScore=quiz_score, displayStars=quiz_baseline)


# ── GET /markets ─────────────────────────────────────────────────────────

@app.get("/markets", response_model=MarketsResponse)
def list_markets():
    return MarketsResponse(markets=get_all_markets())


# ── GET /markets/{id} ────────────────────────────────────────────────────

@app.get("/markets/{market_id}")
def get_market(market_id: str):
    market = get_market_by_id(market_id)
    if not market:
        raise HTTPException(404, "Market not found")
    return market


# ── POST /agent/predict ─────────────────────────────────────────────────

@app.post("/agent/predict", response_model=PredictResponse)
def agent_predict(body: PredictRequest):
    if not body.userId:
        raise HTTPException(400, "userId required")

    user_mem = memory.read(body.userId)
    if not user_mem:
        raise HTTPException(404, "User not found — complete signup quiz first")

    market = get_market_by_id(body.marketId)
    if not market:
        raise HTTPException(404, "Market not found")

    if market.status in ("CLOSED", "RESOLVED"):
        return PredictResponse(
            agentReply="This market is closed. No more picks allowed.",
            recalledMemory=[],
            user=PredictResponseUser(
                displayStars=user_mem.get("displayStars", 0.5),
                rank=user_mem.get("rank", 0),
            ),
        )

    # Check for duplicate
    for pred in user_mem.get("predictions", []):
        if pred.get("marketId") == body.marketId:
            prev_label = pred.get("optionLabel", "a team")
            return PredictResponse(
                agentReply=f"You already locked in {prev_label} for this one. Want to talk through whether you would change it?",
                recalledMemory=[f"Previously picked {prev_label} in this market"],
                user=PredictResponseUser(
                    displayStars=user_mem.get("displayStars", 0.5),
                    rank=user_mem.get("rank", 0),
                ),
            )

    option_label = get_option_label(body.marketId, body.optionId) or "that team"

    # Build recalled memory
    recalled = get_recalled_items(user_mem, body.marketId, option_label)

    # Generate agent reply
    expertise = user_mem.get("expertise", "beginner")
    user_message = body.reasoning or f"I predict {option_label} will win {market.title}"
    market_context = f"{market.title} ({market.id})"

    if expertise == "expert":
        agent_msg = generate_agent_reply(user_mem, user_message, market_context, option_label)
    else:
        agent_msg = generate_agent_reply(user_mem, user_message, market_context, option_label)

    # Store prediction
    new_pred = {
        "userId": body.userId,
        "marketId": body.marketId,
        "optionId": body.optionId,
        "optionLabel": option_label,
        "reasoning": body.reasoning or "",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "result": "PENDING",
    }
    predictions = user_mem.get("predictions", [])
    predictions.append(new_pred)
    user_mem["predictions"] = predictions

    # Recompute displayStars (n unchanged until resolution)
    qb = user_mem.get("quizBaseline", 0.0)
    la = user_mem.get("liveAccuracy", 0.0)
    n = user_mem.get("n", 0)
    user_mem["displayStars"] = compute_display_stars(qb, la, n)

    # Append to chat
    chat_history = user_mem.get("chatHistory", [])
    chat_history.append({
        "role": "user",
        "content": f"Predicted {option_label} in {market.title}" + (f" — {body.reasoning}" if body.reasoning else ""),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    chat_history.append({
        "role": "agent",
        "content": agent_msg,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    user_mem["chatHistory"] = chat_history

    memory.write(body.userId, user_mem)

    # Recompute rank
    all_users = memory.all_users()
    all_data = {}
    for uid in all_users:
        u = memory.read(uid)
        if u:
            all_data[uid] = u
    rank = compute_rank(body.userId, all_data)
    user_mem["rank"] = rank
    memory.write(body.userId, user_mem)

    return PredictResponse(
        agentReply=agent_msg,
        recalledMemory=recalled[:5],
        user=PredictResponseUser(
            displayStars=user_mem["displayStars"],
            rank=rank,
        ),
    )


# ── POST /agent/chat ─────────────────────────────────────────────────────

@app.post("/agent/chat", response_model=ChatResponse)
def agent_chat(body: ChatRequest):
    if not body.userId:
        raise HTTPException(400, "userId required")

    user_mem = memory.read(body.userId)
    if not user_mem:
        return ChatResponse(
            agentReply="You need to complete the signup quiz first before we can chat! Head to /signup/quiz.",
            recalledMemory=[],
        )

    market_context = None
    if body.marketId:
        market = get_market_by_id(body.marketId)
        if market:
            market_context = f"{market.title} ({market.id})"

    recalled = get_recalled_items(user_mem, body.marketId)

    agent_msg = generate_agent_reply(user_mem, body.message, market_context)

    # Append to chat
    user_mem = append_chat(user_mem, "user", body.message)
    user_mem = append_chat(user_mem, "agent", agent_msg)
    memory.write(body.userId, user_mem)

    return ChatResponse(
        agentReply=agent_msg,
        recalledMemory=recalled[:5],
    )


# ── GET /markets/{id}/comments ───────────────────────────────────────

@app.get("/markets/{market_id}/comments", response_model=CommentsResponse)
def get_comments(market_id: str):
    market = get_market_by_id(market_id)
    if not market:
        raise HTTPException(404, "Market not found")

    comments = _comments_store.get(market_id, [])
    comments_sorted = sorted(comments, key=lambda c: c.get("createdAt", ""), reverse=True)
    return CommentsResponse(comments=comments_sorted)


# ── POST /markets/{id}/comments ──────────────────────────────────────

@app.post("/markets/{market_id}/comments")
def post_comment(market_id: str, body: CommentPostRequest):
    market = get_market_by_id(market_id)
    if not market:
        raise HTTPException(404, "Market not found")

    user_mem = memory.read(body.userId)
    if not user_mem:
        raise HTTPException(404, "User not found — complete signup quiz first")

    comment = store_comment(body.userId, market_id, body.text)

    if market_id not in _comments_store:
        _comments_store[market_id] = []
    _comments_store[market_id].append(comment)

    return comment


# ── GET /leaderboard ─────────────────────────────────────────────────

@app.get("/leaderboard", response_model=LeaderboardResponse)
def leaderboard():
    top, bottom = get_leaderboard_data()
    return LeaderboardResponse(top=top, bottom=bottom)


# ── GET /user/{id} ──────────────────────────────────────────────────

@app.get("/user/{user_id}", response_model=UserPublic)
def get_user(user_id: str):
    user = get_user_public(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return UserPublic(**user)


# ── POST /admin/resolve (internal/development) ──────────────────────

@app.post("/admin/resolve/{market_id}")
def resolve_market_endpoint(market_id: str, body: MarketResolveRequest):
    market = get_market_by_id(market_id)
    if not market:
        raise HTTPException(404, "Market not found")

    if market.status == "RESOLVED":
        raise HTTPException(400, "Market already resolved")

    ok = set_market_result(market_id, body.resultOptionId)
    if not ok:
        raise HTTPException(400, "Could not resolve market")

    updated = resolve_market(market_id, body.resultOptionId)
    return {"resolved": True, "users_updated": len(updated)}


# ── GET /health ────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "agent": "WorldMind 2026", "version": "1.0.0"}


# ── In-memory stores for new API endpoints ────────────────────────

_matches_store: Dict[str, dict] = {}
_standings_cache: Dict[str, List[dict]] = {}
_lineups_store: Dict[str, dict] = {}
_card_events_store: Dict[str, List[dict]] = {}
_quiz_sessions: Dict[str, dict] = {}
_quiz_results: Dict[str, dict] = {}
_user_comments_store: Dict[str, List[dict]] = {}
_predictions_store: Dict[str, List[dict]] = {}


def _compute_group_standings(group_letter: str) -> List[dict]:
    teams = GROUPS.get(group_letter, [])
    standings = {t: {"team": t, "played": 0, "won": 0, "drawn": 0, "lost": 0,
                     "goals_for": 0, "goals_against": 0, "goal_diff": 0, "points": 0}
                 for t in teams}
    for mid, match in _matches_store.items():
        if mid.endswith(f"_GRP_{group_letter}"):
            ht, at = match["home_team"], match["away_team"]
            hg, ag = match["home_goals"], match["away_goals"]
            if ht in standings and at in standings:
                standings[ht]["played"] += 1
                standings[at]["played"] += 1
                standings[ht]["goals_for"] += hg
                standings[ht]["goals_against"] += ag
                standings[at]["goals_for"] += ag
                standings[at]["goals_against"] += hg
                if hg > ag:
                    standings[ht]["won"] += 1
                    standings[ht]["points"] += 3
                    standings[at]["lost"] += 1
                elif hg < ag:
                    standings[at]["won"] += 1
                    standings[at]["points"] += 3
                    standings[ht]["lost"] += 1
                else:
                    standings[ht]["drawn"] += 1
                    standings[at]["drawn"] += 1
                    standings[ht]["points"] += 1
                    standings[at]["points"] += 1
    result = list(standings.values())
    for entry in result:
        entry["goal_diff"] = entry["goals_for"] - entry["goals_against"]
    result.sort(key=lambda x: (-x["points"], -x["goal_diff"], -x["goals_for"]))
    return result


# ── POST /api/users/register ───────────────────────────────────────

@app.post("/api/users/register")
def api_register(body: RegisterRequest):
    from tools import create_user
    user_id = body.username
    existing = memory.read(user_id)
    if existing:
        raise HTTPException(409, "User already exists")
    user_data = create_user(
        user_id=user_id,
        display_name=body.username,
        expertise="beginner",
        quiz_score=0,
        quiz_baseline=0.5,
        quiz_answers=[],
    )
    return {"user_id": user_id, "username": body.username, "email": body.email, "status": "created"}


# ── GET /api/users/{username} ───────────────────────────────────────

@app.get("/api/users/{username}")
def api_get_user(username: str):
    user = get_user_public(username)
    if not user:
        raise HTTPException(404, "User not found")
    return user


# ── POST /api/quiz/start ────────────────────────────────────────────

@app.post("/api/quiz/start")
def api_quiz_start(body: QuizStartRequest):
    from quiz import QUESTION_BANK
    import uuid
    session_id = f"qs_{uuid.uuid4().hex[:8]}"
    n = min(body.num_questions, len(QUESTION_BANK))
    questions = QUESTION_BANK[:n]
    _quiz_sessions[body.user_id] = {
        "session_id": session_id,
        "questions": questions,
        "current_index": 0,
        "score": 0,
        "total": n,
    }
    _quiz_results[body.user_id] = {"total": n, "correct": 0, "score": 0}
    return QuizStartResponse(session_id=session_id, questions=[
        {"id": f"q{i+1}", "question": q["question"], "options": q["options"]}
        for i, q in enumerate(questions)
    ])


# ── POST /api/quiz/answer ───────────────────────────────────────────

@app.post("/api/quiz/answer")
def api_quiz_answer(body: QuizAnswerRequest):
    from quiz import QUESTION_BANK, ANSWER_KEY
    if body.user_id not in _quiz_sessions:
        raise HTTPException(404, "No active quiz session. Start a quiz first.")
    session = _quiz_sessions[body.user_id]
    q_num = int(body.question_id.replace("q", "")) - 1
    if q_num < 0 or q_num >= len(QUESTION_BANK):
        raise HTTPException(400, "Invalid question_id")
    question = QUESTION_BANK[q_num]
    try:
        user_idx = ord(body.answer.lower()) - ord("a")
    except (ValueError, TypeError):
        user_idx = -1
    correct_idx = ANSWER_KEY[q_num]
    correct = user_idx == correct_idx
    if correct:
        session["score"] += 1
        _quiz_results[body.user_id]["correct"] += 1
    _quiz_results[body.user_id]["score"] = session["score"]
    _quiz_sessions[body.user_id]["current_index"] = min(
        session["current_index"] + 1, session["total"]
    )
    return QuizAnswerResponse(
        correct=correct,
        correct_answer=chr(ord("a") + correct_idx),
        score=session["score"],
    )


# ── GET /api/quiz/result/{user_id} ──────────────────────────────────

@app.get("/api/quiz/result/{user_id}")
def api_quiz_result(user_id: str):
    result = _quiz_results.get(user_id)
    if not result:
        raise HTTPException(404, "No quiz result found for this user")
    return QuizResultResponse(
        user_id=user_id,
        total_questions=result["total"],
        correct=result["correct"],
        score=result["score"],
        stars=max(0.5, min(5.0, round((result["correct"] / max(result["total"], 1)) * 5 * 2) / 2)),
    )


# ── GET /api/standings/group/{group} ────────────────────────────────

@app.get("/api/standings/group/{group}")
def api_standings(group: str):
    standings = _compute_group_standings(group.upper())
    return GroupStandingsResponse(group=group.upper(), standings=standings)


# ── POST /api/matches/update ────────────────────────────────────────

@app.post("/api/matches/update")
def api_match_update(body: MatchUpdateRequest):
    _matches_store[body.match_id] = {
        "match_id": body.match_id,
        "home_team": body.home_team,
        "away_team": body.away_team,
        "home_goals": body.home_goals,
        "away_goals": body.away_goals,
        "minute": body.minute,
        "status": body.status,
    }
    result = f"{body.home_team} {body.home_goals}-{body.away_goals} {body.away_team}"
    return MatchUpdateResponse(match_id=body.match_id, status=body.status, result=result)


# ── POST /api/predictions/submit ────────────────────────────────────

@app.post("/api/predictions/submit")
def api_prediction_submit(body: PredictionSubmitRequest):
    import uuid
    user_mem = memory.read(body.user_id)
    if not user_mem:
        raise HTTPException(404, "User not found. Register first.")
    pred_id = f"pred_{uuid.uuid4().hex[:8]}"
    prediction = {
        "prediction_id": pred_id,
        "user_id": body.user_id,
        "match_id": body.match_id,
        "home_team": body.home_team,
        "away_team": body.away_team,
        "predicted_winner": body.predicted_winner,
        "predicted_score": body.predicted_score,
        "first_scorer": body.first_scorer,
        "status": "PENDING",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    predictions = user_mem.get("predictions", [])
    predictions.append(prediction)
    user_mem["predictions"] = predictions
    memory.write(body.user_id, user_mem)
    if body.user_id not in _predictions_store:
        _predictions_store[body.user_id] = []
    _predictions_store[body.user_id].append(prediction)
    return PredictionSubmitResponse(prediction_id=pred_id, status="PENDING")


# ── POST /api/predictions/resolve ───────────────────────────────────

@app.post("/api/predictions/resolve")
def api_prediction_resolve(body: PredictionResolveRequest):
    updated = 0
    all_user_ids = memory.all_users()
    for uid in all_user_ids:
        user_mem = memory.read(uid)
        if not user_mem:
            continue
        predictions = user_mem.get("predictions", [])
        changed = False
        for pred in predictions:
            if pred.get("match_id") != body.match_id:
                continue
            if pred.get("status") != "PENDING":
                continue
            is_hit = (
                pred.get("predicted_winner") == body.actual_winner
                and pred.get("predicted_score") == body.actual_score
            )
            pred["status"] = "HIT" if is_hit else "MISS"
            pred["actual_winner"] = body.actual_winner
            pred["actual_score"] = body.actual_score
            pred["actual_first_scorer"] = body.actual_first_scorer
            if is_hit:
                user_mem["hitCount"] = user_mem.get("hitCount", 0) + 1
            user_mem["n"] = user_mem.get("n", 0) + 1
            user_mem["resolvedCount"] = user_mem.get("resolvedCount", 0) + 1
            n = user_mem["n"]
            hit_count = user_mem["hitCount"]
            user_mem["liveAccuracy"] = hit_count / n if n > 0 else 0.0
            qb = user_mem.get("quizBaseline", 0.0)
            user_mem["displayStars"] = compute_display_stars(qb, user_mem["liveAccuracy"], n)
            user_mem["predictions"] = predictions
            changed = True
            updated += 1
        if changed:
            memory.write(uid, user_mem)
    return {"resolved": True, "match_id": body.match_id, "predictions_updated": updated}


# ── GET /api/predictions/leaderboard ────────────────────────────────

@app.get("/api/predictions/leaderboard")
def api_predictions_leaderboard():
    top, bottom = get_leaderboard_data()
    return {"top": top, "bottom": bottom}


# ── POST /api/comments/post ─────────────────────────────────────────

@app.post("/api/comments/post")
def api_comment_post(body: CommentPostBody):
    import uuid
    user_mem = memory.read(body.user_id)
    if not user_mem:
        raise HTTPException(404, "User not found")
    comment_id = f"cmt_{uuid.uuid4().hex[:8]}"
    comment = {
        "id": comment_id,
        "user_id": body.user_id,
        "display_name": user_mem.get("displayName", body.user_id),
        "comment": body.comment,
        "context": body.context,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if body.user_id not in _user_comments_store:
        _user_comments_store[body.user_id] = []
    _user_comments_store[body.user_id].append(comment)
    return comment


# ── GET /api/comments/{user_id} ─────────────────────────────────────

@app.get("/api/comments/{user_id}")
def api_get_user_comments(user_id: str):
    comments = _user_comments_store.get(user_id, [])
    comments_sorted = sorted(comments, key=lambda c: c.get("created_at", ""), reverse=True)
    return UserCommentsResponse(comments=comments_sorted)


# ── GET /api/profile/{user_id} ──────────────────────────────────────

@app.get("/api/profile/{user_id}")
def api_fan_profile(user_id: str):
    user = get_user_public(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user_mem = memory.read(user_id) or {}
    return FanProfileResponse(
        id=user["id"],
        displayName=user["displayName"],
        expertise=user["expertise"],
        displayStars=user["displayStars"],
        rank=user["rank"],
        predictions_count=len(user_mem.get("predictions", [])),
        comments_count=len(_user_comments_store.get(user_id, [])),
        created_at=user["createdAt"],
    )


# ── GET /api/lineups/{match_id} ─────────────────────────────────────

@app.get("/api/lineups/{match_id}")
def api_lineup(match_id: str):
    lineup = _lineups_store.get(match_id)
    if not lineup:
        raise HTTPException(404, "Lineup not found for this match")
    return LineupResponse(**lineup)


# ── POST /api/matches/card ─────────────────────────────────────────

@app.post("/api/matches/card")
def api_card_event(body: CardEventRequest):
    if body.match_id not in _card_events_store:
        _card_events_store[body.match_id] = []
    event = {
        "match_id": body.match_id,
        "player": body.player,
        "team": body.team,
        "card_type": body.card_type,
        "minute": body.minute,
    }
    _card_events_store[body.match_id].append(event)
    return CardEventResponse(**event)


# ── POST /api/agent/chat ────────────────────────────────────────────

@app.post("/api/agent/chat")
def api_agent_chat(body: ChatRequest):
    if not body.userId:
        raise HTTPException(400, "userId required")
    user_mem = memory.read(body.userId)
    if not user_mem:
        return ChatResponse(
            agentReply="You need to complete the signup quiz first before we can chat! Head to /signup/quiz.",
            recalledMemory=[],
        )
    market_context = None
    if body.marketId:
        from markets import get_market_by_id
        market = get_market_by_id(body.marketId)
        if market:
            market_context = f"{market.title} ({market.id})"
    recalled = get_recalled_items(user_mem, body.marketId)
    agent_msg = generate_agent_reply(user_mem, body.message, market_context)
    user_mem = append_chat(user_mem, "user", body.message)
    user_mem = append_chat(user_mem, "agent", agent_msg)
    memory.write(body.userId, user_mem)
    return ChatResponse(
        agentReply=agent_msg,
        recalledMemory=recalled[:5],
    )


# ── Run ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
