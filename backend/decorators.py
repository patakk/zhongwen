import logging
import time
from functools import wraps

from flask import redirect, session, url_for
from flask import request

logger = logging.getLogger(__name__)

ENABLE_TIMING = False

def timing_decorator(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if not ENABLE_TIMING:
            return f(*args, **kwargs)
        start_time = time.time()
        result = f(*args, **kwargs)
        processing_time = time.time() - start_time
        username = session.get("username", "unknown")
        with open(f"{username}_timing.txt", "a") as file:
            file.write(f"{f.__name__}: {processing_time:.4f} seconds\n")
        return result
    return wrap


def hard_session_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if request.path.startswith('/static/'):
            return func(*args, **kwargs)
        if "deck" not in session:
            session["deck"] = "hsk1"
        if "font" not in session:
            session["font"] = "Noto Sans Mono"
        if 'username' not in session or session.get('username') == 'tempuser':
            logger.info("User not authenticated, redirecting to login page")
            return redirect(url_for("login"))
        session.modified = True
        return func(*args, **kwargs)
    return wrapper


def session_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if "deck" not in session:
            session["deck"] = "hsk1"
        if "font" not in session:
            session["font"] = "Noto Sans Mono"
        if "darkmode" not in session:
            session["darkmode"] = False
        if "username" not in session:
            session["username"] = "tempuser"
        session.modified = True
        return func(*args, **kwargs)
    return wrapper
