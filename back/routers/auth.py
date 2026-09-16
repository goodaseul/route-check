from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from db.database import get_db
from db.models import User
from schemas.user import UserSocialLoginRequest, UserResponse
from core.security import create_access_token

router = APIRouter(prefix="/api/auth", tags=["Public Auth"])


@router.post("/login/google", response_model=UserResponse)
def login_google(body: UserSocialLoginRequest, db: Session = Depends(get_db)):
    """일반 사용자 — 구글 소셜 로그인 (안전한 토큰 검증 시스템 준비 중으로 임시 비활성화)."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="소셜 로그인 기능은 현재 안전한 서버 토큰 검증 시스템 준비 중으로 비활성화되어 있습니다."
    )


@router.post("/login/naver", response_model=UserResponse)
def login_naver(body: UserSocialLoginRequest, db: Session = Depends(get_db)):
    """일반 사용자 — 네이버 소셜 로그인 (안전한 토큰 검증 시스템 준비 중으로 임시 비활성화)."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="소셜 로그인 기능은 현재 안전한 서버 토큰 검증 시스템 준비 중으로 비활성화되어 있습니다."
    )
