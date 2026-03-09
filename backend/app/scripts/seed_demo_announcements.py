from __future__ import annotations

import argparse
import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select

from app.database import async_session
from app.models.announcement import Announcement, AnnouncementStatus
from app.models.user import User, UserRole

VARIETIES = [
    "Pain de sucre",
    "Cayenne lisse",
    "MD2",
]

MATURITY = ["Vert", "Mi-mur", "Mur"]
IMAGE_POOL = [
    "https://upload.wikimedia.org/wikipedia/commons/f/f3/Pineapple_market%2C_Jalchatra%2C_Tangail.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/7/79/Jalchatra_pineapple_market_%285%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/c/c0/Vazhakkulam_Pineapple_Market_DSC02653.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/84/Vazhakkulam_Pineapple_Market_DSC02655.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/55/Puerto_Rico_-_Pineapple_field.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/6b/Pineapple_fields_in_Cuba.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/da/Ghana_pineapple_field.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/97/Pineapple_field_in_an_FPO_in_Nagaland.jpg",
]


def _random_quantity() -> Decimal:
    value = random.randrange(300, 6200)
    return Decimal(value).quantize(Decimal("0.01"))


def _random_price() -> Decimal:
    value = random.randrange(80000, 1800000)
    return Decimal(value).quantize(Decimal("0.01"))


def _pick_image(index: int) -> str:
    return IMAGE_POOL[index % len(IMAGE_POOL)]


async def seed_demo_announcements(count: int, approved_ratio: float) -> int:
    async with async_session() as db:
        users_result = await db.execute(
            select(User)
            .where(User.role == UserRole.PRODUCER, User.is_active.is_(True))
            .order_by(User.id.asc())
        )
        producers = users_result.scalars().all()
        if not producers:
            print("Aucun producteur actif trouve. Creer un compte producteur puis relancer.")
            return 0

        created = 0
        for i in range(count):
            producer = producers[i % len(producers)]
            now = datetime.now(timezone.utc)
            harvest_date = now + timedelta(days=random.randint(1, 21))
            status = (
                AnnouncementStatus.APPROVED
                if random.random() <= approved_ratio
                else AnnouncementStatus.PENDING
            )
            announcement = Announcement(
                producer_id=producer.id,
                variety=random.choice(VARIETIES),
                quantity=_random_quantity(),
                price=_random_price(),
                maturity=random.choice(MATURITY),
                photo_url=_pick_image(i),
                harvest_date=harvest_date,
                status=status,
            )
            db.add(announcement)
            created += 1

        await db.commit()
        return created


async def backfill_missing_photos(limit: int | None = None) -> int:
    async with async_session() as db:
        query = (
            select(Announcement)
            .where((Announcement.photo_url.is_(None)) | (Announcement.photo_url == ""))
            .order_by(Announcement.created_at.desc(), Announcement.id.desc())
        )
        if limit is not None:
            query = query.limit(limit)

        announcements = (await db.execute(query)).scalars().all()
        if not announcements:
            return 0

        for index, announcement in enumerate(announcements):
            announcement.photo_url = _pick_image(index)

        await db.commit()
        return len(announcements)


async def replace_pexels_photos(limit: int | None = None) -> int:
    async with async_session() as db:
        query = (
            select(Announcement)
            .where(Announcement.photo_url.like("%pexels.com%"))
            .order_by(Announcement.created_at.desc(), Announcement.id.desc())
        )
        if limit is not None:
            query = query.limit(limit)

        announcements = (await db.execute(query)).scalars().all()
        if not announcements:
            return 0

        for index, announcement in enumerate(announcements):
            announcement.photo_url = _pick_image(index)

        await db.commit()
        return len(announcements)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed demo announcements for TOHUTOU.")
    parser.add_argument(
        "--count",
        type=int,
        default=14,
        help="Number of announcements to create (default: 14).",
    )
    parser.add_argument(
        "--approved-ratio",
        type=float,
        default=0.8,
        help="Ratio of approved announcements between 0 and 1 (default: 0.8).",
    )
    parser.add_argument(
        "--backfill-missing",
        action="store_true",
        help="Attach online images to announcements that have no photo_url.",
    )
    parser.add_argument(
        "--backfill-limit",
        type=int,
        default=0,
        help="Limit number of existing announcements to backfill (0 = no limit).",
    )
    parser.add_argument(
        "--replace-pexels",
        action="store_true",
        help="Replace announcement photos currently using pexels.com with Wikimedia pineapple images.",
    )
    parser.add_argument(
        "--replace-pexels-limit",
        type=int,
        default=0,
        help="Limit number of pexels photo replacements (0 = no limit).",
    )
    return parser.parse_args()


async def _run() -> None:
    args = parse_args()
    count = max(0, args.count)
    approved_ratio = min(1.0, max(0.0, args.approved_ratio))
    created = await seed_demo_announcements(count=count, approved_ratio=approved_ratio)
    updated = 0
    replaced = 0
    if args.backfill_missing:
        limit = None if args.backfill_limit <= 0 else args.backfill_limit
        updated = await backfill_missing_photos(limit=limit)
    if args.replace_pexels:
        limit = None if args.replace_pexels_limit <= 0 else args.replace_pexels_limit
        replaced = await replace_pexels_photos(limit=limit)
    print(f"{created} annonces de demo creees.")
    if args.backfill_missing:
        print(f"{updated} annonces existantes mises a jour avec une image.")
    if args.replace_pexels:
        print(f"{replaced} annonces pexels remplacees par des images Wikimedia.")


if __name__ == "__main__":
    import asyncio

    asyncio.run(_run())
