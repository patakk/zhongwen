from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask import send_file
from datetime import timedelta
from datetime import datetime
from datetime import date
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


def session_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if 'deck' not in session:
            session['deck'] = 'shas'
        if 'font' not in session:
            session['font'] = 'Noto Sans Mono'
        if 'username' not in session:
            return redirect(url_for('login'))
        # if 'username' not in session:
        #     current_time = datetime.now()
        #     adjusted_time = current_time + timedelta(hours=6)
        #     current_time_and_date = adjusted_time.strftime("%Y_%m_%d_%H_%M_%S")
        #     session['username'] = 'tempuser'
        # if 'deck' not in session:
        #     session['deck'] = 'shas'
        # if 'font' not in session:
        #     session['font'] = 'Noto Sans Mono'
        return func(*args, **kwargs)
    return wrapper

def get_date():
    da = ''.join([str(s) for s in [datetime.today().year, datetime.today().month, datetime.today().day]])
    return da


class FlashcardApp:
    def __init__(self):
        
        self.NUM_BOXES = 6
        self.REVIEW_INTERVALS = [0, 1, 3, 7, 14, 30]  # days for each box
        self.DIFFICULTY_CAP = 3.0
        self.STREAK_FACTOR = 20
        self.BASE_NEW_CARDS_LIMIT = 10

        self.daily_new_cards = {}
        self.last_new_cards_date = {}
        self.presented_new_cards = {}
        self.decks = {
            "shas": {'file': "data/shas_class_cards.json", 'name': 'ShaSha\'s Class'},
            "top140": {'file': "data/top140_cards.json", 'name': 'Top 140'},
            "hsk1": {'file': "data/hsk1_cards.json", 'name': 'HSK 1'},
            "hsk2": {'file': "data/hsk2_cards.json", 'name': 'HSK 2'},
            "hsk3": {'file': "data/hsk3_cards.json", 'name': 'HSK 3'},
            "hsk4": {'file': "data/hsk4_cards.json", 'name': 'HSK 4'},
            "hsk5": {'file': "data/hsk5_cards.json", 'name': 'HSK 5'},
            "hsk6": {'file': "data/hsk6_cards.json", 'name': 'HSK 6'},
            "minideck": {'file': "data/mini_deck.json", 'name': 'Minideck'},
        }
        self.current_deck = "shas"
        self.cards = {}
        for deck in self.decks:
            self.cards[deck] = self.load_cards(deck)
        with open("data/anthropic.json", 'r', encoding='utf-8') as f:
            self.anthropic_cards = json.load(f)
        
        if not os.path.exists('user_progress'):
            os.makedirs('user_progress')

    def load_cards(self, deck):
        with open(self.decks[deck]['file'], 'r', encoding='utf-8') as f:
            return json.load(f)

    def set_deck(self, deck):
        self.current_deck = deck

    def load_user_progress(self, file_path):
        # if self.user_prog and username == session['username']:
        #     print('returning cached user progress')
        #     return self.user_prog
        if file_path and os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                try:
                    loaded_user_prog = json.load(f)
                    if get_date() != loaded_user_prog.get('new_cards_limit_last_updated'):
                        loaded_user_prog["new_cards_limit"] = loaded_user_prog["base_new_cards_limit"]
                        loaded_user_prog["new_cards_limit_last_updated"] = get_date()
                        #self.save_user_progress(session['username'], loaded_user_prog)
                        #loaded_user_prog = self.load_user_progress(username)
                        print('!!!')
                        print('resetting new cards limit to base value', loaded_user_prog["base_new_cards_limit"], '==', loaded_user_prog["new_cards_limit"])
                    #print(loaded_user_prog)
                    return loaded_user_prog
                except:
                    print('retrying')
                    time.sleep(0.1)
                    loaded_user_prog = json.load(f)
                    if get_date() != loaded_user_prog.get('new_cards_limit_last_updated'):
                        loaded_user_prog["new_cards_limit"] = loaded_user_prog["base_new_cards_limit"]
                        loaded_user_prog["new_cards_limit_last_updated"] = get_date()
                        #self.save_user_progress(username, loaded_user_prog)
                        #loaded_user_prog = self.load_user_progress(username)
                        print('!!!')
                        print('resetting new cards limit to base value', loaded_user_prog["base_new_cards_limit"], '==', loaded_user_prog["new_cards_limit"])
                    return loaded_user_prog
        loaded_user_prog = {
            "progress": {},
            "last_new_cards_date": {},
            "presented_new_cards": {},
            "daily_new_cards": {},
            "new_cards_limit": self.BASE_NEW_CARDS_LIMIT,
            "base_new_cards_limit": self.BASE_NEW_CARDS_LIMIT,
            "new_cards_limit_last_updated": get_date()
        }
        return loaded_user_prog

    def save_user_progress(self, username, progress):
        file_path = os.path.join('user_progress', f"{username}.json")
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

    def get_char_from_deck(self, deck, character):
        base_data = self.cards[deck].get(character, {})
        if not base_data:
            for deck_name in self.cards:
                if deck_name != deck and character in self.cards[deck_name]:
                    base_data = self.cards[deck_name][character]
                    break
        return base_data

    def select_random_card(self, deck):
        return random.choice(list(self.cards[deck].keys()))

    def record_view(self, username, character):
        #user_progress = self.load_user_progress(username)
        if character not in session['user_progress']["progress"]:
            session['user_progress']["progress"][character] = {
                "views": 1,
                "answers": [],
                "decks": [],
                "box": 1,
                "streak": 0,
                "num_incorrect": 0,
                "difficulty": 1.0,
                "next_review": datetime.now().isoformat()
            }
            if session['deck'] not in session['user_progress']["progress"][character]["decks"]:
                session['user_progress']["progress"][character]["decks"].append(session['deck'])
        else:
            session['user_progress']["progress"][character]["views"] += 1
        session['user_progress']['username'] = username
        #self.save_user_progress(username, self.user_progr)

    def record_answer(self, username, character, correct):
        #user_progress = self.load_user_progress(username)
        if character not in session['user_progress']["progress"]:
            session['user_progress']["progress"][character] = {
                "answers": [],
                "decks": [],
                "box": 1,
                "streak": 0,
                "num_incorrect": 0,
                "views": 0,
                "difficulty": 1.0,
                "next_review": datetime.now().isoformat()
            }
        
        char_progress = session['user_progress']["progress"][character]
        
        if correct == 'true':
            char_progress["answers"].append('correct')
            char_progress["box"] = min(self.NUM_BOXES, char_progress["box"] + 1)
            char_progress["streak"] += 1
        else:
            char_progress["answers"].append('incorrect')
            char_progress["box"] = 1
            char_progress["num_incorrect"] += 1
            char_progress["streak"] = 0
        
        if session['deck'] not in char_progress["decks"]:
            char_progress["decks"].append(session['deck'])
        
        char_progress['views'] += 1
        char_progress["difficulty"] = self.calculate_difficulty(char_progress)
        char_progress["next_review"] = self.calculate_next_review_date(char_progress)
        
        # print(f"Character: {character}, Box: {char_progress['box']}, Next review: {char_progress['next_review']}")  # Debug info

        #self.save_user_progress(username, user_progress)

    def calculate_difficulty(self, char_progress):
        base_difficulty = 1 + max(0, char_progress["num_incorrect"] - 2) / 10
        streak_factor = max(0.5, 1 - (char_progress["streak"] / self.STREAK_FACTOR))
        return min(self.DIFFICULTY_CAP, base_difficulty * streak_factor)

    def calculate_next_review_date(self, char_progress):
        base_interval = self.REVIEW_INTERVALS[char_progress["box"] - 1]
        if base_interval == 0:
            return datetime.now().isoformat()  # Immediate review for box 1
        difficulty = char_progress["difficulty"]
        return (datetime.now() + timedelta(days=base_interval / difficulty)).isoformat()
    
    def get_due_cards(self, username, deck, count=10000):
        #user_progress = self.load_user_progress(username)
        due_cards = []
        current_time = datetime.now()
        all_deck_cards = set(self.cards[deck].keys())
        
        for character in all_deck_cards:
            character_progress = session['user_progress']["progress"].get(character, {})
            next_review_str = character_progress.get('next_review')
            if next_review_str:
                try:
                    next_review = datetime.fromisoformat(next_review_str)
                    if next_review <= current_time:
                        due_cards.append(character)
                except ValueError:
                    print(f"Invalid date format for character {character}: {next_review_str}")
        
        random.shuffle(due_cards)
        due_cards = due_cards[:count]
        
        return due_cards

    def get_new_cards(self, username, deck, force_new_cards=False):
        #user_progress = self.load_user_progress(username)
        today = date.today()
        user_deck_key = (username, deck)

        # Check if we need to generate a new set of cards for today
        if (deck not in session['user_progress']["daily_new_cards"] or 
            session['user_progress']["last_new_cards_date"].get(deck) != today.isoformat()
            or force_new_cards):
            
            all_deck_cards = set(self.cards[deck].keys())
            
            new_cards = [
                character for character in all_deck_cards 
                if character not in session['user_progress']["progress"]
            ]
            
            # Use today's date as seed for randomization
            seed = int(f"{today.year}{today.month:02d}{today.day:02d}")
            rng = random.Random(seed)
            
            new_cards = sorted(new_cards)
            rng.shuffle(new_cards)
            session['user_progress']["daily_new_cards"][deck] = new_cards[:session['user_progress']["new_cards_limit"]]
            if force_new_cards:
                print('Forced new cards')
                print(session['user_progress']["daily_new_cards"][deck])
            session['user_progress']["last_new_cards_date"][deck] = today.isoformat()
            session['user_progress']["presented_new_cards"][deck] = []
            #self.save_user_progress(username, user_progress)

        # Return only the cards that haven't been presented yet
        remaining_new_cards = [card for card in session['user_progress']["daily_new_cards"][deck] 
                               if card not in session['user_progress']["presented_new_cards"].get(deck, [])]
        return remaining_new_cards

    def select_card(self, username, deck):

        if username == 'tempuser':
            return random.choice(list(self.cards[deck].keys()))

        #user_progress = self.load_user_progress(username)

        due_cards = self.get_due_cards(username, deck)
        new_cards = self.get_new_cards(username, deck)
        
        # print('/-------------')
        # print(f"Found {len(due_cards)} due cards for {username} in deck {deck}")
        # print('Due cards:\n   ', due_cards)
        # print('New cards:\n   ', new_cards)

        card_to_return = None
        attempts = 0
        max_attempts = 10
        while attempts < max_attempts:
            if due_cards and new_cards:
                if random.random() < 0.5:  # 50% chance for due cards
                    print('Selecting from due cards')
                    card_to_return = random.choice(due_cards)
                else:
                    print('Selecting from new cards')
                    card_to_return = random.choice(new_cards)
            elif due_cards:
                print('Selecting from due cards only')
                card_to_return = random.choice(due_cards)
            elif new_cards:
                print('Selecting from new cards only')
                card_to_return = random.choice(new_cards)
            else:
                print('No due or new cards, increasing new cards limit and selecting random card from deck')
                session['user_progress']["new_cards_limit"] += session['user_progress']["base_new_cards_limit"]
                session['user_progress']["new_cards_limit_last_updated"] = ''.join([str(s) for s in [datetime.today().year, datetime.today().month, datetime.today().day]])
                #self.save_user_progress(username, self.user_prog)
                new_cards = self.get_new_cards(username, deck, force_new_cards=True)
                if len(new_cards) == 0:
                    new_cards = list(self.cards[deck].keys())
                    card_to_return = random.choice(new_cards)
                    print('ctr', card_to_return)
                else:
                    print('jel ovo')
                    print(new_cards)
                    card_to_return = random.choice(new_cards)

            
            if card_to_return != session['current_card'] or session['current_card'] is None:
                break
            attempts += 1

        if attempts == max_attempts:
            print(f"Warning: Max attempts reached when selecting card")
        
        #user_progress = self.load_user_progress(username)
        if card_to_return in session['user_progress']["daily_new_cards"].get(deck, []):
            if deck not in session['user_progress']["presented_new_cards"]:
                session['user_progress']["presented_new_cards"][deck] = []
            session['user_progress']["presented_new_cards"][deck].append(card_to_return)
        # self.save_user_progress(username, session['user_progress'])
        
        print('/-------------')
        
        flashcard_app.save_user_progress(session['username'], session['user_progress'])
        session['current_card'] = card_to_return
        # print('returning', card_to_return)
        return card_to_return


flashcard_app = FlashcardApp()

@app.route('/get_card_data')
@session_required
def get_card_data():
    character = request.args.get('character')
    if not character:
        character = flashcard_app.select_card(session['username'], session['deck'])
    return  jsonify(packed_data(character))

from collections import defaultdict

@app.route('/user_progress')
@session_required
def user_progress():
    username = request.args.get('user', session.get('username'))
    deck = request.args.get('deck', session.get('deck'))

    if not username or not deck:
        return "User or deck not specified", 400

    # user_progress = flashcard_app.load_user_progress(username)
    deck_cards = flashcard_app.cards[deck]

    progress_stats = []
    for character in deck_cards:
        char_progress = session['user_progress']['progress'].get(character, {})
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
                'next_review': char_progress.get('next_review', 'N/A')
            }
            progress_stats.append(stats)

    # Sort by box (descending) and then by accuracy (descending)
    progress_stats.sort(key=lambda x: (-x['box'], -x['accuracy']))

    # print(session['user_progress']["base_new_cards_limit"])
    return render_template('userprogress.html', username=session.get('username'), deck=deck, progress_stats=progress_stats, decks=flashcard_app.decks, maxnumcards=session['user_progress']["base_new_cards_limit"])

@app.route('/login', methods=['GET', 'POST'])
@timing_decorator
def login():
    if request.method == 'POST':
        username = request.form['username']
        session['username'] = username
        session['current_card'] = None
        user_progress_file = os.path.join('user_progress', f'{username}.json')
        
        if not os.path.exists(user_progress_file):
            #session['user_progress'] = flashcard_app.save_user_progress(username, flashcard_app.load_user_progress(username))
            session['user_progress'] = flashcard_app.load_user_progress(None)
            print('created new user progress')
            flashcard_app.save_user_progress(session['username'], session['user_progress'])
            return redirect(url_for('welcome'))
        else:
            session['user_progress'] = flashcard_app.load_user_progress(user_progress_file)
            print('loaded user progress')
            flashcard_app.save_user_progress(session['username'], session['user_progress'])
            return redirect(url_for('home'))
    return render_template('login.html')

# New route for the welcome page
@app.route('/welcome')
@session_required
@timing_decorator
def welcome():
    return render_template('welcome.html', username=session['username'])

@app.route('/')
@session_required
@timing_decorator
def home():
    # if session.get('username') == 'tempuser':
        # session['user_progress'] = flashcard_app.load_user_progress(None)
        # return redirect(url_for('login'))
    return render_template('home.html', username=session['username'], decks=flashcard_app.decks)

@app.route('/check_session')
@session_required
def check_session():
    sess = dict(session)
    sess['progress'] = flashcard_app.load_user_progress(session['username'])
    return Response(
        json.dumps(sess, ensure_ascii=False, indent=4),
        mimetype='application/json'
    )


@app.route('/flashcards')
@session_required
@timing_decorator
def flashcards():
    return render_template('flashcards.html', username=session['username'], decks=flashcard_app.decks)

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
                "function": '',
                "hsk_level": '',
                "deck": session['deck']
            }
    session['deck'] = foundDeck
    return {
        "character": character,
        "deck": foundDeck,
        "pinyin": data.get('pinyin', ''),
        "english": data.get('english', ''),
        "hsk_level": data.get('hsk_level', ''),
        "function": data.get('function', ''),
        "html": data.get('examples', ''),
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

@app.route('/grid')
@session_required
@timing_decorator
def grid():
    character = request.args.get('query')
    if not character:
        characters = list(flashcard_app.cards[session['deck']].keys())
        print(f"Initial characters: {len(characters)}")  # Debug print
        return render_template('grid.html', username=session['username'], characters=characters, character=None, decks=flashcard_app.decks)
    
    pc = packed_data(character)
    characters = list(flashcard_app.cards[pc['deck']].keys())
    print(len(characters))
    return render_template('grid.html', username=session['username'], characters=characters, character=pc, decks=flashcard_app.decks)


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
    for deck in flashcard_app.cards:
        #for character in flashcard_app.cards[session['deck']]:
        for character in flashcard_app.cards[deck]:
            #data = flashcard_app.get_card_examples(deck, character)
            data = flashcard_app.get_char_from_deck(deck, character)
            all_data.append({
                "character": character,
                "pinyin": data.get('pinyin', ''),
                "english": data.get('english', ''),
                "deck": deck
            })
    return jsonify({"characters": all_data})



@app.route('/change_font', methods=['POST'])
@timing_decorator
def change_font():
    session['font'] = request.args.get('font')
    print('set', session['font'])
    return jsonify({"message": "font changed successfully to " + session['font']})


@app.route('/set_max_cards', methods=['POST'])
@timing_decorator
def set_max_cards():
    session['user_progress']["base_new_cards_limit"] = request.args.get('maxcards')
    flashcard_app.save_user_progress(session['username'], session['user_progress'])
    print('set', session['user_progress']["base_new_cards_limit"])
    return jsonify({"message": "changed base new cards limit"})


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
    # username = session['username']
    # user_progress = flashcard_app.load_user_progress(username)
    # for character in flashcard_app.cards[session['deck']]:
    #     if character not in user_progress['progress']:
    #         user_progress['progress'][character] = {
    #             'answers': [],
    #         }
    # flashcard_app.save_user_progress(username, user_progress)
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

from flask import Response
@app.route('/check_records')
def check_records():
    d = {}
    for username in os.listdir(flashcard_app.user_progress_dir):
        usrnm = username.split('.')[0]
        user_progress = flashcard_app.load_user_progress(usrnm)
        d[usrnm] = session['user_progress']['progress']
    return Response(
        json.dumps(d, ensure_ascii=False, indent=4),
        mimetype='application/json'
    )

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
    return render_template('lists.html', categories=example_lists, initial_uri=uri, decks=flashcard_app.decks, username=session['username'])


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


@app.route('/deviceinfo')
def deviceinfo():
    return render_template('deviceinfo.html')

@app.route('/record_answer')
@timing_decorator
@session_required
def record_answer():
    character = request.args.get('character')
    correct = request.args.get('correct')
    username = session['username']
    flashcard_app.record_answer(username, character, correct)

    return jsonify({"message": "Answer recorded successfully"})

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
            hanzi = result['hanzi']
            if hanzi == query:
                return (0, hanzi)
            elif query in hanzi:
                return (1, len(hanzi), hanzi)
            elif result['match_type'] == 'pinyin':
                pinyin = convert_numerical_tones(result['pinyin'].lower())
                accented_query = convert_numerical_tones(query)
                return (2, not pinyin.startswith(accented_query), pinyin)
            else:  # english
                english = result['english'].lower()
                return (3, not english.startswith(query), english)
            
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

        return render_template('search.html', results=sorted_results, query=query, decks=flashcard_app.decks, username=session['username'])
    
    return render_template('search.html', decks=flashcard_app.decks, username=session['username'])



@app.route('/get_api_key', methods=['GET'])
def get_api_key():
    api_key = os.environ.get('OPENAI_API_KEY_ZHONG_WEN')
    if not api_key:
        file_path = '/home/patakk/scrt'
        try:
            with open(file_path, 'r') as file:
                api_key = file.read().strip()
        except FileNotFoundError:
            return jsonify({'error': 'API key not found in environment variables or file'}), 404
        except IOError:
            return jsonify({'error': 'Error reading API key file'}), 500
    
    if api_key:
        return jsonify({'api_key': api_key}), 200
    else:
        return jsonify({'error': 'API key not found'}), 404


@app.route('/get_audio', methods=['POST', 'GET'])
def get_audio():
    characters = request.args.get('chars', '')
    if not characters:
        return "No characters provided", 400

    audio_chunks = []
    for char in characters:
        if char in audio_mappings and 'audio' in audio_mappings[char]:
            file_name = audio_mappings[char]['audio']
            file_path = os.path.join('..', 'chinese_audio_clips', file_name)
            file_path2 = os.path.join('chinese_audio_clips', file_name)
            if os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    audio_chunks.append(f.read())
            elif os.path.exists(file_path2):
                with open(file_path2, 'rb') as f:
                    audio_chunks.append(f.read())
            else:
                # print(f"Audio file not found for character: {char}")
                pass
        else:
            # print(f"No audio mapping found for character: {char}")
            pass

    if not audio_chunks:
        return "No audio found for the provided characters", 404

    combined_audio = b''.join(audio_chunks)

    buffer = io.BytesIO(combined_audio)
    buffer.seek(0)

    return send_file(buffer, mimetype="audio/mpeg")

@app.route('/debug')
def debug():
    return jsonify({"debug": app.debug})

if __name__ == '__main__':
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=5003, debug=debug)
