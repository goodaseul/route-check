import os
import json
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("TOUR_API_DECODE_KEY")
BASE_URL = "https://apis.data.go.kr/B551011/KorService2"

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(CURRENT_DIR, "../data/category.json")


try:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        CATEGORY_DATA = json.load(f)
except Exception as e:
    print(f"category.json 로드 실패: {e}")
    CATEGORY_DATA = {}


def fetch_api_data(endpoint: str, params: dict = None) -> pd.DataFrame:
    url = f"{BASE_URL}/{endpoint}"
    default_params = {
        "serviceKey": API_KEY,
        "MobileOS": "ETC",
        "MobileApp": "RouteCheck",
        "_type": "json"
    }
    if params:
        default_params.update(params)
        
    try:
        response = requests.get(url, params=default_params)
        print(f"[DEBUG] 요청 URL: {response.url}")
        print(f"[DEBUG] 서버 응답 원본: {response.text[:200]}")

        if response.status_code != 200:
            return pd.DataFrame()
        
        res_json = response.json()
        if 'response' in res_json:
            body = res_json['response'].get('body', {})
            items = body.get('items', {})

            if items and 'item' in items:
                item_list = items['item']

                # 단일 객체 리턴 시 가독성 및 가공을 위해 리스트 형식으로 래핑
                if isinstance(item_list, dict):
                    item_list = [item_list]

                return pd.DataFrame(item_list)
        return pd.DataFrame()
    except Exception:
        return pd.DataFrame()

def get_unified_search(keyword: str) -> list:
    """
    [통합 검색 핵심 비즈니스 로직]
    - searchKeyword2 API는 키워드 하나로 관광지/숙소/축제를 모두 검색할 수 있는 API
    """
    unified_results = []
    
    params = {
        "keyword": keyword, 
        "numOfRows": 30, 
        "pageNo": 1, 
        "arrange": "C"
    }

    df = fetch_api_data(endpoint="searchKeyword2", params=params)
    
    if not df.empty:
        for _, row in df.iterrows():
            # 원본 데이터를 딕셔너리로 변환 및 NaN 방어 처리
            row_dict = row.to_dict()
            row_dict = {k: (None if pd.isna(v) else v) for k, v in row_dict.items()}
            
            # 신형 분류 체계 코드 추출 (lclsSystm3)
            lcls_code = str(row_dict.get("lclsSystm3") or row_dict.get("lcls_systm3") or "").strip()
            
            # 신형 코드로 로컬 마스터 데이터(category.json) 실시간 매칭
            category_info = CATEGORY_DATA.get(lcls_code, {"대분류명": "기타", "중분류명": "기타"})
            
            # 불필요한 필드 및 삭제 예정 필드 도려내기
            row_dict.pop("areaCode", None)
            row_dict.pop("sigunguCode", None)
            row_dict.pop("cat1", None)
            row_dict.pop("cat2", None)
            row_dict.pop("cat3", None)
            
            unified_results.append(row_dict)
                
    return unified_results