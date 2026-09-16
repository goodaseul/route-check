# Route-check 최종 서비스 준비도 점검 보고서

점검일: 2026-09-15 / 대상: 현재 작업 트리 전체(미커밋 데이터 포함)

## A. 전체 상태

**프로젝트 완성도: 60% — 주요 수정 필요**

완성도는 코드 커버리지가 아니라 핵심 기능의 정확성, 실제 API 연결, 화면 연결, 보안, 배포 재현성을 종합한 정성 평가다. 브라우저 검증이 빠져 있어 보수적으로 평가했다.

- 검색 → 분석 → 제안 적용의 주요 코드와 API가 구현되어 있으며, 실제 TourAPI·Kakao·OpenAI 호출도 성공했다.
- 기존 의존성 및 새로 설치한 백엔드 의존성에서 단위 테스트 11개가 모두 통과했다. 프론트 production build, TypeScript, lint도 통과했다.
- 그러나 소셜 로그인 신뢰 경계 부재, 날짜 사이 이동 누락에 따른 잘못된 최적화 결과, 저장 기능 미구현, 비활성 관리자 API, 운영 환경 설정 문제가 남아 있다.
- ODsay는 실제 키 인증에 실패했다. PostgreSQL은 연결 시간 초과로 운영 DB 사용을 검증하지 못했다.
- **페이지 HTTP 200은 화면 클릭·지도 SDK·브라우저 E2E 성공을 의미하지 않는다.** 이 세션에 브라우저 제어 실행 도구가 없어 해당 항목은 미검증이다.

### 점검 범위와 데이터 보호

애플리케이션 소스·디자인·환경변수 파일을 수정하지 않았다. 백엔드는 `/private/tmp/routecheck-audit/back` 복사본과 복사된 SQLite를 사용했다. 테스트 계정 생성 및 경로/상세 캐시 변경은 이 복사본에서만 수행했다. 외부 DB에는 `SELECT 1` 연결 확인만 시도했다. 실제 키·토큰·DB 비밀번호는 보고서에 기재하지 않았다.

시작 전부터 존재한 변경: `README.md`, `back/data/detail_intro_cache.json`, 미추적 `back/data/관광정보_메인_장소_데이터.csv`. 이 파일들은 보존했다. 빌드 과정에서 `.next` 등 무시되는 생성 파일은 갱신되었다.

## B. 핵심 기능 체크리스트

O는 구현 또는 확인된 연결, X는 미구현/연결 실패다. 실제 동작 열의 범위가 API인지 화면인지 구분했다. “확인 필요”를 PASS로 집계하지 않았다.

| 기능 | Front | Back | API | 실제 동작 | 상태 |
|---|---|---|---|---|---|
| 홈·날짜/교통수단 선택 | O | 해당 없음 | 해당 없음 | 페이지 200, 클릭 미검증 | 확인 필요 |
| 관광 장소 검색 | O | O | O | 실제 TourAPI 결과 및 백엔드 200 | PASS(API), 화면 확인 필요 |
| 추천 장소 | O | O | O | 실제 TourAPI 목록 및 백엔드 200 | PASS(API), 화면 확인 필요 |
| 지도에서 직접 장소 선택 | O | SDK 직접 호출 | 미검증 | Kakao JS SDK·도메인 미검증 | 확인 필요 |
| 일정 추가·삭제·드래그·날짜 탭 | O | 로컬 상태 | 해당 없음 | 코드 연결, 브라우저 미검증 | 확인 필요 |
| 자동차 경로 계산 | O | O | O | Kakao 실제 거리·시간, 캐시 경로 | PASS(API) |
| 대중교통 실제 경로 | O | O | X | ODsay 인증 실패, 추정값으로 대체 | FAIL |
| 일정 분석 | O | O | O | 실제 장소·경로로 200, 점수/합계 반환 | PASS(API), 정확성 문제 별도 |
| 순서 변경 적용 | O | O | O | HTTP 200 및 단위 테스트 | PASS(API) |
| 교통수단 변경 적용 | O | O | O | HTTP 200 및 단위 테스트 | PASS(API), 대중교통 실측 제외 |
| 방문시간 변경 적용 | O | O | O | HTTP 200 및 단위 테스트 | PASS(API) |
| 날짜 이동·휴무 장소 대체 | O | O | O | 단위 테스트, 전체 화면 미검증 | 확인 필요 |
| 전체 여행 최적화 | O | O | O | HTTP 200이나 날짜 간 370km 이동 누락 | FAIL |
| 결과 편집 후 재분석 | O | O | O | transport 유실·이전 결과 잔존 코드 | FAIL |
| PDF/이미지 저장 | O | X/클라이언트 구현도 없음 | X | 성공 토스트만 실행 | FAIL |
| 날짜만으로 일정 생성 | O | X | X | 준비 중 토스트 | FAIL(미완성) |
| Google/Naver 로그인 | 컴포넌트 O, 페이지 연결 X | O | O | 토큰 없이 사용자 생성 200 | FAIL |
| 관리자 로그인·회원·관리자·설정 | O | 코드 O, 등록 X | X | 관리자 로그인/me 404 | FAIL |
| 관리자 RAG 관리 | O | X | X | 파일 목록 404, 라우터 없음 | FAIL |
| production 실행 | O | O(로컬 DB) | 설정 의존 | build/start 성공, 기본 프록시 오설정 재현 | 확인 필요 |
| Supabase 운영 DB | 해당 없음 | O | 연결 실패 | 접속 시간 초과 | 확인 필요 |

## 1. 프로젝트 구조와 데이터 흐름

### 구성

- `front/`: Next.js 16.2.4 App Router, React 19, TypeScript, Tailwind, TanStack Query, Zustand persist, dnd-kit, Kakao Maps SDK.
- `back/`: FastAPI, Pydantic, SQLAlchemy, requests, pandas, OpenAI SDK. `main.py` → routers → services → 외부 제공자/DB/로컬 데이터.
- `back/db/`: `admins`, `users`, `places_cache`, `route_distance_cache` 모델. 일정·분석 결과 저장 테이블은 없다.
- 개발/테스트 DB: `back/data/route_check.db` SQLite. `APP_ENV=development/dev/local/test`에서는 `DATABASE_URL`을 사용하지 않는다.
- staging/production: PostgreSQL 필수. import 시 연결 검사에 실패하면 기동 불가.
- 관광 마스터: CSV를 프로세스 시작 때 메모리 dict로 적재. 상세 운영시간/휴무일은 TourAPI와 `detail_intro_cache.json`에 의존한다. 분석은 `places_cache` DB 테이블을 주요 마스터로 조회하지 않는다.
- 일정/분석 결과: 브라우저 localStorage `route-check-plan-schedules`, version 2. 사용자 계정별 서버 저장/복구 구조는 없다.
- 수집: `back/scripts/collect_tour_data.py`. 주기 실행 코드는 있으나 `main.py`에서 scheduler 시작이 비활성화되어 있다.
- 벡터 DB·RAG 검색: 실제 서비스 연동 코드가 없다. 관리자 UI와 설정 설명만 존재한다.

### 주요 화면

`/` → `/plan/date` → `/plan/schedule?date=...&transport=...` → `/plan/map?day=...` → `/result/summary` → `/result/suggestion` → `/result/suggestion/[type]` → `/result/suggestion/[type]/applied`.

추가: `/auth/naver/callback`, `/admin/login`, `/admin`, `/admin/users`, `/admin/admins`, `/admin/rag`, `/admin/settings/apis`, `/admin/settings/envs`. 장소 자체의 독립 상세 페이지는 없고 개선 제안 상세 페이지가 있다.

### 사용자 기능별 실제 흐름

1. **검색/추천**: MapSearchPageClient → useMapSearchPage → useSearch/useRecommendations → `front/src/api/search.ts`/`recommendations.ts` → 상대 `/api/*` → Next rewrite → `back/routers/search.py` → search_service → TourAPI `searchKeyword2`/`areaBasedList2` → 원본 필드를 정리한 results → 카드/검색 목록 → 선택 시 Zustand 일정 추가.
2. **지도 직접 선택**: KakaoMapScriptProvider → 브라우저 Kakao SDK `Places.keywordSearch` 또는 `Geocoder.coord2Address` → 첫 결과/선택 좌표 → 음수 합성 contentId 생성 → Zustand. 이 ID는 TourAPI 관광 ID가 아니며 이후 상세 영업정보 검증의 신뢰성이 낮다.
3. **구간 시간**: 일정의 인접 장소 → useSchedulePage/useQueries → POST transit-info → route_service → 좌표 격자+교통수단 캐시 조회 → Kakao/TMap/ODsay 또는 휴리스틱 → 실제 API 결과만 DB 캐시 저장 → `source`와 시간 → 일정 구간 텍스트. 휴리스틱이면 “약” 표시.
4. **분석**: 날짜·장소를 SimulationRequest로 변환 → POST analyze → analyze_itinerary → CSV 마스터+TourAPI 상세+경로 캐시/API → 규칙 기반 점수·휴무/운영시간/혼잡 경고·개선 제안 → 선택적 OpenAI 설명 문장 → response → Zustand → 점수/집계/지도/제안 화면.
5. **제안 적용**: SuggestionDetail → operation별 apply-* → itinerary 복사·유효성 확인·전후 분석 → updated_itinerary/results/comparison → Zustand의 일정·결과 동시 갱신 → 적용 결과 페이지. 실제 API 호출이 있으며 현재 주요 경로가 단순 mock인 것은 아니다.
6. **소셜 로그인**: Google 컴포넌트는 브라우저 access token으로 userinfo를 얻고 프로필을 서버에 전송. Naver는 SDK callback 프로필을 서버로 전송 → User 조회/생성/수정 → 프로필 반환. 서버 제공자 토큰 검증 및 사용자 세션 발급이 없고 로그인 컴포넌트의 페이지 사용처도 없다.
7. **관리자**: UI/hooks → 절대 URL 관리자 fetch → 인증/회원/설정 API를 기대하지만 라우터 미등록으로 중단. RAG는 endpoint 구현 자체가 없다.

## 2. 프론트 API 전수 대조

전체 프론트 호출은 method/URL 조합 기준 28개(사용자 10 + 관리자 12 + RAG 6)다. 실행 서버에는 사용자 API 10개와 루트 1개만 등록되어 있다.

### 사용자 API 10개

공통 fetcher(`front/src/lib/api/fetcher.ts:11`): JSON 요청, non-2xx이면 상태번호만 Error로 변환. timeout/AbortSignal 없고 응답 스키마 런타임 검증도 없다. `params` 옵션은 `?` 없이 연결하지만 현재 호출자는 URLSearchParams를 직접 붙여 이 결함을 회피한다.

| Method / URL | 프론트 호출·입력 | 백엔드 | 응답/화면 사용·오류/로딩 |
|---|---|---|---|
| GET `/api/search` | api/search.ts; keyword, numOfRows=10 | routers/search.py:7; pageNo도 지원 | results의 title/주소/contentid/좌표 사용. 로딩·빈 결과 UI O. 실패는 전역 throwOnError에 의존하고 해당 화면 ErrorBoundary 없음. 10개 이후 페이지 이동 없음 |
| GET `/api/recommendations` | api/recommendations.ts; numOfRows=4, 선택적 areaCode/sigunguCode/contentTypeId | routers/search.py:22 | 카드 title/주소/image/좌표 사용. 로딩/빈 상태 O. UI는 기본 인자만 사용하며 지역 필터 UI 없음 |
| POST `/api/route/transit-info` | api/simulation.ts:24; origin/destination(contentid,mapx,mapy), transport_mode, include_alternatives=false | routers/simulation.py:23 | duration/alternatives/source 사용. 로딩·실패 텍스트 O. 전역 throwOnError 때문에 오류 텍스트보다 상위 오류가 우선할 수 있음 |
| POST `/api/simulation/analyze` | api/simulation.ts:17; start/end_date, transport_mode, days[].places[] | routers/simulation.py:76 | 결과 store 저장 후 summary 이동. isAnalyzing/중복 가드/실패 토스트 O |
| POST `/api/simulation/apply-reorder` | itinerary,suggestion_id,day_number,ordered_contentids | routers/simulation.py:93 | updated_itinerary,previous/updated_result,comparison 실제 store/화면 반영. isApplying/실패 토스트 O |
| POST `/api/simulation/apply-transport` | itinerary,suggestion_id,day_number,origin/destination_contentid,from/to_mode | routers/simulation.py:117 | 인접 구간 변경 후 결과/비교 반영. 로딩/실패 처리 O |
| POST `/api/simulation/apply-time` | itinerary,suggestion_id,day_number,contentid,from/to_time | routers/simulation.py:141 | 방문시각 변경 후 결과/경고 비교 반영. 로딩/실패 처리 O |
| POST `/api/simulation/apply-trip` | itinerary,suggestion_id,action,선택적 contentid/from/to_day_number/replacement_contentid | routers/simulation.py:162 | 날짜 이동/대체/최적화 및 전후 결과 사용. 로딩/실패 처리 O, 산술 정확성 FAIL |
| POST `/api/auth/login/google` | api/loginGoogle.ts; auth_provider,provider_user_id,email,name,nickname,profile_image | routers/auth.py:13 | profile 반환. GoogleLogin에서 결과를 반환할 뿐 세션/store/UI 반영 없음. 컴포넌트 페이지 연결 없음. 실패 console.error, 사용자 로딩 없음 |
| POST `/api/auth/login/naver` | api/loginNaver.ts; 같은 프로필 body | routers/auth.py:63 | callback → opener postMessage 코드. 로그인 진입 컴포넌트 미사용, 세션 없음. 비동기 callback 요청 실패 catch 없음, callback 화면 null |

타입 판정:

- 검색/추천에서 실제 받은 필드는 프론트에서 사용하는 이름과 일치했다. 다만 백엔드 `List[Dict[str,Any]]`라 타입 보장이 약하고 프론트의 필수 문자열 타입은 실제 null 가능성을 반영하지 않는다.
- 시뮬레이션 주요 요청/응답 필드는 일치한다. 서버의 추가 `improvement_points`는 프론트 타입/화면에서 직접 사용하지 않지만 suggestions로 변환되어 제공되므로 그 자체가 연결 오류는 아니다.
- 로그인 프론트 LoginResponse는 `is_active: true`, 문자열 필드들로 선언되지만 서버는 bool/nullable 문자열을 반환한다. 실제 테스트에서도 email/profile_image/deleted_at 등이 null이었다.
- OpenAI가 생성하는 `status_description`은 API 응답에 있지만 프론트는 `status_message/status_label`만 표시한다. 현재 UI에서는 유료 설명 생성 결과를 볼 수 없다.

### 관리자 API — 호출 코드 12개, 모두 서버 미등록

기본 URL: `front/src/app/(admin)/_lib/admin-api.ts:32`의 `NEXT_PUBLIC_API_BASE_URL ?? http://localhost:8000`. fetch에 credentials=include. 회원/관리자 mutation은 JSON header와 body가 맞으며 query invalidate도 구현되어 있다. 아래 API들은 구현 스키마와 소비 필드가 대체로 대응하나 실제 응답 검증은 라우터 미등록으로 불가하다.

| Method / URL | 입력 → 기대 응답 | 코드/화면 |
|---|---|---|
| POST `/api/admin/auth/session` | username,password → admin/session 응답+쿠키 | admin/login/page.tsx → routers/admin/auth.py:25; 제출중/오류 표시 O |
| POST `/api/admin/auth/session/logout` | body 없음 → 204 | admin-sidebar.tsx → auth.py:67; 응답 실패 검사 부족 |
| GET `/api/admin/auth/me` | 쿠키 → AdminUser | admin-auth-guard.tsx → auth.py:79; 인증 확인/로그인 이동 |
| GET `/api/admin/admin-users` | page,page_size → paginated admins | use-admin-admin-users.ts → user.py:41; 표/페이지/로딩·오류 |
| POST `/api/admin/admin-users` | username,password,role → AdminUser | 같은 hook → user.py:86; 생성 패널 |
| PATCH `/api/admin/admin-users/{id}` | role,is_active,password? → AdminUser | 같은 hook → user.py:117; 수정 패널 |
| DELETE `/api/admin/admin-users/{id}` | id → AdminUser | 같은 hook → user.py:161; 삭제 후 목록 갱신 |
| GET `/api/admin/users` | page,page_size,auth_provider?,is_active?,search? → paginated users | use-admin-users.ts → user_management.py:18; 필터/표/페이지 |
| PATCH `/api/admin/users/{id}` | is_active → User | 같은 hook → user_management.py:70 |
| DELETE `/api/admin/users/{id}` | id → User | 같은 hook → user_management.py:96 |
| GET `/api/admin/settings/apis` | 없음 → UsedApiItem[] | use-admin-settings.ts → settings.py:63; 사용 API 화면 |
| GET `/api/admin/settings/envs` | 없음 → UsedEnvItem[] | 같은 hook → settings.py:135; 환경변수 화면 |

백엔드에만 작성되어 있고 프론트 호출이 없는 것: GET `/api/admin/admin-users/{id}` (`user.py:72`), GET `/api/admin/users/{id}` (`user_management.py:53`). 둘도 라우터 미등록이다. GET `/`는 백엔드 상태 메시지이며 프론트에서 소비하지 않는다.

### RAG API — 호출 코드 6개, 백엔드 구현 없음

호출은 `front/src/app/(admin)/_hooks/use-admin-rag.ts`, UI는 `admin/(dashboard)/rag/page.tsx`다.

| Method / URL | 요청 | 기대 응답/화면 |
|---|---|---|
| GET `/api/admin/rag/files` | 없음 | raw/processed 파일 및 tasks 진행상태 |
| POST `/api/admin/rag/upload` | multipart file | 성공 후 목록 갱신 |
| DELETE `/api/admin/rag/files/{filename}` | URL-encoded filename | 목록 갱신 |
| POST `/api/admin/rag/build-pdf` | JSON filename | 작업 시작/진행 표시 |
| POST `/api/admin/rag/purify-csv` | 없음 | CSV 정제 작업 |
| POST `/api/admin/rag/sync-db` | 없음 | DB 동기화 작업 |

프론트에 로딩/오류·작업 상태 UI와 mutation 코드가 있으나 서버 endpoint가 없어 실제 작업은 불가능하다. 구현 완료된 RAG로 제출하면 안 된다.

## 3. 외부 API·DB 실제 검증

| 제공자/기능 | 실제 호출 및 응답 | 키/실패 처리 | 판정 |
|---|---|---|---|
| TourAPI KorService2/searchKeyword2 | HTTP 200, resultCode 0000, 경복궁 total=12, 2건 수신 | TOUR_API_DECODE_KEY; 10초 timeout. 모든 장애를 빈 결과로 삼킴 | 성공 응답 구조 PASS, 장애 처리 FAIL |
| TourAPI areaBasedList2 | HTTP 200, resultCode 0000, total=49,732, 2건 수신 | 같은 키, arrange=Q; 코드의 “인기순” 설명은 제공자 정렬 의미 별도 확인 필요 | PASS(API) |
| TourAPI detailIntro2 | HTTP 200, resultCode 0000, contentid=126508 상세 수신 | 같은 키; 5초; 파일 캐시, 실패하면 기본 영업시간/휴무일 사용 | PASS(API), 데이터 미확인 표시 부족 |
| TourAPI ldongCode2/lclsSystmCode2 | 수집기 법정동/분류체계 조회. 각각 실제 HTTP 200, resultCode 0000, body 확인 | TOUR_API_DECODE_KEY; 수집기 timeout/오류 처리 | PASS(최소 호출) |
| TourAPI 데이터 수집 | 수집기 내 API 호출 코드 O; 전체 수집 미실행 | 같은 키; timeout/429 1회 재시도. 전체 데이터 갱신은 긴 작업/기존 데이터 변경이라 실행하지 않음 | 확인 필요 |
| Kakao Mobility directions | 실제 3.03km/13분/택시 예상 7,100원 수신 | KAKAO_REST_API_KEY; 5초; TMap→추정 대체 | PASS |
| TMap routes | 호출 함수 O, 키 없음 | TMAP_API_KEY; 5초; 실패 시 추정 | **실제 검증 불가: 유효 키 필요** |
| ODsay searchPubTransPathT | HTTP 200 안에 error code 500, ApiKeyAuthFailed | ODSAY_API_KEY 존재하나 인증 실패; 5초 후 추정 대체 | FAIL: 키/서비스 권한 확인 필요 |
| Kakao Maps JavaScript SDK/Places/Geocoder | 실제 호출 코드 O; 브라우저 미검증 | NEXT_PUBLIC_KAKAO_MAP_KEY; SDK 실패 시 console.error 후 로딩 고정 | 확인 필요: 배포 도메인 등록·브라우저 테스트 |
| Google OAuth/userinfo | OAuth SDK 및 userinfo fetch 코드 O; 실제 로그인 미검증 | NEXT_PUBLIC_GOOGLE_CLIENT_ID; 서버 토큰 검증 없음 | 확인 필요 + 인증 설계 FAIL |
| Naver OAuth SDK | SDK/콜백 코드 O; 실제 로그인 미검증 | NEXT_PUBLIC_NAVER_CLIENT_ID; 등록 callback/팝업/SDK 버튼 확인 필요 | 확인 필요 |
| OpenAI chat completions | gpt-4o-mini strict JSON schema 실제 응답 성공 | OPENAI_API_KEY; 실패 시 규칙 설명 대체. 앱 차원의 timeout/max_retries 지정 없음 | PASS(API), UI 미사용 |
| Supabase PostgreSQL | pooler 6543 접속 시간 초과, SELECT 1 도달 못함 | DATABASE_URL; connect_timeout=5. 운영 import에서 실패하면 중단 | **실제 DB 검증 불가** |
| SQLite | 임시 DB 테이블 접근·테스트 사용자 생성·경로 조회/캐시 동작 | 개발 환경 전용 | PASS |
| Anthropic/Vector DB/GCS | 관리자 설명/예정 UI만 존재 | ANTHROPIC_API_KEY/VECTOR_DB_URL 등 설정 표시뿐 | 미구현, 실제 연동으로 집계하지 않음 |

Kakao REST 키가 없으면 JavaScript 키로 fallback하는 `route_service.py:7`도 수정 대상이다. 두 키는 용도가 다르며 JS 키가 REST 경로 호출을 대체하지 않는다.

## 4. 환경변수 전수 정리

값은 노출하지 않고 존재 여부만 검사했다. 루트 `.env`가 존재하며 `.env.example`만 Git 추적 중이다.

| 이름 | 소비 위치/용도 | example | 현재/설정 문제 |
|---|---|---|---|
| APP_ENV | db/database.py | O | 현재 설정 존재. 기본 development로 운영에서도 SQLite가 선택될 수 있음 |
| DATABASE_URL | 운영 PostgreSQL | O | 설정 존재, 실제 연결 timeout |
| JWT_SECRET | core/security.py | O | 설정 존재. 코드/example에 고정 기본값 존재, 운영 필수 검증 없음 |
| TOUR_API_DECODE_KEY | search/simulation/수집기 | O | 실제 검증 성공, compose back 전달 O |
| KAKAO_REST_API_KEY | route_service | O | 실제 검증 성공, compose back 전달 O |
| TMAP_API_KEY | route_service | O | 현재 .env 없음, compose 기본 빈 값 |
| ODSAY_API_KEY | route_service | O | 설정 있으나 실제 인증 실패 |
| OPENAI_API_KEY | simulation_service | O | 실제 검증 성공 |
| NEXT_PUBLIC_KAKAO_MAP_KEY | Kakao JS SDK | O | root에 설정, compose front 전달. front 직접 실행/이미지 build에는 자동 전달 안 됨 |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID | GoogleOAuthProvider | O | root 설정, compose front 전달. 직접 실행/build 주입 필요 |
| NEXT_PUBLIC_NAVER_CLIENT_ID | Naver 컴포넌트/콜백 | O | 위와 같음 |
| BACKEND_HOST | next.config.ts rewrites | X | 기본 localhost; compose는 runtime backend 지정, build에 전달 없음 |
| BACKEND_PORT | next.config.ts/compose | O | 기본 8000. compose의 실제 back 포트/CMD는 8000 고정이라 변수만 변경하면 어긋남 |
| FRONTEND_PORT | 관리자 설정 표시 | O | compose 실제 host/container 포트는 3000 고정; 런타임 포트 제어 안 함 |
| NEXT_PUBLIC_API_BASE_URL | 관리자 fetch | X | 기본 http://localhost:8000; 배포 브라우저에서 사용자 PC를 가리킴 |
| JWT_EXPIRE_HOURS | JWT 만료 | X | 기본 8시간, compose 전달 없음 |
| COOKIE_SAMESITE | 관리자 쿠키 | X | 기본 lax, compose 전달 없음 |
| ADMIN_COOKIE_SECURE | 관리자 쿠키 | X | 기본 false, compose 전달 없음 |
| TOUR_DATA_UPDATE_INTERVAL_DAYS | scheduler | X | 기본 1, scheduler 비활성 |
| RUN_TOUR_DATA_UPDATE_ON_STARTUP | scheduler | X | 기본 true, scheduler 비활성 |
| VECTOR_DB_URL | 관리자 표시만 | O | placeholder, 실제 DB client 없음 |
| DIRECT_URL | 관리자 표시만 | X | root 설정 존재, 실제 migration 연결 코드 없음 |
| ANTHROPIC_API_KEY | 관리자 표시만 | X | 실제 provider 호출 없음 |

`NEXT_PUBLIC_*` 공개용 ID/JS 키 자체는 브라우저 공개가 정상이다. REST/API secret과 혼용하지 말아야 한다. 관리자가 보여주는 API active 표시는 값 존재 여부일 뿐 실제 연결 성공 검사가 아니다. ODsay 등 실제 사용 서버 API가 관리자 목록에서 빠져 있다.

## 5. 직접 실행한 검증과 사용자 시나리오

### 설치·빌드·실행

| 항목 | 실행 | 결과 |
|---|---|---|
| 프론트 새 의존성 설치 | 임시 디렉터리 npm install --package-lock=false --ignore-scripts | 387 패키지 설치 성공. lifecycle scripts는 실행하지 않았으므로 완전한 clean build 인증은 아님 |
| 기존 프론트 의존성 | npm ls --depth=0 | 필수 의존성 확인. 몇 개 extraneous 패키지 존재 |
| lint | cd front && npm run lint | PASS |
| 타입 | node_modules/.bin/tsc --noEmit | PASS. 최초에는 오래된 .next/dev/types가 삭제된 /common을 참조하여 실패했으나 dev/build 생성물 갱신 후 해결; 소스 타입 결함 아님 |
| production build | cd front && npm run build | PASS. 초기 sandbox 포트 권한 오류는 정상 권한 재실행으로 해결 |
| production start | npm run start -- --hostname 127.0.0.1 --port 13001 | 기동/홈/날짜 HTTP 200 |
| 개발 서버 | BACKEND_HOST=127.0.0.1 BACKEND_PORT=18000 npm run dev -- ... --port 13000 | 기동·주요 페이지·백엔드 프록시 확인 |
| 백엔드 새 설치 | 임시 venv pip install -r back/requirements.txt | PASS, pip check PASS |
| 기존/새 의존성 테스트 | cd back && python -m unittest discover -s tests -v | 각각 11/11 PASS. 외부 호출 mock 기반 단위 테스트 |
| FastAPI | 임시 back uvicorn main:app | SQLite startup, OpenAPI, HTTP 호출 성공 |
| Docker 설정 | docker compose config --quiet | PASS |
| Docker daemon/build/up | docker info | daemon 미실행. CLI만 설치되어 있어 이미지 build/컨테이너 E2E 미검증 |

실행 환경은 로컬 Node 25.9.0 / Python 3.14다. Dockerfile의 Node 20 / Python 3.11과 같지 않으므로 컨테이너 호환성을 대신 보장하지 않는다. 루트에서 unittest를 바로 실행하면 services import 실패하므로 back 디렉터리 기준 실행이 필요하다. pnpm 11 실행은 기존 설치 형식/비대화형 모듈 재설치 확인에 막혀 npm으로 검증했다. lockfile은 pnpm인데 Docker는 npm install을 사용하여 설치 버전이 고정되지 않는다.

### HTTP 기반 시나리오

| 시나리오 | 결과 | 증거/실패 단계 |
|---|---|---|
| TourAPI 실제 검색 → 백엔드 응답 | PASS | 경복궁 12건 중 요청한 2건, 화면 사용 필드 존재 |
| 실제 검색 좌표 → analyze → Kakao/상세/API → DB 캐시/응답 | PASS(API) | 200, 약 5.06초, total_distance=370km, transit=332분, source=api |
| 순서/교통수단/시각 제안 적용 | PASS(API) | 임시 서버 HTTP 200, 전후 결과 및 updated_itinerary 반환 |
| 1일 여행 전체 최적화 요청 | PASS(validation) | 400, 2일 이상 필요 메시지 |
| 2일 여행 전체 최적화 | FAIL(정확성) | 370km·332분 → 0km·0분, 점수 80→90. 날짜 간 이동이 사라짐. simulation_service.py:681,1333 |
| 좌표 없는 transit 요청 | PASS(validation) | 400, 좌표 필요 메시지 |
| 잘못된 날짜+빈 일정 | FAIL | start/end=bad, days=[] → 200/100점. schemas/simulation.py:70 |
| 잘못된 day.date+장소 존재 | FAIL | 500 및 datetime 내부 예외 노출. simulation_service.py:355, routers/simulation.py:89 |
| TourAPI 키 없는 검색/추천 | FAIL(장애 처리) | HTTP 200, results=[], 장애와 진짜 0건 구분 불가. search_service.py:17 |
| 인증 토큰 없는 Google/Naver 등록 | FAIL(보안) | 임의 provider_user_id로 양쪽 모두 200, 임시 DB에 사용자 생성. routers/auth.py:13,63 |
| 관리자 로그인/RAG 목록 | FAIL | 404. main.py:81, RAG 라우터 부재 |
| 개발 프론트 → backend proxy | PASS(HTTP) | 프론트 주소 /api/route/transit-info에서 백엔드 validation 400 전달 |
| 기본 production build → proxy | FAIL(설정 조건) | 페이지 200이지만 proxy 500. build manifest가 localhost:8000, 테스트 back은 18000/18001. 기본 로컬 8000 배치에서는 이것만으로 장애라고 단정하지 않음 |

### 설정을 바로잡은 production 프록시 추가 검증

소스 변경 없이 `BACKEND_HOST=127.0.0.1 BACKEND_PORT=18001 npm run build`로 재빌드하고 13002 포트에서 실행했다. **프론트 production URL → Next rewrite → FastAPI → 실제 TourAPI/Kakao/상세 및 테스트 DB 캐시 → 응답**까지 확인했다. `/api/search`는 200/total=12/2건, `/api/simulation/analyze`는 200/370km/332분을 반환했다. 따라서 기본 프록시 실패는 해결 불가능한 프레임워크 장애가 아니라 빌드 설정 문제다. 이 성공도 브라우저에서 응답을 화면에 그리는 단계까지 검증한 것은 아니다. 공개 SDK 키를 넣은 production 지도 빌드는 별도 확인 필요.

### 화면 검증 범위

HTTP 진입 확인: `/`, `/plan/date`, `/plan/schedule`, `/plan/map?day=day1`, `/result/summary`, `/result/suggestion`, `/result/suggestion/order`, `/result/suggestion/order/applied`, `/auth/naver/callback`, 관리자 7개 화면 모두 200. 잘못된 제안 type은 404. 로고 SVG 200.

**직접 확인하지 못한 것**: 실제 클릭·드래그·달력 선택·모바일/데스크톱 시각 배치·팝업·SDK 지도·새로고침 후 localStorage hydration·브라우저 콘솔/React warning·전체 이미지 렌더링·Network 패널·OAuth 성공/취소. Browser 스킬은 확인했지만 필요한 브라우저 제어 도구가 세션에 없었다. 서버 로그와 HTML 응답 확인만으로 이 항목을 PASS 처리하지 않았다.

코드로 확인된 UI 위험:

- 결과 없는 summary는 영구적으로 “분석 결과를 불러오는 중” 표시. 새 사용자 직접 진입/저장소 삭제에 복구 버튼 없음 (`SummaryPageClient.tsx:22`).
- 지도 SDK 오류도 영구 로딩 (`KakaoMapScriptProvider.tsx:26`).
- 검색 로딩/빈 결과는 있지만 네트워크 오류용 해당 화면 ErrorBoundary 없음. AsyncBoundary 컴포넌트는 정의만 있고 사용처 없음.
- 좌표 없는 장소는 분석 payload에서 조용히 제외한다. 좌표 없는 구간은 disabled query인데 isPending 표시로 계산 중에 머물 수 있다 (`useSchedulePage.ts:68,94,203`).
- 일정 수정은 이전 분석을 무효화하지 않는다. “초기화돼요” 안내와 달리 실제 reset 호출이 없고 resetSchedules 자체도 사용처가 없다.
- 제안 적용 여부를 suggestion ID 대신 type으로 기록하여 같은 종류의 다른 구간/다른 날짜 제안도 숨길 수 있다 (`useSuggestionList.ts:48`, `useSuggestionDetailNavigation.ts:31`). Day 6 이상은 상세→목록 이동에서 day 필터 제거.
- 지도 미리보기는 모든 날짜의 점을 직선 Polyline으로 연결한다. 실제 도로 경로/일자별 선이 아니므로 경로 정확성 설명 필요.
- 검색 total_count는 표시하되 10건만 조회하고 다음 페이지 버튼은 없다.

## C. 반드시 수정해야 하는 문제

### P0 — 공개 서비스 또는 핵심 기능을 막는 문제

#### P0-1. 제공자 인증 없이 소셜 로그인/사용자 변경 허용

- **문제/증거**: Google·Naver 모두 프로필 JSON만으로 200. provider_user_id를 아는 경우 기존 사용자 프로필 변경도 가능한 구조다. 실제 테스트는 임시 ID 생성까지만 수행했다.
- **원인**: 요청에 검증 가능한 제공자 token/code가 없고 서버는 전달된 프로필을 신뢰한다. 사용자 세션도 발급하지 않는다.
- **파일**: `back/routers/auth.py:13,63`, `back/schemas/user.py:27`, `front/src/components/features/login/GoogleLogin.tsx:27`.
- **수정 방법**: 서버에서 제공자 토큰/code 검증 후 provider ID 추출, 서버 세션 발급. 연결되지 않은 로그인 API를 공개 유지하지 말고 구현 완료 전 비활성화도 선택 가능. 단순 라우터 활성화로 해결되지 않는다.

#### P0-2. 전체 최적화가 날짜 사이 이동을 지워 잘못된 개선 결과 생성

- **문제/증거**: 실제 검색으로 얻은 서울/울산의 동명 경복궁 장소 2개를 첫날에 넣었을 때 370km/332분. 둘째 날로 한 곳 이동하면 0km/0분으로 계산, 370km 절약·점수 상승 반환.
- **원인**: analyze_itinerary는 각 날짜 안에서만 인접 구간 계산. optimize_entire_itinerary는 장소 개수 균등화로 날짜를 이동시키고 날짜 경계 이동을 비교에 포함하지 않는다.
- **파일**: `back/services/simulation_service.py:681,708,1333,1383`.
- **수정 방법**: 날짜 경계의 위치/숙박/이동 모델을 정의하고 전후 비교에 같은 이동 범위를 적용. 지원 전에는 전체 이동 절감으로 표기하거나 자동 최적화하지 않도록 제한. 해당 회귀 시나리오 테스트 추가.

#### P0-3. 컨테이너 production의 API 주소/공개 키 build 주입 부재

- **문제**: front Docker build에는 backend host와 NEXT_PUBLIC 키 전달 없음. 기본 rewrite는 localhost:8000으로 빌드된다. 별도 back 컨테이너에서는 frontend 자신을 가리킨다.
- **원인**: `docker-compose.yml`은 runtime environment만 제공하며 production build 단계에 전달하지 않는다. compose는 next dev로 덮어써 이 문제를 개발 중 가린다.
- **파일**: `front/Dockerfile:11`, `front/next.config.ts:3`, `docker-compose.yml:32,37`.
- **수정 방법**: 실제 배포 방식에 맞춰 build 시 공개 키/프록시 주소 주입 또는 runtime 서버 프록시 설계. production compose를 구분하고 생성 이미지의 API/지도까지 검증. 관리 API URL도 같은 origin 또는 운영 주소로 설정.

### P1 — 제출 전에 수정하거나 미지원 범위를 명확하게 처리

| 문제 | 원인/관련 파일 | 수정 방법 |
|---|---|---|
| ODsay 실측 경로 실패 | 실제 ApiKeyAuthFailed; route_service.py:78,183 | 유효 키/서비스 이용권한 확인 후 여러 구간 재검증. 추정값·요금 0을 실측 또는 무료로 오인시키지 않기 |
| 운영 PostgreSQL 연결 미확인 | 6543 timeout; db/database.py:25 | 배포 실행 위치에서 네트워크/DB 상태/접속 설정 확인. APP_ENV=production으로 startup/읽기/쓰기 별도 검증. 현재 실패만으로 비밀번호 오류라고 단정하지 않음 |
| PDF/이미지 저장 허위 성공 | RoutePreview.tsx:48 및 :84; handler가 toast만 호출 | 실제 export/download 구현, 실패 처리. 제출 범위에서 빼려면 버튼/설명도 일치시킬 것 |
| 관리자 기능 전부 404 | main.py:81–84 라우터 등록 비활성 | 필요 기능만 보안 수정 후 등록/검증하거나 관리자 UI 제외. RAG는 등록만으로 해결 불가 |
| 기본 최고관리자/고정 JWT | main.py:46,52; core/security.py:14; .env.example | 운영 기본 계정 자동 생성 제거, 개별 초기 비밀번호/관리자 부트스트랩. JWT 필수 검증·기본값 거부. 로그에 계정 비밀번호 출력 제거. 현재 관리자 라우터 비활성이라 즉시 원격 관리자 탈취를 재현한 것은 아님 |
| 결과 편집 시 교통수단 유실 | RoutePreview.tsx:23,42; plan/schedule/page.tsx:23 | transport를 URL/store에서 유지. public 여행 결과→편집→재분석 회귀 확인 |
| 변경 후 오래된 결과 유지/새 여행 초기화 없음 | usePlanScheduleStore.ts:87,108,118; RoutePreview.tsx:42 | 일정 변경 시 분석 무효화, 새 여행 시작/편집에 맞는 명시적 reset. 날짜 밖 이전 일정이 지도에 섞이지 않도록 request 기준 렌더 |
| 입력 유효성 검증 부족 | schemas/simulation.py:70; routers/simulation.py:89 | date 타입/기간 일치/최소 장소/좌표 범위/일수·장소수 상한/중복 검증. 잘못된 입력 400/422 처리 |
| TourAPI 장애가 검색 0건으로 위장 | search_service.py:17 | 제공자 오류코드 검사, timeout/인증/5xx를 오류 응답으로 구분; 검색 재시도 UI 연결 |
| 비동기 endpoint 안의 동기 외부 요청 | routers/search.py:8; routers/simulation.py:24,77; simulation_service.py:848 | blocking requests/DB/LLM 호출을 threadpool/동기 endpoint 또는 async client로 분리. 분석 총 timeout 및 비용/빈도 제한. 부하 테스트는 별도 필요 |
| 분석 마스터가 미추적 로컬 CSV 의존 | simulation_service.py:19,36; main.py scheduler 주석 | clean checkout에도 재현 가능한 데이터 설치/버전/적재 절차. CSV 없으면 관광 유형 기본값으로 상세 조회하므로 데이터 미확인 안내. scheduler 재활성화만 해도 메모리 캐시 재적재 문제는 남음 |
| 일부 제안 적용 후 다른 제안까지 숨김 | useSuggestionList.ts:48; useSuggestionDetailNavigation.ts:31 | suggestion ID 단위 적용 상태 및 최신 결과와 동기화, Day 6 이상 필터 보존 |
| 결과/지도 오류 상태 고정 | SummaryPageClient.tsx:22; KakaoMapScriptProvider.tsx:26 | hydration 완료 여부와 결과 없음 구분, 다시 시작/재시도 버튼, SDK error state 제공 |
| 내부 예외/요청 정보 노출 | routers/simulation.py:89 등 str(exc), route_service.py:159/193 print, simulation_service.py:110 | 사용자에게 일반 오류+추적 ID, 서버 로그는 URL query의 serviceKey/apiKey 제거. 현재 에러에 키가 실제 노출됐다고 단정하지 않고 코드 경로 위험으로 판정 |

### P2 — 가능하면 개선

- OpenAI 생성 문장 UI 미사용: `SummaryPageClient.tsx:38`은 status_message/status_label 사용. 설명 노출 또는 호출 제외로 비용/지연 정리.
- 소셜 응답 null/bool 타입 정합성과 검색 results 명시 스키마 개선.
- route cache TTL 없음, JSON 상세 캐시 만료·동시 쓰기 잠금 없음. 운영시간/실시간 교통 정보가 오래될 수 있음 (`route_service.py:121`, `simulation_service.py:57`).
- 시간 계산은 HH:MM만으로 다음날 넘어감을 잃을 수 있다. 매우 긴 체류/야간 영업 시나리오 별도 테스트 필요.
- metadataBase 미설정 build warning: 공유 이미지 origin이 localhost:3000. `front/src/app/layout.tsx:9`에 운영 origin 필요.
- QueryProvider가 render마다 QueryClient 생성. 상태 안정성 개선 (`front/src/providers/QueryProvider.tsx:10`).
- 사용하지 않는 mock 상수/컴포넌트 정리, lint와 테스트를 CI에 연결. 현재 `.github`에는 PR 템플릿만 있고 자동 검증 workflow 없음.

## D. 미완성·임시·사용하지 않는 기능

- 날짜만 선택하여 여행 구성: 홈 버튼 “준비 중”, `/date` 페이지/생성 API 없음.
- PDF/이미지 export: 메뉴만 있고 생성/다운로드 없음.
- 사용자 로그인 컴포넌트는 있으나 페이지에 연결되지 않고 사용자 세션/마이페이지/계정별 일정 저장 없음.
- 관리자 14개 endpoint 구현은 서버 등록 비활성. 프론트 사용하는 12개도 작동하지 않음.
- 관리자 RAG 파일/벡터/PDF/CSV/DB 동기화 6개 API 구현 없음.
- `SUGGESTION_DETAIL_DATA`(`suggestion-detail-data.ts:25`), `SUGGESTIONS`(`suggestion-list-data.ts:11`)에 부산 예시 데이터가 남음. **현재 화면은 simulation-suggestions.ts의 실제 API 변환을 사용하며 이 mock 상수의 import 사용처는 없다.** 파일 자체의 타입/parse 함수는 사용 중이므로 파일 전체 삭제 대상은 아님.
- `resetSchedules`, `setAnalysisResult`, `AsyncBoundary`는 정의 외 사용처가 확인되지 않음. 로그인 컴포넌트도 미사용.
- `SearchResultItem`은 정의되어 있지만 검색 응답에서 주석 처리되고 Dict 사용.
- 스케줄러 시작 및 관리자 include_router 주석은 실제 미완성 연동. TODO/FIXME 문자만 검색해서는 발견되지 않는 항목이다.
- 노트북/patch_notebooks는 실험용 분석 자료, 서비스 실행 경로는 아님. 비밀키 패턴 검사에서 명확한 live key 하드코딩은 찾지 못했으나 전체 Git 과거 이력의 비밀정보 무결성을 보증하지 않는다.

## 6. Docker·보안·문서 마감 점검

### Docker

- compose 문법 정상, frontend→backend 서비스 DNS 구성 O. `depends_on`은 readiness/DB 준비 보장이 아니며 healthcheck 없음.
- front runtime `NODE_ENV=production` 이미지에 compose `npm run dev`를 덮어씀. 운영용 설정과 개발용 설정 혼재.
- frontend runner에 next.config.ts 복사 없음. 생성 rewrite manifest/build 주입을 포함한 실제 이미지 검증 필요.
- compose 포트는 3000/8000 고정. FRONTEND_PORT는 효과 없고 BACKEND_PORT만 바꾸면 proxy/back 포트 불일치.
- back uvicorn에 --reload 없음. 가이드의 “소스 수정 실시간 반영”은 백엔드에 해당하지 않는다.
- back Dockerfile `COPY . .`이나 back .dockerignore 없음. 로컬 DB/CSV/노트북 등 포함 가능; 운영 이미지 데이터·개발 DB 혼입 범위 정리 필요.
- front npm install은 pnpm lock을 사용하지 않는다. 새 설치 시 일부 버전이 현재 node_modules와 달라짐.
- Docker daemon을 임의로 켜거나 기존 컨테이너를 변경하지 않았다. 실제 compose build/up은 미검증.

### 보안

- `.env`와 DB 파일은 현재 Git 추적되지 않음. `.env.example`에 고정 JWT 기본값 존재.
- REST/LLM 키는 환경변수 사용. 실제 키 문자열은 출력하지 않음. 노트북 포함 추적 텍스트의 주요 키 패턴 검사상 추가 live secret 발견 없음. 포괄적 secret scanner/이력 검사는 미실시.
- CORS는 localhost 4개 origin 제한이며 wildcard 허용은 아니다. 일반 사용자 same-origin proxy에는 CORS가 주요 장애가 아니지만, 별도 origin 관리자 API는 운영 allowlist/HTTPS/Secure 쿠키 설정 필요.
- 관리자 쿠키 HttpOnly 구현은 있으나 Secure 기본 false. 공개 배포 전 설정 필요.
- public 분석/검색 API에 호출량/입력량 제한이 없어 외부 유료 API 비용·긴 요청 위험. SQLAlchemy 사용 부분에서 직접 문자열 SQL 조합 방식의 주입 문제는 찾지 못했지만 별도 침투 테스트를 수행한 것은 아니다.
- startup 테이블 생성 실패를 catch한 뒤 계속 서비스할 수 있고 `/`는 DB 상태와 무관하게 정상 메시지 반환. readiness 점검 강화 필요.

### README와 실제 구현 차이

| 문서 | 실제 차이/누락 | 보완 |
|---|---|---|
| 루트 README.md | 소개와 분석 요청 JSON뿐; 설치/명령/키/DB/API 목록 없음 | Python/Node 버전, 설치·실행·테스트·환경변수·데이터 준비·서비스 범위 |
| front/README.md | create-next-app 기본 문서. app/page.tsx, Geist 설명은 현재 src/app 및 Pretendard 구성과 불일치 | 프로젝트 기준 경로/폰트/프록시/공개 키 주입 |
| docker-guide-local.md | back도 실시간 hot reload 된다는 설명과 uvicorn CMD 불일치 | back 변경 시 재시작 또는 개발 --reload 안내 |
| docker-guide-local.md | root .env만 확인하면 된다고 되어 있으나 데이터 준비/운영 키 build 주입/DB 모드 설명 부족 | 개발/운영 경로 구분 |
| back/docs/api-search-unified.md | “분류 룩업 완료” 설명과 달리 현재 원본 코드 필드 전달; 예시 이미지가 URL 대신 Markdown 링크 문자열 | OpenAPI 및 실제 JSON 기준 재작성 |
| .env.example | API_BASE_URL/쿠키/JWT 만료/scheduler 등 누락, vector “향후” 설명, 고정 JWT | 실제 사용/예정 구분 및 운영 기본값 제거 |

## E. 실제 검증하지 못한 항목

1. 브라우저 E2E·responsive·console/React warning·전체 이미지·새로고침 상태 복원: 브라우저 제어 실행 도구 필요. HTTP 200을 대체 증거로 사용하지 않음.
2. Kakao JS Maps 도메인 권한 및 지도/주소검색: 배포용 공개 JS 키 주입과 등록 origin에서 실제 브라우저 필요.
3. Google/Naver 정상 OAuth: 등록 client/callback/origin 및 사용자 로그인 필요. 현재 페이지 연결부터 수정해야 함.
4. TMap: 현재 환경변수에 키 없음. 유효한 TMAP_API_KEY 필요.
5. ODsay 정상 경로 응답/요금: 현재 제공 키 인증 실패. 사용 권한/키 수정 후 실제 대중교통 구간 재검증 필요.
6. PostgreSQL schema·사용자/캐시 CRUD·migration: 현 위치에서 연결 timeout. 배포 서버에서 접근 가능한 DB와 접속 설정 필요. credential 유효성도 아직 판단할 수 없음.
7. Docker 이미지 build/up 및 Node20/Python3.11 조합: Docker daemon 기동 필요.
8. 전체 관광 데이터 수집/스케줄 갱신: 미실행. clean checkout의 데이터 확보 및 메모리 반영 검증 필요.
9. 동시 사용자/성능/쿼터 소진/제공자 429·긴 LLM 응답: 실제 부하 테스트 미실시. 동기 I/O 구조의 위험은 코드상 확인.
10. 모든 제안 조합의 UI E2E, 다일·야간·장거리·교통수단별 정확성: 단위 테스트 및 일부 HTTP 시나리오만 검증.

## F. 최종 제출 전 체크리스트

- [ ] 토큰 없는 소셜 로그인 요청이 거절되고 정상 OAuth 후 세션이 유지되는지 확인
- [ ] 기본 관리자 계정/JWT 기본값/비밀번호 로그 제거 확인
- [ ] 날짜 사이 이동을 포함해 전체 최적화 전후 거리·시간·요금이 정확한지 확인
- [ ] ODsay 실제 경로 및 실패 시 추정/실측 구분 확인
- [ ] 운영 APP_ENV에서 PostgreSQL startup 및 CRUD 확인
- [ ] clean checkout에서 데이터 준비·의존성 설치·build·테스트 재현
- [ ] Docker production 이미지의 프록시 주소·공개 키·포트·healthcheck 확인
- [ ] Kakao/Google/Naver에 실제 배포 origin/callback 등록
- [ ] PDF/이미지가 실제로 다운로드되거나 미지원 기능 UI가 제거되는지 확인
- [ ] 대중교통 여행 결과→편집→재분석에서도 선택 수단 유지
- [ ] 일정 수정/새 여행 시작 시 이전 결과와 날짜 밖 장소가 섞이지 않는지 확인
- [ ] 같은 유형 제안 여러 개를 차례로 적용하고 Day 6 이상 이동 확인
- [ ] 키 누락/외부 API 장애/빈 검색/잘못된 날짜/좌표 없음에 적절한 오류와 재시도 표시
- [ ] 결과 페이지 직접 진입·localStorage 없음·새로고침에서 무한 로딩이 없는지 확인
- [ ] 모바일/데스크톱에서 달력·장소 선택·드래그·지도·제안·저장 버튼 직접 실행
- [ ] 브라우저 console/Network/React warning/깨진 이미지 확인
- [ ] 관리자 및 RAG의 제출 범위를 실제 지원 기능과 일치시킴
- [ ] README·.env.example·Docker 가이드·API 문서를 실제 코드에 맞춰 정리
- [ ] 운영 HTTPS/CORS/Secure 쿠키, 에러 로그 secret 마스킹, 호출 비용 제한 확인
- [ ] 제출 전 lint/tsc/build/11개 기존 테스트 및 발견된 결함 회귀 테스트 통과
