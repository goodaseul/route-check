import math
import os
import requests
from sqlalchemy.orm import Session
from db.models import RouteDistanceCache, PlacesCache

KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY") or os.getenv("NEXT_PUBLIC_KAKAO_MAP_KEY")
TMAP_API_KEY = os.getenv("TMAP_API_KEY")
ODSAY_API_KEY = os.getenv("ODSAY_API_KEY")


def call_kakao_directions(lon1: float, lat1: float, lon2: float, lat2: float) -> dict:
    if not KAKAO_REST_API_KEY:
        raise ValueError("Kakao REST API Key is missing.")
    url = "https://apis-navi.kakaomobility.com/v1/directions"
    headers = {
        "Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"
    }
    params = {
        "origin": f"{lon1},{lat1}",
        "destination": f"{lon2},{lat2}",
        "priority": "RECOMMEND"
    }
    resp = requests.get(url, headers=headers, params=params, timeout=5)
    resp.raise_for_status()
    data = resp.json()
    if "routes" in data and len(data["routes"]) > 0:
        route = data["routes"][0]
        if route.get("result_code") != 0:
            raise ValueError(f"Kakao API returned error {route.get('result_code')}: {route.get('result_msg')}")
        summary = route["summary"]
        distance_km = round(summary["distance"] / 1000.0, 2)
        duration_minutes = int(math.ceil(summary["duration"] / 60.0))
        fare_taxi = summary.get("fare", {}).get("taxi", 0)
        return {
            "distance_km": distance_km,
            "duration_minutes": duration_minutes,
            "estimated_fare": fare_taxi
        }
    else:
        raise ValueError("Kakao API returned empty routes.")


def call_tmap_directions(lon1: float, lat1: float, lon2: float, lat2: float) -> dict:
    if not TMAP_API_KEY:
        raise ValueError("TMAP API Key is missing.")
    url = "https://apis.openapi.sk.com/tmap/routes?version=1"
    headers = {
        "appKey": TMAP_API_KEY,
        "Content-Type": "application/json"
    }
    body = {
        "startX": str(lon1),
        "startY": str(lat1),
        "endX": str(lon2),
        "endY": str(lat2),
        "reqCoordType": "WGS84GEO",
        "resCoordType": "WGS84GEO",
        "searchOption": "0"
    }
    resp = requests.post(url, headers=headers, json=body, timeout=5)
    resp.raise_for_status()
    data = resp.json()
    if "features" in data and len(data["features"]) > 0:
        properties = data["features"][0]["properties"]
        distance_m = properties.get("totalDistance", 0)
        duration_s = properties.get("totalTime", 0)
        taxi_fare = properties.get("taxiFare", 0)
        return {
            "distance_km": round(distance_m / 1000.0, 2),
            "duration_minutes": int(math.ceil(duration_s / 60.0)),
            "estimated_fare": taxi_fare
        }
    else:
        raise ValueError("TMap API returned empty routes.")


def call_odsay_transit(lon1: float, lat1: float, lon2: float, lat2: float) -> dict:
    if not ODSAY_API_KEY:
        raise ValueError("ODsay API Key is missing.")
    url = "https://api.odsay.com/v1/api/searchPubTransPathT"
    params = {
        "apiKey": ODSAY_API_KEY,
        "SX": str(lon1),
        "SY": str(lat1),
        "EX": str(lon2),
        "EY": str(lat2)
    }
    resp = requests.get(url, params=params, timeout=5)
    resp.raise_for_status()
    data = resp.json()
    if "result" in data and "path" in data["result"] and len(data["result"]["path"]) > 0:
        path_info = data["result"]["path"][0]["info"]
        distance_m = path_info.get("totalDistance", 0)
        duration_minutes = path_info.get("totalTime", 0)
        fare = path_info.get("payment", 0)
        return {
            "distance_km": round(distance_m / 1000.0, 2),
            "duration_minutes": int(duration_minutes),
            "estimated_fare": int(fare)
        }
    else:
        raise ValueError("ODSay API returned no paths.")


def get_route_info_with_cache(
    db: Session,
    origin_id: int, lat1: float, lon1: float,
    dest_id: int, lat2: float, lon2: float,
    transport_mode: str
) -> dict:
    """
    출발지와 목적지의 위경도 좌표를 소수점 4자리 그리드로 매칭하여
    DB 캐시에서 경로 정보를 조회하고, 캐시 미스 시 외부 API를 호출하여 저장합니다.
    """
    orig_lat_grid = round(lat1, 4)
    orig_lon_grid = round(lon1, 4)
    dest_lat_grid = round(lat2, 4)
    dest_lon_grid = round(lon2, 4)

    # DB 캐시 확인
    try:
        cached = db.query(RouteDistanceCache).filter(
            RouteDistanceCache.origin_lat_grid == orig_lat_grid,
            RouteDistanceCache.origin_lon_grid == orig_lon_grid,
            RouteDistanceCache.dest_lat_grid == dest_lat_grid,
            RouteDistanceCache.dest_lon_grid == dest_lon_grid,
            RouteDistanceCache.transport_mode == transport_mode
        ).first()

        if cached:
            return {
                "distance_km": float(cached.distance_km),
                "duration_minutes": int(cached.duration_minutes),
                "estimated_fare": int(cached.estimated_fare) if cached.estimated_fare else 0,
                "source": "cache"
            }
    except Exception as cache_err:
        print(f"[Cache Query Error] Failed to fetch cache: {cache_err}")

    # API 호출 및 계산
    distance_km = 0.0
    duration_minutes = 0
    estimated_fare = 0
    api_success = False
    data_source = "heuristics"

    if transport_mode in ["car", "taxi"]:
        # Kakao Directions API 시도
        if KAKAO_REST_API_KEY:
            try:
                res = call_kakao_directions(lon1, lat1, lon2, lat2)
                distance_km = res["distance_km"]
                duration_minutes = res["duration_minutes"]
                estimated_fare = res["estimated_fare"] if transport_mode == "taxi" else 0
                api_success = True
                data_source = "api"
            except Exception as e:
                print(f"[Map API Warning] Kakao Directions API failed: {e}. Trying TMap or Heuristics.")

        # TMap Directions API 시도
        if not api_success and TMAP_API_KEY:
            try:
                res = call_tmap_directions(lon1, lat1, lon2, lat2)
                distance_km = res["distance_km"]
                duration_minutes = res["duration_minutes"]
                estimated_fare = res["estimated_fare"] if transport_mode == "taxi" else 0
                api_success = True
                data_source = "api"
            except Exception as e:
                print(f"[Map API Warning] TMap Directions API failed: {e}. Trying Heuristics.")

        # 모두 실패 시 추정 연산 (Heuristics)
        if not api_success:
            heuristics = estimate_transit_info(lat1, lon1, lat2, lon2)
            alt = heuristics["alternatives"].get(transport_mode, heuristics["alternatives"]["car"])
            distance_km = alt["distance_km"]
            duration_minutes = alt["duration_minutes"]
            estimated_fare = alt.get("estimated_fare", 0) if transport_mode == "taxi" else 0
            api_success = True

    elif transport_mode == "public":
        # ODSay Public Transit API 시도
        if ODSAY_API_KEY:
            try:
                res = call_odsay_transit(lon1, lat1, lon2, lat2)
                distance_km = res["distance_km"]
                duration_minutes = res["duration_minutes"]
                estimated_fare = res["estimated_fare"]
                api_success = True
                data_source = "api"
            except Exception as e:
                print(f"[Map API Warning] ODSay Transit API failed: {e}. Trying Heuristics.")

        # 실패 시 추정 연산
        if not api_success:
            heuristics = estimate_transit_info(lat1, lon1, lat2, lon2)
            alt = heuristics["alternatives"]["public"]
            distance_km = alt["distance_km"]
            duration_minutes = alt["duration_minutes"]
            estimated_fare = alt.get("estimated_fare", 0)
            api_success = True

    else:
        # walk, bicycle 등은 속도 기반 추정 연산 적용
        heuristics = estimate_transit_info(lat1, lon1, lat2, lon2)
        alt = heuristics["alternatives"].get(transport_mode, heuristics["alternatives"]["walk"])
        distance_km = alt["distance_km"]
        duration_minutes = alt["duration_minutes"]
        estimated_fare = 0
        api_success = True

    # 성공 시 DB 캐시 저장
    if api_success:
        try:
            new_cache = RouteDistanceCache(
                origin_id=origin_id,
                destination_id=dest_id,
                origin_lat_grid=orig_lat_grid,
                origin_lon_grid=orig_lon_grid,
                dest_lat_grid=dest_lat_grid,
                dest_lon_grid=dest_lon_grid,
                transport_mode=transport_mode,
                distance_km=distance_km,
                duration_minutes=duration_minutes,
                estimated_fare=estimated_fare
            )
            db.add(new_cache)
            db.commit()
        except Exception as cache_err:
            db.rollback()
            print(f"[Cache Save Warning] Failed to save route cache: {cache_err}")

    return {
        "distance_km": distance_km,
        "duration_minutes": duration_minutes,
        "estimated_fare": estimated_fare,
        "source": data_source
    }


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    위경도 좌표를 바탕으로 두 지점 간의 직선(하버사인) 거리(km)를 계산.
    """
    R = 6371.0 # 지구 반지름 (km)
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_phi / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) *
         math.sin(delta_lambda / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def estimate_transit_info(lat1: float, lon1: float, lat2: float, lon2: float) -> dict:
    """
    두 위경도 좌표 사이의 각 교통수단별 예상 소요 시간(분) 및 주행 거리(km)를 추정.
    """
    # 1. 직선 거리 계산
    straight_distance = calculate_haversine_distance(lat1, lon1, lat2, lon2)
    
    # 두 지점이 완전히 동일하거나 극히 가까운 경우 (예: 50m 이하)
    if straight_distance < 0.05:
        return {
            "distance_km": 0.0,
            "duration_minutes": 0,
            "alternatives": {
                "car": {"distance_km": 0.0, "duration_minutes": 0},
                "taxi": {"distance_km": 0.0, "duration_minutes": 0, "estimated_fare": 0},
                "public": {"distance_km": 0.0, "duration_minutes": 0},
                "walk": {"distance_km": 0.0, "duration_minutes": 0},
                "bicycle": {"distance_km": 0.0, "duration_minutes": 0}
            }
        }
    
    # 2. 교통수단별 가중치 연산
    # [자동차 & 택시]
    # 실제 주행 거리는 직선 거리의 약 1.35배로 가정
    car_dist = round(straight_distance * 1.35, 2)
    # 거리별 평균 속도 정의 (단거리 가감속 및 신호 대기 반영)
    if car_dist < 3.0:
        speed_kmh = 25.0
        base_delay = 2.0
    elif car_dist < 15.0:
        speed_kmh = 40.0
        base_delay = 3.0
    else:
        speed_kmh = 60.0
        base_delay = 5.0
    
    car_time = int(math.ceil((car_dist / speed_kmh) * 60 + base_delay))
    
    # 택시 요금 추정 (2026년 한국 중형택시 기본 기준: 기본요금 4,800원 + 거리비례 요금 적용)
    # 기본거리 1.6km, 이후 131m당 100원
    taxi_fare = 4800
    if car_dist > 1.6:
        extra_dist = car_dist - 1.6
        taxi_fare += int(math.ceil(extra_dist * 1000 / 131)) * 100
    # 100원 단위 절상
    taxi_fare = int(math.ceil(taxi_fare / 100) * 100)
    
    # [대중교통]
    # 실제 주행 거리 직선의 1.4배 가정, 버스 배차 및 환승 대기시간 반영을 위한 base_delay(12분) 추가
    pub_dist = round(straight_distance * 1.40, 2)
    pub_speed = 22.0 # 시내버스/지하철 가중 평균 속도
    pub_time = int(math.ceil((pub_dist / pub_speed) * 60 + 12.0))
    
    # [도보]
    # 도보 거리는 비교적 직선에 가까우므로 1.15배 가정
    walk_dist = round(straight_distance * 1.15, 2)
    walk_speed = 4.0 # 4 km/h
    walk_time = int(math.ceil((walk_dist / walk_speed) * 60))
    
    # [자전거]
    bike_dist = round(straight_distance * 1.20, 2)
    bike_speed = 15.0 # 15 km/h
    bike_time = int(math.ceil((bike_dist / bike_speed) * 60))
    
    return {
        "distance_km": car_dist,
        "duration_minutes": car_time, # 기본값은 자동차 시간 반환
        "alternatives": {
            "car": {
                "distance_km": car_dist,
                "duration_minutes": car_time
            },
            "taxi": {
                "distance_km": car_dist,
                "duration_minutes": car_time,
                "estimated_fare": taxi_fare
            },
            "public": {
                "distance_km": pub_dist,
                "duration_minutes": pub_time
            },
            "walk": {
                "distance_km": walk_dist,
                "duration_minutes": walk_time
            },
            "bicycle": {
                "distance_km": bike_dist,
                "duration_minutes": bike_time
            }
        }
    }
