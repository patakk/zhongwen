from flask import Blueprint, redirect, url_for, session, flash, request, render_template, jsonify
from flask_dance.contrib.google import make_google_blueprint, google
import secrets
from sqlalchemy.exc import SQLAlchemyError
from flask_mail import Message

from backend.db.extensions import db
from backend.db.models import User
from backend.db.models import WordEntry
from backend.db.models import WordList
from backend.common import config
from backend.common import auth_keys
from backend.decorators import hard_session_required
from backend.common import DOMAIN
from backend.routes.manage import validate_password  # Import validation function
import os
# 1. The Flask-Dance blueprint for OAuth


print("Domain set to:", DOMAIN)

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

google_auth_bp = Blueprint('google_auth', __name__, url_prefix='/api/google_auth')

def create_or_get_google_user(google_info):
    """Create a new user from Google info or get existing user, with email matching"""
    google_id = google_info["id"]
    email = google_info.get("email")
    
    # 1. First check if user exists with this Google ID
    user = User.query.filter_by(google_id=google_id).first()
    
    if user:
        print(f"Existing Google user found: {user.username} (ID: {user.id})")
        return user
    
    # 2. Check if a user exists with the same email address
    if email:
        email_user = User.query.filter_by(email=email).first()

        if email_user:
            # Scenario A: Email exists, is verified, and has no Google ID yet -> Link it
            if email_user.email_verified and not email_user.google_id:
                print(f"Found existing user with matching VERIFIED email: {email_user.username} (ID: {email_user.id})")
                print(f"Automatically linking Google account to this user")
                email_user.google_id = google_id
                # Email already verified, no need to change email_verified status
                if google_info.get("picture") and not email_user.profile_pic: # Only update pic if they don't have one
                    email_user.profile_pic = google_info.get("picture")
                try:
                    db.session.commit()
                    flash("We noticed you already have an account with this email. We've linked your Google account for easier login!", "success")
                    return email_user
                except SQLAlchemyError as e:
                    db.session.rollback()
                    print(f"Error linking Google ID to verified email user {email_user.username}: {e}")
                    flash("An error occurred while linking your Google account. Please try again.", "error")
                    return None # Indicate failure

            # Scenario B: Email exists, but is NOT verified and has no Google ID
            # -> Remove email from this user, let new Google user be created.
            elif not email_user.email_verified and not email_user.google_id:
                print(f"Found existing user {email_user.username} (ID: {email_user.id}) with matching UNVERIFIED email.")
                print(f"Removing email from this user to allow new Google account creation.")
                try:
                    email_user.email = None
                    # email_verified remains False implicitly
                    db.session.commit()
                    print(f"Email removed from user {email_user.username}.")
                    # DO NOT return email_user. Proceed to create a new user below.
                except SQLAlchemyError as e:
                    db.session.rollback()
                    print(f"Error removing email from user {email_user.username}: {e}")
                    flash("An error occurred while preparing your account. Please try again.", "error")
                    # Prevent proceeding to creation if email removal failed
                    return None

            # Scenario C: Email exists and already has a Google ID (should match the incoming one if it's the same user)
            # This case is technically handled by the initial google_id check, but we add a log here for clarity.
            elif email_user.google_id == google_id:
                 print(f"User with this email already linked to this Google ID (ID: {email_user.id}). Proceeding with login.")
                 # No changes needed, user already exists and is correctly linked.
                 # The function will return this user shortly if the initial google_id check didn't already catch it.
                 # This path might be redundant depending on exact flow but safe to have.
                 return email_user # Return the user found by email, which matches the google_id

            # Scenario D: Email exists but is linked to a DIFFERENT Google ID
            elif email_user.google_id and email_user.google_id != google_id:
                # This is problematic. The email is verified (implicitly or explicitly)
                # and associated with a different Google account.
                # We cannot link this new Google account. Block the login.
                print(f"Error: User with email {email} exists but is linked to a different Google ID.")
                flash("This email address is already associated with a different Google account.", "error")
                # We need to prevent login here. Returning None or raising an exception
                # might be options, but redirecting seems clearest for the user flow.
                # However, this function's primary role is user retrieval/creation.
                # Let the calling function handle the redirect/error message based on None return.
                return None # Indicate failure to the calling function


    # 3. If no existing user found by google_id OR if the only email match was unverified (and email removed), create a new one
    print(f"Creating new Google user for email {email}...")
    username = email.split("@")[0] if email else f"google_user_{google_id[:8]}"
    
    # Check if username exists, adjust if needed
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        username = f"{username}_{secrets.token_hex(3)}"
    

    user = User(
        username=username,
        email=email, # Assign the email to the new user
        email_verified=True, # Mark as verified because it's from Google
        google_id=google_id,
        profile_pic=google_info.get("picture")
    )
    user.set_password(secrets.token_urlsafe(16)) # Set a random password
    
    try:
        db.session.add(user)
        db.session.commit()
        print(f"New user created: {user.username} (ID: {user.id}) with email {user.email}")

        # Create default word list
        try:
            new_list = WordList(name="Learning", user=user)
            db.session.add(new_list)
            db.session.commit()
            print(f"Created default word list (ID: {new_list.id})")
            
            new_entry = WordEntry(word="你好", list=new_list)
            db.session.add(new_entry)
            db.session.commit()
            print(f"Added default word entry to list")
        except Exception as e:
            print(f"Error creating word list/entry: {e}")
            # Don't rollback user creation, just log the wordlist error
            # db.session.rollback() # Avoid rolling back user creation

        return user
    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"Error creating new Google user: {e}")
        # Check if the error is specifically about the email constraint (shouldn't happen if removal worked)
        if 'UNIQUE constraint failed: user.email' in str(e):
             flash("This email address seems to be in use, but we couldn't resolve the conflict. Please contact support.", "error")
        else:
             flash("An error occurred during account creation. Please try again.", "error")
        return None


# 1. Initial login route - user clicks this to start Google login
@google_auth_bp.route("/login")
def login():
    # Redirect to Google OAuth
    return redirect("/login/google")

# Link Google account route
# Link Google account route
@google_auth_bp.route("/link_account", methods=["POST"])
def link_account():
    if 'user_id' not in session:
        flash("Please log in first", "error")
        return redirect(f'{DOMAIN}/login')   
    
    # Mark this as a linking flow
    session['linking_account'] = True
    session['linking_user_id'] = session['user_id']
    
    # Redirect to Google OAuth - this will come back to /authorized
    return redirect("/login/google")

# Callback route - where Google redirects after authentication
@google_auth_bp.route("/authorized_handler")
def authorized_handler():
    print("Google OAuth callback received")
    if not google.authorized:
        flash("Authentication failed", "error")
        #return redirect(url_for("login"))
        return redirect(f'{DOMAIN}/')  
    
    resp = google.get("/oauth2/v2/userinfo")
    if not resp.ok:
        flash("Failed to get user info", "error")
        #return redirect(url_for("login"))
        return redirect(f'{DOMAIN}/login')  
    
    google_info = resp.json()
    google_id = google_info["id"]
    
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
            print("This Google account is already linked to another user account")
            #return redirect(url_for("account"))
            return redirect(f'{DOMAIN}/')  
        
        # Second check: Is this Google email already associated with another account?
        if google_email:
            existing_email_user = User.query.filter_by(email=google_email).first()
            if existing_email_user and existing_email_user.id != user.id:
                print("The email associated with this Google account is already used by another user account")
                #return redirect(url_for("manage.account_management"))
                return redirect(f'{DOMAIN}/')  
        
        # Update current user
        user.google_id = google_id
        user.email = google_email if google_email else user.email
        user.email_verified = True if google_email else user.email_verified
    
        if google_info.get("picture"):
            user.profile_pic = google_info.get("picture")

        db.session.commit()
        
        print("Your account has been linked with Google!")
        #return redirect(url_for("account"))
        return redirect(f'{DOMAIN}/')  

    # NORMAL LOGIN FLOW
    print("Processing normal login flow...")
    # Use helper function to create or get user
    user = create_or_get_google_user(google_info)

    # Handle case where create_or_get_google_user indicated an error (e.g., email conflict)
    if user is None:
        # Flash message was likely set within create_or_get_google_user
        return redirect(f'{DOMAIN}/login') # Redirect to login page with error flash

    # Log them in
    session.clear()
    session.permanent = True
    session['user_id'] = user.id
    session['username'] = user.username
    session['current_card'] = None
    session['authenticated'] = True
    
    flash('Logged in successfully with Google!', 'success')
    #return redirect(url_for("home"))
    return redirect(f'{DOMAIN}')


@google_auth_bp.route("/unlink_and_set_password", methods=["POST"])
@hard_session_required
def unlink_and_set_password():
    if 'user_id' not in session:
        return jsonify({"message": "Authentication required", "success": False}), 401

    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({"message": "User not found", "success": False}), 404

    if not user.google_id:
        return jsonify({"message": "Google account not linked", "success": False}), 400

    data = request.get_json()
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')

    if not new_password or not confirm_password:
        return jsonify({"message": "Password fields are required", "success": False}), 400

    if new_password != confirm_password:
        return jsonify({"message": "Passwords do not match", "success": False}), 400

    is_valid, msg = validate_password(new_password)
    if not is_valid:
        return jsonify({"message": msg, "success": False}), 400

    try:
        # Set the new password
        user.set_password(new_password)

        # Unlink Google account data and clear email
        user.google_id = None
        # Also clear email since it was obtained through Google
        user.email = None
        user.email_verified = False
        # Clear Google profile picture as well
        if user.profile_pic and ('googleusercontent.com' in user.profile_pic or 'google.com' in user.profile_pic):
            user.profile_pic = None

        db.session.commit()
        print(f"User {user.username} unlinked Google, set password, and cleared email.")
        return jsonify({"message": "Successfully unlinked Google account and set password. Your email has been removed.", "success": True}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error during unlink_and_set_password for user {user.username}: {e}")
        return jsonify({"message": "An internal error occurred.", "success": False}), 500


@google_auth_bp.route("/unlink_account", methods=["POST"])
def unlink_account():
    # This is the existing unlink endpoint - add a check to prevent unlinking if no password exists
    if 'user_id' not in session:
        print("Please log in first", "error")
        return jsonify({"message": "Authentication required", "success": False}), 401

    user = User.query.get(session['user_id'])
    if not user:
        print("User not found", "error")
        return jsonify({"message": "User not found", "success": False}), 404

    # ADD CHECK: Prevent unlinking if no password exists via this old route
    if not user.password_hash and user.google_id:
        return jsonify({"message": "Please set a password to unlink your Google account.", "success": False}), 400

    # Original unlink logic below
    if not user.google_id:
        print("No linked Google account found", "error")
        return {"message": "No linked Google account to unlink", "success": False}, 400

    # Unlink Google account data
    user.google_id = None
    user.oauth_token = None
    user.oauth_token_expiry = None

    # Clear email only if it was linked via Google (indicated by google_id)
    user.email = None
    user.email_verified = False

    # Clear profile picture if it is from Google
    if user.profile_pic and ('googleusercontent.com' in user.profile_pic or 'google.com' in user.profile_pic):
        user.profile_pic = None

    db.session.commit()

    print("Unlinked Google account successfully")
    print('print db data to check')
    print(user.google_id)
    print(user.email)
    print(user.profile_pic)
    print(user.email_verified)

    return {"message": "Successfully unlinked your Google account", "success": True}, 200
