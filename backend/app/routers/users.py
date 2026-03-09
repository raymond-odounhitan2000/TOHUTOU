from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_current_user,
    is_org_admin,
    is_super_admin,
    require_role,
)
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserRoleUpdate, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("", response_model=list[UserResponse])
async def list_users(
    role: UserRole | None = None,
    cooperative_id: int | None = None,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)

    if is_super_admin(current_user):
        pass
    elif is_org_admin(current_user):
        query = query.where(User.organization_id == current_user.organization_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé",
        )

    if role:
        query = query.where(User.role == role)
    if cooperative_id:
        query = query.where(User.cooperative_id == cooperative_id)
    result = await db.execute(query.order_by(User.created_at.desc()))
    return result.scalars().all()


@router.put("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    data: UserRoleUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

    if is_super_admin(current_user):
        pass
    elif is_org_admin(current_user):
        if user.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez modifier que les utilisateurs de votre organisation",
            )
        if user.role == UserRole.ADMIN or data.role == UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seul le super admin peut attribuer ou modifier le rôle admin",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé",
        )

    if data.role == UserRole.DELEGATE and not user.cooperative_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un délégué doit être rattaché à une coopérative",
        )

    user.role = data.role
    await db.commit()
    await db.refresh(user)
    return user
