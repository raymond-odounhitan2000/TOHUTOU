from datetime import datetime

from pydantic import BaseModel

from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: NotificationType
    title: str
    message: str
    is_read: bool
    reference_id: int | None
    reference_type: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationCountResponse(BaseModel):
    unread_count: int
