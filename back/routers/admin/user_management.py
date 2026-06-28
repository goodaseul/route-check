from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import AdminRole, User
from schemas.user import UserResponse, UserUpdateStatus, UserPaginatedResponse
from routers.admin.deps import require_roles

router = APIRouter(
    prefix="/api/admin/users",
    tags=["Admin Public Users Management"],
    dependencies=[Depends(require_roles(AdminRole.SUPERADMIN, AdminRole.ADMIN))],
)


@router.get("", response_model=UserPaginatedResponse[UserResponse])
def list_users(
    auth_provider: Optional[str] = Query(None, description="google | naver"),
    is_active: Optional[bool] = Query(None, description="true=활성, false=비활성"),
    search: Optional[str] = Query(None, description="이름, 닉네임, 이메일 검색"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    db: Session = Depends(get_db),
):
    """어드민 — 일반 사용자 목록 조회."""
    query = db.query(User).filter(User.deleted_at.is_(None))

    if auth_provider:
        query = query.filter(User.auth_provider == auth_provider)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        query = query.filter(
            (User.name.like(f"%{search}%")) |
            (User.nickname.like(f"%{search}%")) |
            (User.email.like(f"%{search}%"))
        )

    total = query.count()
    users = query.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return UserPaginatedResponse[UserResponse](
        items=users,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/{user_id}", response_model=UserResponse)
def get_user_detail(user_id: int, db: Session = Depends(get_db)):
    """어드민 — 일반 사용자 상세 조회."""
    user = db.query(User).filter(
        User.id == user_id,
        User.deleted_at.is_(None)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )

    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user_status(
    user_id: int,
    body: UserUpdateStatus,
    db: Session = Depends(get_db),
):
    """어드민 — 사용자 활성화/정지 상태 변경."""
    user = db.query(User).filter(
        User.id == user_id,
        User.deleted_at.is_(None)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )

    user.is_active = body.is_active
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    return user


@router.delete("/{user_id}", response_model=UserResponse)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """어드민 — 사용자 소프트 삭제."""
    user = db.query(User).filter(
        User.id == user_id,
        User.deleted_at.is_(None)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )

    user.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    return user
