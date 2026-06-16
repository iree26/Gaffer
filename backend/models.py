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


# ══════════════════════════════════════════════════════════════════════════
# NEW MODELS FOR FEATURES 1-14
# ══════════════════════════════════════════════════════════════════════════

# ── Feature 1: Auth ──────────────────────────────────────────────────────

class RegisterBody(BaseModel):
    username: str
    expertise: str = "beginner"


class LoginBody(BaseModel):
    username: str


class AuthResponse(BaseModel):
    user_id: str
    username: str
    token: str
    badges: List[str] = []


class ExistsResponse(BaseModel):
    exists: bool


# ── Feature 2: Profiles ──────────────────────────────────────────────────

class FollowBody(BaseModel):
    follower_id: str


class FollowResponse(BaseModel):
    following: bool
    followers_count: int


class AllegianceBody(BaseModel):
    country: str
    flag_emoji: str


class AllegianceResponse(BaseModel):
    country: str
    flag_emoji: str


class FullProfileResponse(BaseModel):
    username: str
    display_name: str = ""
    stars: float = 0.5
    rank: int = 0
    expertise: str = "beginner"
    quiz_score: int = 0
    country_allegiance: Optional[str] = None
    flag_emoji: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
    predictions_count: int = 0
    correct_predictions: int = 0
    accuracy: str = "0%"
    current_streak: int = 0
    best_streak: int = 0
    last_5_calls: List[dict] = []
    posts_count: int = 0
    joined: str = ""
    badges: List[str] = []
    recent_posts: List[dict] = []
    recent_predictions: List[dict] = []
    hot_takes_count: int = 0
    challenges_won: int = 0
    challenges_lost: int = 0


# ── Feature 3: Feed ──────────────────────────────────────────────────────

class FeedPostBody(BaseModel):
    user_id: str
    content: str
    type: str = "take"


class FeedPostResponse(BaseModel):
    post: dict
    agent_reply: str


class FeedLikeBody(BaseModel):
    user_id: str


class FeedLikeResponse(BaseModel):
    liked: bool
    total_likes: int


class FeedRepostBody(BaseModel):
    user_id: str
    comment: str = ""


class FeedRepostResponse(BaseModel):
    reposted: bool
    total_reposts: int


class FeedCommentBody(BaseModel):
    user_id: str
    content: str


class FeedCommentResponse(BaseModel):
    comment: dict
    agent_reply: str


# ── Feature 4: Hot Takes ─────────────────────────────────────────────────

class HotTakePostBody(BaseModel):
    user_id: str
    take: str


class HotTakePostResponse(BaseModel):
    hot_take: dict
    agent_verdict: str


class HotTakeVoteBody(BaseModel):
    user_id: str
    vote: str


class HotTakeVoteResponse(BaseModel):
    fire_count: int
    ice_count: int
    your_vote: str


# ── Feature 5: Challenges ────────────────────────────────────────────────

class ChallengeCreateBody(BaseModel):
    challenger_id: str
    opponent_username: str
    market_id: str
    challenger_pick: str
    stars_at_stake: int = 1


class ChallengeCreateResponse(BaseModel):
    challenge_id: str
    status: str = "pending"


class ChallengeAcceptBody(BaseModel):
    user_id: str
    their_pick: str


class ChallengeDeclineBody(BaseModel):
    user_id: str


# ── Feature 7: Gaffer Predictions ────────────────────────────────────────

class GafferPredictBody(BaseModel):
    home_team: str
    away_team: str
    match_id: str


class GafferPredictResponse(BaseModel):
    prediction: str
    confidence: int
    reasoning: str
    posted_to_feed: bool = True


# ── Feature 9: Bracket ───────────────────────────────────────────────────

class BracketSubmitBody(BaseModel):
    user_id: str
    bracket: dict


class BracketSubmitResponse(BaseModel):
    bracket_id: str
    submitted: bool = True


# ── Feature 10: Groups ───────────────────────────────────────────────────

class GroupCreateBody(BaseModel):
    creator_id: str
    name: str
    description: str = ""
    is_private: bool = False


class GroupCreateResponse(BaseModel):
    group_id: str
    invite_code: str


class GroupJoinBody(BaseModel):
    user_id: str
    invite_code: str


class GroupPostBody(BaseModel):
    user_id: str
    content: str


# ── Feature 11: Notifications ────────────────────────────────────────────

class NotificationReadBody(BaseModel):
    user_id: str


# ── Feature 12: Terraces ─────────────────────────────────────────────────

class TerraceGeneralBody(BaseModel):
    user_id: str
    message: str


class TerraceGeneralResponse(BaseModel):
    reply: str
    source: str = "gaffer"


# ── Feature 14: Quiz Refresh ─────────────────────────────────────────────

class QuizRefreshResponse(BaseModel):
    session_id: str
    questions: list
