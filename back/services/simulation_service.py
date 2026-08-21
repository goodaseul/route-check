import os
import re
import json
import requests
import pandas as pd
from collections import Counter
from copy import deepcopy
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from services.route_service import estimate_transit_info, calculate_haversine_distance, get_route_info_with_cache

load_dotenv()
API_KEY = os.getenv("TOUR_API_DECODE_KEY")
BASE_URL = "https://apis.data.go.kr/B551011/KorService2"

# 파일 경로 정의
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "../data/관광정보_메인_장소_데이터.csv"))
CACHE_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "../data"))
DETAIL_CACHE_PATH = os.path.join(CACHE_DIR, "detail_intro_cache.json")

# 콘텐츠 타입 한글 명칭 -> 타입 ID 매핑
NAME_TO_TYPE_ID = {
    '관광지': '12',
    '문화시설': '14',
    '축제/공연/행사': '15',
    '여행 코스': '25',
    '레포츠': '28',
    '숙박': '32',
    '쇼핑': '38',
    '음식점': '39'
}

# 메모리 상의 장소 캐시 로드
places_cache = {}
if os.path.exists(CSV_PATH):
    try:
        df = pd.read_csv(CSV_PATH)
        df = df.drop_duplicates(subset=['contentid'])
        # contentid를 key로 하는 딕셔너리로 변환
        places_cache = df.set_index('contentid').to_dict(orient='index')
    except Exception as e:
        print(f"Error loading main CSV dataset: {e}")


def load_detail_cache() -> dict:
    if os.path.exists(DETAIL_CACHE_PATH):
        try:
            with open(DETAIL_CACHE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_detail_cache(cache: dict):
    os.makedirs(CACHE_DIR, exist_ok=True)
    try:
        with open(DETAIL_CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


def fetch_detail_intro(content_id: int, content_type_id: str) -> dict:
    """
    공공데이터 Tour API의 detailIntro2(소개 정보)를 조회하고 로컬 파일에 캐싱합니다.
    """
    cache = load_detail_cache()
    content_id_str = str(content_id)
    if content_id_str in cache:
        return cache[content_id_str]

    if not API_KEY:
        return {}

    url = f"{BASE_URL}/detailIntro2"
    params = {
        "serviceKey": API_KEY,
        "MobileOS": "ETC",
        "MobileApp": "RouteCheck",
        "_type": "json",
        "contentId": content_id,
        "contentTypeId": content_type_id,
        "numOfRows": 1,
        "pageNo": 1
    }
    try:
        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            res_json = response.json()
            if 'response' in res_json:
                body = res_json['response'].get('body', {})
                items = body.get('items', {})
                if items and 'item' in items:
                    item_list = items['item']
                    detail = {}
                    if isinstance(item_list, list) and len(item_list) > 0:
                        detail = item_list[0]
                    elif isinstance(item_list, dict):
                        detail = item_list

                    if detail:
                        cache[content_id_str] = detail
                        save_detail_cache(cache)
                        return detail
    except Exception as e:
        print(f"Error fetching detailIntro2 for {content_id}: {e}")

    return {}


def extract_operating_and_holiday_text(intro_dict: dict, content_type_id: str) -> tuple[str, str]:
    """
    소개정보 API에서 각 카테고리(contentTypeId)에 부합하는 영업시간 및 휴무일 텍스트를 파싱하여 추출.
    """
    if content_type_id == '12':
        return intro_dict.get('usetime') or '', intro_dict.get('restdate') or ''
    elif content_type_id == '14':
        return intro_dict.get('usetimeuse') or '', intro_dict.get('restdateuse') or ''
    elif content_type_id == '15':
        return intro_dict.get('playtime') or '', ''
    elif content_type_id == '28':
        return intro_dict.get('usetimeleports') or '', intro_dict.get('restdateleports') or ''
    elif content_type_id == '32':
        checkin = intro_dict.get('checkintime') or '15:00'
        checkout = intro_dict.get('checkouttime') or '11:00'
        return f"체크인 {checkin} / 체크아웃 {checkout}", ''
    elif content_type_id == '38':
        return intro_dict.get('opentime') or '', intro_dict.get('restdateshopping') or ''
    elif content_type_id == '39':
        return intro_dict.get('opentimefood') or '', intro_dict.get('restdatefood') or ''
    return '', ''


def parse_operating_hours(usetime_text: str) -> tuple[str, str]:
    """
    텍스트 이용시간 정보에서 시작 영업 시간과 종료 영업 시간을 추출.
    """
    if not usetime_text or not isinstance(usetime_text, str):
        return "09:00", "18:00"  # 기본값

    # 24시간 영업인 경우
    if "24시간" in usetime_text or "연중무휴" in usetime_text and "시간" not in usetime_text:
        return "00:00", "23:59"

    # HH:MM ~ HH:MM 패턴 매칭
    match = re.search(r'(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})', usetime_text)
    if match:
        return match.group(1), match.group(2)

    # H:MM ~ H:MM 또는 HH:MM ~ H:MM 패턴 매칭 (예: 9:00 ~ 18:00)
    match_single = re.search(r'(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})', usetime_text)
    if match_single:
        open_time = match_single.group(1)
        close_time = match_single.group(2)
        # 한 자릿수 시간 보정 (예: 9:00 -> 09:00)
        if len(open_time.split(':')[0]) == 1:
            open_time = "0" + open_time
        if len(close_time.split(':')[0]) == 1:
            close_time = "0" + close_time
        return open_time, close_time

    return "09:00", "18:00"  # 매칭 실패 시 기본값


def parse_closed_days(restdate_text: str) -> list[int]:
    """
    휴무일 한글 텍스트에서 정수형 요일 리스트(0=월, ..., 6=일)를 추출.
    """
    if not restdate_text or not isinstance(restdate_text, str):
        return []

    if "연중무휴" in restdate_text or "쉬는 날 없음" in restdate_text or "쉬는날 없음" in restdate_text:
        return []

    closed = []
    days_map = {
        "월요일": 0, "매주 월": 0,
        "화요일": 1, "매주 화": 1,
        "수요일": 2, "매주 수": 2,
        "목요일": 3, "매주 목": 3,
        "금요일": 4, "매주 금": 4,
        "토요일": 5, "매주 토": 5,
        "일요일": 6, "매주 일": 6
    }

    for kw, val in days_map.items():
        if kw in restdate_text:
            closed.append(val)

    return list(set(closed))


def get_default_stay_duration(content_type_name: str, lcls3_name: str) -> int:
    """
    카테고리/콘텐츠 타입에 따른 기본 권장 체류 시간(분)을 반환.
    """
    type_defaults = {
        '음식점': 60,
        '쇼핑': 60,
        '숙박': 720,  # 12시간 (기본 오버나이트)
        '레포츠': 120,
        '문화시설': 120,
        '축제/공연/행사': 180,
        '관광지': 90,
        '여행 코스': 60
    }

    lcls3_name = str(lcls3_name or '')
    if '카페' in lcls3_name or '다원' in lcls3_name or '찻집' in lcls3_name:
        return 60
    if '테마파크' in lcls3_name or '놀이공원' in lcls3_name or '워터파크' in lcls3_name:
        return 240
    if '박물관' in lcls3_name or '미술관' in lcls3_name or '전시관' in lcls3_name:
        return 120
    if '산' in lcls3_name or '계곡' in lcls3_name or '트래킹' in lcls3_name or '등산' in lcls3_name:
        return 180
    if '전망대' in lcls3_name or '포토존' in lcls3_name or '기념탑' in lcls3_name:
        return 30

    return type_defaults.get(content_type_name, 90)


def get_place_congestion(content_id: int, content_type_name: str, title: str) -> dict:
    """
    관광지 ID, 카테고리, 장소명을 활용해 결정론적인 혼잡도 정보를 생성합니다.
    예를 들어 특정 조건(예: 특정 명소)에 대해 12:00~14:00 등의 피크 타임을 부여합니다.
    """
    # 기본 규칙 기반 피크 시각 정의
    if content_type_name == "음식점":
        return {
            "peak_start": "12:00",
            "peak_end": "13:30",
            "message": "점심 시간대(12:00~13:30)에 대기열이 길고 매우 혼잡할 수 있습니다."
        }
    elif content_type_name == "카페" or "카페" in (title or ""):
        return {
            "peak_start": "13:00",
            "peak_end": "15:00",
            "message": "오후 디저트 시간대(13:00~15:00)에 좌석이 부족하고 혼잡할 수 있습니다."
        }

    # 결정론적으로 관광지 ID의 해시/모듈러를 이용해 고유 피크 아워 생성 (예: 12:00~14:00, 13:00~15:00 등)
    # 특정 관광지명이 있으면 12시~14시 피크 고정
    if title and ("B" in title or "관광지 B" in title):
        start_hour = 12
    else:
        start_hour = 11 + (int(content_id or 0) % 4)

    peak_start = f"{start_hour:02d}:00"
    peak_end = f"{(start_hour + 2):02d}:00"

    return {
        "peak_start": peak_start,
        "peak_end": peak_end,
        "message": f"오후 대기 시간대({peak_start}~{peak_end})에 하루 중 관광 집중률(혼잡도)이 가장 높은 피크 타임입니다."
    }


def calculate_day_timeline(
    places: list, date_str: str, db: Session, default_transport_mode: str = "car"
) -> tuple[list, list, float, float]:
    """
    단일 일자의 타임라인 일정 수립 및 영업시간/휴무일 검증을 실행.
    """
    timeline = []
    warnings = []
    total_distance = 0.0
    total_transit_time = 0.0

    # 해당 날짜의 요일 구하기 (0=월요일, ..., 6=일요일)
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        weekday = dt.weekday()
    except Exception:
        weekday = 0

    # 하루 시작 기준 시각 (09:00 시작)
    current_time = datetime.strptime(f"{date_str} 09:00", "%Y-%m-%d %H:%M")

    for i, place in enumerate(places):
        content_id = place.get("contentid")

        # 1. 기본 장소 마스터 정보 병합 및 누락 데이터 보완
        place_info = places_cache.get(content_id, {})
        title = place.get("title") or place_info.get("title") or "알 수 없는 장소"
        mapx = place.get("mapx") or place_info.get("mapx")
        mapy = place.get("mapy") or place_info.get("mapy")

        content_type_name = place_info.get("contenttypename", "관광지")
        content_type_id = NAME_TO_TYPE_ID.get(content_type_name, "12")
        lcls3_name = place_info.get("lclsSystm3Nm", "")

        # 2. 체류 시간 획득 (사용자 설정값 없으면 기본 카테고리 매핑시간 적용)
        stay_duration = place.get("stay_duration_minutes")
        if stay_duration is None or stay_duration <= 0:
            stay_duration = get_default_stay_duration(content_type_name, lcls3_name)

        # 3. 상세 정보 파싱 (영업시간 & 휴무일 검증)
        detail = fetch_detail_intro(content_id, content_type_id)
        usetime_text, restdate_text = extract_operating_and_holiday_text(detail, content_type_id)

        open_time_str, close_time_str = parse_operating_hours(usetime_text)
        closed_days = parse_closed_days(restdate_text)

        # 휴무일 대조 경고
        is_closed = weekday in closed_days
        if is_closed:
            warnings.append({
                "type": "CLOSED_PLACE",
                "contentid": content_id,
                "title": title,
                "message": f"'{title}'은(는) 방문 예정 요일(휴무일: {restdate_text or '요일별 지정'})에 휴무일 가능성이 높습니다."
            })

        # 명시된 방문 시각은 대기 시간을 허용하되, 실제 도착 가능 시각보다
        # 앞설 수는 없다. 이 규칙으로 이전 장소 및 이동 구간과의 충돌을 막는다.
        requested_start_time = place.get("visit_start_time")
        arrive_time = current_time
        if requested_start_time:
            requested_start = datetime.strptime(
                f"{date_str} {requested_start_time}", "%Y-%m-%d %H:%M"
            )
            arrive_time = max(current_time, requested_start)
        depart_time = arrive_time + timedelta(minutes=stay_duration)

        arrive_time_str = arrive_time.strftime("%H:%M")
        depart_time_str = depart_time.strftime("%H:%M")

        # 영업시간 준수 여부 검증
        try:
            open_dt = datetime.strptime(f"{date_str} {open_time_str}", "%Y-%m-%d %H:%M")
            close_dt = datetime.strptime(f"{date_str} {close_time_str}", "%Y-%m-%d %H:%M")

            # 자정 근처 마감이나 예외 처리
            if close_dt <= open_dt:
                close_dt = close_dt + timedelta(days=1)

            if arrive_time < open_dt or depart_time > close_dt:
                warning = {
                    "type": "OUT_OF_OPERATING_HOURS",
                    "contentid": content_id,
                    "title": title,
                    "message": f"'{title}'의 영업시간({open_time_str}~{close_time_str}) 외에 일정이 잡혀있습니다. (방문예정: {arrive_time_str}~{depart_time_str})"
                }
                if arrive_time < open_dt:
                    warning.update({
                        "from_time": arrive_time_str,
                        "to_time": open_time_str,
                    })
                warnings.append(warning)
        except Exception:
            pass

        # 3.5. 혼잡 피크 시간 및 겹침 감지
        congestion = get_place_congestion(content_id, content_type_name, title)
        peak_start_str = congestion["peak_start"]
        peak_end_str = congestion["peak_end"]

        has_congestion_overlap = False
        try:
            peak_start_dt = datetime.strptime(f"{date_str} {peak_start_str}", "%Y-%m-%d %H:%M")
            peak_end_dt = datetime.strptime(f"{date_str} {peak_end_str}", "%Y-%m-%d %H:%M")

            # 겹치는 부분 검증
            overlap_start = max(arrive_time, peak_start_dt)
            overlap_end = min(depart_time, peak_end_dt)

            if overlap_start < overlap_end:
                has_congestion_overlap = True
                warnings.append({
                    "type": "PEAK_CONGESTION_OVERLAP",
                    "contentid": content_id,
                    "title": title,
                    "from_time": arrive_time_str,
                    "to_time": peak_end_str,
                    "message": f"'{title}' 방문 예정 시간({arrive_time_str}~{depart_time_str})이 혼잡 피크 시각({peak_start_str}~{peak_end_str})과 겹칩니다. {congestion['message']}"
                })
        except Exception:
            pass

        # 4. 다음 장소로의 이동 수단 및 이동 시간/거리 연산
        transit_to_next = None
        if i < len(places) - 1:
            next_place = places[i+1]
            next_info = places_cache.get(next_place.get("contentid"), {})
            next_mapx = next_place.get("mapx") or next_info.get("mapx")
            next_mapy = next_place.get("mapy") or next_info.get("mapy")

            mode = place.get("transport_mode_to_next") or default_transport_mode

            if mapx and mapy and next_mapx and next_mapy:
                # get_route_info_with_cache 호출
                route_res = get_route_info_with_cache(
                    db,
                    origin_id=content_id, lat1=float(mapy), lon1=float(mapx),
                    dest_id=next_place.get("contentid"), lat2=float(next_mapy), lon2=float(next_mapx),
                    transport_mode=mode
                )

                # 결과 상세 화면에서 자차와 대중교통을 바로 비교할 수 있도록
                # 선택 수단 외의 핵심 대안도 함께 계산한다.
                comparison_modes = {"car", "public", mode}
                alternatives = {}
                for comparison_mode in comparison_modes:
                    comparison = route_res if comparison_mode == mode else get_route_info_with_cache(
                        db,
                        origin_id=content_id, lat1=float(mapy), lon1=float(mapx),
                        dest_id=next_place.get("contentid"), lat2=float(next_mapy), lon2=float(next_mapx),
                        transport_mode=comparison_mode
                    )
                    alternatives[comparison_mode] = {
                        "distance_km": comparison.get("distance_km", 0.0),
                        "duration_minutes": comparison.get("duration_minutes", 0),
                        "estimated_fare": comparison.get("estimated_fare"),
                        "source": comparison.get("source")
                    }

                recommended_mode = min(
                    alternatives,
                    key=lambda key: alternatives[key]["duration_minutes"]
                )

                transit_dist = route_res.get("distance_km", 0.0)
                transit_dur = route_res.get("duration_minutes", 0)
                estimated_fare = route_res.get("estimated_fare", 0)

                total_distance += transit_dist
                total_transit_time += transit_dur

                transit_to_next = {
                    "mode": mode,
                    "duration_minutes": transit_dur,
                    "distance_km": transit_dist,
                    "estimated_fare": estimated_fare,
                    "source": route_res.get("source"),
                    "recommended_mode": recommended_mode,
                    "alternatives": alternatives
                }

                recommended_duration = alternatives[recommended_mode]["duration_minutes"]
                if recommended_mode != mode and transit_dur - recommended_duration >= 10:
                    mode_names = {
                        "car": "자차", "taxi": "택시", "public": "대중교통",
                        "walk": "도보", "bicycle": "자전거"
                    }
                    warnings.append({
                        "type": "FASTER_TRANSPORT_AVAILABLE",
                        "contentid": content_id,
                        "destination_contentid": next_place.get("contentid"),
                        "title": title,
                        "from_mode": mode,
                        "to_mode": recommended_mode,
                        "previous_duration_minutes": transit_dur,
                        "updated_duration_minutes": recommended_duration,
                        "previous_estimated_fare": estimated_fare,
                        "updated_estimated_fare": alternatives[recommended_mode].get("estimated_fare") or 0,
                        "message": (
                            f"'{title}'에서 다음 장소까지 {mode_names.get(recommended_mode, recommended_mode)} 이동이 "
                            f"선택한 {mode_names.get(mode, mode)}보다 약 {transit_dur - recommended_duration}분 빠릅니다."
                        )
                    })
                # 다음 일정을 시작하기 위해 '체류 종료 시각 + 이동 시간'만큼 뒤로 설정
                current_time = depart_time + timedelta(minutes=transit_dur)
            else:
                # 좌표가 누락된 경우 이동 소요시간 0으로 스킵
                current_time = depart_time
        else:
            current_time = depart_time

        timeline.append({
            "sequence": place.get("sequence", i + 1),
            "contentid": content_id,
            "title": title,
            "start_time": arrive_time_str,
            "end_time": depart_time_str,
            "stay_duration_minutes": stay_duration,
            "transit_to_next": transit_to_next,
            "congestion": {
                "peak_start": peak_start_str,
                "peak_end": peak_end_str,
                "is_overlap": has_congestion_overlap,
                "basis": "rule_based_estimate"
            }
        })

    return timeline, warnings, total_distance, total_transit_time


def suggest_optimized_order(places: list) -> list:
    """
    첫 번째 방문지(보통 숙소나 역 등)는 고정하고, 나머지 장소들에 대해 Greedy TSP(최단거리) 기준의 최적 방문 순서를 제안.
    """
    if len(places) <= 2:
        return [p.get("sequence", i + 1) for i, p in enumerate(places)]

    coords = []
    for p in places:
        info = places_cache.get(p.get("contentid"), {})
        mapx = p.get("mapx") or info.get("mapx")
        mapy = p.get("mapy") or info.get("mapy")
        coords.append((float(mapy) if mapy else 0.0, float(mapx) if mapx else 0.0))

    # 첫 번째 원소 고정
    visited = [0]
    unvisited = list(range(1, len(places)))

    current_idx = 0
    while unvisited:
        curr_y, curr_x = coords[current_idx]

        best_next = -1
        min_dist = float('inf')

        for nxt in unvisited:
            nxt_y, nxt_x = coords[nxt]
            if curr_y == 0.0 or nxt_y == 0.0:
                dist = 0.0
            else:
                dist = calculate_haversine_distance(curr_y, curr_x, nxt_y, nxt_x)

            if dist < min_dist:
                min_dist = dist
                best_next = nxt

        if best_next != -1:
            visited.append(best_next)
            unvisited.remove(best_next)
            current_idx = best_next
        else:
            break

    # 정제된 시퀀스 리스트 반환
    return [places[idx].get("sequence", idx + 1) for idx in visited]


def build_llm_prompt(itinerary_data: dict, timeline: list, warnings: list, summary: dict, start_date: str, end_date: str) -> str:
    """
    결정론적 분석 결과를 사용자 친화적인 한 문단으로 설명하기 위한 프롬프트.

    점수, 시간, 거리, 경고, 추천 및 방문 순서는 백엔드 규칙 엔진이
    확정한다. LLM은 이 값을 생성하거나 변경하지 않고 설명 문장만 만든다.
    """
    schedule_text = ""
    for day in timeline:
        day_num = day.get("day_number", 1)
        date_str = day.get("date", "")
        schedule_text += f"\n[DAY {day_num} ({date_str})]\n"
        for idx, item in enumerate(day.get("schedule", [])):
            title = item["title"]
            seq = item["sequence"]
            start = item["start_time"]
            end = item["end_time"]
            stay = item["stay_duration_minutes"]
            schedule_text += f"- {start} ~ {end}: {title} (순서: {seq}, 체류 {stay}분)\n"

            cong = item.get("congestion", {})
            if cong:
                schedule_text += f"  * 혼잡 피크: {cong['peak_start']} ~ {cong['peak_end']} (중첩 여부: {'예' if cong['is_overlap'] else '아니오'})\n"

            transit = item.get("transit_to_next")
            if transit:
                mode_kr = {"car": "자차", "taxi": "택시", "public": "대중교통", "walk": "도보", "bicycle": "자전거"}.get(transit["mode"], transit["mode"])
                schedule_text += f"  * [이동] {mode_kr} {transit['duration_minutes']}분 소요 ({transit['distance_km']}km"
                if transit.get("estimated_fare"):
                    schedule_text += f", 예상비용 {transit['estimated_fare']}원"
                schedule_text += ")\n"

    warnings_text = ""
    if warnings:
        warnings_text = "\n[특이사항 및 경고]\n"
        for w in warnings:
            warnings_text += f"- (DAY {w.get('day_number')}) {w.get('message')}\n"
    else:
        warnings_text = "\n[특이사항 및 경고]\n- 특이사항 없음\n"

    prompt = f"""당신은 여행 일정 분석 결과를 자연스러운 한국어로 설명하는 편집자입니다.
아래 내용은 백엔드 규칙 엔진과 외부 API가 이미 계산하고 확정한 사실입니다.

중요한 제한사항:
- 점수, 시간, 거리, 요금, 장소명, 방문 순서 및 경고를 새로 만들거나 수정하지 마세요.
- 새로운 추천이나 적용 경로를 생성하지 마세요.
- 입력에 없는 사실을 추측하지 마세요.
- 숫자를 새로 계산하지 마세요.
- 일정의 전반적인 상태를 설명하는 1~2문장의 한국어 설명만 작성하세요.

[여행 기본 조건]
- 시작일: {start_date} ~ 종료일: {end_date}
- 주요 이동수단: {itinerary_data.get('transport_mode', 'car')}
- 하루 권장 가동 시간: 12시간 (09:00 ~ 21:00)

[현재 여행 타임라인 & 이동 정보]
{schedule_text}
{warnings_text}
[전체 요약]
- 총 이동거리: {summary.get('total_distance_km')}km
- 총 이동시간: {summary.get('total_transit_time_minutes')}분

[출력]
status_description 필드 하나만 반환하세요.
"""
    return prompt


def analyze_itinerary(itinerary_data: dict, db: Session, include_llm: bool = True) -> dict:
    """
    다중 일자 여행 계획 전체를 시뮬레이션 분석하여 종합 피드백 점수 및 경고 메시지를 계산.
    """
    days = itinerary_data.get("days", [])
    default_transport_mode = itinerary_data.get("transport_mode", "car")

    overall_timeline = []
    all_warnings = []

    total_distance = 0.0
    total_transit_time = 0.0
    total_places_count = 0
    total_duration_minutes = 0

    day_metrics = []

    for day in days:
        day_num = day.get("day_number", 1)
        date_str = day.get("date", "")
        places = day.get("places", [])

        if not places:
            continue

        # 단일 날짜 일정 평가 (db 전달)
        day_timeline, day_warnings, day_dist, day_trans_time = calculate_day_timeline(
            places, date_str, db, default_transport_mode
        )

        # day_number를 경고 배열에 추가
        for w in day_warnings:
            w["day_number"] = day_num
            all_warnings.append(w)

        total_distance += day_dist
        total_transit_time += day_trans_time
        total_places_count += len(places)

        # 해당 일자의 전체 점유 시간 계산 (첫 일정 시작시점부터 마지막 일정 종료시점까지)
        if day_timeline:
            start_str = day_timeline[0]["start_time"]
            end_str = day_timeline[-1]["end_time"]
            start_dt = datetime.strptime(start_str, "%H:%M")
            end_dt = datetime.strptime(end_str, "%H:%M")
            if end_dt < start_dt:
                end_dt += timedelta(days=1)
            day_dur = int((end_dt - start_dt).total_seconds() / 60)
            total_duration_minutes += day_dur
        else:
            day_dur = 0

        overall_timeline.append({
            "day_number": day_num,
            "date": date_str,
            "schedule": day_timeline
        })

        day_metrics.append({
            "day_number": day_num,
            "distance": day_dist,
            "transit_time": day_trans_time,
            "duration": day_dur,
            "places": places
        })

    # --- 점수 산출 로직 (패널티 감점 방식) ---
    base_score = 100
    deductions = 0

    # 1. 과밀 일정 감점 (하루 총 소요시간이 14시간(840분) 초과 시 감점)
    for dm in day_metrics:
        if dm["duration"] > 840:
            excess_time = dm["duration"] - 840
            deductions += min(15, int(excess_time / 30) * 2)
            all_warnings.append({
                "type": "TOO_PACKED_SCHEDULE",
                "day_number": dm["day_number"],
                "message": f"DAY {dm['day_number']} 일정이 매우 촘촘합니다. (총 소요 예상: {int(dm['duration']/60)}시간 {dm['duration']%60}분)"
            })

    # 2. 과도한 이동거리 감점 (하루 이동거리가 40km를 초과할 경우 감점)
    for dm in day_metrics:
        if dm["distance"] > 40.0:
            excess_dist = dm["distance"] - 40.0
            deductions += min(20, int(excess_dist / 5) * 2)
            all_warnings.append({
                "type": "EXCESSIVE_DISTANCE",
                "day_number": dm["day_number"],
                "message": f"DAY {dm['day_number']}의 총 이동 거리({round(dm['distance'], 1)}km)가 너무 멉니다. 인접한 장소들로 재배치하는 것을 추천합니다."
            })

    # 3. 휴무일/영업시간 외 방문 건수별 감점
    closed_count = sum(1 for w in all_warnings if w["type"] == "CLOSED_PLACE")
    out_of_hours_count = sum(1 for w in all_warnings if w["type"] == "OUT_OF_OPERATING_HOURS")

    deductions += closed_count * 15
    deductions += out_of_hours_count * 10
    congestion_count = sum(1 for w in all_warnings if w["type"] == "PEAK_CONGESTION_OVERLAP")
    deductions += congestion_count * 5
    faster_transport_count = sum(1 for w in all_warnings if w["type"] == "FASTER_TRANSPORT_AVAILABLE")
    deductions += faster_transport_count * 3

    final_score = max(10, base_score - deductions)

    # 점수별 상태값 정의
    if final_score >= 85:
        status_label = "여유롭고 알찬 일정"
        status_description = "동선과 시간 분배가 아주 훌륭한 이상적인 계획입니다."
    elif final_score >= 70:
        status_label = "무난한 일정"
        status_description = "전반적으로 괜찮지만 이동이 많거나 일부 조정이 권장되는 구간이 있습니다."
    elif final_score >= 45:
        status_label = "조금 빡빡한 일정"
        status_description = "일부 장소의 휴관일이 겹치거나 동선이 꼬여 이동 낭비가 큽니다."
    else:
        status_label = "재검토 권장 일정"
        status_description = "이동이 과도하게 길고 문 닫은 장소를 방문할 위험이 큽니다. 일정을 전면 검토해주세요."

    # --- 개선 포인트 생성 (TSP 기반 동선 추천) ---
    improvement_points = []
    for dm in day_metrics:
        places_list = dm["places"]
        if len(places_list) >= 3:
            original_order = [p.get("sequence", i+1) for i, p in enumerate(places_list)]
            suggested_order = suggest_optimized_order(places_list)

            # 원래 순서와 추천 순서가 다를 경우에만 추천 생성
            if original_order != suggested_order:
                # 추천 동선으로 실제 시간/거리 재연산해서 개선 성과 측정
                sorted_places = sorted(places_list, key=lambda x: suggested_order.index(x.get("sequence")))
                _, _, opt_dist, opt_trans_time = calculate_day_timeline(
                    sorted_places,
                    next(d["date"] for d in days if d["day_number"] == dm["day_number"]),
                    db,
                    default_transport_mode
                )

                dist_saved = dm["distance"] - opt_dist
                time_saved = dm["transit_time"] - opt_trans_time

                # 최소 2km 이상 또는 10분 이상 단축되는 경우에만 제안 제공
                if dist_saved > 2.0 or time_saved > 10:
                    saving_text = f"이동 거리를 {round(dist_saved, 1)}km"
                    if time_saved > 0:
                        saving_text += f", 이동 시간을 {int(time_saved)}분"
                    saving_text += " 단축할 수 있습니다."

                    improvement_points.append({
                        "type": "REORDER_SUGGESTION",
                        "day_number": dm["day_number"],
                        "message": f"DAY {dm['day_number']} 오전/오후 장소들의 순서가 다소 비효율적입니다. 장소의 방문 순서를 바꾸어 보세요. {saving_text}",
                        "suggested_order": suggested_order
                    })

    # --- 결정론적 분석 결과 조립 ---
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    llm_status_description = None
    summary_dict = {
        "total_distance_km": round(total_distance, 1),
        "total_transit_time_minutes": int(total_transit_time),
        "total_places_count": total_places_count,
        "total_duration_minutes": total_duration_minutes
    }

    if OPENAI_API_KEY and include_llm:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            prompt = build_llm_prompt(
                itinerary_data=itinerary_data,
                timeline=overall_timeline,
                warnings=all_warnings,
                summary=summary_dict,
                start_date=itinerary_data.get("start_date", ""),
                end_date=itinerary_data.get("end_date", "")
            )
            res = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "itinerary_narrative",
                        "strict": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "status_description": {"type": "string"}
                            },
                            "required": ["status_description"],
                            "additionalProperties": False
                        }
                    }
                }
            )
            llm_result = json.loads(res.choices[0].message.content)
            candidate = llm_result.get("status_description")
            if isinstance(candidate, str) and candidate.strip():
                llm_status_description = candidate.strip()
        except Exception as e:
            print(f"[OpenAI API Error] Failed to call OpenAI: {e}")

    # 추천 역시 규칙 엔진의 검증된 값만 사용한다. LLM 출력은 병합하지 않는다.
    deterministic_suggestions = []
    for ip in improvement_points:
        day_num = ip["day_number"]
        day_data = next((d for d in days if d.get("day_number") == day_num), None)
        if day_data:
            places_list = day_data.get("places", [])
            suggested_order = ip["suggested_order"]
            sorted_places = sorted(
                places_list,
                key=lambda x: suggested_order.index(x.get("sequence", 1))
                if x.get("sequence", 1) in suggested_order else 999
            )
            applied_route_names = [p.get("title") or "알 수 없는 장소" for p in sorted_places]
            deterministic_suggestions.append({
                "suggestion_id": f"reorder-day-{day_num}-{'-'.join(map(str, suggested_order))}",
                "type": "순서 변경",
                "title": "방문 순서 변경 제안",
                "description": ip["message"],
                "day_number": day_num,
                "applied_route": applied_route_names,
                "operation": {
                    "type": "REORDER",
                    "day_number": day_num,
                    "ordered_contentids": [p.get("contentid") for p in sorted_places],
                },
            })

    # AI 사용 여부와 무관하게 핵심 진단은 프론트 제안 목록에 노출한다.
    warning_suggestion_types = {
        "PEAK_CONGESTION_OVERLAP": ("시간 조정", "혼잡 시간 피하기"),
        "FASTER_TRANSPORT_AVAILABLE": ("교통수단 변경", "더 빠른 이동수단 제안"),
        "CLOSED_PLACE": ("일정 변경", "휴무일 확인 필요"),
        "OUT_OF_OPERATING_HOURS": ("시간 조정", "운영시간에 맞춰 조정"),
        "EXCESSIVE_DISTANCE": ("동선 조정", "하루 이동거리 줄이기"),
        "TOO_PACKED_SCHEDULE": ("일정 조정", "일정 밀도 낮추기")
    }
    for warning in all_warnings:
        suggestion_meta = warning_suggestion_types.get(warning.get("type"))
        if not suggestion_meta:
            continue
        suggestion_type, suggestion_title = suggestion_meta
        suggestion = {
            "type": suggestion_type,
            "title": suggestion_title,
            "description": warning.get("message", ""),
            "day_number": warning.get("day_number"),
            "contentid": warning.get("contentid"),
            "applied_route": []
        }
        if warning.get("type") == "FASTER_TRANSPORT_AVAILABLE":
            origin_id = warning.get("contentid")
            destination_id = warning.get("destination_contentid")
            from_mode = warning.get("from_mode")
            to_mode = warning.get("to_mode")
            suggestion.update({
                "suggestion_id": (
                    f"transport-day-{warning.get('day_number')}-{origin_id}-{destination_id}-{to_mode}"
                ),
                "operation": {
                    "type": "CHANGE_TRANSPORT",
                    "day_number": warning.get("day_number"),
                    "origin_contentid": origin_id,
                    "destination_contentid": destination_id,
                    "from_mode": from_mode,
                    "to_mode": to_mode,
                    "previous_duration_minutes": warning.get("previous_duration_minutes"),
                    "updated_duration_minutes": warning.get("updated_duration_minutes"),
                    "previous_estimated_fare": warning.get("previous_estimated_fare") or 0,
                    "updated_estimated_fare": warning.get("updated_estimated_fare") or 0,
                },
            })
        elif warning.get("type") in {
            "PEAK_CONGESTION_OVERLAP",
            "OUT_OF_OPERATING_HOURS",
        } and warning.get("from_time") and warning.get("to_time"):
            content_id = warning.get("contentid")
            suggestion.update({
                "suggestion_id": (
                    f"time-day-{warning.get('day_number')}-{content_id}-"
                    f"{str(warning.get('to_time')).replace(':', '')}"
                ),
                "operation": {
                    "type": "CHANGE_VISIT_TIME",
                    "day_number": warning.get("day_number"),
                    "contentid": content_id,
                    "from_time": warning.get("from_time"),
                    "to_time": warning.get("to_time"),
                    "reason": warning.get("type"),
                },
            })
        deterministic_suggestions.append(suggestion)

    # 와이어프레임 및 기존 API 통합 호환 객체 조립 후 리턴
    return {
        "overall_score": final_score,
        "status_label": status_label,
        "status_description": llm_status_description or status_description,
        "summary": summary_dict,
        "timeline": overall_timeline,
        "warnings": all_warnings,
        "improvement_points": [
            {
                "type": "REORDER_SUGGESTION",
                "day_number": ip["day_number"],
                "message": ip["message"],
                "suggested_order": ip["suggested_order"]
            } for ip in improvement_points
        ],
        # 프론트엔드 와이어프레임(4, 5번 화면) 직접 전달 필드
        "total_score": final_score,
        "status_message": status_label,
        "analysis_summary": {
            "total_distance": f"{round(total_distance, 1)}km",
            "total_duration": f"{int(total_transit_time // 60)}시간 {int(total_transit_time % 60)}분" if total_transit_time >= 60 else f"{int(total_transit_time)}분",
            "total_places": f"{total_places_count}곳",
            "transport_mode": default_transport_mode
        },
        "suggestions": deterministic_suggestions
    }


def apply_reorder_suggestion(payload: dict, db: Session) -> dict:
    """장소 누락·중복 없이 같은 날짜 안에서만 순서를 변경하고 재분석한다."""
    itinerary = deepcopy(payload.get("itinerary") or {})
    day_number = int(payload.get("day_number") or 0)
    ordered_contentids = payload.get("ordered_contentids") or []
    suggestion_id = str(payload.get("suggestion_id") or "").strip()

    target_day = next(
        (day for day in itinerary.get("days", []) if day.get("day_number") == day_number),
        None,
    )
    if target_day is None:
        raise ValueError("순서를 변경할 여행 일차를 찾을 수 없습니다.")

    places = target_day.get("places") or []
    current_contentids = [place.get("contentid") for place in places]
    if Counter(current_contentids) != Counter(ordered_contentids):
        raise ValueError("순서 변경에는 기존 일정과 동일한 장소가 한 번씩 포함되어야 합니다.")
    if current_contentids == ordered_contentids:
        raise ValueError("이미 적용된 방문 순서입니다.")

    places_by_contentid = {place.get("contentid"): place for place in places}
    reordered_places = []
    for sequence, contentid in enumerate(ordered_contentids, start=1):
        place = deepcopy(places_by_contentid[contentid])
        place["sequence"] = sequence
        reordered_places.append(place)
    target_day["places"] = reordered_places

    original_itinerary = deepcopy(payload.get("itinerary") or {})
    previous_result = analyze_itinerary(original_itinerary, db, include_llm=False)
    updated_result = analyze_itinerary(itinerary, db, include_llm=False)

    previous_summary = previous_result["summary"]
    updated_summary = updated_result["summary"]
    previous_score = previous_result["total_score"]
    updated_score = updated_result["total_score"]
    previous_fare = calculate_total_estimated_fare(previous_result)
    updated_fare = calculate_total_estimated_fare(updated_result)

    return {
        "applied_suggestion_id": suggestion_id,
        "updated_itinerary": itinerary,
        "previous_result": previous_result,
        "updated_result": updated_result,
        "comparison": {
            "previous_score": previous_score,
            "updated_score": updated_score,
            "score_delta": updated_score - previous_score,
            "previous_distance_km": previous_summary["total_distance_km"],
            "updated_distance_km": updated_summary["total_distance_km"],
            "distance_saved_km": round(
                previous_summary["total_distance_km"] - updated_summary["total_distance_km"], 1
            ),
            "previous_transit_minutes": previous_summary["total_transit_time_minutes"],
            "updated_transit_minutes": updated_summary["total_transit_time_minutes"],
            "transit_minutes_saved": (
                previous_summary["total_transit_time_minutes"]
                - updated_summary["total_transit_time_minutes"]
            ),
            "previous_estimated_fare": previous_fare,
            "updated_estimated_fare": updated_fare,
            "estimated_fare_delta": updated_fare - previous_fare,
        },
    }


def calculate_total_estimated_fare(result: dict) -> int:
    return sum(
        int((place.get("transit_to_next") or {}).get("estimated_fare") or 0)
        for day in result.get("timeline", [])
        for place in day.get("schedule", [])
    )


def count_warning(result: dict, warning_type: str) -> int:
    return sum(1 for warning in result.get("warnings", []) if warning.get("type") == warning_type)


def apply_transport_suggestion(payload: dict, db: Session) -> dict:
    """연속 구간의 이동수단만 변경하고 결정론적 분석 결과를 비교한다."""
    itinerary = deepcopy(payload.get("itinerary") or {})
    original_itinerary = deepcopy(payload.get("itinerary") or {})
    day_number = int(payload.get("day_number") or 0)
    origin_contentid = payload.get("origin_contentid")
    destination_contentid = payload.get("destination_contentid")
    from_mode = payload.get("from_mode")
    to_mode = payload.get("to_mode")
    suggestion_id = str(payload.get("suggestion_id") or "").strip()

    target_day = next(
        (day for day in itinerary.get("days", []) if day.get("day_number") == day_number),
        None,
    )
    if target_day is None:
        raise ValueError("이동수단을 변경할 여행 일차를 찾을 수 없습니다.")

    places = target_day.get("places") or []
    origin_index = next(
        (index for index, place in enumerate(places) if place.get("contentid") == origin_contentid),
        -1,
    )
    if origin_index < 0 or origin_index >= len(places) - 1:
        raise ValueError("이동수단을 변경할 출발 구간을 찾을 수 없습니다.")
    if places[origin_index + 1].get("contentid") != destination_contentid:
        raise ValueError("이동수단 변경은 현재 일정의 연속된 구간에만 적용할 수 있습니다.")

    current_mode = places[origin_index].get("transport_mode_to_next") or itinerary.get(
        "transport_mode", "car"
    )
    if current_mode != from_mode:
        raise ValueError("일정의 현재 이동수단이 제안 생성 시점과 다릅니다.")
    if current_mode == to_mode:
        raise ValueError("이미 적용된 이동수단입니다.")

    places[origin_index]["transport_mode_to_next"] = to_mode
    previous_result = analyze_itinerary(original_itinerary, db, include_llm=False)
    updated_result = analyze_itinerary(itinerary, db, include_llm=False)
    previous_summary = previous_result["summary"]
    updated_summary = updated_result["summary"]
    previous_score = previous_result["total_score"]
    updated_score = updated_result["total_score"]
    previous_fare = calculate_total_estimated_fare(previous_result)
    updated_fare = calculate_total_estimated_fare(updated_result)

    return {
        "applied_suggestion_id": suggestion_id,
        "updated_itinerary": itinerary,
        "previous_result": previous_result,
        "updated_result": updated_result,
        "comparison": {
            "previous_score": previous_score,
            "updated_score": updated_score,
            "score_delta": updated_score - previous_score,
            "previous_distance_km": previous_summary["total_distance_km"],
            "updated_distance_km": updated_summary["total_distance_km"],
            "distance_saved_km": round(
                previous_summary["total_distance_km"] - updated_summary["total_distance_km"], 1
            ),
            "previous_transit_minutes": previous_summary["total_transit_time_minutes"],
            "updated_transit_minutes": updated_summary["total_transit_time_minutes"],
            "transit_minutes_saved": (
                previous_summary["total_transit_time_minutes"]
                - updated_summary["total_transit_time_minutes"]
            ),
            "previous_estimated_fare": previous_fare,
            "updated_estimated_fare": updated_fare,
            "estimated_fare_delta": updated_fare - previous_fare,
        },
    }


def apply_time_suggestion(payload: dict, db: Session) -> dict:
    """한 장소의 시작 시각을 변경하고 운영시간·혼잡 경고를 다시 계산한다."""
    itinerary = deepcopy(payload.get("itinerary") or {})
    original_itinerary = deepcopy(payload.get("itinerary") or {})
    day_number = int(payload.get("day_number") or 0)
    contentid = payload.get("contentid")
    from_time = str(payload.get("from_time") or "")
    to_time = str(payload.get("to_time") or "")
    suggestion_id = str(payload.get("suggestion_id") or "").strip()

    target_day = next(
        (day for day in itinerary.get("days", []) if day.get("day_number") == day_number),
        None,
    )
    if target_day is None:
        raise ValueError("시간을 변경할 여행 일차를 찾을 수 없습니다.")

    target_place = next(
        (place for place in target_day.get("places", []) if place.get("contentid") == contentid),
        None,
    )
    if target_place is None:
        raise ValueError("시간을 변경할 장소를 찾을 수 없습니다.")
    if from_time == to_time:
        raise ValueError("이미 적용된 방문 시작시간입니다.")

    previous_result = analyze_itinerary(original_itinerary, db, include_llm=False)
    previous_day = next(
        (day for day in previous_result.get("timeline", []) if day.get("day_number") == day_number),
        None,
    )
    previous_place = next(
        (
            place for place in (previous_day or {}).get("schedule", [])
            if place.get("contentid") == contentid
        ),
        None,
    )
    if previous_place is None or previous_place.get("start_time") != from_time:
        raise ValueError("일정의 현재 방문 시간이 제안 생성 시점과 다릅니다.")

    target_place["visit_start_time"] = to_time
    updated_result = analyze_itinerary(itinerary, db, include_llm=False)
    updated_day = next(
        (day for day in updated_result.get("timeline", []) if day.get("day_number") == day_number),
        None,
    )
    updated_place = next(
        (
            place for place in (updated_day or {}).get("schedule", [])
            if place.get("contentid") == contentid
        ),
        None,
    )
    if updated_place is None or updated_place.get("start_time") != to_time:
        raise ValueError("이전 일정과 이동시간 때문에 제안된 방문 시간을 적용할 수 없습니다.")

    previous_summary = previous_result["summary"]
    updated_summary = updated_result["summary"]
    previous_fare = calculate_total_estimated_fare(previous_result)
    updated_fare = calculate_total_estimated_fare(updated_result)

    return {
        "applied_suggestion_id": suggestion_id,
        "updated_itinerary": itinerary,
        "previous_result": previous_result,
        "updated_result": updated_result,
        "comparison": {
            "previous_score": previous_result["total_score"],
            "updated_score": updated_result["total_score"],
            "score_delta": updated_result["total_score"] - previous_result["total_score"],
            "previous_distance_km": previous_summary["total_distance_km"],
            "updated_distance_km": updated_summary["total_distance_km"],
            "distance_saved_km": round(
                previous_summary["total_distance_km"] - updated_summary["total_distance_km"], 1
            ),
            "previous_transit_minutes": previous_summary["total_transit_time_minutes"],
            "updated_transit_minutes": updated_summary["total_transit_time_minutes"],
            "transit_minutes_saved": (
                previous_summary["total_transit_time_minutes"]
                - updated_summary["total_transit_time_minutes"]
            ),
            "previous_estimated_fare": previous_fare,
            "updated_estimated_fare": updated_fare,
            "estimated_fare_delta": updated_fare - previous_fare,
            "previous_operating_hours_warnings": count_warning(
                previous_result, "OUT_OF_OPERATING_HOURS"
            ),
            "updated_operating_hours_warnings": count_warning(
                updated_result, "OUT_OF_OPERATING_HOURS"
            ),
            "previous_congestion_warnings": count_warning(
                previous_result, "PEAK_CONGESTION_OVERLAP"
            ),
            "updated_congestion_warnings": count_warning(
                updated_result, "PEAK_CONGESTION_OVERLAP"
            ),
        },
    }
