import json
import os
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from services import simulation_service


class SimulationScoreAuthorityTest(unittest.TestCase):
    def test_llm_cannot_override_deterministic_analysis_fields(self):
        timeline = [
            {
                "sequence": 1,
                "contentid": 1,
                "title": "테스트 장소",
                "start_time": "09:00",
                "end_time": "10:00",
                "stay_duration_minutes": 60,
                "transit_to_next": None,
                "congestion": {
                    "peak_start": "09:30",
                    "peak_end": "11:00",
                    "is_overlap": True,
                    "basis": "rule_based_estimate",
                },
            }
        ]
        warnings = [
            {
                "type": "PEAK_CONGESTION_OVERLAP",
                "contentid": 1,
                "title": "테스트 장소",
                "message": "예상 혼잡 시간과 겹칩니다.",
            }
        ]
        itinerary = {
            "start_date": "2026-08-22",
            "end_date": "2026-08-22",
            "transport_mode": "car",
            "days": [
                {
                    "day_number": 1,
                    "date": "2026-08-22",
                    "places": [
                        {
                            "sequence": 1,
                            "contentid": 1,
                            "title": "테스트 장소",
                            "mapx": 127.0,
                            "mapy": 37.0,
                        }
                    ],
                }
            ],
        }

        malicious_llm_payload = {
            "status_description": "사용자 친화적인 설명",
            "total_score": 1,
            "status_message": "LLM이 만든 상태",
            "suggestions": [{"applied_route": ["A", "B", "C"]}],
        }
        completion = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        content=json.dumps(malicious_llm_payload, ensure_ascii=False)
                    )
                )
            ]
        )
        client = MagicMock()
        client.chat.completions.create.return_value = completion

        with (
            patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}),
            patch.object(
                simulation_service,
                "calculate_day_timeline",
                return_value=(timeline, warnings, 0.0, 0.0),
            ),
            patch("openai.OpenAI", return_value=client),
        ):
            result = simulation_service.analyze_itinerary(itinerary, MagicMock())

        self.assertEqual(result["overall_score"], 95)
        self.assertEqual(result["total_score"], 95)
        self.assertEqual(result["status_label"], "여유롭고 알찬 일정")
        self.assertEqual(result["status_message"], "여유롭고 알찬 일정")
        self.assertEqual(result["status_description"], "사용자 친화적인 설명")
        self.assertEqual(len(result["suggestions"]), 1)
        self.assertEqual(result["suggestions"][0]["applied_route"], [])
        self.assertNotIn("A", json.dumps(result["suggestions"], ensure_ascii=False))


class ApplyReorderSuggestionTest(unittest.TestCase):
    def setUp(self):
        self.itinerary = {
            "start_date": "2026-08-22",
            "end_date": "2026-08-22",
            "transport_mode": "car",
            "days": [
                {
                    "day_number": 1,
                    "date": "2026-08-22",
                    "places": [
                        {"sequence": 1, "contentid": 10, "title": "A"},
                        {"sequence": 2, "contentid": 20, "title": "B"},
                        {"sequence": 3, "contentid": 30, "title": "C"},
                    ],
                }
            ],
        }

    def test_reorders_places_and_returns_comparison(self):
        previous = {
            "total_score": 80,
            "summary": {
                "total_distance_km": 12.0,
                "total_transit_time_minutes": 50,
            },
        }
        updated = {
            "total_score": 90,
            "summary": {
                "total_distance_km": 8.5,
                "total_transit_time_minutes": 35,
            },
        }
        payload = {
            "itinerary": self.itinerary,
            "suggestion_id": "reorder-day-1-1-3-2",
            "day_number": 1,
            "ordered_contentids": [10, 30, 20],
        }

        with patch.object(
            simulation_service,
            "analyze_itinerary",
            side_effect=[previous, updated],
        ) as analyze:
            result = simulation_service.apply_reorder_suggestion(
                payload, MagicMock()
            )

        places = result["updated_itinerary"]["days"][0]["places"]
        self.assertEqual([place["contentid"] for place in places], [10, 30, 20])
        self.assertEqual([place["sequence"] for place in places], [1, 2, 3])
        self.assertEqual(result["comparison"]["score_delta"], 10)
        self.assertEqual(result["comparison"]["distance_saved_km"], 3.5)
        self.assertEqual(result["comparison"]["transit_minutes_saved"], 15)
        self.assertEqual(analyze.call_count, 2)
        self.assertTrue(all(call.kwargs["include_llm"] is False for call in analyze.call_args_list))

    def test_rejects_missing_or_duplicate_places(self):
        payload = {
            "itinerary": self.itinerary,
            "suggestion_id": "invalid",
            "day_number": 1,
            "ordered_contentids": [10, 20, 20],
        }

        with self.assertRaisesRegex(ValueError, "동일한 장소"):
            simulation_service.apply_reorder_suggestion(payload, MagicMock())


class ApplyTransportSuggestionTest(unittest.TestCase):
    def setUp(self):
        self.itinerary = {
            "start_date": "2026-08-22",
            "end_date": "2026-08-22",
            "transport_mode": "public",
            "days": [
                {
                    "day_number": 1,
                    "date": "2026-08-22",
                    "places": [
                        {"sequence": 1, "contentid": 10, "title": "A"},
                        {"sequence": 2, "contentid": 20, "title": "B"},
                        {"sequence": 3, "contentid": 30, "title": "C"},
                    ],
                }
            ],
        }

    @staticmethod
    def analysis_result(score, distance, minutes, fare):
        return {
            "total_score": score,
            "summary": {
                "total_distance_km": distance,
                "total_transit_time_minutes": minutes,
            },
            "timeline": [
                {
                    "schedule": [
                        {"transit_to_next": {"estimated_fare": fare}},
                        {"transit_to_next": None},
                    ]
                }
            ],
        }

    def test_changes_only_target_segment_and_returns_time_fare_comparison(self):
        previous = self.analysis_result(80, 12.0, 70, 3100)
        updated = self.analysis_result(88, 12.5, 45, 1550)
        payload = {
            "itinerary": self.itinerary,
            "suggestion_id": "transport-day-1-10-20-car",
            "day_number": 1,
            "origin_contentid": 10,
            "destination_contentid": 20,
            "from_mode": "public",
            "to_mode": "car",
        }

        with patch.object(
            simulation_service,
            "analyze_itinerary",
            side_effect=[previous, updated],
        ) as analyze:
            result = simulation_service.apply_transport_suggestion(
                payload, MagicMock()
            )

        places = result["updated_itinerary"]["days"][0]["places"]
        self.assertEqual(places[0]["transport_mode_to_next"], "car")
        self.assertNotIn("transport_mode_to_next", places[1])
        self.assertEqual(result["comparison"]["transit_minutes_saved"], 25)
        self.assertEqual(result["comparison"]["previous_estimated_fare"], 3100)
        self.assertEqual(result["comparison"]["updated_estimated_fare"], 1550)
        self.assertEqual(result["comparison"]["estimated_fare_delta"], -1550)
        self.assertEqual(analyze.call_count, 2)
        self.assertTrue(
            all(call.kwargs["include_llm"] is False for call in analyze.call_args_list)
        )

    def test_rejects_non_adjacent_segment(self):
        payload = {
            "itinerary": self.itinerary,
            "suggestion_id": "invalid",
            "day_number": 1,
            "origin_contentid": 10,
            "destination_contentid": 30,
            "from_mode": "public",
            "to_mode": "car",
        }

        with self.assertRaisesRegex(ValueError, "연속된 구간"):
            simulation_service.apply_transport_suggestion(payload, MagicMock())


if __name__ == "__main__":
    unittest.main()
