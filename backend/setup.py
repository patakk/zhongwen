from datetime import timedelta
from flask import Flask
import os
from backend.db.extensions import db, migrate, mail
from flask_wtf.csrf import CSRFProtect

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

FLASK_CONFIG = {
    'SECRET_KEY': os.environ.get("FLASK_SECRET_KEY") or open("/home/patakk/.flask-secret-key", "r").read().strip(),
    'SESSION_TYPE': 'sqlalchemy',
    'SESSION_PERMANENT': True,
    'SESSION_COOKIE_SECURE': True,
    'SESSION_COOKIE_HTTPONLY': True,
    'SESSION_COOKIE_SAMESITE': 'Lax',
    'PERMANENT_SESSION_LIFETIME': timedelta(days=30),
    'SQLALCHEMY_DATABASE_URI': 'sqlite:////var/lib/zhongweb/flashcards.db',
    'SQLALCHEMY_TRACK_MODIFICATIONS': False,
}


def create_app():
    app = Flask(__name__)
    app.config.update(FLASK_CONFIG)

    app.config["WTF_CSRF_SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY") or open("/home/patakk/.flask-secret-key", "r").read().strip()
    # csrf = CSRFProtect(app)

    app.template_folder = os.path.join(BASE_DIR, '..', 'templates')
    app.static_folder = os.path.join(BASE_DIR, '..', 'static')

    info_pass = os.environ.get("INFO_PASSWORD")
    if not info_pass:
        with open("/home/patakk/.info-mail-password", "r") as file:
            info_pass = file.read().strip()
    
    app.config.update(
        MAIL_SERVER='mail.your-server.de',
        MAIL_PORT=587,
        MAIL_USE_TLS=False,
        MAIL_USERNAME='info@patakk.xyz',
        MAIL_PASSWORD=info_pass,
        MAIL_DEFAULT_SENDER=('Zhongwen App', 'info@patakk.xyz')
    )

    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)

    return app
