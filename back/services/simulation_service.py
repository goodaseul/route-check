import os
import re
import json
import requests
import pandas as pd
from datetime import datetime, timedelta
from dotenv import load_dotenv
from services.route_service import estimate_transit_info, calculate_haversine_distance

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


def calculate_day_timeline(places: list, date_str: str) -> tuple[list, list, float, float]:
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

        # 도착 시각 및 출발 시각 연산
        arrive_time = current_time
        depart_time = current_time + timedelta(minutes=stay_duration)
        
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
                warnings.append({
                    "type": "OUT_OF_OPERATING_HOURS",
                    "contentid": content_id,
                    "title": title,
                    "message": f"'{title}'의 영업시간({open_time_str}~{close_time_str}) 외에 일정이 잡혀있습니다. (방문예정: {arrive_time_str}~{depart_time_str})"
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
            
            mode = place.get("transport_mode_to_next") or "car"
            
            if mapx and mapy and next_mapx and next_mapy:
                route_info = estimate_transit_info(float(mapy), float(mapx), float(next_mapy), float(next_mapx))
                alt = route_info.get("alternatives", {}).get(mode, {})
                
                transit_dist = alt.get("distance_km", 0.0)
                transit_dur = alt.get("duration_minutes", 0)
                
                total_distance += transit_dist
                total_transit_time += transit_dur
                
                transit_to_next = {
                    "mode": mode,
                    "duration_minutes": transit_dur,
                    "distance_km": transit_dist
                }
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
            "transit_to_next": transit_to_next
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


def analyze_itinerary(itinerary_data: dict) -> dict:
    """
    다중 일자 여행 계획 전체를 시뮬레이션 분석하여 종합 피드백 점수 및 경고 메시지를 계산.
    """
    days = itinerary_data.get("days", [])
    
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
            
        # 단일 날짜 일정 평가
        day_timeline, day_warnings, day_dist, day_trans_time = calculate_day_timeline(places, date_str)
        
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
                _, _, opt_dist, opt_trans_time = calculate_day_timeline(sorted_places, next(d["date"] for d in days if d["day_number"] == dm["day_number"]))
                
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

    return {
        "overall_score": final_score,
        "status_label": status_label,
        "status_description": status_description,
        "summary": {
            "total_distance_km": round(total_distance, 1),
            "total_transit_time_minutes": int(total_transit_time),
            "total_places_count": total_places_count,
            "total_duration_minutes": total_duration_minutes
        },
        "timeline": overall_timeline,
        "warnings": all_warnings,
        "improvement_points": improvement_points
    }
