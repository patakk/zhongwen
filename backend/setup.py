from datetime import timedelta
from flask import Flask
import os
from backend.db.extensions import db, migrate, mail

import os

from backend.routes.google_auth import google_oauth_bp, google_auth_bp
from backend.routes.api import api_bp
from backend.routes.puzzles import puzzles_bp
from backend.routes.manage import manage_bp
from backend.common import auth_keys


def load_secrets(secrets_file):
    secrets = {}
    try:
        with open(secrets_file, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, value = line.split('=', 1)
                    secrets[key.strip()] = value.strip()
    except Exception as e:
        print(f"Warning: Could not load secrets file: {e}")
    return secrets

auth_keys = load_secrets('/home/patakk/.zhongweb-secrets')

import os
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


FLASK_CONFIG = {
    'SECRET_KEY': auth_keys.get("FLASK_SECRET_KEY"),
    'SESSION_TYPE': 'sqlalchemy',
    'SESSION_PERMANENT': True,
    'SESSION_COOKIE_SECURE': True,
    'SESSION_COOKIE_HTTPONLY': True,
    'SESSION_COOKIE_SAMESITE': 'Lax',
    'PERMANENT_SESSION_LIFETIME': timedelta(days=30),
    'SQLALCHEMY_DATABASE_URI': 'sqlite:////home/patakk/zhongweb_db/flashcards.db',
    'SQLALCHEMY_TRACK_MODIFICATIONS': False,
    'APPLICATION_ROOT': '/',
}


def create_app():
    app = Flask(__name__)
    app.config.update(FLASK_CONFIG)

    app.config["WTF_CSRF_SECRET_KEY"] = auth_keys.get("FLASK_SECRET_KEY")
    # csrf = CSRFProtect(app)

    app.template_folder = os.path.join(BASE_DIR, '..', 'templates')
    app.static_folder = os.path.join(BASE_DIR, '..', 'static')

    info_pass = auth_keys.get("EMAIL_INFO_PASSWORD")

    # Configure Google OAuth
    gauth_client_id = auth_keys.get("GOOGLE_OAUTH_CLIENT_ID")
    gauth_client_secret = auth_keys.get("GOOGLE_OAUTH_CLIENT_SECRET")
    app.config["GOOGLE_OAUTH_CLIENT_ID"] = gauth_client_id
    app.config["GOOGLE_OAUTH_CLIENT_SECRET"] = gauth_client_secret
    app.config["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

    app.register_blueprint(google_oauth_bp, url_prefix="/login")
    app.register_blueprint(google_auth_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(puzzles_bp)
    app.register_blueprint(manage_bp)
    
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
