"""updated stroke data

Revision ID: 39c22cef0b5d
Revises: 065bdb29493d
Create Date: 2025-03-07 17:30:26.780197

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '39c22cef0b5d'
down_revision = '065bdb29493d'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('stroke_data', schema=None) as batch_op:
        batch_op.add_column(sa.Column('_strokes', sa.LargeBinary(), nullable=False))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('stroke_data', schema=None) as batch_op:
        batch_op.drop_column('_strokes')

    # ### end Alembic commands ###
