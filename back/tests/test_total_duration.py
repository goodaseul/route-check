import copy
import unittest
from unittest.mock import MagicMock, patch
from services import simulation_service as service


class InterDayTotalDurationTest(unittest.TestCase):
    def test_split_days_include_290_minutes_without_changing_score_or_distance(self):
        places = [
            {"sequence": 1, "contentid": -101, "title": "A", "mapx": 126.977, "mapy": 37.5796, "stay_duration_minutes": 60},
            {"sequence": 2, "contentid": -102, "title": "B", "mapx": 129.35, "mapy": 35.53, "stay_duration_minutes": 60},
        ]
        before = {"start_date": "2026-09-17", "end_date": "2026-09-19", "transport_mode": "car", "days": [
            {"day_number": 1, "date": "2026-09-17", "places": places},
            {"day_number": 2, "date": "2026-09-18", "places": []},
            {"day_number": 3, "date": "2026-09-19", "places": []},
        ]}
        after = copy.deepcopy(before)
        moved = after["days"][0]["places"].pop()
        moved["sequence"] = 1
        after["days"][2]["places"] = [moved]
        route = {"distance_km": 370.1, "duration_minutes": 290, "estimated_fare": 0, "source": "api"}
        with patch.object(service, "fetch_detail_intro", return_value={}), patch.object(service, "get_route_info_with_cache", return_value=route):
            original = service.analyze_itinerary(before, MagicMock(), include_llm=False)
            split = service.analyze_itinerary(after, MagicMock(), include_llm=False)
        self.assertEqual(original["summary"]["total_duration_minutes"], 410)
        self.assertEqual(split["summary"]["total_duration_minutes"], 410)
        self.assertEqual(split["summary"]["total_transit_time_minutes"], 290)
        self.assertEqual(split["summary"]["total_distance_km"], 370.1)
        self.assertEqual(len(split["inter_day_transits"]), 1)
        self.assertEqual(split["overall_score"], original["overall_score"])
        self.assertEqual([w["type"] for w in split["warnings"]], [w["type"] for w in original["warnings"]])
