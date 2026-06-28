from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
import jwt

from db.database import get_db
from db.models import AdminRole, AdminUser
from core.security import ADMIN_SESSION_COOKIE, decode_access_token


def get_current_admin_user(
    request: Request,
    db: Session = Depends(get_db),
) -> AdminUser:
    # 1. 쿠키에서 토큰 추출
    token = request.cookies.get(ADMIN_SESSION_COOKIE)

    # 2. 쿠키에 없으면 Authorization 헤더에서 Bearer 토큰 추출 시도
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인이 필요합니다.",
        )

    try:
        payload = decode_access_token(token)
        subject_id = payload.get("sub")
        kind = payload.get("kind")
        if not subject_id or kind != "admin":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰 형식입니다.",
            )
        admin_id = int(subject_id)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 세션이 만료되었습니다. 다시 로그인해 주세요.",
        )
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 정보가 유효하지 않습니다.",
        )

    # 3. 데이터베이스에서 관리자 조회
    admin_user = db.query(AdminUser).filter(
        AdminUser.id == admin_id,
        AdminUser.deleted_at.is_(None)
    ).first()

    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="존재하지 않는 관리자 계정입니다.",
        )

    if not admin_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 관리자 계정입니다.",
        )

    return admin_user


def require_roles(*allowed_roles: AdminRole):
    def dependency(current_user: AdminUser = Depends(get_current_admin_user)) -> AdminUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="해당 작업을 수행할 권한이 없습니다.",
            )
        return current_user
    return dependency
