import logging
from datetime import datetime, timezone
from urllib.parse import unquote
import copy
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm.attributes import flag_modified
from flask import request, redirect, url_for, flash

from flask_mail import Mail, Message

from backend.db.extensions import db
from backend.db.models import StrokeData, User, UserProgress, UserString, Card, UserNotes
from backend.db.extensions import db, mail

logger = logging.getLogger(__name__)


def getshortdate():
    return datetime.now(timezone.utc).strftime("%Y%m%d")


def db_get_all_stroke_data(username):
    characters = db_get_all_character_strokes(username)
    print("AAAAAAAAAAA", characters)
    result = {}
    for character in characters:
        print(character)
        stroke_data_entries = db_get_stroke_entries(username, character)
        print(stroke_data_entries)
        character_attempts = []
        for entry in stroke_data_entries:
            character_attempts.append(
                {
                    "id": entry.id,
                    "strokes": entry.strokes,
                    "timestamp": entry.timestamp.isoformat(),
                }
            )

        result[character] = character_attempts

    return result


def db_create_user(
    username,
    password,  # New parameter
    email,  # New parameter
    base_new_cards_limit,
    new_cards_limit,
    new_cards_limit_last_updated,
    daily_new_cards,
    last_new_cards_date,
    presented_new_cards,
    learning_cards,
    progress,
):
    user = User(username=username)
    user.set_password(password)
    user.set_email(email, verified=False)
    db.session.add(user)
    db.session.flush()

    user_progress = UserProgress(
        user_id=user.id,
        base_new_cards_limit=base_new_cards_limit,
        new_cards_limit=new_cards_limit,
        new_cards_limit_last_updated=new_cards_limit_last_updated,
        daily_new_cards=daily_new_cards,
        last_new_cards_date=last_new_cards_date,
        presented_new_cards=presented_new_cards,
        learning_cards=learning_cards,
        progress=progress,
    )
    db.session.add(user_progress)
    db.session.commit()


            # if User.query.filter_by(email=email).first():
            #     flash('Email already registered', 'danger')
            #     session['_from_post'] = True
            #     return redirect(url_for('manage.email_management'))

    token = user.generate_email_verification_token()
    verification_link = url_for('home', token=token, _external=True)
    
    msg = Message('Verify Your Email',
                    recipients=[email])
    msg.body = f'''Please click on the following link to verify your email:
    {verification_link}
    
    If you did not request this email, please ignore it.'''
    
    try:
        mail.send(msg)
        db.session.commit()
        flash('Verification email sent. Please check your inbox.', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Error sending verification email.', 'danger')

    return user


def db_user_exists(username):
    return User.query.filter_by(username=username).first() is not None


def db_authenticate_user(username, password):
    user = User.query.filter_by(username=username).first()
    if not user:
        return None, "User does not exist"
    if not user.check_password(password):
        return None, "Incorrect password"
    return user, None

def db_get_stroke_entries(username, character):
    user = User.query.filter_by(username=username).first()
    if not user:
        return []
    return StrokeData.query.filter_by(
        user_id=user.id,
        character=character
    ).order_by(StrokeData.timestamp.desc()).all()

def db_get_all_character_strokes(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return []
    
    characters = (
        db.session.query(StrokeData.character)
        .filter_by(user_id=user.id)
        .distinct()
        .all()
    )
    
    return [char[0] for char in characters]


def db_add_stroke_data(chardata):
    # Insert the new stroke data into the database
    new_stroke_data = StrokeData.from_dict(chardata)
    db.session.add(new_stroke_data)
    db.session.commit()

    # Immediately check if the data was inserted
    inserted_data = StrokeData.query.filter_by( 
        user_id=new_stroke_data.user_id,
        character=new_stroke_data.character
    ).first()

    if inserted_data:
        print("Insert successful:", inserted_data)
    else:
        print("Insert failed!")



def db_init_app(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()


def db_get_all_public_notes(character, exclude_username):
    card = Card.query.filter_by(character=character).first()
    if not card:
        return []
    
    exclude_user = User.query.filter_by(username=exclude_username).first()
    exclude_user_id = exclude_user.id if exclude_user else None
    
    public_notes = UserNotes.query.filter(
        UserNotes.card_id == card.id,
        UserNotes.is_public == True,
        UserNotes.user_id != exclude_user_id
    ).join(User).all()
    
    return [
        {
            'username': note.user.username,
            'notes': note.notes
        }
        for note in public_notes
    ]
def db_get_user_note(username, character):
    card = Card.query.filter_by(character=character).first()
    if not card:
        return None, None
    
    user = User.query.filter_by(username=username).first()
    if not user:
        return None, None
    
    user_note = UserNotes.query.filter_by(
        user_id=user.id,
        card_id=card.id
    ).first()
    
    if user_note:
        return user_note.notes, user_note.is_public
    return None, None

    
def db_update_or_create_note(username, word, notes, is_public=False):
    # Get or create card
    card = Card.query.filter_by(character=word).first()
    if not card:
        card = Card(character=word)
        try:
            db.session.add(card)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return False, f"Error creating card: {str(e)}"

    # Get user
    user = User.query.filter_by(username=username).first()
    if not user:
        return False, f"User '{username}' not found"

    # Get or create note
    user_note = UserNotes.query.filter_by(
        user_id=user.id, 
        card_id=card.id
    ).first()
    
    try:
        if notes.strip() == '':
            if user_note:
                db.session.delete(user_note)
        else:
            if user_note:
                user_note.notes = notes
                user_note.is_public = is_public
            else:
                user_note = UserNotes(
                    user_id=user.id,  # Use user_id instead of username
                    card_id=card.id,
                    notes=notes,
                    is_public=is_public
                )
                db.session.add(user_note)
        
        db.session.commit()
        return True, None
    except Exception as e:
        db.session.rollback()
        return False, f"Error saving note: {str(e)}"

def db_store_user_value(username, key, value):
    try:
        user = User.query.filter_by(username=username).first()
        if not user:
            return False, f"User '{username}' not found"
            
        current_data = db_load_user_progress(username)
        
        if not current_data:
            return False, f"No progress found for user '{username}'"
        
        # Update the specific key
        current_data[key] = value
        
        # Save all progress data back
        success, message = db_save_user_progress(username, current_data)
        
        # Verify immediate state after save
        user_prog = user.progress
        
        # Load and verify
        loaded = db_load_user_value(username, key)
        
        return success, message
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in db_store_user_value: {str(e)}")
        return False, f"Error: {str(e)}"

def db_save_user_progress(username, progress_data):
    user = User.query.filter_by(username=username).first()
    if not user:
        return False, f"User '{username}' not found"
        
    user_prog = user.progress
    if user_prog:
        # Special handling for JSON fields
        for key, value in progress_data.items():
            value = copy.deepcopy(value)
            setattr(user_prog, key, value)
            flag_modified(user_prog, key)
    else:
        user_prog = UserProgress.from_dict(user, progress_data)
        db.session.add(user_prog)
    
    try:
        db.session.commit()
        # Verify the save immediately
        db.session.refresh(user_prog)
        return True, "Progress saved successfully"
    except Exception as e:
        db.session.rollback()
        return False, str(e)


def db_load_user_progress(username):
    user = User.query.filter_by(username=username).first()
    if not user or not user.progress:
        return {}
        
    user_prog = user.progress
    data = user_prog.to_dict()
    logger.info("Loaded progress data")
    
    if getshortdate() != data.get("new_cards_limit_last_updated"):
        data["new_cards_limit"] = data["base_new_cards_limit"]
        data["new_cards_limit_last_updated"] = getshortdate()

        user_prog.new_cards_limit = data["new_cards_limit"]
        user_prog.new_cards_limit_last_updated = data["new_cards_limit_last_updated"]
        db.session.commit()
    
    return data

def db_load_user_value(username, key):
    data = db_load_user_progress(username)
    return data.get(key)

def db_store_user_string(username, content):
    try:
        user = User.query.filter_by(username=username).first()
        if not user:
            return False, f"User '{username}' not found"
            
        user_string = user.user_string
        if user_string:
            user_string.content = content
        else:
            user_string = UserString(user_id=user.id, content=content)
            db.session.add(user_string)
        db.session.commit()
        return True, "String updated successfully"

    except SQLAlchemyError as e:
        db.session.rollback()
        return False, f"Database error: {str(e)}"

def db_get_user_string(username):
    try:
        user = User.query.filter_by(username=username).first()
        if not user:
            return ""
            
        user_string = user.user_string
        if user_string:
            return user_string.content
        return ""
    except SQLAlchemyError as e:
        return f"Database error: {str(e)}"
