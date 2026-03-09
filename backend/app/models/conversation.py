from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    participant_1_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    participant_2_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    announcement_id: Mapped[int | None] = mapped_column(
        ForeignKey("announcements.id"), nullable=True
    )
    last_message_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    participant_1: Mapped["User"] = relationship(
        foreign_keys=[participant_1_id]
    )
    participant_2: Mapped["User"] = relationship(
        foreign_keys=[participant_2_id]
    )
    announcement: Mapped["Announcement | None"] = relationship()
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation",
        order_by="Message.created_at.desc()",
    )
