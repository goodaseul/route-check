import math

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
