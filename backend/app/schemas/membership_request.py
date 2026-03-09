from datetime import datetime

from pydantic import BaseModel

from app.models.membership_request import RequestStatus


class MembershipRequestCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    organization_id: int
    cooperative_id: int


class MembershipRequestStatusUpdate(BaseModel):
    status: RequestStatus


class MembershipRequestResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: str
    organization_id: int
    cooperative_id: int
    status: RequestStatus
    created_at: datetime

    model_config = {"from_attributes": True}
