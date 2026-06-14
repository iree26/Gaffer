QUESTION_BANK = [
    # Q1
    {
        "question": "How many teams play in World Cup 2026?",
        "options": ["32", "40", "48", "64"],
        "correct": 2,  # C
    },
    # Q2
    {
        "question": "Who are the three host nations?",
        "options": ["USA/Brazil/Mexico", "USA/Canada/Mexico", "Canada/Brazil/USA", "Mexico/Canada/Brazil"],
        "correct": 1,  # B
    },
    # Q3
    {
        "question": "Who is the defending World Cup champion?",
        "options": ["France", "Brazil", "Germany", "Argentina"],
        "correct": 3,  # D
    },
    # Q4
    {
        "question": "How many groups are there in 2026?",
        "options": ["8", "10", "12", "16"],
        "correct": 2,  # C
    },
    # Q5
    {
        "question": "Where is the final being played?",
        "options": ["Los Angeles", "Mexico City", "Toronto", "New York New Jersey"],
        "correct": 3,  # D
    },
    # Q6
    {
        "question": "Which teams open the 2026 World Cup?",
        "options": ["USA vs Canada", "Mexico vs South Africa", "Brazil vs Argentina", "England vs France"],
        "correct": 1,  # B
    },
    # Q7
    {
        "question": "How long is a standard World Cup match?",
        "options": ["80 mins", "90 mins", "100 mins", "120 mins"],
        "correct": 1,  # B
    },
    # Q8
    {
        "question": "How many points does a team get for a win?",
        "options": ["1", "2", "3", "4"],
        "correct": 2,  # C
    },
    # Q9
    {
        "question": "Which country has won the most World Cups?",
        "options": ["Germany", "Italy", "Brazil", "Argentina"],
        "correct": 2,  # C
    },
    # Q10
    {
        "question": "Which group is Brazil in at World Cup 2026?",
        "options": ["Group A", "Group C", "Group F", "Group J"],
        "correct": 1,  # B
    },
    # Q11
    {
        "question": "Which country knocked Italy out of World Cup 2026 qualification?",
        "options": ["Ukraine", "Poland", "Bosnia and Herzegovina", "Sweden"],
        "correct": 2,  # C
    },
    # Q12
    {
        "question": "Name the four debutants at World Cup 2026:",
        "options": [
            "Jordan/Uzbekistan/Cape Verde/Curacao",
            "Nigeria/Jordan/Cape Verde/Curacao",
            "Jordan/Uzbekistan/Kosovo/Curacao",
            "Cape Verde/Curacao/Somalia/Jordan",
        ],
        "correct": 0,  # A
    },
    # Q13
    {
        "question": "Who beat Jamaica in the intercontinental playoff final?",
        "options": ["Bolivia", "Iraq", "DR Congo", "New Caledonia"],
        "correct": 2,  # C
    },
    # Q14
    {
        "question": "How does the 48-team format advance teams from group stage?",
        "options": ["Top 2 only", "Top 3 only", "Top 2 + 8 best 3rd place", "Top 2 + 4 best 3rd place"],
        "correct": 2,  # C
    },
    # Q15
    {
        "question": "Which group contains the defending champions Argentina?",
        "options": ["Group H", "Group I", "Group J", "Group K"],
        "correct": 2,  # C
    },
    # Q16
    {
        "question": "France is in the same group as which of these teams?",
        "options": ["Morocco", "Senegal", "Ghana", "Egypt"],
        "correct": 1,  # B
    },
    # Q17
    {
        "question": "Which group has both Portugal and DR Congo?",
        "options": ["Group J", "Group K", "Group L", "Group I"],
        "correct": 1,  # B
    },
    # Q18
    {
        "question": "How many total matches are played at World Cup 2026?",
        "options": ["88", "96", "100", "104"],
        "correct": 3,  # D
    },
    # Q19
    {
        "question": "England is in the same group as which of these?",
        "options": ["Scotland", "Wales", "Croatia", "Ireland"],
        "correct": 2,  # C
    },
    # Q20
    {
        "question": "Cape Verde is making their World Cup debut in which group?",
        "options": ["Group F", "Group G", "Group H", "Group I"],
        "correct": 2,  # C
    },
]

# Answer key: C B D C D B B C C B / C A C C C B B D C C
# Index:      2 1 2 2 3 1 1 2 2 1 / 2 0 2 2 2 1 1 3 2 2
ANSWER_KEY = [2, 1, 3, 2, 3, 1, 1, 2, 2, 1, 2, 0, 2, 2, 2, 1, 1, 3, 2, 2]


def score_quiz(answers: list) -> int:
    score = 0
    for i, answer in enumerate(answers):
        if i < len(ANSWER_KEY):
            try:
                idx = ord(answer.lower()) - ord("a")
                if idx == ANSWER_KEY[i]:
                    score += 1
            except (ValueError, IndexError):
                pass
    return score * 5  # Convert to 0-100 (20 questions × 5 pts each)


def compute_baseline(quiz_score: int) -> float:
    raw = quiz_score / 20
    snapped = round(raw * 2) / 2
    return max(0.5, min(5.0, snapped))
