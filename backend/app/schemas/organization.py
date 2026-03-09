from datetime import datetime

from pydantic import BaseModel


class OrganizationCreate(BaseModel):
    name: str
    slug: str | None = None
    description: str | None = None
    logo_url: str | None = None
    primary_color: str | None = "#15803d"


class OrganizationUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    logo_url: str | None = None
    primary_color: str | None = None


class OrganizationResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    logo_url: str | None
    primary_color: str
    created_at: datetime

    model_config = {"from_attributes": True}
