"""expand_announcement_price_quantity_precision

Revision ID: 5e9f08a1f3a7
Revises: 26d3166e914a
Create Date: 2026-03-09 12:05:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5e9f08a1f3a7"
down_revision: Union[str, Sequence[str], None] = "26d3166e914a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        "announcements",
        "quantity",
        existing_type=sa.Numeric(precision=10, scale=2),
        type_=sa.Numeric(precision=14, scale=2),
        existing_nullable=False,
    )
    op.alter_column(
        "announcements",
        "price",
        existing_type=sa.Numeric(precision=10, scale=2),
        type_=sa.Numeric(precision=14, scale=2),
        existing_nullable=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        "announcements",
        "price",
        existing_type=sa.Numeric(precision=14, scale=2),
        type_=sa.Numeric(precision=10, scale=2),
        existing_nullable=False,
    )
    op.alter_column(
        "announcements",
        "quantity",
        existing_type=sa.Numeric(precision=14, scale=2),
        type_=sa.Numeric(precision=10, scale=2),
        existing_nullable=False,
    )
