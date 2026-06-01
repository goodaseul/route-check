from fastapi import APIRouter, Query
from schemas.search import UnifiedSearchResponse
from services.search_service import get_unified_search

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