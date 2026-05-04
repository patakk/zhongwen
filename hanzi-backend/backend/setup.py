from datetime import timedelta
from flask import Flask
import os
from backend.db.extensions import db, migrate, mail
from flask import request
import yaml
from pathlib import Path
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
from flask_session import Session

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
CONFIG_PATH = os.path.join(BASE_DIR, 'config.yml')

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

def load_config():
    with open(CONFIG_PATH) as f:
        config = yaml.safe_load(f)
    return config



config = load_config()
secrets_path = os.path.join(config['paths']['root'], config['paths']['secrets'])
auth_keys = load_secrets(secrets_path)

if os.getenv('PROD') == 'true':
    PROD_MODE = True
else:
    PROD_MODE = config.get('prod_mode')

LOCAL_DOMAIN = config.get('google', {}).get('frontend_dev')


def _frontend_url(path=''):
    """Return the frontend origin to redirect to after OAuth.
    In prod, mirror whichever host the user came from (hanzi.abcrgb.xyz,
    zi.abcrgb.xyz, ...). In dev, fall back to the configured DOMAIN
    because the frontend runs on a different port from the backend.
    """
    if PROD_MODE:
        origin = request.host_url.rstrip('/')
    else:
        origin = LOCAL_DOMAIN.rstrip('/')

    print("****************")
    print("****************")
    print("****************")
    print("{origin}{path}")
    print("****************")
    return f"{origin}{path}"


def create_app():
    app = Flask("hanzi_app")
    
    if PROD_MODE:
        app.config['SESSION_COOKIE_DOMAIN'] = '.abcrgb.xyz'

    # Flask core config - using auth_keys for secret
    app.config['SECRET_KEY'] = auth_keys.get('FLASK_SECRET_KEY')
    app.config['SESSION_TYPE'] = config['flask']['session']['type']
    app.config['SESSION_PERMANENT'] = config['flask']['session']['permanent']
    app.config['SESSION_COOKIE_SECURE'] = config['flask']['session']['cookie']['secure']
    app.config['SESSION_COOKIE_HTTPONLY'] = config['flask']['session']['cookie']['httponly'] 
    app.config['SESSION_COOKIE_SAMESITE'] = config['flask']['session']['cookie']['samesite']
    app.config['SESSION_FILE_DIR'] = os.path.join(config['paths']['root'], config['flask']['session'].get('file_dir'))
    app.config['SESSION_FILE_THRESHOLD'] = config['flask']['session'].get('file_threshold', 500)
    app.config['SESSION_FILE_MODE'] = 0o600

    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=config['flask']['session']['lifetime_days'])

    # Database
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(config['paths']['root'], config['database']['uri'])
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['APPLICATION_ROOT'] = '/'
    
    # Email config - using auth_keys for password
    app.config.update(
        MAIL_SERVER=config['mail']['server'],
        MAIL_PORT=config['mail']['port'],
        MAIL_USE_TLS=config['mail']['use_tls'],
        MAIL_USERNAME=config['mail']['username'],
        MAIL_PASSWORD=auth_keys.get('EMAIL_INFO_PASSWORD'),
        MAIL_DEFAULT_SENDER=(
            config['mail']['default_sender']['name'],
            config['mail']['default_sender']['email']
        )
    )

    # Set up templates and static
    app.template_folder = os.path.join(BASE_DIR, 'templates')
    app.static_folder = os.path.join(BASE_DIR, 'static')

    # Google OAuth config
    app.config["GOOGLE_OAUTH_CLIENT_ID"] = auth_keys.get('GOOGLE_OAUTH_CLIENT_ID')
    app.config["GOOGLE_OAUTH_CLIENT_SECRET"] = auth_keys.get('GOOGLE_OAUTH_CLIENT_SECRET')
    app.config["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

    # Register blueprints
    from backend.routes.google_auth import google_oauth_bp, google_auth_bp
    from backend.routes.api import api_bp
    from backend.routes.manage import manage_bp
    from backend.routes.fsrs import fsrs_bp

    app.register_blueprint(google_oauth_bp, url_prefix="/login")
    app.register_blueprint(google_auth_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(manage_bp)
    app.register_blueprint(fsrs_bp)

    Session(app)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)

    return app
