# WorldMind 2026

```
__        __                _ __  __ _           _   _
\ \      / /___  _ __ ___  |  \/  (_)_ __   ___| |_(_)_   _____
 \ \ /\ / / _ \| '__/ _ \ | |\/| | | '_ \ / __| __| \ \ / / _ \
  \ V  V / (_) | | |  __/ | |  | | | | | | (__| |_| |\ V /  __/
   \_/\_/ \___/|_|  \___| |_|  |_|_|_| |_|\___|\__|_| \_/ \___|

                     WORLD CUP 2026 PREDICTION ENGINE
```

![Python](https://img.shields.io/badge/Python-3.14-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT_4o_Mini-412991)
![Walrus](https://img.shields.io/badge/Walrus-Mainnet-FF6B35)
![License](https://img.shields.io/badge/License-MIT-green)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen)

---

## Overview

WorldMind 2026 is an AI-powered football prediction platform for the FIFA World Cup 2026. It combines a GPT-4o-powered agent with on-chain Walrus memory to deliver personalized prediction assistance, star ratings, and chat-based fan engagement. Users complete a signup quiz to establish a baseline rating, then make predictions across 12 group-stage markets, knockout rounds, and the final champion market. Every interaction is stored on Walrus Mainnet, creating an evolving memory of each fan's journey.

---

## Features

- **AI Agent** -- GPT-4o-mini conversational agent that challenges experts and coaches beginners
- **Star Rating System** -- Blends quiz baseline with live prediction accuracy (0.5-5.0 range)
- **Live Leaderboard** -- Real-time ranked leaderboard with top and bottom performers
- **Prediction Markets** -- 12 group winners, 3 knockout, and 2 final markets
- **Walrus Memory** -- Persistent on-chain memory per user on Walrus Mainnet
- **Quiz Onboarding** -- 20-question World Cup knowledge quiz establishes baseline rating
- **Comments System** -- Per-market comments with star badge display
- **Multi-language Support** -- Agent responds in any language the user writes in
- **Live Accuracy Tracking** -- Rating evolves as markets resolve (HIT/MISS)

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend Framework | FastAPI 0.115 (Python 3.14) |
| AI Engine | OpenAI GPT-4o-mini |
| On-chain Memory | Walrus Mainnet (HTTP API) |
| Data Validation | Pydantic 2.9 |
| HTTP Client | httpx 0.27 |
| Environment | python-dotenv |
| Server | Uvicorn 0.30 |
| Testing | pytest + pytest-cov |
| Agent (standalone) | OpenAI SDK + requests |

---

## Project Structure

```
world-cup/
├── .env                          # API keys (OPENAI, BRAVE)
├── GAFFER_API_CONTRACT.md        # API contract between frontend & backend
├── agent/
│   ├── agent.py                  # Main agent loop + CLI
│   ├── memory.py                 # WalrusMemory (dev JSON / prod HTTP)
│   ├── prompt.py                 # System prompt for GPT-4o
│   ├── stars.py                  # Star calculation module (7 functions)
│   ├── tools.py                  # 12 tool definitions + executor
│   ├── data/
│   │   ├── scraper.py            # FootballScraper (ESPN, football-data)
│   │   └── dev_memory.json       # Dev-mode local store
│   ├── tests/
│   │   ├── test_stars.py         # Star formula tests (20+)
│   │   ├── test_memory.py        # Memory roundtrip tests (10+)
│   │   ├── test_tools.py         # Tool + scraper tests (30+)
│   │   └── conftest.py           # Shared fixtures
│   ├── .env.example
│   └── requirements.txt
├── backend/
│   ├── main.py                   # FastAPI app entrypoint
│   ├── models.py                 # Pydantic request/response models
│   ├── markets.py                # Market definitions (12 groups + KO + final)
│   ├── memory.py                 # WalrusMemory backend integration
│   ├── stars.py                  # Star + rank computation
│   ├── quiz.py                   # 20-question World Cup quiz
│   ├── agent.py                  # Agent reply generation
│   ├── tools.py                  # Business logic helpers
│   ├── .env                      # Backend env template
│   └── requirements.txt
├── data/
│   └── gaffer_memory.json        # Dev-mode memory store
└── venv/                         # Python virtual environment
```

---

## Getting Started

### Prerequisites

- Python 3.14+
- OpenAI API key
- (Optional) Walrus endpoint + API key for production memory

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd world-cup

# Backend setup
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

# Copy and configure environment
cp .env .env.local
# Edit .env.local with your API keys

# Start the server
uvicorn main:app --reload --port 8000

# Agent setup (separate terminal)
cd agent
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your OPENAI_API_KEY
python agent.py
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4o-mini |
| `BRAVE_API_KEY` | No | Brave Search API key (agent scraper) |
| `WALRUS_ENDPOINT` | No | Walrus HTTP endpoint (production) |
| `WALRUS_API_KEY` | No | Walrus API key (production) |
| `FOOTBALL_DATA_API_KEY` | No | football-data.org API key (scraper) |

Without `WALRUS_ENDPOINT`/`WALRUS_API_KEY`, the backend runs in dev mode using a local JSON file (`data/gaffer_memory.json`).

---

## API Endpoints

### `POST /signup/quiz`

Score the signup quiz and create the user's baseline.

**Request:**
```json
{
  "userId": "u_123",
  "expertise": "expert",
  "answers": ["a", "c", "b", "d", "a", "c", "b", "a", "d", "b", "a", "c", "b", "d", "c", "a", "b", "d", "c", "a"]
}
```

**Response:**
```json
{
  "quizScore": 85,
  "displayStars": 4.0
}
```

### `GET /markets`

List all prediction markets.

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

### `GET /markets/{market_id}`

Get a single market by ID.

**Response:** Single Market object (same shape as above).

### `POST /agent/predict`

Submit a prediction. The agent responds with contextual feedback.

**Request:**
```json
{
  "userId": "u_123",
  "marketId": "m_grpA",
  "optionId": "o_a_mexico",
  "reasoning": "Home advantage for Mexico in Group A"
}
```

**Response:**
```json
{
  "agentReply": "Bold — but you also backed Mexico last week. Doubling down?",
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

### `POST /agent/chat`

Free-form chat with the AI agent.

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
  "agentReply": "Canada has a strong squad and home advantage in Group B. Switzerland are always solid in tournaments. Canada is the safer pick.",
  "recalledMemory": [
    "Picked Mexico as Group A winner"
  ]
}
```

### `GET /markets/{market_id}/comments`

Get comments for a market.

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

### `POST /markets/{market_id}/comments`

Post a comment on a market.

**Request:**
```json
{
  "userId": "u_123",
  "text": "Locking in Mexico!"
}
```

**Response:** Single Comment object (same shape as above).

### `GET /leaderboard`

Get top 10 and bottom 5 users by displayStars.

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

### `GET /user/{user_id}`

Get user public profile.

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

### `GET /health`

Health check.

**Response:**
```json
{
  "status": "ok",
  "agent": "WorldMind 2026",
  "version": "1.0.0"
}
```

---

## Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# Agent tests (full suite, 60+ tests)
cd agent
pytest tests/ -v

# With coverage
pytest tests/ --cov=. --cov-report=term
```

The agent suite includes 6 smoke tests that require `OPENAI_API_KEY` and skip gracefully if not set. All other tests (stars, memory, tools, scraper) run with zero external dependencies.

---

## Deployment

The backend is a standard FastAPI application deployable on any Python-compatible platform (Railway, Render, Fly.io, or a VPS).

```bash
# Build
pip install -r backend/requirements.txt

# Run with uvicorn
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000

# Docker (optional)
# docker build -t worldmind-backend .
# docker run -p 8000:8000 worldmind-backend
```

Set `WALRUS_ENDPOINT` and `WALRUS_API_KEY` environment variables in production to enable on-chain Walrus Mainnet memory.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
