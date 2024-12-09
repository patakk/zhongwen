import logging
from datetime import datetime, timezone
from urllib.parse import unquote

from sqlalchemy.exc import SQLAlchemyError

from backend.db.extensions import db
from backend.db.models import StrokeData, UserProgress, UserString, Card, UserNotes

logger = logging.getLogger(__name__)


def getshortdate():
    return datetime.now(timezone.utc).strftime("%Y%m%d")


def db_get_all_stroke_data(username):
    characters = db_get_all_character_strokes(username)

    result = {}
    for character in characters:
        stroke_data_entries = db_get_stroke_entries(username, character)
        character_attempts = []
        for entry in stroke_data_entries:
            character_attempts.append(
                {
                    "id": entry.id,
                    "strokes": entry.strokes,
                    "positioner": entry.positioner,
                    "mistakes": entry.mistakes,
                    "stroke_count": entry.stroke_count,
                    "timestamp": entry.timestamp.isoformat(),
                }
            )

        result[character] = character_attempts

    return result


def db_create_user(
    username,
    base_new_cards_limit,
    new_cards_limit,
    new_cards_limit_last_updated,
    daily_new_cards,
    last_new_cards_date,
    presented_new_cards,
    progress,
):
    user = UserProgress(
        username=username,
        base_new_cards_limit=base_new_cards_limit,
        new_cards_limit=new_cards_limit,
        new_cards_limit_last_updated=new_cards_limit_last_updated,
        daily_new_cards=daily_new_cards,
        last_new_cards_date=last_new_cards_date,
        presented_new_cards=presented_new_cards,
        progress=progress,
    )
    db.session.add(user)
    db.session.commit()


def db_user_exists(username):
    return UserProgress.query.filter_by(username=username).first() is not None


def db_get_stroke_entries(username, character):
    return StrokeData.query.filter_by(username=username, character=character).order_by(
        StrokeData.timestamp.desc()
    ).all()


def db_get_all_character_strokes(username):
    characters = (
        db.session.query(StrokeData.character)
        .filter_by(username=username)
        .distinct()
        .all()
    )
    characters = [char[0] for char in characters]
    return characters


def db_add_stroke_data(chardata):
    new_stroke_data = StrokeData.from_dict(chardata)
    db.session.add(new_stroke_data)
    db.session.commit()


def db_init_app(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()


def db_get_all_public_notes(character, exclude_username):
    card = Card.query.filter_by(character=character).first()
    if not card:
        return []
    
    public_notes = UserNotes.query.filter(
        UserNotes.card_id == card.id,
        UserNotes.is_public == True,
        UserNotes.username != exclude_username 
    ).all()
    
    return [
        {
            'username': note.username,
            'notes': note.notes
        }
        for note in public_notes
    ]



def db_get_user_note(username, character):
    card = Card.query.filter_by(character=character).first()
    if not card:
        return None, None
    
    user_note = UserNotes.query.filter_by(
        username=username,
        card_id=card.id
    ).first()
    
    if user_note:
        return user_note.notes, user_note.is_public
    return None, None

    
def db_update_or_create_note(username, word, notes, is_public=False):
    card = Card.query.filter_by(character=word).first()
    if not card:
        card = Card(character=word)
        try:
            db.session.add(card)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return False, f"Error creating card: {str(e)}"

    user_note = UserNotes.query.filter_by(
        username=username, 
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
                    username=username,
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



def save_user_progress(username, progress_data):
    user_prog = UserProgress.query.filter_by(username=username).first()
    if user_prog:
        for key, value in progress_data.items():
            setattr(user_prog, key, value)
    else:
        user_prog = UserProgress.from_dict(username, progress_data)
        db.session.add(user_prog)
    db.session.commit()


def load_user_progress(username):
    user_prog = UserProgress.query.filter_by(username=username).first()
    if user_prog:
        data = user_prog.to_dict()

        # Check if the new cards limit needs to be reset
        if getshortdate() != data.get("new_cards_limit_last_updated"):
            data["new_cards_limit"] = data["base_new_cards_limit"]
            data["new_cards_limit_last_updated"] = getshortdate()

            # Update the database with the new values
            user_prog.new_cards_limit = data["new_cards_limit"]
            user_prog.new_cards_limit_last_updated = data[
                "new_cards_limit_last_updated"
            ]
            db.session.commit()
        logger.info(f"User progress found for user '{username}'")
        return data


def load_user_value(username, key):
    user_prog = UserProgress.query.filter_by(username=username).first()
    if user_prog:
        if hasattr(user_prog, key):
            return getattr(user_prog, key)
        else:
            return None
    else:
        return None


def store_user_value(username, key, value):
    try:
        user_prog = UserProgress.query.filter_by(username=username).first()
        if user_prog:
            if hasattr(user_prog, key):
                setattr(user_prog, key, value)
                db.session.commit()
                return True, "Value updated successfully"
            else:
                return False, f"Attribute '{key}' does not exist in UserProgress model"
        else:
            return False, f"User '{username}' not found"
    except SQLAlchemyError as e:
        db.session.rollback()
        return False, f"Database error: {str(e)}"

def db_store_user_string(username, content):
    try:
        user_prog = UserProgress.query.filter_by(username=username).first()
        if not user_prog:
            return False, f"User '{username}' not found in UserProgress"
        user_string = UserString.query.filter_by(username=username).first()
        if user_string:
            user_string.content = content
        else:
            user_string = UserString(username=username, content=content)
            db.session.add(user_string)
        db.session.commit()
        return True, "String updated successfully"

    except SQLAlchemyError as e:
        db.session.rollback()
        return False, f"Database error: {str(e)}"

def db_get_user_string(username):
    try:
        user_string = UserString.query.filter_by(username=username).first()
        if user_string:
            return user_string.content
        else:
            return ""
    except SQLAlchemyError as e:
        return f"Database error: {str(e)}"
