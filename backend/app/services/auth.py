from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token
from app.models.cooperative import Cooperative
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.user import UserRegister, TokenResponse


async def register_user(db: AsyncSession, data: UserRegister) -> User:
    from fastapi import HTTPException, status

    if data.role in {UserRole.ADMIN, UserRole.DELEGATE}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Le rôle demandé n'est pas autorisé à l'inscription publique",
        )

    if data.role != UserRole.PRODUCER and data.cooperative_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les producteurs peuvent être rattachés à une coopérative",
        )

    if data.role == UserRole.PRODUCER:
        if not data.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un producteur doit sélectionner une organisation",
            )

        org_result = await db.execute(
            select(Organization).where(Organization.id == data.organization_id)
        )
        if not org_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organisation invalide",
            )

        coop_count_result = await db.execute(
            select(Cooperative).where(Cooperative.organization_id == data.organization_id)
        )
        org_has_coops = coop_count_result.scalars().first() is not None

        if org_has_coops and not data.cooperative_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cette organisation a des coopératives, veuillez en sélectionner une",
            )

        if data.cooperative_id:
            coop_result = await db.execute(
                select(Cooperative).where(Cooperative.id == data.cooperative_id)
            )
            coop = coop_result.scalar_one_or_none()
            if not coop:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Coopérative invalide",
                )
            if coop.organization_id != data.organization_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La coopérative ne correspond pas à l'organisation sélectionnée",
                )
    elif data.organization_id:
        org_result = await db.execute(
            select(Organization).where(Organization.id == data.organization_id)
        )
        if not org_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organisation invalide",
            )

    existing = await db.execute(select(User).where(User.phone == data.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce numéro de téléphone est déjà utilisé",
        )

    user = User(
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        password_hash=hash_password(data.password),
        role=data.role,
        organization_id=data.organization_id,
        cooperative_id=data.cooperative_id,
        member_number=data.member_number,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, phone: str, password: str) -> TokenResponse:
    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Téléphone ou mot de passe incorrect",
        )
    if not user.is_active:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé",
        )
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token)
