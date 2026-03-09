from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select

from app.config import settings
from app.core.security import hash_password
from app.database import async_session
from app.models.cooperative import Cooperative
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.routers import (
    announcements,
    auth,
    conversations,
    cooperatives,
    membership_requests,
    notifications,
    organizations,
    stats,
    upload,
    users,
)

# ── Seed data ────────────────────────────────────────────────────────────

SEED_ORGS = [
    {
        "name": "Union AgriNova Atlantique",
        "slug": "fenacopab",
        "description": "Organisation fictive de demonstration pour la filiere ananas.",
        "cooperative_prefix": "AgriNova",
        "cooperative_count": 22,
    },
    {
        "name": "Reseau TropiMarche Benin",
        "slug": "repab",
        "description": "Reseau fictif de producteurs et acheteurs pilotes.",
        "cooperative_prefix": "TropiMarche",
        "cooperative_count": 19,
    },
    {
        "name": "Federation NovaTransfo",
        "slug": "fenacotrab",
        "description": "Federation fictive orientee transformation et conditionnement.",
        "cooperative_prefix": "NovaTransfo",
        "cooperative_count": 0,
    },
    {
        "name": "Alliance Interpro Ananas Plus",
        "slug": "aiab",
        "description": "Alliance fictive pour la coordination interprofessionnelle.",
        "cooperative_prefix": "InterproPlus",
        "cooperative_count": 0,
    },
    {
        "name": "Association Export Horizon",
        "slug": "aneab",
        "description": "Association fictive dediee aux flux export et qualite.",
        "cooperative_prefix": "ExportHorizon",
        "cooperative_count": 0,
    },
    {
        "name": "Federation Delta Agro",
        "slug": "fgiea",
        "description": "Federation fictive de groupements economiques agricoles.",
        "cooperative_prefix": "DeltaAgro",
        "cooperative_count": 0,
    },
    {
        "name": "Collectif Fruitivo",
        "slug": "apfb",
        "description": "Collectif fictif de producteurs multi-fruits.",
        "cooperative_prefix": "Fruitivo",
        "cooperative_count": 0,
    },
    {
        "name": "Union SudVerte",
        "slug": "ups-benin",
        "description": "Union fictive de producteurs du sud.",
        "cooperative_prefix": "SudVerte",
        "cooperative_count": 0,
    },
    {
        "name": "Reseau Coop NovaBio",
        "slug": "recab",
        "description": "Reseau fictif de cooperatives orientees agriculture durable.",
        "cooperative_prefix": "NovaBio",
        "cooperative_count": 0,
    },
]


async def seed_admin():
    if not settings.ADMIN_PHONE or not settings.ADMIN_PASSWORD:
        return
    async with async_session() as db:
        result = await db.execute(select(User).where(User.phone == settings.ADMIN_PHONE))
        if result.scalar_one_or_none():
            return
        admin = User(
            first_name=settings.ADMIN_FIRST_NAME,
            last_name=settings.ADMIN_LAST_NAME,
            phone=settings.ADMIN_PHONE,
            password_hash=hash_password(settings.ADMIN_PASSWORD),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        print(f"Super admin créé : {settings.ADMIN_PHONE}")


async def seed_organizations():
    async with async_session() as db:
        count = await db.execute(select(func.count()).select_from(Organization))
        if count.scalar() > 0:
            return

        for org_data in SEED_ORGS:
            org = Organization(
                name=org_data["name"],
                slug=org_data["slug"],
                description=org_data["description"],
            )
            db.add(org)
            await db.flush()

            for idx in range(1, org_data["cooperative_count"] + 1):
                coop_name = f"{org_data['cooperative_prefix']} Cooperative {idx:02d}"
                coop = Cooperative(
                    name=coop_name,
                    organization_id=org.id,
                    description=f"Cooperative fictive de demonstration ({org_data['cooperative_prefix']}).",
                )
                db.add(coop)

        await db.commit()
        print(f"Seed terminé : {len(SEED_ORGS)} organisations + coopératives")


def _org_password_from_slug(slug: str) -> str:
    abbr = "".join(ch for ch in slug.lower() if ch.isalnum())
    return f"{abbr}2026"


async def seed_organization_admins():
    base_prefix = "01431269"

    async with async_session() as db:
        orgs_result = await db.execute(select(Organization).order_by(Organization.id.asc()))
        organizations = orgs_result.scalars().all()

        created: list[tuple[str, str, str]] = []

        for idx, org in enumerate(organizations):
            phone = f"{base_prefix}{idx:02d}"

            existing_by_phone = await db.execute(select(User).where(User.phone == phone))
            if existing_by_phone.scalar_one_or_none():
                continue

            existing_org_admin = await db.execute(
                select(User).where(
                    User.organization_id == org.id,
                    User.role == UserRole.ADMIN,
                )
            )
            if existing_org_admin.scalar_one_or_none():
                continue

            password = _org_password_from_slug(org.slug)
            user = User(
                first_name="Admin",
                last_name=org.slug.upper(),
                phone=phone,
                password_hash=hash_password(password),
                role=UserRole.ADMIN,
                organization_id=org.id,
                is_active=True,
            )
            db.add(user)
            created.append((org.name, phone, password))

        if created:
            await db.commit()
            print("Admins organisations créés :")
            for org_name, phone, password in created:
                print(f"- {org_name}: {phone} / {password}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await seed_admin()
    await seed_organizations()
    await seed_organization_admins()
    yield


app = FastAPI(
    title="TOHUTOU API",
    description="API pour la plateforme de commercialisation d'ananas au Bénin",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = Path(__file__).resolve().parents[1] / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(organizations.router, prefix="/api")
app.include_router(cooperatives.router, prefix="/api")
app.include_router(announcements.router, prefix="/api")
app.include_router(membership_requests.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(upload.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
