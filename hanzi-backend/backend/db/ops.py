import logging
import requests
from urllib.parse import unquote
import copy
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm.attributes import flag_modified
from flask import request, redirect, url_for, flash
from datetime import datetime
from flask_mail import Mail, Message

from backend.db.extensions import db, mail
from backend.db.models import User, WordList, WordEntry, UserCustomDefinition
from backend.common import get_chars_info
from backend.common import getshortdate
from backend.common import DOMAIN

logger = logging.getLogger(__name__)


def db_create_user(
    username,
    password,
    email,
    metainfo={},
):
    user = User(username=username)
    user.set_password(password)
    if len(email) > 0:
        user.set_email(email, verified=False)
    
    metainfo['signup_date'] = datetime.now().isoformat()
    if metainfo:
        user.metainfo = metainfo

    new_set = WordList(name="Learning", user=user)
    new_entry = WordEntry(word="你好", list=new_set)

    db.session.add(user)
    db.session.add(new_entry)
    db.session.add(new_set)
    db.session.commit()

    if len(email) > 0:
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
        except Exception as e:
            db.session.rollback()
            flash('Error sending verification email.', 'danger')

    return user

def db_delete_user(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return
    if user.word_lists:
        for word_list in user.word_lists:
            db.session.delete(word_list)
    db.session.delete(user)
    db.session.commit()
    return True



def db_user_exists(username):
    return User.query.filter_by(username=username).first() is not None


def db_authenticate_user(username, password):
    user = User.query.filter_by(username=username).first()
    if not user:
        return None, "User does not exist"
    if not user.check_password(password):
        return None, "Incorrect password"
    return user, None


def db_delete_word_list(username, name):
    user = User.query.filter_by(username=username).first()
    if not user:
        return None
    
    word_list = WordList.query.filter_by(
        user_id=user.id,
        name=name
    ).first()
    
    if not word_list:
        return None
    
    db.session.delete(word_list)
    db.session.commit()
    return True

def db_update_wordlist_description(username, list_name, description):
    """Updates the description of a specific word list for a user."""
    user = User.query.filter_by(username=username).first()
    if not user:
        logger.error(f"User not found: {username}")
        return False

    word_list = WordList.query.filter_by(user_id=user.id, name=list_name).first()
    if not word_list:
        logger.error(f"Word list '{list_name}' not found for user '{username}'")
        return False

    try:
        word_list.description = description
        db.session.commit()
        logger.info(f"Description updated for word list '{list_name}' for user '{username}'")
        return True
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating description for word list '{list_name}': {e}")
        return False

def db_rename_word_list(username, current_name, new_name):
    user = User.query.filter_by(username=username).first()
    if not user:
        return None
    
    word_list = WordList.query.filter_by(
        user_id=user.id,
        name=current_name
    ).first()
    
    if not word_list:
        return None
    
    existing_list = WordList.query.filter_by(
        user_id=user.id,
        name=new_name
    ).first()
    
    if existing_list:
        return False
    
    word_list.name = new_name
    db.session.commit()
    return word_list


def db_get_word_list_names_only(username):
    if username and username != 'tempuser':
        user = User.query.filter_by(username=username).first()
        if not user:
            return []
        word_lists = WordList.query.filter_by(user_id=user.id).all()
        return [word_list.name for word_list in word_lists]
    return []


def db_get_word_list(username, wordlist_name="Learning set"):
    user = User.query.filter_by(username=username).first()
    if not user:
        return []
    wordlist = WordList.query.filter_by(
        user_id=user.id,
        name=wordlist_name
    ).first()
    if not wordlist:
        new_wordlist = db_create_word_list(username, wordlist_name)
        words = WordEntry.query.filter_by(list_id=new_wordlist.id).all()
        return words
    words = WordEntry.query.filter_by(list_id=wordlist.id).all()
    return [word.word for word in words]


def db_create_word_list(username, name):
    user = User.query.filter_by(username=username).first()
    #
    #created_at = db.Column(DateTime(timezone=True), server_default=func.now())
    #description = db.Column(db.String(500), nullable=True)
    new_set = WordList(name=name, user=user)
    db.session.add(new_set)
    db.session.commit()
    return new_set


def db_get_user_wordlists(username, with_data=True):
    custom_wordlists = {}
    if username and username != 'tempuser':
        user = User.query.filter_by(username=username).first()
        if not user:
            return None
        wordlists = WordList.query.filter_by(user_id=user.id).all()
        result = {}
        if with_data:
            for word_list in wordlists:
                # Ensure stable insertion order on fetch
                words = (
                    WordEntry.query
                    .filter_by(list_id=word_list.id)
                    .order_by(WordEntry.id.asc())
                    .all()
                )
                ordered = [word.word for word in words]
                result[word_list.name] = ordered
        custom_wordlists = {
            word_list.name: {
                'name': word_list.name,
                'timestamp': word_list.timestamp,
                'description': word_list.description,
                # Explicit order list to preserve insertion across JSON layers
                'order': result[word_list.name] if with_data else None,
                'chars': get_chars_info(result[word_list.name]) if with_data else None,
            } for word_list in wordlists
        }
    return custom_wordlists


def db_get_all_words_by_list_as_dict(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return None
    word_lists = WordList.query.filter_by(user_id=user.id).all()
    result = {}
    for word_list in word_lists:
        words = WordEntry.query.filter_by(list_id=word_list.id).all()
        result[word_list.name] = [word.word for word in words]
    return result

def db_remove_word_from_set(username, wordlist_name, word):
    user = User.query.filter_by(username=username).first()
    if not user:
        return None
    word_set = WordList.query.filter_by(
        user_id=user.id,
        name=wordlist_name
    ).first()
    if not word_set:
        return None
    word_entry = WordEntry.query.filter_by(
        list_id=word_set.id,
        word=word
    ).first()
    if not word_entry:
        return None
    db.session.delete(word_entry)
    db.session.commit()
    return word_entry

def db_add_words_to_set(username, wordlist_name, words):
    user = User.query.filter_by(username=username).first()
    if not user:
        return None
        
    word_set = WordList.query.filter_by(
        user_id=user.id, 
        name=wordlist_name
    ).first()
    
    if not word_set:
        return None
    
    added_words = []
    skipped_words = []
    
    # Get all existing words in this list to check against
    existing_words = set([entry.word for entry in WordEntry.query.filter_by(
        list_id=word_set.id
    ).all()])
    
    # Add new words that don't already exist
    for word in words:
        if word in existing_words:
            skipped_words.append(word)
            continue
            
        new_entry = WordEntry(word=word, list=word_set)
        db.session.add(new_entry)
        added_words.append(word)
        # Update our tracking set to handle duplicates in the input list
        existing_words.add(word)
    
    if added_words:  # Only commit if we actually added something
        db.session.commit()
    
    return {
        "added": added_words,
        "skipped": skipped_words,
        "wordlist": word_set
    }


def db_init_app(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()

def db_list_custom_definitions(username):
    """Return all custom definitions for a user as a list of dicts."""
    user = User.query.filter_by(username=username).first()
    if not user:
        return []
    defs = UserCustomDefinition.query.filter_by(user_id=user.id).all()
    result = []
    for d in defs:
        result.append({
            'hanzi': d.hanzi,
            'pinyin': d.pinyin or '',
            'english': d.english or ''
        })
    return result
def db_set_custom_definition(username, hanzi, pinyin=None, english=None):
    """Create or update a per-user custom definition for a hanzi entry.

    Returns a dict of the saved definition fields or (False, error) on failure.
    """
    try:
        user = User.query.filter_by(username=username).first()
        if not user:
            return False, f"User '{username}' not found"

        ucd = UserCustomDefinition.query.filter_by(user_id=user.id, hanzi=hanzi).first()
        if ucd:
            ucd.pinyin = pinyin
            ucd.english = english
        else:
            ucd = UserCustomDefinition(
                user_id=user.id,
                hanzi=hanzi,
                pinyin=pinyin,
                english=english,
            )
            db.session.add(ucd)

        db.session.commit()
        return {
            'hanzi': ucd.hanzi,
            'pinyin': ucd.pinyin,
            'english': ucd.english,
        }
    except SQLAlchemyError as e:
        db.session.rollback()
        return False, f"Database error: {str(e)}"


def db_delete_custom_definition(username, hanzi):
    """Delete a user's custom definition for the given hanzi."""
    try:
        user = User.query.filter_by(username=username).first()
        if not user:
            return False, f"User '{username}' not found"
        ucd = UserCustomDefinition.query.filter_by(user_id=user.id, hanzi=hanzi).first()
        if not ucd:
            return False, "Not found"
        db.session.delete(ucd)
        db.session.commit()
        return True, None
    except SQLAlchemyError as e:
        db.session.rollback()
        return False, f"Database error: {str(e)}"


def db_get_custom_definition(username, hanzi):
    try:
        user = User.query.filter_by(username=username).first()
        if not user:
            return None
        ucd = UserCustomDefinition.query.filter_by(user_id=user.id, hanzi=hanzi).first()
        if not ucd:
            return None
        return {
            'hanzi': ucd.hanzi,
            'pinyin': ucd.pinyin,
            'english': ucd.english,
        }
    except SQLAlchemyError:
        return None
