from datetime import datetime
from typing import List, Optional, Generic, TypeVar
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class UserResponse(BaseModel):
    id: int
    email: Optional[str] = None
    name: Optional[str] = None
    nickname: Optional[str] = None
    profile_image: Optional[str] = None
    auth_provider: str
    provider_user_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserSocialLoginRequest(BaseModel):
    auth_provider: str = Field(..., description="google | naver")
    provider_user_id: str = Field(..., description="플랫폼 고유 회원 ID")
    email: Optional[str] = Field(None, description="이메일")
    name: Optional[str] = Field(None, description="이름")
    nickname: Optional[str] = Field(None, description="닉네임")
    profile_image: Optional[str] = Field(None, description="프로필 이미지 URL")


class UserUpdateStatus(BaseModel):
    is_active: bool = Field(..., description="활성화 여부")


class UserPaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    page: int
    page_size: int
    total: int
    total_pages: int
