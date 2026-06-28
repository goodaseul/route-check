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
    """일반 사용자 — 구글 소셜 로그인 및 자동 가입."""
    if body.auth_provider != "google":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="잘못된 로그인 수단입니다."
        )

    # 기존 가입 여부 검사 (소프트 삭제 포함 고려)
    user = db.query(User).filter(
        User.auth_provider == "google",
        User.provider_user_id == body.provider_user_id,
        User.deleted_at.is_(None)
    ).first()

    if not user:
        # 가입되어 있지 않으면 자동 회원가입
        user = User(
            auth_provider="google",
            provider_user_id=body.provider_user_id,
            email=body.email,
            name=body.name,
            nickname=body.nickname or body.name,
            profile_image=body.profile_image,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # 가입되어 있으면 최신 소셜 정보 업데이트
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="비활성화되거나 정지된 사용자 계정입니다."
            )
        if body.email:
            user.email = body.email
        if body.name:
            user.name = body.name
        if body.profile_image:
            user.profile_image = body.profile_image
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)

    return user


@router.post("/login/naver", response_model=UserResponse)
def login_naver(body: UserSocialLoginRequest, db: Session = Depends(get_db)):
    """일반 사용자 — 네이버 소셜 로그인 및 자동 가입."""
    if body.auth_provider != "naver":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="잘못된 로그인 수단입니다."
        )

    # 기존 가입 여부 검사
    user = db.query(User).filter(
        User.auth_provider == "naver",
        User.provider_user_id == body.provider_user_id,
        User.deleted_at.is_(None)
    ).first()

    if not user:
        # 가입되어 있지 않으면 자동 회원가입
        user = User(
            auth_provider="naver",
            provider_user_id=body.provider_user_id,
            email=body.email,
            name=body.name,
            nickname=body.nickname or body.name,
            profile_image=body.profile_image,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # 가입되어 있으면 최신 소셜 정보 업데이트
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="비활성화되거나 정지된 사용자 계정입니다."
            )
        if body.email:
            user.email = body.email
        if body.name:
            user.name = body.name
        if body.profile_image:
            user.profile_image = body.profile_image
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)

    return user
