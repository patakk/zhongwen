from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask import send_file
from flask import flash
from flask_mail import Mail, Message
from datetime import timedelta
from datetime import datetime
from datetime import timezone
from functools import wraps
from urllib.parse import unquote
import logging
import random
import json
import copy
from nltk.stem import WordNetLemmatizer
import regex
import time
import os
import io
from flask import request, jsonify
from flask import make_response
import glob
import requests
from backend.decorators import session_required
from backend.decorators import hard_session_required
from backend.db.models import User
from backend.db.ops import db_user_exists
from backend.db.ops import db_authenticate_user
from backend.db.ops import db_create_user
from backend.db.ops import db_get_all_stroke_data
from backend.db.ops import db_store_user_string
from backend.db.ops import db_get_user_string
from backend.db.ops import db_get_all_words_by_list_as_dict
from backend.db.ops import db_get_word_list_names_only
from backend.db.ops import db_get_user_wordlists
from backend.db.ops import db_delete_user

from backend.common import DECKS_INFO
from backend.common import CARDDECKS
from backend.common import DECOMPOSE_CACHE
from backend.common import DECKNAMES
from backend.common import STROKES_CACHE
from backend.common import RELATED_CONCEPTS
from backend.common import OPPOSITE_CONCEPTS
from backend.common import get_recursive_decomposition

from backend.common import get_tatoeba_page
from backend.common import send_bot_notification
from backend.common import default_darkmode
from backend.common import get_pinyin
from backend.common import get_char_info
from backend.common import get_chars_info
from backend.common import auth_keys
from backend.common import DATA_DIR
from backend.routes.manage import validate_password

from backend.common import config

from flask import send_file

import json
import os
import secrets
from backend.routes.puzzles import add_sorted_decknames_to_context

from backend.setup import create_app
from flask_limiter.util import get_remote_address
from flask_limiter import Limiter

app = create_app()
application = app


def get_remote_address():
    if request.headers.get('CF-Connecting-IP'):
        return request.headers.get('CF-Connecting-IP')
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0]
    return request.remote_addr


limiter = Limiter(
    key_func=get_remote_address,
    app=app,
)

ROOT_DIR = config.get('paths').get('root')
log_dir = os.path.join(ROOT_DIR, 'logs')
spam_log_path = os.path.join(ROOT_DIR, config.get('logging').get('spam_log').get('file'))
app_log_path = os.path.join(ROOT_DIR, config.get('logging').get('app_log').get('file'))

for path in [os.path.dirname(spam_log_path), os.path.dirname(app_log_path)]:
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)

spam_logger = logging.getLogger("flask-antispam")
spam_logger.setLevel(config.get('logging').get('spam_log').get('level'))
spam_file_handler = logging.FileHandler(os.path.join(ROOT_DIR, config.get('logging').get('spam_log').get('file')))
spam_file_handler.setFormatter(logging.Formatter("%(asctime)s - %(message)s"))
spam_logger.addHandler(spam_file_handler)

logger = logging.getLogger(__name__)
logger.setLevel(config.get('logging').get('app_log').get('level'))
app_file_handler = logging.FileHandler(os.path.join(ROOT_DIR, config.get('logging').get('app_log').get('file')))
app_file_handler.setFormatter(logging.Formatter("%(asctime)s - %(message)s"))
logger.addHandler(app_file_handler)

logger.info("Application root directory: " + app.config['APPLICATION_ROOT'])


@app.errorhandler(500)
def handle_500(error):
    return "Something went wrong, please try again later.", 500



def breakdown_chars(word):
    infos = {}
    for char in word:
        simplified = HanziConv.toSimplified(char)
        infos[char] = get_char_info(simplified, full=True)

        if char in DECOMPOSE_CACHE:
            infos[char]['recursive'] = get_recursive_decomposition(char)
            if 'present_in' in DECOMPOSE_CACHE[char]:
                infos[char]['present_in'] = copy.deepcopy(DECOMPOSE_CACHE[char]['present_in'][:50])
        infos[char]['strokes'] = STROKES_CACHE.get(char)
        infos[char]['character'] = char
    return infos



@app.route('/api/get_card_data', methods=['GET', 'POST'])
def get_card_data():
    if request.method == 'POST':
        data = request.get_json()
        character = data.get('character') if data else None
    else:
        character = request.args.get('character')

    if not character:
        return jsonify({'message': 'No cards available', 'chars_breakdown': None})
    chars_breakdown = breakdown_chars(character)
    return jsonify({'message': '', **main_card_data(character), 'chars_breakdown': chars_breakdown})


@app.before_request
def before_request():
    if request.path.startswith('/static/'):
        return
    if request.path.startswith('/static/'):
        return


from collections import defaultdict


    


def main_card_data(character):
    username = session.get('username')
    simple_info = get_char_info(character)

    res = get_tatoeba_page(character, 0)
    #res = None
    if res:
        examples, is_last = res
    else:
        examples, is_last = [], False

    return {
        "character": character,
        "pinyin": simple_info.get('pinyin', get_pinyin(character)),
        "english": simple_info.get('english', 'N/A'),
        "examples": examples,
        "similars": [{word: get_char_info(word) for word in RELATED_CONCEPTS.get(character, [])}],
        "opposites": [{word: get_char_info(word) for word in OPPOSITE_CONCEPTS.get(character, [])}],
        "is_last": is_last,
        "html": "IMPLEMENT ME", #data.get('examples', ''),
    }


@app.route('/log', methods=['POST'])
def log():
    data = request.json
    if data and 'log' in data:
        log_message = data['log']
        # Do something with the log message, e.g., print it or save it to a file
        logger.info(f"[LOG] {log_message}")
        return jsonify({"status": "success", "message": "Log received"}), 200
    return jsonify({"status": "error", "message": "Invalid log data"}), 400


@app.route('/hanziviz')
def hanziviz():
    characters = {}
    for key in CARDDECKS:
        if 'hsk' in key:
            for character in CARDDECKS[key]:
                characters[character] = CARDDECKS[key][character]
    return render_template('hanziviz.html', darkmode=session.get('darkmode', default_darkmode), characters=characters)


# @app.route('/check_session')
# @session_required
# def check_session():
#     sess = dict(session)
#     sess = {**sess, **db_load_user_progress(session['username'])}
#     return Response(
#         json.dumps(sess, ensure_ascii=False, indent=4),
#         mimetype='application/json'
#     )

@app.route('/get_crunch')
def get_crunch():
    return send_file('data/crunch.mp3', mimetype='audio/mpeg')

@limiter.limit("25 per minute")
@app.route('/api/login', methods=['POST'])
@session_required
def login():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Missing username or password'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    settings = {
        'darkmode': session.get('darkmode', False),
        'deck': session.get('deck', 'hsk1'),
        'font': session.get('font', 'Noto Sans Mono')
    }

    try:
        user, error = db_authenticate_user(username, password)
        if error or not user:
            return jsonify({'error': 'Invalid username or password'}), 401

        session.clear()
        session.permanent = True
        session.update(settings)
        session['user_id'] = user.id
        session['username'] = username
        session['current_card'] = None
        session['authenticated'] = True

        # Example: Add extra info about the user for frontend state
        result = {
            'authStatus': True,
            'username': username,
            'image': getattr(user, 'image', ''),           # if you store image
            'profile': getattr(user, 'profile', {}),       # if you store profile info
            'customDecks': getattr(user, 'custom_decks', [])
        }
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route("/get_turnstile_key", methods=["GET"])
def get_turnstile_key():
    return jsonify({"site_key": auth_keys['TURNSTILE_SITE_KEY']})


def verify_turnstile(token, remoteip):
    secret = auth_keys['TURNSTILE_SECRET_KEY']
    payload = {
        'secret': secret,
        'response': token,
        'remoteip': remoteip
    }
    r = requests.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', data=payload)
    return r.json()
from flask import request, jsonify, session, redirect, url_for, render_template


@limiter.limit("25 per minute")
@app.route('/api/register', methods=['GET', 'POST'])
def register():
    # Dual mode: JSON or classic form
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            username = data.get('username', '').strip()
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            confirm_password = data.get('confirm_password', '')
            token = data.get('cf_turnstile_response', None)  # for future captcha support
        else:
            username = request.form.get('username', '').strip()
            email = request.form.get('email', '').strip().lower()
            password = request.form.get('password', '')
            confirm_password = request.form.get('confirm_password', '')
            token = request.form.get("cf-turnstile-response")
        forwarded_ip = request.headers.get('X-Forwarded-For', request.remote_addr)

        # CAPTCHA - comment out or implement if needed for SPA
        # turnstile_result = verify_turnstile(token, forwarded_ip)
        # if token and not turnstile_result.get("success", True):
        #     return jsonify({"error": "Captcha failed"}), 400

        settings = {
            'darkmode': session.get('darkmode', False),
            'deck': session.get('deck', 'hsk1'),
            'font': session.get('font', 'Noto Sans Mono')
        }

        # --- Validation ---
        if password != confirm_password:
            error_msg = "Passwords do not match"
            if request.is_json: return jsonify({"error": error_msg}), 400
            flash(error_msg, "error")
            return redirect(url_for("register"))

        if db_user_exists(username):
            error_msg = "Username unavailable"
            if request.is_json: return jsonify({"error": error_msg}), 409
            flash(error_msg, "error")
            logger.warning(f"Registration attempt with existing username: {username}")
            session['authenticated'] = False
            return redirect(url_for('register'))
        
        if email:
            if "testguru" in email:
                log_message = f"BLOCKED REGISTRATION [IP={forwarded_ip}] [EMAIL={email}]"
                spam_logger.warning(log_message)
                return jsonify({"error": "Email not allowed"}), 403 if request.is_json else ("Blocked registration attempt", 403)
            
            existing_email_user = User.query.filter_by(email=email).first()
            if existing_email_user:
                if existing_email_user.google_id:
                    error_msg = "This email is already linked to a Google account. Please sign in with Google."
                else:
                    error_msg = "This email is already registered. Please log in or use a different email."
                if request.is_json: return jsonify({"error": error_msg}), 409
                flash(error_msg, "error")
                logger.warning(f"Registration attempt with existing email: {email}")
                return redirect(url_for('register'))

        is_valid, msg = validate_password(password)
        if not is_valid:
            if request.is_json: return jsonify({"error": msg}), 400
            flash(msg, "error")
            return redirect(url_for("register"))

        # --- Create user ---
        try:
            user = db_create_user(
                username=username,
                password=password,
                email=email,
            )

            session.clear()
            session.permanent = True
            session.update(settings)
            session['user_id'] = user.id
            session['username'] = username
            session['current_card'] = None
            session['authenticated'] = True

            # optionally: send email notification, etc
            if len(email) > 0:
                message = f"New user created: {username}. Email: {email}."
            else:
                message = f"New user created: {username}. No email provided."
            send_bot_notification(message)
            logger.info(f"New user registered successfully: {username}")

            result = {
                'authStatus': True,
                'username': username,
                'image': getattr(user, 'profile_pic', ''),
                'email': user.email,
                'email_verified': getattr(user, 'email_verified', False),
                'google_id': getattr(user, 'google_id', None),
                'profile_pic': getattr(user, 'profile_pic', None),
                'custom_deck_names': getattr(user, 'custom_decks', []),
            }
            if request.is_json:
                return jsonify(result), 201

            # Classic HTML fallback
            return redirect(url_for('home'))
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            if request.is_json:
                return jsonify({'error': 'Error creating account'}), 500
            flash('Error creating account', 'error')
            return redirect(url_for('register'))

    # GET to render classic page if user doesn't use SPA
    return render_template('register.html')


@app.route('/api/logout')
@session_required
def logout():
   session.clear()  # This clears everything in the session, including flash messages
   return redirect(url_for('home'))


def get_app_context():
    querydeck = request.args.get('wordlist')
    if not querydeck:
        querydeck = 'hsk1'
    logger.info(f"Query deck: {querydeck}")

    username = session.get('username')

    cc = {
        'hsk1': {
            'name': 'HSK 1',
            'chars': {
                "我": {'character': "我", 'pinyin': ["wǒ"], 'english': ["I"]},
                "你": {'character': "你", 'pinyin': ["nǐ"], 'english': ["you"]},
                "他": {'character': "他", 'pinyin': ["tā"], 'english': ["he"]},
                "她": {'character': "她", 'pinyin': ["tā"], 'english': ["she"]},
                "它": {'character': "它", 'pinyin': ["tā"], 'english': ["it"]},
                "是": {'character': "是", 'pinyin': ["fhì"], 'english': ["is"]},
                "不": {'character': "不", 'pinyin': ["bù"], 'english': ["not"]},
            }
        }
    }



    user_wordlists_data = []
    if username:
        user_wordlists_data = db_get_user_wordlists(username, with_data=False)

    custom_decks_data = []
    if user_wordlists_data:
        custom_decks_data = [
            {
                'name': user_wordlists_data.get(wl, {}).get('name', wl),
                'description': user_wordlists_data.get(wl, {}).get('description', ''),
                'timestamp': user_wordlists_data.get(wl, {}).get('timestamp', ''),
            }
            for wl in user_wordlists_data
        ]


    
    user_wordlists = []
    if username:
        user_wordlists = db_get_word_list_names_only(username)
    if user_wordlists:
        user_wordlists = {wl: wl for wl in user_wordlists}
    for wl in user_wordlists:
        DECKNAMES[wl] = user_wordlists[wl]

    # wordlists_words = db_get_all_words_by_list_as_dict(username) or {}
    # for wl in wordlists_words:
    #     nww = []
    #     for w in wordlists_words[wl]:
    #         nww.append(get_char_info(w))
    #     wordlists_words[wl] = nww

    if user_wordlists:
        user_wordlists = {wl: wl for wl in user_wordlists}
        hsk_keys = [k for k in DECKNAMES.keys() if 'hsk' in k]
        nonhsk_keys = [k for k in DECKNAMES.keys() if 'hsk' not in k and k not in user_wordlists]
        decknames_sorted = list(sorted(user_wordlists.keys())) + list(sorted(hsk_keys)) + list(sorted(nonhsk_keys))
    else:
        hsk_keys = [k for k in DECKNAMES.keys() if 'hsk' in k]
        nonhsk_keys = [k for k in DECKNAMES.keys() if 'hsk' not in k]
        decknames_sorted = list(sorted(hsk_keys)) + list(sorted(nonhsk_keys))
    decknames_sorted_with_name = {deck: DECKNAMES[deck] for deck in decknames_sorted}

    user = User.query.filter_by(username=username).first()
    google_id = user.google_id if user else None
    profile_pic = user.profile_pic if user else None

    return {
        "username": session.get("username"),
        "darkmode": session.get("darkmode", default_darkmode),
        "wordlist": "hsk1",
        "inputdeck": querydeck,
        "inputedeckdata": cc,
        "custom_deck_names": custom_decks_data,
        "decknames_sorted_with_name": decknames_sorted_with_name,
        "google_id": google_id,
        "profile_pic": profile_pic,
        # "wordlists_words": wordlists_words,
    }

# @app.route('/')
# @session_required
# def home():
#     return send_file('static/dist/index.html')

@app.route('/api/get_user_data')
@session_required
def get_user_data():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({})

    user = User.query.get(user_id)
    if not user:
        # User not found in DB (potentially deleted), clear session
        session.clear()
        return jsonify({'authStatus': False}) # Indicate logged out

    username = user.username
    user_wordlists_data = []
    if username:
        user_wordlists_data = db_get_user_wordlists(username, with_data=False)
    custom_decks_data = []
    if user_wordlists_data:
        custom_decks_data = [
            {
                'name': user_wordlists_data.get(wl, {}).get('name', wl),
                'description': user_wordlists_data.get(wl, {}).get('description', ''),
                'timestamp': user_wordlists_data.get(wl, {}).get('timestamp', ''),
            }
            for wl in user_wordlists_data
        ]

    # User exists, return their data
    user_data = {
        'authStatus': True,
        'username': user.username,
        'google_id': user.google_id,
        'profile_pic': user.profile_pic,
        'email': user.email,
        'email_verified': user.email_verified,
        'has_password': user.password_hash is not None, 
        "custom_deck_names": custom_decks_data,
        "theme": user.get_metainfo("theme", None)  # Get theme from metainfo or return None if not set
    }
    return jsonify(user_data)


@app.route('/api/get_custom_decks', methods=['POST'])
@session_required
def get_custom_decks():
    if request.method == 'OPTIONS':
        return '', 200
    
    username = session.get('username')
    if not username:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Check if user still exists in database
    try:
        user = User.query.filter_by(username=username).first()
        if not user:
            # User no longer exists in database, clear session and return error
            session.clear()
            return jsonify({'error': 'User account no longer exists', 'authStatus': False}), 401
    except Exception as e:
        session.clear()
        logger.error(f"Error fetching user data: {str(e)}")
        return jsonify({'error': 'User account no longer exists', 'authStatus': False}), 401

    try:
        custom_wordlists = db_get_user_wordlists(username, with_data=True)
        cc = {}
        for wl in custom_wordlists:
            cc[wl] = {}
            chars = custom_wordlists[wl]['chars']
            order = custom_wordlists[wl].get('order', [])
            cc[wl]['order'] = order
            cc[wl]['chars'] = chars
        return jsonify(cc)
    except Exception as e:
        logger.error(f"Error fetching custom dictionary data: {str(e)}")
        # If it's a database-related error about missing user data, clear session
        if "no such table" in str(e) or "user" in str(e).lower():
            session.clear()
            return jsonify({'error': 'User data not found', 'authStatus': False}), 401
        return jsonify({'error': 'Internal server error'}), 500


@app.route("/api/get_decks")
def get_decks():
    json_path = f"{DATA_DIR}/decks_cache.json"
    response = send_file(json_path)
    response.headers["Cache-Control"] = "public, max-age=31536000"
    return response


from backend.routes.puzzles import get_common_context

'''
@puzzles_bp.route("/hanzitest_pinyin")
@session_required
def hanzitest_pinyin():
    characters = dict(CARDDECKS[session["deck"]].items())
    context = get_common_context()
    context["characters"] = characters
    return render_template("puzzles/hanzitest_pinyin.html", **context)
'''


@app.route('/hanziwriting')
@session_required
def hanziwriting():
    context = get_common_context()
    add_sorted_decknames_to_context(session.get('username'), context)
    return render_template("hanziquiz.html", **context)

# @app.route('/convert')
# @session_required
# def convert():
#     return render_template('convert.html', darkmode=session.get('darkmode', default_darkmode), username=session.get('username'), convertedText=db_get_user_string(session['username']), decks=DECKS_INFO, wordlist=session['deck'])

@app.route('/convert2')
@session_required
def convert2():
    return render_template('convert2.html', darkmode=session.get('darkmode', default_darkmode), username=session.get('username'), convertedText=db_get_user_string(session['username']), decks=DECKS_INFO, wordlist=session['deck'])

@app.route('/convert3')
@session_required
def convert3():
    convertedText = db_get_user_string(session['username'])
    chars = set(''.join(convertedText.split()))
    chars = chars.intersection(stroke_chars)
    char_data = {char : {'strokes': STROKES_CACHE[char], 'pinyin': get_pinyin(char)} for char in chars}
    
    lines = convertedText.split('\n')
    translations = get_translations(lines)

    return render_template('convert3.html', darkmode=session.get('darkmode', default_darkmode), username=session.get('username'), convertedText=convertedText, dataPerCharacter=char_data, decks=DECKS_INFO, wordlist=session['deck'], transPerLine=translations)

@app.route('/convert')
@session_required
def convert():
    convertedText = db_get_user_string(session['username'])
    chars = set(''.join(convertedText.split()))
    chars = chars.intersection(stroke_chars)
    char_data = {char : {'strokes': STROKES_CACHE[char], 'pinyin': get_pinyin(char)} for char in chars}
    
    lines = convertedText.split('\n')
    translations = get_translations(lines)

    return render_template('convert.html', darkmode=session.get('darkmode', default_darkmode), username=session.get('username'), convertedText=convertedText, dataPerCharacter=char_data, decks=DECKS_INFO, wordlist=session['deck'], transPerLine=translations)




@app.route('/stories')
@session_required
def stories():
    username = session.get('username')
    first_story = all_stories[stories_names[0]]
    first_chapter = first_story['chapters_data'][first_story['chapters_list'][0]['uri']]
    chars = set(''.join([''.join(ls) for ls in first_chapter['hanzi']]) + ''.join(first_chapter['name']))
    words = []
    for line in first_chapter['hanzi']:
        words += line
    words += first_chapter['name']
    chars = chars.intersection(stroke_chars)
    char_data = {char : {'strokes': STROKES_CACHE[char], 'chardata': get_char_info(char)} for char in chars}
    word_data = {word: get_char_info(word) for word in words}
    all_chapters = [[chapter['title'] for chapter in all_stories[story_name]['chapters_list']] for story_name in stories_names]
    return render_template('stories.html', darkmode=session.get('darkmode', default_darkmode), chapter=first_chapter, chapters=all_chapters, stories=stories_names, username=session.get('username'), dataPerCharacter=char_data, decks=DECKS_INFO, wordlist=session['deck'], word_data=word_data, custom_deck_names=db_get_word_list_names_only(username))

@app.route('/get_story/<int:story_index>/<int:chapter_index>')
@session_required
def get_story(story_index, chapter_index):
    selected_story = all_stories[stories_names[story_index-1]]
    chapter_list = selected_story['chapters_list']
    chapter_data = selected_story['chapters_data']
    if 1 <= chapter_index <= len(chapter_list):
        chapter = chapter_data[chapter_list[chapter_index-1]['uri']]
        chars = set(''.join([''.join(ls) for ls in chapter['hanzi']]) + ''.join(chapter['name']))
        words = []
        for line in chapter['hanzi']:
            words += line
        words += chapter['name']
        chars = chars.intersection(stroke_chars)
        char_data = {char: {'pinyin': get_pinyin(char)} for char in chars}
        word_data = {word: get_char_info(word) for word in words}
        return jsonify({
            'chapter': chapter,
            'char_data': char_data,
            'word_data': word_data
        })
    else:
        return jsonify({'error': 'Story index out of range'}), 404


@app.route('/get_story_strokes/<int:story_index>/<int:chapter_index>')
@session_required
def get_story_strokes(story_index, chapter_index):
    selected_story = all_stories[stories_names[story_index-1]]
    chapter_list = selected_story['chapters_list']
    chapter_data = selected_story['chapters_data']
    if 1 <= chapter_index <= len(chapter_list):
        chapter = chapter_data[chapter_list[chapter_index-1]['uri']]
        chars = set(''.join([''.join(ls) for ls in chapter['hanzi']]) + ''.join(chapter['name']))
        chars = chars.intersection(stroke_chars)
        stroke_data = {char: STROKES_CACHE[char] for char in chars}
        return jsonify(stroke_data)
    else:
        return jsonify({'error': 'Story index out of range'}), 404



@app.route('/api/get_present_in_chunk', methods=['GET'])
def get_present_in_chunk():
    character = request.args.get('character')
    chunk_index = request.args.get('chunk_index', 0)
    
    try:
        chunk_index = int(chunk_index)
    except ValueError:
        chunk_index = 0
    
    chunk_size = 50
    start_index = chunk_index * chunk_size
    
    if not character or character not in DECOMPOSE_CACHE or 'present_in' not in DECOMPOSE_CACHE[character]:
        return jsonify({'characters': [], 'has_more': False})
    
    present_in = DECOMPOSE_CACHE[character].get('present_in', [])
    characters_chunk = present_in[start_index:start_index + chunk_size]
    has_more = (start_index + chunk_size) < len(present_in)
    
    return jsonify({
        'characters': characters_chunk,
        'has_more': has_more,
        'total_count': len(present_in)
    })


def get_charset(text):
    charset = [c for c in text if c not in ' \n']
    charset = set(''.join(text.split()))
    charset = charset.intersection(stroke_chars)
    return charset

new_translations_path = 'data/new_translations.json'
cached_translations = {}
if os.path.exists(new_translations_path):
    cached_translations = json.load(open(new_translations_path, 'r'))

def get_translations(lines):
    ai_input = []
    ai_translations = []
    for line in lines:
        if line.strip() == '':
            pass
            ai_translations.append('')
        elif line in cached_translations:
            ai_translations.append(cached_translations[line])
        else:
            ai_translations.append('<translation>')
            ai_input.append(line)
    if len(ai_input) == 0:
        return ai_translations
    prompt = '''
        you are a chinese knowledge genius translator, and you behave like a software the takes as input an array of strings, and outputs the complete translations, but each in one line. Your output must under all circumsatnces always simply be these translated lines, nothing else. No comments or anything. Here's the aray, you simply output the lines which I will parse (output raw text in each line): ''' + str(ai_input) 
    api_key = auth_keys.get("OPENAI_API_KEY_ZHONG_WEN")
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    data = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.5
    }

    response = requests.post(url, headers=headers, json=data)
    data = response.json()['choices'][0]['message']['content']
    translations_wos = data.split('\n')
    translations = []

    for i, line in enumerate(lines):
        ai_translation = ai_translations[i]
        if ai_translation == '<translation>':
            tw = translations_wos.pop(0)
            if tw not in cached_translations:
                cached_translations[line] = tw
            translations.append(tw)
        else:
            translations.append(ai_translation)
    
    with open(new_translations_path, 'w') as f:
        f.write(json.dumps(cached_translations, ensure_ascii=False, indent=4))
    
    # for i, line in enumerate(lines):
    #     if line.strip() == '':
    #         translations.append('')
    #     else:
    #         tw = translations_wos[tidx]
    #         if tw not in cached_translations:
    #             cached_translations[line] = tw
    #         translations.append(tw)
    #         tidx += 1

    assert len(translations) == len(lines)
    return translations
    

@app.errorhandler(404)
def page_not_found(e):
    return '', 404


import re
def remove_tones(pinyin):
    return re.sub(r'[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]', lambda m: 'aeiouü'['āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'.index(m.group()) // 4], pinyin)

def remove_all_numbers(pinyin):
    return re.sub(r'\d', '', pinyin)


@app.route('/deviceinfo')
def deviceinfo():
    return render_template('deviceinfo.html')


from pypinyin import lazy_pinyin, Style

from hanziconv import HanziConv

def move_tone_number_to_end(pinyin):
    return ''.join([char for char in pinyin if char not in '1234']) + ''.join([char for char in pinyin if char in '1234'])

   


# fuzzy_pinyin_choices = list(dictionary.pinyin_index_toneless.keys())
# fuzzy_english_choices = list(dictionary.english_index.keys())

# def fuzzy_pinyin_search(query, limit=5):
#     results = fuzz_process.extract(query, fuzzy_pinyin_choices, limit=limit)
#     return [key for key, score, _ in sorted(results, key=lambda x: x[1], reverse=True) if score > 70]

# def fuzzy_english_search(query, limit=5):
#     results = fuzz_process.extract(query, fuzzy_english_choices, limit=limit)
#     return [key for key, score, _ in sorted(results, key=lambda x: x[1], reverse=True) if score > 70]


def get_search_results(query):
    url = "http://127.0.0.1:8001/search"
    headers = {"X-API-Key": auth_keys.get('ZHONGWEN_SEARCH_KEY', '')}
    params = {"query": query}
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error querying search endpoint: {e}")
        return {"error": str(e)}


@app.route('/api/search_results', methods=['GET', 'POST'])
@limiter.limit("10 per second")
def search_results():
    start_time = time.time()
    
    if request.method == 'POST':
        data = request.get_json()
        query = data.get('query', '') if data else ''
    else: 
        query = request.args.get('query', '')

    results = get_search_results(query) if query else []
    search_time = time.time() - start_time

    return jsonify({'results': results, 'query': query, 'search_time': search_time})

    
@app.route('/hanzi_strokes_history')
@session_required
# @hard_session_required
def hanzi_strokes_history():
    strokes_per_character = db_get_all_stroke_data(session['username'])
    return render_template('hanzistats.html', darkmode=session.get('darkmode', default_darkmode), username=session.get('username'), decks=DECKS_INFO, strokes_per_character=strokes_per_character)

@app.route('/hanzi_strokes_charlist')
@session_required
# @hard_session_required
def hanzi_strokes_charlist():
    strokes_per_character = db_get_all_stroke_data(session['username'])
    return jsonify(list(strokes_per_character.keys()))
    
@app.route('/strokerender')
# @hard_session_required
def strokerender():
    return render_template('strokerender.html')
    

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5117, debug=True)
