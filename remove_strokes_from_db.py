from backend.db.extensions import db
from sqlalchemy import text
from backend.setup import create_app

app = create_app()

with app.app_context():
    db.session.execute(text('DELETE FROM stroke_data'))
    db.session.commit()