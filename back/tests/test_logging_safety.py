import io
import logging
import os
import unittest
from unittest.mock import patch, MagicMock
from urllib.parse import quote
from core.logging_safety import install_secret_redaction, redact_secrets


class LoggingSafetyTest(unittest.TestCase):
    def test_raw_encoded_and_double_encoded_secrets(self):
        values = {name: f"test-{name}-a+/=secret" for name in (
            "TOUR_API_DECODE_KEY", "OPENAI_API_KEY", "KAKAO_REST_API_KEY",
            "ODSAY_API_KEY", "JWT_SECRET", "TMAP_API_KEY",
        )}
        values["DATABASE_URL"] = "postgresql://user:db-test-password@db.invalid/db"
        with patch.dict(os.environ, values):
            for secret in values.values():
                for candidate in (secret, quote(secret, safe=""), quote(quote(secret, safe=""), safe="")):
                    self.assertNotIn(candidate, redact_secrets(candidate))
            self.assertNotIn("db-test-password", redact_secrets("password failed: db-test-password"))

    def test_unknown_query_keys_and_authorization_are_redacted(self):
        for value in (
            "https://example.invalid/path?serviceKey=unknown-secret&query=anything",
            "/path?apiKey=unknown-secret&x=1",
            "Authorization: Bearer unknown-secret", "KakaoAK unknown-secret",
        ):
            self.assertNotIn("unknown-secret", redact_secrets(value))

    def test_http_client_logging_and_chained_tracebacks(self):
        install_secret_redaction()
        stream = io.StringIO()
        handler = logging.StreamHandler(stream)
        logger = logging.getLogger("httpx.safety_test")
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        try:
            with patch.dict(os.environ, {"TOUR_API_DECODE_KEY": "fake-tour-sensitive-value"}):
                logger.info("HTTP request %s", "https://example.invalid/?serviceKey=fake-tour-sensitive-value")
                try:
                    try:
                        raise ValueError("fake-tour-sensitive-value")
                    except ValueError as exc:
                        raise RuntimeError("request failed") from exc
                except RuntimeError:
                    logger.exception("request failure")
            self.assertNotIn("fake-tour-sensitive-value", stream.getvalue())
            self.assertIn("RuntimeError", stream.getvalue())
        finally:
            logger.removeHandler(handler)

    def test_exception_and_nested_arguments_are_redacted(self):
        install_secret_redaction()
        with patch.dict(os.environ, {"ODSAY_API_KEY": "fake-nested-secret"}):
            for argument in (ValueError("fake-nested-secret"), {"nested": ["fake-nested-secret"]}):
                record = logging.getLogger("httpx").makeRecord(
                    "httpx", logging.ERROR, __file__, 1, "%s", (argument,), None,
                )
                self.assertNotIn("fake-nested-secret", record.getMessage())

    def test_jwt_secret_has_no_embedded_fallback(self):
        from core.security import get_jwt_secret
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "JWT_SECRET is required"):
                get_jwt_secret()
        with patch.dict(os.environ, {"JWT_SECRET": "fake-configured-secret"}):
            self.assertEqual(get_jwt_secret(), "fake-configured-secret")

    def test_uvicorn_access_formatter_still_works(self):
        from uvicorn.logging import AccessFormatter
        install_secret_redaction()
        record = logging.getLogger("uvicorn.access").makeRecord(
            "uvicorn.access", logging.INFO, __file__, 1, '%s - "%s %s HTTP/%s" %d',
            ("127.0.0.1:1234", "GET", "/api/search?serviceKey=unknown-secret", "1.1", 200), None,
        )
        message = AccessFormatter('%(client_addr)s %(request_line)s %(status_code)s', use_colors=False).format(record)
        self.assertIn("200", message)
        self.assertNotIn("unknown-secret", message)

    def test_tour_exception_is_logged_without_request_url(self):
        import requests
        from services import simulation_service
        with (
            patch.object(simulation_service, "load_detail_cache", return_value={}),
            patch.object(simulation_service, "API_KEY", "fake-tour-sensitive-value"),
            patch.object(simulation_service._tour_session, "get", side_effect=requests.ConnectTimeout(
                "https://example.invalid/?serviceKey=fake-tour-sensitive-value"
            )),
            self.assertLogs(simulation_service.logger, level="WARNING") as capture,
        ):
            self.assertEqual(simulation_service.fetch_detail_intro(999, "12"), {})
        self.assertNotIn("fake-tour-sensitive-value", str(capture.output))
        self.assertNotIn("https://", str(capture.output))
        self.assertIn("ConnectTimeout", str(capture.output))

    def test_unexpected_endpoint_error_does_not_return_secret(self):
        from fastapi import FastAPI
        from fastapi.testclient import TestClient
        from routers import simulation
        from db.database import get_db
        app = FastAPI()
        app.include_router(simulation.router)
        app.dependency_overrides[get_db] = lambda: MagicMock()
        with patch.object(simulation, "get_route_info_with_cache", side_effect=RuntimeError("fake-sensitive-value")):
            response = TestClient(app).post("/api/route/transit-info", json={
                "origin": {"contentid": 1, "mapx": 127, "mapy": 37},
                "destination": {"contentid": 2, "mapx": 128, "mapy": 38},
            })
        self.assertEqual(response.status_code, 500)
        self.assertNotIn("fake-sensitive-value", response.text)
