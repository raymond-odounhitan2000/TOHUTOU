from datetime import datetime

from pydantic import BaseModel

from app.models.user import UserRole


class UserRegister(BaseModel):
    first_name: str
    last_name: str
    phone: str
    password: str
    role: UserRole = UserRole.BUYER
    organization_id: int | None = None
    cooperative_id: int | None = None
    member_number: str | None = None


class UserLogin(BaseModel):
    phone: str
    password: str


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    email: str | None = None


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: str
    email: str | None
    role: UserRole
    organization_id: int | None
    cooperative_id: int | None
    member_number: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
