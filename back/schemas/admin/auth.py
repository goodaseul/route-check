from pydantic import BaseModel, ConfigDict, Field
from schemas.admin.user import AdminUserResponse


class AdminLoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=128)

    model_config = ConfigDict(extra="forbid")


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_user: AdminUserResponse


class AdminSessionResponse(BaseModel):
    admin_user: AdminUserResponse
