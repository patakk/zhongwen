from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask import send_file
from flask import abort
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
import string
from nltk.stem import WordNetLemmatizer
import regex
import time
import os
import io
from flask import request, jsonify
import glob
import requests
from backend.decorators import session_required
from backend.decorators import hard_session_required
from backend.decorators import timing_decorator
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

from backend.common import DECKS_INFO
from backend.common import CARDDECKS
# from backend.common import CARDDECKS_W_PINYIN
from backend.common import DECKNAMES
from backend.common import STROKES_CACHE
from backend.common import get_tatoeba_page
from backend.common import send_bot_notification
from backend.common import default_darkmode

from backend.common import get_pinyin
from backend.common import get_char_info
from backend.common import get_chars_info
from backend.common import auth_keys
from backend.routes.manage import validate_password
# from rapidfuzz import process as fuzz_process

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


log_dir = "/home/patakk/logs"
log_file = os.path.join(log_dir, "flask-antispam.log")
spam_logger = logging.getLogger("flask-antispam")
spam_logger.setLevel(logging.WARNING)
spam_file_handler = logging.FileHandler(log_file)
spam_file_handler.setFormatter(logging.Formatter("%(asctime)s - %(message)s"))
spam_logger.addHandler(spam_file_handler)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

logger.info("Application root directory: " + app.config['APPLICATION_ROOT'])


# stroke_jsons = glob.glob('static/strokes_data/*.json')
# stroke_chars = set([os.path.basename(j).split('.')[0] for j in stroke_jsons])


def breakdown_chars(word):
    infos = {}
    for char in word:
        infos[char] = get_char_info(char, full=True)
    return infos


@app.errorhandler(500)
def handle_500(error):
    return "Something went wrong, please try again later.", 500




@app.route('/get_card_data')
@session_required
def get_card_data():
    character = request.args.get('character')
    message = ''
    if not character:
        return jsonify({'message': 'No cards available', 'chars_breakdown': None})
    chars_breakdown = breakdown_chars(character)
    return  jsonify({'message': message, **main_card_data(character), 'chars_breakdown': chars_breakdown})

@app.before_request
def before_request():
    if request.path.startswith('/static/'):
        return
    

@app.route('/get_simple_char_data')
@session_required
def get_simple_char_data():
    character = request.args.get('character')
    cdata = {
        "character": character,
        **get_char_info(character),
    }
    
    return  jsonify({'message': 'success', **cdata})


from collections import defaultdict


    

@app.route('/account')
@hard_session_required
def account():
    username = request.args.get('user', session.get('username'))

    if not username:
        return "User or deck not specified", 400

    wordlists_words = db_get_all_words_by_list_as_dict(username) or {}
    for wl in wordlists_words:
        nww = []
        for w in wordlists_words[wl]:
            nww.append(get_char_info(w))
        wordlists_words[wl] = nww

    google_id = User.query.filter_by(username=username).first().google_id
    profile_pic = User.query.filter_by(username=username).first().profile_pic

    return render_template('account.html', darkmode=session.get('darkmode', default_darkmode), username=session.get('username'), decks=DECKS_INFO, custom_deck_names=db_get_word_list_names_only(username), wordlists_words=wordlists_words, google_id=google_id, profile_pic=profile_pic)


def main_card_data(character):
    username = session.get('username')
    simple_info = get_char_info(character)

    # res = get_tatoeba_page(character, 0)
    res = None
    if res:
        examples, is_last = res
    else:
        examples, is_last = [], False

    return {
        "character": character,
        "pinyin": simple_info.get('pinyin', get_pinyin(character)),
        "english": simple_info.get('english', 'N/A'),
        "examples": examples,
        "is_last": is_last,
        "html": "IMPLEMENT ME", #data.get('examples', ''),
    }

@app.route('/version')
def version():
    version_file = 'version'
    if os.path.exists(version_file):
        try:
            with open(version_file, 'r') as f:
                return f.read().strip()
        except IOError:
            return 'Error reading version file', 500
    return 'unknown'

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
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        
        settings = {
            'darkmode': session.get('darkmode', False),
            'deck': session.get('deck', 'hsk1'),
            'font': session.get('font', 'Noto Sans Mono')
        }
        
        # Login
        try:
            user, error = db_authenticate_user(username, password)
            if error:
                flash('Invalid username or password', 'error')  # Generic error
                logger.warning(f"Failed login attempt for username: {username}")
                return redirect(url_for('login'))
            
            session.clear()
            session.permanent = True
            session.update(settings)
            session['user_id'] = user.id
            session['username'] = username
            session['current_card'] = None
            session['authenticated'] = True
            
            logger.info(f"Successful login for user: {username}")
            return redirect(url_for('home'))
            
        except Exception as e:
            flash('An error occurred', 'error')
            logger.error(f"Login error: {str(e)}")
            return redirect(url_for('login'))
            
    return render_template('login.html')


BANNED_IPS_FILE = 'banned_ips.json'
username_attempts = {}
banned_ips = set()

def load_banned_ips():
    global banned_ips
    try:
        with open(BANNED_IPS_FILE, 'r') as f:
            banned_ips = set(json.load(f))
        logger.info(f"Loaded {len(banned_ips)} banned IPs from file")
    except FileNotFoundError:
        logger.warning(f"{BANNED_IPS_FILE} not found. Starting with empty banned IP list")
    except json.JSONDecodeError:
        logger.error(f"Error decoding {BANNED_IPS_FILE}. Starting with empty banned IP list")

load_banned_ips()

def save_banned_ips():
    with open(BANNED_IPS_FILE, 'w') as f:
        json.dump(list(banned_ips), f)
    logger.info(f"Saved {len(banned_ips)} banned IPs to file")

@app.before_request
def check_banned_ip():
    if get_remote_address() in banned_ips:
        logger.warning(f"Blocked access attempt from banned IP: {get_remote_address()}")
        abort(403)

def check_attempts(username, ip, email):
    key = f"{username}:{ip}"
    if key in username_attempts:
        username_attempts[key] += 1
        if username_attempts[key] > 2:
            log_message = f"BLOCKED REGISTRATION [IP={ip}] [EMAIL={email}]"
            banned_ips.add(ip)
            save_banned_ips()
            spam_logger.warning(log_message)
    else:
        username_attempts[key] = 1


@limiter.limit("25 per minute")
@app.route('/register', methods=['GET', 'POST'])
@session_required
def register():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        forwarded_ip = get_remote_address()
        email = request.form.get('email', '').strip().lower()

        settings = {
            'darkmode': session.get('darkmode', False),
            'deck': session.get('deck', 'hsk1'),
            'font': session.get('font', 'Noto Sans Mono')
        }
        
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return redirect(url_for('register'))
        
        
        if db_user_exists(username):
            check_attempts(username, forwarded_ip, email)
            flash('Username unavailable', 'error')
            logger.warning(f"Registration attempt with existing username: {username} {forwarded_ip}")
            session['authenticated'] = False
            return redirect(url_for('register'))
        
        if email:
            if "testguru" in email:
                log_message = f"BLOCKED REGISTRATION [IP={forwarded_ip}] [EMAIL={email}]"
                spam_logger.warning(log_message)  # Logs to /home/patakk/logs/flask-antispam.log
                return "Blocked registration attempt", 403
            
            existing_email_user = User.query.filter_by(email=email).first()
            if existing_email_user:
                if existing_email_user.google_id:
                    flash('This email is already linked to a Google account. Please sign in with Google.', 'error')
                else:
                    flash('This email is already registered. Please log in or use a different email.', 'error')
                logger.warning(f"Registration attempt with existing email: {email}")
                return redirect(url_for('register'))

        
        is_valid, msg = validate_password(password)
        if not is_valid:
            flash(msg, 'error')
            return redirect(url_for('register'))
        
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


            if len(email) > 0:
                message = f"New user created: {username}. Email: {email}."
            else:
                message = f"New user created: {username}. No email provided."
            send_bot_notification(message)
            
            logger.info(f"New user registered successfully: {username} (IP: {forwarded_ip}")
            return redirect(url_for('home'))
        except:
            flash('Error creating account', 'error')
            logger.error(f"Registration error: {str(e)}")
            return redirect(url_for('register'))
            
    return render_template('register.html')




@app.route('/logout')
@session_required
def logout():
   session.clear()  # This clears everything in the session, including flash messages
   return redirect(url_for('home'))


@app.route('/')
@session_required
def home():
    return render_template('home.html', darkmode=session.get('darkmode', default_darkmode), username=session.get('username'), decks=DECKS_INFO)

# New route for the welcome page
@app.route('/welcome')
@session_required
def welcome():
    return render_template('welcome.html', darkmode=session.get('darkmode', default_darkmode), username=session.get('username'), decks=DECKS_INFO)

@app.route('/pageinfo')
@session_required
def pageinfo():
    return render_template('pageinfo.html', darkmode=session.get('darkmode', default_darkmode), username=session.get('username'), decks=DECKS_INFO)

@app.route('/flashcards', methods=['GET'])
@session_required
def flashcards():
    querydeck = request.args.get('wordlist')
    if not querydeck:
        querydeck = 'hsk1'

    username = session.get('username')

    custom_wordlists = db_get_user_wordlists(username, with_data=False)
    cc = {
        **custom_wordlists,
        **CARDDECKS
    }

    for wl in custom_wordlists:
        DECKNAMES[wl] = custom_wordlists[wl]['name']

    user_wordlists = db_get_word_list_names_only(username)
    if user_wordlists:
        user_wordlists = {wl: wl for wl in user_wordlists}
        hsk_keys = [k for k in DECKNAMES.keys() if 'hsk' in k]
        nonhsk_keys = [k for k in DECKNAMES.keys() if 'hsk' not in k]
        decknames_sorted = list(sorted(user_wordlists.keys())) + list(sorted(hsk_keys)) + list(sorted(nonhsk_keys))
    else:
        hsk_keys = [k for k in DECKNAMES.keys() if 'hsk' in k]
        nonhsk_keys = [k for k in DECKNAMES.keys() if 'hsk' not in k]
        decknames_sorted = list(sorted(hsk_keys)) + list(sorted(nonhsk_keys))
    decknames_sorted_with_name = {deck: DECKNAMES[deck] for deck in decknames_sorted}

    return render_template('flashcards.html', darkmode=session.get('darkmode', default_darkmode), username=session.get('username'), decks=cc, wordlist=querydeck, decknames_sorted_with_name=decknames_sorted_with_name)


@app.route('/get_custom_cc')
@session_required
def get_custom_cc():
    username = session.get('username')
    custom_wordlists = db_get_user_wordlists(username)
    for wl in custom_wordlists:
        custom_wordlists[wl]['chars'] = {
            char: get_char_info(char) for char in custom_wordlists[wl]['chars']
        }
    return jsonify(custom_wordlists)


@app.route("/get_static_cc")
def get_static_cc():
    json_path = os.path.join(app.static_folder, "json", "carddecks_w_pinyin.json")
    response = send_file(json_path)
    response.headers["Cache-Control"] = "public, max-age=31536000, must-revalidate"
    return response



@app.route('/grid', methods=['GET'])
@session_required
@timing_decorator
def grid():
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

    user_wordlists = []
    if username:
        user_wordlists = db_get_word_list_names_only(username)
    if user_wordlists:
        user_wordlists = {wl: wl for wl in user_wordlists}
    for wl in user_wordlists:
        DECKNAMES[wl] = user_wordlists[wl]

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

    return render_template('grid.html', username=session.get('username'), darkmode=session.get('darkmode', default_darkmode), inputdeck=querydeck, inputedeckdata=cc, custom_deck_names=[user_wordlists[k] for k in user_wordlists], decknames_sorted_with_name=decknames_sorted_with_name)

from backend.routes.puzzles import get_common_context

'''
@puzzles_bp.route("/hanzitest_pinyin")
@session_required
@timing_decorator
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
# @timing_decorator
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
@timing_decorator
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
@timing_decorator
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
@timing_decorator
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



# @app.route('/stories')
# @app.route('/stories/<uri>')
# @session_required
# @timing_decorator
# def stories(uri=None):
#     return render_template('stories.html', stories=stories_list, initial_uri=uri)

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

@app.route('/search', methods=['GET', 'POST'])
@timing_decorator
@session_required
def search():
    query = request.args.get('query')
    character = request.args.get('character')
    results = []
    main_data = None

    start_time = time.time()
    if query:
        results = get_search_results(query)
    if character:
        main_data = main_card_data(character)
        main_data['chars_breakdown'] = breakdown_chars(character)
    search_time = time.time() - start_time
    return render_template('search.html', results=results, query=query, darkmode=session.get('darkmode', default_darkmode), decks=DECKS_INFO, custom_deck_names=db_get_word_list_names_only(session.get('username')), username=session.get('username'), character=main_data, search_time=search_time)


@app.route('/search_results', methods=['POST'])
@limiter.limit("1 per second")
@timing_decorator
@session_required
def search_results():
    start_time = time.time()
    data = request.json
    query = data.get('query', '')
    results = []
    start_time = time.time()
    if query:
        results = get_search_results(query)
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
    


# @app.route('/book1')
# @session_required
# def book1():
#     image_folder = 'static/images/book_1_unit_1_8'
#     images = sorted([img for img in os.listdir(image_folder) if img.endswith('.jpg')])
    
#     # Get user strokes
#     user_strokes = get_user_strokes(session['username'])
    
#     return render_template('book1.html', images=images, user_strokes=user_strokes, username=session.get('username'), decks=DECKS_INFO)

# @app.route('/save_stroke', methods=['POST'])
# @session_required
# def save_stroke():
#     data = request.json
#     canvas_id = data['canvasId']
#     stroke = data['stroke']
    
#     save_user_stroke(session['username'], canvas_id, stroke)
    
#     return jsonify({"status": "success"})


# def get_user_strokes(username):
#     strokes_path = f'data/user_strokes/{username}'
#     if not os.path.exists(strokes_path):
#         return {}
    
#     user_strokes = {}
#     for canvas_folder in os.listdir(strokes_path):
#         canvas_path = os.path.join(strokes_path, canvas_folder)
#         if os.path.isdir(canvas_path):
#             user_strokes[canvas_folder] = []
#             for stroke_file in os.listdir(canvas_path):
#                 with open(os.path.join(canvas_path, stroke_file), 'r') as f:
#                     user_strokes[canvas_folder].append(f.read())
    
#     return user_strokes

# def save_user_stroke(username, canvas_id, stroke):
#     strokes_path = f'data/user_strokes/{username}/{canvas_id}'
#     os.makedirs(strokes_path, exist_ok=True)
    
#     stroke_file = f'{strokes_path}/stroke_{int(time.time() * 1000)}.json'
#     with open(stroke_file, 'w') as f:
#         json.dump(stroke, f)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5117, debug=True)
