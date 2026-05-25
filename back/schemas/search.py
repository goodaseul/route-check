from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class SearchResultItem(BaseModel):
    title: str                  # 장소/축제/숙소 이름
    addr: Optional[str] = None  # 주소
    image: Optional[str] = None # 대표 이미지
    contentId: str              # 고유 ID (나중에 상세페이지 갈 때 필수)
    contentTypeId: str          # 타입 ID (12:관광지, 32:숙소 등)
    category_main: str          # 대분류 한글 이름
    category_sub: str           # 중분류 한글 이름

class UnifiedSearchResponse(BaseModel):
    keyword: str
    total_count: int
    results: List[Dict[str, Any]]
    # results: List[SearchResultItem]