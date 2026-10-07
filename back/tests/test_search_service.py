import copy
import json
import unittest
from unittest.mock import MagicMock, patch

import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient
from routers.search import router
from services import search_service as service
from urllib3.exceptions import ReadTimeoutError


ORIGIN = "https://route-check-dramz.vercel.app"
SUCCESS = {
    "response": {
        "header": {"resultCode": "0000", "resultMsg": "OK"},
        "body": {"totalCount": 1, "items": {"item": [{
            "contentid": "123", "title": "경복궁", "mapx": "126.97", "mapy": "37.57",
        }]}},
    },
}


def response(payload=SUCCESS, status=200):
    result = MagicMock(spec=requests.Response)
    result.status_code = status
    result.json.return_value = copy.deepcopy(payload)
    return result


class TourAPIParsingBoundaryTest(unittest.TestCase):
    def payload(self, total, **fields):
        return {"response": {"header": {"resultCode": "0000"},
                             "body": {"totalCount": total, **fields}}}

    def test_zero_total_accepts_absent_or_empty_items(self):
        for fields in ({}, {"items": {}}, {"items": ""}, {"items": []},
                       {"items": {"item": None}}, {"items": {"item": {}}},
                       {"items": {"item": []}}):
            with self.subTest(fields=fields):
                frame, total, code = service._parse_response(self.payload(0, **fields))
                self.assertTrue(frame.empty)
                self.assertEqual((total, code), (0, "0000"))

    def test_nonzero_total_rejects_absent_or_effectively_empty_items(self):
        for fields in ({}, {"items": {}}, {"items": ""}, {"items": []},
                       {"items": {"item": None}}, {"items": {"item": {}}},
                       {"items": {"item": []}}, {"items": {"item": [{}]}},
                       {"items": {"item": [{}, {}]}},
                       {"items": {"item": [{"title": "  ", "contentid": None}]}}):
            with self.subTest(fields=fields):
                with self.assertRaises(ValueError):
                    service._parse_response(self.payload(1, **fields))

    def test_valid_single_object_and_paginated_list(self):
        first = {"contentid": "123", "title": "경복궁"}
        second = {"contentid": "456", "title": "창덕궁"}
        for total, item, expected in ((1, first, [first]), (100, [first, second], [first, second])):
            with self.subTest(total=total, item=item):
                frame, actual_total, code = service._parse_response(
                    self.payload(total, items={"item": item})
                )
                self.assertEqual(frame.to_dict("records"), expected)
                self.assertEqual((actual_total, code), (total, "0000"))


class SearchReliabilityTest(unittest.TestCase):
    paths = ("/api/search?keyword=private-query&numOfRows=2", "/api/recommendations?numOfRows=2")

    def setUp(self):
        app = FastAPI()
        app.add_middleware(CORSMiddleware, allow_origins=[ORIGIN], allow_methods=["*"], allow_headers=["*"])
        app.include_router(router)
        self.client = TestClient(app)
        self.get = self.enterContext(patch.object(service._session, "get"))
        self.sleep = self.enterContext(patch.object(service.time, "sleep"))
        self.enterContext(patch.object(service, "API_KEY", "fake-tour-secret"))

    def request(self, path):
        return self.client.get(path, headers={"Origin": ORIGIN})

    def assert_error(self, result, status, code):
        self.assertEqual(result.status_code, status)
        self.assertEqual(result.json()["detail"]["error"]["code"], code)
        self.assertIsInstance(result.json()["detail"]["error"]["message"], str)
        self.assertEqual(result.headers["access-control-allow-origin"], ORIGIN)
        for sensitive in ("fake-tour-secret", "serviceKey", "https://", "private-query"):
            self.assertNotIn(sensitive, result.text)

    def reset(self):
        self.get.reset_mock(side_effect=True)
        self.sleep.reset_mock()

    def test_first_success_preserves_contract_and_request(self):
        for path in self.paths:
            with self.subTest(path=path):
                self.reset()
                upstream = response()
                self.get.return_value = upstream
                result = self.request(path)
                self.assertEqual(result.status_code, 200)
                self.assertEqual(result.json()["total_count"], 1)
                self.assertEqual(result.json()["results"][0]["title"], "경복궁")
                self.assertEqual(set(result.json()), {"keyword", "total_count", "results"} if "search?" in path else {"total_count", "results"})
                self.get.assert_called_once()
                self.sleep.assert_not_called()
                self.assertEqual(self.get.call_args.kwargs["timeout"], (2, 3))
                self.assertFalse(self.get.call_args.kwargs["allow_redirects"])
                self.assertEqual(self.get.call_args.kwargs["params"]["serviceKey"], "fake-tour-secret")
                upstream.close.assert_called_once()

    def test_normal_empty_results_do_not_retry(self):
        for path in self.paths:
            for items in ("", {}, {"item": []}):
                with self.subTest(path=path, items=items):
                    self.reset()
                    payload = copy.deepcopy(SUCCESS)
                    payload["response"]["body"] = {"totalCount": "0", "items": items}
                    self.get.return_value = response(payload)
                    result = self.request(path)
                    self.assertEqual(result.status_code, 200)
                    self.assertEqual(result.json()["results"], [])
                    self.assertEqual(result.json()["total_count"], 0)
                    self.get.assert_called_once()
                    self.sleep.assert_not_called()

    def test_empty_item_boundary_is_forwarded_by_both_endpoints(self):
        for path in self.paths:
            for total, fields, expected_status in (
                (0, {}, 200), (0, {"items": {"item": []}}, 200),
                (1, {"items": {"item": {}}}, 502),
            ):
                with self.subTest(path=path, total=total):
                    self.reset()
                    payload = copy.deepcopy(SUCCESS)
                    payload["response"]["body"] = {"totalCount": total, **fields}
                    self.get.return_value = response(payload)
                    result = self.request(path)
                    if expected_status == 502:
                        self.assert_error(result, 502, "UPSTREAM_BAD_GATEWAY")
                    else:
                        self.assertEqual(result.status_code, 200)
                        self.assertEqual(result.json()["results"], [])
                        self.assertEqual(result.json()["total_count"], 0)
                    self.get.assert_called_once()
                    self.sleep.assert_not_called()

    def test_transient_connection_failure_then_success(self):
        for path in self.paths:
            for error in (requests.ConnectTimeout, requests.ReadTimeout, requests.ConnectionError):
                with self.subTest(path=path, error=error):
                    self.reset()
                    self.get.side_effect = [error("https://invalid/?serviceKey=fake-tour-secret"), response()]
                    with self.assertLogs(service.logger, level="INFO") as logs:
                        result = self.request(path)
                    self.assertEqual(result.status_code, 200)
                    self.assertEqual(result.json()["total_count"], 1)
                    self.assertEqual(self.get.call_count, 2)
                    self.sleep.assert_called_once_with(0.2)
                    records = [json.loads(r.getMessage()) for r in logs.records]
                    self.assertFalse(records[0]["final_failure"])
                    self.assertTrue(records[0]["will_retry"])
                    self.assertEqual(records[1]["event"], "tourapi_recovered")
                    self.assertEqual(records[1]["retry_count"], 1)
                    self.assertEqual(records[1]["operation"], "search" if "search?" in path else "recommendations")
                    for secret in ("fake-tour-secret", "serviceKey", "https://", "private-query"):
                        self.assertNotIn(secret, str(logs.output))

    def test_exhausted_timeouts_and_connections(self):
        for path in self.paths:
            for error, status, code in (
                (requests.ConnectTimeout, 504, "UPSTREAM_TIMEOUT"),
                (requests.ReadTimeout, 504, "UPSTREAM_TIMEOUT"),
                (requests.ConnectionError, 502, "UPSTREAM_BAD_GATEWAY"),
            ):
                with self.subTest(path=path, error=error):
                    self.reset()
                    self.get.side_effect = error("fake-tour-secret")
                    with self.assertLogs(service.logger, level="WARNING") as logs:
                        self.assert_error(self.request(path), status, code)
                    self.assertEqual(self.get.call_count, 2)
                    self.sleep.assert_called_once_with(0.2)
                    final = json.loads(logs.records[-1].getMessage())
                    self.assertTrue(final["final_failure"])
                    self.assertEqual(final["retry_count"], 1)

    def test_http_status_retry_policy(self):
        for path in self.paths:
            for status in (301, 400, 401, 403, 404, 429, 500, 502, 503, 504):
                with self.subTest(path=path, status=status):
                    self.reset()
                    self.get.side_effect = [response(status=status), response(status=status)]
                    with self.assertLogs(service.logger, level="WARNING") as logs:
                        self.assert_error(self.request(path), 502, "UPSTREAM_BAD_GATEWAY")
                    expected = 2 if status in (502, 503, 504) else 1
                    self.assertEqual(self.get.call_count, expected)
                    self.assertEqual(self.sleep.call_count, expected - 1)
                    self.assertEqual(json.loads(logs.records[-1].getMessage())["upstream_status"], status)

    def test_transient_http_status_then_success(self):
        for path in self.paths:
            for status in (502, 503, 504):
                with self.subTest(path=path, status=status):
                    self.reset()
                    self.get.side_effect = [response(status=status), response()]
                    self.assertEqual(self.request(path).status_code, 200)
                    self.assertEqual(self.get.call_count, 2)
                    self.sleep.assert_called_once_with(0.2)

    def test_application_errors_do_not_retry_or_leak_provider_message(self):
        for path in self.paths:
            for code in ("20", "22", "05", "fake-tour-secret"):
                with self.subTest(path=path, code=code):
                    self.reset()
                    self.get.return_value = response({"response": {"header": {
                        "resultCode": code, "resultMsg": "https://invalid/?serviceKey=fake-tour-secret",
                    }}})
                    with self.assertLogs(service.logger, level="WARNING") as logs:
                        self.assert_error(self.request(path), 502, "UPSTREAM_BAD_GATEWAY")
                    self.get.assert_called_once()
                    self.sleep.assert_not_called()
                    record = json.loads(logs.records[-1].getMessage())
                    self.assertEqual(record["category"], "ApplicationError")
                    self.assertEqual(record["application_code"], code if code.isdigit() else None)
                    self.assertNotIn("fake-tour-secret", str(logs.output))

    def test_malformed_json_and_response_structures(self):
        malformed = [None, [], {}, {"response": []}, {"response": {"header": {}}}]
        for body in ({}, {"totalCount": "bad", "items": {}}, {"totalCount": -1, "items": {}},
                     {"totalCount": True, "items": {}}, {"totalCount": 1, "items": None},
                     {"totalCount": 1, "items": {"item": ["bad"]}},
                     {"totalCount": 1, "items": {"item": [{"title": ["bad"]}]}},
                     {"totalCount": 0, "items": {"item": [{"title": "inconsistent"}]}}):
            malformed.append({"response": {"header": {"resultCode": "0000"}, "body": body}})
        for path in self.paths:
            for payload in malformed:
                with self.subTest(path=path, payload=payload):
                    self.reset()
                    self.get.return_value = response(payload)
                    self.assert_error(self.request(path), 502, "UPSTREAM_BAD_GATEWAY")
                    self.get.assert_called_once()
                    self.sleep.assert_not_called()
            self.reset()
            bad_json = response()
            bad_json.json.side_effect = ValueError("fake-tour-secret")
            self.get.return_value = bad_json
            self.assert_error(self.request(path), 502, "UPSTREAM_BAD_GATEWAY")
            self.get.assert_called_once()
            bad_json.close.assert_called_once()

    def test_certificate_and_permanent_request_errors_do_not_retry(self):
        for path in self.paths:
            for error in (requests.exceptions.SSLError, requests.exceptions.InvalidURL):
                with self.subTest(path=path, error=error):
                    self.reset()
                    self.get.side_effect = error("fake-tour-secret")
                    self.assert_error(self.request(path), 502, "UPSTREAM_BAD_GATEWAY")
                    self.get.assert_called_once()
                    self.sleep.assert_not_called()

    def test_wrapped_body_read_timeout_maps_to_504(self):
        for path in self.paths:
            with self.subTest(path=path):
                self.reset()
                self.get.side_effect = requests.ConnectionError(
                    ReadTimeoutError(None, "/?serviceKey=fake-tour-secret", "body read timeout")
                )
                self.assert_error(self.request(path), 504, "UPSTREAM_TIMEOUT")
                self.assertEqual(self.get.call_count, 2)

    def test_missing_key_is_an_error_without_network_request(self):
        with patch.object(service, "API_KEY", None):
            for path in self.paths:
                self.assert_error(self.request(path), 502, "UPSTREAM_BAD_GATEWAY")
        self.get.assert_not_called()

    def test_single_item_and_recommendation_filters(self):
        payload = copy.deepcopy(SUCCESS)
        payload["response"]["body"]["items"]["item"] = payload["response"]["body"]["items"]["item"][0]
        self.get.return_value = response(payload)
        result = self.request("/api/recommendations?numOfRows=2&pageNo=3&areaCode=1&sigunguCode=2&contentTypeId=12")
        self.assertEqual(result.status_code, 200)
        self.assertEqual(len(result.json()["results"]), 1)
        params = self.get.call_args.kwargs["params"]
        self.assertEqual({k: params[k] for k in ["numOfRows", "pageNo", "areaCode", "sigunguCode", "contentTypeId"]},
                         {"numOfRows": 2, "pageNo": 3, "areaCode": "1", "sigunguCode": "2", "contentTypeId": "12"})

    def test_validation_and_preflight_do_not_call_upstream(self):
        self.assertEqual(self.request("/api/search").status_code, 422)
        self.assertEqual(self.request("/api/recommendations?numOfRows=0").status_code, 422)
        for path in self.paths:
            r = self.client.options(path, headers={"Origin": ORIGIN, "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "content-type"})
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.headers["access-control-allow-origin"], ORIGIN)
        self.get.assert_not_called()
