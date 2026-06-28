import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import AdminRole, AdminUser
from core.security import (
    ADMIN_SESSION_COOKIE,
    create_access_token,
    get_jwt_expire_hours,
    verify_password,
    get_cookie_samesite,
)
from schemas.admin import (
    AdminLoginRequest,
    AdminSessionResponse,
    AdminUserResponse,
)
from routers.admin.deps import get_current_admin_user

router = APIRouter(prefix="/api/admin/auth", tags=["Admin Auth"])


@router.post("/session", response_model=AdminSessionResponse)
def create_session(
    body: AdminLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """어드민 — 브라우저 세션 로그인."""
    admin_user = db.query(AdminUser).filter(
        AdminUser.username == body.username,
        AdminUser.deleted_at.is_(None)
    ).first()

    if not admin_user or not verify_password(body.password, admin_user.password_hash):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")

    if not admin_user.is_active:
        raise HTTPException(status_code=403, detail="비활성화된 관리자 계정입니다.")

    if admin_user.role not in {AdminRole.SUPERADMIN, AdminRole.ADMIN}:
        raise HTTPException(status_code=403, detail="관리자 페이지 접근 권한이 없습니다.")

    access_token = create_access_token(
        subject_id=admin_user.id,
        role=admin_user.role.value
    )

    admin_user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(admin_user)

    response.set_cookie(
        key=ADMIN_SESSION_COOKIE,
        value=access_token,
        httponly=True,
        max_age=get_jwt_expire_hours() * 60 * 60,
        path="/",
        samesite=get_cookie_samesite(),
        secure=os.environ.get("ADMIN_COOKIE_SECURE", "false").lower() == "true",
    )
    return AdminSessionResponse(admin_user=AdminUserResponse.model_validate(admin_user))


@router.post("/session/logout", status_code=204)
def delete_session(response: Response):
    """어드민 — 브라우저 세션 로그아웃."""
    response.delete_cookie(
        key=ADMIN_SESSION_COOKIE,
        path="/",
        httponly=True,
        samesite=get_cookie_samesite(),
        secure=os.environ.get("ADMIN_COOKIE_SECURE", "false").lower() == "true",
    )


@router.get("/me", response_model=AdminUserResponse)
def get_me(current_admin: AdminUser = Depends(get_current_admin_user)):
    """어드민 — 현재 로그인 정보."""
    return current_admin
