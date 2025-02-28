

from datetime import timedelta
from flask import Flask
import os


from backend.db.extensions import db
from backend.db.extensions import migrate
from backend.db.extensions import mail


BASE_DIR = os.path.abspath(os.path.dirname(__file__))

FLASK_CONFIG = {
    'SECRET_KEY': "zhongwen-hen-you-yi-si",
    'SESSION_TYPE': 'filesystem',
    'SESSION_PERMANENT': True,
    'SESSION_COOKIE_SECURE': True,
    'SESSION_COOKIE_HTTPONLY': True,
    'SESSION_COOKIE_SAMESITE': 'Lax',
    'PERMANENT_SESSION_LIFETIME': timedelta(days=30),
    'SQLALCHEMY_TRACK_MODIFICATIONS': False
}

def create_app():
    app = Flask(__name__)
    app.config.update(FLASK_CONFIG)
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(BASE_DIR, "flashcards.db")}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    # setup temlates and static
    app.template_folder = os.path.join(BASE_DIR, '..', 'templates')
    app.static_folder = os.path.join(BASE_DIR, '..', 'static')

    info_pass = os.environ.get("INFO_PASSWORD")
    if not info_pass:
        with open("/home/patakk/.info-mail-password", "r") as file:
            info_pass = file.read().strip()
    app.config['MAIL_SERVER'] = 'mail.your-server.de'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_USERNAME'] = 'info@patakk.xyz'
    app.config['MAIL_PASSWORD'] = info_pass
    app.config['MAIL_DEFAULT_SENDER'] = ('Zhongwen App', 'info@patakk.xyz')

    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    return app