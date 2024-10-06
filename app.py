from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask import send_file
from pydub import AudioSegment
from datetime import timedelta
from functools import wraps
from urllib.parse import unquote
import random
import json
import time
import os
import io

app = Flask(__name__)
app.secret_key = os.urandom(24)
app.permanent_session_lifetime = timedelta(days=3650)

ENABLE_TIMING = False

@app.before_request
def make_session_permanent():
    session.permanent = True

def timing_decorator(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if not ENABLE_TIMING:
            return f(*args, **kwargs)
        
        start_time = time.time()
        result = f(*args, **kwargs)
        processing_time = time.time() - start_time
        
        username = session.get('username', 'unknown')
        with open(f"{username}_timing.txt", "a") as file:
            file.write(f"{f.__name__}: {processing_time:.4f} seconds\n")
        
        return result
    return wrap

application = app


class FlashcardApp:
    def __init__(self):
        self.user_progress_dir = "user_progress"
        self.decks = {
            "shas": "data/shas_class_cards.json",
            "top140": "data/top140_cards.json",
            "hsk1": "data/hsk1_cards.json",
            "hsk2": "data/hsk2_cards.json",
            "hsk3": "data/hsk3_cards.json",
            "hsk4": "data/hsk4_cards.json",
            "hsk5": "data/hsk5_cards.json",
            "hsk6": "data/hsk6_cards.json",
        }
        self.current_deck = "shas"
        self.cards = {}
        for deck in self.decks:
            self.cards[deck] = self.load_cards(deck)
        with open("data/anthropic.json", 'r', encoding='utf-8') as f:
            self.anthropic_cards = json.load(f)
        
        if not os.path.exists(self.user_progress_dir):
            os.makedirs(self.user_progress_dir)

    def load_cards(self, deck):
        with open(self.decks[deck], 'r', encoding='utf-8') as f:
            return json.load(f)

    def set_deck(self, deck):
        self.current_deck = deck

    def load_user_progress(self, username):
        file_path = os.path.join(self.user_progress_dir, f"{username}.json")
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"progress": {}}

    def save_user_progress(self, username, progress):
        file_path = os.path.join(self.user_progress_dir, f"{username}.json")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(progress, f, ensure_ascii=False, indent=2)

    def get_card_examples(self, deck, character):
        base_data = self.cards[deck].get(character, {})
        if not base_data:
            for deck_name in self.cards:
                if deck_name != deck and character in self.cards[deck_name]:
                    base_data = self.cards[deck_name][character]
                    break
        anthropic_data = self.anthropic_cards.get(character, {})
        return {**base_data, **anthropic_data}


    def select_random_card(self, deck):
        return random.choice(list(self.cards[deck].keys()))

    def record_view(self, username, character):
        user_progress = self.load_user_progress(username)
        if character not in user_progress["progress"]:
            user_progress["progress"][character] = {"views": 1}
        else:
            user_progress["progress"][character]["views"] += 1
        self.save_user_progress(username, user_progress)

flashcard_app = FlashcardApp()

def session_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if 'username' not in session:
            return redirect(url_for('login'))
        return func(*args, **kwargs)
    return wrapper

@app.route('/', methods=['GET', 'POST'])
@timing_decorator
def login():
    if 'username' not in session:
        session['username'] = 'tempuser'
    if 'deck' not in session:
        session['deck'] = 'shas'
    if 'font' not in session:
        session['font'] = 'Noto Sans Mono'
    return redirect(url_for('home'))
    #if request.method == 'POST':
    #    username = request.form['username']
    #    session['username'] = username
    #    session['deck'] = 'shas'
    #    return redirect(url_for('home'))
    #return render_template('login.html')

@app.route('/home')
@session_required
@timing_decorator
def home():
    return render_template('home.html', username=session['username'])

@app.route('/flashcards')
@session_required
@timing_decorator
def flashcards():
    return render_template('flashcards.html', username=session['username'])

@app.route('/pinyinenglish')
@session_required
@timing_decorator
def pinyinenglish():
    return render_template('pinyinenglish.html', username=session['username'])


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
                "deck": session['deck']
            }
    session['deck'] = foundDeck
    return {
        "character": character,
        "deck": foundDeck,
        "pinyin": data.get('pinyin', ''),
        "english": data.get('english', ''),
        "html": data.get('examples', '')
    }

@app.route('/characters')
@session_required
@timing_decorator
def characters():
    character = request.args.get('query')
    if not character:
        characters = list(flashcard_app.cards[session['deck']].keys())
        print(f"Initial characters: {len(characters)}")  # Debug print
        return render_template('characters.html', username=session['username'], characters=characters, character=None)
    
    pc = packed_data(character)
    characters = list(flashcard_app.cards[pc['deck']].keys())
    print(len(characters))
    return render_template('characters.html', username=session['username'], characters=characters, character=pc)


@app.route('/get_characters')
@session_required
def get_characters():
    characters = list(flashcard_app.load_cards(session['deck']).keys())
    return jsonify({"characters": characters})

@app.route('/get_characters_with_pinyin')
@session_required
def get_characters_with_pinyin():
    deck = session['deck']
    characters_data = []
    for char, data in flashcard_app.cards[deck].items():
        characters_data.append({
            "character": char,
            "pinyin": data['pinyin']
        })
    return jsonify({"characters": characters_data})



@app.route('/get_characters_pinyinenglish')
@session_required
def get_characters_pinyinenglish():
    all_data = []
    for character in flashcard_app.cards[session['deck']]:
        data = flashcard_app.get_card_examples(session['deck'], character)
        all_data.append({
            "character": character,
            "pinyin": data.get('pinyin', ''),
            "english": data.get('english', '')
        })
    return jsonify({"characters": all_data})


@app.route('/get_card_data')
@session_required
def get_card_data():
    print(session['deck'])
    character = request.args.get('character')
    if not character:
        character = flashcard_app.select_random_card(session['deck'])
    return  jsonify(packed_data(character))


@app.route('/change_font', methods=['POST'])
@timing_decorator
def change_font():
    session['font'] = request.args.get('font')
    print('set', session['font'])
    return jsonify({"message": "font changed successfully to " + session['font']})


@app.route('/get_font')
@session_required
@timing_decorator
def get_font():
    response = jsonify({"font": session['font']})
    # response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    # response.headers['Pragma'] = 'no-cache'
    # response.headers['Expires'] = '0'
    return response

@app.route('/change_deck', methods=['POST'])
@timing_decorator
def change_deck():
    session['deck'] = request.args.get('deck')
    return jsonify({"message": "Deck changed successfully"})

@app.route('/get_deck')
@session_required
@timing_decorator
def get_deck():
    return jsonify({"deck": session['deck']})
    
@app.route('/record_view', methods=['POST'])
@session_required
@timing_decorator
def record_view():
    data = request.json
    username = session['username']
    character = data['character']
    
    flashcard_app.record_view(username, character)
    return jsonify({"message": "View recorded successfully"})

#@app.route('/logout')
#def logout():
#    session.pop('username', None)
#    return redirect(url_for('login'))

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

with open('data/stories.json', 'r', encoding='utf-8') as f:
    stories_data = json.load(f)
    
with open('data/audio_mappings.json', 'r', encoding='utf-8') as f:
    audio_mappings = json.load(f)

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
    return render_template('lists.html', categories=example_lists, initial_uri=uri)


@app.route('/get_lists_data/<uri>')
@session_required
@timing_decorator
def get_lists_data(uri):
    if uri in example_lists_j:
        return jsonify(example_lists_j[uri])
    return jsonify({"error": "Story not found"}), 404

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


@app.route('/get_examples_data/<category>/<subcategory>/<chinese>')
@session_required
@timing_decorator
def get_examples_data(category, subcategory, chinese):
    category = unquote(category)
    subcategory = unquote(subcategory)
    chinese = unquote(chinese)
    
    app.logger.info(f"Category: {category}, Subcategory: {subcategory}, Chinese: {chinese}")
    if category in parsed_data and subcategory in parsed_data[category]:
        for item in parsed_data[category][subcategory]:
            if item['chinese'] == chinese:
                return jsonify(item)
    return jsonify({"error": "Translation not found"}), 404


@app.route('/stories')
@app.route('/stories/<uri>')
@session_required
@timing_decorator
def stories(uri=None):
    stories_list = [{'title': stories_data[u]['english'][0], 'uri': u} for u in stories_data]
    return render_template('stories.html', stories=stories_list, initial_uri=uri)


@app.route('/get_stories_data/<uri>')
@session_required
@timing_decorator
def get_stories_data(uri):
    if uri in stories_data:
        return jsonify(stories_data[uri])
    return jsonify({"error": "Story not found"}), 404


@app.route('/log_mobile_access', methods=['POST'])
def log_mobile_access():
    print("Mobile or tablet device accessed the flashcard")
    return '', 204

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

@app.route('/search', methods=['GET', 'POST'])
@timing_decorator
def search():
    if request.method == 'POST' or request.args.get('query'):
        query = request.args.get('query') or request.form.get('query') or ''
        query = query.strip().lower()
        results = []
        
        for deck in flashcard_app.decks:
            for hanzi, card in flashcard_app.cards[deck].items():
                if query in hanzi.lower():
                    results.append({'hanzi': hanzi, **card, 'match_type': 'hanzi'})
                elif query.isalpha():
                    if 'pinyin' in card:
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
            hanzi = result['hanzi']
            if hanzi == query:
                return (0, hanzi)
            elif query in hanzi:
                return (1, len(hanzi), hanzi)
            elif result['match_type'] == 'pinyin':
                pinyin = remove_tones(result['pinyin'].lower())
                return (2, not pinyin.startswith(remove_tones(convert_numerical_tones(query))), pinyin)
            else:  # english
                english = result['english'].lower()
                return (3, not english.startswith(query), english)

        sorted_results = sorted(unique_results, key=sort_key)
        
        if not sorted_results:  # If no results found, perform fuzzy search
            fuzzy_results = []
            for deck in flashcard_app.decks:
                for hanzi, card in flashcard_app.cards[deck].items():
                    if 'pinyin' in card and fuzzy_match(query, card['pinyin']):
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
                fuzzy_sort_key(query, result['pinyin'] if result['match_type'] == 'fuzzy_pinyin' else result['english'])
            )

        return render_template('search.html', results=sorted_results, query=query)
    
    return render_template('search.html')

@app.route('/get_audio', methods=['GET'])
def get_audio():
    characters = request.args.get('chars', '')
    if not characters:
        return "No characters provided", 400

    audio_chunks = []
    for char in characters:
        if char in audio_mappings and 'audio' in audio_mappings[char]:
            file_name = audio_mappings[char]['audio']
            file_path = os.path.join('..', 'chinese_audio_clips', file_name)
            if os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    audio_chunks.append(f.read())
            else:
                print(f"Audio file not found for character: {char}")
        else:
            print(f"No audio mapping found for character: {char}")

    if not audio_chunks:
        return "No audio found for the provided characters", 404

    # Concatenate MP3 files
    combined_audio = b''.join(audio_chunks)

    buffer = io.BytesIO(combined_audio)
    buffer.seek(0)

    return send_file(buffer, mimetype="audio/mpeg")

@app.route('/debug')
def debug():
    return jsonify({"debug": app.debug})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=False)
