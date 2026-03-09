import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class MembershipRequest(Base):
    __tablename__ = "membership_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(20))
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"))
    cooperative_id: Mapped[int] = mapped_column(ForeignKey("cooperatives.id"))
    status: Mapped[RequestStatus] = mapped_column(default=RequestStatus.PENDING)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    organization: Mapped["Organization"] = relationship()
    cooperative: Mapped["Cooperative"] = relationship()
