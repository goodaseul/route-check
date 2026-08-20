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


if __name__ == "__main__":
    unittest.main()
