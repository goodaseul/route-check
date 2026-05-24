# [통합 검색] API 명세서

[한국관광공사_국문 관광정보 서비스_GW](https://www.data.go.kr/data/15101578/openapi.do#/API%20%EB%AA%A9%EB%A1%9D/searchFestival2)

## 1. Endpoint

- **URL:** `/api/search`
- **Method:** `GET`
- **Content-Type:** `application/json`
- **Auth Required:** No 

## 2. Request

### Query Parameters (or Path / Body)
| Parameter | Type | Required | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `keyword` | string | **Yes** | - | 검색 요청할 핵심 키워드 (예: `해운대`) |

## 3. Response

### Response Fields

| Field | Type | Description |
| :--- | :---: | :--- |
| `keyword` | string | 요청에 사용된 검색어 |
| `total_count` | integer | 검색 결과 리스트의 총 아이템 개수 |
| `results` | array[obj] | 실시간 데이터 융합 및 신분류체계 룩업이 완료된 결과 리스트 |
| `results[].title` | string | 장소/숙소/축제 명칭 (콘텐츠 제목) |
| `results[].addr1` | string | 해당 콘텐츠의 기본 주소 |
| `results[].addr2` | string | 해당 콘텐츠의 상세 주소 (존재하지 않을 시 빈 문자열 `""`) |
| `results[].zipcode` | string | 우편번호 |
| `results[].contentid` | string | 한국관광공사 콘텐츠 고유 ID (상세 페이지 조회 시 필수 키) |
| `results[].contenttypeid`| string | 관광 타입 ID (12: 관광지, 14: 문화시설, 15: 축제, 32: 숙박 등) |
| `results[].createdtime` | string | 콘텐츠 최초 등록일 (형식: `YYYYMMDDHHMMSS`) |
| `results[].modifiedtime`| string | 콘텐츠 최종 수정일 (형식: `YYYYMMDDHHMMSS`) |
| `results[].firstimage` | string | 대표 이미지 원본 URL (가로 최대 640픽셀 규격) |
| `results[].firstimage2`| string | 대표 이미지 썸네일 URL (가로 최대 150픽셀 규격) |
| `results[].cpyrhtDivCd` | string | 저작권 유형 코드 (예: `Type1` 등 공공누리 저작권 표시 유형) |
| `results[].mapx` | string | GPS 경도 좌표 (X 좌표, 타원체: WGS84) |
| `results[].mapy` | string | GPS 위도 좌표 (Y 좌표, 타원체: WGS84) |
| `results[].mlevel` | string | Map Level (기본 지도 축척 레벨 값) |
| `results[].tel` | string | 전화번호 (존재하지 않을 시 빈 문자열 `""`) |
| `results[].lDongRegnCd` | string | 법정동 시도 코드 |
| `results[].lDongSignguCd`| string | 법정동 시군구 코드 |
| `results[].lclsSystm1` | string | 분류체계 1Depth 영문 코드 (대분류) |
| `results[].lclsSystm2` | string | 분류체계 2Depth 영문 코드 (중분류) |
| `results[].lclsSystm3` | string | 분류체계 3Depth 영문 코드 (소분류) |

### Success Example (200 OK)

```json
{
    "keyword": "해운대",
    "total_count": 30,
    "results": [
        {
            "title": "해운대해수욕장",
            "addr1": "부산광역시 해운대구 해운대해변로 264",
            "addr2": "(우동)",
            "zipcode": "48100",
            "contentid": "126081",
            "contenttypeid": "12",
            "createdtime": "20031208090000",
            "firstimage": "[https://tong.visitkorea.or.kr/cms/resource/34/3090534_image2_1.JPG](https://tong.visitkorea.or.kr/cms/resource/34/3090534_image2_1.JPG)",
            "firstimage2": "[https://tong.visitkorea.or.kr/cms/resource/34/3090534_image3_1.JPG](https://tong.visitkorea.or.kr/cms/resource/34/3090534_image3_1.JPG)",
            "cpyrhtDivCd": "Type1",
            "mapx": "129.160278564827",
            "mapy": "35.1590840227225",
            "mlevel": "6",
            "modifiedtime": "20260519183259",
            "tel": "",
            "lDongRegnCd": "26",
            "lDongSignguCd": "350",
            "lclsSystm1": "NA",
            "lclsSystm2": "NA02",
            "lclsSystm3": "NA020900"
        }
    ]
}
```