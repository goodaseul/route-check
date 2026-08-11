from fastapi import APIRouter, Query
from schemas.search import UnifiedSearchResponse, RecommendedPlacesResponse
from services.search_service import get_recommended_places, get_unified_search

router = APIRouter(prefix="/api", tags=["Search"])

@router.get("/search", response_model=UnifiedSearchResponse)
async def search_places(
    keyword: str = Query(...),
    num_of_rows: int = Query(default=100, alias="numOfRows"),
    page_no: int = Query(default=1, alias="pageNo")
):
    results, total_count = get_unified_search(keyword=keyword, num_of_rows=num_of_rows, page_no=page_no)
    
    return {
        "keyword": keyword,
        "total_count": total_count,
        "results": results
    }


@router.get("/recommendations", response_model=RecommendedPlacesResponse)
async def recommend_places(
    num_of_rows: int = Query(default=4, ge=1, le=20, alias="numOfRows"),
    page_no: int = Query(default=1, ge=1, alias="pageNo"),
    area_code: str | None = Query(default=None, alias="areaCode"),
    sigungu_code: str | None = Query(default=None, alias="sigunguCode"),
    content_type_id: str | None = Query(default=None, alias="contentTypeId"),
):
    results, total_count = get_recommended_places(
        num_of_rows=num_of_rows,
        page_no=page_no,
        area_code=area_code,
        sigungu_code=sigungu_code,
        content_type_id=content_type_id,
    )
    return {"total_count": total_count, "results": results}
