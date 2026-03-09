from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    is_org_admin,
    is_super_admin,
    require_role,
)
from app.database import get_db
from app.models.cooperative import Cooperative
from app.models.membership_request import MembershipRequest, RequestStatus
from app.models.notification import NotificationType
from app.models.user import User, UserRole
from app.schemas.membership_request import (
    MembershipRequestCreate,
    MembershipRequestResponse,
    MembershipRequestStatusUpdate,
)
from app.services.notifications import create_notification

router = APIRouter(prefix="/membership-requests", tags=["Membership Requests"])


@router.post("", response_model=MembershipRequestResponse, status_code=201)
async def create_request(
    data: MembershipRequestCreate,
    db: AsyncSession = Depends(get_db),
):
    coop_result = await db.execute(
        select(Cooperative).where(Cooperative.id == data.cooperative_id)
    )
    coop = coop_result.scalar_one_or_none()
    if not coop or coop.organization_id != data.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La coopérative ne correspond pas à l'organisation sélectionnée",
        )

    req = MembershipRequest(**data.model_dump())
    db.add(req)
    await db.commit()
    await db.refresh(req)

    # Notify scoped validators:
    # - delegates of the target cooperative
    # - admin of the target organization
    # - super admin (global admin account)
    admins_delegates = await db.execute(
        select(User).where(
            or_(
                (User.role == UserRole.DELEGATE) & (User.cooperative_id == req.cooperative_id),
                (User.role == UserRole.ADMIN)
                & (
                    (User.organization_id == req.organization_id)
                    | (User.organization_id.is_(None))
                ),
            ),
            User.is_active.is_(True),
        )
    )
    for user in admins_delegates.scalars().all():
        await create_notification(
            db=db,
            user_id=user.id,
            type=NotificationType.NEW_MEMBERSHIP_REQUEST,
            title="Nouvelle demande d'adhésion",
            message=f"{req.first_name} {req.last_name} souhaite rejoindre la plateforme.",
            reference_id=req.id,
            reference_type="membership_request",
        )

    return req


@router.get("", response_model=list[MembershipRequestResponse])
async def list_requests(
    status_filter: RequestStatus | None = None,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.DELEGATE)),
    db: AsyncSession = Depends(get_db),
):
    query = select(MembershipRequest)

    if is_super_admin(current_user):
        pass
    elif current_user.role == UserRole.DELEGATE:
        if not current_user.cooperative_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Délégué sans coopérative assignée",
            )
        query = query.where(MembershipRequest.cooperative_id == current_user.cooperative_id)
    elif is_org_admin(current_user):
        query = query.where(MembershipRequest.organization_id == current_user.organization_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé",
        )

    if status_filter:
        query = query.where(MembershipRequest.status == status_filter)
    result = await db.execute(query.order_by(MembershipRequest.created_at.desc()))
    return result.scalars().all()


@router.put("/{request_id}", response_model=MembershipRequestResponse)
async def update_request_status(
    request_id: int,
    data: MembershipRequestStatusUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.DELEGATE)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MembershipRequest).where(MembershipRequest.id == request_id)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Demande introuvable"
        )

    if is_super_admin(current_user):
        pass
    elif current_user.role == UserRole.DELEGATE:
        if req.cooperative_id != current_user.cooperative_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cette demande n'appartient pas à votre coopérative",
            )
    elif is_org_admin(current_user):
        if req.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cette demande n'appartient pas à votre organisation",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé",
        )

    req.status = data.status
    await db.commit()
    await db.refresh(req)
    return req
