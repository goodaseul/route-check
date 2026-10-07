import logging
import os
import json
import re
import time
import requests
import pandas as pd
from urllib3.exceptions import ReadTimeoutError
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

API_KEY = os.getenv("TOUR_API_DECODE_KEY")
BASE_URL = "https://apis.data.go.kr/B551011/KorService2"

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

_session = requests.Session()
_session.headers.update({"User-Agent": "Mozilla/5.0 (compatible; RouteCheck/1.0)"})

CONNECT_TIMEOUT = 2
READ_TIMEOUT = 3
MAX_ATTEMPTS = 2
RETRY_BACKOFF = 0.2
RETRY_HTTP_STATUSES = {502, 503, 504}


class TourAPIError(Exception):
    """Only fixed, public-safe error information crosses the service boundary."""

    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def _log_attempt(endpoint, category, attempt, final_failure, *, http_status=None,
                 application_code=None, recovered=False):
    operation = {"searchKeyword2": "search", "areaBasedList2": "recommendations"}.get(endpoint, "unknown")
    # Application codes are upstream input; never log arbitrary provider text.
    safe_code = str(application_code) if re.fullmatch(r"\d{1,8}", str(application_code)) else None
    entry = {
        "event": "tourapi_recovered" if recovered else "tourapi_failure",
        "operation": operation,
        "category": category,
        "attempt": attempt,
        "retry_count": attempt - 1,
        "max_attempts": MAX_ATTEMPTS,
        "final_failure": final_failure,
        "will_retry": not final_failure and not recovered,
        "upstream_status": http_status,
        "application_code": safe_code,
    }
    logger.log(logging.INFO if recovered else logging.WARNING, json.dumps(entry))


def _bad_gateway():
    return TourAPIError(502, "UPSTREAM_BAD_GATEWAY", "관광정보 제공 서비스의 응답을 처리할 수 없습니다.")


def _parse_response(data):
    if not isinstance(data, dict) or not isinstance(data.get("response"), dict):
        raise ValueError("Invalid response envelope")
    envelope = data["response"]
    header = envelope.get("header")
    if not isinstance(header, dict) or "resultCode" not in header:
        raise ValueError("Missing application status")
    code = header["resultCode"]
    if code != "0000":
        return None, None, code
    body = envelope.get("body")
    if not isinstance(body, dict) or "totalCount" not in body:
        raise ValueError("Missing response body")
    total = body["totalCount"]
    if isinstance(total, bool) or not isinstance(total, (str, int)) or not re.fullmatch(r"\d+", str(total)):
        raise ValueError("Invalid total count")
    items = body.get("items")
    if items is None or items == "" or items == {} or items == []:
        records = []
    elif isinstance(items, dict) and "item" in items:
        records = items["item"]
        if records is None or records == "" or records == {}:
            records = []
        elif isinstance(records, dict):
            records = [records]
        if not isinstance(records, list):
            raise ValueError("Invalid items")
    else:
        raise ValueError("Invalid items envelope")
    if any(not isinstance(row, dict) or any(isinstance(value, (dict, list)) for value in row.values()) for row in records):
        raise ValueError("Invalid item record")
    if any(not any(value is not None and (not isinstance(value, str) or value.strip())
                   for value in row.values()) for row in records):
        raise ValueError("Empty item record")
    if int(total) > 0 and not records:
        raise ValueError("Missing items for nonzero total")
    if int(total) == 0 and records:
        raise ValueError("Inconsistent empty result")
    return pd.DataFrame(records), int(total), code


def fetch_api_data(endpoint: str, params: dict = None) -> tuple[pd.DataFrame, int]:
    if not API_KEY:
        _log_attempt(endpoint, "MissingAPIKey", 1, True)
        raise _bad_gateway()

    url = f"{BASE_URL}/{endpoint}"
    request_params = {
        "serviceKey": API_KEY,
        "MobileOS": "ETC",
        "MobileApp": "RouteCheck",
        "_type": "json",
    }
    if params:
        request_params.update(params)

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            response = _session.get(
                url, params=request_params, timeout=(CONNECT_TIMEOUT, READ_TIMEOUT),
                allow_redirects=False,
            )
        except requests.exceptions.SSLError:
            _log_attempt(endpoint, "SSLError", attempt, True)
            raise _bad_gateway() from None
        except (requests.Timeout, requests.ConnectionError) as exc:
            final = attempt == MAX_ATTEMPTS
            # requests wraps read timeouts during body consumption in ConnectionError.
            timed_out = isinstance(exc, requests.Timeout) or any(
                isinstance(arg, ReadTimeoutError) for arg in exc.args
            )
            category = "ReadTimeout" if timed_out and not isinstance(exc, requests.Timeout) else type(exc).__name__
            _log_attempt(endpoint, category, attempt, final)
            if final:
                if timed_out:
                    raise TourAPIError(504, "UPSTREAM_TIMEOUT", "관광정보 제공 서비스의 응답 시간이 초과되었습니다.") from None
                raise _bad_gateway() from None
            time.sleep(RETRY_BACKOFF)
            continue
        except requests.RequestException:
            _log_attempt(endpoint, "RequestError", attempt, True)
            raise _bad_gateway() from None

        if response.status_code != 200:
            retry = response.status_code in RETRY_HTTP_STATUSES and attempt < MAX_ATTEMPTS
            _log_attempt(endpoint, "HTTPError", attempt, not retry, http_status=response.status_code)
            response.close()
            if retry:
                time.sleep(RETRY_BACKOFF)
                continue
            raise _bad_gateway()

        payload = None
        try:
            payload = response.json()
            frame, total, code = _parse_response(payload)
        except (ValueError, TypeError, KeyError):
            envelope = payload.get("response") if isinstance(payload, dict) else None
            header = envelope.get("header") if isinstance(envelope, dict) else None
            code = header.get("resultCode") if isinstance(header, dict) else None
            _log_attempt(endpoint, "ResponseParsingError", attempt, True, http_status=200, application_code=code)
            raise _bad_gateway() from None
        finally:
            response.close()
        if frame is None:
            _log_attempt(endpoint, "ApplicationError", attempt, True, http_status=200, application_code=code)
            raise _bad_gateway()
        if attempt > 1:
            _log_attempt(endpoint, "Success", attempt, False, http_status=200, application_code=code, recovered=True)
        return frame, total

def get_unified_search(keyword: str, num_of_rows: int = 100, page_no: int = 1) -> tuple[list, int]:
    """
    [통합 검색 핵심 비즈니스 로직]
    - searchKeyword2 API는 키워드 하나로 관광지/숙소/축제를 모두 검색할 수 있는 API
    """
    unified_results = []
    
    params = {
        "keyword": keyword, 
        "numOfRows": num_of_rows, 
        "pageNo": page_no, 
        "arrange": "A"
    }

    df, total_count = fetch_api_data(endpoint="searchKeyword2", params=params)
    
    if not df.empty:
        for _, row in df.iterrows():
            # 원본 데이터를 딕셔너리로 변환 및 NaN 방어 처리
            row_dict = row.to_dict()
            row_dict = {k: (None if pd.isna(v) else v) for k, v in row_dict.items()}
            
            # 신형 분류 체계 코드 추출 (lclsSystm3)
            lcls_code = str(row_dict.get("lclsSystm3") or row_dict.get("lcls_systm3") or "").strip()
            
            # 불필요한 필드 및 삭제 예정 필드 도려내기
            row_dict.pop("areaCode", None)
            row_dict.pop("sigunguCode", None)
            row_dict.pop("cat1", None)
            row_dict.pop("cat2", None)
            row_dict.pop("cat3", None)
            
            unified_results.append(row_dict)
                
    return unified_results, total_count


def get_recommended_places(
    num_of_rows: int = 4,
    page_no: int = 1,
    area_code: str | None = None,
    sigungu_code: str | None = None,
    content_type_id: str | None = None,
) -> tuple[list, int]:
    """관광공사 지역 기반 목록을 인기순으로 조회해 추천 장소를 반환한다."""
    params = {
        "numOfRows": num_of_rows,
        "pageNo": page_no,
        "arrange": "Q",
    }
    if area_code:
        params["areaCode"] = area_code
    if sigungu_code:
        params["sigunguCode"] = sigungu_code
    if content_type_id:
        params["contentTypeId"] = content_type_id

    df, total_count = fetch_api_data(endpoint="areaBasedList2", params=params)
    if df.empty:
        return [], total_count

    results = []
    for _, row in df.iterrows():
        item = {
            key: (None if pd.isna(value) else value)
            for key, value in row.to_dict().items()
        }
        results.append(item)
    return results, total_count
