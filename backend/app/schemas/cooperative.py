from datetime import datetime

from pydantic import BaseModel


class CooperativeCreate(BaseModel):
    name: str
    organization_id: int
    description: str | None = None


class CooperativeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class CooperativeResponse(BaseModel):
    id: int
    name: str
    organization_id: int
    description: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
