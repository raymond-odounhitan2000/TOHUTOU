from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.announcement import AnnouncementStatus

MAX_NUMERIC_14_2 = Decimal("999999999999.99")


class AnnouncementCreate(BaseModel):
    variety: str = Field(min_length=1, max_length=100)
    quantity: Decimal = Field(gt=0, le=MAX_NUMERIC_14_2, max_digits=14, decimal_places=2)
    price: Decimal = Field(gt=0, le=MAX_NUMERIC_14_2, max_digits=14, decimal_places=2)
    maturity: str = Field(min_length=1, max_length=50)
    photo_url: str | None = Field(default=None, max_length=500)
    harvest_date: datetime | None = None


class AnnouncementUpdate(BaseModel):
    variety: str | None = Field(default=None, min_length=1, max_length=100)
    quantity: Decimal | None = Field(default=None, gt=0, le=MAX_NUMERIC_14_2, max_digits=14, decimal_places=2)
    price: Decimal | None = Field(default=None, gt=0, le=MAX_NUMERIC_14_2, max_digits=14, decimal_places=2)
    maturity: str | None = Field(default=None, min_length=1, max_length=50)
    photo_url: str | None = Field(default=None, max_length=500)
    harvest_date: datetime | None = None


class AnnouncementStatusUpdate(BaseModel):
    status: AnnouncementStatus
    rejection_reason: str | None = None


class AnnouncementResponse(BaseModel):
    id: int
    producer_id: int
    variety: str
    quantity: Decimal
    price: Decimal
    maturity: str
    photo_url: str | None
    harvest_date: datetime | None
    status: AnnouncementStatus
    rejection_reason: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedAnnouncements(BaseModel):
    items: list[AnnouncementResponse]
    total: int
    page: int
    pages: int
