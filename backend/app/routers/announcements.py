import math

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import DataError, SQLAlchemyError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_current_user,
    is_org_admin,
    is_super_admin,
    require_role,
)
from app.database import get_db
from app.models.announcement import Announcement, AnnouncementStatus
from app.models.notification import NotificationType
from app.models.user import User, UserRole
from app.schemas.announcement import (
    AnnouncementCreate,
    AnnouncementResponse,
    AnnouncementStatusUpdate,
    AnnouncementUpdate,
    PaginatedAnnouncements,
)
from app.services.notifications import create_notification
from app.services.storage import resolve_public_url

router = APIRouter(prefix="/announcements", tags=["Announcements"])


def _with_resolved_photo(announcement: Announcement) -> Announcement:
    if announcement.photo_url:
        announcement.photo_url = resolve_public_url(announcement.photo_url)
    return announcement


@router.get("", response_model=PaginatedAnnouncements)
async def list_announcements(
    page: int = 1,
    size: int = 20,
    organization_id: int | None = None,
    cooperative_id: int | None = None,
    maturity: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Announcement).where(
        Announcement.status.in_([AnnouncementStatus.APPROVED, AnnouncementStatus.PENDING])
    )

    if organization_id:
        query = query.join(User, Announcement.producer_id == User.id).where(
            User.organization_id == organization_id
        )
    if cooperative_id:
        if not organization_id:
            query = query.join(User, Announcement.producer_id == User.id)
        query = query.where(User.cooperative_id == cooperative_id)
    if maturity:
        query = query.where(Announcement.maturity == maturity)
    if min_price is not None:
        query = query.where(Announcement.price >= min_price)
    if max_price is not None:
        query = query.where(Announcement.price <= max_price)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    offset = (page - 1) * size
    result = await db.execute(
        query.order_by(Announcement.created_at.desc()).offset(offset).limit(size)
    )
    items = [_with_resolved_photo(item) for item in result.scalars().all()]

    return PaginatedAnnouncements(
        items=items,
        total=total,
        page=page,
        pages=math.ceil(total / size) if size > 0 else 0,
    )


@router.get("/my", response_model=list[AnnouncementResponse])
async def my_announcements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Announcement)
        .where(Announcement.producer_id == current_user.id)
        .order_by(Announcement.created_at.desc())
    )
    return [_with_resolved_photo(item) for item in result.scalars().all()]


@router.get("/pending", response_model=list[AnnouncementResponse])
async def pending_announcements(
    current_user: User = Depends(require_role(UserRole.DELEGATE, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Announcement)
        .join(User, Announcement.producer_id == User.id)
        .where(Announcement.status == AnnouncementStatus.PENDING)
    )

    if current_user.role == UserRole.DELEGATE:
        if not current_user.cooperative_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Délégué sans coopérative assignée",
            )
        query = query.where(User.cooperative_id == current_user.cooperative_id)
    elif current_user.role == UserRole.ADMIN:
        if is_super_admin(current_user):
            pass
        elif is_org_admin(current_user):
            query = query.where(User.organization_id == current_user.organization_id)
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès non autorisé",
            )

    result = await db.execute(query.order_by(Announcement.created_at.asc()))
    return [_with_resolved_photo(item) for item in result.scalars().all()]


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
async def get_announcement(announcement_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id)
    )
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Annonce introuvable")
    return _with_resolved_photo(ann)


@router.post("", response_model=AnnouncementResponse, status_code=201)
async def create_announcement(
    data: AnnouncementCreate,
    current_user: User = Depends(require_role(UserRole.PRODUCER)),
    db: AsyncSession = Depends(get_db),
):
    delegates: list[User] = []
    org_admins: list[User] = []

    if current_user.cooperative_id:
        delegates_result = await db.execute(
            select(User).where(
                User.cooperative_id == current_user.cooperative_id,
                User.role == UserRole.DELEGATE,
                User.is_active.is_(True),
            )
        )
        delegates = delegates_result.scalars().all()

    if current_user.organization_id:
        org_admins_result = await db.execute(
            select(User).where(
                User.organization_id == current_user.organization_id,
                User.role == UserRole.ADMIN,
                User.is_active.is_(True),
            )
        )
        org_admins = org_admins_result.scalars().all()

    should_require_validation = bool(
        current_user.organization_id and (delegates or org_admins)
    )
    initial_status = (
        AnnouncementStatus.PENDING if should_require_validation else AnnouncementStatus.APPROVED
    )

    ann = Announcement(
        producer_id=current_user.id,
        status=initial_status,
        **data.model_dump(),
    )
    db.add(ann)
    try:
        await db.commit()
    except DataError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valeurs invalides pour le prix ou la quantite (max 999 999 999 999,99).",
        )
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la creation de l'annonce.",
        )

    await db.refresh(ann)

    # Notify scoped validators when announcement requires validation
    if ann.status == AnnouncementStatus.PENDING:
        recipients = {user.id: user for user in [*delegates, *org_admins]}
        for delegate in recipients.values():
            try:
                await create_notification(
                    db=db,
                    user_id=delegate.id,
                    type=NotificationType.NEW_ANNOUNCEMENT_PENDING,
                    title="Nouvelle annonce en attente",
                    message=f"{current_user.first_name} {current_user.last_name} a publié une annonce à valider.",
                    reference_id=ann.id,
                    reference_type="announcement",
                )
            except SQLAlchemyError:
                await db.rollback()

    return _with_resolved_photo(ann)


@router.put("/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(
    announcement_id: int,
    data: AnnouncementUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id)
    )
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Annonce introuvable")
    if ann.producer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non autorisé")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(ann, field, value)
    await db.commit()
    await db.refresh(ann)
    return _with_resolved_photo(ann)


@router.delete("/{announcement_id}", status_code=204)
async def delete_announcement(
    announcement_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id)
    )
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Annonce introuvable")
    if ann.producer_id != current_user.id:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non autorisé")
        if not is_super_admin(current_user):
            producer_result = await db.execute(select(User).where(User.id == ann.producer_id))
            producer = producer_result.scalar_one_or_none()
            if not producer or producer.organization_id != current_user.organization_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non autorisé")

    await db.delete(ann)
    await db.commit()


@router.put("/{announcement_id}/status", response_model=AnnouncementResponse)
async def update_announcement_status(
    announcement_id: int,
    data: AnnouncementStatusUpdate,
    current_user: User = Depends(require_role(UserRole.DELEGATE, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id)
    )
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Annonce introuvable")

    producer_result = await db.execute(select(User).where(User.id == ann.producer_id))
    producer = producer_result.scalar_one()
    if current_user.role == UserRole.DELEGATE:
        if producer.cooperative_id != current_user.cooperative_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cette annonce n'appartient pas à votre coopérative",
            )
    elif current_user.role == UserRole.ADMIN:
        if is_super_admin(current_user):
            pass
        elif is_org_admin(current_user):
            if producer.organization_id != current_user.organization_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cette annonce n'appartient pas à votre organisation",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès non autorisé",
            )

    ann.status = data.status
    if data.rejection_reason:
        ann.rejection_reason = data.rejection_reason
    await db.commit()
    await db.refresh(ann)

    # Notify the producer about approval/rejection
    if data.status == AnnouncementStatus.APPROVED:
        await create_notification(
            db=db,
            user_id=ann.producer_id,
            type=NotificationType.ANNOUNCEMENT_APPROVED,
            title="Annonce approuvée",
            message=f"Votre annonce \"{ann.variety}\" a été approuvée.",
            reference_id=ann.id,
            reference_type="announcement",
        )
    elif data.status == AnnouncementStatus.REJECTED:
        reason = data.rejection_reason or "Aucune raison fournie"
        await create_notification(
            db=db,
            user_id=ann.producer_id,
            type=NotificationType.ANNOUNCEMENT_REJECTED,
            title="Annonce rejetée",
            message=f"Votre annonce \"{ann.variety}\" a été rejetée. Raison : {reason}",
            reference_id=ann.id,
            reference_type="announcement",
        )

    return _with_resolved_photo(ann)


@router.put("/{announcement_id}/sold", response_model=AnnouncementResponse)
async def mark_as_sold(
    announcement_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id)
    )
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Annonce introuvable")
    if ann.producer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non autorisé")
    if ann.status != AnnouncementStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seule une annonce approuvée peut être marquée comme vendue",
        )
    ann.status = AnnouncementStatus.SOLD
    await db.commit()
    await db.refresh(ann)
    return _with_resolved_photo(ann)
