# WorldMind 2026 -- Backend

![Python](https://img.shields.io/badge/Python-3.14-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT_4o_Mini-412991)
![Walrus](https://img.shields.io/badge/Walrus-Mainnet-FF6B35)

---

## Overview

The WorldMind 2026 backend is a FastAPI application that powers the Gaffer prediction platform for the FIFA World Cup 2026. It provides REST endpoints for the signup quiz, prediction markets, AI agent interactions, comments, and leaderboard. User memory is persisted on Walrus Mainnet (with a local JSON fallback for development).

---

## Architecture

```
Client (Frontend)
    |
    v
FastAPI (backend/main.py)
    |
    +-- /signup/quiz  --> quiz.py (scoring) + tools.py (user creation) --> WalrusMemory
    +-- /markets      --> markets.py (static market definitions)
    +-- /agent/predict --> agent.py (GPT-4o-mini) + stars.py (rating) + tools.py (storage)
    +-- /agent/chat   --> agent.py (GPT-4o-mini) + tools.py (history)
    +-- /comments     --> in-memory store + tools.py (walrus update)
    +-- /leaderboard  --> stars.py (ranking) + tools.py (data aggregation)
    +-- /user/{id}    --> tools.py (public profile lookup)
    +-- /admin/resolve --> tools.py (result resolution + rank recomputation)
```

All user data flows through `WalrusMemory` (`memory.py`), which routes to either a local JSON file (dev mode) or the Walrus Mainnet HTTP API (production mode).

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | -- | OpenAI API key for GPT-4o-mini agent |
| `WALRUS_ENDPOINT` | No | -- | Walrus HTTP endpoint (production mode) |
| `WALRUS_API_KEY` | No | -- | Walrus API key (production mode) |

If `WALRUS_ENDPOINT` or `WALRUS_API_KEY` is empty, the backend runs in **dev mode** using `../data/gaffer_memory.json` as the memory store.

---

## API Contract

The full API contract between frontend and backend is defined in `GAFFER_API_CONTRACT.md` at the project root. Key principles:

- The frontend never computes stars, ranks, or results
- The backend owns all intelligence (memory, accuracy, blending)
- The frontend sends user actions and renders whatever the backend returns

---

## Star Rating Formula

The star rating blends a user's quiz baseline with their live prediction accuracy, weighted by the number of resolved predictions.

### Stored values per user

- `quizBaseline` = `quizScore / 20` (range: 0-5)
- `liveAccuracy` = HIT predictions / RESOLVED predictions (range: 0-1)
- `n` = number of resolved predictions so far

### Display star calculation

```
w = min(n / 10, 1)
liveStars = liveAccuracy * 5
displayStars = round(((1 - w) * quizBaseline + w * liveStars) * 2) / 2
```

The result is clamped to the range 0.5-5.0.

### Weight progression

| n (resolved predictions) | w (live weight) | Description |
|--------------------------|-----------------|-------------|
| 0 | 0.0 | Stars = quiz baseline only |
| 5 | 0.5 | Equal blend of quiz and live |
| 10+ | 1.0 | Stars = live accuracy only |

### Label mapping

| displayStars | Label |
|--------------|-------|
| 0.5 - 1.5 | Newcomer |
| 2.0 - 2.5 | Regular |
| 3.0 - 3.5 | Analyst |
| 4.0 - 4.5 | Expert |
| 5.0 | Oracle |

### Rank calculation

Users are sorted by `displayStars` descending, with ties broken by `n` (higher first), then `liveAccuracy` (higher first).

---

## Walrus Memory Schema

Each user is stored in Walrus Memory under their `userId` key with the following schema:

```json
{
  "userId": "u_123",
  "displayName": "ireoluwa",
  "expertise": "expert",
  "quizBaseline": 4.0,
  "liveAccuracy": 0.75,
  "n": 8,
  "hitCount": 6,
  "resolvedCount": 8,
  "quizScore": 80,
  "quizAnswers": ["a", "c", "b", "d", "a"],
  "displayStars": 4.0,
  "rank": 248,
  "predictions": [
    {
      "userId": "u_123",
      "marketId": "m_grpA",
      "optionId": "o_a_mexico",
      "optionLabel": "Mexico",
      "reasoning": "Home advantage",
      "createdAt": "2026-06-12T09:00:00Z",
      "result": "PENDING"
    }
  ],
  "chatHistory": [
    {
      "role": "user",
      "content": "Who should I pick for Group A?",
      "timestamp": "2026-06-12T09:00:00Z"
    },
    {
      "role": "agent",
      "content": "Mexico has a strong squad...",
      "timestamp": "2026-06-12T09:00:01Z"
    }
  ],
  "commentIds": ["c_a1b2c3d4_1718000000000"],
  "createdAt": "2026-06-11T10:00:00Z",
  "lastUpdated": "2026-06-12T09:00:01Z"
}
```

---

## Endpoints

### `POST /signup/quiz`

Score the signup quiz and create the user's baseline rating.

**Request:**
```json
{
  "userId": "u_123",
  "expertise": "expert",
  "answers": ["a", "c", "b", "d", "a", "c", "b", "a", "d", "b"]
}
```

**Response:**
```json
{
  "quizScore": 85,
  "displayStars": 4.0
}
```

**Status codes:** `400` if userId is missing, expertise is invalid, or fewer than 5 answers provided.

---

### `GET /markets`

List all prediction markets (12 group winners, 3 knockout, 2 final markets).

**Response:**
```json
{
  "markets": [
    {
      "id": "m_grpA",
      "category": "GROUP_WINNER",
      "title": "Group A Winner",
      "options": [
        { "id": "o_a_mexico", "label": "Mexico", "flag": "mx" },
        { "id": "o_a_south_korea", "label": "South Korea", "flag": "kr" },
        { "id": "o_a_south_africa", "label": "South Africa", "flag": "za" },
        { "id": "o_a_czechia", "label": "Czechia", "flag": "cz" }
      ],
      "closesAt": "2026-06-20T16:00:00Z",
      "status": "OPEN",
      "resultOptionId": null
    }
  ]
}
```

---

### `GET /markets/{market_id}`

Get a single market by its ID (e.g. `m_grpA`, `m_champion`).

**Response:** Single Market object (same shape as `GET /markets` array item).

**Status codes:** `404` if market not found.

---

### `POST /agent/predict`

Submit a prediction pick. The agent stores the prediction in Walrus Memory, recalls relevant history, generates a contextual reply, and returns updated user stats.

**Request:**
```json
{
  "userId": "u_123",
  "marketId": "m_grpA",
  "optionId": "o_a_mexico",
  "reasoning": "Mexico at home, they top this group."
}
```

**Response:**
```json
{
  "agentReply": "Bold -- Mexico are strong at home but South Korea looked sharp in qualifiers. What makes you so confident?",
  "recalledMemory": [
    "Picked Mexico as Group A winner",
    "Asked: 'Who should I pick for Group A?'"
  ],
  "user": {
    "displayStars": 4.5,
    "rank": 248
  }
}
```

**Status codes:** `400` if userId missing. `404` if user or market not found.

**Notes:**
- If the market is `CLOSED` or `RESOLVED`, the request is rejected with a message
- Duplicate predictions for the same market are detected and return a warning
- Experts receive challenging responses; beginners receive coaching responses

---

### `POST /agent/chat`

Free-form chat with the AI agent. Uses the user's memory and prediction history for context.

**Request:**
```json
{
  "userId": "u_123",
  "message": "Who should I pick for Group B?",
  "marketId": "m_grpB"
}
```

**Response:**
```json
{
  "agentReply": "Canada have a strong squad and home advantage in Group B. Switzerland are always solid in tournaments. Canada is the safer pick.",
  "recalledMemory": [
    "Picked Mexico as Group A winner"
  ]
}
```

**Notes:**
- `marketId` is optional and used to scope recalled memory
- If user has not completed the signup quiz, the agent directs them to `/signup/quiz`

---

### `GET /markets/{market_id}/comments`

Get all comments for a market, sorted by most recent first.

**Response:**
```json
{
  "comments": [
    {
      "id": "c_a1b2c3d4_1718000000000",
      "marketId": "m_grpA",
      "userId": "u_123",
      "displayName": "123",
      "displayStars": 4.5,
      "text": "Locking in Mexico!",
      "createdAt": "2026-06-12T09:01:00Z"
    }
  ]
}
```

**Status codes:** `404` if market not found.

---

### `POST /markets/{market_id}/comments`

Post a comment on a market.

**Request:**
```json
{
  "userId": "u_123",
  "text": "Locking in Mexico!"
}
```

**Response:** Single Comment object (same shape as `GET /markets/{id}/comments` array item).

**Status codes:** `404` if market or user not found.

---

### `GET /leaderboard`

Get the top 10 and bottom 5 users ranked by `displayStars`.

**Response:**
```json
{
  "top": [
    { "displayName": "ada", "displayStars": 5.0, "rank": 1 },
    { "displayName": "chidi", "displayStars": 4.5, "rank": 2 }
  ],
  "bottom": [
    { "displayName": "tomi", "displayStars": 1.0, "rank": 5012 }
  ]
}
```

---

### `GET /user/{user_id}`

Get a user's public profile.

**Response:**
```json
{
  "id": "u_123",
  "displayName": "123",
  "expertise": "expert",
  "displayStars": 4.5,
  "rank": 248,
  "createdAt": "2026-06-11T10:00:00Z"
}
```

**Status codes:** `404` if user not found.

---

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "agent": "WorldMind 2026",
  "version": "1.0.0"
}
```

---

### `POST /admin/resolve/{market_id}`

(Internal/development) Resolve a market with a winning option. Updates all user predictions (HIT/MISS), recomputes star ratings and ranks.

**Request:**
```json
{
  "resultOptionId": "o_a_mexico"
}
```

**Response:**
```json
{
  "resolved": true,
  "users_updated": 42
}
```

**Status codes:** `404` if market not found. `400` if market already resolved.

---

## Running the Server

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables (or create .env)
# OPENAI_API_KEY=sk-...
# WALRUS_ENDPOINT=https://...
# WALRUS_API_KEY=...

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API documentation is available at `http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc` (ReDoc).

---

## Running Tests

Currently, the backend tests live in the `agent/tests/` directory and cover shared logic (stars, memory, tools). To run the full test suite:

```bash
# From the agent directory
cd ../agent
pytest tests/ -v

# With coverage
pytest tests/ --cov=. --cov-report=term
```

The test suite includes 60+ tests across three test files:
- `test_stars.py` -- 20+ star formula edge cases
- `test_memory.py` -- 10+ memory roundtrip tests
- `test_tools.py` -- 30+ tool + scraper + smoke tests

Six agent smoke tests require `OPENAI_API_KEY` and skip gracefully if not set. All other tests run with zero external dependencies.
