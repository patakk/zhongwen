from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask import send_file
from datetime import timedelta
from datetime import datetime
from datetime import timezone
from functools import wraps
from urllib.parse import unquote
import logging
import random
import json
import time
import os
import io
from flask import request, jsonify

from backend.flashcard_app import init_flashcard_app
from backend.flashcard_app import get_flashcard_app
from backend.decorators import session_required
from backend.decorators import hard_session_required
from backend.decorators import timing_decorator
from backend.db.ops import getshortdate
from backend.db.ops import load_user_progress
from backend.db.ops import load_user_value
from backend.db.ops import db_init_app
from backend.db.ops import db_get_all_character_strokes
from backend.db.ops import db_get_stroke_entries
from backend.db.ops import db_user_exists
from backend.db.ops import db_create_user

def create_app():
    init_flashcard_app()
    app = Flask(__name__)
    app.secret_key = os.urandom(24)
    app.permanent_session_lifetime = timedelta(hours=32)
    app.config['SESSION_COOKIE_SECURE'] = True  # for HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'flashcards.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db_init_app(app)
    return app

app = create_app()
flashcard_app = get_flashcard_app()
application = app

from backend.routes.api import api_bp
from backend.routes.puzzles import puzzles_bp
app.register_blueprint(api_bp)
app.register_blueprint(puzzles_bp)

log_file = 'zhongwen.log'
if os.path.exists('/home/patakk/logs'):
    log_file = '/home/patakk/logs/zhongwen.log'

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    filename=log_file)
logger = logging.getLogger(__name__)
logger.info("Application root directory: " + app.config['APPLICATION_ROOT'])


@app.before_request
def make_session_permanent():
    session.permanent = True
    app.logger.info(f"Session at start of request: {session}")



@app.route('/get_card_data')
@session_required
def get_card_data():
    character = request.args.get('character')
    message = ''
    if not character:
        message, character = flashcard_app.select_card(session['username'], session['deck'])
    return  jsonify({'message': message, **packed_data(character)})

@app.route('/get_simple_char_data')
@session_required
def get_simple_char_data():
    character = request.args.get('character')
    
    data = {}
    if character in flashcard_app.cards[session['deck']]:
        data = flashcard_app.get_card_examples(session['deck'], character)
    else: # look into all decks
        for deck_name in flashcard_app.cards:
            if character in flashcard_app.cards[deck_name]:
                data = flashcard_app.get_card_examples(deck_name, character)
                break
    # session['deck'] = foundDeck
    cdata = {
        "character": character,
        "pinyin": data.get('pinyin', ''),
        "english": data.get('english', ''),
    }
    
    return  jsonify({'message': 'success', **cdata})

from collections import defaultdict

@app.route('/user_progress')
@hard_session_required
def user_progress():
    username = request.args.get('user', session.get('username'))
    deck = request.args.get('deck', session.get('deck'))

    if not username or not deck:
        return "User or deck not specified", 400

    deck_cards = flashcard_app.cards[deck]

    uprogress = load_user_progress(username)

    logger.info(f"User progress for {username} in deck {deck}")

    progress_stats = []
    for character in deck_cards:
        char_progress = uprogress['progress'].get(character, {})
        if char_progress and deck in char_progress.get('decks', []):
            correct_answers = char_progress['answers'].count('correct')
            total_answers = len(char_progress['answers'])
            accuracy = (correct_answers / total_answers * 100) if total_answers > 0 else 0

            stats = {
                'character': character,
                'meaning': deck_cards[character].get('english', 'N/A'),
                'pinyin': deck_cards[character].get('pinyin', 'N/A'),
                'box': char_progress.get('box', 1),
                'views': char_progress.get('views', 0),
                'streak': char_progress.get('streak', 0),
                'difficulty': char_progress.get('difficulty', 1),
                'accuracy': round(accuracy, 2),
                'num_incorrect': char_progress.get('num_incorrect', 1),
                'next_review': char_progress.get('next_review', 'N/A'),
                'is_due': char_progress.get('next_review') and datetime.fromisoformat(char_progress['next_review']).replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc),
            }
            progress_stats.append(stats)

    # Sort by box (descending) and then by accuracy (descending)
    #progress_stats.sort(key=lambda x: (-x['box'], -x['accuracy']))
    progress_stats.sort(key=lambda x: x['next_review'])

    numcards = len(deck_cards)
    duecards = len([card for card in progress_stats if card['is_due']])
    learnedcards = len([card for card in progress_stats if card['box'] == 6])
    learningcards = len([card for card in progress_stats if card['box'] < 6])

    # print(session[session['username']]["base_new_cards_limit"])
    return render_template('userprogress.html', darkmode=session['darkmode'], username=session.get('username'), deck=deck, deckname=flashcard_app.decks[deck]['name'], progress_stats=progress_stats, decks=flashcard_app.decks, maxnumcards=load_user_value(username, 'new_cards_limit'), numcards=numcards, duecards=duecards, learnedcards=learnedcards, learningcards=learningcards)


def packed_data(character):
    foundDeck = session['deck']
    if character in flashcard_app.cards[session['deck']]:
        data = flashcard_app.get_card_examples(session['deck'], character)
    else: # look into all decks
        for deck_name in flashcard_app.cards:
            if character in flashcard_app.cards[deck_name]:
                data = flashcard_app.get_card_examples(deck_name, character)
                foundDeck = deck_name
                break
        else:
            return {
                "character": character,
                "pinyin": '',
                "english": '',
                "html": '',
                "hsk_level": '',
                "function": '',
                "char_matches": '',
                "deck": session['deck']
            }
    # session['deck'] = foundDeck
    return {
        "character": character,
        "deck": foundDeck,
        "pinyin": data.get('pinyin', ''),
        "english": data.get('english', ''),
        "hsk_level": data.get('hsk_level', ''),
        "function": data.get('function', ''),
        "char_matches": data.get('char_matches', ''),
        "html": data.get('examples', ''),
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
    for key in flashcard_app.decks:
        if 'hsk' in key:
            for character in flashcard_app.cards[key]:
                characters[character] = flashcard_app.cards[key][character]
    return render_template('hanziviz.html', darkmode=session['darkmode'], characters=characters)


@app.route('/check_session')
@session_required
def check_session():
    sess = dict(session)
    sess = {**sess, **load_user_progress(session['username'])}
    return Response(
        json.dumps(sess, ensure_ascii=False, indent=4),
        mimetype='application/json'
    )

@app.route('/get_crunch')
def get_crunch():
    return send_file('data/crunch.mp3', mimetype='audio/mpeg')

@app.route('/login', methods=['GET', 'POST'])
@timing_decorator
def login():
    if request.method == 'POST':
        username = request.form['username']
        session['username'] = username
        session['current_card'] = None
        
        user_exists = db_user_exists(username)
        if not user_exists:
            # Create a new user with default values
            logger.info(f"Creating new user: {username}")
            db_create_user(
                username=username,
                base_new_cards_limit=20,  # Default value
                new_cards_limit=20,  # Default value
                new_cards_limit_last_updated=getshortdate(),
                daily_new_cards={},
                last_new_cards_date={},
                presented_new_cards={},
                progress={}
            )
            return redirect(url_for('welcome'))
        else:
            logger.info(f"User {username} logged in")
            return redirect(url_for('home'))
    return render_template('login.html')

@app.route('/logout')
def logout():
   session.pop('username', None)
   return redirect(url_for('login'))

@app.route('/')
@session_required
@timing_decorator
def home():
    return render_template('home.html', darkmode=session['darkmode'], username=session['username'], decks=flashcard_app.decks)

# New route for the welcome page
@app.route('/welcome')
@session_required
@timing_decorator
def welcome():
    return render_template('welcome.html', darkmode=session['darkmode'], username=session['username'], decks=flashcard_app.decks)

@app.route('/pageinfo')
@session_required
@timing_decorator
def pageinfo():
    return render_template('pageinfo.html', darkmode=session['darkmode'], username=session['username'], decks=flashcard_app.decks)

@app.route('/flashcards', methods=['GET'])
@hard_session_required
@timing_decorator
def flashcards():
    querydeck = request.args.get('deck')
    if not querydeck:
        querydeck = session.get('deck', 'shas')
    session['deck'] = querydeck
    logger.info(f"Query deck: {querydeck}")
    return render_template('flashcards.html', darkmode=session['darkmode'], username=session['username'], decks=flashcard_app.decks, deck=querydeck)

@app.route('/grid', methods=['GET'])
@session_required
@timing_decorator
def grid():
    character = request.args.get('query')
    querydeck = request.args.get('deck')
    if not querydeck:
        querydeck = 'hsk1'
    logger.info(f"Query deck: {querydeck}")
    if not character:
        characters = list(flashcard_app.cards.get(querydeck, {}).keys())
        logger.info(f"Initial characters: {len(characters)}")  # Debug print
        return render_template('grid.html', username=session['username'], darkmode=session['darkmode'], characters=characters, character=None, decks=flashcard_app.decks, deck=querydeck)
    pc = packed_data(character)
    characters = list(flashcard_app.cards[pc['deck']].keys())
    return render_template('grid.html', username=session['username'], darkmode=session['darkmode'], characters=characters, character=pc, decks=flashcard_app.decks, deck=querydeck)

@app.route('/hanzipractice')
@session_required
@timing_decorator
def hanzipractice():
    deck = session['deck']
    characters_data = []
    for char, data in flashcard_app.cards[deck].items():
        characters_data.append({
            "character": char,
            "pinyin": data['pinyin'],
            "english": data['english'],
        })
    return render_template('hanzipractice.html', darkmode=session['darkmode'], username=session['username'], characters=characters_data, decks=flashcard_app.decks, deck=session['deck'])

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
    return 'aaaaa', 404


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
    return render_template('lists.html', darkmode=session['darkmode'], categories=example_lists, initial_uri=uri, decks=flashcard_app.decks, username=session['username'])

@app.route('/kongzi')
@session_required
@timing_decorator
def kongzi():
    uri = request.args.get('uri')
    return render_template('kongzi.html',  decks=flashcard_app.decks, username=session['username'])



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


with open('data/stories.json', 'r', encoding='utf-8') as f:
    stories_data = json.load(f)
@app.route('/stories')
@app.route('/stories/<uri>')
@session_required
@timing_decorator
def stories(uri=None):
    stories_list = [{'title': stories_data[u]['english'][0], 'uri': u} for u in stories_data]
    return render_template('stories.html', stories=stories_list, initial_uri=uri)


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

def convert_numerical_tones(pinyin):
    tone_marks = {
        'a': ['ā', 'á', 'ǎ', 'à'],
        'e': ['ē', 'é', 'ě', 'è'],
        'i': ['ī', 'í', 'ǐ', 'ì'],
        'o': ['ō', 'ó', 'ǒ', 'ò'],
        'u': ['ū', 'ú', 'ǔ', 'ù'],
        'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ']
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

def move_tone_number_to_end(pinyin):
    return ''.join([char for char in pinyin if char not in '1234']) + ''.join([char for char in pinyin if char in '1234'])
    
@app.route('/search', methods=['GET', 'POST'])
@timing_decorator
@session_required
def search():
    if request.method == 'POST' or request.args.get('query'):
        query = request.args.get('query') or request.form.get('query') or ''
        query = query.strip().lower()
        results = []
        
        for deck in flashcard_app.decks:
            for hanzi, card in flashcard_app.cards[deck].items():
                if query in hanzi.lower():
                    results.append({'hanzi': hanzi, **card, 'match_type': 'hanzi'})
                elif query.replace(' ', '').isalnum():  # Allow spaces and numbers in query
                    if 'pinyin' in card:
                        if '1' in query or '2' in query or '3' in query or '4' in query:
                            numbered_query = move_tone_number_to_end(query)
                            numbered_card_pinyin = lazy_pinyin(hanzi, style=Style.TONE3, neutral_tone_with_five=True)
                            if numbered_query in numbered_card_pinyin:
                                results.append({'hanzi': hanzi, **card, 'match_type': 'pinyin'})
                            else:
                                pinyin_query = ''.join(lazy_pinyin(query))
                                card_pinyin = ''.join(lazy_pinyin(card['pinyin'].lower()))
                                if pinyin_query in card_pinyin:
                                    results.append({'hanzi': hanzi, **card, 'match_type': 'pinyin'})
                        else:
                            pinyin_query = remove_tones(convert_numerical_tones(query))
                            card_pinyin = remove_tones(card['pinyin'].lower()).lower()
                            if pinyin_query in card_pinyin:
                                results.append({'hanzi': hanzi, **card, 'match_type': 'pinyin'})
                    if 'english' in card and query in card['english'].lower():
                        results.append({'hanzi': hanzi, **card, 'match_type': 'english'})
        
        # Remove duplicates
        unique_results = []
        seen_hanzi = set()
        for result in results:
            if result['hanzi'] not in seen_hanzi:
                unique_results.append(result)
                seen_hanzi.add(result['hanzi'])
        
        # Sort the results
        def sort_key(result):
            query_lower = query.lower()
            if result['hanzi'] == query:
                return (0, result['hanzi'])
            elif query in result['hanzi']:
                return (1, len(result['hanzi']), result['hanzi'])
            elif result['match_type'] == 'pinyin':
                pinyin = convert_numerical_tones(result['pinyin'].lower())
                accented_query = convert_numerical_tones(query_lower)
                
                words = pinyin.split()
                toneless_words = [remove_tones(word) for word in words]
                toneless_query = remove_tones(accented_query)
                
                # Check for exact match (considering tones)
                if accented_query in words:
                    return (2, 0, len(words), pinyin)
                # Check for exact match (ignoring tones)
                elif toneless_query in toneless_words:
                    return (2, 1, len(words), pinyin)
                # Check if any word starts with the query (considering tones)
                elif any(word.startswith(accented_query) for word in words):
                    return (2, 2, len(words), pinyin)
                # Check if any word starts with the query (ignoring tones)
                elif any(word.startswith(toneless_query) for word in toneless_words):
                    return (2, 3, len(words), pinyin)
                # If query is found anywhere in pinyin
                else:
                    return (2, 4, len(words), pinyin)
            else:  # english
                english = result['english'].lower()
                return (3, not english.startswith(query_lower), english)

            
        sorted_results = sorted(unique_results, key=sort_key)
        
        if not sorted_results:  # If no results found, perform fuzzy search
            fuzzy_results = []
            for deck in flashcard_app.decks:
                for hanzi, card in flashcard_app.cards[deck].items():
                    if 'pinyin' in card:
                        accented_query = convert_numerical_tones(query)
                        accented_card_pinyin = convert_numerical_tones(card['pinyin'].lower())
                        if fuzzy_match(accented_query, accented_card_pinyin):
                            fuzzy_results.append({'hanzi': hanzi, **card, 'match_type': 'fuzzy_pinyin'})
                    elif 'english' in card and fuzzy_match(query, card['english']):
                        fuzzy_results.append({'hanzi': hanzi, **card, 'match_type': 'fuzzy_english'})

            # Remove duplicates
            unique_fuzzy_results = []
            seen_hanzi = set()
            for result in fuzzy_results:
                if result['hanzi'] not in seen_hanzi:
                    unique_fuzzy_results.append(result)
                    seen_hanzi.add(result['hanzi'])

            # Sort fuzzy results
            sorted_results = sorted(unique_fuzzy_results, key=lambda result: 
                fuzzy_sort_key(convert_numerical_tones(query), 
                               convert_numerical_tones(result['pinyin']) if result['match_type'] == 'fuzzy_pinyin' else result['english'])
            )

        return render_template('search.html', results=sorted_results, darkmode=session['darkmode'], query=query, decks=flashcard_app.decks, username=session['username'])
    
    return render_template('search.html', darkmode=session['darkmode'], decks=flashcard_app.decks, username=session['username'])

from backend.db.ops import get_all_stroke_data_
@app.route('/hanzi_strokes_history')
@session_required
# @hard_session_required
def hanzi_strokes_history():
    strokes_per_character = get_all_stroke_data_(session['username'])
    return render_template('hanzistats.html', darkmode=session['darkmode'], username=session['username'], decks=flashcard_app.decks, strokes_per_character=strokes_per_character)

@app.route('/hanzi_strokes_charlist')
@session_required
# @hard_session_required
def hanzi_strokes_charlist():
    strokes_per_character = get_all_stroke_data_(session['username'])
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
    
#     return render_template('book1.html', images=images, user_strokes=user_strokes, username=session['username'], decks=flashcard_app.decks)

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
    app.run(host='0.0.0.0', port=5115, debug=True)
