from fastapi import APIRouter, HTTPException, status
from schemas.simulation import (
    TransitInfoRequest, TransitInfoResponse,
    SimulationRequest, SimulationResponse
)
from services.route_service import estimate_transit_info
from services.simulation_service import analyze_itinerary

router = APIRouter(prefix="/api", tags=["Simulation"])

@router.post("/route/transit-info", response_model=TransitInfoResponse, status_code=status.HTTP_200_OK)
async def get_transit_info(request: TransitInfoRequest):
    """
    ## 두 위경도 좌표 사이의 각 이동 수단별 거리 및 소요 시간 정보를 조회.
    """
    origin = request.origin
    destination = request.destination
    
    if origin.mapx is None or origin.mapy is None or destination.mapx is None or destination.mapy is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="출발지와 도착지 모두 경도(mapx)와 위도(mapy) 정보를 제공해야 계산할 수 있습니다."
        )
        
    try:
        route_data = estimate_transit_info(
            lat1=origin.mapy, lon1=origin.mapx,
            lat2=destination.mapy, lon2=destination.mapx
        )
        
        selected_mode = request.transport_mode
        selected_alt = route_data["alternatives"].get(selected_mode, route_data["alternatives"]["car"])
        
        return TransitInfoResponse(
            origin_id=origin.contentid,
            destination_id=destination.contentid,
            selected_mode=selected_mode,
            distance_km=selected_alt["distance_km"],
            duration_minutes=selected_alt["duration_minutes"],
            alternatives=route_data["alternatives"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이동 경로 및 소요 시간 정보 연산 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/simulation/analyze", response_model=SimulationResponse, status_code=status.HTTP_200_OK)
async def analyze_travel_itinerary(request: SimulationRequest):
    """
    ## 사용자가 등록한 전체 여행 스케줄을 분석하여 시뮬레이션 점수, 경고, 개선 동선을 산출.
    """
    try:
        # Pydantic 모델을 dict 구조로 변환하여 분석 서비스에 전달
        itinerary_dict = request.model_dump()
        analysis_result = analyze_itinerary(itinerary_dict)
        return SimulationResponse(**analysis_result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"여행 일정을 시뮬레이션 분석하는 중 오류가 발생했습니다: {str(e)}"
        )
