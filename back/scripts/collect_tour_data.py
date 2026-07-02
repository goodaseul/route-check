import os
import sys
import time
import logging
import requests
import pandas as pd
from dotenv import load_dotenv

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# 동적 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 환경 변수 로드
possible_dotenv_paths = [
    os.path.join(BASE_DIR, ".env"),
    os.path.join(BASE_DIR, "..", ".env"),
    os.path.join(BASE_DIR, "..", "..", ".env"),
]
for path in possible_dotenv_paths:
    if os.path.exists(path):
        load_dotenv(dotenv_path=path)
        logger.info(f"환경 변수 로드 완료: {path}")
        break
else:
    load_dotenv()
    logger.info("기본 load_dotenv()를 통해 환경 변수를 로드했습니다.")

API_KEY = os.getenv("TOUR_API_DECODE_KEY")
BASE_URL = "https://apis.data.go.kr/B551011/KorService2"

if not API_KEY:
    logger.error("환경 변수에 API_KEY (TOUR_API_DECODE_KEY)가 설정되어 있지 않습니다.")

LOCK_FILE = os.path.join(BASE_DIR, "collect_tour_data.lock")

class FileLock:
    def __init__(self, lock_path):
        self.lock_path = lock_path
        self.fd = None

    def acquire(self):
        try:
            # 락 파일이 만료되었는지 확인 (1시간 초과)
            if os.path.exists(self.lock_path):
                mtime = os.path.getmtime(self.lock_path)
                if time.time() - mtime > 3600:
                    logger.warning("만료된 락 파일이 발견되어 삭제합니다.")
                    try:
                        os.remove(self.lock_path)
                    except OSError:
                        pass

            self.fd = os.open(self.lock_path, os.O_CREAT | os.O_WRONLY | os.O_EXCL)
            # 파일에 PID와 타임스탬프 기록
            os.write(self.fd, f"PID: {os.getpid()}\nTime: {time.time()}\n".encode('utf-8'))
            return True
        except FileExistsError:
            return False

    def release(self):
        if self.fd is not None:
            try:
                os.close(self.fd)
            except OSError:
                pass
            try:
                os.remove(self.lock_path)
            except OSError:
                pass
            self.fd = None

def fetch_api_data(endpoint, base_url=BASE_URL, params=None):
    url = f"{base_url}/{endpoint}"
    default_params = {
        "serviceKey": API_KEY,
        "MobileOS": "ETC",
        "MobileApp": "RouteCheck",
        "_type": "json"
    }
    if params:
        default_params.update(params)
    
    try:
        response = requests.get(url, params=default_params, timeout=15)

        if response.status_code == 200:
            res_json = response.json()

            if 'response' in res_json:
                header = res_json['response'].get('header', {})
                result_code = header.get('resultCode')

                if result_code != '0000':
                    logger.error(f"API 오류 [{result_code}]: {header.get('resultMsg')} ({endpoint})")
                    return pd.DataFrame()
                
                body = res_json['response'].get('body', {})
                items = body.get('items', {})

                if not items or items == "":
                    return pd.DataFrame()
                
                if 'item' in items:
                    item_list = items['item']

                    if isinstance(item_list, dict):
                           item_list = [item_list]
                    return pd.DataFrame(item_list)
        elif response.status_code == 429:
            logger.error(f"{endpoint} API 호출 횟수 제한 초과(429). 대기 후 재시도합니다...")
            time.sleep(2)
            # 1회 재시도
            response = requests.get(url, params=default_params, timeout=15)
            if response.status_code == 200:
                res_json = response.json()
                if 'response' in res_json:
                    body = res_json['response'].get('body', {})
                    items = body.get('items', {})
                    if items and 'item' in items:
                        item_list = items['item']
                        if isinstance(item_list, dict):
                            item_list = [item_list]
                        return pd.DataFrame(item_list)
            logger.error(f"재시도 실패. HTTP 상태 코드: {response.status_code}")
            return pd.DataFrame()
        else:
            logger.error(f"HTTP 오류 코드: {response.status_code} ({url})")
            return pd.DataFrame()

    except Exception as e:
        logger.error(f"네트워크 또는 파싱 오류 발생 ({endpoint}): {e}")
        return pd.DataFrame()
    
    return pd.DataFrame()
    
def fill_missing_regions(row):
    sido = row['lDongRegnNm']
    sigungu = row['lDongSignguNm']
    
    if pd.notna(sido) and pd.notna(sigungu) and str(sido).strip() != '' and str(sigungu).strip() != '':
        return sido, sigungu
        
    addr = str(row.get('addr1') or '').strip()
    
    sido_map = {
        '서울': '서울특별시', '부산': '부산광역시', '대구': '대구광역시',
        '인천': '인천광역시', '광주': '광주광역시', '대전': '대전광역시',
        '울산': '울산광역시', '세종': '세종특별자치시', '경기': '경기도',
        '강원': '강원특별자치도', '충북': '충청북도', '충청북': '충청북도',
        '충남': '충청남도', '충청남': '충청남도', '전북': '전북특별자치도',
        '전라북': '전북특별자치도', '전남': '전라남도', '전라남': '전라남도',
        '경북': '경상북도', '경상북': '경상북도', '경남': '경상남도',
        '경상남': '경상남도', '제주': '제주특별자치도'
    }
    
    if addr:
        tokens = addr.split()
        if len(tokens) >= 1:
            first_token = tokens[0]
            parsed_sido = None

            for key, val in sido_map.items():
                if first_token.startswith(key):
                    parsed_sido = val
                    break
                
            if not parsed_sido:
                parsed_sido = first_token
                
            parsed_sigungu = None
            if len(tokens) >= 3 and tokens[1].endswith('시') and tokens[2].endswith('구'):
                parsed_sigungu = tokens[1] + ' ' + tokens[2]
            elif len(tokens) >= 2:
                parsed_sigungu = tokens[1]
            else:
                parsed_sigungu = parsed_sido
                
            return parsed_sido, parsed_sigungu

    reg_cd = str(row.get('lDongRegnCd') or '').strip()
    if reg_cd and reg_cd.lower() != 'nan':
        cd_map = {
            '11': '서울특별시', '26': '부산광역시', '27': '대구광역시', '28': '인천광역시',
            '29': '광주광역시', '30': '대전광역시', '31': '울산광역시', '36': '세종특별자치시',
            '41': '경기도', '42': '강원특별자치도', '43': '충청북도', '44': '충청남도',
            '45': '전북특별자치도', '46': '전라남도', '47': '경상북도', '48': '경상남도',
            '50': '제주특별자치도', '51': '강원특별자치도', '52': '전북특별자치도'
        }
        sido_val = cd_map.get(reg_cd, '미분류')
        return sido_val, '미분류'
        
    return '미분류', '미분류'

def collect_data():
    if not API_KEY:
        logger.error("API_KEY (TOUR_API_DECODE_KEY)가 정의되지 않았습니다. 수집을 건너뜁니다.")
        return False

    lock = FileLock(LOCK_FILE)
    if not lock.acquire():
        logger.warning("이미 다른 데이터 수집 프로세스가 실행 중입니다. 건너뜁니다...")
        return False

    try:
        logger.info("관광 데이터 수집을 시작합니다...")

        # 1. areaBasedList2
        all_dfs = []
        page_no = 1
        rows_per_page = 5000
        
        while True:
            logger.info(f"areaBasedList2 - {page_no}페이지 요청 중...")
            params = {
                "numOfRows": rows_per_page,
                "pageNo": page_no
            }
            df_chunk = fetch_api_data(endpoint="areaBasedList2", params=params)

            if df_chunk.empty:
                logger.info("areaBasedList2 청크에 더 이상 데이터가 없거나 오류가 발생했습니다.")
                break
            
            all_dfs.append(df_chunk)
            
            if len(df_chunk) < rows_per_page:
                break
            
            page_no += 1
            time.sleep(0.3)

        if not all_dfs:
            logger.error("areaBasedList2에서 데이터를 전혀 수집하지 못했습니다. 작업을 중단합니다.")
            return False

        df_area_list_all = pd.concat(all_dfs, ignore_index=True)
        logger.info(f"areaBasedList2 수집 완료. 총 아이템 수: {len(df_area_list_all)}")

        # 삭제할 컬럼
        columns_to_drop = ['areacode', 'sigungucode', 'cat1', 'cat2', 'cat3']
        df_area_list_all.drop(columns=columns_to_drop, inplace=True, errors='ignore')

        # 좌표 데이터 정제
        df_area_list_all['mapx_num'] = pd.to_numeric(df_area_list_all['mapx'].replace("null", None).replace("", None), errors='coerce')
        df_area_list_all['mapy_num'] = pd.to_numeric(df_area_list_all['mapy'].replace("null", None).replace("", None), errors='coerce')

        invalid_coords_mask = (
            df_area_list_all['mapx_num'].isna() |
            df_area_list_all['mapy_num'].isna() |
            (df_area_list_all['mapx_num'] == 0) |
            (df_area_list_all['mapy_num'] == 0)
        )
        logger.info(f"유효하지 않은 좌표 개수 (제거 대상): {invalid_coords_mask.sum()}")
        df_area_list_all = df_area_list_all[~invalid_coords_mask].copy()
        df_area_list_all.drop(columns=['mapx_num', 'mapy_num'], inplace=True, errors='ignore')

        # 2. ldongCode2
        logger.info("ldongCode2 데이터 수집을 시작합니다...")
        sido_dfs = []
        page_no = 1
        rows_per_page = 500

        while True:
            sido_params = {
                "lDongListYn": "Y",
                "numOfRows": rows_per_page,
                "pageNo": page_no
            }
            df_sido_chunk = fetch_api_data(endpoint="ldongCode2", params=sido_params)

            if df_sido_chunk.empty:
                break
            sido_dfs.append(df_sido_chunk)

            if len(df_sido_chunk) < rows_per_page:
                break
            
            page_no += 1
            time.sleep(0.2)

        if not sido_dfs:
            logger.error("ldongCode2에서 시도/시군구 코드를 수집하지 못했습니다. 작업을 중단합니다.")
            return False

        df_sido = pd.concat(sido_dfs, ignore_index=True)
        logger.info(f"ldongCode2 수집 완료. 총 아이템 수: {len(df_sido)}")

        # 키 값을 문자열로 변환하고 공백 제거
        df_area_list_all['lDongRegnCd'] = df_area_list_all['lDongRegnCd'].astype(str).str.strip()
        df_area_list_all['lDongSignguCd'] = df_area_list_all['lDongSignguCd'].astype(str).str.strip()
        df_sido['lDongRegnCd'] = df_sido['lDongRegnCd'].astype(str).str.strip()
        df_sido['lDongSignguCd'] = df_sido['lDongSignguCd'].astype(str).str.strip()

        df_sido_clean = df_sido[['lDongRegnCd', 'lDongRegnNm', 'lDongSignguCd', 'lDongSignguNm']].drop_duplicates()

        df_final = pd.merge(
            df_area_list_all,
            df_sido_clean,
            on=['lDongRegnCd', 'lDongSignguCd'],
            how='left'
        )

        # 지역 정보 자동 보정 적용
        parsed_regions = df_final.apply(fill_missing_regions, axis=1)
        df_final['lDongRegnNm'] = [r[0] for r in parsed_regions]
        df_final['lDongSignguNm'] = [r[1] for r in parsed_regions]

        # 3. lclsSystmCode2
        logger.info("lclsSystmCode2 데이터 수집을 시작합니다...")
        cat_dfs = []
        page_no = 1
        rows_per_page = 300

        while True:
            cat_params = {
                "lclsSystmListYn": "Y",
                "numOfRows": rows_per_page,
                "pageNo": page_no
            }
            df_cat_chunk = fetch_api_data(endpoint="lclsSystmCode2", params=cat_params)

            if df_cat_chunk.empty:
                break
            cat_dfs.append(df_cat_chunk)

            if len(df_cat_chunk) < rows_per_page:
                break

            page_no += 1
            time.sleep(0.2)

        if not cat_dfs:
            logger.error("lclsSystmCode2에서 카테고리 정보를 수집하지 못했습니다. 작업을 중단합니다.")
            return False

        df_categories = pd.concat(cat_dfs, ignore_index=True)
        logger.info(f"lclsSystmCode2 수집 완료. 총 아이템 수: {len(df_categories)}")

        df_categories_clean = df_categories[[
            'lclsSystm1Cd', 'lclsSystm1Nm',
            'lclsSystm2Cd', 'lclsSystm2Nm',
            'lclsSystm3Cd', 'lclsSystm3Nm'
        ]].drop_duplicates()

        df_categories_clean.rename(columns={
            'lclsSystm1Cd': 'lclsSystm1',
            'lclsSystm2Cd': 'lclsSystm2',
            'lclsSystm3Cd': 'lclsSystm3'
        }, inplace=True)

        df_categories_clean['lclsSystm1'] = df_categories_clean['lclsSystm1'].astype(str).str.strip()
        df_categories_clean['lclsSystm2'] = df_categories_clean['lclsSystm2'].astype(str).str.strip()
        df_categories_clean['lclsSystm3'] = df_categories_clean['lclsSystm3'].astype(str).str.strip()
        df_final['lclsSystm1'] = df_final['lclsSystm1'].astype(str).str.strip()
        df_final['lclsSystm2'] = df_final['lclsSystm2'].astype(str).str.strip()
        df_final['lclsSystm3'] = df_final['lclsSystm3'].astype(str).str.strip()

        df_final = pd.merge(
            df_final,
            df_categories_clean,
            on=['lclsSystm1', 'lclsSystm2', 'lclsSystm3'],
            how='left'
        )

        # 로컬 카테고리 매핑 폴백 처리
        DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))
        json_path_def = os.path.join(DATA_DIR, '신분류체계정보_관광타입정보_연계_정의서_exp.json')
        
        if os.path.exists(json_path_def):
            try:
                import json
                with open(json_path_def, 'r', encoding='utf-8') as f:
                    local_cat_map = json.load(f)
                
                missing_cat_mask = df_final['lclsSystm3Nm'].isna()
                logger.info(f"로컬 폴백 처리 전 카테고리 누락 개수: {missing_cat_mask.sum()}")
                
                if missing_cat_mask.sum() > 0:
                    for idx, row in df_final[missing_cat_mask].iterrows():
                        code = str(row['lclsSystm3']).strip()
                        if code in local_cat_map:
                            df_final.at[idx, 'lclsSystm1Nm'] = local_cat_map[code].get('대분류명')
                            df_final.at[idx, 'lclsSystm2Nm'] = local_cat_map[code].get('중분류명')
                            df_final.at[idx, 'lclsSystm3Nm'] = local_cat_map[code].get('소분류명')
            except Exception as e:
                logger.error(f"로컬 카테고리 매핑 폴백 적용 중 오류 발생: {e}")

        # 최종 내보내기 포맷 설정
        content_type_map = {
            '12': '관광지',
            '14': '문화시설',
            '15': '축제/공연/행사',
            '25': '여행 코스',
            '28': '레포츠',
            '32': '숙박',
            '38': '쇼핑',
            '39': '음식점'
        }
        df_final['contenttypename'] = df_final['contenttypeid'].astype(str).str.strip().map(content_type_map)

        df_main_export = df_final.copy()
        cols_to_drop = ['lDongRegnCd', 'lDongSignguCd', 'lclsSystm1', 'lclsSystm2', 'lclsSystm3', 'contenttypeid']
        df_main_export.drop(columns=cols_to_drop, inplace=True, errors='ignore')

        front_cols = ['title', 'contentid', 'contenttypename']
        remaining_cols = [col for col in df_main_export.columns if col not in front_cols]
        df_main_export = df_main_export[front_cols + remaining_cols]

        path_main_csv = os.path.join(DATA_DIR, "관광정보_메인_장소_데이터.csv")
        os.makedirs(DATA_DIR, exist_ok=True)
        df_main_export.to_csv(path_main_csv, index=False, encoding='utf-8-sig')
        logger.info(f"[메인 데이터 수집 성공] 파일 저장 완료: {path_main_csv} (총 {len(df_main_export)}행)")

        # 기존 레거시 JSON 파일 제거 (CSV 통합 정책에 따름)
        for file_name in ["관광정보_메인_장소_데이터.json", "관광정보_소개정보.json", "관광정보_세부반복정보.json", "관광정보_추가이미지.json"]:
            json_file_path = os.path.join(DATA_DIR, file_name)
            if os.path.exists(json_file_path):
                try:
                    os.remove(json_file_path)
                    logger.info(f"기존 레거시 JSON 파일 제거 완료: {json_file_path}")
                except Exception as e:
                    logger.error(f"{json_file_path} 제거 실패: {e}")

        return True

    except Exception as e:
        logger.error(f"데이터 수집 중 예상치 못한 오류 발생: {e}")
        return False
    finally:
        lock.release()

if __name__ == "__main__":
    success = collect_data()
    sys.exit(0 if success else 1)
