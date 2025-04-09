from flask_mail import Mail, Message
import secrets

from flask import Blueprint, jsonify, render_template, session
manage_bp = Blueprint("manage", __name__, url_prefix="/manage")

from flask import request, redirect, url_for, flash

import logging
logger = logging.getLogger(__name__)

from backend.db.models import User
from backend.db.extensions import db, mail
from backend.decorators import session_required
from backend.decorators import hard_session_required


def validate_password(password):
    if len(password) < 6: 
        return False, "Password must be at least 6 characters"
    return True, ""


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


@manage_bp.route('/delete-account', methods=['GET', 'POST'])
@hard_session_required
def delete_account():
    """Delete a user and all their associated data."""
    username = session['username']
    user = User.query.filter_by(username=username).first()
    if not user:
        return
    if user.notes:
        for note in user.notes:
            db.session.delete(note)
    if user.user_string:
        db.session.delete(user.user_string)
    if user.stroke_entries:
        for entry in user.stroke_entries:
            db.session.delete(entry)
    if user.word_lists:
        for word_list in user.word_lists:
            db.session.delete(word_list)
    db.session.delete(user)
    db.session.commit()
    return redirect(url_for('home'))



@manage_bp.route('/email-management', methods=['GET', 'POST'])
@hard_session_required
def email_management():
    if request.method == 'POST':
        email = request.form.get('email')
        user = User.query.filter_by(username=session['username']).first()

        if user:
            if User.query.filter_by(email=email).first():
                flash('Email already registered', 'danger')
                session['_from_post'] = True
                return redirect(url_for('manage.email_management'))

            user.set_email(email, verified=False)
            token = user.generate_email_verification_token()
            verification_link = url_for('manage.verify_email', token=token, _external=True)
            
            msg = Message('Verify Your Email',
                         recipients=[email])
            msg.body = f'''Please click on the following link to verify your email:
            {verification_link}
            
            If you did not request this email, please ignore it.'''
            
            try:
                mail.send(msg)
                db.session.commit()
                flash('Verification email sent.', 'success')
            except Exception as e:
                db.session.rollback()
                flash('Error sending verification email.', 'danger')
            
            session['_from_post'] = True
        return redirect(url_for('manage.email_management'))
    
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
    else:
        logger.info(f"User tried to verify email with invalid token: {token}")
    return redirect(url_for('home'))


@manage_bp.route('/change-password', methods=['GET', 'POST'])
@hard_session_required
def change_password():
    if request.method == 'POST':
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        user = User.query.filter_by(username=session['username']).first()
        
        if not user.check_password(current_password):
            flash('Current password is incorrect', 'danger')
            session['_from_post'] = True
            return redirect(url_for('manage.change_password'))
        
        if new_password != confirm_password:
            flash('New passwords do not match', 'danger')
            session['_from_post'] = True
            return redirect(url_for('manage.change_password'))
        
        is_valid, msg = validate_password(new_password)
        if not is_valid:
            flash(msg, 'danger')
            session['_from_post'] = True
            return redirect(url_for('manage.change_password'))
        
        try:
            user.set_password(new_password)
            db.session.commit()
            flash('Password changed successfully', 'success')
            return redirect(url_for('account'))
        except Exception as e:
            db.session.rollback()
            flash('Error updating password', 'danger')
            session['_from_post'] = True
            return redirect(url_for('manage.change_password'))
                
    # Clear flashes only on direct page access (not from POST redirect)
    if not session.pop('_from_post', False):
        session.pop('_flashes', None)
        
    return render_template('account_management/password_change.html', darkmode=session['darkmode'], username=session['username'])

@manage_bp.route('/add-password', methods=['GET', 'POST'])
@hard_session_required
def add_password():
    if request.method == 'POST':
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        user = User.query.filter_by(username=session['username']).first()
        
        if new_password != confirm_password:
            flash('Passwords do not match', 'danger')
            session['_from_post'] = True
            return redirect(url_for('manage.add_password'))
        
        is_valid, msg = validate_password(new_password)
        if not is_valid:
            flash(msg, 'danger')
            session['_from_post'] = True
            return redirect(url_for('manage.add_password'))
        
        try:
            user.set_password(new_password)
            db.session.commit()
            flash('Password set successfully', 'success')
            return redirect(url_for('account'))
        except Exception as e:
            db.session.rollback()
            flash('Error setting password', 'danger')
            session['_from_post'] = True
            return redirect(url_for('manage.add_password'))
                
    # Clear flashes only on direct page access (not from POST redirect)
    if not session.pop('_from_post', False):
        session.pop('_flashes', None)
        
    return render_template('account_management/password_add.html', darkmode=session['darkmode'], username=session['username'])
