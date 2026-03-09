from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_current_user,
    is_super_admin,
    require_role,
    require_super_admin,
)
from app.database import get_db
from app.models.announcement import Announcement, AnnouncementStatus
from app.models.cooperative import Cooperative
from app.models.membership_request import MembershipRequest, RequestStatus
from app.models.organization import Organization
from app.models.user import User, UserRole

router = APIRouter(prefix="/stats", tags=["Statistics"])


@router.get("/admin")
async def admin_stats(
    _super_admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    users_count = await db.execute(select(func.count(User.id)))
    orgs_count = await db.execute(select(func.count(Organization.id)))
    coops_count = await db.execute(select(func.count(Cooperative.id)))
    announcements_count = await db.execute(select(func.count(Announcement.id)))
    pending_requests = await db.execute(
        select(func.count(MembershipRequest.id)).where(
            MembershipRequest.status == RequestStatus.PENDING
        )
    )

    return {
        "total_users": users_count.scalar() or 0,
        "total_organizations": orgs_count.scalar() or 0,
        "total_cooperatives": coops_count.scalar() or 0,
        "total_announcements": announcements_count.scalar() or 0,
        "pending_membership_requests": pending_requests.scalar() or 0,
    }


@router.get("/delegate")
async def delegate_stats(
    delegate: User = Depends(require_role(UserRole.DELEGATE)),
    db: AsyncSession = Depends(get_db),
):
    coop_members = await db.execute(
        select(func.count(User.id)).where(User.cooperative_id == delegate.cooperative_id)
    )
    pending_announcements = await db.execute(
        select(func.count(Announcement.id))
        .join(User, Announcement.producer_id == User.id)
        .where(
            Announcement.status == AnnouncementStatus.PENDING,
            User.cooperative_id == delegate.cooperative_id,
        )
    )
    approved_announcements = await db.execute(
        select(func.count(Announcement.id))
        .join(User, Announcement.producer_id == User.id)
        .where(
            Announcement.status == AnnouncementStatus.APPROVED,
            User.cooperative_id == delegate.cooperative_id,
        )
    )

    return {
        "cooperative_members": coop_members.scalar() or 0,
        "pending_announcements": pending_announcements.scalar() or 0,
        "approved_announcements": approved_announcements.scalar() or 0,
    }


@router.get("/organization/{org_id}")
async def organization_stats(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not is_super_admin(current_user) and current_user.organization_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé pour cette organisation",
        )

    members_count = await db.execute(
        select(func.count(User.id)).where(User.organization_id == org_id)
    )
    coops_count = await db.execute(
        select(func.count(Cooperative.id)).where(Cooperative.organization_id == org_id)
    )
    announcements_count = await db.execute(
        select(func.count(Announcement.id))
        .join(User, Announcement.producer_id == User.id)
        .where(User.organization_id == org_id)
    )
    approved_count = await db.execute(
        select(func.count(Announcement.id))
        .join(User, Announcement.producer_id == User.id)
        .where(
            User.organization_id == org_id,
            Announcement.status == AnnouncementStatus.APPROVED,
        )
    )
    pending_count = await db.execute(
        select(func.count(Announcement.id))
        .join(User, Announcement.producer_id == User.id)
        .where(
            User.organization_id == org_id,
            Announcement.status == AnnouncementStatus.PENDING,
        )
    )

    return {
        "total_members": members_count.scalar() or 0,
        "total_cooperatives": coops_count.scalar() or 0,
        "total_announcements": announcements_count.scalar() or 0,
        "approved_announcements": approved_count.scalar() or 0,
        "pending_announcements": pending_count.scalar() or 0,
    }
