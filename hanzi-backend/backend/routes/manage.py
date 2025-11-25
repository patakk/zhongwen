from flask_mail import Mail, Message
import secrets

from flask import Blueprint, jsonify, render_template, session
from flask import request, redirect, url_for, flash

import logging
logger = logging.getLogger(__name__)

from backend.db.models import User
from backend.db.extensions import db, mail
from backend.decorators import session_required
from backend.decorators import hard_session_required
from backend.common import DOMAIN


def validate_password(password):
    if len(password) < 6: 
        return False, "Password must be at least 6 characters"
    return True, ""

manage_bp = Blueprint("manage", __name__, url_prefix="/api")

@manage_bp.route('/account-management')
@hard_session_required
def account_management():
    username = request.args.get('user', session.get('username'))

    if not username:
        return "User or deck not specified", 400

    google_id = User.query.filter_by(username=username).first().google_id
    profile_pic = User.query.filter_by(username=username).first().profile_pic
    email = User.query.filter_by(username=username).first().email
    password = User.query.filter_by(username=username).first().password_hash

    return render_template('account_management/account_management.html', darkmode=session['darkmode'], username=session.get('username'), google_id=google_id, profile_pic=profile_pic, email=email)


@manage_bp.route('/delete-account', methods=['POST'])
@hard_session_required
def delete_account_api():
    """API endpoint to delete a user and all their associated data."""
    try:
        username = session.get('username')
        if not username:
            return jsonify({"message": "User not found", "success": False}), 404
            
        # Use the db_delete_user function from backend.db.ops
        from backend.db.ops import db_delete_user
        result = db_delete_user(username)
        
        if result:
            # Clear session after successful deletion
            session.clear()
            return jsonify({"message": "Account deleted successfully", "success": True}), 200
        else:
            return jsonify({"message": "Error deleting account", "success": False}), 500
            
    except Exception as e:
        logger.error(f"Error deleting account for {username}: {e}")
        return jsonify({"message": f"Error deleting account: {str(e)}", "success": False}), 500


@manage_bp.route('/email-management', methods=['GET', 'POST'])
@hard_session_required
def email_management():
    # Handle JSON API requests
    if request.is_json:
        email = request.json.get('email')
        user = User.query.filter_by(username=session['username']).first()

        if not user:
            return jsonify({"message": "User not found", "success": False}), 404

        # Check if email is already in use by another account
        existing_email_user = User.query.filter_by(email=email).first()
        if existing_email_user and existing_email_user.id != user.id:
            return jsonify({"message": "Email already registered to another account", "success": False}), 400

        try:
            user.set_email(email, verified=False)
            token = user.generate_email_verification_token()
            verification_link = f"{DOMAIN}/api/verify-email/{token}"
            
            msg = Message('Verify Your Email',
                        recipients=[email])
            msg.body = f'''Please click on the following link to verify your email:
            {verification_link}
            
            If you did not request this email, please ignore it.'''
            
            mail.send(msg)
            db.session.commit()
            logger.info(f"Verification email sent to {email} for user {session['username']}")
            return jsonify({"message": "Verification email sent. Please check your inbox.", "success": True}), 200
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error sending verification email to {email}: {e}")
            return jsonify({"message": "Error sending verification email", "success": False}), 500
            
    # Handle traditional form submissions
    elif request.method == 'POST':
        email = request.form.get('email')
        user = User.query.filter_by(username=session['username']).first()

        if user:
            existing_email_user = User.query.filter_by(email=email).first()
            if existing_email_user and existing_email_user.id != user.id:
                flash('Email already registered to another account', 'danger')
                session['_from_post'] = True
                return redirect(url_for('manage.email_management'))

            user.set_email(email, verified=False)
            token = user.generate_email_verification_token()
            verification_link = f"{DOMAIN}/api/verify-email/{token}"
            
            msg = Message('Verify Your Email',
                         recipients=[email])
            msg.body = f'''Please click on the following link to verify your email:
            {verification_link}
            
            If you did not request this email, please ignore it.'''
            
            try:
                mail.send(msg)
                db.session.commit()
                flash('Verification email sent. Please check your inbox.', 'success')
                logger.info(f"Verification email sent to {email} for user {session['username']}")
            except Exception as e:
                db.session.rollback()
                flash('Error sending verification email. Please try again later.', 'danger')
                logger.error(f"Error sending verification email to {email}: {e}")
            
            session['_from_post'] = True
        return redirect(url_for('manage.email_management'))
    
    # Handle GET request - render the template for traditional web flows
    if not session.pop('_from_post', False):
        session.pop('_flashes', None)
    
    email = ''
    if session.get('username', 'tempuser') != 'tempuser':
        email = User.query.filter_by(username=session['username']).first().email
    return render_template('account_management/email_management.html', darkmode=session['darkmode'], username=session['username'], current_user={'email': email})


@manage_bp.route('/verify-email/<token>')
@session_required
def verify_email(token):
    user = User.query.filter_by(email_verification_token=token).first()
    if user:
        user.email_verified = True
        user.email_verification_token = None
        db.session.commit()
        logger.info(f"User {user.username} verified their email.")
        # Redirect directly to the frontend account page to trigger data refresh
        return redirect('/settings') 
    else:
        logger.info(f"User tried to verify email with invalid token: {token}")
        # Redirect to home or an error page if token is invalid
        return redirect(url_for('home'))


@manage_bp.route('/change-password', methods=['POST']) # API endpoint, not rendering template
@hard_session_required
def change_password_api():
    # This replaces the old change_password route's POST logic
    current_password = request.json.get('current_password')
    new_password = request.json.get('new_password')
    confirm_password = request.json.get('confirm_password')

    user = User.query.filter_by(username=session['username']).first()
    if not user:
         return jsonify({"message": "User not found", "success": False}), 404

    if not user.password_hash:
         return jsonify({"message": "Password login not enabled for this account.", "success": False}), 400

    if not user.check_password(current_password):
        return jsonify({"message": "Current password is incorrect", "success": False}), 400

    if new_password != confirm_password:
        return jsonify({"message": "New passwords do not match", "success": False}), 400

    is_valid, msg = validate_password(new_password)
    if not is_valid:
        return jsonify({"message": msg, "success": False}), 400

    try:
        user.set_password(new_password)
        db.session.commit()
        return jsonify({"message": "Password changed successfully", "success": True}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error changing password for {user.username}: {e}")
        return jsonify({"message": "Error updating password", "success": False}), 500


@manage_bp.route('/add-password', methods=['POST']) # API endpoint
@hard_session_required
def add_password_api():
    # This replaces the old add_password route's POST logic
    new_password = request.json.get('new_password')
    confirm_password = request.json.get('confirm_password')

    user = User.query.filter_by(username=session['username']).first()
    if not user:
         return jsonify({"message": "User not found", "success": False}), 404

    # Optional: Check if password already exists? Or allow overwriting? Let's allow setting it.
    # if user.password_hash:
    #     return jsonify({"message": "Password already set. Use change password.", "success": False}), 400

    if new_password != confirm_password:
        return jsonify({"message": "Passwords do not match", "success": False}), 400

    is_valid, msg = validate_password(new_password)
    if not is_valid:
        return jsonify({"message": msg, "success": False}), 400

    try:
        user.set_password(new_password)
        db.session.commit()
        return jsonify({"message": "Password set successfully", "success": True}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error setting password for {user.username}: {e}")
        return jsonify({"message": "Error setting password", "success": False}), 500


@manage_bp.route('/change-username', methods=['POST'])
@hard_session_required
def change_username_api():
    """API endpoint to change a user's username."""
    try:
        new_username = request.json.get('new_username')
        
        if not new_username:
            return jsonify({"message": "New username is required", "success": False}), 400
            
        # Validate username (can add more validation as needed)
        if len(new_username) < 3:
            return jsonify({"message": "Username must be at least 3 characters", "success": False}), 400
            
        # Check if username is already taken
        existing_user = User.query.filter_by(username=new_username).first()
        if existing_user:
            return jsonify({"message": "This username is already taken", "success": False}), 400
            
        # Get current user
        current_username = session.get('username')
        user = User.query.filter_by(username=current_username).first()
        
        if not user:
            return jsonify({"message": "User not found", "success": False}), 404
            
        # Update username
        old_username = user.username
        user.username = new_username
        
        # Update session with new username
        session['username'] = new_username
        
        db.session.commit()
        logger.info(f"User changed username from {old_username} to {new_username}")
        return jsonify({"message": "Username changed successfully", "success": True}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error changing username: {e}")
        return jsonify({"message": f"Error changing username: {str(e)}", "success": False}), 500
