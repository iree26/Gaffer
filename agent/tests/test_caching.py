import pytest
from unittest.mock import patch
from data.scraper import FootballScraper

def test_fixtures_caching():
    scraper = FootballScraper()
    dummy = {"fixtures": [{"id": "test_m1", "match": "A vs B", "status": "completed", "score": {"home": 1, "away": 0}}]}
    
    with patch.object(scraper, "_get_fixtures_uncached", return_value=dummy) as mock_uncached:
        # First call: should fetch and cache
        r1 = scraper.get_fixtures()
        assert r1 == dummy
        mock_uncached.assert_called_once()
        
        # Second call: should use cached value and not call mock_uncached again
        mock_uncached.reset_mock()
        r2 = scraper.get_fixtures()
        assert r2 == dummy
        mock_uncached.assert_not_called()

def test_team_form_caching():
    scraper = FootballScraper()
    dummy_form = {"team": "Senegal", "form_string": "WWWWW"}
    
    with patch.object(scraper, "_get_team_form_uncached", return_value=dummy_form) as mock_uncached:
        # First call: should fetch and cache
        r1 = scraper.get_team_form("Senegal")
        assert r1 == dummy_form
        mock_uncached.assert_called_once()
        
        # Second call: should use cached value
        mock_uncached.reset_mock()
        r2 = scraper.get_team_form("Senegal")
        assert r2 == dummy_form
        mock_uncached.assert_not_called()
