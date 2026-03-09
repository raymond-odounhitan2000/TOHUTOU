from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationType


async def create_notification(
    db: AsyncSession,
    user_id: int,
    type: NotificationType,
    title: str,
    message: str,
    reference_id: int | None = None,
    reference_type: str | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        reference_id=reference_id,
        reference_type=reference_type,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification
