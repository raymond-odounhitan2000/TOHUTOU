from datetime import datetime

from pydantic import BaseModel


class UserBrief(BaseModel):
    id: int
    first_name: str
    last_name: str
    role: str

    model_config = {"from_attributes": True}


class ConversationCreate(BaseModel):
    participant_id: int
    announcement_id: int | None = None
    initial_message: str


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: int
    participant_1_id: int
    participant_2_id: int
    announcement_id: int | None
    last_message_at: datetime | None
    created_at: datetime
    other_participant: UserBrief
    last_message_preview: str | None
    unread_count: int

    model_config = {"from_attributes": True}
