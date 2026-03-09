from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import is_super_admin, require_role
from app.database import get_db
from app.models.cooperative import Cooperative
from app.models.user import User, UserRole
from app.schemas.cooperative import CooperativeCreate, CooperativeResponse, CooperativeUpdate

router = APIRouter(prefix="/cooperatives", tags=["Cooperatives"])


@router.get("", response_model=list[CooperativeResponse])
async def list_cooperatives(
    organization_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Cooperative)
    if organization_id:
        query = query.where(Cooperative.organization_id == organization_id)
    result = await db.execute(query.order_by(Cooperative.name))
    return result.scalars().all()


@router.get("/{coop_id}", response_model=CooperativeResponse)
async def get_cooperative(coop_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cooperative).where(Cooperative.id == coop_id))
    coop = result.scalar_one_or_none()
    if not coop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coopérative introuvable")
    return coop


@router.post("", response_model=CooperativeResponse, status_code=201)
async def create_cooperative(
    data: CooperativeCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    if not is_super_admin(current_user):
        if current_user.organization_id != data.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès non autorisé pour cette organisation",
            )

    coop = Cooperative(**data.model_dump())
    db.add(coop)
    await db.commit()
    await db.refresh(coop)
    return coop


@router.put("/{coop_id}", response_model=CooperativeResponse)
async def update_cooperative(
    coop_id: int,
    data: CooperativeUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Cooperative).where(Cooperative.id == coop_id))
    coop = result.scalar_one_or_none()
    if not coop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coopérative introuvable")

    is_global_admin = is_super_admin(current_user)
    if not is_global_admin and current_user.organization_id != coop.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé pour cette coopérative",
        )

    updates = data.model_dump(exclude_unset=True)
    if not is_global_admin and "organization_id" in updates:
        if updates["organization_id"] != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez pas déplacer la coopérative vers une autre organisation",
            )

    for field, value in updates.items():
        setattr(coop, field, value)
    await db.commit()
    await db.refresh(coop)
    return coop


@router.delete("/{coop_id}", status_code=204)
async def delete_cooperative(
    coop_id: int,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Cooperative).where(Cooperative.id == coop_id))
    coop = result.scalar_one_or_none()
    if not coop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coopérative introuvable")

    if not is_super_admin(current_user) and current_user.organization_id != coop.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé pour cette coopérative",
        )

    await db.delete(coop)
    await db.commit()
