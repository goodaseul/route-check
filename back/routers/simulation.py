from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from schemas.simulation import (
    TransitInfoRequest, TransitInfoResponse,
    SimulationRequest, SimulationResponse,
    ApplyReorderSuggestionRequest, ApplyReorderSuggestionResponse,
)
from services.route_service import get_route_info_with_cache
from services.simulation_service import analyze_itinerary, apply_reorder_suggestion

router = APIRouter(prefix="/api", tags=["Simulation"])

@router.post("/route/transit-info", response_model=TransitInfoResponse, status_code=status.HTTP_200_OK)
async def get_transit_info(request: TransitInfoRequest, db: Session = Depends(get_db)):
    """
    ## 두 위경도 좌표 사이의 각 이동 수단별 거리 및 소요 시간 정보를 조회 (DB 캐시 및 외부 API 사용).
    """
    origin = request.origin
    destination = request.destination
    
    if origin.mapx is None or origin.mapy is None or destination.mapx is None or destination.mapy is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="출발지와 도착지 모두 경도(mapx)와 위도(mapy) 정보를 제공해야 계산할 수 있습니다."
        )
        
    try:
        # 일정 편집 화면은 선택 수단만 조회해 외부 API 쿼터를 절약한다.
        # 전체 비교는 명시적으로 요청하거나 최종 시뮬레이션 분석에서 수행한다.
        alternatives = {}
        modes = [request.transport_mode]
        if request.include_alternatives:
            modes = list(dict.fromkeys([request.transport_mode, "car", "public"]))

        for mode in modes:
            route_res = get_route_info_with_cache(
                db=db,
                origin_id=origin.contentid, lat1=origin.mapy, lon1=origin.mapx,
                dest_id=destination.contentid, lat2=destination.mapy, lon2=destination.mapx,
                transport_mode=mode
            )
            alternatives[mode] = {
                "distance_km": route_res["distance_km"],
                "duration_minutes": route_res["duration_minutes"],
                "estimated_fare": route_res.get("estimated_fare") if mode in ["taxi", "public"] else None,
                "source": route_res.get("source"),
            }
            
        selected_mode = request.transport_mode
        selected_alt = alternatives[selected_mode]
        
        return TransitInfoResponse(
            origin_id=origin.contentid,
            destination_id=destination.contentid,
            selected_mode=selected_mode,
            distance_km=selected_alt["distance_km"],
            duration_minutes=selected_alt["duration_minutes"],
            alternatives=alternatives
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이동 경로 및 소요 시간 정보 연산 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/simulation/analyze", response_model=SimulationResponse, status_code=status.HTTP_200_OK)
async def analyze_travel_itinerary(request: SimulationRequest, db: Session = Depends(get_db)):
    """
    ## 사용자가 등록한 전체 여행 스케줄을 분석하여 시뮬레이션 점수, 경고, 개선 동선을 산출.
    """
    try:
        # Pydantic 모델을 dict 구조로 변환하여 분석 서비스에 전달
        itinerary_dict = request.model_dump()
        analysis_result = analyze_itinerary(itinerary_dict, db)
        return SimulationResponse(**analysis_result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"여행 일정을 시뮬레이션 분석하는 중 오류가 발생했습니다: {str(e)}"
        )


@router.post(
    "/simulation/apply-reorder",
    response_model=ApplyReorderSuggestionResponse,
    status_code=status.HTTP_200_OK,
)
async def apply_reorder(
    request: ApplyReorderSuggestionRequest,
    db: Session = Depends(get_db),
):
    """검증된 장소 순서를 적용하고 변경 전·후 일정을 다시 분석한다."""
    try:
        return apply_reorder_suggestion(request.model_dump(), db)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"순서 변경 제안을 적용하는 중 오류가 발생했습니다: {str(exc)}",
        ) from exc
