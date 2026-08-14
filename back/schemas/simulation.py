from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal

TransportMode = Literal["car", "taxi", "public", "walk", "bicycle"]

# ==========================================
# 1. 실시간 교통정보 조회 관련 스키마 (Transit Info)
# ==========================================

class LocationPoint(BaseModel):
    contentid: int = Field(..., description="장소 고유 ID")
    mapx: Optional[float] = Field(None, description="경도 (Longitude)")
    mapy: Optional[float] = Field(None, description="위도 (Latitude)")

class TransitInfoRequest(BaseModel):
    origin: LocationPoint = Field(..., description="출발지 정보")
    destination: LocationPoint = Field(..., description="도착지 정보")
    transport_mode: TransportMode = Field(default="car", description="기본 교통 수단")
    include_alternatives: bool = Field(default=False, description="자차/대중교통 대안도 함께 조회할지 여부")

class TransportDetail(BaseModel):
    distance_km: float = Field(..., description="이동 거리 (km)")
    duration_minutes: int = Field(..., description="소요 시간 (분)")
    estimated_fare: Optional[int] = Field(None, description="예상 요금 (원) - 택시 전용")
    source: Optional[str] = Field(None, description="경로 데이터 출처 (cache/api/heuristics)")

class TransitInfoResponse(BaseModel):
    origin_id: int
    destination_id: int
    selected_mode: str
    distance_km: float
    duration_minutes: int
    alternatives: Dict[str, TransportDetail]


# ==========================================
# 2. 일정 시뮬레이션 분석 관련 스키마 (Simulation Analyze)
# ==========================================

class SimulationPlaceInput(BaseModel):
    sequence: int = Field(..., description="방문 순서 (1부터 시작)")
    contentid: int = Field(..., description="장소 고유 ID")
    title: Optional[str] = Field(None, description="장소명")
    mapx: Optional[float] = Field(None, description="경도")
    mapy: Optional[float] = Field(None, description="위도")
    stay_duration_minutes: Optional[int] = Field(None, description="체류 시간 (분)")
    transport_mode_to_next: Optional[TransportMode] = Field(None, description="다음 장소로의 이동 수단. 없으면 최상위 transport_mode 사용")

class SimulationDayInput(BaseModel):
    day_number: int = Field(..., description="여행 일차 (1, 2, ...)")
    date: str = Field(..., description="해당 일차 날짜 (YYYY-MM-DD)")
    places: List[SimulationPlaceInput] = Field(..., description="해당 일차의 방문 장소 리스트 (순서 정렬됨)")

class SimulationRequest(BaseModel):
    start_date: str = Field(..., description="여행 시작일 (YYYY-MM-DD)")
    end_date: str = Field(..., description="여행 종료일 (YYYY-MM-DD)")
    transport_mode: TransportMode = Field(default="car", description="전체 일정의 기본 이동 수단")
    days: List[SimulationDayInput] = Field(..., description="일자별 상세 일정 정보")


# 분석 응답 스키마
class TransitDetailResponse(BaseModel):
    mode: str = Field(..., description="이동 수단")
    duration_minutes: int = Field(..., description="소요 시간 (분)")
    distance_km: float = Field(..., description="이동 거리 (km)")
    estimated_fare: Optional[int] = Field(None, description="예상 요금 (원)")
    source: Optional[str] = Field(None, description="경로 데이터 출처 (cache/api/heuristics)")
    recommended_mode: Optional[str] = Field(None, description="비교 결과 추천 이동 수단")
    alternatives: Dict[str, TransportDetail] = Field(default_factory=dict, description="자동차/대중교통 비교")

class CongestionResponse(BaseModel):
    peak_start: str
    peak_end: str
    is_overlap: bool
    basis: str = Field(default="rule_based_estimate", description="혼잡도 판정 근거")

class SimulationPlaceOutput(BaseModel):
    sequence: int = Field(..., description="방문 순서")
    contentid: int = Field(..., description="장소 고유 ID")
    title: str = Field(..., description="장소명")
    start_time: str = Field(..., description="방문 예정 시작 시각 (HH:MM)")
    end_time: str = Field(..., description="방문 예정 종료 시각 (HH:MM)")
    stay_duration_minutes: int = Field(..., description="체류 시간 (분)")
    transit_to_next: Optional[TransitDetailResponse] = Field(None, description="다음 목적지로의 이동 정보 (마지막 목적지인 경우 null)")
    congestion: CongestionResponse = Field(..., description="방문 시간과 예상 혼잡 시간의 중첩 정보")

class SimulationDayOutput(BaseModel):
    day_number: int = Field(..., description="여행 일차")
    date: str = Field(..., description="해당 일차 날짜")
    schedule: List[SimulationPlaceOutput] = Field(..., description="계산된 타임라인 일정")

class SimulationWarning(BaseModel):
    type: str = Field(..., description="경고 타입 ('CLOSED_PLACE', 'OUT_OF_OPERATING_HOURS', 'TOO_PACKED_SCHEDULE', 'EXCESSIVE_DISTANCE')")
    day_number: int = Field(..., description="경고 발생 여행 일차")
    contentid: Optional[int] = Field(None, description="경고 연관 장소 ID (해당되는 경우)")
    title: Optional[str] = Field(None, description="경고 연관 장소명")
    message: str = Field(..., description="상세 안내 메시지")

class ImprovementPoint(BaseModel):
    type: str = Field(..., description="개선 제안 타입 ('REORDER_SUGGESTION')")
    day_number: int = Field(..., description="해당 일차")
    message: str = Field(..., description="추천 안내 메시지")
    suggested_order: List[int] = Field(..., description="권장되는 방문 순서 (sequence 리스트)")

class SimulationSummary(BaseModel):
    total_distance_km: float = Field(..., description="총 이동 거리")
    total_transit_time_minutes: int = Field(..., description="총 이동 시간 (분)")
    total_places_count: int = Field(..., description="방문 장소 수")
    total_duration_minutes: int = Field(..., description="총 소요 시간 (체류 시간 + 이동 시간)")

class SimulationResponse(BaseModel):
    overall_score: int = Field(..., description="종합 시뮬레이션 점수 (0-100)")
    status_label: str = Field(..., description="일정 상태 한글 요약 (예: '무난한 일정')")
    status_description: str = Field(..., description="일정 상태 상세 서술")
    summary: SimulationSummary = Field(..., description="종합 여행 수치 요약")
    timeline: List[SimulationDayOutput] = Field(..., description="일자별 타임라인 결과 목록")
    warnings: List[SimulationWarning] = Field(..., description="스케줄 오류 및 이상 항목 경고 리스트")
    improvement_points: List[ImprovementPoint] = Field(..., description="동선 및 배치 개선 제안 항목")

    # Next.js 와이어프레임(4, 5번 화면) 호환용 AI 분석 결과 추가 필드
    total_score: Optional[int] = Field(None, description="AI 종합 분석 점수 (100점 만점)")
    status_message: Optional[str] = Field(None, description="AI 요약 상태 메시지")
    analysis_summary: Optional[Dict[str, str]] = Field(None, description="AI가 가공한 누적 거리 및 이동 시간 요약")
    suggestions: Optional[List[Dict[str, Any]]] = Field(None, description="AI 개선 제안 목록 (Applied Route 포함)")
