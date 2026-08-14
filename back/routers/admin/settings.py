import os
from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from routers.admin.deps import require_roles
from db.models import AdminRole

router = APIRouter(
    prefix="/api/admin/settings",
    tags=["Admin Settings"],
    dependencies=[Depends(require_roles(AdminRole.SUPERADMIN, AdminRole.ADMIN))],
)


class UsedApiItem(BaseModel):
    name: str
    category: str
    env_key: str
    is_configured: bool
    status: str
    description: str


class UsedEnvItem(BaseModel):
    key: str
    value: str
    is_configured: bool
    description: str


def check_env_configured(key: str) -> bool:
    val = os.getenv(key)
    if not val:
        return False
    # 플레이스홀더 체크
    if val.startswith("your_") or "here" in val or val == "placeholder":
        return False
    return True


def mask_env_value(key: str) -> str:
    val = os.getenv(key)
    if not val:
        return "미설정"
    
    # 플레이스홀더 체크
    if val.startswith("your_") or "here" in val or val == "placeholder":
        return "미설정 (기본 예시값)"

    # 중요 정보 여부 판단 (키워드 매칭)
    sensitive_keywords = ["key", "secret", "url", "password", "token"]
    is_sensitive = any(kw in key.lower() for kw in sensitive_keywords)
    
    if is_sensitive:
        if len(val) <= 15:
            return "●●●●●●●●"
        else:
            # 첫 6글자, 마지막 4글자 노출하고 중간 영역 마스킹
            return f"{val[:6]}...{val[-4:]}"
    return val


@router.get("/apis", response_model=List[UsedApiItem])
def get_used_apis():
    """사용 API 리스트 조회 (연동 현황 포함)"""
    apis = [
        {
            "name": "한국관광공사 국문 관광정보 서비스 (Tour API)",
            "category": "공공데이터",
            "env_key": "TOUR_API_DECODE_KEY",
            "is_configured": check_env_configured("TOUR_API_DECODE_KEY"),
            "status": "active" if check_env_configured("TOUR_API_DECODE_KEY") else "inactive",
            "description": "국내 관광지 마스터 정보(제목, 소개, 위치, 이미지 등)를 수집하고 상세 정보를 조회하기 위해 사용됩니다."
        },
        {
            "name": "OpenAI API",
            "category": "인공지능 / LLM",
            "env_key": "OPENAI_API_KEY",
            "is_configured": check_env_configured("OPENAI_API_KEY"),
            "status": "active" if check_env_configured("OPENAI_API_KEY") else "inactive",
            "description": "관광 코스 시뮬레이션 결과 진단, 동선 최적화 조언 피드백 및 AI 추천 코멘트 텍스트 생성에 사용됩니다."
        },
        {
            "name": "Anthropic API",
            "category": "인공지능 / LLM",
            "env_key": "ANTHROPIC_API_KEY",
            "is_configured": check_env_configured("ANTHROPIC_API_KEY"),
            "status": "active" if check_env_configured("ANTHROPIC_API_KEY") else "inactive",
            "description": "RAG 파이프라인 및 LLM 백업 서비스로, 추가적인 AI 일정 분석 피드백 생성을 위한 예비용 API입니다."
        },
        {
            "name": "Kakao 지도 API",
            "category": "지도 서비스",
            "env_key": "NEXT_PUBLIC_KAKAO_MAP_KEY",
            "is_configured": check_env_configured("NEXT_PUBLIC_KAKAO_MAP_KEY"),
            "status": "active" if check_env_configured("NEXT_PUBLIC_KAKAO_MAP_KEY") else "inactive",
            "description": "프론트엔드 화면에서 지도 레이아웃 렌더링, 관광지 마커 시각화 및 이동 경로 표시를 위해 사용됩니다."
        },
        {
            "name": "Google OAuth API",
            "category": "소셜 인증",
            "env_key": "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
            "is_configured": check_env_configured("NEXT_PUBLIC_GOOGLE_CLIENT_ID"),
            "status": "active" if check_env_configured("NEXT_PUBLIC_GOOGLE_CLIENT_ID") else "inactive",
            "description": "일반 사용자가 Google 소셜 계정을 통해 서비스에 빠르게 로그인하고 회원가입할 수 있도록 연동합니다."
        },
        {
            "name": "Naver OAuth API",
            "category": "소셜 인증",
            "env_key": "NEXT_PUBLIC_NAVER_CLIENT_ID",
            "is_configured": check_env_configured("NEXT_PUBLIC_NAVER_CLIENT_ID"),
            "status": "active" if check_env_configured("NEXT_PUBLIC_NAVER_CLIENT_ID") else "inactive",
            "description": "일반 사용자가 Naver 소셜 로그인을 통해 로그인 및 개인화된 일정 관리 기능을 활용할 수 있도록 지원합니다."
        },
        {
            "name": "Supabase PostgreSQL Database",
            "category": "데이터베이스",
            "env_key": "DATABASE_URL",
            "is_configured": check_env_configured("DATABASE_URL"),
            "status": "active" if check_env_configured("DATABASE_URL") else "inactive",
            "description": "Route Check의 주 관계형 데이터베이스로, 관리자/사용자 계정 및 TSP 경로 최적화 캐시를 보관합니다."
        },
        {
            "name": "Vector Database (RAG)",
            "category": "데이터베이스",
            "env_key": "VECTOR_DB_URL",
            "is_configured": check_env_configured("VECTOR_DB_URL"),
            "status": "active" if check_env_configured("VECTOR_DB_URL") else "inactive",
            "description": "관광지 소개 텍스트 및 상세 페이지 데이터의 고성능 시맨틱 검색을 위한 벡터 임베딩 보관용 데이터베이스입니다."
        }
    ]
    return apis


@router.get("/envs", response_model=List[UsedEnvItem])
def get_used_envs():
    """사용 환경변수(Env) 리스트 조회 (보안 마스킹 적용)"""
    env_keys = [
        ("BACKEND_PORT", "백엔드 FastAPI 서버 포트 번호"),
        ("FRONTEND_PORT", "프론트엔드 Next.js 개발 서버 포트 번호"),
        ("TOUR_API_DECODE_KEY", "한국관광공사 국문 관광정보 서비스(Tour API) 디코딩 일반 인증키"),
        ("OPENAI_API_KEY", "AI 일정 진단 및 코멘트 생성을 위한 OpenAI API 키"),
        ("ANTHROPIC_API_KEY", "Anthropic Claude API 연동용 인증 키 (예비용)"),
        ("NEXT_PUBLIC_KAKAO_MAP_KEY", "웹 프론트엔드에서 Kakao 지도 렌더링에 사용되는 JavaScript 키"),
        ("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "Google OAuth 간편 로그인을 위한 구글 클라이언트 ID"),
        ("NEXT_PUBLIC_NAVER_CLIENT_ID", "Naver OAuth 간편 로그인을 위한 네이버 클라이언트 ID"),
        ("DATABASE_URL", "Supabase PostgreSQL 접속 경로 (Transaction Connection Pooler URL)"),
        ("DIRECT_URL", "Supabase PostgreSQL 직접 연결 경로 (Session Mode - DB 마이그레이션용)"),
        ("VECTOR_DB_URL", "시맨틱 벡터 검색을 위한 Vector DB(Pinecone 등) 접속 경로"),
        ("JWT_SECRET", "어드민 세션 JWT 서명 시 보안 유지를 위한 HS256 비밀값")
    ]
    
    envs = []
    for key, desc in env_keys:
        envs.append({
            "key": key,
            "value": mask_env_value(key),
            "is_configured": check_env_configured(key),
            "description": desc
        })
    return envs
