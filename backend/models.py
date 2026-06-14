from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Enums ──────────────────────────────────────────────────────────────────

EXPERTISE_OPTIONS = ["expert", "beginner"]
MARKET_CATEGORIES = ["GROUP_WINNER", "KNOCKOUT_WINNER", "FINAL_CHAMPION"]
MARKET_STATUS = ["OPEN", "CLOSED", "RESOLVED"]
PREDICTION_RESULT = ["PENDING", "HIT", "MISS"]


# ── User ───────────────────────────────────────────────────────────────────

class UserPublic(BaseModel):
    id: str
    displayName: str
    expertise: str
    displayStars: float = Field(ge=0.5, le=5.0)
    rank: int = Field(ge=1)
    createdAt: str


# ── Market ─────────────────────────────────────────────────────────────────

class MarketOption(BaseModel):
    id: str
    label: str
    flag: str


class Market(BaseModel):
    id: str
    category: str
    title: str
    options: List[MarketOption]
    closesAt: str
    status: str = "OPEN"
    resultOptionId: Optional[str] = None


class MarketsResponse(BaseModel):
    markets: List[Market]


# ── Prediction ─────────────────────────────────────────────────────────────

class Prediction(BaseModel):
    userId: str
    marketId: str
    optionId: str
    reasoning: Optional[str] = None
    createdAt: str
    result: str = "PENDING"


# ── Comment ────────────────────────────────────────────────────────────────

class Comment(BaseModel):
    id: str
    marketId: str
    userId: str
    displayName: str
    displayStars: float
    text: str
    createdAt: str


class CommentsResponse(BaseModel):
    comments: List[Comment]


# ── Leaderboard ────────────────────────────────────────────────────────────

class LeaderboardEntry(BaseModel):
    displayName: str
    displayStars: float
    rank: int


class LeaderboardResponse(BaseModel):
    top: List[LeaderboardEntry]
    bottom: List[LeaderboardEntry]


# ── Signup / Quiz ──────────────────────────────────────────────────────────

class QuizRequest(BaseModel):
    userId: str
    expertise: str
    answers: List[str]


class QuizResponse(BaseModel):
    quizScore: int
    displayStars: float


# ── Agent / Predict ────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    userId: str
    marketId: str
    optionId: str
    reasoning: Optional[str] = None


class PredictResponseUser(BaseModel):
    displayStars: float
    rank: int


class PredictResponse(BaseModel):
    agentReply: str
    recalledMemory: List[str]
    user: PredictResponseUser


# ── Agent / Chat ───────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    userId: str
    message: str
    marketId: Optional[str] = None


class ChatResponse(BaseModel):
    agentReply: str
    recalledMemory: List[str]


# ── Comment POST ──────────────────────────────────────────────────────────

class CommentPostRequest(BaseModel):
    userId: str
    text: str


# ── Walrus Memory internal structure ──────────────────────────────────────

class WalrusMemoryData(BaseModel):
    userId: str
    displayName: Optional[str] = None
    expertise: Optional[str] = "beginner"
    quizBaseline: Optional[float] = 0.0
    liveAccuracy: Optional[float] = 0.0
    n: Optional[int] = 0
    hitCount: Optional[int] = 0
    resolvedCount: Optional[int] = 0
    quizScore: Optional[int] = 0
    quizAnswers: Optional[List[str]] = None
    predictions: Optional[List[dict]] = None
    chatHistory: Optional[List[dict]] = None
    commentIds: Optional[List[str]] = None
    createdAt: Optional[str] = None


# ── Market resolution ─────────────────────────────────────────────────────

class MarketResolveRequest(BaseModel):
    resultOptionId: str


class AdminResolveRequest(BaseModel):
    results: Dict[str, str]


# ── Register ──────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: str


# ── Quiz Start / Answer / Result ──────────────────────────────────────────

class QuizStartRequest(BaseModel):
    user_id: str
    difficulty: str
    category: str
    num_questions: int


class QuizStartResponse(BaseModel):
    session_id: str
    questions: list


class QuizAnswerRequest(BaseModel):
    user_id: str
    question_id: str
    answer: str


class QuizAnswerResponse(BaseModel):
    correct: bool
    correct_answer: str
    score: int


class QuizResultResponse(BaseModel):
    user_id: str
    total_questions: int
    correct: int
    score: int
    stars: float


# ── Standings ─────────────────────────────────────────────────────────────

class GroupStandingEntry(BaseModel):
    team: str
    played: int
    won: int
    drawn: int
    lost: int
    goals_for: int
    goals_against: int
    goal_diff: int
    points: int


class GroupStandingsResponse(BaseModel):
    group: str
    standings: list


# ── Match Update ──────────────────────────────────────────────────────────

class MatchUpdateRequest(BaseModel):
    match_id: str
    home_team: str
    away_team: str
    home_goals: int
    away_goals: int
    minute: int
    status: str


class MatchUpdateResponse(BaseModel):
    match_id: str
    status: str
    result: str


# ── Prediction Submit / Resolve ───────────────────────────────────────────

class PredictionSubmitRequest(BaseModel):
    user_id: str
    match_id: str
    home_team: str
    away_team: str
    predicted_winner: str
    predicted_score: str
    first_scorer: str


class PredictionSubmitResponse(BaseModel):
    prediction_id: str
    status: str


class PredictionResolveRequest(BaseModel):
    match_id: str
    actual_score: str
    actual_winner: str
    actual_first_scorer: str


# ── Comments ──────────────────────────────────────────────────────────────

class CommentPostBody(BaseModel):
    user_id: str
    comment: str
    context: str


class CommentResponse(BaseModel):
    id: str
    user_id: str
    comment: str
    context: str
    created_at: str


class UserCommentsResponse(BaseModel):
    comments: list


# ── Fan Profile ───────────────────────────────────────────────────────────

class FanProfileResponse(BaseModel):
    id: str
    displayName: str
    expertise: str
    displayStars: float
    rank: int
    predictions_count: int
    comments_count: int
    created_at: str


# ── Lineup ────────────────────────────────────────────────────────────────

class PlayerInfo(BaseModel):
    name: str
    position: str
    number: int


class LineupResponse(BaseModel):
    match_id: str
    home_team: str
    away_team: str
    home_lineup: list
    away_lineup: list


# ── Card Event ────────────────────────────────────────────────────────────

class CardEventRequest(BaseModel):
    match_id: str
    player: str
    team: str
    card_type: str
    minute: int


class CardEventResponse(BaseModel):
    match_id: str
    card_type: str
    player: str
    team: str
    minute: int
