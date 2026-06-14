import pytest

from stars import (
    calculate_stars,
    get_label,
    quiz_score_to_stars,
    build_star_update,
    stars_to_emoji,
    format_star_badge,
    format_star_summary,
    get_knowledge_rating,
    get_knowledge_emoji,
    get_prediction_points,
)


class TestCalculateStars:
    def test_pure_quiz_perfect(self):
        assert calculate_stars(100, 0, 0) == 5.0

    def test_pure_quiz_eighty(self):
        assert calculate_stars(80, 0, 0) == 4.0

    def test_pure_quiz_sixty(self):
        assert calculate_stars(60, 0, 0) == 3.0

    def test_pure_quiz_zero(self):
        assert calculate_stars(0, 0, 0) == 0.5

    def test_pure_live_perfect(self):
        assert calculate_stars(100, 20, 20) == 5.0

    def test_pure_live_zero_accuracy_with_quiz(self):
        assert calculate_stars(100, 20, 0) == 0.5

    def test_blend_quiz_40_live_90(self):
        # weight_live = min(1.0, 20/20) = 1.0, weight_quiz = 0.0
        # live_accuracy = 90, blended = 0*40 + 1*90 = 90, snapped to 4.5
        assert calculate_stars(40, 20, 18) == 4.5

    def test_blend_ten_predictions_50_50(self):
        # total_predictions=10, weight_live = 0.5, weight_quiz = 0.5
        # live_accuracy = 50, quiz_score = 50
        # blended = 50*0.5 + 50*0.5 = 50, snapped = 2.5
        assert calculate_stars(50, 10, 5) == 2.5

    def test_blend_ten_predictions_quiz_100_live_0(self):
        # weight_live = 0.5, weight_quiz = 0.5
        # live_accuracy = 0, quiz_score = 100
        # blended = 100*0.5 + 0*0.5 = 50, snapped = 2.5
        assert calculate_stars(100, 10, 0) == 2.5

    def test_expert_drops_when_consistently_wrong(self):
        assert calculate_stars(100, 20, 0) == 0.5

    def test_beginner_rises_when_consistent(self):
        assert calculate_stars(20, 20, 20) == 5.0

    @pytest.mark.parametrize("quiz,total,correct,expected", [
        (50, 5, 5, 4.0),
        (100, 3, 3, 5.0),
        (0, 5, 0, 0.5),
        (70, 15, 10, 3.5),
        (90, 8, 6, 4.5),
    ])
    def test_parametrized_snap_consistency(self, quiz, total, correct, expected):
        result = calculate_stars(quiz, total, correct)
        assert result % 0.5 == 0
        assert 0.5 <= result <= 5.0

    def test_clamp_low_absurd_input(self):
        assert calculate_stars(-100, 0, 0) == 0.5

    def test_clamp_high_absurd_input(self):
        assert calculate_stars(999, 999, 999) == 5.0

    def test_all_snapped_to_half(self):
        for i in range(0, 101, 5):
            for j in range(0, 21):
                for k in range(0, j + 1):
                    if j > 0:
                        s = calculate_stars(float(i), j, k)
                        assert s % 0.5 == 0.0, f"Not snapped: {i}, {j}, {k} -> {s}"
                        assert 0.5 <= s <= 5.0

    def test_min_stars_floor(self):
        assert calculate_stars(1, 0, 0) == 0.5


class TestQuizToStars:
    def test_perfect_score(self):
        assert quiz_score_to_stars(100) == 5.0

    def test_ninety(self):
        assert quiz_score_to_stars(90) == 4.5

    def test_seventy(self):
        assert quiz_score_to_stars(70) == 3.5

    def test_fifty(self):
        assert quiz_score_to_stars(50) == 2.5

    def test_zero(self):
        assert quiz_score_to_stars(0) == 0.5


class TestGetLabel:
    def test_newcomer_low(self):
        assert get_label(0.5) == "Newcomer"

    def test_newcomer_mid(self):
        assert get_label(1.5) == "Newcomer"

    def test_regular_low(self):
        assert get_label(2.0) == "Regular"

    def test_regular_high(self):
        assert get_label(2.5) == "Regular"

    def test_analyst_low(self):
        assert get_label(3.0) == "Analyst"

    def test_analyst_high(self):
        assert get_label(3.5) == "Analyst"

    def test_expert_low(self):
        assert get_label(4.0) == "Expert"

    def test_expert_high(self):
        assert get_label(4.5) == "Expert"

    def test_oracle(self):
        assert get_label(5.0) == "Oracle"


class TestBuildStarUpdate:
    def test_correct_increments_correct_predictions(self):
        mem = {"quiz_score": 50, "total_predictions": 5, "correct_predictions": 3, "stars": 2.5, "star_history": []}
        result = build_star_update(mem, "correct")
        assert result["correct_predictions"] == 4
        assert result["total_predictions"] == 6

    def test_incorrect_does_not_increment_correct(self):
        mem = {"quiz_score": 50, "total_predictions": 5, "correct_predictions": 3, "stars": 2.5, "star_history": []}
        result = build_star_update(mem, "incorrect")
        assert result["correct_predictions"] == 3
        assert result["total_predictions"] == 6

    def test_star_history_appended(self):
        mem = {"quiz_score": 80, "total_predictions": 0, "correct_predictions": 0, "stars": 4.0, "star_history": []}
        result = build_star_update(mem, "correct")
        assert len(result["star_history"]) == 1
        assert result["star_history"][0]["stars"] == result["stars"]

    def test_star_history_capped_at_20(self):
        mem = {"quiz_score": 50, "total_predictions": 0, "correct_predictions": 0, "stars": 2.5, "star_history": [{"stars": 1.0, "reason": "x", "timestamp": "t"}] * 20}
        result = build_star_update(mem, "correct")
        assert len(result["star_history"]) == 20

    def test_trend_up_on_correct(self):
        mem = {"quiz_score": 50, "total_predictions": 10, "correct_predictions": 8, "stars": 3.0, "star_history": []}
        result = build_star_update(mem, "correct")
        assert result["trend"]["direction"] == "up"

    def test_trend_down_on_incorrect_low_quiz(self):
        mem = {"quiz_score": 50, "total_predictions": 5, "correct_predictions": 4, "stars": 3.5, "star_history": []}
        result = build_star_update(mem, "incorrect")
        assert result["trend"]["direction"] == "down" or result["trend"]["direction"] == "flat"

    def test_trend_flat_no_change(self):
        mem = {"quiz_score": 50, "total_predictions": 0, "correct_predictions": 0, "stars": 2.5, "star_history": []}
        result = build_star_update(mem)
        assert result["trend"]["direction"] == "flat"

    def test_no_outcome_updates_nothing(self):
        mem = {"quiz_score": 80, "total_predictions": 10, "correct_predictions": 7, "stars": 3.5, "star_history": []}
        result = build_star_update(mem, None)
        assert result["correct_predictions"] == 7
        assert result["total_predictions"] == 10

    def test_live_accuracy_calculation(self):
        mem = {"quiz_score": 100, "total_predictions": 10, "correct_predictions": 8, "stars": 4.0, "star_history": []}
        result = build_star_update(mem, "correct")
        assert result["live_accuracy"] > 0


class TestDisplayHelpers:
    def test_emoji_full_stars(self):
        assert "⭐" in stars_to_emoji(4.0)
        assert "½" not in stars_to_emoji(4.0)

    def test_emoji_half_stars(self):
        assert "½" in stars_to_emoji(3.5)

    def test_badge_contains_stars_and_label(self):
        mem = {"stars": 4.0}
        badge = format_star_badge(mem)
        assert "⭐" in badge
        assert "Expert" in badge
        assert "4.0" in badge

    def test_summary_contains_all_sections(self):
        mem = {
            "stars": 3.5,
            "quiz_score": 70,
            "total_predictions": 10,
            "correct_predictions": 6,
            "star_history": [{"stars": 3.0, "reason": "initial", "timestamp": "t"}],
        }
        summary = format_star_summary(mem)
        assert "Quiz Score: 70" in summary
        assert "3.5" in summary
        assert "Analyst" in summary
        assert "Live Record" in summary
        assert "Weight Split" in summary


class TestKnowledgeRating:
    def test_casual_fan_below_40(self):
        assert get_knowledge_rating(20) == "Casual Fan"
        assert get_knowledge_rating(39) == "Casual Fan"

    def test_football_lover_40_to_59(self):
        assert get_knowledge_rating(40) == "Football Lover"
        assert get_knowledge_rating(55) == "Football Lover"

    def test_analyst_60_to_79(self):
        assert get_knowledge_rating(60) == "Analyst"
        assert get_knowledge_rating(75) == "Analyst"

    def test_tactician_80_to_94(self):
        assert get_knowledge_rating(80) == "Tactician"
        assert get_knowledge_rating(90) == "Tactician"

    def test_world_cup_legend_95_plus(self):
        assert get_knowledge_rating(95) == "World Cup Legend"
        assert get_knowledge_rating(100) == "World Cup Legend"

    def test_emoji_matches_rating(self):
        assert "🌱" in get_knowledge_emoji(20)
        assert "⚽" in get_knowledge_emoji(40)
        assert "📊" in get_knowledge_emoji(60)
        assert "🧠" in get_knowledge_emoji(80)
        assert "👑" in get_knowledge_emoji(95)


class TestPredictionPoints:
    def test_exact_score_three_points(self):
        pred = {"score": "2-1", "winner": "home"}
        assert get_prediction_points(pred, 2, 1) >= 3

    def test_correct_winner_one_point(self):
        pred = {"winner": "home"}
        assert get_prediction_points(pred, 3, 1) >= 1

    def test_wrong_prediction_zero_points(self):
        pred = {"winner": "away", "score": "0-2"}
        assert get_prediction_points(pred, 1, 1) == 0

    def test_correct_draw_one_point(self):
        pred = {"winner": "draw"}
        assert get_prediction_points(pred, 1, 1) >= 1

    def test_exact_draw_score_three_points(self):
        pred = {"score": "1-1", "winner": "draw"}
        pts = get_prediction_points(pred, 1, 1)
        assert pts >= 3
