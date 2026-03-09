"""add_org_slug_branding

Revision ID: 3f7b333c550e
Revises: debc6f7c3278
Create Date: 2026-02-28 15:00:13.636880

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f7b333c550e'
down_revision: Union[str, Sequence[str], None] = 'debc6f7c3278'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Slug mapping for existing organizations
SLUG_MAP = {
    "FENACOPAB": "fenacopab",
    "RePAB": "repab",
    "FENACOTRAB": "fenacotrab",
    "AIAB": "aiab",
    "ANEAB": "aneab",
    "FGIEA": "fgiea",
    "APFB": "apfb",
    "UPS-Bénin": "ups-benin",
    "RECAB": "recab",
}


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Add columns as nullable first
    op.add_column('organizations', sa.Column('slug', sa.String(length=100), nullable=True))
    op.add_column('organizations', sa.Column('logo_url', sa.String(length=500), nullable=True))
    op.add_column('organizations', sa.Column('primary_color', sa.String(length=7), nullable=True, server_default='#15803d'))

    # 2. Populate slugs for existing rows
    orgs_table = sa.table('organizations',
        sa.column('id', sa.Integer),
        sa.column('name', sa.String),
        sa.column('slug', sa.String),
        sa.column('primary_color', sa.String),
    )
    conn = op.get_bind()
    rows = conn.execute(sa.select(orgs_table.c.id, orgs_table.c.name)).fetchall()
    for row_id, name in rows:
        slug = SLUG_MAP.get(name, name.lower().replace(" ", "-").replace("é", "e").replace("è", "e"))
        conn.execute(
            orgs_table.update().where(orgs_table.c.id == row_id).values(slug=slug, primary_color="#15803d")
        )

    # 3. Set NOT NULL and add unique index
    op.alter_column('organizations', 'slug', nullable=False)
    op.alter_column('organizations', 'primary_color', nullable=False)
    op.create_index(op.f('ix_organizations_slug'), 'organizations', ['slug'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_organizations_slug'), table_name='organizations')
    op.drop_column('organizations', 'primary_color')
    op.drop_column('organizations', 'logo_url')
    op.drop_column('organizations', 'slug')
