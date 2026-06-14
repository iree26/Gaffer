import os
import json
import tempfile
import pytest

from memory import WalrusMemory


@pytest.fixture
def tmp_store():
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False, mode="w", encoding="utf-8") as f:
        json.dump({}, f)
        tmp_path = f.name
    try:
        yield tmp_path
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@pytest.fixture
def mem(tmp_store):
    return WalrusMemory(store_path=tmp_store)


class TestWalrusMemory:
    def test_read_returns_none_for_unknown_user(self, mem):
        assert mem.read("nonexistent") is None

    def test_write_and_read_roundtrip(self, mem):
        data = {"nation": "Brazil", "stars": 3.5, "language": "en"}
        mem.write("user1", data)
        result = mem.read("user1")
        assert result is not None
        assert result["nation"] == "Brazil"
        assert result["stars"] == 3.5
        assert result["language"] == "en"

    def test_write_auto_stamps_fields(self, mem):
        data = {"nation": "Brazil"}
        mem.write("user2", data)
        result = mem.read("user2")
        assert result["user_id"] == "user2"
        assert "last_updated" in result

    def test_overwrite_updates_correctly(self, mem):
        mem.write("user3", {"nation": "England", "stars": 3.0})
        mem.write("user3", {"nation": "France", "stars": 4.0, "quiz_completed": True})
        result = mem.read("user3")
        assert result["nation"] == "France"
        assert result["stars"] == 4.0
        assert result["quiz_completed"] is True

    def test_delete_removes_user(self, mem):
        mem.write("user4", {"nation": "Germany"})
        assert mem.read("user4") is not None
        assert mem.delete("user4") is True
        assert mem.read("user4") is None

    def test_delete_nonexistent_returns_false(self, mem):
        assert mem.delete("no_such_user") is False

    def test_all_users_lists_written_users(self, mem):
        mem.write("alice", {"nation": "England"})
        mem.write("bob", {"nation": "Brazil"})
        users = mem.all_users()
        assert "alice" in users
        assert "bob" in users

    def test_multiple_users_are_isolated(self, mem):
        mem.write("alice", {"nation": "England", "stars": 4.0})
        mem.write("bob", {"nation": "Brazil", "stars": 3.5})
        alice_data = mem.read("alice")
        bob_data = mem.read("bob")
        assert alice_data["nation"] == "England"
        assert alice_data["stars"] == 4.0
        assert bob_data["nation"] == "Brazil"
        assert bob_data["stars"] == 3.5
        with pytest.raises(KeyError):
            _ = alice_data["stars_not_in_alice"]

    def test_full_schema_roundtrip(self, mem):
        data = {
            "user_id": "schema_test",
            "language": "en",
            "nation": "Senegal",
            "quiz_score": 80,
            "quiz_completed": True,
            "stars": 4.0,
            "star_label": "Expert",
            "total_predictions": 5,
            "correct_predictions": 3,
            "live_accuracy": 60.0,
            "predictions": [
                {"match": "Senegal vs Brazil", "prediction": "Brazil", "confidence": "high", "reasoning": "Brazil strong", "timestamp": "2026-01-01T00:00:00Z", "outcome": "pending"},
            ],
            "poll_votes": [{"poll_id": "poll_abc123", "vote": "Option A", "timestamp": "2026-01-01T00:00:00Z"}],
            "hot_takes": ["Senegal will surprise everyone"],
            "star_history": [{"stars": 4.0, "reason": "Quiz", "timestamp": "2026-01-01T00:00:00Z"}],
            "fan_profile": {"style": "analyst", "favorite_player": "Mane", "bold_pick": "Senegal to reach QF"},
            "last_seen": "2026-01-01T00:00:00Z",
        }
        mem.write("schema_test", data)
        result = mem.read("schema_test")
        assert result["nation"] == "Senegal"
        assert len(result["predictions"]) == 1
        assert result["predictions"][0]["match"] == "Senegal vs Brazil"
        assert result["predictions"][0]["outcome"] == "pending"
        assert len(result["star_history"]) == 1
        assert result["fan_profile"]["style"] == "analyst"
        assert result["fan_profile"]["favorite_player"] == "Mane"
        assert result["poll_votes"][0]["poll_id"] == "poll_abc123"

    def test_predictions_list_persists(self, mem):
        mem.write("pred_test", {"predictions": [], "nation": "France"})
        mem.write("pred_test", {
            "nation": "France",
            "predictions": [
                {"match": "France vs Senegal", "prediction": "France", "confidence": "high", "reasoning": "Squad depth", "timestamp": "t1", "outcome": "pending"},
                {"match": "France vs Norway", "prediction": "France", "confidence": "medium", "reasoning": "Good form", "timestamp": "t2", "outcome": "pending"},
            ],
        })
        result = mem.read("pred_test")
        assert len(result["predictions"]) == 2
        assert result["predictions"][0]["match"] == "France vs Senegal"
        assert result["predictions"][1]["match"] == "France vs Norway"

    def test_generate_id_unique(self):
        ids = {WalrusMemory.generate_id() for _ in range(100)}
        assert len(ids) == 100
