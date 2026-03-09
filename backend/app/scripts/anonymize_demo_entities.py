from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.database import async_session
from app.models.cooperative import Cooperative
from app.models.organization import Organization
from app.models.user import User, UserRole

FICTIONAL_BY_SLUG = {
    "fenacopab": {
        "name": "Union AgriNova Atlantique",
        "description": "Organisation fictive de demonstration pour la filiere ananas.",
        "cooperative_prefix": "AgriNova",
        "admin_tag": "AGRINOVA",
    },
    "repab": {
        "name": "Reseau TropiMarche Benin",
        "description": "Reseau fictif de producteurs et acheteurs pilotes.",
        "cooperative_prefix": "TropiMarche",
        "admin_tag": "TROPIMARCHE",
    },
    "fenacotrab": {
        "name": "Federation NovaTransfo",
        "description": "Federation fictive orientee transformation et conditionnement.",
        "cooperative_prefix": "NovaTransfo",
        "admin_tag": "NOVATRANSFO",
    },
    "aiab": {
        "name": "Alliance Interpro Ananas Plus",
        "description": "Alliance fictive pour la coordination interprofessionnelle.",
        "cooperative_prefix": "InterproPlus",
        "admin_tag": "INTERPRO",
    },
    "aneab": {
        "name": "Association Export Horizon",
        "description": "Association fictive dediee aux flux export et qualite.",
        "cooperative_prefix": "ExportHorizon",
        "admin_tag": "EXPORTHZN",
    },
    "fgiea": {
        "name": "Federation Delta Agro",
        "description": "Federation fictive de groupements economiques agricoles.",
        "cooperative_prefix": "DeltaAgro",
        "admin_tag": "DELTAAGRO",
    },
    "apfb": {
        "name": "Collectif Fruitivo",
        "description": "Collectif fictif de producteurs multi-fruits.",
        "cooperative_prefix": "Fruitivo",
        "admin_tag": "FRUITIVO",
    },
    "ups-benin": {
        "name": "Union SudVerte",
        "description": "Union fictive de producteurs du sud.",
        "cooperative_prefix": "SudVerte",
        "admin_tag": "SUDVERTE",
    },
    "recab": {
        "name": "Reseau Coop NovaBio",
        "description": "Reseau fictif de cooperatives orientees agriculture durable.",
        "cooperative_prefix": "NovaBio",
        "admin_tag": "NOVABIO",
    },
}


async def anonymize_entities() -> tuple[int, int, int]:
    async with async_session() as db:
        orgs = (await db.execute(select(Organization).order_by(Organization.id.asc()))).scalars().all()

        updated_orgs = 0
        updated_coops = 0
        updated_admins = 0

        for org in orgs:
            data = FICTIONAL_BY_SLUG.get(org.slug)
            if not data:
                continue

            org.name = data["name"]
            org.description = data["description"]
            updated_orgs += 1

            coops = (
                await db.execute(
                    select(Cooperative)
                    .where(Cooperative.organization_id == org.id)
                    .order_by(Cooperative.id.asc())
                )
            ).scalars().all()

            for idx, coop in enumerate(coops, start=1):
                coop.name = f"{data['cooperative_prefix']} Cooperative {idx:02d}"
                coop.description = (
                    f"Cooperative fictive de demonstration ({data['cooperative_prefix']})."
                )
                updated_coops += 1

            admins = (
                await db.execute(
                    select(User).where(
                        User.organization_id == org.id,
                        User.role == UserRole.ADMIN,
                    )
                )
            ).scalars().all()

            for idx, admin in enumerate(admins, start=1):
                admin.first_name = "Admin"
                admin.last_name = f"{data['admin_tag']}{idx:02d}"
                updated_admins += 1

        await db.commit()
        return updated_orgs, updated_coops, updated_admins


async def _run() -> None:
    orgs, coops, admins = await anonymize_entities()
    print(f"Organisations mises a jour: {orgs}")
    print(f"Cooperatives mises a jour: {coops}")
    print(f"Admins organisation mis a jour: {admins}")


if __name__ == "__main__":
    asyncio.run(_run())

