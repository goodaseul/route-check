# Route-check (루트체크)

> **2026 관광데이터 활용 공모전 (웹ㆍ앱 개발 부문 출품작)**  
> 사용자가 구성한 여행 일정이 실제로 실행 가능한지 이동시간, 이동거리, 관광지 운영시간 및 휴무일 등을 종합 분석하고 최적화 개선안을 제공하는 여행 일정 검증 서비스입니다.

---

## 1. 프로젝트 소개

여행 계획을 세울 때 흔히 겪는 문제는 **"지도상 가까워 보이지만 대중교통 배차가 길어 이동이 불가능하거나"**, **"방문하려는 관광지가 하필 휴무일이거나"**, **"동선이 꼬여 하루 이동 시간만 5시간 이상 소요되는"** 비현실적인 일정입니다.

**Route-check**는 한국관광공사 TourAPI와 길찾기 모빌리티 API, 그리고 LLM을 결합하여 여행자가 세운 일정의 실현 가능성을 진단하고, 더 나은 동선과 시간표를 자동으로 제안하여 완성도 높은 여행을 돕습니다.

---

## 2. 핵심 기능

* **여행 날짜 및 이동수단 선택**: 여행 기간(1일~다일권)과 이동수단(자차 / 대중교통) 맞춤 설정
* **관광지 검색 및 추천**: 한국관광공사 TourAPI 연동 전국 관광지 실시간 검색 및 지역별 주요 추천지 제공
* **지도 기반 일정 구성**: 카카오 지도 SDK 기반 장소 위치 확인, 드래그 앤 드롭을 통한 일자별 방문 순서 변경
* **정밀 동선 및 구간 이동 분석**: 인접 관광지 간 실제 도로 거리 및 예상 소요시간 계산 (대중교통 / 자동차)
* **일정 타당성 진단 및 점수화**: 
  * 종합 점수(100점 만점) 산출
  * 관광지 운영시간 외 방문, 정기 휴무일 겹침, 일 40km 초과 과다 이동 등 위험 요인 감지 및 경고 안내
* **스마트 최적화 제안 (AI & 알고리즘)**:
  * 장소 방문 순서 재배치 (동선 최적화)
  * 일자 간 장소 분할 및 이동 균형 조정
  * 체류 시간 및 시작 시간 보정
* **원클릭 제안 적용 및 재분석**: 개선된 일정을 즉시 반영하여 개선 전/후 비교 및 재진단 수행

---

## 3. 사용자 흐름 (User Flow)

```
[홈 (시작하기)] 
      │
      ▼
[날짜 및 교통수단 선택 (/plan/date)]
      │
      ▼
[일정 구성 및 장소 추가 (/plan/schedule, /plan/map)]
      │
      ▼
[일정 분석 요청 (POST /api/simulation/analyze)]
      │
      ▼
[분석 결과 요약 (/result/summary)]
  - 종합 점수 및 경고 메시지 확인
  - 총 이동거리, 이동시간, 지도 동선 확인
      │
      ▼
[개선 제안 확인 (/result/suggestion)]
  - 개선 전/후 비교 및 기대 효과 확인
      │
      ▼
[제안 적용 및 재분석 (/result/summary)]
```

---

## 4. 기술 스택

### Frontend
* **Framework**: Next.js 16.2.4 (App Router, Turbopack)
* **Library**: React 19, TypeScript
* **State Management**: Zustand 5.0 (with localStorage persist)
* **Styling**: Tailwind CSS 3.4
* **Data Fetching**: TanStack React Query 5.x
* **Map & Interactive**: react-kakao-maps-sdk, @dnd-kit (드래그 앤 드롭)

### Backend
* **Framework**: FastAPI 0.136.1
* **Language**: Python 3.12+
* **Validation**: Pydantic v2 (2.13.4)
* **Database / ORM**: SQLite (기본 로컬), SQLAlchemy 2.0
* **HTTP Client**: Requests, Python-dotenv

### Infrastructure
* **Container**: Docker, Docker Compose

---

## 5. 외부 연동 API

* **한국관광공사 TourAPI (KorService2)**: 전국 관광지 키워드 검색(`searchKeyword2`), 운영시간 및 휴무일 상세 정보(`detailIntro2`) 조회
* **카카오 모빌리티 (Kakao Mobility Directions API)**: 자동차 실제 주행 경로, 거리 및 소요 시간 계산
* **카카오맵 (Kakao Maps JavaScript SDK)**: 웹 인터랙티브 지도 렌더링, 관광지 위치 마커 및 경로 시각화
* **OpenAI (GPT-4o-mini)**: 여행 일정 종합 분석 코멘트 및 주의사항 피드백 생성
* **ODsay 대중교통 API**: 대중교통 길찾기 경로 및 소요시간 조회  
  *(※ 대중교통 API 인증 실패 또는 미지원 구간 발생 시, 서비스 중단 없이 자체 거리 기반 휴리스틱 추정값으로 자동 전환되어 분석이 중단되지 않습니다.)*

---

## 6. 프로젝트 구조

```text
route-check/
├── front/                        # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/                  # App Router 페이지 (/plan, /result 등)
│   │   ├── components/           # 공통 UI 컴포넌트 (버튼, 다이얼로그, 맵 등)
│   │   ├── stores/               # Zustand 상태 관리 스토어
│   │   ├── providers/            # React Query, 카카오맵 SDK 프로바이더
│   │   └── api/                  # 프론트엔드 API 클라이언트
│   ├── Dockerfile                # 프론트엔드 다단계 빌드 파일
│   └── package.json
├── back/                         # FastAPI 백엔드
│   ├── routers/                  # API 엔드포인트 라우터 (simulation, search 등)
│   ├── services/                 # 경로 계산, 일정 분석, 최적화 서비스 로직
│   ├── schemas/                  # Pydantic 요청/응답 검증 스키마
│   ├── tests/                    # 서비스 및 유효성 검사 단위 테스트
│   ├── data/                     # 관광지 운영 정보 캐시 (detail_intro_cache.json)
│   ├── Dockerfile                # 백엔드 컨테이너 빌드 파일
│   ├── requirements.txt
│   └── main.py
├── docker-compose.yml            # 전체 서비스 일괄 실행 설정
├── .env.example                  # 환경변수 템플릿
└── README.md                     # 프로젝트 안내 문서
```

---

## 7. 빠른 시작 (Quick Start with Docker Compose)

Docker Compose를 사용하면 별도의 로컬 런타임 설치 없이 프론트엔드와 백엔드를 즉시 실행할 수 있습니다.

### 1) 저장소 복제
```bash
git clone https://github.com/goodaseul/route-check.git
cd route-check
```

### 2) 환경변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 API 키를 입력합니다.
```bash
cp .env.example .env
```

`.env` 파일 내 주요 키 설정:
```env
TOUR_API_DECODE_KEY=공공데이터포털_한국관광공사_디코딩키
OPENAI_API_KEY=오픈AI_API키
NEXT_PUBLIC_KAKAO_MAP_KEY=카카오_자바스크립트_키
KAKAO_REST_API_KEY=카카오_REST_API키
ODSAY_API_KEY=ODsay_API키
```

### 3) 컨테이너 빌드 및 실행
```bash
docker compose up --build
```

### 4) 서비스 접속
* **Frontend**: [http://localhost:3000](http://localhost:3000)
* **Backend API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 8. 로컬 개발 환경 수동 실행

로컬 환경에서 프론트엔드와 백엔드를 각각 수동으로 실행하는 방법입니다.

### 1) 백엔드 (FastAPI) 실행
```bash
cd back

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 패키지 설치
pip install -r requirements.txt

# 서버 실행 (포트 8000)
uvicorn main:app --reload --port 8000
```
> 백엔드는 프로젝트 루트의 `.env` 파일을 자동으로 탐색하여 로드합니다.

### 2) 프론트엔드 (Next.js) 실행
```bash
cd front

# 의존성 패키지 설치
npm install
```

> **프론트엔드 로컬 환경변수 안내**:  
> 프론트엔드를 독립 실행할 경우 루트 `.env`의 브라우저 공개 키(`NEXT_PUBLIC_*`)를 전달받기 위해 `front/.env.local` 파일을 생성하여 안전하게 공개 키만 설정합니다:
> ```bash
> # front/.env.local
> NEXT_PUBLIC_KAKAO_MAP_KEY=카카오_자바스크립트_키
> ```

```bash
# 개발 서버 실행 (포트 3000)
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다. 프론트엔드는 `/api/*` 요청을 백엔드(`http://localhost:8000`)로 자동 프록시합니다.

---

## 9. 환경변수 명세

`.env.example`에 정의된 주요 환경변수 목록입니다:

| 환경변수명 | 설명 | 사용 위치 |
| :--- | :--- | :--- |
| `BACKEND_HOST` | 백엔드 호스트 주소 (기본값: localhost, Docker: backend) | Next.js API Rewrite |
| `BACKEND_PORT` | 백엔드 포트 (기본값: 8000) | Next.js API Rewrite / FastAPI |
| `FRONTEND_PORT` | 프론트엔드 포트 (기본값: 3000) | Docker Compose |
| `APP_ENV` | 실행 환경 (development / production) | FastAPI |
| `TOUR_API_DECODE_KEY` | 한국관광공사 TourAPI 디코딩 일반 인증키 | 관광지 검색 및 상세 운영정보 조회 |
| `OPENAI_API_KEY` | OpenAI API 키 | 일정 분석 종합 피드백 생성 |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 카카오 지도 JavaScript 키 (브라우저 공개용) | 카카오맵 인터랙티브 지도 렌더링 |
| `KAKAO_REST_API_KEY` | 카카오 길찾기 REST API 키 | 자동차 경로 및 이동거리 산출 |
| `ODSAY_API_KEY` | ODsay 대중교통 경로 검색 API 키 | 대중교통 소요시간 및 환승 산출 |
| `DATABASE_URL` | 데이터베이스 연결 URL (기본 SQLite / 확장용 PostgreSQL) | 백엔드 DB 세션 관리 |
| `JWT_SECRET` | 관리자 및 인증 토큰 암호화 시크릿 | 백엔드 보안 인증 |

---

## 10. 테스트 실행 방법

### Frontend 검증
```bash
cd front

# 1. ESLint 코드 스타일 및 린트 검사
npm run lint

# 2. TypeScript 정적 타입 검사
npx tsc --noEmit

# 3. Next.js 프로덕션 빌드 검증
npm run build
```

### Backend 검증
```bash
cd back

# 단위 및 회귀 테스트 전체 실행 (20개 테스트)
python -m unittest discover -s tests -v
```

---

## 11. 현재 지원 범위 및 참고 사항

* **대중교통 이동 시간**: ODsay API 응답 불가 또는 키 인증 실패 시, 자체 거리 기반 휴리스틱 추정치가 제공되며 사용자 화면에 `"대중교통 약 XX분"`으로 구분 안내됩니다.
* **결과 저장 기능**: 분석 결과의 PDF 및 이미지 저장 기능은 현재 인터페이스 준비 중(`(준비 중)` 및 안내 토스트 제공)입니다.
* **소셜 로그인**: 구글/네이버 로그인은 제출 버전의 보안 및 독립 실행 안정성을 위해 비활성화(501 Not Implemented)되어 있으며, 일정 분석 기능은 로그인 없이 전면 이용 가능합니다.
* **일정 최적화 알고리즘**: 당일 내 순서 재배치, 체류 시간 조정, 일자 간 장거리 이동 완화 및 다일 일정 분할 최적화를 지원합니다.

---

## 12. 개발/테스트용 시뮬레이션 요청 예시

백엔드 일정 분석 API(`POST /api/simulation/analyze`)의 요청 형식 예시입니다:

```json
{
  "start_date": "2026-08-10",
  "end_date": "2026-08-11",
  "transport_mode": "public",
  "days": [
    {
      "day_number": 1,
      "date": "2026-08-10",
      "places": [
        {
          "contentid": 126508,
          "sequence": 1,
          "name": "경복궁",
          "lat": 37.5796,
          "lng": 126.9770,
          "stay_duration_minutes": 90,
          "category": "관광지"
        },
        {
          "contentid": 126509,
          "sequence": 2,
          "name": "북촌한옥마을",
          "lat": 37.5826,
          "lng": 126.9849,
          "stay_duration_minutes": 60,
          "category": "관광지"
        }
      ]
    },
    {
      "day_number": 2,
      "date": "2026-08-11",
      "places": [
        {
          "contentid": 126510,
          "sequence": 1,
          "name": "남산서울타워",
          "lat": 37.5512,
          "lng": 126.9882,
          "stay_duration_minutes": 120,
          "category": "관광지"
        }
      ]
    }
  ]
}
```