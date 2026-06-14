from datetime import datetime, timezone


def calculate_stars(quiz_score: float, total_predictions: int, correct_predictions: int) -> float:
    weight_live = min(1.0, total_predictions / 20)
    weight_quiz = 1.0 - weight_live
    live_accuracy = (correct_predictions / total_predictions * 100) if total_predictions > 0 else quiz_score
    blended = (quiz_score * weight_quiz) + (live_accuracy * weight_live)
    star_value = blended / 20
    snapped = round(star_value / 0.5) * 0.5
    return max(0.5, min(5.0, snapped))


def get_label(stars: float) -> str:
    if stars == 5.0:
        return "Oracle"
    if stars >= 4.0:
        return "Expert"
    if stars >= 3.0:
        return "Analyst"
    if stars >= 2.0:
        return "Regular"
    return "Newcomer"


def quiz_score_to_stars(quiz_score: float) -> float:
    raw = quiz_score / 20
    snapped = round(raw / 0.5) * 0.5
    return max(0.5, min(5.0, snapped))


def build_star_update(memory: dict, new_outcome: str | None = None) -> dict:
    quiz_score = memory.get("quiz_score", 0)
    total_predictions = memory.get("total_predictions", 0)
    correct_predictions = memory.get("correct_predictions", 0)
    old_stars = memory.get("stars", 0.5)
    star_history = list(memory.get("star_history", []))

    if new_outcome == "correct":
        correct_predictions = correct_predictions + 1
        total_predictions = total_predictions + 1
    elif new_outcome == "incorrect":
        total_predictions = total_predictions + 1

    new_stars = calculate_stars(quiz_score, total_predictions, correct_predictions)
    live_accuracy = (correct_predictions / total_predictions * 100) if total_predictions > 0 else 0.0
    star_label = get_label(new_stars)

    delta = round(new_stars - old_stars, 2)
    if delta > 0:
        direction = "up"
    elif delta < 0:
        direction = "down"
    else:
        direction = "flat"

    reason = f"Prediction marked {new_outcome}" if new_outcome else "Initial quiz result"
    star_history.append({
        "stars": new_stars,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    star_history = star_history[-20:]

    return {
        "stars": new_stars,
        "star_label": star_label,
        "correct_predictions": correct_predictions,
        "total_predictions": total_predictions,
        "live_accuracy": live_accuracy,
        "star_history": star_history,
        "trend": {"direction": direction, "delta": abs(delta), "reason": reason}
    }


def get_knowledge_rating(percentage: float) -> str:
    if percentage >= 95:
        return "World Cup Legend"
    if percentage >= 80:
        return "Tactician"
    if percentage >= 60:
        return "Analyst"
    if percentage >= 40:
        return "Football Lover"
    return "Casual Fan"


def get_knowledge_emoji(percentage: float) -> str:
    if percentage >= 95:
        return "👑"
    if percentage >= 80:
        return "🧠"
    if percentage >= 60:
        return "📊"
    if percentage >= 40:
        return "⚽"
    return "🌱"


def get_prediction_points(prediction: dict, actual_home: int, actual_away: int) -> int:
    points = 0
    pred_score = prediction.get("score", "")
    if isinstance(pred_score, str) and "-" in pred_score:
        parts = pred_score.split("-")
        if len(parts) == 2:
            try:
                pred_h, pred_a = int(parts[0]), int(parts[1])
                if pred_h == actual_home and pred_a == actual_away:
                    points += 3
                elif (pred_h > pred_a and actual_home > actual_away) or \
                     (pred_h < pred_a and actual_home < actual_away) or \
                     (pred_h == pred_a and actual_home == actual_away):
                    points += 1
            except ValueError:
                pass
    winner = prediction.get("winner", "")
    if winner:
        actual_winner = "draw" if actual_home == actual_away else \
                        ("home" if actual_home > actual_away else "away")
        pred_winner = winner.lower()
        if pred_winner == actual_winner:
            if not prediction.get("score") or "-" not in str(prediction.get("score", "")):
                points += 1
    return points


def stars_to_emoji(stars: float) -> str:
    full = int(stars)
    half = 1 if (stars - full) >= 0.5 else 0
    return "⭐" * full + ("½" if half else "")


def format_star_badge(memory: dict) -> str:
    stars = memory.get("stars", 0.5)
    label = get_label(stars)
    return f"{stars_to_emoji(stars)} {stars:.1f} {label}"


def format_star_summary(memory: dict) -> str:
    stars = memory.get("stars", 0.5)
    label = get_label(stars)
    quiz_score = memory.get("quiz_score", 0)
    total_preds = memory.get("total_predictions", 0)
    correct_preds = memory.get("correct_predictions", 0)
    live_acc = (correct_preds / total_preds * 100) if total_preds > 0 else 0.0
    weight_live = min(1.0, total_preds / 20)
    weight_quiz = 1.0 - weight_live

    trend = memory.get("star_history", [])
    arrow = "→"
    if len(trend) >= 2:
        last = trend[-1]["stars"]
        prev = trend[-2]["stars"]
        if last > prev:
            arrow = "↑"
        elif last < prev:
            arrow = "↓"

    return (
        f"{stars_to_emoji(stars)} {stars:.1f} {label} {arrow}\n"
        f"Quiz Score: {quiz_score}/100\n"
        f"Live Record: {correct_preds}/{total_preds} ({live_acc:.0f}%)\n"
        f"Weight Split: {weight_quiz*100:.0f}% quiz / {weight_live*100:.0f}% predictions"
    )
