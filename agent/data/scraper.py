import os
import json
import re
from datetime import datetime, timezone
import httpx
import requests
import concurrent.futures

ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world"
FOOTBALL_DATA_BASE = "https://api.football-data.org/v4"
BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search"

NATION_SLUGS: dict[str, str] = {
    "algeria": "algeria",
    "argentina": "argentina",
    "australia": "australia",
    "austria": "austria",
    "belgium": "belgium",
    "bosnia and herzegovina": "bosnia-and-herzegovina",
    "brazil": "brazil",
    "canada": "canada",
    "cape verde": "cape-verde",
    "colombia": "colombia",
    "croatia": "croatia",
    "curacao": "curacao",
    "czechia": "czech-republic",
    "dr congo": "dr-congo",
    "ecuador": "ecuador",
    "egypt": "egypt",
    "england": "england",
    "france": "france",
    "germany": "germany",
    "ghana": "ghana",
    "haiti": "haiti",
    "iran": "iran",
    "iraq": "iraq",
    "ivory coast": "ivory-coast",
    "japan": "japan",
    "jordan": "jordan",
    "mexico": "mexico",
    "morocco": "morocco",
    "netherlands": "netherlands",
    "new zealand": "new-zealand",
    "norway": "norway",
    "panama": "panama",
    "paraguay": "paraguay",
    "portugal": "portugal",
    "qatar": "qatar",
    "saudi arabia": "saudi-arabia",
    "scotland": "scotland",
    "senegal": "senegal",
    "south africa": "south-africa",
    "south korea": "south-korea",
    "spain": "spain",
    "sweden": "sweden",
    "switzerland": "switzerland",
    "tunisia": "tunisia",
    "turkiye": "turkey",
    "united states": "united-states",
    "uruguay": "uruguay",
    "usa": "united-states",
    "uzbekistan": "uzbekistan",
}

MOCK_GROUPS: list[tuple[str, list[str]]] = [
    ("Group A", ["Mexico", "South Africa", "South Korea", "Czechia"]),
    ("Group B", ["Canada", "Switzerland", "Qatar", "Bosnia and Herzegovina"]),
    ("Group C", ["Brazil", "Morocco", "Scotland", "Haiti"]),
    ("Group D", ["United States", "Paraguay", "Australia", "Türkiye"]),
    ("Group E", ["Germany", "Curaçao", "Ivory Coast", "Ecuador"]),
    ("Group F", ["Netherlands", "Japan", "Sweden", "Tunisia"]),
    ("Group G", ["Belgium", "Egypt", "Iran", "New Zealand"]),
    ("Group H", ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"]),
    ("Group I", ["France", "Senegal", "Iraq", "Norway"]),
    ("Group J", ["Argentina", "Algeria", "Austria", "Jordan"]),
    ("Group K", ["Portugal", "DR Congo", "Uzbekistan", "Colombia"]),
    ("Group L", ["England", "Croatia", "Ghana", "Panama"]),
]

MOCK_VENUES: dict[str, str] = {
    "Mexico": "Estadio Azteca, Mexico City",
    "Argentina": "Estadio Monumental, Buenos Aires",
    "Japan": "Japan National Stadium, Tokyo",
    "Egypt": "Borg El Arab Stadium, Alexandria",
    "United States": "MetLife Stadium, New York",
    "England": "Wembley Stadium, London",
    "Iran": "Azadi Stadium, Tehran",
    "Cape Verde": "Estádio Nacional de Cabo Verde, Praia",
    "Canada": "BC Place, Vancouver",
    "France": "Stade de France, Paris",
    "Senegal": "Stade Abdoulaye Wade, Dakar",
    "Iraq": "Basra International Stadium, Basra",
    "Brazil": "Maracanã, Rio de Janeiro",
    "Portugal": "Estádio da Luz, Lisbon",
    "Morocco": "Stade Mohammed V, Casablanca",
    "New Zealand": "Eden Park, Auckland",
    "Belgium": "King Baudouin Stadium, Brussels",
    "Uruguay": "Estadio Centenario, Montevideo",
    "Algeria": "Stade du 5 Juillet, Algiers",
    "Panama": "Estadio Rommel Fernández, Panama City",
    "Netherlands": "Johan Cruyff Arena, Amsterdam",
    "Croatia": "Stadion Maksimir, Zagreb",
    "Ghana": "Baba Yara Stadium, Kumasi",
    "Uzbekistan": "Milliy Stadium, Tashkent",
    "Germany": "Allianz Arena, Munich",
    "Colombia": "Estadio El Campín, Bogotá",
    "Tunisia": "Stade Olympique de Radès, Tunis",
    "Saudi Arabia": "King Abdullah Sports City, Jeddah",
    "Spain": "Estadio Santiago Bernabéu, Madrid",
    "Ecuador": "Estadio Monumental, Guayaquil",
    "South Africa": "FNB Stadium, Johannesburg",
    "Jordan": "Amman International Stadium, Amman",
    "Switzerland": "Stade de Suisse, Bern",
    "Paraguay": "Estadio Defensores del Chaco, Asunción",
    "Ivory Coast": "Stade Félix Houphouët-Boigny, Abidjan",
    "Qatar": "Lusail Stadium, Lusail",
    "Sweden": "Friends Arena, Stockholm",
    "Austria": "Ernst-Happel-Stadion, Vienna",
    "South Korea": "Seoul World Cup Stadium, Seoul",
    "Australia": "Stadium Australia, Sydney",
    "Norway": "Ullevaal Stadion, Oslo",
    "Czechia": "Eden Arena, Prague",
    "DR Congo": "Stade des Martyrs, Kinshasa",
    "Haiti": "Stade Sylvio Cator, Port-au-Prince",
    "Türkiye": "Atatürk Olympic Stadium, Istanbul",
    "Scotland": "Hampden Park, Glasgow",
    "Bosnia and Herzegovina": "Stadion Grbavica, Sarajevo",
    "Curaçao": "Stadion Ergilio Hato, Willemstad",
}

_SEARCH_CACHE = {}  # query -> (timestamp, results)


def _get_query_ttl(query: str) -> int:
    query_lower = query.lower()
    if "today" in query_lower or "live" in query_lower or "updates" in query_lower:
        return 30
    m = re.search(r"june\s+(\d+)", query_lower)
    if m:
        try:
            day = int(m.group(1))
            current_day = datetime.now(timezone.utc).day
            if day < current_day:
                return 86400  # 24 hours
            elif day == current_day:
                return 60  # 1 minute
            else:
                return 3600  # 1 hour
        except Exception:
            pass
    return 300  # 5 minutes


def _brave_search(query: str, count: int = 10) -> list[dict]:
    now = datetime.now(timezone.utc).timestamp()
    if query in _SEARCH_CACHE:
        ts, results = _SEARCH_CACHE[query]
        ttl = _get_query_ttl(query)
        if now - ts < ttl:
            return results

    api_key = os.environ.get("BRAVE_API_KEY", "")
    if not api_key:
        from dotenv import load_dotenv as _ld
        _ld()
        api_key = os.environ.get("BRAVE_API_KEY", "")
    if not api_key:
        if query in _SEARCH_CACHE:
            return _SEARCH_CACHE[query][1]
        return []
    try:
        resp = httpx.get(
            BRAVE_SEARCH_URL,
            headers={"X-Subscription-Token": api_key, "Accept": "application/json"},
            params={"q": query, "count": count},
            timeout=15,
        )
        resp.raise_for_status()
        results = resp.json().get("web", {}).get("results", [])
        _SEARCH_CACHE[query] = (now, results)
        return results
    except Exception:
        if query in _SEARCH_CACHE:
            return _SEARCH_CACHE[query][1]
        return []


_ALL_NATIONS = {n.lower().strip() for _, teams in MOCK_GROUPS for n in teams}

_NATION_ALIASES = {
    "bosnia-herzegovina": "bosnia and herzegovina",
    "bosnia": "bosnia and herzegovina",
    "turkiye": "türkiye",
    "turkey": "türkiye",
    "usa": "united states",
    "czech-republic": "czechia",
    "czech republic": "czechia",
    "congo dr": "dr congo",
    "dr congo": "dr congo",
    "ivory coast": "ivory coast",
    "cape verde": "cape verde",
    "south korea": "south korea",
    "korea republic": "south korea",
    "korea": "south korea",
    "new zealand": "new zealand",
    "saudi arabia": "saudi arabia",
    "curaçao": "curacao",
    "netherlands": "netherlands",
    "united states": "united states",
}


def _normalize_nation(name: str) -> str:
    lower = name.lower().strip().rstrip(".")
    return _NATION_ALIASES.get(lower, lower)


def _name_in_nations(name: str) -> str | None:
    lower = _normalize_nation(name.lower().strip().rstrip("."))
    for n in _ALL_NATIONS:
        if lower == n or lower.startswith(n) or n.startswith(lower):
            return n.title()
    return None


def _parse_fixtures_from_web(results: list[dict]) -> dict[str, dict]:
    results_map: dict[str, dict] = {}
    team_list = sorted(_ALL_NATIONS, key=len, reverse=True)

    for r in results:
        text = (r.get("description") or r.get("snippet") or "") + " " + (r.get("title") or "")
        text_lower = text.lower()

        positions: list[tuple[int, int, str]] = []
        for name in team_list:
            idx = 0
            while True:
                pos = text_lower.find(name, idx)
                if pos == -1:
                    break
                positions.append((pos, pos + len(name), name.title()))
                idx = pos + 1

        if len(positions) < 2:
            continue
        positions.sort()

        for i in range(len(positions)):
            for j in range(i + 1, len(positions)):
                p1_start, p1_end, t1 = positions[i]
                p2_start, p2_end, t2 = positions[j]
                if t1 == t2:
                    continue
                between = text[p1_end:p2_start]

                score_m = re.search(r"(\d+)\s*[-–]\s*(\d+)", between)
                if score_m:
                    s1, s2 = int(score_m.group(1)), int(score_m.group(2))
                    slug = f"{t1} vs {t2}"
                    results_map[slug] = {"home": t1, "away": t2, "score": {"home": s1, "away": s2}, "status": "completed"}
                    rev_slug = f"{t2} vs {t1}"
                    results_map[rev_slug] = {"home": t2, "away": t1, "score": {"home": s2, "away": s1}, "status": "completed"}
                else:
                    after_text = text[p2_end:p2_end + 30]
                    score_after = re.search(r"(\d+)\s*[-–]\s*(\d+)", after_text)
                    if score_after:
                        s1, s2 = int(score_after.group(1)), int(score_after.group(2))
                        slug = f"{t1} vs {t2}"
                        if slug not in results_map:
                            results_map[slug] = {"home": t1, "away": t2, "score": {"home": s1, "away": s2}, "status": "completed"}
                            rev_slug = f"{t2} vs {t1}"
                            results_map[rev_slug] = {"home": t2, "away": t1, "score": {"home": s2, "away": s1}, "status": "completed"}
                    elif re.search(r"\bvs\b|v\.|–", between):
                        slug = f"{t1} vs {t2}"
                        if slug not in results_map or results_map[slug].get("status") != "completed":
                            results_map[slug] = {"home": t1, "away": t2, "score": {"home": None, "away": None}, "status": "scheduled"}

    return results_map


def _parse_standings_from_web(results: list[dict]) -> dict[str, list[dict]] | None:
    standing_pat = re.compile(
        r"(Group\s+[A-L])\s*[:\-–]\s*(.+?)(?=Group\s+[A-L]|$)",
        re.IGNORECASE | re.DOTALL,
    )
    team_pts_pat = re.compile(r"((?:[A-Z]\w+(?:\s[A-Z]\w+)?))\s+(\d+)\s*pts?")

    standings: dict[str, list[dict]] = {}
    for r in results:
        text = (r.get("description") or r.get("snippet") or "") + " " + r.get("title", "")
        for gm in standing_pat.finditer(text):
            group_name = gm.group(1).strip()
            body = gm.group(2)
            teams = []
            for tm in team_pts_pat.finditer(body):
                t = _name_in_nations(tm.group(1))
                if t:
                    teams.append({
                        "team": t,
                        "played": 0, "won": 0, "drawn": 0, "lost": 0,
                        "gf": 0, "ga": 0, "gd": 0,
                        "points": int(tm.group(2)),
                    })
            if teams and group_name not in standings:
                teams.sort(key=lambda x: -x["points"])
                standings[group_name] = teams

    return standings if standings else None


class FootballScraper:
    def __init__(self):
        self.football_data_key = os.environ.get("FOOTBALL_DATA_API_KEY")
        self.headers = {}
        if self.football_data_key:
            self.headers["X-Auth-Token"] = self.football_data_key
        self._setup_fixture_schedule()
        self._cache = {}

    def _setup_fixture_schedule(self):
        base_fixtures: list[dict] = []
        for group_idx, (group_name, teams) in enumerate(MOCK_GROUPS):
            A, B, C, D = teams
            matchdays = [
                [(A, B), (C, D)],
                [(A, C), (B, D)],
                [(A, D), (B, C)],
            ]
            base_day = 11 + group_idx
            for md_idx, md_pairs in enumerate(matchdays):
                day = min(base_day + md_idx * 4, 27)
                for m_idx, (home, away) in enumerate(md_pairs):
                    hour = 18 + m_idx * 3
                    date_str = f"2026-06-{day:02d}T{hour:02d}:00:00Z"
                    fid = f"{group_name[-1]}_md{md_idx + 1}_m{m_idx + 1}"
                    base_fixtures.append({
                        "id": fid,
                        "match": f"{home} vs {away}",
                        "home": home,
                        "away": away,
                        "date": date_str,
                        "venue": MOCK_VENUES.get(home, "Neutral Venue"),
                    })
        self._base_fixtures = base_fixtures

    def _team_to_espn_slug(self, team_name: str) -> str:
        return NATION_SLUGS.get(team_name.lower().strip(), team_name.lower().replace(" ", "-"))

    def _valid_fixture_pairs(self) -> set[tuple[str, str]]:
        pairs: set[tuple[str, str]] = set()
        for bf in self._base_fixtures:
            pairs.add(tuple(sorted([bf["home"], bf["away"]])))
        return pairs

    def get_fixtures(self) -> dict:
        now_ts = datetime.now(timezone.utc).timestamp()
        cache_key = "fixtures"
        if cache_key in self._cache:
            ts, data = self._cache[cache_key]
            if now_ts - ts < 30:  # 30 seconds TTL
                return data

        try:
            res = self._get_fixtures_uncached()
            self._cache[cache_key] = (now_ts, res)
            return res
        except Exception as e:
            if cache_key in self._cache:
                return self._cache[cache_key][1]
            raise e

    def _get_fixtures_uncached(self) -> dict:
        now = datetime.now(timezone.utc).isoformat()
        now_dt = datetime.now(timezone.utc)
        results_map: dict[str, dict] = {}
        valid_pairs = self._valid_fixture_pairs()

        # 1. Try ESPN for live/upcoming fixtures
        try:
            resp = requests.get(f"{ESPN_BASE}/scoreboard", timeout=8)
            resp.raise_for_status()
            data = resp.json()
            for event in data.get("events", []):
                comp = event.get("competitions", [{}])[0]
                competitors = comp.get("competitors", [])
                if len(competitors) < 2:
                    continue
                home = competitors[0].get("team", {}).get("displayName", "Unknown")
                away = competitors[1].get("team", {}).get("displayName", "Unknown")
                h_score = competitors[0].get("score", "0")
                a_score = competitors[1].get("score", "0")
                raw_status = comp.get("status", {}).get("type", {}).get("name", "scheduled")
                if raw_status == "STATUS_SCHEDULED":
                    status = "scheduled"
                elif raw_status == "STATUS_IN_PROGRESS":
                    status = "in_play"
                elif raw_status == "STATUS_FINAL":
                    status = "completed"
                else:
                    status = "scheduled"
                slug = f"{home} vs {away}"
                results_map[slug] = {
                    "home": home, "away": away,
                    "score": {"home": int(h_score) if h_score.isdigit() else None,
                              "away": int(a_score) if a_score.isdigit() else None},
                    "status": status,
                    "venue": (comp.get("venue") or {}).get("fullName", "Unknown"),
                }
        except Exception:
            pass

        # 2. Search web for completed match results in parallel
        try:
            queries = [
                "World Cup 2026 results June 11",
                "World Cup 2026 results June 12",
                "World Cup 2026 results June 13",
                "World Cup 2026 scores group A",
                "World Cup 2026 today scores",
            ]
            web_results = []
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = {executor.submit(_brave_search, q, 5): q for q in queries}
                for f in concurrent.futures.as_completed(futures):
                    try:
                        web_results += f.result()
                    except Exception:
                        pass

            web_parsed = _parse_fixtures_from_web(web_results)
            for slug, data in web_parsed.items():
                if data["status"] != "completed":
                    continue
                pair = tuple(sorted([data["home"], data["away"]]))
                if pair not in valid_pairs:
                    continue
                if slug not in results_map or data["status"] == "completed":
                    results_map[slug] = data
        except Exception:
            pass

        fixtures = []
        for bf in self._base_fixtures:
            slug = bf["match"]
            match_date = datetime.fromisoformat(bf["date"].replace("Z", "+00:00"))
            rd = results_map.get(slug)
            if not rd:
                parts = bf["match"].split(" vs ")
                if len(parts) == 2:
                    rev_slug = f"{parts[1]} vs {parts[0]}"
                    rd = results_map.get(rev_slug)
                    if rd:
                        rd = dict(rd)
                        rd["home"] = bf["home"]
                        rd["away"] = bf["away"]
            if rd:
                fixtures.append({
                    "id": bf["id"],
                    "match": slug,
                    "home": bf["home"],
                    "away": bf["away"],
                    "date": bf["date"],
                    "status": rd.get("status", "scheduled"),
                    "score": rd.get("score", {"home": None, "away": None}),
                    "venue": rd.get("venue", bf["venue"]),
                    "group": slug,
                })
            else:
                status = "unknown" if match_date < now_dt else "scheduled"
                fixtures.append({
                    "id": bf["id"],
                    "match": slug,
                    "home": bf["home"],
                    "away": bf["away"],
                    "date": bf["date"],
                    "status": status,
                    "score": {"home": None, "away": None},
                    "venue": bf["venue"],
                    "group": slug,
                })

        fixtures.sort(key=lambda x: x.get("date", ""))
        source = "web+espn" if results_map else "schedule"
        return {"fixtures": fixtures, "source": source, "fetched_at": now}

    def get_team_form(self, team_name: str) -> dict:
        now_ts = datetime.now(timezone.utc).timestamp()
        cache_key = f"form_{team_name.lower().strip()}"
        if cache_key in self._cache:
            ts, data = self._cache[cache_key]
            if now_ts - ts < 300:  # 5 minutes TTL
                return data

        try:
            res = self._get_team_form_uncached(team_name)
            self._cache[cache_key] = (now_ts, res)
            return res
        except Exception as e:
            if cache_key in self._cache:
                return self._cache[cache_key][1]
            raise e

    def _get_team_form_uncached(self, team_name: str) -> dict:
        now = datetime.now(timezone.utc).isoformat()
        slug = self._team_to_espn_slug(team_name)

        try:
            resp = requests.get(f"{ESPN_BASE}/teams/{slug}/schedule", timeout=8)
            resp.raise_for_status()
            data = resp.json()
            last_5 = []
            events = data.get("events", [])[-5:]
            for event in events:
                comp = event.get("competitions", [{}])[0]
                opponents = comp.get("competitors", [])
                if len(opponents) >= 2:
                    team1 = opponents[0]["team"]["displayName"]
                    team2 = opponents[1]["team"]["displayName"]
                    opponent = team2 if team1.lower().strip() == team_name.lower().strip() else team1
                    score1 = opponents[0].get("score", {}).get("value")
                    score2 = opponents[1].get("score", {}).get("value")
                    score_str = f"{score1}-{score2}" if score1 is not None else "?"
                    winner = comp.get("competitors", [{}])[0].get("winner", False)
                    is_home = team1.lower().strip() == team_name.lower().strip()
                    result = "W" if (winner and is_home) or (not winner and not is_home) else "L" if not winner and is_home else "D"
                    last_5.append({
                        "opponent": opponent,
                        "result": result,
                        "score": score_str,
                        "date": event.get("date", ""),
                    })
            if last_5:
                form_string = "".join(g["result"] for g in last_5)
                wins = sum(1 for g in last_5 if g["result"] == "W")
                draws = sum(1 for g in last_5 if g["result"] == "D")
                losses = sum(1 for g in last_5 if g["result"] == "L")
                form_rating = min(10, round((wins * 3 + draws * 1) / max(1, len(last_5)) * 10 / 3))
                return {
                    "team": team_name,
                    "last_5": last_5,
                    "form_string": form_string,
                    "wins": wins,
                    "draws": draws,
                    "losses": losses,
                    "form_rating": form_rating,
                    "source": "espn",
                    "fetched_at": now,
                }
        except Exception:
            pass

        return {
            "team": team_name,
            "last_5": [],
            "form_string": "",
            "wins": 0, "draws": 0, "losses": 0,
            "form_rating": 5.0,
            "source": "web",
            "fetched_at": now,
        }

    def get_standings(self, group: str | None = None) -> dict:
        now_ts = datetime.now(timezone.utc).timestamp()
        group_key = group.lower().strip() if group else "all"
        cache_key = f"standings_{group_key}"
        if cache_key in self._cache:
            ts, data = self._cache[cache_key]
            if now_ts - ts < 60:  # 1 minute TTL
                return data

        try:
            res = self._get_standings_uncached(group)
            self._cache[cache_key] = (now_ts, res)
            return res
        except Exception as e:
            if cache_key in self._cache:
                return self._cache[cache_key][1]
            raise e

    def _get_standings_uncached(self, group: str | None = None) -> dict:
        # First, try ESPN
        try:
            resp = requests.get(f"{ESPN_BASE}/standings", timeout=8)
            resp.raise_for_status()
            data = resp.json()
            standings = {}
            for child in data.get("children", []):
                group_name = child.get("name", "Unknown")
                entries = []
                for entry in child.get("standings", {}).get("entries", []):
                    team_data = entry.get("team", {})
                    stats = {s["name"]: s["value"] for s in entry.get("stats", [])}
                    entries.append({
                        "team": team_data.get("displayName", "Unknown"),
                        "played": stats.get("gamesPlayed", 0),
                        "won": stats.get("wins", 0),
                        "drawn": stats.get("ties", 0),
                        "lost": stats.get("losses", 0),
                        "gf": stats.get("pointsFor", 0),
                        "ga": stats.get("pointsAgainst", 0),
                        "gd": stats.get("pointDifferential", 0),
                        "points": stats.get("points", 0),
                    })
                standings[group_name] = entries
            if standings:
                if group:
                    return {k: v for k, v in standings.items() if group.lower() in k.lower()}
                return standings
        except Exception:
            pass

        # Calculate standings from live fixture results (in-play = projected)
        fixtures_data = self.get_fixtures()
        standings: dict[str, dict[str, dict]] = {}

        for group_name, teams in MOCK_GROUPS:
            if group and group.lower() not in group_name.lower():
                continue
            rows = {t: {"team": t, "played": 0, "won": 0, "drawn": 0, "lost": 0,
                        "gf": 0, "ga": 0, "gd": 0, "points": 0} for t in teams}
            for f in fixtures_data.get("fixtures", []):
                home, away = f.get("home"), f.get("away")
                score = f.get("score", {})
                status = f.get("status", "scheduled")
                hs = score.get("home") if isinstance(score, dict) else None
                as_ = score.get("away") if isinstance(score, dict) else None
                if not home or not away or hs is None or as_ is None:
                    continue
                if home in rows:
                    h = rows[home]
                else:
                    continue
                if away in rows:
                    a = rows[away]
                else:
                    continue
                if status not in ("completed", "in_play"):
                    continue
                h["played"] += 1
                a["played"] += 1
                h["gf"] += hs
                h["ga"] += as_
                a["gf"] += as_
                a["ga"] += hs
                if hs > as_:
                    h["won"] += 1
                    h["points"] += 3
                    a["lost"] += 1
                elif hs < as_:
                    a["won"] += 1
                    a["points"] += 3
                    h["lost"] += 1
                else:
                    h["drawn"] += 1
                    a["drawn"] += 1
                    h["points"] += 1
                    a["points"] += 1
            for r in rows.values():
                r["gd"] = r["gf"] - r["ga"]
            sorted_rows = sorted(rows.values(), key=lambda x: (-x["points"], -x["gd"], -x["gf"]))
            standings[group_name] = sorted_rows

        return standings

    def get_player_stats(self, player_name: str) -> dict:
        now_ts = datetime.now(timezone.utc).timestamp()
        cache_key = f"player_{player_name.lower().strip()}"
        if cache_key in self._cache:
            ts, data = self._cache[cache_key]
            if now_ts - ts < 3600:  # 1 hour TTL
                return data

        try:
            res = self._get_player_stats_uncached(player_name)
            self._cache[cache_key] = (now_ts, res)
            return res
        except Exception as e:
            if cache_key in self._cache:
                return self._cache[cache_key][1]
            raise e

    def _get_player_stats_uncached(self, player_name: str) -> dict:
        now = datetime.now(timezone.utc).isoformat()
        try:
            resp = requests.get(
                "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/athletes",
                params={"query": player_name},
                timeout=8,
            )
            resp.raise_for_status()
            data = resp.json()
            athletes = data.get("athletes", [])
            if athletes:
                a = athletes[0]
                return {
                    "name": a.get("displayName", player_name),
                    "team": a.get("team", {}).get("displayName", "Unknown"),
                    "position": a.get("position", {}).get("displayName", "Unknown"),
                    "age": a.get("age"),
                    "jersey": a.get("jersey"),
                    "source": "espn",
                    "fetched_at": now,
                }
        except Exception:
            pass

        return {
            "name": player_name,
            "team": "Unknown",
            "position": "Unknown",
            "age": None,
            "jersey": None,
            "source": "web",
            "fetched_at": now,
        }
