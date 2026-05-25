from fastapi import APIRouter, Query
from schemas.search import UnifiedSearchResponse
from services.search_service import get_unified_search

router = APIRouter(prefix="/api", tags=["Search"])

@router.get("/search", response_model=UnifiedSearchResponse)
async def search_places(keyword: str = Query(...)):
    results = get_unified_search(keyword=keyword)
    
    return {
        "keyword": keyword,
        "total_count": len(results),
        "results": results
    }