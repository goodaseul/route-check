import json
import os
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
import requests

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


class ApplyTimeSuggestionTest(unittest.TestCase):
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
                    ],
                }
            ],
        }

    @staticmethod
    def analysis_result(start_time, score, warnings):
        return {
            "total_score": score,
            "summary": {
                "total_distance_km": 3.0,
                "total_transit_time_minutes": 15,
            },
            "timeline": [
                {
                    "day_number": 1,
                    "schedule": [
                        {
                            "contentid": 10,
                            "start_time": start_time,
                            "transit_to_next": {"estimated_fare": 0},
                        },
                        {"contentid": 20, "start_time": "14:30", "transit_to_next": None},
                    ],
                }
            ],
            "warnings": warnings,
        }

    def test_applies_visit_start_time_and_compares_warning_counts(self):
        previous = self.analysis_result(
            "09:00",
            85,
            [
                {"type": "OUT_OF_OPERATING_HOURS"},
                {"type": "PEAK_CONGESTION_OVERLAP"},
            ],
        )
        updated = self.analysis_result("13:00", 100, [])
        payload = {
            "itinerary": self.itinerary,
            "suggestion_id": "time-day-1-10-1300",
            "day_number": 1,
            "contentid": 10,
            "from_time": "09:00",
            "to_time": "13:00",
        }

        with patch.object(
            simulation_service,
            "analyze_itinerary",
            side_effect=[previous, updated],
        ) as analyze:
            result = simulation_service.apply_time_suggestion(payload, MagicMock())

        place = result["updated_itinerary"]["days"][0]["places"][0]
        self.assertEqual(place["visit_start_time"], "13:00")
        self.assertEqual(result["comparison"]["score_delta"], 15)
        self.assertEqual(result["comparison"]["previous_operating_hours_warnings"], 1)
        self.assertEqual(result["comparison"]["updated_operating_hours_warnings"], 0)
        self.assertEqual(result["comparison"]["previous_congestion_warnings"], 1)
        self.assertEqual(result["comparison"]["updated_congestion_warnings"], 0)
        self.assertTrue(
            all(call.kwargs["include_llm"] is False for call in analyze.call_args_list)
        )

    def test_rejects_stale_suggestion_time(self):
        previous = self.analysis_result("10:00", 95, [])
        payload = {
            "itinerary": self.itinerary,
            "suggestion_id": "stale",
            "day_number": 1,
            "contentid": 10,
            "from_time": "09:00",
            "to_time": "13:00",
        }

        with patch.object(simulation_service, "analyze_itinerary", return_value=previous):
            with self.assertRaisesRegex(ValueError, "제안 생성 시점"):
                simulation_service.apply_time_suggestion(payload, MagicMock())

    def test_explicit_start_time_waits_but_never_overlaps_previous_route(self):
        places = [
            {
                "sequence": 1,
                "contentid": 10,
                "title": "A",
                "mapx": 127.0,
                "mapy": 37.0,
                "stay_duration_minutes": 60,
            },
            {
                "sequence": 2,
                "contentid": 20,
                "title": "B",
                "mapx": 127.1,
                "mapy": 37.1,
                "stay_duration_minutes": 60,
                "visit_start_time": "09:30",
            },
        ]
        route = {
            "distance_km": 5.0,
            "duration_minutes": 30,
            "estimated_fare": 0,
            "source": "cache",
        }

        with (
            patch.object(simulation_service, "fetch_detail_intro", return_value={}),
            patch.object(simulation_service, "get_route_info_with_cache", return_value=route),
        ):
            timeline, _, _, _ = simulation_service.calculate_day_timeline(
                places, "2026-08-22", MagicMock(), "car"
            )

        self.assertEqual(timeline[0]["end_time"], "10:00")
        self.assertEqual(timeline[1]["start_time"], "10:30")


class ApplyTripSuggestionTest(unittest.TestCase):
    def setUp(self):
        self.itinerary = {
            "start_date": "2026-08-24",
            "end_date": "2026-08-25",
            "transport_mode": "car",
            "days": [
                {
                    "day_number": 1,
                    "date": "2026-08-24",
                    "places": [
                        {"sequence": 1, "contentid": 10, "title": "A", "mapx": 127.0, "mapy": 37.0},
                        {"sequence": 2, "contentid": 20, "title": "B", "mapx": 127.1, "mapy": 37.1},
                    ],
                },
                {
                    "day_number": 2,
                    "date": "2026-08-25",
                    "places": [
                        {"sequence": 1, "contentid": 30, "title": "C", "mapx": 127.2, "mapy": 37.2},
                    ],
                },
            ],
        }

    @staticmethod
    def result(score, closed_count):
        return {
            "total_score": score,
            "summary": {
                "total_distance_km": 10.0,
                "total_transit_time_minutes": 40,
            },
            "timeline": [],
            "warnings": [{"type": "CLOSED_PLACE"}] * closed_count,
        }

    def test_moves_place_to_another_day_and_resequences(self):
        payload = {
            "itinerary": self.itinerary,
            "suggestion_id": "move-day-1-2-20",
            "action": "MOVE_PLACE_DAY",
            "contentid": 20,
            "from_day_number": 1,
            "to_day_number": 2,
        }
        with patch.object(
            simulation_service,
            "analyze_itinerary",
            side_effect=[self.result(80, 1), self.result(95, 0)],
        ):
            result = simulation_service.apply_trip_suggestion(payload, MagicMock())

        days = result["updated_itinerary"]["days"]
        self.assertEqual([place["contentid"] for place in days[0]["places"]], [10])
        self.assertEqual([place["contentid"] for place in days[1]["places"]], [30, 20])
        self.assertEqual([place["sequence"] for place in days[1]["places"]], [1, 2])
        self.assertEqual(result["comparison"]["previous_closed_place_warnings"], 1)
        self.assertEqual(result["comparison"]["updated_closed_place_warnings"], 0)

    def test_replaces_closed_place_with_local_candidate(self):
        payload = {
            "itinerary": self.itinerary,
            "suggestion_id": "replace-day-1-20-99",
            "action": "REPLACE_CLOSED_PLACE",
            "contentid": 20,
            "from_day_number": 1,
            "replacement_contentid": 99,
        }
        replacement = {
            "title": "대체 장소",
            "mapx": 127.11,
            "mapy": 37.11,
        }
        with (
            patch.dict(simulation_service.places_cache, {99: replacement}),
            patch.object(
                simulation_service,
                "analyze_itinerary",
                side_effect=[self.result(80, 1), self.result(95, 0)],
            ),
        ):
            result = simulation_service.apply_trip_suggestion(payload, MagicMock())

        place = result["updated_itinerary"]["days"][0]["places"][1]
        self.assertEqual(place["contentid"], 99)
        self.assertEqual(place["title"], "대체 장소")

    def test_global_optimization_balances_days(self):
        self.itinerary["days"][0]["places"].extend([
            {"sequence": 3, "contentid": 40, "title": "D"},
            {"sequence": 4, "contentid": 50, "title": "E"},
        ])
        payload = {
            "itinerary": self.itinerary,
            "suggestion_id": "optimize-entire-trip",
            "action": "OPTIMIZE_TRIP",
        }
        with (
            patch.object(simulation_service, "get_closed_days_for_place", return_value=[]),
            patch.object(simulation_service, "suggest_optimized_order", side_effect=lambda places: [p["sequence"] for p in places]),
            patch.object(
                simulation_service,
                "analyze_itinerary",
                side_effect=[self.result(90, 0), self.result(95, 0)],
            ),
        ):
            result = simulation_service.apply_trip_suggestion(payload, MagicMock())

        counts = [len(day["places"]) for day in result["updated_itinerary"]["days"]]
        self.assertLessEqual(max(counts) - min(counts), 1)

    def test_entire_trip_optimization_preserves_inter_day_distance(self):
        # 370km / 332분 회귀 테스트 (서울 경복궁 - 울산 경복궁)
        db = MagicMock()
        mock_route = {
            "distance_km": 370.0,
            "duration_minutes": 332,
            "estimated_fare": 350000,
            "source": "api"
        }

        # 최적화 전: 1일차에 두 장소가 모두 있어서 370km 발생
        itinerary_before = {
            "start_date": "2026-08-25",
            "end_date": "2026-08-26",
            "transport_mode": "car",
            "days": [
                {
                    "day_number": 1,
                    "date": "2026-08-25",
                    "places": [
                        {"sequence": 1, "contentid": 126508, "title": "서울 경복궁", "mapx": 126.977, "mapy": 37.5796},
                        {"sequence": 2, "contentid": 2733967, "title": "울산 경복궁", "mapx": 129.256, "mapy": 35.539},
                    ],
                },
                {
                    "day_number": 2,
                    "date": "2026-08-26",
                    "places": [],
                },
            ],
        }

        # 최적화 후: 1일차 서울, 2일차 울산으로 분할된 경우
        itinerary_after = {
            "start_date": "2026-08-25",
            "end_date": "2026-08-26",
            "transport_mode": "car",
            "days": [
                {
                    "day_number": 1,
                    "date": "2026-08-25",
                    "places": [
                        {"sequence": 1, "contentid": 126508, "title": "서울 경복궁", "mapx": 126.977, "mapy": 37.5796},
                    ],
                },
                {
                    "day_number": 2,
                    "date": "2026-08-26",
                    "places": [
                        {"sequence": 1, "contentid": 2733967, "title": "울산 경복궁", "mapx": 129.256, "mapy": 35.539},
                    ],
                },
            ],
        }

        with patch.object(simulation_service, "get_route_info_with_cache", return_value=mock_route):
            res_before = simulation_service.analyze_itinerary(itinerary_before, db, include_llm=False)
            res_after = simulation_service.analyze_itinerary(itinerary_after, db, include_llm=False)

        # 1. 최적화 후 날짜가 분할되어도 실제 이동(370km / 332분)이 0으로 사라지지 않아야 함
        # 1. 최적화 후 날짜가 분할되어도 실제 이동(370km / 332분)이 0으로 사라지지 않아야 함
        self.assertGreater(res_after["summary"]["total_distance_km"], 0)
        self.assertGreater(res_after["summary"]["total_transit_time_minutes"], 0)
        self.assertEqual(res_after["summary"]["total_distance_km"], 370.0)
        self.assertEqual(res_after["summary"]["total_transit_time_minutes"], 332)
        # 날짜 간 이동시간(332분)이 총 소요시간(기본 체류 90분*2 + 이동 332분 = 512분)에 반영되어야 함
        self.assertEqual(res_after["summary"]["total_duration_minutes"], 180 + 332)

        # 2. 전후 비교 시 잘못된 370km 절감이 발생하지 않아야 함
        comparison = simulation_service.build_full_comparison(res_before, res_after)
        self.assertEqual(comparison["distance_saved_km"], 0.0)
        self.assertEqual(comparison["transit_minutes_saved"], 0)

    def test_inter_day_transit_included_in_total_duration_minutes(self):
        """날짜가 나뉜 일정에서 290분 이동시간이 total_duration_minutes(120+290=410분)에 반영되는지 검증"""
        db = MagicMock()
        mock_route = {
            "distance_km": 370.1,
            "duration_minutes": 290,
            "estimated_fare": 350000,
            "source": "api"
        }
        itinerary = {
            "start_date": "2026-10-01",
            "end_date": "2026-10-02",
            "transport_mode": "car",
            "days": [
                {
                    "day_number": 1,
                    "date": "2026-10-01",
                    "places": [
                        {"sequence": 1, "contentid": 126508, "title": "서울 경복궁", "mapx": 126.977, "mapy": 37.5796, "stay_duration_minutes": 60},
                    ],
                },
                {
                    "day_number": 2,
                    "date": "2026-10-02",
                    "places": [
                        {"sequence": 1, "contentid": 2733967, "title": "울산 경복궁", "mapx": 129.256, "mapy": 35.539, "stay_duration_minutes": 60},
                    ],
                },
            ],
        }
        with patch.object(simulation_service, "get_route_info_with_cache", return_value=mock_route):
            res = simulation_service.analyze_itinerary(itinerary, db, include_llm=False)

        summary = res["summary"]
        self.assertEqual(summary["total_distance_km"], 370.1)
        self.assertEqual(summary["total_transit_time_minutes"], 290)
        # 각 장소 1시간(60분) 체류 * 2곳 = 120분 + 날짜 간 이동 290분 = 410분
        self.assertEqual(summary["total_duration_minutes"], 120 + 290)

    def test_tour_api_error_does_not_leak_secret_key(self):
        """TourAPI 및 외부 API 호출 실패 시 Secret Key 실제 값이 로그에 노출되지 않음을 검증"""
        secret_key_mock = "SUPER_CONFIDENTIAL_TOUR_API_KEY_12345"
        with patch.object(simulation_service, "API_KEY", secret_key_mock), \
             patch.object(simulation_service, "load_detail_cache", return_value={}), \
             patch.object(simulation_service._tour_session, "get", side_effect=requests.exceptions.ConnectTimeout("Connect timeout to https://apis.data.go.kr/B551011/KorService2/detailIntro2?serviceKey=" + secret_key_mock)), \
             self.assertLogs(simulation_service.logger, level="WARNING") as log_cm:

            detail = simulation_service.fetch_detail_intro(999999, "12")
            self.assertEqual(detail, {})

            # 로그에 secret_key_mock이 전혀 노출되지 않아야 함
            for log_msg in log_cm.output:
                self.assertNotIn(secret_key_mock, log_msg)


class SimulationValidationTest(unittest.TestCase):
    def test_invalid_start_date(self):
        from schemas.simulation import SimulationRequest
        from pydantic import ValidationError

        with self.assertRaises(ValidationError):
            SimulationRequest(
                start_date="not-a-date",
                end_date="2026-08-26",
                transport_mode="car",
                days=[{"day_number": 1, "date": "2026-08-26", "places": [{"sequence": 1, "contentid": 1, "mapx": 127.0, "mapy": 37.0}]}]
            )

    def test_invalid_end_date(self):
        from schemas.simulation import SimulationRequest
        from pydantic import ValidationError

        with self.assertRaises(ValidationError):
            SimulationRequest(
                start_date="2026-08-25",
                end_date="2026-02-30",  # invalid date
                transport_mode="car",
                days=[{"day_number": 1, "date": "2026-08-25", "places": [{"sequence": 1, "contentid": 1, "mapx": 127.0, "mapy": 37.0}]}]
            )

    def test_start_date_greater_than_end_date(self):
        from schemas.simulation import SimulationRequest
        from pydantic import ValidationError

        with self.assertRaises(ValidationError):
            SimulationRequest(
                start_date="2026-08-30",
                end_date="2026-08-20",
                transport_mode="car",
                days=[{"day_number": 1, "date": "2026-08-30", "places": [{"sequence": 1, "contentid": 1, "mapx": 127.0, "mapy": 37.0}]}]
            )

    def test_invalid_day_date(self):
        from schemas.simulation import SimulationRequest
        from pydantic import ValidationError

        with self.assertRaises(ValidationError):
            SimulationRequest(
                start_date="2026-08-20",
                end_date="2026-08-25",
                transport_mode="car",
                days=[{"day_number": 1, "date": "invalid-date", "places": [{"sequence": 1, "contentid": 1, "mapx": 127.0, "mapy": 37.0}]}]
            )

    def test_day_date_out_of_range(self):
        from schemas.simulation import SimulationRequest
        from pydantic import ValidationError

        with self.assertRaises(ValidationError):
            SimulationRequest(
                start_date="2026-08-20",
                end_date="2026-08-22",
                transport_mode="car",
                days=[{"day_number": 1, "date": "2026-08-25", "places": [{"sequence": 1, "contentid": 1, "mapx": 127.0, "mapy": 37.0}]}]
            )

    def test_empty_days(self):
        from schemas.simulation import SimulationRequest
        from pydantic import ValidationError

        with self.assertRaises(ValidationError):
            SimulationRequest(
                start_date="2026-08-20",
                end_date="2026-08-22",
                transport_mode="car",
                days=[]
            )

    def test_empty_places(self):
        from schemas.simulation import SimulationRequest
        from pydantic import ValidationError

        with self.assertRaises(ValidationError):
            SimulationRequest(
                start_date="2026-08-20",
                end_date="2026-08-22",
                transport_mode="car",
                days=[{"day_number": 1, "date": "2026-08-20", "places": []}]
            )

    def test_missing_coordinates_when_not_in_cache(self):
        from schemas.simulation import SimulationRequest
        from pydantic import ValidationError

        with self.assertRaises(ValidationError):
            SimulationRequest(
                start_date="2026-08-20",
                end_date="2026-08-22",
                transport_mode="car",
                days=[{"day_number": 1, "date": "2026-08-20", "places": [{"sequence": 1, "contentid": 99999999, "mapx": None, "mapy": None}]}]
            )


if __name__ == "__main__":
    unittest.main()
