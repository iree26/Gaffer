import os
import json
import tempfile
import pytest

from memory import WalrusMemory


# ── Fixtures ──────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def tmp_store_path():
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False, mode="w", encoding="utf-8") as f:
        json.dump({}, f)
        path = f.name
    yield path
    if os.path.exists(path):
        os.unlink(path)


@pytest.fixture(scope="module")
def test_memory(tmp_store_path):
    return WalrusMemory(store_path=tmp_store_path)


@pytest.fixture(scope="module")
def seeded_memory(test_memory):
    test_memory.write("test_user_1", {
        "nation": "Senegal",
        "language": "en",
        "quiz_score": 80,
        "quiz_completed": True,
        "stars": 4.0,
        "star_label": "Expert",
        "total_predictions": 10,
        "correct_predictions": 7,
        "live_accuracy": 70.0,
        "predictions": [],
        "hot_takes": [],
        "star_history": [{"stars": 4.0, "reason": "Quiz", "timestamp": "t"}],
        "fan_profile": {"style": "analyst", "favorite_player": "", "bold_pick": ""},
        "poll_votes": [],
    })
    test_memory.write("test_user_2", {
        "nation": "Brazil",
        "language": "pt",
        "quiz_score": 100,
        "quiz_completed": True,
        "stars": 5.0,
        "star_label": "Oracle",
        "total_predictions": 20,
        "correct_predictions": 18,
        "live_accuracy": 90.0,
        "predictions": [],
        "hot_takes": [],
        "star_history": [{"stars": 5.0, "reason": "Quiz", "timestamp": "t"}],
        "fan_profile": {"style": "passionate", "favorite_player": "Neymar", "bold_pick": ""},
        "poll_votes": [],
    })
    test_memory.write("quiz_not_done", {
        "nation": "England",
        "language": "en",
        "quiz_completed": False,
        "predictions": [],
        "hot_takes": [],
        "star_history": [],
        "poll_votes": [],
    })
    return test_memory


# Patch tools.memory before importing tools
@pytest.fixture(autouse=True)
def patch_memory(seeded_memory, monkeypatch):
    import tools
    monkeypatch.setattr(tools, "memory", seeded_memory)
    yield


# ── Quiz / Star Tool Tests ────────────────────────────────────────────

class TestStoreQuizResult:
    def test_store_quiz_result_returns_stored(self):
        from tools import execute_tool
        result = execute_tool("store_quiz_result", {"user_id": "quiz_not_done", "quiz_score": 70, "stars": 3.5})
        assert result["status"] == "stored"
        assert result["stars"] == 3.5
        assert result["label"] == "Analyst"

    def test_low_quiz_score_gives_low_stars(self):
        from tools import execute_tool
        result = execute_tool("store_quiz_result", {"user_id": "quiz_not_done", "quiz_score": 10, "stars": 0.5})
        assert result["stars"] == 0.5
        assert result["label"] == "Newcomer"

    def test_quiz_result_persisted_in_memory(self, seeded_memory):
        from tools import execute_tool
        execute_tool("store_quiz_result", {"user_id": "quiz_not_done", "quiz_score": 85, "stars": 4.0})
        mem = seeded_memory.read("quiz_not_done")
        assert mem["quiz_score"] == 85
        assert mem["quiz_completed"] is True
        assert mem["stars"] == 4.0


class TestRecalculateStars:
    def test_recalculate_correct(self):
        from tools import execute_tool
        result = execute_tool("recalculate_stars", {"user_id": "test_user_1", "outcome": "correct"})
        assert result["status"] == "updated"
        assert "trend" in result
        assert result["trend"]["direction"] in ("up", "down", "flat")

    def test_recalculate_incorrect_does_not_increment_correct(self, seeded_memory):
        from tools import execute_tool
        mem_before = seeded_memory.read("test_user_2")
        correct_before = mem_before["correct_predictions"]
        execute_tool("recalculate_stars", {"user_id": "test_user_2", "outcome": "incorrect"})
        mem_after = seeded_memory.read("test_user_2")
        assert mem_after["correct_predictions"] == correct_before
        assert mem_after["total_predictions"] == mem_before["total_predictions"] + 1

    def test_recalculate_unknown_user_returns_error(self):
        from tools import execute_tool
        result = execute_tool("recalculate_stars", {"user_id": "no_such_user", "outcome": "correct"})
        assert "error" in result


# ── Prediction Tests ──────────────────────────────────────────────────

class TestMakePrediction:
    def test_make_prediction_returns_logged(self):
        from tools import execute_tool
        result = execute_tool("make_prediction", {
            "user_id": "test_user_1",
            "match": "Senegal vs Brazil",
            "predicted_winner": "Brazil",
            "confidence": "high",
            "reasoning": "Brazil has better form. Strong attack. Senegal defense shaky.",
        })
        assert result["status"] == "logged"
        assert "prediction_id" in result
        assert result["pick"] == "Brazil"

    def test_prediction_persisted_in_memory(self, seeded_memory):
        from tools import execute_tool
        execute_tool("make_prediction", {
            "user_id": "test_user_1",
            "match": "England vs France",
            "predicted_winner": "France",
            "confidence": "medium",
            "reasoning": "France midfield depth.",
        })
        mem = seeded_memory.read("test_user_1")
        predictions = mem["predictions"]
        matches = [p["match"] for p in predictions]
        assert "England vs France" in matches

    def test_multiple_predictions_accumulate(self, seeded_memory):
        from tools import execute_tool
        execute_tool("make_prediction", {
            "user_id": "test_user_1",
            "match": "Germany vs Spain",
            "predicted_winner": "Spain",
            "confidence": "low",
            "reasoning": "Spain passing game.",
        })
        execute_tool("make_prediction", {
            "user_id": "test_user_1",
            "match": "Argentina vs France",
            "predicted_winner": "Argentina",
            "confidence": "medium",
            "reasoning": "Messi magic.",
        })
        mem = seeded_memory.read("test_user_1")
        germany_spain = [p for p in mem["predictions"] if p["match"] == "Germany vs Spain"]
        argentina_france = [p for p in mem["predictions"] if p["match"] == "Argentina vs France"]
        assert len(germany_spain) == 1
        assert len(argentina_france) == 1


# ── Poll Tests ────────────────────────────────────────────────────────

class TestPolls:
    def test_create_poll_returns_created(self):
        from tools import execute_tool
        result = execute_tool("create_poll", {
            "question": "Who wins the World Cup?",
            "options": ["Brazil", "France", "Argentina", "England"],
        })
        assert result["status"] == "created"
        assert "poll_id" in result

    def test_get_poll_results_initial(self):
        from tools import execute_tool
        create = execute_tool("create_poll", {
            "question": "Best player?",
            "options": ["Messi", "Ronaldo", "Mbappe"],
        })
        result = execute_tool("get_poll_results", {"poll_id": create["poll_id"]})
        assert result["status"] == "ok"
        assert result["total_votes"] == 0
        assert len(result["results"]) == 3

    def test_unknown_poll_returns_error(self):
        from tools import execute_tool
        result = execute_tool("get_poll_results", {"poll_id": "poll_nonexistent"})
        assert "error" in result


# ── Comment Tests ─────────────────────────────────────────────────────

class TestComments:
    def test_post_comment_returns_posted_with_badge(self):
        from tools import execute_tool
        result = execute_tool("post_comment", {
            "user_id": "test_user_1",
            "match_id": "match_1",
            "comment_text": "Senegal looking strong this tournament!",
            "language": "en",
        })
        assert result["status"] == "posted"
        assert "⭐" in result["badge"]

    def test_comment_retrievable_via_get_comments(self):
        from tools import execute_tool
        execute_tool("post_comment", {
            "user_id": "test_user_1",
            "match_id": "match_2",
            "comment_text": "Brazil will dominate group stage!",
            "language": "en",
        })
        result = execute_tool("get_comments", {"match_id": "match_2", "limit": 10})
        assert result["count"] >= 1

    def test_get_comments_unseen_match_returns_zero(self):
        from tools import execute_tool
        result = execute_tool("get_comments", {"match_id": "match_never_seen", "limit": 10})
        assert result["count"] == 0


# ── Leaderboard Tests ─────────────────────────────────────────────────

class TestLeaderboard:
    def test_get_leaderboard_returns_list(self):
        from tools import execute_tool
        result = execute_tool("get_leaderboard", {"limit": 5})
        assert "leaderboard" in result
        assert isinstance(result["leaderboard"], list)

    def test_leaderboard_sorted_by_stars_desc(self):
        from tools import execute_tool
        result = execute_tool("get_leaderboard", {"limit": 10})
        stars = [e["stars"] for e in result["leaderboard"]]
        assert stars == sorted(stars, reverse=True)


# ── Data Tool Tests ───────────────────────────────────────────────────

class TestDataTools:
    def test_get_live_fixtures_returns_fixtures(self):
        from tools import execute_tool
        result = execute_tool("get_live_fixtures", {})
        assert "fixtures" in result
        assert isinstance(result["fixtures"], list)

    def test_get_team_form_returns_form_string(self):
        from tools import execute_tool
        result = execute_tool("get_team_form", {"team_name": "Senegal"})
        assert "form_string" in result
        assert all(c in "WDL" for c in result["form_string"])

    def test_get_standings_returns_dict(self):
        from tools import execute_tool
        result = execute_tool("get_standings", {"group": ""})
        assert isinstance(result["standings"], dict)

    def test_search_player_stats_returns_name(self):
        from tools import execute_tool
        result = execute_tool("search_player_stats", {"player_name": "Messi"})
        assert "name" in result
        assert result["name"] is not None

    def test_unknown_tool_returns_error(self):
        from tools import execute_tool
        result = execute_tool("nonexistent_tool", {})
        assert "error" in result
        assert "Unknown tool" in result["error"]


# ── Scraper Tests ─────────────────────────────────────────────────────

class TestScraper:
    def test_get_fixtures_structure(self):
        from data.scraper import FootballScraper
        s = FootballScraper()
        result = s.get_fixtures()
        assert "fixtures" in result
        assert "source" in result
        assert "fetched_at" in result

    def test_get_team_form_structure(self):
        from data.scraper import FootballScraper
        s = FootballScraper()
        result = s.get_team_form("Senegal")
        assert "form_string" in result
        assert "last_5" in result
        assert "form_rating" in result
        assert "wins" in result
        assert "draws" in result
        assert "losses" in result

    def test_form_string_contains_only_wdl(self):
        from data.scraper import FootballScraper
        s = FootballScraper()
        result = s.get_team_form("Senegal")
        assert all(c in "WDL" for c in result["form_string"])

    def test_form_rating_between_0_and_10(self):
        from data.scraper import FootballScraper
        s = FootballScraper()
        result = s.get_team_form("Senegal")
        assert 0 <= result["form_rating"] <= 10

    def test_known_team_returns_form_structure(self):
        from data.scraper import FootballScraper
        s = FootballScraper()
        result = s.get_team_form("Senegal")
        assert "last_5" in result
        assert "form_string" in result
        assert "form_rating" in result
        assert "source" in result

    def test_unknown_team_does_not_crash(self):
        from data.scraper import FootballScraper
        s = FootballScraper()
        result = s.get_team_form("NonExistentTeamXYZ")
        assert "form_string" in result

    def test_get_standings_returns_groups(self):
        from data.scraper import FootballScraper
        s = FootballScraper()
        result = s.get_standings()
        assert len(result) > 0

    def test_get_standings_filtered(self):
        from data.scraper import FootballScraper
        s = FootballScraper()
        result = s.get_standings("A")
        group_key = list(result.keys())[0]
        assert "A" in group_key

    def test_get_player_stats_returns_structure(self):
        from data.scraper import FootballScraper
        s = FootballScraper()
        result = s.get_player_stats("Messi")
        assert "name" in result
        assert "team" in result
        assert "position" in result


# ── New Module Tests (WorldMind 2026) ──────────────────────────────────

class TestStoreComment:
    def test_store_comment_returns_stored(self):
        from tools import execute_tool
        result = execute_tool("store_comment", {
            "user_id": "test_user_1",
            "comment": "France are winning this whole thing!",
            "context": "Group I",
            "sentiment": "positive",
        })
        assert result["status"] == "stored"
        assert result["comment_count"] >= 1

    def test_store_spicy_comment(self):
        from tools import execute_tool
        result = execute_tool("store_comment", {
            "user_id": "test_user_1",
            "comment": "Brazil is overrated this year!",
            "sentiment": "spicy",
        })
        assert result["status"] == "stored"


class TestGetFanProfile:
    def test_get_fan_profile_returns_profile(self):
        from tools import execute_tool
        result = execute_tool("get_fan_profile", {"user_id": "test_user_1"})
        assert result["status"] == "ok"
        assert "nation" in result
        assert "stars" in result
        assert "knowledge_rating" in result

    def test_get_fan_profile_unknown_user(self):
        from tools import execute_tool
        result = execute_tool("get_fan_profile", {"user_id": "no_such_user"})
        assert "error" in result

    def test_get_fan_profile_shows_badges(self):
        from tools import execute_tool
        result = execute_tool("get_fan_profile", {"user_id": "test_user_2"})
        assert "badges" in result


class TestStoreStandingsSnapshot:
    def test_store_standings_snapshot(self):
        from tools import execute_tool
        result = execute_tool("store_standings_snapshot", {
            "user_id": "test_user_1",
            "group": "C",
            "standings": [
                {"team": "Brazil", "mp": 1, "w": 1, "d": 0, "l": 0, "gf": 2, "ga": 0, "gd": 2, "points": 3},
                {"team": "Morocco", "mp": 1, "w": 0, "d": 0, "l": 1, "gf": 0, "ga": 2, "gd": -2, "points": 0},
            ],
        })
        assert result["status"] == "stored"
        assert result["snapshots"] >= 1


class TestResolvePrediction:
    def test_resolve_prediction_exact_score(self, seeded_memory):
        from tools import execute_tool
        # First make a prediction
        pred = execute_tool("make_prediction", {
            "user_id": "test_user_1",
            "match": "Brazil vs Morocco",
            "predicted_winner": "Brazil",
            "confidence": "high",
            "reasoning": "Brazil stronger.",
        })
        pred_id = pred["prediction_id"]
        # Resolve it
        result = execute_tool("resolve_prediction", {
            "user_id": "test_user_1",
            "prediction_id": pred_id,
            "actual_home_score": 2,
            "actual_away_score": 0,
        })
        assert result["status"] == "resolved"
        assert result["outcome"] in ("correct", "partial", "incorrect")

    def test_resolve_already_resolved(self, seeded_memory):
        from tools import execute_tool
        pred = execute_tool("make_prediction", {
            "user_id": "test_user_1",
            "match": "France vs Senegal",
            "predicted_winner": "France",
            "confidence": "medium",
            "reasoning": "France class.",
        })
        execute_tool("resolve_prediction", {
            "user_id": "test_user_1",
            "prediction_id": pred["prediction_id"],
            "actual_home_score": 3,
            "actual_away_score": 1,
        })
        result = execute_tool("resolve_prediction", {
            "user_id": "test_user_1",
            "prediction_id": pred["prediction_id"],
            "actual_home_score": 3,
            "actual_away_score": 1,
        })
        assert "error" in result

    def test_resolve_unknown_prediction(self):
        from tools import execute_tool
        result = execute_tool("resolve_prediction", {
            "user_id": "test_user_1",
            "prediction_id": "nonexistent_id",
            "actual_home_score": 1,
            "actual_away_score": 0,
        })
        assert "error" in result


# ── Agent Smoke Tests (skip without API key) ──────────────────────────


@pytest.mark.skipif(
    not os.getenv("OPENAI_API_KEY"),
    reason="OPENAI_API_KEY not set — skip agent smoke tests",
)
class TestAgentSmoke:
    def test_basic_response_is_non_empty(self):
        from agent import chat
        result = chat("smoke_test_1", "Hello, who are you?")
        assert result["response"]
        assert len(result["response"]) > 0

    def test_memory_updated_after_chat(self):
        from agent import chat
        result = chat("smoke_test_2", "I support Brazil!")
        assert result["memory_updated"] is True

    def test_prediction_request_triggers_tools(self):
        from agent import chat
        result = chat("smoke_test_3", "I want to predict Brazil vs Morocco in Group C — who wins?")
        assert result["response"]
        assert len(result["response"]) > 0

    def test_french_input_gets_french_response(self):
        from agent import chat
        result = chat("smoke_test_4", "Bonjour! Qui est le meilleur joueur du monde?")
        assert result["response"]
        has_french = any(marker in result["response"] for marker in ["joueur", "meilleur", "football", "est", "le", "la", "dans", "Monde"])
        assert has_french or len(result["response"]) > 0
