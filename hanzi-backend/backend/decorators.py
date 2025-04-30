import logging
import time
from functools import wraps

from flask import redirect, session, url_for, jsonify
from flask import request
from backend.db.models import User

logger = logging.getLogger(__name__)

ENABLE_TIMING = True

def timing_decorator(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if not ENABLE_TIMING:
            return f(*args, **kwargs)
        start_time = time.time()
        result = f(*args, **kwargs)
        processing_time = time.time() - start_time
        logger.info(f"Function {f.__name__} took {processing_time:.2f} seconds")
        return result
    return wrap


def hard_session_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Skip check for static files
        if request.path.startswith('/static/'):
            return func(*args, **kwargs)
            
        # Set default session values if missing
        if "deck" not in session:
            session["deck"] = "hsk1"
        if "font" not in session:
            session["font"] = "Noto Sans Mono"
            
        # Check if user is authenticated
        if 'user_id' not in session or 'username' not in session or session.get('username') == 'tempuser':
            logger.info("User not authenticated, redirecting to login page")
            # If JSON API request, return 401
            if request.is_json or request.headers.get('Accept') == 'application/json':
                return jsonify({"message": "Authentication required", "success": False}), 401
            # Otherwise redirect to login page
            return redirect(url_for("login"))
        
        # Verify that the user still exists in the database
        user_id = session.get('user_id')
        username = session.get('username')
        user = User.query.get(user_id)
        
        if not user or user.username != username:
            logger.warning(f"User session ID {user_id} (username: {username}) not found in database, clearing session")
            session.clear()
            # If JSON API request, return 401
            if request.is_json or request.headers.get('Accept') == 'application/json':
                return jsonify({"message": "User not found", "success": False}), 401
            # Otherwise redirect to login page
            return redirect(url_for("login"))
            
        # Update session metainfo
        session.modified = True
        return func(*args, **kwargs)
    return wrapper


def session_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Skip check for static files
        if request.path.startswith('/static/'):
            return func(*args, **kwargs)
            
        # Set default session values if missing
        if "deck" not in session or session.get("deck") == "null":
            session["deck"] = "hsk1"
        if "font" not in session:
            session["font"] = "Noto Sans Mono"
        if "darkmode" not in session:
            session["darkmode"] = False
        if "username" not in session:
            session["username"] = None

        # If user claims to be logged in, verify they exist in the database
        if session.get('user_id') and session.get('username') and session.get('username') != 'tempuser':
            try:
                user = User.query.get(session.get('user_id'))
                if not user or user.username != session.get('username'):
                    logger.warning(f"User session ID {session.get('user_id')} (username: {session.get('username')}) not found in database, clearing session")
                    session.clear()
                    session["deck"] = "hsk1"
                    session["font"] = "Noto Sans Mono"
                    session["darkmode"] = False
                    
                    # If JSON API request, return 401
                    if request.is_json or request.headers.get('Accept') == 'application/json':
                        return jsonify({"message": "Authentication expired", "success": False}), 401
            except:
                logger.warning(f"User session ID {session.get('user_id')} (username: {session.get('username')}) not found in database, clearing session")
                session.clear()
                session["deck"] = "hsk1"
                session["font"] = "Noto Sans Mono"
                session["darkmode"] = False
                
                # If JSON API request, return 401
                if request.is_json or request.headers.get('Accept') == 'application/json':
                    return jsonify({"message": "Authentication expired", "success": False}), 401
        # Update session metainfo
        session.modified = True
        return func(*args, **kwargs)
    return wrapper
