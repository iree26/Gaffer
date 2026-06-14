# WorldCup United — AI Agent

An intelligent multilingual AI football companion for the FIFA World Cup 2026, powered by **GPT-4o** and **Walrus on-chain persistent memory**. Built for the hackathon submission.

The agent converses with fans in any language, manages an evolving star-rating system (0.5–5.0), runs a World Cup quiz, logs predictions, creates polls, posts comments with star badges, and persists every interaction on-chain via Walrus.

---

## Folder Structure

```
agent/
├── __init__.py          # Package init
├── agent.py             # Main conversation loop + CLI
├── memory.py            # WalrusMemory (dev JSON / prod HTTP)
├── prompt.py            # Self-contained system prompt
├── stars.py             # Pure star calculation module
├── tools.py             # 12 tool definitions + execution
├── data/
│   ├── __init__.py
│   ├── dev_memory.json  # Local JSON store (dev mode)
│   └── scraper.py       # FootballScraper (ESPN → football-data → mock)
├── tests/
│   ├── __init__.py
│   ├── test_stars.py    # 20+ star formula tests
│   ├── test_memory.py   # 10+ memory roundtrip tests
│   └── test_tools.py    # 30+ tool + scraper + smoke tests
├── .env.example
├── requirements.txt
└── README.md
```

---

## Setup

```bash
cd agent

# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY (required for agent conversation)

# 3. Run all non-API tests
pytest tests/ -v

# 4. Run the interactive agent
python agent.py
```

---

## Star Rating Formula

Stars blend quiz knowledge with live prediction accuracy:

| Predictions | weight_quiz | weight_live | Effect |
|-------------|-------------|-------------|--------|
| 0           | 100%        | 0%          | Stars = quiz_score / 20 |
| 5           | 75%         | 25%         | Quiz dominates |
| 10          | 50%         | 50%         | Equal weight |
| 20+         | 0%          | 100%        | Stars = live accuracy |

Formula: `blended = (quiz_score × weight_quiz) + (live_accuracy × weight_live)`, then snapped to nearest 0.5 and clamped 0.5–5.0.

Labels: 0.5–1.5 Newcomer | 2.0–2.5 Regular | 3.0–3.5 Analyst | 4.0–4.5 Expert | 5.0 Oracle

---

## Memory Loop

```
User message → READ Walrus Memory → GPT-4o + Tools → WRITE Walrus Memory → Stars update
```

Memory is read before every response and written after every meaningful interaction. This is the core of the hackathon submission — every fan's journey is stored forever on-chain.

---

## 2-Hour Sprint Plan

| Time | Task |
|------|------|
| 0:00–0:15 | Project scaffold — directories, requirements, .env |
| 0:15–0:30 | `stars.py` — pure calculation module with all 7 functions |
| 0:30–0:45 | `memory.py` — WalrusMemory with dev/prod auto-detection |
| 0:45–1:00 | `data/scraper.py` — FootballScraper with ESPN → football-data → mock fallback |
| 1:00–1:15 | `tools.py` — 12 tool definitions + `execute_tool` dispatcher |
| 1:15–1:30 | `agent.py` — main loop with GPT-4o, tool loop, memory update, CLI |
| 1:30–1:45 | `prompt.py` — self-contained system prompt with quiz, stars, memory protocol |
| 1:45–2:00 | Tests + verification — 60+ tests across 3 test files |

---

## Tests

```bash
# Run all tests (API-dependent smoke tests skip automatically)
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=. --cov-report=term
```

6 agent smoke tests in `test_tools.py` require `OPENAI_API_KEY` and skip gracefully if not set. All other tests (stars, memory, tools, scraper) run with zero external dependencies.

---

## Dev Mode

With `OPENAI_API_KEY` set, the agent can converse. Memory defaults to a local JSON file (`data/dev_memory.json`). Set `WALRUS_ENDPOINT` and `WALRUS_API_KEY` in `.env` to switch to production on-chain mode (HTTP calls to Walrus).

Scraper defaults to mock data. Set `FOOTBALL_DATA_API_KEY` for real fixture data from football-data.org.
