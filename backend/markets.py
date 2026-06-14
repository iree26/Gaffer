from __future__ import annotations

import copy
from datetime import datetime, timezone
from typing import Dict, List, Optional

from models import Market, MarketOption


# ── Flag ISO codes ────────────────────────────────────────────────────────

FLAGS: Dict[str, str] = {
    "Mexico": "mx", "South Korea": "kr", "South Africa": "za", "Czechia": "cz",
    "Canada": "ca", "Switzerland": "ch", "Qatar": "qa", "Bosnia and Herzegovina": "ba",
    "Brazil": "br", "Morocco": "ma", "Scotland": "gb-sct", "Haiti": "ht",
    "USA": "us", "Australia": "au", "Paraguay": "py", "Turkiye": "tr",
    "Germany": "de", "Ecuador": "ec", "Ivory Coast": "ci", "Curacao": "cw",
    "Netherlands": "nl", "Japan": "jp", "Tunisia": "tn", "Sweden": "se",
    "Belgium": "be", "Iran": "ir", "Egypt": "eg", "New Zealand": "nz",
    "Spain": "es", "Uruguay": "uy", "Saudi Arabia": "sa", "Cape Verde": "cv",
    "France": "fr", "Senegal": "sn", "Norway": "no", "Iraq": "iq",
    "Argentina": "ar", "Austria": "at", "Algeria": "dz", "Jordan": "jo",
    "Portugal": "pt", "Colombia": "co", "Uzbekistan": "uz", "DR Congo": "cd",
    "England": "gb-eng", "Croatia": "hr", "Panama": "pa", "Ghana": "gh",
}


GROUPS: Dict[str, List[str]] = {
    "A": ["Mexico", "South Korea", "South Africa", "Czechia"],
    "B": ["Canada", "Switzerland", "Qatar", "Bosnia and Herzegovina"],
    "C": ["Brazil", "Morocco", "Scotland", "Haiti"],
    "D": ["USA", "Australia", "Paraguay", "Turkiye"],
    "E": ["Germany", "Ecuador", "Ivory Coast", "Curacao"],
    "F": ["Netherlands", "Japan", "Tunisia", "Sweden"],
    "G": ["Belgium", "Iran", "Egypt", "New Zealand"],
    "H": ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"],
    "I": ["France", "Senegal", "Norway", "Iraq"],
    "J": ["Argentina", "Austria", "Algeria", "Jordan"],
    "K": ["Portugal", "Colombia", "Uzbekistan", "DR Congo"],
    "L": ["England", "Croatia", "Panama", "Ghana"],
}


def _build_group_markets() -> List[Market]:
    markets: List[Market] = []
    for letter, teams in GROUPS.items():
        options = [
            MarketOption(
                id=f"o_{letter.lower()}_{team.lower().replace(' ', '_')}",
                label=team,
                flag=FLAGS.get(team, "unknown"),
            )
            for team in teams
        ]
        markets.append(Market(
            id=f"m_grp{letter}",
            category="GROUP_WINNER",
            title=f"Group {letter} Winner",
            options=options,
            closesAt=f"2026-06-{20 + (ord(letter) - 65) % 7:02d}T16:00:00Z",
            status="OPEN",
            resultOptionId=None,
        ))
    return markets


def _build_knockout_markets() -> List[Market]:
    return [
        Market(
            id="m_ro32",
            category="KNOCKOUT_WINNER",
            title="Round of 32 Winner — Top Half",
            options=[MarketOption(id="o_ro32_a", label="Top Half Team A", flag="xx"),
                     MarketOption(id="o_ro32_b", label="Top Half Team B", flag="xx")],
            closesAt="2026-06-28T12:00:00Z",
            status="OPEN",
            resultOptionId=None,
        ),
        Market(
            id="m_qf",
            category="KNOCKOUT_WINNER",
            title="Quarterfinal Winner — Top Half",
            options=[MarketOption(id="o_qf_a", label="QF Team A", flag="xx"),
                     MarketOption(id="o_qf_b", label="QF Team B", flag="xx")],
            closesAt="2026-07-04T12:00:00Z",
            status="OPEN",
            resultOptionId=None,
        ),
        Market(
            id="m_sf",
            category="KNOCKOUT_WINNER",
            title="Semifinal Winner — Top Half",
            options=[MarketOption(id="o_sf_a", label="SF Team A", flag="xx"),
                     MarketOption(id="o_sf_b", label="SF Team B", flag="xx")],
            closesAt="2026-07-09T12:00:00Z",
            status="OPEN",
            resultOptionId=None,
        ),
    ]


def _build_final_markets() -> List[Market]:
    return [
        Market(
            id="m_champion",
            category="FINAL_CHAMPION",
            title="World Cup 2026 Champion",
            options=[MarketOption(id="o_champ_a", label="Winner SF 1", flag="xx"),
                     MarketOption(id="o_champ_b", label="Winner SF 2", flag="xx")],
            closesAt="2026-07-14T12:00:00Z",
            status="OPEN",
            resultOptionId=None,
        ),
        Market(
            id="m_top_scorer",
            category="FINAL_CHAMPION",
            title="Top Goalscorer",
            options=[MarketOption(id="o_ts_1", label="Kylian Mbappe", flag="fr"),
                     MarketOption(id="o_ts_2", label="Harry Kane", flag="gb-eng"),
                     MarketOption(id="o_ts_3", label="Lautaro Martinez", flag="ar"),
                     MarketOption(id="o_ts_4", label="Vinicius Jr", flag="br")],
            closesAt="2026-07-14T12:00:00Z",
            status="OPEN",
            resultOptionId=None,
        ),
    ]


def get_all_markets() -> List[Market]:
    return _build_group_markets() + _build_knockout_markets() + _build_final_markets()


_MARKETS: List[Market] = get_all_markets()


def get_market_by_id(market_id: str) -> Optional[Market]:
    for m in _MARKETS:
        if m.id == market_id:
            return m
    return None


def get_option_label(market_id: str, option_id: str) -> Optional[str]:
    market = get_market_by_id(market_id)
    if not market:
        return None
    for opt in market.options:
        if opt.id == option_id:
            return opt.label
    return None


def set_market_result(market_id: str, result_option_id: str) -> bool:
    market = get_market_by_id(market_id)
    if not market:
        return False
    if market.status == "RESOLVED":
        return False
    market.status = "RESOLVED"
    market.resultOptionId = result_option_id
    return True


def close_market(market_id: str) -> bool:
    market = get_market_by_id(market_id)
    if not market:
        return False
    if market.status != "OPEN":
        return False
    market.status = "CLOSED"
    return True
