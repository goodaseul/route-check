import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
import jwt
import bcrypt

JWT_ALGORITHM = "HS256"
DEFAULT_JWT_EXPIRE_HOURS = 8
ADMIN_SESSION_COOKIE = "route_check_admin_session"


def get_jwt_secret() -> str:
    # 디폴트 시크릿 키는 복잡한 기본 문자열 제공
    return os.environ.get("JWT_SECRET", "super-secret-jwt-key-for-route-check-admin-1234567890")


def get_jwt_expire_hours() -> int:
    return int(os.environ.get("JWT_EXPIRE_HOURS", str(DEFAULT_JWT_EXPIRE_HOURS)))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def create_access_token(
    *,
    subject_id: int,
    role: str,
    token_kind: str = "admin",
    expire_hours: int | None = None,
) -> str:
    secret = get_jwt_secret()
    expire = datetime.now(timezone.utc) + timedelta(hours=expire_hours or get_jwt_expire_hours())
    payload: Dict[str, Any] = {
        "sub": str(subject_id),
        "role": role,
        "kind": token_kind,
        "exp": expire,
    }
    return jwt.encode(payload, secret, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    secret = get_jwt_secret()
    return jwt.decode(token, secret, algorithms=[JWT_ALGORITHM])


def get_cookie_samesite() -> str:
    return os.environ.get("COOKIE_SAMESITE", "lax").lower()
