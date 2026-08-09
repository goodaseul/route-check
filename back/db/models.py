from datetime import datetime
import enum
from typing import Optional
from sqlalchemy import Boolean, DateTime, Enum, Integer, String, func, UniqueConstraint, BigInteger, Numeric, Text, Float
from sqlalchemy.orm import Mapped, mapped_column
from db.database import Base


class AdminRole(str, enum.Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    PARTNER = "partner"


class AdminUser(Base):
    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[AdminRole] = mapped_column(
        Enum(AdminRole, native_enum=False, length=20),
        nullable=False,
        default=AdminRole.ADMIN
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("auth_provider", "provider_user_id", name="uq_users_provider_user_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    nickname: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    profile_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    auth_provider: Mapped[str] = mapped_column(String(20), nullable=False)  # "google" | "naver"
    provider_user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class PlacesCache(Base):
    __tablename__ = "places_cache"

    contentid: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    contenttypeid: Mapped[str] = mapped_column(String(10), nullable=False)
    contenttypename: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    areacode: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    sigungucode: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    mapx: Mapped[float] = mapped_column(Float, nullable=False)  # 경도
    mapy: Mapped[float] = mapped_column(Float, nullable=False)  # 위도
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    overview: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RouteDistanceCache(Base):
    __tablename__ = "route_distance_cache"
    __table_args__ = (
        UniqueConstraint(
            "origin_lat_grid", "origin_lon_grid",
            "dest_lat_grid", "dest_lon_grid",
            "transport_mode",
            name="uq_route_cache_lookup"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    origin_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    destination_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)

    # 4 decimal places rounding for coordinates cache matching
    origin_lat_grid: Mapped[float] = mapped_column(Numeric(8, 4), nullable=False)
    origin_lon_grid: Mapped[float] = mapped_column(Numeric(8, 4), nullable=False)
    dest_lat_grid: Mapped[float] = mapped_column(Numeric(8, 4), nullable=False)
    dest_lon_grid: Mapped[float] = mapped_column(Numeric(8, 4), nullable=False)

    transport_mode: Mapped[str] = mapped_column(String(20), nullable=False)  # 'car', 'public', 'walk', 'taxi'

    distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_fare: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

