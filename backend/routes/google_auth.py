from flask import Blueprint, redirect, url_for, session, flash, request, render_template
from flask_dance.contrib.google import make_google_blueprint, google
import secrets

from backend.db.extensions import db
from backend.db.models import User
from backend.db.models import WordEntry
from backend.db.models import WordList
from backend.common import auth_keys
# 1. The Flask-Dance blueprint for OAuth

google_oauth_bp = make_google_blueprint(
    client_id=auth_keys.get("GOOGLE_OAUTH_CLIENT_ID"),
    client_secret=auth_keys.get("GOOGLE_OAUTH_CLIENT_SECRET"),
    scope=[
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
        "openid"
    ],
    redirect_to="google_auth.authorized_handler"
)

google_auth_bp = Blueprint('google_auth', __name__, url_prefix='/google_auth')

def create_or_get_google_user(google_info):
    """Create a new user from Google info or get existing user, with email matching"""
    google_id = google_info["id"]
    email = google_info.get("email")
    
    # 1. First check if user exists with this Google ID
    user = User.query.filter_by(google_id=google_id).first()
    
    if user:
        print(f"Existing Google user found: {user.username} (ID: {user.id})")
        return user
    
    # 2. Check if a user exists with the same email address AND doesn't have a Google ID yet
    if email:
        email_user = User.query.filter_by(email=email).first()
        if email_user and not email_user.google_id:  # Only link if no Google ID yet
            print(f"Found existing user with matching email: {email_user.username} (ID: {email_user.id})")
            print(f"Automatically linking Google account to this user")
            
            # Link the Google account to this existing user
            email_user.google_id = google_id
            email_user.email_verified = True  # Mark email as verified since Google verified it
            
            # Optionally update profile pic if user doesn't have one
            if google_info.get("picture"):
                email_user.profile_pic = google_info.get("picture")
                
            db.session.commit()
            
            # Flash message to inform user (will appear after redirect)
            flash("We noticed you already have an account with this email. We've linked your Google account for easier login!", "success")
            
            return email_user
        elif email_user and email_user.google_id:
            # User has this email but with a different Google account - this shouldn't normally happen
            # but could if they've deleted and recreated their Google account
            print(f"User with this email already exists and has a different Google ID")
    
    # 3. If no existing user found, create a new one
    print(f"Creating new Google user...")
    username = email.split("@")[0] if email else f"google_user_{google_id[:8]}"
    
    # Check if username exists, adjust if needed
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        username = f"{username}_{secrets.token_hex(3)}"
    

    user = User(
        username=username,
        email=email,
        email_verified=True,
        google_id=google_id,
        profile_pic=google_info.get("picture")
    )
    user.set_password(secrets.token_urlsafe(16))
    
    db.session.add(user)
    db.session.commit()
    print(f"New user created: {user.username} (ID: {user.id})")
    
    # Create default word list
    try:
        new_list = WordList(name="Learning list (default)", user=user)
        db.session.add(new_list)
        db.session.commit()
        print(f"Created default word list (ID: {new_list.id})")
        
        new_entry = WordEntry(word="你好", list=new_list)
        db.session.add(new_entry)
        db.session.commit()
        print(f"Added default word entry to list")
    except Exception as e:
        print(f"Error creating word list: {e}")
        db.session.rollback()
    
    return user


# 1. Initial login route - user clicks this to start Google login
@google_auth_bp.route("/login")
def login():
    # Redirect to Google OAuth
    return redirect(url_for("google.login"))

# Link Google account route
# Link Google account route
@google_auth_bp.route("/link_account")
def link_account():
    print("Starting Google account linking process...")
    if 'user_id' not in session:
        flash("Please log in first", "error")
        return redirect(url_for("login"))
    
    # Mark this as a linking flow
    session['linking_account'] = True
    session['linking_user_id'] = session['user_id']
    
    # Redirect to Google OAuth - this will come back to /authorized
    return redirect(url_for("google.login"))

# Callback route - where Google redirects after authentication
@google_auth_bp.route("/authorized_handler")
def authorized_handler():
    print("Google OAuth callback received")
    if not google.authorized:
        flash("Authentication failed", "error")
        return redirect(url_for("login"))
    
    resp = google.get("/oauth2/v2/userinfo")
    if not resp.ok:
        flash("Failed to get user info", "error")
        return redirect(url_for("login"))
    
    google_info = resp.json()
    google_id = google_info["id"]
    
    # CHECK IF WE'RE LINKING ACCOUNTS
    # CHECK IF WE'RE LINKING ACCOUNTS
    if session.get('linking_account') and 'linking_user_id' in session:
        print("Processing account linking flow...")
        linking_user_id = session.pop('linking_user_id')
        session.pop('linking_account', None)
        
        # Get the currently logged in user
        user = User.query.get(linking_user_id)
        
        # Get the Google email
        google_email = google_info.get("email")
        
        # First check: Is this Google account already linked to another account?
        existing_google_user = User.query.filter_by(google_id=google_id).first()
        if existing_google_user and existing_google_user.id != user.id:
            flash("This Google account is already linked to another user account", "error")
            return redirect(url_for("account"))
        
        # Second check: Is this Google email already associated with another account?
        if google_email:
            existing_email_user = User.query.filter_by(email=google_email).first()
            if existing_email_user and existing_email_user.id != user.id:
                flash("The email associated with this Google account is already used by another user account", "error")
                return redirect(url_for("manage.account_management"))
        
        # Update current user
        user.google_id = google_id
        user.email = google_email if google_email else user.email
        user.email_verified = True if google_email else user.email_verified
    
        if google_info.get("picture"):
            user.profile_pic = google_info.get("picture")

        db.session.commit()
        
        flash("Your account has been linked with Google!", "success")
        return redirect(url_for("account"))

    
    # NORMAL LOGIN FLOW
    print("Processing normal login flow...")
    # Use helper function to create or get user
    user = create_or_get_google_user(google_info)
    
    # Log them in
    session.clear()
    session.permanent = True
    session['user_id'] = user.id
    session['username'] = user.username
    session['current_card'] = None
    session['authenticated'] = True
    
    flash('Logged in successfully with Google!', 'success')
    return redirect(url_for("home"))


@google_auth_bp.route("/unlink_account", methods=["POST"])
def unlink_account():
    if 'user_id' not in session:
        flash("Please log in first", "error")
        return redirect(url_for("login"))
    
    user = User.query.get(session['user_id'])

    user.google_id = None
    user.oauth_token = None
    user.oauth_token_expiry = None
    
    if user.email and user.email.endswith('@gmail.com'):
        user.email = None
    
    user.email_verified = False
    
    if user.profile_pic and ('googleusercontent.com' in user.profile_pic or 'google.com' in user.profile_pic):
        user.profile_pic = None
    
    db.session.commit()
    
    return redirect(url_for("manage.add_password"))
    
    # user.google_id = None
    # user.oauth_token = None
    # user.oauth_token_expiry = None
    
    # if user.email and user.email.endswith('@gmail.com'):
    #     user.email = None
    
    # user.email_verified = False
    
    # if user.profile_pic and ('googleusercontent.com' in user.profile_pic or 'google.com' in user.profile_pic):
    #     user.profile_pic = None
    
    # db.session.commit()
    
    # flash("Your Google account has been completely unlinked and all Google-related data has been removed from your profile.", "success")
    # return redirect(url_for("account"))

