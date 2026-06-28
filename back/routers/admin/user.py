from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import AdminRole, AdminUser
from schemas.admin import AdminUserCreate, AdminUserResponse, AdminUserUpdate, PaginatedResponse
from routers.admin.deps import require_roles
from core.security import hash_password

router = APIRouter(
    prefix="/api/admin/admin-users",
    tags=["Admin Users Admin"],
    dependencies=[Depends(require_roles(AdminRole.SUPERADMIN, AdminRole.ADMIN))],
)


def check_last_superadmin(db: Session, admin_id_being_modified: int, will_demote_or_deactivate: bool):
    """마지막 남은 최고관리자가 비활성화/삭제/강등되지 않도록 검증."""
    if not will_demote_or_deactivate:
        return

    # 현재 DB에 남아있는 활성 상태의 superadmin 개수 파악
    superadmins_count = db.query(AdminUser).filter(
        AdminUser.role == AdminRole.SUPERADMIN,
        AdminUser.is_active.is_(True),
        AdminUser.deleted_at.is_(None)
    ).count()

    # 수정 대상이 superadmin인 경우
    target = db.query(AdminUser).filter(AdminUser.id == admin_id_being_modified).first()
    if target and target.role == AdminRole.SUPERADMIN and target.is_active:
        if superadmins_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="최소 한 명 이상의 활성화된 최고 관리자(superadmin)가 존재해야 합니다.",
            )


@router.get("", response_model=PaginatedResponse[AdminUserResponse])
def list_admin_users(
    role: Optional[AdminRole] = Query(None, description="superadmin | admin | partner"),
    is_active: Optional[bool] = Query(None, description="true=활성만, false=비활성만, 생략=전체"),
    username: Optional[str] = Query(None, description="아이디 부분 일치"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    db: Session = Depends(get_db),
):
    """어드민 — 어드민 회원 목록 조회."""
    query = db.query(AdminUser).filter(AdminUser.deleted_at.is_(None))

    if role:
        query = query.filter(AdminUser.role == role)
    if is_active is not None:
        query = query.filter(AdminUser.is_active == is_active)
    if username:
        query = query.filter(AdminUser.username.like(f"%{username}%"))

    total = query.count()
    users = query.order_by(AdminUser.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse[AdminUserResponse](
        items=users,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/{admin_user_id}", response_model=AdminUserResponse)
def get_admin_user(admin_user_id: int, db: Session = Depends(get_db)):
    """어드민 — 어드민 회원 상세 조회."""
    admin_user = db.query(AdminUser).filter(
        AdminUser.id == admin_user_id,
        AdminUser.deleted_at.is_(None)
    ).first()

    if not admin_user:
        raise HTTPException(status_code=404, detail="관리자를 찾을 수 없습니다.")

    return admin_user


@router.post("", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
def create_admin_user(
    body: AdminUserCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_roles(AdminRole.SUPERADMIN, AdminRole.ADMIN)),
):
    """어드민 — 어드민 회원 생성."""
    # 파트너 역할은 어드민을 생성할 수 없으며, 일반 admin은 superadmin을 생성할 수 없음.
    if current_admin.role == AdminRole.ADMIN and body.role == AdminRole.SUPERADMIN:
        raise HTTPException(status_code=403, detail="일반 관리자는 최고 관리자 계정을 생성할 수 없습니다.")

    # 중복 체크
    exists = db.query(AdminUser).filter(
        AdminUser.username == body.username,
        AdminUser.deleted_at.is_(None)
    ).first()
    if exists:
        raise HTTPException(status_code=409, detail="이미 사용 중인 아이디입니다.")

    new_admin = AdminUser(
        username=body.username,
        password_hash=hash_password(body.password),
        role=body.role,
        is_active=True
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin


@router.patch("/{admin_user_id}", response_model=AdminUserResponse)
def update_admin_user(
    admin_user_id: int,
    body: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_roles(AdminRole.SUPERADMIN, AdminRole.ADMIN)),
):
    """어드민 — 어드민 회원 수정."""
    admin_user = db.query(AdminUser).filter(
        AdminUser.id == admin_user_id,
        AdminUser.deleted_at.is_(None)
    ).first()

    if not admin_user:
        raise HTTPException(status_code=404, detail="관리자를 찾을 수 없습니다.")

    # 권한 체크: 일반 admin은 다른 admin/superadmin의 역할을 편집하거나 강등할 수 없음.
    if current_admin.role == AdminRole.ADMIN:
        if admin_user.role == AdminRole.SUPERADMIN:
            raise HTTPException(status_code=403, detail="최고 관리자의 정보는 일반 관리자가 변경할 수 없습니다.")
        if body.role == AdminRole.SUPERADMIN:
            raise HTTPException(status_code=403, detail="일반 관리자는 다른 계정을 최고 관리자로 등급을 올릴 수 없습니다.")

    # 마지막 superadmin 검증
    will_demote_or_deactivate = False
    if body.is_active is False and admin_user.is_active:
        will_demote_or_deactivate = True
    if body.role and body.role != AdminRole.SUPERADMIN and admin_user.role == AdminRole.SUPERADMIN:
        will_demote_or_deactivate = True

    check_last_superadmin(db, admin_user_id, will_demote_or_deactivate)

    if body.role is not None:
        admin_user.role = body.role
    if body.is_active is not None:
        admin_user.is_active = body.is_active
    if body.password is not None:
        admin_user.password_hash = hash_password(body.password)

    db.commit()
    db.refresh(admin_user)
    return admin_user


@router.delete("/{admin_user_id}", response_model=AdminUserResponse)
def delete_admin_user(
    admin_user_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_roles(AdminRole.SUPERADMIN, AdminRole.ADMIN)),
):
    """어드민 — 어드민 회원 소프트 삭제."""
    admin_user = db.query(AdminUser).filter(
        AdminUser.id == admin_user_id,
        AdminUser.deleted_at.is_(None)
    ).first()

    if not admin_user:
        raise HTTPException(status_code=404, detail="관리자를 찾을 수 없습니다.")

    # 권한 체크
    if current_admin.role == AdminRole.ADMIN and admin_user.role == AdminRole.SUPERADMIN:
        raise HTTPException(status_code=403, detail="최고 관리자 계정은 일반 관리자가 삭제할 수 없습니다.")

    # 마지막 superadmin 검증
    check_last_superadmin(db, admin_user_id, will_demote_or_deactivate=True)

    admin_user.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(admin_user)
    return admin_user
