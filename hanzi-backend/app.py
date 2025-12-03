from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask import send_file
from flask import flash
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
from backend.db.models import User
from backend.db.ops import db_user_exists
from backend.db.ops import db_authenticate_user
from backend.db.ops import db_create_user
from backend.db.ops import db_get_word_list_names_only
from backend.db.ops import db_get_user_wordlists

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
from backend.common import auth_keys
from backend.common import DATA_DIR
from backend.routes.manage import validate_password

from backend.common import config
from hanziconv import HanziConv

from flask import send_file

import json
import os

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
        orig_char = char
        simplified = HanziConv.toSimplified(char)
        cinfo = get_char_info(orig_char, full=True)
        if not cinfo.get("pinyin"):
            cinfo = get_char_info(simplified, full=True)
        infos[char] = cinfo

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
    response = make_response({
        'message': '',
        **main_card_data(character),
        'chars_breakdown': chars_breakdown,
    })
    response.headers["Cache-Control"] = "public, max-age=31536000"
    return response

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


new_translations_path = 'data/new_translations.json'
cached_translations = {}
if os.path.exists(new_translations_path):
    cached_translations = json.load(open(new_translations_path, 'r'))

@app.errorhandler(404)
def page_not_found(e):
    return '', 404



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
    try:
        response = requests.post(url, headers=headers, json={"query": query})
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error querying search endpoint: {e}")
        return {"error": str(e)}

def trim_query(q, limit=30):
    q = q.strip()
    if len(q) <= limit:
        return q

    cut = q.rfind(" ", 0, limit + 1)
    if cut == -1:
        return q[:limit]
    return q[:cut]

@app.route('/api/search_results', methods=['GET', 'POST'])
@limiter.limit("10 per second")
def search_results():
    start_time = time.time()
    
    if request.method == 'POST':
        data = request.get_json()
        query = data.get('query', '') if data else ''
    else: 
        query = request.args.get('query', '')

    if query:
        query = trim_query(query, limit=30)

    upstream = get_search_results(query) if query else {}
    search_time = time.time() - start_time

    groups = upstream.get('groups') if isinstance(upstream, dict) else None
    # Backward compatibility if upstream still returns flat results
    if groups is None and isinstance(upstream, dict):
        groups = upstream.get('results', [])

    return jsonify({'results': groups or [], 'query': query, 'search_time': search_time})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5117, debug=True)
