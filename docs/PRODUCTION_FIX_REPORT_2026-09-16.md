# Route-check Backend production 수정·검증 보고서

## 원인

### 1. Secret 노출

- `services/simulation_service.py`의 `fetch_detail_intro()`가 requests 예외를 그대로 `print()`했다. requests/urllib3의 연결 실패 예외에는 `serviceKey`가 포함된 요청 URL이 들어간다. 이 stdout이 Cloud Run 로그에 수집됐다.
- 경로 API의 예외 출력, 데이터 수집기 오류 로그, OpenAI 오류 출력, simulation router의 원문 예외 응답도 유사한 노출 경로였다.
- HTTP client 자체 로그 및 chained traceback을 포함해 공통 로깅 단계에서 마스킹할 필요가 있었다.
- 추가 Secret 검사에서 production JWT Secret과 일치하는 기존 기본 문자열이 `core/security.py`에 있었다. 이를 제거한 뒤에도 하위 `__pycache__`의 bytecode가 Docker 이미지에 복사되고 있어 `.dockerignore`도 수정했다. 실제 Secret 값은 출력하지 않았다.

### 2. TourAPI timeout — 근본 원인 미확정

- 사용 endpoint: `https://apis.data.go.kr/B551011/KorService2/searchKeyword2`, `areaBasedList2`, `detailIntro2`.
- 현재 작업 트리의 요청 timeout은 10초다. Session/User-Agent 설정은 유지했으며, 이를 timeout 해결 근거로 삼지 않았다. 이번 검증을 이유로 timeout을 추가 확대하지 않았다.
- production Secret은 decoded key이며 `%` 인코딩 문자열이 아니다. requests의 `params`로 전달해 인코딩하며 동일 키로 실제 응답 `0000`을 확인했다.
- Cloud Run DNS: `apis.data.go.kr` → `27.101.236.63`. TCP 443 및 TLS 1.3 연결 성공.
- 기존 서비스에는 VPC connector/Direct VPC egress 설정이 없다. GCP 공식 문서상 기본 인터넷 egress는 동적 IP 풀을 사용한다.
- 기존 revision도 코드/인프라 변경 없이 다시 검색·추천에 성공했다.
- 새 이미지의 진단 Job 한 실행에서는 검색·추천 6회가 모두 `ConnectTimeout`으로 실패했다. 빈 결과를 PASS 처리하지 않았다.
- 후속 독립 실행에서는 기본 requests와 application User-Agent 방식 모두 성공했다. 3개 task의 비교 요청 12회도 성공했다. 성공한 task들은 서로 다른 외부 IP를 사용했다.
- 최종 추가 검증에서는 3개 task가 실제 application 검색/추천 함수를 호출한 6회도 모두 결과를 반환했다.
- 따라서 지속적인 DNS 오류, 잘못된 키 인코딩, 항상 실패하는 application 요청 형식은 관측 결과와 맞지 않는다. 간헐적인 연결 경로/외부 서비스 측 문제는 의심되지만, 실패 인스턴스의 패킷 또는 공급자 차단 로그가 없어 IP 차단이나 GCP 장애로 확정할 수 없다.
- 근거 없이 VPC/NAT를 만들거나 통신 코드를 변경하지 않았다. 실제 production 호출 성공과 timeout 근본 원인 해결은 별도로 판정한다.

공식 자료: [Cloud Run static outbound IP 문서](https://docs.cloud.google.com/run/docs/configuring/static-outbound-ip)

### 3. 총 소요시간

- 일자별 소요시간을 합산한 후 날짜 간 이동의 거리와 이동시간만 합산하고, `total_duration_minutes`에는 `inter_dur`를 더하지 않았다.
- 기존 날짜 간 이동 구간을 그대로 사용해 총 소요시간에 이동시간을 한 번 추가했다. 거리·점수·warning·suggestion·transport 알고리즘은 이번 수정 대상으로 변경하지 않았다.

## 수정 파일 및 변경 내용

| 파일 | 변경 |
|---|---|
| `back/core/logging_safety.py` | 환경변수 Secret, DB 비밀번호, URL query, 인증 header, 인코딩된 값, 예외 traceback 공통 마스킹. Uvicorn access formatter 인자 형식 보존 |
| `back/main.py` | application import 전에 마스킹 설치, 기본 관리자 비밀번호 로그 제거 |
| `back/db/database.py` | 독립 import에도 마스킹 적용, DB 연결 실패 원문 chained exception 차단 |
| `back/core/security.py` | production Secret과 일치하던 JWT 기본값 제거. 설정된 환경변수만 사용 |
| `back/services/simulation_service.py` | TourAPI/OpenAI 원문 예외 출력 제거, 날짜 간 이동시간을 총 소요시간에 합산 |
| `back/services/search_service.py` | 요청 실패는 endpoint·오류 종류만 기록하는 상태로 검증 |
| `back/services/route_service.py` | Kakao/TMap/ODsay 및 DB cache 오류에서 원문 예외 출력 제거 |
| `back/routers/simulation.py` | 내부 예외를 응답에 그대로 포함하지 않도록 수정, 사용자 오류 메시지도 마스킹 |
| `back/scripts/collect_tour_data.py` | standalone 실행에도 마스킹 적용, 요청 예외 원문 제거 |
| `back/.dockerignore` | 중첩 Python bytecode/cache와 `.env` 제외. 관광 CSV 포함 유지 |
| `back/tests/test_logging_safety.py` | 실제 값 대신 가짜 Secret으로 로깅·traceback·HTTP 응답·JWT fallback 회귀 검증 |
| `back/tests/test_total_duration.py` | 중간에 빈 날짜가 있는 일정에서도 290분 이동을 총 410분에 반영하고 거리/점수 규칙 보존 검증 |

기존 사용자 변경사항은 유지했다. `git diff` 전체에는 이번 작업 이전 변경도 포함된다. frontend 파일은 작업 시작 시점의 hash와 동일하다. Git commit/push, Secret 교체, 데이터 삭제는 수행하지 않았다.

## 테스트 결과

| 항목 | 결과 |
|---|---|
| 작업 시작 backend 기준선 | PASS — 20개 |
| 최종 backend 전체 tests | PASS — 31개 |
| 최종 linux/amd64 image 내부 tests | PASS — 31개 |
| frontend lint | PASS |
| frontend TypeScript `tsc --noEmit` | PASS |
| frontend production build | PASS — 기존 `metadataBase` 경고 있음 |
| backend `git diff --check` | PASS |
| 전체 `git diff --check` | 기존 README trailing whitespace가 있음. 범위 밖이므로 유지 |
| 최종 image production Secret scan | PASS — 실제 Secret 6개, 일치 0건 |
| CSV 포함 | PASS — 50,677행 |
| Docker build / Artifact Registry push / Cloud Run deploy | PASS |

## Production Smoke Test

- Revision: `route-check-backend-00003-cpw`, Ready=True, 트래픽 100%.
- Image tag: `asia-northeast3-docker.pkg.dev/routecheck-501103/route-check/backend:prod-fix-20260916-01`
- 배포 digest: `sha256:1d4d6b845790d63ac572ac47d22564ece602552c6bd952521dddfb287895f155`
- 기존 환경변수, Secret version 참조, IAM/ingress 설정 유지.

| 항목 | 결과 | 실제 근거 |
|---|---|---|
| Health | PASS | 실제 health 역할의 `GET /` 200. `/health` route는 존재하지 않음 |
| production DB | PASS | 같은 새 이미지의 Cloud Run Job에서 `SELECT 1 = 1`, admins/users/places_cache/route_distance_cache 확인. 서비스 startup DB/table 확인 로그 |
| TourAPI 검색 | PASS | `/api/search` 200, 경복궁 총 12건. 후속 3회 모두 실제 결과 2개 반환 |
| TourAPI 추천 | PASS | `/api/recommendations` 200, 서울 총 2,036건. 후속 3회 모두 실제 결과 2개 반환 |
| 일정 분석 | PASS | 실제 POST 200 |
| 제안 적용 | PASS | 200, 전후 370.1km/290분 보존. 허위 절약 0 |
| 날짜 간 이동 | PASS | inter_day_transits: 370.1km / 290분, source=cache |
| total_duration_minutes | PASS | 같은 날/나눈 날짜 모두 체류 120 + 이동 290 = 410분 |
| OpenAI | PASS | 새 revision에서 chat completions HTTP 200 기록 2회 |
| ODsay fallback | PASS | 실제 요청 200, source=heuristics. ODsay 정상 API 성공으로 판정한 것은 아님 |
| 잘못된 입력 | PASS | 422 |
| TourAPI 장기 안정성/근본 원인 | 확인 필요 | 별도 진단 Job의 ConnectTimeout 재현 기록 존재 |

실제 TourAPI 상세정보가 반영된 나눈 날짜 일정에는 영업시간 warning이 추가되어 점수가 70이었다. 같은 날 일정은 80이었다. 이는 총 시간 합산에 따른 점수 변경이 아니며, 동일 상세정보를 고정한 회귀 테스트에서 점수/거리 규칙 보존을 별도 확인했다.

## Secret 노출 재검증

- production Secret 6개를 메모리에서만 읽고 원문/URL 인코딩/이중 인코딩/DB 비밀번호를 비교했다. 검색 결과에는 Secret 이름과 일치 여부만 출력했다.
- 최종 image 파일 내용: 6개 Secret 일치 0건. 최초 image 검사에서 발견한 오래된 JWT bytecode를 제외한 뒤 재빌드·재검사했다.
- 새 revision과 진단 Job 로그를 검사했다. 강제로 만든 TourAPI 연결 예외 및 Secret 6개의 chained exception도 마스킹됨을 확인했다.
- 최종 검사 로그 147건: Secret 일치 0건, 강제 예외 마스킹 6건, 새 서비스 TourAPI 실패 0건, HTTP 5xx 0건. 별도 진단 Job의 이전 실패 6건은 제외하거나 숨기지 않고 별도로 기록했다.
- 기존 노출 로그와 이전 image/Git 이력은 삭제하지 않았다. 사용자 별도 키 교체가 필요하다. JWT도 과거 코드 기본값과 같았으므로 별도 교체를 권고한다.

## 남은 문제

1. TourAPI 간헐적 ConnectTimeout의 정확한 원인은 미확정이다. 현재 production 실제 요청은 성공하지만 재발이 없다고 보장할 수 없다. 실패 시각/실행 환경 및 공급자 측 연결 기록을 대조해야 한다.
2. 이미 노출된 TourAPI 키와 과거 코드 기본값에 해당하는 JWT Secret은 사용자가 별도로 교체해야 한다. 자동으로 변경하지 않았다.
3. ODsay는 여전히 기존 heuristic fallback 상태다. 이번 범위에서 키 발급/권한은 변경하지 않았다.
4. 진단 Job `route-check-tour-diagnostic`은 예약 실행 없이 남아 있다. 실행 완료 후 지속 실행 중인 task는 없다.

## Vercel 연결 전 준비 상태

현재 배포의 핵심 backend smoke test는 통과했다. 다만 TourAPI 간헐적 연결 실패의 근본 원인 해결까지 완료됐다고 판정하지 않는다. Vercel `next.config.ts` 및 frontend 코드는 수정하지 않았다. Secret 교체와 TourAPI 재발 관찰 결과를 확인하고 별도 Vercel 연결 단계로 진행할 수 있다.
