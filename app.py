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
from backend.common import CARDDECKS_W_PINYIN
from backend.common import DECKNAMES

from backend.common import get_pinyin
from backend.common import get_char_info
from backend.common import get_chars_info
# from backend.common import dictionary
from backend.common import auth_keys
from backend.routes.manage import validate_password

lemmatizer = WordNetLemmatizer()

import json
import os
import secrets
from backend.routes.puzzles import add_sorted_decknames_to_context

from backend.setup import create_app
from flask_limiter.util import get_remote_address
from flask_limiter import Limiter

from flask_dance.contrib.google import make_google_blueprint, google


app = create_app()
application = app

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
)


log_file = 'zhongwen.log'
if os.path.exists('/home/patakk/logs'):
    log_file = '/home/patakk/logs/zhongwen.log'

logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    filename=log_file)
logger = logging.getLogger(__name__)
logger.info("Application root directory: " + app.config['APPLICATION_ROOT'])


stroke_jsons = glob.glob('static/strokes_data/*.json')
stroke_chars = set([os.path.basename(j).split('.')[0] for j in stroke_jsons])


def breakdown_chars(word):
    infos = {}
    for char in word:
        infos[char] = get_char_info(char, full=True)
    return infos


@app.errorhandler(500)
def handle_500(error):
    return "Something went wrong, please try again later.", 500


from backend.db.extensions import db
from backend.db.models import User
from backend.db.models import WordEntry
from backend.db.models import WordList


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
        **get_char_info(character, pinyin=True, english=True),
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
            nww.append(get_char_info(w, pinyin=True, english=True))
        wordlists_words[wl] = nww

    google_id = User.query.filter_by(username=username).first().google_id
    profile_pic = User.query.filter_by(username=username).first().profile_pic

    return render_template('account.html', darkmode=session['darkmode'], username=session.get('username'), decks=DECKS_INFO, custom_deck_names=db_get_word_list_names_only(username), wordlists_words=wordlists_words, google_id=google_id, profile_pic=profile_pic)


def main_card_data(character):
    username = session.get('username')
    simple_info = get_char_info(character, pinyin=True, english=True)

    # res = get_tatoeba_page(character, 0)
    res = None
    if res:
        examples, is_last = res
    else:
        examples, is_last = [], False

    return {
        "character": character,
        "pinyin": simple_info['pinyin'],
        "english": simple_info['english'],
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
    return render_template('hanziviz.html', darkmode=session['darkmode'], characters=characters)


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

@app.route('/login', methods=['GET', 'POST'])
@timing_decorator
@limiter.limit("25 per minute")
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


@app.route('/register', methods=['GET', 'POST'])
@timing_decorator
@limiter.limit("25 per minute")
def register():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        email = request.form.get('email', '').strip()
        
        settings = {
            'darkmode': session.get('darkmode', False),
            'deck': session.get('deck', 'hsk1'),
            'font': session.get('font', 'Noto Sans Mono')
        }
        
        # Check if passwords match
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return redirect(url_for('register'))
        
        # Check username availability
        if db_user_exists(username):
            flash('Username unavailable', 'error')
            logger.warning(f"Registration attempt with existing username: {username}")
            return redirect(url_for('register'))
        
        # Add email uniqueness check
        if email:  # Only check if email is provided
            existing_email_user = User.query.filter_by(email=email).first()
            if existing_email_user:
                # Check if it's a Google account
                if existing_email_user.google_id:
                    flash('This email is already linked to a Google account. Please sign in with Google.', 'error')
                else:
                    flash('This email is already registered. Please log in or use a different email.', 'error')
                logger.warning(f"Registration attempt with existing email: {email}")
                return redirect(url_for('register'))
        
        # Validate password
        is_valid, msg = validate_password(password)
        if not is_valid:
            flash(msg, 'error')
            return redirect(url_for('register'))
        
        # Create user
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
            
            logger.info(f"New user registered successfully: {username}")
            flash('Account created successfully!', 'success')
            return redirect(url_for('home'))
        except Exception as e:
            flash('Error creating account', 'error')
            logger.error(f"Registration error: {str(e)}")
            return redirect(url_for('register'))
            
    return render_template('register.html')




@app.route('/logout')
def logout():
   session.clear()  # This clears everything in the session, including flash messages
   return redirect(url_for('home'))


@app.route('/')
@session_required
@timing_decorator
def home():
    return render_template('home.html', darkmode=session['darkmode'], username=session['username'], decks=DECKS_INFO)

# New route for the welcome page
@app.route('/welcome')
@session_required
@timing_decorator
def welcome():
    return render_template('welcome.html', darkmode=session['darkmode'], username=session['username'], decks=DECKS_INFO)

@app.route('/pageinfo')
@session_required
@timing_decorator
def pageinfo():
    return render_template('pageinfo.html', darkmode=session['darkmode'], username=session['username'], decks=DECKS_INFO)

@app.route('/flashcards', methods=['GET'])
@session_required
@timing_decorator
def flashcards():
    querydeck = request.args.get('wordlist')
    if not querydeck:
        querydeck = 'hsk1'

    username = session.get('username')

    custom_wordlists = db_get_user_wordlists(username, pinyin=False, english=False)
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

    return render_template('flashcards.html', darkmode=session['darkmode'], username=session['username'], decks=cc, wordlist=querydeck, decknames_sorted_with_name=decknames_sorted_with_name)


@app.route('/grid', methods=['GET'])
@session_required
@timing_decorator
def grid():
    character = request.args.get('character')
    querydeck = request.args.get('wordlist')
    if not querydeck:
        querydeck = 'hsk1'
    logger.info(f"Query deck: {querydeck}")

    username = session.get('username')
    custom_wordlists = db_get_user_wordlists(username, pinyin=True, english=False)
    custom_deck_names = list(custom_wordlists.keys())
    cc = {
        **custom_wordlists,
        **CARDDECKS_W_PINYIN
    }

    user_wordlists = db_get_word_list_names_only(username)
    for wl in custom_wordlists:
        DECKNAMES[wl] = custom_wordlists[wl]['name']
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

    
    for d in cc:
        cc[d]['chars'] = get_chars_info(cc[d]['chars'], pinyin=True, english=True)

    if not character:
        return render_template('grid.html', username=session['username'], darkmode=session['darkmode'], character=None, decks=cc, inputdeck=querydeck, custom_deck_names=custom_deck_names, decknames_sorted_with_name=decknames_sorted_with_name)
    main_data = main_card_data(character)
    main_data['chars_breakdown'] = breakdown_chars(character)
    return render_template('grid.html', username=session['username'], darkmode=session['darkmode'], character=main_data, decks=cc, inputdeck=querydeck, custom_deck_names=custom_deck_names, decknames_sorted_with_name=decknames_sorted_with_name)

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
#     return render_template('convert.html', darkmode=session['darkmode'], username=session['username'], convertedText=db_get_user_string(session['username']), decks=DECKS_INFO, wordlist=session['deck'])

@app.route('/convert2')
@session_required
def convert2():
    return render_template('convert2.html', darkmode=session['darkmode'], username=session['username'], convertedText=db_get_user_string(session['username']), decks=DECKS_INFO, wordlist=session['deck'])

@app.route('/convert3')
@session_required
def convert3():
    convertedText = db_get_user_string(session['username'])
    chars = set(''.join(convertedText.split()))
    chars = chars.intersection(stroke_chars)
    char_data = {char : {'strokes': json.load(open(f'static/strokes_data/{char}.json', 'r')), 'pinyin': get_pinyin(char)} for char in chars}
    
    lines = convertedText.split('\n')
    translations = get_translations(lines)

    return render_template('convert3.html', darkmode=session['darkmode'], username=session['username'], convertedText=convertedText, dataPerCharacter=char_data, decks=DECKS_INFO, wordlist=session['deck'], transPerLine=translations)

@app.route('/convert')
@session_required
def convert():
    convertedText = db_get_user_string(session['username'])
    chars = set(''.join(convertedText.split()))
    chars = chars.intersection(stroke_chars)
    char_data = {char : {'strokes': json.load(open(f'static/strokes_data/{char}.json', 'r')), 'pinyin': get_pinyin(char)} for char in chars}
    
    lines = convertedText.split('\n')
    translations = get_translations(lines)

    return render_template('convert.html', darkmode=session['darkmode'], username=session['username'], convertedText=convertedText, dataPerCharacter=char_data, decks=DECKS_INFO, wordlist=session['deck'], transPerLine=translations)




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
    char_data = {char : {'strokes': json.load(open(f'static/strokes_data/{char}.json', 'r')), 'chardata': get_char_info(char, pinyin=True, english=True)} for char in chars}
    word_data = {word: get_char_info(word, pinyin=True, english=True) for word in words}
    all_chapters = [[chapter['title'] for chapter in all_stories[story_name]['chapters_list']] for story_name in stories_names]
    return render_template('stories.html', darkmode=session['darkmode'], chapter=first_chapter, chapters=all_chapters, stories=stories_names, username=session['username'], dataPerCharacter=char_data, decks=DECKS_INFO, wordlist=session['deck'], word_data=word_data, custom_deck_names=db_get_word_list_names_only(username))

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
        word_data = {word: get_char_info(word, pinyin=True, english=True) for word in words}
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
        stroke_data = {char: json.load(open(f'static/strokes_data/{char}.json', 'r')) for char in chars}
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
    

@app.route('/storeConvertedText', methods=['POST'])
@session_required
def store_converted_text():
    data = request.get_json()
    text = data.get('text', '')
    
    lines = text.split('\n')
    translations = get_translations(lines)
    # transPerLine = {l: t for l, t in zip(lines, translations)}

    old_string = db_get_user_string(session['username'])
    old_charset = get_charset(old_string)
    new_charset = get_charset(text)
    needed_chars = new_charset - old_charset
    char_data = {char : {'strokes': json.load(open(f'static/strokes_data/{char}.json', 'r')), 'pinyin': get_pinyin(char)} for char in needed_chars}
    
    success, message = db_store_user_string(session['username'], text)
    return jsonify({"status": "success" if success else "error", 'message': message, 'dataPerCharacter': char_data, 'transPerLine': translations})

from flask import Response
with open('data/examples.json', 'r', encoding='utf-8') as f:
    parsed_data = json.load(f)

with open('data/example_lists.json', 'r', encoding='utf-8') as f:
    example_lists_j = json.load(f)
example_lists = {}
for puri in example_lists_j:
    cat = puri.split('_')[0]
    if cat not in example_lists:
        example_lists[cat] = []
    example_lists[cat].append({'title': example_lists_j[puri]['english'][0], 'uri': puri})


@app.errorhandler(404)
def page_not_found(e):
    return '', 404


@app.route('/examples')
@session_required
@timing_decorator
def examples():
    categories = {
        'vocabulary': list(parsed_data['vocabulary'].keys()),
        'examples': list(parsed_data['examples'].keys())
    }
    return render_template('examples.html', categories=categories)

@app.route('/lists')
@session_required
@timing_decorator
def lists():
    uri = request.args.get('uri')
    return render_template('lists.html', darkmode=session['darkmode'], categories=example_lists, initial_uri=uri, decks=DECKS_INFO, username=session['username'])

@app.route('/kongzi')
@session_required
@timing_decorator
def kongzi():
    uri = request.args.get('uri')
    return render_template('kongzi.html',  decks=DECKS_INFO, username=session['username'])



@app.route('/examples/<category>/<subcategory>')
@session_required
@timing_decorator
def examples_category(category, subcategory):
    category = unquote(category)
    subcategory = unquote(subcategory)
    if category not in parsed_data or subcategory not in parsed_data[category]:
        return "Category not found", 404
    translations = parsed_data[category][subcategory]
    return render_template('examples_category.html', category=category, subcategory=subcategory, translations=translations)

# story_files = glob.glob('data/stories/*.json')

# with open('data/xiao_mei_story.json', 'r', encoding='utf-8') as f:
#     stories_data = json.load(f)

# def extract_sort_key(uri):
#     parts = uri.split('_', 1)
#     return int(parts[0]) if parts[0].isdigit() else float('inf')

# stories_list = sorted(
#     [{'title': stories_data[u]['description'], 'uri': u} for u in stories_data],
#     key=lambda x: extract_sort_key(x['uri'])
# )


'''
'''

def extract_sort_key(uri):
    parts = uri.split('_', 1)
    return int(parts[0]) if parts[0].isdigit() else float('inf')

story_files = glob.glob('data/stories/*.json')
story_files = sorted(story_files)[::-1]
all_stories = {}

for story_file in story_files:
    with open(story_file, 'r', encoding='utf-8') as f:
        story_opened = json.load(f)
    chapters_data = story_opened["chapters"]
    story_name = story_opened["name"]
    
    chapters_list = sorted(
        [{'title': chapters_data[u]['description'], 'uri': u} for u in chapters_data],
        key=lambda x: extract_sort_key(x['uri'])
    )
    
    all_stories[story_name] = {
        'chapters_list': chapters_list,
        'chapters_data': chapters_data
    }
stories_names = list(all_stories.keys())


# @app.route('/stories')
# @app.route('/stories/<uri>')
# @session_required
# @timing_decorator
# def stories(uri=None):
#     return render_template('stories.html', stories=stories_list, initial_uri=uri)


@app.route('/get_lists_data/<uri>')
@session_required
@timing_decorator
def get_lists_data(uri):
    if uri in example_lists_j:
        return jsonify(example_lists_j[uri])
    return jsonify({"error": "Story not found"}), 404

import re
def remove_tones(pinyin):
    return re.sub(r'[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]', lambda m: 'aeiouü'['āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'.index(m.group()) // 4], pinyin)

def remove_all_numbers(pinyin):
    return re.sub(r'\d', '', pinyin)

def convert_numerical_tones(pinyin):
    tone_marks = {
        'a': ['ā', 'á', 'ǎ', 'à', 'a'],
        'e': ['ē', 'é', 'ě', 'è', 'e'],
        'i': ['ī', 'í', 'ǐ', 'ì', 'i'],
        'o': ['ō', 'ó', 'ǒ', 'ò', 'o'],
        'u': ['ū', 'ú', 'ǔ', 'ù', 'u'],
        'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü']
    }
    
    def replace_tone(match):
        vowel, tone = match.groups()
        if vowel.lower() in tone_marks:
            return tone_marks[vowel.lower()][int(tone) - 1]
        return vowel
    
    return re.sub(r'([aeiouü])([\d])', replace_tone, pinyin)

from collections import Counter

def fuzzy_match(query, text):
    query_chars = Counter(query.lower())
    text_chars = Counter(text.lower())
    return all(query_chars[char] <= text_chars[char] for char in query_chars)

def fuzzy_sort_key(query, text):
    query = query.lower()
    text = text.lower()
    order_score = sum(text.index(char) for char in query if char in text)
    return order_score


@app.route('/deviceinfo')
def deviceinfo():
    return render_template('deviceinfo.html')


from pypinyin import lazy_pinyin, Style

from hanziconv import HanziConv

def move_tone_number_to_end(pinyin):
    return ''.join([char for char in pinyin if char not in '1234']) + ''.join([char for char in pinyin if char in '1234'])

   
def normalize_query(text):
    text = text.lower()
    text = text.strip(string.punctuation)
    text = lemmatizer.lemmatize(text)
    return text

def get_search_results(query):
    query = query.strip().lower()
    results = []

    only_hanzi = all(regex.match(r'\p{Han}', char) for char in query if char.strip())
    #only_latin = all(regex.match(r'\p{Latin}', char) for char in query if char.strip())
    #only_latin_with_numbers = any(char.isdigit() for char in query) and all(regex.match(r'[\p{Latin}0-9]', char) for char in query if char.strip())

    if only_hanzi:
        # definition = dictionary.definition_lookup(query)
        # for d in definition:
        #     results.append({'hanzi': d['simplified'], 'pinyin': get_pinyin(d['simplified']), 'english': d['definition'], 'match_type': 'hanzi'})
        exact_matches = []
        other_matches = []
        res = dictionary.get_examples(query)
        for fr in res:
            for idx, r in enumerate(res[fr]):
                if r['simplified'] == query:
                    exact_matches.append({'hanzi': r['simplified'], 'pinyin': r['pinyin'], 'english': r['definition'], 'match_type': 'hanzi', 'order': idx})
                elif r['traditional'] == query:
                    exact_matches.append({'hanzi': r['traditional'], 'pinyin': r['pinyin'], 'english': r['definition'], 'match_type': 'hanzi', 'order': idx})
                else:
                    if query == HanziConv.toSimplified(query):
                        other_matches.append({'hanzi': r['simplified'], 'pinyin': r['pinyin'], 'english': r['definition'], 'match_type': 'hanzi', 'order': idx})
                    else:
                        other_matches.append({'hanzi': r['traditional'], 'pinyin': r['pinyin'], 'english': r['definition'], 'match_type': 'hanzi', 'order': idx})

        for r in other_matches:
            for hskl in range(1, 7):
                if r['hanzi'] in CARDDECKS[f'hsk{hskl}']['chars']:
                    r['hsklevel'] = hskl
        other_matches = sorted(other_matches, key=lambda x: (x.get('hsklevel', 7), x.get('order', 0)))
        results += exact_matches + other_matches

    else:
        res = dictionary.search_by_pinyin(query)
        hard_results = []
        for r in res:
            dd = dictionary.definition_lookup(r)
            for idx, d in enumerate(dd):
                order = idx
                piny_removed = remove_tones(d['pinyin'].lower())
                piny_removed_numbers = remove_all_numbers(d['pinyin'].lower())
                if d and query in piny_removed:
                    if 'surname' in d['definition']:
                        order = 1000
                    hard_results.append({'hanzi': r, 'pinyin': d['pinyin'], 'english': d['definition'], 'match_type': 'english', 'order': order})
                if d and query in piny_removed_numbers:
                    if 'surname' in d['definition']:
                        order = 1000
                    results.append({'hanzi': r, 'pinyin': d['pinyin'], 'english': d['definition'], 'match_type': 'english', 'order': order})
        if len(results) == 0:
            results = hard_results
        if len(results) == 0:
            query = normalize_query(query)
            res = dictionary.search_by_english(query)
            for r in res:
                dd = dictionary.definition_lookup(r)
                for idx, d in enumerate(dd): # here i take into account the order of the definitions
                    if d and query in d['definition'].lower():
                        results.append({'hanzi': r, 'pinyin': d['pinyin'], 'english': d['definition'], 'match_type': 'english', 'order': idx})
            qwords = query.split(" ") 
            if len(qwords) > 1:
                fresults = []
                for r in results:
                    definition = r['english'].lower()
                    if all(qw in definition for qw in qwords):
                        if r not in fresults:
                            fresults.append(r)
                def order_key(r):
                    definition = r['english']
                    indices = [definition.find(qw) for qw in qwords]
                    return [i if i != -1 else float('inf') for i in indices]  # Handle missing words
                results = sorted(fresults, key=order_key)
        for r in results:
            for hskl in range(1, 7):
                if r['hanzi'] in CARDDECKS[f'hsk{hskl}']['chars']:
                    r['hsklevel'] = hskl
        results = sorted(results, key=lambda x: (x.get('hsklevel', 7), x.get('order', 0)))
    return results

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
    return render_template('search.html', results=results, query=query, darkmode=session['darkmode'], decks=DECKS_INFO, custom_deck_names=db_get_word_list_names_only(session.get('username')), username=session['username'], character=main_data, search_time=search_time)


@app.route('/search_results', methods=['POST'])
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
    return render_template('hanzistats.html', darkmode=session['darkmode'], username=session['username'], decks=DECKS_INFO, strokes_per_character=strokes_per_character)

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
    
#     return render_template('book1.html', images=images, user_strokes=user_strokes, username=session['username'], decks=DECKS_INFO)

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
