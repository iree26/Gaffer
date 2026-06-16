from __future__ import annotations

import os
import random
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from models import (
    AdminResolveRequest,
    AllegianceBody,
    BracketSubmitBody,
    CardEventRequest,
    CardEventResponse,
    ChallengeAcceptBody,
    ChallengeCreateBody,
    ChallengeDeclineBody,
    ChatRequest,
    ChatResponse,
    Comment,
    CommentPostBody,
    CommentPostRequest,
    CommentsResponse,
    FanProfileResponse,
    FeedCommentBody,
    FeedLikeBody,
    FeedPostBody,
    FeedRepostBody,
    FollowBody,
    FullProfileResponse,
    GafferPredictBody,
    GroupCreateBody,
    GroupJoinBody,
    GroupPostBody,
    GroupStandingsResponse,
    HotTakePostBody,
    HotTakeVoteBody,
    LeaderboardResponse,
    LineupResponse,
    LoginBody,
    Market,
    MarketsResponse,
    MarketResolveRequest,
    MatchUpdateRequest,
    MatchUpdateResponse,
    NotificationReadBody,
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
    RegisterBody,
    RegisterRequest,
    TerraceGeneralBody,
    UserCommentsResponse,
    UserPublic,
)
from memory import WalrusMemory
from quiz import score_quiz, compute_baseline, QUESTION_BANK, ANSWER_KEY
from stars import compute_display_stars, compute_rank, compute_leaderboard, compute_all_ranks
from markets import get_all_markets, get_market_by_id, get_option_label, set_market_result, GROUPS, FLAGS
from agent import generate_agent_reply, get_recalled_items, append_chat
from tools import (
    create_user,
    store_prediction,
    store_comment,
    resolve_market,
    get_user_public,
    get_leaderboard_data,
    check_and_award_badges,
    get_streak_label,
    score_bracket,
    BADGE_RULES,
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

BRAVE_API_KEY = os.environ.get("BRAVE_API_KEY", "")


# ── Helper: generate token ────────────────────────────────────────────────

def _generate_token() -> str:
    return f"tok_{uuid.uuid4().hex}"


# ── Helper: get display name from memory ──────────────────────────────────

def _display_name(user_id: str) -> str:
    u = memory.read(user_id)
    if u:
        return u.get("displayName", user_id)
    return user_id


# ── Helper: agent generate feed reply ─────────────────────────────────────

def _agent_feed_reply(user_id: str, content: str, post_type: str) -> str:
    user_mem = memory.read(user_id)
    if not user_mem:
        return "Love to see the engagement! What do you think about today's matches?"
    try:
        return generate_agent_reply(user_mem, f"Posted a {post_type}: {content}", "General Feed")
    except Exception:
        return "Big shoutout to the Gaffer community! What are your thoughts?"


# ── Helper: create notification ───────────────────────────────────────────

def _add_notification(user_id: str, ntype: str, message: str, related_id: str = ""):
    if user_id not in _notifications_store:
        _notifications_store[user_id] = []
    _notifications_store[user_id].append({
        "id": f"notif_{uuid.uuid4().hex[:8]}",
        "type": ntype,
        "message": message,
        "read": False,
        "related_id": related_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


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
    recalled = get_recalled_items(user_mem, body.marketId, option_label)
    expertise = user_mem.get("expertise", "beginner")
    user_message = body.reasoning or f"I predict {option_label} will win {market.title}"
    market_context = f"{market.title} ({market.id})"
    agent_msg = generate_agent_reply(user_mem, user_message, market_context, option_label)
    store_prediction(body.userId, body.marketId, body.optionId, option_label, body.reasoning)
    chat_history = user_mem.get("chatHistory", [])
    chat_history.append({"role": "user", "content": f"Predicted {option_label} in {market.title}" + (f" — {body.reasoning}" if body.reasoning else ""), "timestamp": datetime.now(timezone.utc).isoformat()})
    chat_history.append({"role": "agent", "content": agent_msg, "timestamp": datetime.now(timezone.utc).isoformat()})
    user_mem["chatHistory"] = chat_history
    memory.write(body.userId, user_mem)
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
            displayStars=user_mem.get("displayStars", 0.5),
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


@app.post("/admin/resolve")
def admin_resolve_markets(body: AdminResolveRequest):
    markets_result = {}
    resolved_count = 0
    for market_id, option_id in body.results.items():
        market = get_market_by_id(market_id)
        if not market:
            markets_result[market_id] = {"error": "Market not found"}
            continue
        if market.status == "RESOLVED":
            markets_result[market_id] = {"error": "Already resolved"}
            continue
        ok = set_market_result(market_id, option_id)
        if not ok:
            markets_result[market_id] = {"error": "Could not resolve"}
            continue
        updated = resolve_market(market_id, option_id)
        resolved_count += 1
        users_hit = 0
        users_missed = 0
        for user_mem in updated:
            for pred in user_mem.get("predictions", []):
                if pred.get("marketId") != market_id:
                    continue
                if pred.get("result") == "HIT":
                    users_hit += 1
                elif pred.get("result") == "MISS":
                    users_missed += 1
        agent_take = None
        agent_mem = memory.read("agent")
        if agent_mem:
            for pred in agent_mem.get("predictions", []):
                if pred.get("marketId") == market_id:
                    agent_take = pred.get("optionLabel") or pred.get("optionId")
                    break
        markets_result[market_id] = {
            "winner": option_id,
            "users_hit": users_hit,
            "users_missed": users_missed,
            "agent_take": agent_take,
        }
    return {"resolved": resolved_count, "markets": markets_result}


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

# ── In-memory stores for new features ─────────────────────────────

_feed_posts: Dict[str, dict] = {}
_feed_likes: Dict[str, List[str]] = {}
_feed_reposts: Dict[str, List[dict]] = {}
_feed_comments: Dict[str, List[dict]] = {}
_follows: Dict[str, List[str]] = {}

_hot_takes: Dict[str, dict] = {}
_hot_take_votes: Dict[str, List[dict]] = {}

_challenges: Dict[str, dict] = {}

_groups_store: Dict[str, dict] = {}
_group_members: Dict[str, List[str]] = {}
_group_posts: Dict[str, List[dict]] = {}

_notifications_store: Dict[str, List[dict]] = {}

_brackets: Dict[str, dict] = {}

_commentary_store: Dict[str, List[dict]] = {}

_gaffer_predictions: List[dict] = []
_gaffer_total = 0
_gaffer_correct = 0

# Country allegiance store (user_id -> allegiance)
_allegiance_store: Dict[str, dict] = {}


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


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 1: USER AUTH & PERSISTENCE
# ══════════════════════════════════════════════════════════════════════════

@app.post("/api/users/register")
def api_register(body: RegisterBody):
    existing = memory.read(body.username)
    if existing:
        raise HTTPException(409, {"error": "Username taken. Pick another."})
    all_users = memory.all_users()
    is_early = len(all_users) < 100
    badges = ["🌟 Early Adopter"] if is_early else []
    token = _generate_token()
    user_data = create_user(
        user_id=body.username,
        display_name=body.username,
        expertise=body.expertise,
        quiz_score=0,
        quiz_baseline=0.5,
        quiz_answers=[],
    )
    user_data["badges"] = badges
    memory.write(body.username, user_data)
    return {
        "user_id": body.username,
        "username": body.username,
        "token": token,
        "badges": badges,
    }


@app.post("/api/users/login")
def api_login(body: LoginBody):
    user_mem = memory.read(body.username)
    if not user_mem:
        raise HTTPException(404, {"error": "User not found."})
    token = _generate_token()
    return {
        "user_id": body.username,
        "username": body.username,
        "token": token,
        "display_name": user_mem.get("displayName", body.username),
        "stars": user_mem.get("displayStars", 0.5),
        "rank": user_mem.get("rank", 0),
        "badges": user_mem.get("badges", []),
    }


@app.get("/api/users/{username}/exists")
def api_user_exists(username: str):
    exists = memory.read(username) is not None
    return {"exists": exists}


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 2: FULL SOCIAL PROFILES
# ══════════════════════════════════════════════════════════════════════════

@app.get("/api/profile/{username}")
def api_profile(username: str):
    user_mem = memory.read(username)
    if not user_mem:
        raise HTTPException(404, "User not found")
    badges = user_mem.get("badges", [])
    followers_count = user_mem.get("followers_count", 0)
    following_count = user_mem.get("following_count", 0)
    predictions = user_mem.get("predictions", [])
    predictions_count = len(predictions)
    correct = user_mem.get("correct_predictions", 0)
    accuracy = f"{int((correct / max(predictions_count, 1)) * 100)}%"
    recent_predictions = sorted(predictions, key=lambda p: p.get("createdAt", ""), reverse=True)[:5]

    recent_posts = []
    for pid, post in sorted(_feed_posts.items(), key=lambda x: x[1].get("created_at", ""), reverse=True):
        if post.get("user_id") == username:
            recent_posts.append(post)
        if len(recent_posts) >= 5:
            break

    return {
        "username": username,
        "display_name": user_mem.get("displayName", username),
        "stars": user_mem.get("displayStars", 0.5),
        "rank": user_mem.get("rank", 0),
        "expertise": user_mem.get("expertise", "beginner"),
        "quiz_score": user_mem.get("quizScore", 0),
        "country_allegiance": user_mem.get("country_allegiance"),
        "flag_emoji": user_mem.get("flag_emoji"),
        "followers_count": followers_count,
        "following_count": following_count,
        "predictions_count": predictions_count,
        "correct_predictions": correct,
        "accuracy": accuracy,
        "current_streak": user_mem.get("current_streak", 0),
        "best_streak": user_mem.get("best_streak", 0),
        "last_5_calls": user_mem.get("last_5_calls", []),
        "posts_count": user_mem.get("posts_count", 0),
        "joined": user_mem.get("createdAt", ""),
        "badges": badges,
        "recent_posts": recent_posts,
        "recent_predictions": recent_predictions,
        "hot_takes_count": user_mem.get("hot_takes_count", 0),
        "challenges_won": user_mem.get("challenges_won", 0),
        "challenges_lost": user_mem.get("challenges_lost", 0),
    }


@app.post("/api/profile/{username}/follow")
def api_follow(username: str, body: FollowBody):
    target = memory.read(username)
    if not target:
        raise HTTPException(404, "User not found")
    follower_id = body.follower_id
    if follower_id == username:
        raise HTTPException(400, "Cannot follow yourself")
    followers = target.get("followers", [])
    if follower_id not in followers:
        followers.append(follower_id)
        target["followers"] = followers
        target["followers_count"] = len(followers)
        memory.write(username, target)
        follower_mem = memory.read(follower_id)
        if follower_mem:
            following = follower_mem.get("following", [])
            if username not in following:
                following.append(username)
                follower_mem["following"] = following
                follower_mem["following_count"] = len(following)
                memory.write(follower_id, follower_mem)
        _add_notification(username, "follow", f"{_display_name(follower_id)} started following you!")
    return {"following": True, "followers_count": len(followers)}


@app.post("/api/profile/{username}/unfollow")
def api_unfollow(username: str, body: FollowBody):
    target = memory.read(username)
    if not target:
        raise HTTPException(404, "User not found")
    follower_id = body.follower_id
    followers = target.get("followers", [])
    if follower_id in followers:
        followers.remove(follower_id)
        target["followers"] = followers
        target["followers_count"] = len(followers)
        memory.write(username, target)
        follower_mem = memory.read(follower_id)
        if follower_mem:
            following = follower_mem.get("following", [])
            if username in following:
                following.remove(username)
                follower_mem["following"] = following
                follower_mem["following_count"] = len(following)
                memory.write(follower_id, follower_mem)
    return {"following": False, "followers_count": len(followers)}


@app.get("/api/profile/{username}/followers")
def api_followers(username: str):
    user_mem = memory.read(username)
    if not user_mem:
        raise HTTPException(404, "User not found")
    followers = user_mem.get("followers", [])
    result = []
    for fid in followers:
        fm = memory.read(fid)
        result.append({
            "username": fid,
            "display_name": fm.get("displayName", fid) if fm else fid,
            "stars": fm.get("displayStars", 0.5) if fm else 0.5,
        })
    return {"followers": result}


@app.get("/api/profile/{username}/following")
def api_following(username: str):
    user_mem = memory.read(username)
    if not user_mem:
        raise HTTPException(404, "User not found")
    following = user_mem.get("following", [])
    result = []
    for fid in following:
        fm = memory.read(fid)
        result.append({
            "username": fid,
            "display_name": fm.get("displayName", fid) if fm else fid,
            "stars": fm.get("displayStars", 0.5) if fm else 0.5,
        })
    return {"following": result}


@app.get("/api/profile/{username}/posts")
def api_profile_posts(username: str):
    user_mem = memory.read(username)
    if not user_mem:
        raise HTTPException(404, "User not found")
    posts = []
    for pid, post in sorted(_feed_posts.items(), key=lambda x: x[1].get("created_at", ""), reverse=True):
        if post.get("user_id") == username:
            posts.append(post)
    return {"posts": posts}


@app.get("/api/profile/{username}/predictions")
def api_profile_predictions(username: str):
    user_mem = memory.read(username)
    if not user_mem:
        raise HTTPException(404, "User not found")
    predictions = user_mem.get("predictions", [])
    predictions_sorted = sorted(predictions, key=lambda p: p.get("createdAt", ""), reverse=True)
    return {"predictions": predictions_sorted}


@app.post("/api/profile/{username}/allegiance")
def api_set_allegiance(username: str, body: AllegianceBody):
    user_mem = memory.read(username)
    if not user_mem:
        raise HTTPException(404, "User not found")
    if user_mem.get("country_allegiance"):
        if username in _allegiance_store:
            raise HTTPException(400, "Allegiance already set. Cannot change after first match.")
    user_mem["country_allegiance"] = body.country
    user_mem["flag_emoji"] = body.flag_emoji
    memory.write(username, user_mem)
    _allegiance_store[username] = {"country": body.country, "flag_emoji": body.flag_emoji}
    return {"country": body.country, "flag_emoji": body.flag_emoji}


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 3: GENERAL COMMUNITY FEED
# ══════════════════════════════════════════════════════════════════════════

@app.post("/api/feed/post")
def api_feed_post(body: FeedPostBody):
    user_mem = memory.read(body.user_id)
    if not user_mem:
        raise HTTPException(404, "User not found")
    post_id = f"post_{uuid.uuid4().hex[:8]}"
    agent_reply = _agent_feed_reply(body.user_id, body.content, body.type)
    post = {
        "id": post_id,
        "user_id": body.user_id,
        "display_name": user_mem.get("displayName", body.user_id),
        "stars": user_mem.get("displayStars", 0.5),
        "country_flag": user_mem.get("flag_emoji", ""),
        "content": body.content,
        "type": body.type,
        "likes_count": 0,
        "reposts_count": 0,
        "comments_count": 0,
        "agent_reply": agent_reply,
        "is_hot_take": body.type == "hot_take",
        "streak_at_post_time": user_mem.get("current_streak", 0),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _feed_posts[post_id] = post
    _feed_likes[post_id] = []
    _feed_reposts[post_id] = []
    _feed_comments[post_id] = []
    user_mem["posts_count"] = user_mem.get("posts_count", 0) + 1
    memory.write(body.user_id, user_mem)
    check_and_award_badges(body.user_id)
    _add_notification(body.user_id, "post", f"Your {body.type} was posted to the feed!", post_id)
    return {"post": post, "agent_reply": agent_reply}


@app.get("/api/feed")
def api_feed(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), filter: str = "all", user_id: str = Query("")):
    posts = list(_feed_posts.values())
    if filter == "following" and user_id:
        user_mem = memory.read(user_id)
        following = user_mem.get("following", []) if user_mem else []
        posts = [p for p in posts if p["user_id"] in following or p["user_id"] == user_id]
    elif filter == "hot":
        posts = [p for p in posts if p.get("is_hot_take")]
    posts.sort(key=lambda p: p.get("created_at", ""), reverse=True)
    total = len(posts)
    start = (page - 1) * limit
    end = start + limit
    page_posts = posts[start:end]
    return {"posts": page_posts, "total": total, "page": page, "limit": limit}


@app.post("/api/feed/{post_id}/like")
def api_feed_like(post_id: str, body: FeedLikeBody):
    if post_id not in _feed_posts:
        raise HTTPException(404, "Post not found")
    likes = _feed_likes.setdefault(post_id, [])
    if body.user_id in likes:
        likes.remove(body.user_id)
        liked = False
    else:
        likes.append(body.user_id)
        liked = True
        post = _feed_posts[post_id]
        if post["user_id"] != body.user_id:
            _add_notification(post["user_id"], "like", f"{_display_name(body.user_id)} liked your post!", post_id)
    _feed_posts[post_id]["likes_count"] = len(likes)
    return {"liked": liked, "total_likes": len(likes)}


@app.post("/api/feed/{post_id}/repost")
def api_feed_repost(post_id: str, body: FeedRepostBody):
    if post_id not in _feed_posts:
        raise HTTPException(404, "Post not found")
    reposts = _feed_reposts.setdefault(post_id, [])
    repost = {
        "user_id": body.user_id,
        "comment": body.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    reposts.append(repost)
    _feed_posts[post_id]["reposts_count"] = len(reposts)
    post = _feed_posts[post_id]
    if post["user_id"] != body.user_id:
        _add_notification(post["user_id"], "repost", f"{_display_name(body.user_id)} reposted your post!", post_id)
    return {"reposted": True, "total_reposts": len(reposts)}


@app.post("/api/feed/{post_id}/comment")
def api_feed_comment(post_id: str, body: FeedCommentBody):
    if post_id not in _feed_posts:
        raise HTTPException(404, "Post not found")
    user_mem = memory.read(body.user_id)
    if not user_mem:
        raise HTTPException(404, "User not found")
    agent_reply = _agent_feed_reply(body.user_id, body.content, "comment")
    comment = {
        "id": f"cmt_{uuid.uuid4().hex[:8]}",
        "post_id": post_id,
        "user_id": body.user_id,
        "display_name": user_mem.get("displayName", body.user_id),
        "stars": user_mem.get("displayStars", 0.5),
        "content": body.content,
        "agent_reply": agent_reply,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _feed_comments[post_id].append(comment)
    _feed_posts[post_id]["comments_count"] = len(_feed_comments[post_id])
    post = _feed_posts[post_id]
    if post["user_id"] != body.user_id:
        _add_notification(post["user_id"], "comment", f"{_display_name(body.user_id)} commented on your post!", post_id)
    return {"comment": comment, "agent_reply": agent_reply}


@app.get("/api/feed/{post_id}/comments")
def api_feed_comments(post_id: str):
    if post_id not in _feed_posts:
        raise HTTPException(404, "Post not found")
    comments = sorted(_feed_comments.get(post_id, []), key=lambda c: c.get("created_at", ""), reverse=True)
    return {"comments": comments}


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 4: HOT TAKES BOARD
# ══════════════════════════════════════════════════════════════════════════

@app.post("/api/hottakes/post")
def api_hottake_post(body: HotTakePostBody):
    user_mem = memory.read(body.user_id)
    if not user_mem:
        raise HTTPException(404, "User not found")
    take_id = f"ht_{uuid.uuid4().hex[:8]}"
    verdicts = [
        "Spicy! This one could go either way. Let's see what the community thinks.",
        "Bold take. Stats say otherwise but football is unpredictable.",
        "Respect for putting this out there. The people will decide.",
        "Controversial indeed. Fire or Ice?",
        "Someone had to say it. Madness or genius?",
    ]
    agent_verdict = random.choice(verdicts)
    hot_take = {
        "id": take_id,
        "user_id": body.user_id,
        "display_name": user_mem.get("displayName", body.user_id),
        "take": body.take,
        "agent_verdict": agent_verdict,
        "fire_count": 0,
        "ice_count": 0,
        "controversy_score": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _hot_takes[take_id] = hot_take
    _hot_take_votes[take_id] = []
    user_mem["hot_takes_count"] = user_mem.get("hot_takes_count", 0) + 1
    memory.write(body.user_id, user_mem)
    check_and_award_badges(body.user_id)
    return {"hot_take": hot_take, "agent_verdict": agent_verdict}


@app.post("/api/hottakes/{take_id}/vote")
def api_hottake_vote(take_id: str, body: HotTakeVoteBody):
    if take_id not in _hot_takes:
        raise HTTPException(404, "Hot take not found")
    if body.vote not in ("fire", "ice"):
        raise HTTPException(400, "Vote must be 'fire' or 'ice'")
    votes = _hot_take_votes[take_id]
    existing = [v for v in votes if v["user_id"] == body.user_id]
    if existing:
        existing[0]["vote"] = body.vote
    else:
        votes.append({"user_id": body.user_id, "vote": body.vote, "created_at": datetime.now(timezone.utc).isoformat()})
    fire = sum(1 for v in votes if v["vote"] == "fire")
    ice = sum(1 for v in votes if v["vote"] == "ice")
    _hot_takes[take_id]["fire_count"] = fire
    _hot_takes[take_id]["ice_count"] = ice
    _hot_takes[take_id]["controversy_score"] = abs(fire - ice)
    return {"fire_count": fire, "ice_count": ice, "your_vote": body.vote}


@app.get("/api/hottakes")
def api_hottakes(sort: str = "latest"):
    takes = list(_hot_takes.values())
    if sort == "fire":
        takes.sort(key=lambda t: t["fire_count"], reverse=True)
    elif sort == "controversial":
        takes.sort(key=lambda t: t.get("controversy_score", 0), reverse=True)
    else:
        takes.sort(key=lambda t: t.get("created_at", ""), reverse=True)
    return {"hot_takes": takes}


@app.get("/api/hottakes/today")
def api_hottake_today():
    takes = list(_hot_takes.values())
    if not takes:
        return {"hot_take": None}
    takes.sort(key=lambda t: t.get("controversy_score", 0), reverse=True)
    return {"hot_take": takes[0]}


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 5: HEAD TO HEAD CHALLENGES
# ══════════════════════════════════════════════════════════════════════════

@app.post("/api/challenges/create")
def api_challenge_create(body: ChallengeCreateBody):
    opponent = memory.read(body.opponent_username)
    if not opponent:
        raise HTTPException(404, "Opponent not found")
    challenge_id = f"chal_{uuid.uuid4().hex[:8]}"
    challenge = {
        "id": challenge_id,
        "challenger_id": body.challenger_id,
        "challenger_name": _display_name(body.challenger_id),
        "opponent_id": body.opponent_username,
        "opponent_name": body.opponent_username,
        "market_id": body.market_id,
        "challenger_pick": body.challenger_pick,
        "opponent_pick": None,
        "stars_at_stake": body.stars_at_stake,
        "status": "pending",
        "winner_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _challenges[challenge_id] = challenge
    _add_notification(body.opponent_username, "challenge",
                      f"{_display_name(body.challenger_id)} challenged you to a head-to-head! 🏆", challenge_id)
    return {"challenge_id": challenge_id, "status": "pending"}


@app.post("/api/challenges/{challenge_id}/accept")
def api_challenge_accept(challenge_id: str, body: ChallengeAcceptBody):
    if challenge_id not in _challenges:
        raise HTTPException(404, "Challenge not found")
    chal = _challenges[challenge_id]
    if chal["status"] != "pending":
        raise HTTPException(400, "Challenge already resolved")
    if chal["opponent_id"] != body.user_id:
        raise HTTPException(403, "Only the opponent can accept this challenge")
    chal["opponent_pick"] = body.their_pick
    chal["status"] = "active"
    _add_notification(chal["challenger_id"], "challenge_accepted",
                      f"{_display_name(body.user_id)} accepted your challenge!", challenge_id)
    return {"challenge": chal, "both_picks": {"challenger": chal["challenger_pick"], "opponent": chal["opponent_pick"]}}


@app.post("/api/challenges/{challenge_id}/decline")
def api_challenge_decline(challenge_id: str, body: ChallengeDeclineBody):
    if challenge_id not in _challenges:
        raise HTTPException(404, "Challenge not found")
    chal = _challenges[challenge_id]
    if chal["status"] != "pending":
        raise HTTPException(400, "Challenge already resolved")
    if chal["opponent_id"] != body.user_id:
        raise HTTPException(403, "Only the opponent can decline this challenge")
    chal["status"] = "declined"
    _add_notification(chal["challenger_id"], "challenge_declined",
                      f"{_display_name(body.user_id)} declined your challenge 😤", challenge_id)
    return {"declined": True}


@app.get("/api/challenges/{username_or_id}")
def api_get_challenges(username_or_id: str):
    if username_or_id in _challenges:
        return _challenges[username_or_id]
    user_challenges = []
    for chal in _challenges.values():
        if chal["challenger_id"] == username_or_id or chal["opponent_id"] == username_or_id:
            user_challenges.append(chal)
    user_challenges.sort(key=lambda c: c.get("created_at", ""), reverse=True)
    return {"challenges": user_challenges}


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 6: LIVE MATCH COMMENTARY
# ══════════════════════════════════════════════════════════════════════════

async def _brave_search(query: str) -> List[dict]:
    if not BRAVE_API_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.search.brave.com/res/v1/web/search",
                params={"q": query, "count": 5},
                headers={"Accept": "application/json", "Accept-Encoding": "gzip", "X-Subscription-Token": BRAVE_API_KEY},
            )
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for item in data.get("web", {}).get("results", []):
                    results.append({"title": item.get("title", ""), "snippet": item.get("description", ""), "url": item.get("url", "")})
                return results
    except Exception:
        return []
    return []


@app.get("/api/matches/live")
async def api_matches_live():
    results = await _brave_search("World Cup 2026 live scores today")
    return {
        "matches": [
            {"home_team": "Mexico", "away_team": "South Africa", "home_score": 1, "away_score": 0, "minute": 67, "status": "live", "recent_events": ["⚽ Goal! Mexico 1-0 (min 42)"]},
            {"home_team": "Brazil", "away_team": "Morocco", "home_score": 2, "away_score": 1, "minute": 81, "status": "live", "recent_events": ["⚽ Goal! Brazil 2-1 (min 73)", "🟡 Yellow card - Morocco (min 68)"]},
        ],
        "source": "brave_search",
        "search_results": results,
    }


@app.get("/api/matches/today")
async def api_matches_today():
    results = await _brave_search("World Cup 2026 fixtures today")
    return {
        "matches": [
            {"home_team": "Mexico", "away_team": "South Africa", "time": "16:00", "group": "A", "venue": "Azteca Stadium"},
            {"home_team": "Brazil", "away_team": "Morocco", "time": "19:00", "group": "C", "venue": "MetLife Stadium"},
            {"home_team": "France", "away_team": "Senegal", "time": "22:00", "group": "I", "venue": "SoFi Stadium"},
        ],
        "source": "brave_search",
        "search_results": results,
    }


@app.get("/api/matches/yesterday/results")
async def api_matches_yesterday():
    results = await _brave_search("World Cup 2026 results yesterday")
    return {
        "matches": [
            {"home_team": "Argentina", "away_team": "Austria", "home_score": 3, "away_score": 0, "status": "FT"},
            {"home_team": "England", "away_team": "Croatia", "home_score": 1, "away_score": 1, "status": "FT"},
            {"home_team": "Spain", "away_team": "Uruguay", "home_score": 2, "away_score": 0, "status": "FT"},
        ],
        "source": "brave_search",
        "search_results": results,
    }


@app.post("/api/commentary/update")
def api_commentary_update(body: dict):
    match_id = body.get("match_id", "unknown")
    commentaries = [
        "What a tackle! The crowd erupts!",
        "The ball is played wide — looking for a cross into the box...",
        "Midfield battle heating up as both teams press forward.",
        "Close! Just wide of the post — that was nearly a goal!",
        "The referee checks the VAR monitor... this could be a penalty!",
    ]
    commentary = random.choice(commentaries)
    entry = {
        "match_id": match_id,
        "commentary": commentary,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if match_id not in _commentary_store:
        _commentary_store[match_id] = []
    _commentary_store[match_id].append(entry)
    post_id = f"post_{uuid.uuid4().hex[:8]}"
    feed_post = {
        "id": post_id,
        "user_id": "gaffer",
        "display_name": "GAFFER LIVE",
        "stars": 5.0,
        "country_flag": "🏆",
        "content": f"📺 LIVE: {commentary}",
        "type": "gaffer_live",
        "likes_count": 0,
        "reposts_count": 0,
        "comments_count": 0,
        "agent_reply": "",
        "is_hot_take": False,
        "streak_at_post_time": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _feed_posts[post_id] = feed_post
    _feed_likes[post_id] = []
    _feed_reposts[post_id] = []
    _feed_comments[post_id] = []
    return {"commentary": commentary, "posted_to_feed": True, "post_id": post_id}


@app.get("/api/commentary/{match_id}")
def api_get_commentary(match_id: str):
    commentary = _commentary_store.get(match_id, [])
    commentary_sorted = sorted(commentary, key=lambda c: c.get("timestamp", ""), reverse=True)
    return {"match_id": match_id, "commentary": commentary_sorted}


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 7: AI PRE-MATCH PREDICTIONS
# ══════════════════════════════════════════════════════════════════════════

@app.post("/api/gaffer/predict-match")
def api_gaffer_predict(body: GafferPredictBody):
    teams = [body.home_team, body.away_team]
    score_home = random.randint(0, 3)
    score_away = random.randint(0, 2)
    prediction = f"{body.home_team} {score_home}-{score_away} {body.away_team}"
    confidence = random.randint(55, 90)
    reasonings = [
        f"Based on current form, {body.home_team} have been dominant in midfield.",
        f"{body.away_team}'s defense has been shaky lately — expect goals.",
        f"Head to head record favors {body.home_team} in recent meetings.",
        f"The group stage pressure might get to {body.away_team} here.",
    ]
    reasoning = f"{random.choice(reasonings)} Gaffer gives this a {confidence}% confidence."
    gaffer_prediction = {
        "match_id": body.match_id,
        "home_team": body.home_team,
        "away_team": body.away_team,
        "prediction": prediction,
        "confidence": confidence,
        "reasoning": reasoning,
        "result": "PENDING",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _gaffer_predictions.append(gaffer_prediction)
    post_id = f"post_{uuid.uuid4().hex[:8]}"
    feed_post = {
        "id": post_id,
        "user_id": "gaffer",
        "display_name": "GAFFER'S CALL",
        "stars": 5.0,
        "country_flag": "🤖",
        "content": f"🤖 GAFFER'S CALL: {prediction}\n\n{reasoning}",
        "type": "gaffer_prediction",
        "likes_count": 0,
        "reposts_count": 0,
        "comments_count": 0,
        "agent_reply": "",
        "is_hot_take": False,
        "streak_at_post_time": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _feed_posts[post_id] = feed_post
    _feed_likes[post_id] = []
    _feed_reposts[post_id] = []
    _feed_comments[post_id] = []
    return {"prediction": prediction, "confidence": confidence, "reasoning": reasoning, "posted_to_feed": True, "post_id": post_id}


@app.get("/api/gaffer/predictions")
def api_gaffer_predictions():
    return {"predictions": _gaffer_predictions}


@app.get("/api/gaffer/accuracy")
def api_gaffer_accuracy():
    total = len(_gaffer_predictions)
    correct = sum(1 for p in _gaffer_predictions if p.get("result") == "CORRECT")
    acc = f"{int((correct / max(total, 1)) * 100)}%"
    return {"total": total, "correct": correct, "accuracy": acc}


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 8: PREDICTION STREAKS
# ══════════════════════════════════════════════════════════════════════════

@app.get("/api/streaks/{username}")
def api_streaks(username: str):
    user_mem = memory.read(username)
    if not user_mem:
        raise HTTPException(404, "User not found")
    cs = user_mem.get("current_streak", 0)
    return {
        "current_streak": cs,
        "streak_type": "hot" if cs >= 3 else "cold",
        "best_ever_streak": user_mem.get("best_streak", 0),
        "last_5_calls": user_mem.get("last_5_calls", []),
        "streak_badge": get_streak_label(cs),
    }


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 9: TOURNAMENT BRACKET
# ══════════════════════════════════════════════════════════════════════════

@app.post("/api/bracket/submit")
def api_bracket_submit(body: BracketSubmitBody):
    bracket_id = f"brk_{uuid.uuid4().hex[:8]}"
    _brackets[body.user_id] = {
        "bracket_id": bracket_id,
        "user_id": body.user_id,
        "bracket": body.bracket,
        "points": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    return {"bracket_id": bracket_id, "submitted": True}


@app.get("/api/bracket/{user_id}")
def api_bracket_get(user_id: str):
    bracket = _brackets.get(user_id)
    if not bracket:
        raise HTTPException(404, "No bracket found for this user")
    return bracket


@app.get("/api/bracket/leaderboard")
def api_bracket_leaderboard():
    entries = []
    for uid, b in _brackets.items():
        user_mem = memory.read(uid)
        entries.append({
            "user_id": uid,
            "display_name": user_mem.get("displayName", uid) if user_mem else uid,
            "points": b.get("points", 0),
        })
    entries.sort(key=lambda x: -x["points"])
    return {"leaderboard": entries}


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 10: PRIVATE GAFFER GROUPS
# ══════════════════════════════════════════════════════════════════════════

@app.post("/api/groups/create")
def api_group_create(body: GroupCreateBody):
    group_id = f"grp_{uuid.uuid4().hex[:8]}"
    invite_code = uuid.uuid4().hex[:8].upper()
    group = {
        "id": group_id,
        "creator_id": body.creator_id,
        "name": body.name,
        "description": body.description,
        "invite_code": invite_code,
        "is_private": body.is_private,
        "member_count": 1,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _groups_store[group_id] = group
    _group_members[group_id] = [body.creator_id]
    _group_posts[group_id] = []
    return {"group_id": group_id, "invite_code": invite_code}


@app.post("/api/groups/join")
def api_group_join(body: GroupJoinBody):
    for gid, grp in _groups_store.items():
        if grp["invite_code"] == body.invite_code:
            if body.user_id in _group_members.get(gid, []):
                raise HTTPException(400, "Already a member of this group")
            _group_members.setdefault(gid, []).append(body.user_id)
            grp["member_count"] = len(_group_members[gid])
            return {"joined": True, "group": grp}
    raise HTTPException(404, "Invalid invite code")


@app.get("/api/groups/{group_id}")
def api_group_get(group_id: str):
    if group_id not in _groups_store:
        raise HTTPException(404, "Group not found")
    grp = _groups_store[group_id]
    members = _group_members.get(group_id, [])
    member_details = []
    for mid in members:
        m = memory.read(mid)
        member_details.append({
            "user_id": mid,
            "display_name": m.get("displayName", mid) if m else mid,
            "stars": m.get("displayStars", 0.5) if m else 0.5,
        })
    return {**grp, "members": member_details}


@app.get("/api/groups/{group_id}/leaderboard")
def api_group_leaderboard(group_id: str):
    if group_id not in _groups_store:
        raise HTTPException(404, "Group not found")
    members = _group_members.get(group_id, [])
    entries = []
    for mid in members:
        m = memory.read(mid)
        if m:
            entries.append({
                "user_id": mid,
                "display_name": m.get("displayName", mid),
                "stars": m.get("displayStars", 0.5),
                "rank": m.get("rank", 0),
            })
    entries.sort(key=lambda x: -x["stars"])
    return {"leaderboard": entries}


@app.post("/api/groups/{group_id}/post")
def api_group_post(group_id: str, body: GroupPostBody):
    if group_id not in _groups_store:
        raise HTTPException(404, "Group not found")
    if body.user_id not in _group_members.get(group_id, []):
        raise HTTPException(403, "Not a member of this group")
    user_mem = memory.read(body.user_id)
    agent_reply = _agent_feed_reply(body.user_id, body.content, "group_post")
    post = {
        "id": f"gpost_{uuid.uuid4().hex[:8]}",
        "group_id": group_id,
        "user_id": body.user_id,
        "display_name": user_mem.get("displayName", body.user_id) if user_mem else body.user_id,
        "content": body.content,
        "agent_reply": agent_reply,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _group_posts[group_id].append(post)
    return {"post": post, "agent_reply": agent_reply}


@app.get("/api/groups/{group_id}/feed")
def api_group_feed(group_id: str):
    if group_id not in _groups_store:
        raise HTTPException(404, "Group not found")
    posts = sorted(_group_posts.get(group_id, []), key=lambda p: p.get("created_at", ""), reverse=True)
    return {"posts": posts}


@app.get("/api/groups/user/{username}/my-groups")
def api_my_groups(username: str):
    groups = []
    for gid, grp in _groups_store.items():
        if username in _group_members.get(gid, []):
            groups.append(grp)
    return {"groups": groups}


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 11: NOTIFICATIONS
# ══════════════════════════════════════════════════════════════════════════

@app.get("/api/notifications/{user_id}")
def api_notifications(user_id: str):
    notifications = _notifications_store.get(user_id, [])
    notifications_sorted = sorted(notifications, key=lambda n: n.get("created_at", ""), reverse=True)
    unread = sum(1 for n in notifications if not n.get("read"))
    return {"unread_count": unread, "notifications": notifications_sorted}


@app.post("/api/notifications/{notification_id}/read")
def api_notification_read(notification_id: str, body: NotificationReadBody):
    notifications = _notifications_store.get(body.user_id, [])
    for n in notifications:
        if n["id"] == notification_id:
            n["read"] = True
            return {"read": True}
    raise HTTPException(404, "Notification not found")


@app.post("/api/notifications/read-all")
def api_notification_read_all(body: NotificationReadBody):
    notifications = _notifications_store.get(body.user_id, [])
    for n in notifications:
        n["read"] = True
    return {"read": True, "count": len(notifications)}


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 12: TERRACES IMPROVEMENTS
# ══════════════════════════════════════════════════════════════════════════

@app.post("/api/terraces/general")
async def api_terraces_general(body: TerraceGeneralBody):
    brave_results = await _brave_search(body.message)
    context = ""
    if brave_results:
        context = f"\n\nSource info: {brave_results[0].get('snippet', '')}"
    user_mem = memory.read(body.user_id)
    if user_mem:
        try:
            agent_msg = generate_agent_reply(user_mem, body.message, "General Terraces")
        except Exception:
            agent_msg = f"Great question! Let me check the latest info on that.{context}"
    else:
        agent_msg = f"Here's what I found about that!{context}"
    return {"reply": agent_msg, "source": "gaffer"}


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 14: RANDOM QUIZ (100 QUESTIONS)
# ══════════════════════════════════════════════════════════════════════════

@app.post("/api/quiz/start-v2")
def api_quiz_start_v2(body: QuizStartRequest):
    session_id = f"qs_{uuid.uuid4().hex[:8]}"
    user_mem = memory.read(body.user_id)
    seen_ids = set(user_mem.get("quiz_seen_questions", [])) if user_mem else set()

    available = [q for q in QUESTION_BANK if q["id"] not in seen_ids]
    if len(available) < body.num_questions:
        available = QUESTION_BANK
        seen_ids = set()

    easy = [q for q in available if q["difficulty"] == "easy"]
    medium = [q for q in available if q["difficulty"] == "medium"]
    hard = [q for q in available if q["difficulty"] == "hard"]

    n = body.num_questions
    n_easy = min(int(n * 0.3), len(easy))
    n_medium = min(int(n * 0.5), len(medium))
    n_hard = min(n - n_easy - n_medium, len(hard))
    remaining = n - n_easy - n_medium - n_hard
    n_medium += min(remaining, len(medium) - n_medium)

    selected = random.sample(easy, n_easy) + random.sample(medium, n_medium) + random.sample(hard, n_hard)
    random.shuffle(selected)
    question_ids = [q["id"] for q in selected]

    for q in selected:
        options_with_indices = list(enumerate(q["options"]))
        random.shuffle(options_with_indices)
        q["shuffled_options"] = [opt for _, opt in options_with_indices]
        q["shuffled_map"] = {i: orig_idx for i, (orig_idx, _) in enumerate(options_with_indices)}

    session = {
        "session_id": session_id,
        "user_id": body.user_id,
        "questions": selected,
        "current_index": 0,
        "score": 0,
        "total": n,
        "question_ids": question_ids,
    }
    _quiz_sessions[session_id] = session
    _quiz_results[body.user_id] = {"total": n, "correct": 0, "score": 0}

    return {
        "session_id": session_id,
        "questions": [{
            "id": f"q{q['id']}",
            "question": q["question"],
            "options": q["shuffled_options"],
        } for q in selected],
    }


@app.post("/api/quiz/answer-v2")
def api_quiz_answer_v2(body: QuizAnswerRequest):
    session_id = None
    session = None
    for sid, s in _quiz_sessions.items():
        if s.get("user_id") == body.user_id:
            session_id = sid
            session = s
            break
    if not session:
        raise HTTPException(404, "No active quiz session. Start a quiz first.")

    q_id = int(body.question_id.replace("q", ""))
    question = next((q for q in session["questions"] if q["id"] == q_id), None)
    if not question:
        raise HTTPException(400, "Invalid question_id")

    try:
        user_idx = ord(body.answer.lower()) - ord("a")
    except (ValueError, TypeError):
        user_idx = -1

    shuffled_map = question.get("shuffled_map", {})
    correct_original = question["correct"]
    correct = user_idx in shuffled_map and shuffled_map[user_idx] == correct_original

    if correct:
        session["score"] += 1
        session["current_index"] += 1
        _quiz_results[body.user_id]["correct"] += 1
    else:
        session["current_index"] += 1

    _quiz_results[body.user_id]["score"] = session["score"]

    if session["current_index"] >= session["total"]:
        user_mem = memory.read(body.user_id)
        if user_mem:
            seen = set(user_mem.get("quiz_seen_questions", []))
            seen.update(session.get("question_ids", []))
            user_mem["quiz_seen_questions"] = list(seen)
            memory.write(body.user_id, user_mem)

    return {
        "correct": correct,
        "correct_answer": chr(ord("a") + list(range(len(question["options"])))[correct_original]) if not shuffled_map else chr(97 + next(i for i, v in shuffled_map.items() if v == correct_original)),
        "score": session["score"],
        "total": session["total"],
        "completed": session["current_index"] >= session["total"],
    }


@app.get("/api/quiz/result-v2/{user_id}")
def api_quiz_result_v2(user_id: str):
    result = _quiz_results.get(user_id)
    if not result:
        raise HTTPException(404, "No quiz result found for this user")
    stars = max(0.5, min(5.0, round((result["correct"] / max(result["total"], 1)) * 5 * 2) / 2))
    return {
        "user_id": user_id,
        "total_questions": result["total"],
        "correct": result["correct"],
        "score": result["score"],
        "stars": stars,
    }


# ── Existing API endpoints (unchanged) ────────────────────────────────────

@app.post("/api/users/register-old")
def api_register_old(body: RegisterRequest):
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


@app.get("/api/users/{username}")
def api_get_user(username: str):
    user = get_user_public(username)
    if not user:
        raise HTTPException(404, "User not found")
    return user


@app.post("/api/quiz/start")
def api_quiz_start(body: QuizStartRequest):
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


@app.post("/api/quiz/answer")
def api_quiz_answer(body: QuizAnswerRequest):
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
    _quiz_sessions[body.user_id]["current_index"] = min(session["current_index"] + 1, session["total"])
    return QuizAnswerResponse(
        correct=correct,
        correct_answer=chr(ord("a") + correct_idx),
        score=session["score"],
    )


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


@app.get("/api/standings/group/{group}")
def api_standings(group: str):
    standings = _compute_group_standings(group.upper())
    return GroupStandingsResponse(group=group.upper(), standings=standings)


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
    user_mem["predictions_count"] = user_mem.get("predictions_count", 0) + 1
    memory.write(body.user_id, user_mem)
    if body.user_id not in _predictions_store:
        _predictions_store[body.user_id] = []
    _predictions_store[body.user_id].append(prediction)
    return PredictionSubmitResponse(prediction_id=pred_id, status="PENDING")


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
                user_mem["correct_predictions"] = user_mem.get("correct_predictions", 0) + 1
                user_mem["current_streak"] = user_mem.get("current_streak", 0) + 1
                bs = user_mem.get("best_streak", 0)
                cs = user_mem["current_streak"]
                if cs > bs:
                    user_mem["best_streak"] = cs
                last5 = user_mem.get("last_5_calls", [])
                last5.append({"market": body.match_id, "pick": pred.get("predicted_winner", ""), "result": "HIT ✅"})
                user_mem["last_5_calls"] = last5[-5:]
            else:
                user_mem["current_streak"] = 0
                last5 = user_mem.get("last_5_calls", [])
                last5.append({"market": body.match_id, "pick": pred.get("predicted_winner", ""), "result": "MISS ❌"})
                user_mem["last_5_calls"] = last5[-5:]
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
            check_and_award_badges(uid)
    return {"resolved": True, "match_id": body.match_id, "predictions_updated": updated}


@app.get("/api/predictions/leaderboard")
def api_predictions_leaderboard():
    top, bottom = get_leaderboard_data()
    return {"top": top, "bottom": bottom}


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


@app.get("/api/comments/{user_id}")
def api_get_user_comments(user_id: str):
    comments = _user_comments_store.get(user_id, [])
    comments_sorted = sorted(comments, key=lambda c: c.get("created_at", ""), reverse=True)
    return UserCommentsResponse(comments=comments_sorted)


@app.get("/api/profile-old/{user_id}")
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


@app.get("/api/lineups/{match_id}")
def api_lineup(match_id: str):
    lineup = _lineups_store.get(match_id)
    if not lineup:
        raise HTTPException(404, "Lineup not found for this match")
    return LineupResponse(**lineup)


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


# ── Run ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
