from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask import send_file
from datetime import timedelta
from datetime import datetime
from datetime import date
from datetime import timezone
from functools import wraps
from urllib.parse import unquote
import logging
import random
import json
import time
import os
import io
from sqlalchemy.exc import SQLAlchemyError

# from gen_data_from_word_list import gen_data_from_word_list

from extensions import db
from dbmodels import UserProgress, Card, StrokeData

def create_app():
    app = Flask(__name__)
    app.secret_key = os.urandom(24)
    app.permanent_session_lifetime = timedelta(hours=32)
    app.config['SESSION_COOKIE_SECURE'] = True  # for HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'flashcards.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)

    with app.app_context():
        db.create_all()

    return app

app = create_app()

log_file = 'zhongwen.log'
if os.path.exists('/home/patakk/logs'):
    log_file = '/home/patakk/logs/zhongwen.log'

# logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    filename=log_file)
logger = logging.getLogger(__name__)

logger.info("Application root directory: " + app.config['APPLICATION_ROOT'])

with app.app_context():
    db.create_all()

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
        if getshortdate() != data.get('new_cards_limit_last_updated'):
            data["new_cards_limit"] = data["base_new_cards_limit"]
            data["new_cards_limit_last_updated"] = getshortdate()
            
            # Update the database with the new values
            user_prog.new_cards_limit = data["new_cards_limit"]
            user_prog.new_cards_limit_last_updated = data["new_cards_limit_last_updated"]
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

ENABLE_TIMING = False 

@app.before_request
def make_session_permanent():
    session.permanent = True
    app.logger.info(f"Session at start of request: {session}")


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


def hard_session_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        logger.info(f"Session data: {session}")
        if 'deck' not in session:
            session['deck'] = 'minideck'
        if 'font' not in session:
            session['font'] = 'Noto Sans Mono'
        logger.info(f"Username in session: {session.get('username', 'Not set')}")
        if session.get('username', 'tempuser') == 'tempuser':
            logger.info("User not logged in, redirecting to login page")
            return redirect(url_for('login'))
        return func(*args, **kwargs)
    return wrapper

def session_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if 'deck' not in session:
            session['deck'] = 'minideck'
        if 'font' not in session:
            session['font'] = 'Noto Sans Mono'
        if 'darkmode' not in session:
            session['darkmode'] = False
        if 'username' not in session:
            session['username'] = 'tempuser'
        return func(*args, **kwargs)
    return wrapper

def getshortdate():
    return datetime.now(timezone.utc).strftime('%Y%m%d')


class FlashcardApp:
    def __init__(self):
        
        self.NUM_BOXES = 6
        session = {}
        self.REVIEW_INTERVALS = [0, 1, 3, 7, 14, 30]  # days for each box
        self.DIFFICULTY_CAP = 3.0
        self.STREAK_FACTOR = 20
        self.BASE_NEW_CARDS_LIMIT = 5

        self.daily_new_cards = {}
        self.last_new_cards_date = {}
        self.presented_new_cards = {}
        self.decks = {
            "minideck": {'file': "data/mini_deck.json", 'name': 'Minideck'},
            "shas": {'file': "data/shas_class_cards.json", 'name': 'ShaSha\'s Class'},
            "top140": {'file': "data/top140_cards.json", 'name': 'Top 140'},
            "hsk1": {'file': "data/hsk1_cards.json", 'name': 'HSK 1'},
            "hsk2": {'file': "data/hsk2_cards.json", 'name': 'HSK 2'},
            "hsk3": {'file': "data/hsk3_cards.json", 'name': 'HSK 3'},
            "hsk4": {'file': "data/hsk4_cards.json", 'name': 'HSK 4'},
            "hsk5": {'file': "data/hsk5_cards.json", 'name': 'HSK 5'},
            "hsk6": {'file': "data/hsk6_cards.json", 'name': 'HSK 6'},
            "review": {'file': "data/review_deck.json", 'name': 'ReviewDeck'},
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
        filename = self.decks[deck]['file']
        if filename.endswith('.json'):
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        elif filename.endswith('.txt'):
            words = open(filename, 'r', encoding='utf-8').read().strip().split('\n')
            # words_data = gen_data_from_word_list(words)
            return words_data
    def set_deck(self, deck):
        self.current_deck = deck

    def load_user_progress(self, file_path):
        if file_path and os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                try:
                    loaded_user_prog = json.load(f)
                    if getshortdate() != loaded_user_prog.get('new_cards_limit_last_updated'):
                        loaded_user_prog["new_cards_limit"] = loaded_user_prog["base_new_cards_limit"]
                        loaded_user_prog["new_cards_limit_last_updated"] = getshortdate()
                    return loaded_user_prog
                except:
                    time.sleep(0.1)
                    loaded_user_prog = json.load(f)
                    if getshortdate() != loaded_user_prog.get('new_cards_limit_last_updated'):
                        loaded_user_prog["new_cards_limit"] = loaded_user_prog["base_new_cards_limit"]
                        loaded_user_prog["new_cards_limit_last_updated"] = getshortdate()
                    return loaded_user_prog
        return loaded_user_prog

    # def save_user_progress(self, username, progress):
    #     hashed_username = hashlib.sha256(username.encode()).hexdigest()
    #     file_path = os.path.join('user_progress', f"{hashed_username}.json")
    #     with open(file_path, 'w', encoding='utf-8') as f:
    #         json.dump(progress, f, ensure_ascii=False, indent=2)

    
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
            logger.info(f"Character {character} not found in deck {deck}")
            for deck_name in self.cards:
                if deck_name != deck and character in self.cards[deck_name]:
                    base_data = self.cards[deck_name][character]
                    logger.info(base_data)
                    break
        return base_data

    def select_random_card(self, deck):
        return random.choice(list(self.cards[deck].keys()))

    # def record_view(self, username, character):
    #     if character not in session[session['username']]["progress"]:
    #         session[session['username']]["progress"][character] = {
    #             "views": 1,
    #             "answers": [],
    #             "decks": [],
    #             "box": 1,
    #             "streak": 0,
    #             "num_incorrect": 0,
    #             "difficulty": 1.0,
    #             "next_review": datetime.now(timezone.utc).isoformat()
    #         }
    #         if session['deck'] not in session[session['username']]["progress"][character]["decks"]:
    #             session[session['username']]["progress"][character]["decks"].append(session['deck'])
    #     else:
    #         session[session['username']]["progress"][character]["views"] += 1
    #     session[session['username']]['username'] = username
    #     #self.save_user_progress(username, self.user_progr)

    def record_answer(self, username, character, correct):
        uprogress = load_user_progress(username)
        if character not in uprogress['progress']:
            uprogress['progress'][character] = {
                "answers": [],
                "decks": [],
                "box": 1,
                "streak": 0,
                "num_incorrect": 0,
                "views": 0,
                "difficulty": 1.0,
                "next_review": datetime.now(timezone.utc).isoformat()
            }
        
        char_progress = uprogress['progress'][character]
        
        is_ahead_of_schedule = char_progress.get('next_review') > datetime.now(timezone.utc).isoformat()

        if correct == 'true':
            char_progress["answers"].append('correct')
            if not is_ahead_of_schedule:
                char_progress["box"] = min(self.NUM_BOXES, char_progress["box"] + 1)
                logger.info(f"Character {character} is not ahead of schedule, so advancing to next box")
            else:
                logger.info(f"Character {character} is ahead of schedule, so not advancing to next box")
            char_progress["streak"] += 1
        else:
            char_progress["answers"].append('incorrect')
            if not is_ahead_of_schedule:
                char_progress["box"] = 1
                logger.info(f"Character {character} is not ahead of schedule, so resetting to box 1")
            else:
                logger.info(f"Character {character} is ahead of schedule, so not resetting to box 1")
            char_progress["num_incorrect"] += 1
            char_progress["streak"] = 0
        
        if session['deck'] not in char_progress["decks"]:
            char_progress["decks"].append(session['deck'])
        
        char_progress['views'] += 1
        char_progress["difficulty"] = self.calculate_difficulty(char_progress)
        if not is_ahead_of_schedule:
            char_progress["next_review"] = self.calculate_next_review_date(char_progress)
        else:
            logger.info(f"Character {character} is ahead of schedule, so not updating next review date")
        uprogress['progress'][character] = char_progress
        
        save_user_progress(username, uprogress)

    def calculate_difficulty(self, char_progress):
        base_difficulty = 1 + max(0, char_progress["num_incorrect"] - 2) / 10
        streak_factor = max(0.5, 1 - (char_progress["streak"] / self.STREAK_FACTOR))
        return min(self.DIFFICULTY_CAP, base_difficulty * streak_factor)

    def calculate_next_review_date(self, char_progress):
        base_interval = self.REVIEW_INTERVALS[char_progress["box"] - 1]
        if base_interval == 0:
            return datetime.now(timezone.utc).isoformat()  # Immediate review for box 1
        difficulty = char_progress["difficulty"]
        #return (datetime.now(timezone.utc) + timedelta(days=base_interval / difficulty)).isoformat()
        return (datetime.now(timezone.utc) + timedelta(days=base_interval / difficulty)).isoformat()
    
    def get_due_cards(self, username, deck, count=10000):
        due_cards = []
        current_time = datetime.now(timezone.utc)
        all_deck_cards = set(self.cards[deck].keys())
        
        uprogress = load_user_progress(username)
        for character in all_deck_cards:
            character_progress = uprogress['progress'].get(character, {})
            next_review_str = character_progress.get('next_review')
            if next_review_str:
                try:
                    next_review = datetime.fromisoformat(next_review_str)
                    if next_review.tzinfo is None:
                        next_review = next_review.replace(tzinfo=timezone.utc)
                    if next_review <= current_time:
                        due_cards.append(character)
                except ValueError:
                    logger.info(f"Invalid date format for character {character}: {next_review_str}")
        
        random.shuffle(due_cards)
        due_cards = due_cards[:count]
        
        return due_cards

    def get_new_cards(self, username, deck, force_new_cards=False):
        today = date.today()
        user_deck_key = (username, deck)
        uprogress = load_user_progress(username)
        if (deck not in load_user_value(username, 'daily_new_cards') or 
            load_user_value(username, 'last_new_cards_date').get(deck) != today.isoformat()
            or force_new_cards):
            
            logger.info(f"Generating new cards for user {username} in deck {deck}")
            all_deck_cards = set(self.cards[deck].keys())
            
            new_cards = [
                character for character in all_deck_cards 
                if character not in uprogress['progress']
            ]
            
            seed = int(f"{today.year}{today.month:02d}{today.day:02d}")
            rng = random.Random(seed+17238)
            
            new_cards = sorted(new_cards)
            rng.shuffle(new_cards)
            uprogress["daily_new_cards"][deck] = new_cards[:uprogress["new_cards_limit"]]
            if force_new_cards:
                logger.info('Forced new cards')
                logger.info(uprogress["daily_new_cards"][deck])
            uprogress["last_new_cards_date"][deck] = today.isoformat()
            if not force_new_cards:
                uprogress["presented_new_cards"][deck] = []
            save_user_progress(username, uprogress)

        remaining_new_cards = [card for card in uprogress["daily_new_cards"].get(deck, [])
                               if card not in uprogress["presented_new_cards"].get(deck, [])]
        return remaining_new_cards

    def select_card(self, username, deck):
        if username == 'tempuser':
            return '', random.choice(list(self.cards[deck].keys()))

        new_cards_limit = load_user_value(username, 'new_cards_limit')
        # base_new_cards_limit = load_user_value(username, 'base_new_cards_limit')
        new_cards_limit_last_updated = load_user_value(username, 'new_cards_limit_last_updated') or getshortdate()

        message = ''

        due_cards = self.get_due_cards(username, deck)
        new_cards = self.get_new_cards(username, deck)[:new_cards_limit]
        presented_new_cards = load_user_value(username, 'presented_new_cards') or {}

        card_to_return = None
        attempts = 0
        max_attempts = 10
        while attempts < max_attempts:

            has_due_cards = len(due_cards) > 0
            has_new_cards = len(new_cards) > 0

            if has_due_cards and has_new_cards:
                chance = 0.5
                if len(due_cards) < 5:
                    chance = 0.3
                if len(due_cards) < 3:
                    chance = 0.2
                if len(due_cards) > 16:
                    chance = 0.75
                if len(due_cards) > 20:
                    chance = 0.9
                if random.random() < chance:  # 50% chance for due cards
                    logger.info('Selecting from due cards')
                    card_to_return = random.choice(due_cards)
                else:
                    logger.info('Selecting from new cards')
                    card_to_return = random.choice(new_cards)
            elif has_due_cards and len(due_cards) > 1:
                logger.info('Selecting from due cards only')
                card_to_return = random.choice(due_cards)
                # if len(due_cards) <= min(5, new_cards_limit):
                #     logger.info('too few due cards, adding new cards')
                #     logger.info(new_cards)
                #     new_cards = self.get_new_cards(username, deck, force_new_cards=True)
                #     logger.info(new_cards)
            elif has_new_cards:
                logger.info('Selecting from new cards only')
                logger.info('new cards len ' + str(len( new_cards )))
                card_to_return = random.choice(new_cards)
            else:
                logger.info('No due or new cards (or only 1 due card),  adding new cards')
                new_cards = self.get_new_cards(username, deck, force_new_cards=True)
                logger.info(new_cards)
                if len(new_cards) > 0:
                    card_to_return = random.choice(new_cards)
                else:
                    card_to_return = random.choice(presented_new_cards[deck])
                message = ''
                # if len(due_cards) == 1:
                #     message = 'message_1'
                # elif len(new_cards) == 0:
                #     message = 'message_2'

            # elif new_cards:
            #     logger.info('Selecting from new cards only')
            #     logger.info('new cards len ' + str(len(new_cards)))
            #     card_to_return = random.choice(new_cards)
            # else:
            #     logger.info('No due or new cards (or only 1 due card), increasing new cards limit and selecting random card from deck')
            #     logger.info('Attempts ' + str(attempts) + " " + str(new_cards_limit))
            #     new_cards_limit = int(new_cards_limit)
            #     # session[session['username']]["new_cards_limit"] += int(session[session['username']]["base_new_cards_limit"])
            #     new_cards_limit = int(base_new_cards_limit)
            #     new_cards_limit_last_updated = getshortdate()
            #     #self.save_user_progress(username, self.user_prog)
            #     new_cards = self.get_new_cards(username, deck, force_new_cards=True)
            #     if len(new_cards) == 0:
            #         new_cards = list(self.cards[deck].keys())
            #         card_to_return = random.choice(new_cards)
            #         logger.info('Card to return ' + str(card_to_return))
            #     else:
            #         logger.info(new_cards)
            #         card_to_return = random.choice(new_cards)
            
            if card_to_return != session['current_card'] or session['current_card'] is None:
                break
            attempts += 1
        # while attempts < max_attempts:
        #     if due_cards and new_cards:
        #         chance = 0.5
        #         if len(due_cards) < 5:
        #             chance = 0.3
        #         if random.random() < chance:  # 50% chance for due cards
        #             logger.info('Selecting from due cards')
        #             card_to_return = random.choice(due_cards)
        #         else:
        #             logger.info('Selecting from new cards')
        #             card_to_return = random.choice(new_cards)
        #     elif len(due_cards) > 1:
        #         logger.info('Selecting from due cards only')
        #         card_to_return = random.choice(due_cards)
        #         if len(due_cards) <= min(5, new_cards_limit):
        #             logger.info('too few due cards, adding new cards')
        #             logger.info(new_cards)
        #             new_cards = self.get_new_cards(username, deck, force_new_cards=True)
        #             logger.info(new_cards)
        #     elif new_cards:
        #         logger.info('Selecting from new cards only')
        #         logger.info('new cards len ' + str(len(new_cards)))
        #         card_to_return = random.choice(new_cards)
        #     else:
        #         logger.info('No due or new cards (or only 1 due card), increasing new cards limit and selecting random card from deck')
        #         logger.info('Attempts ' + str(attempts) + " " + str(new_cards_limit))
        #         new_cards_limit = int(new_cards_limit)
        #         # session[session['username']]["new_cards_limit"] += int(session[session['username']]["base_new_cards_limit"])
        #         new_cards_limit = int(base_new_cards_limit)
        #         new_cards_limit_last_updated = getshortdate()
        #         #self.save_user_progress(username, self.user_prog)
        #         new_cards = self.get_new_cards(username, deck, force_new_cards=True)
        #         if len(new_cards) == 0:
        #             new_cards = list(self.cards[deck].keys())
        #             card_to_return = random.choice(new_cards)
        #             logger.info('Card to return ' + str(card_to_return))
        #         else:
        #             logger.info(new_cards)
        #             card_to_return = random.choice(new_cards)

            
        #     if card_to_return != session['current_card'] or session['current_card'] is None:
        #         break
        #     attempts += 1

        if attempts == max_attempts:
            logger.info(f"Warning: Max attempts reached when selecting card")

        daily_new_cards = load_user_value(username, 'daily_new_cards') or {}
        presented_new_cards = load_user_value(username, 'presented_new_cards') or {}
        if card_to_return in daily_new_cards.get(deck, []):
            if deck not in presented_new_cards:
                presented_new_cards[deck] = []
            if card_to_return not in presented_new_cards[deck]:
                presented_new_cards[deck].append(card_to_return)

        store_user_value(username, 'presented_new_cards', presented_new_cards)
        store_user_value(username, 'new_cards_limit', new_cards_limit)
        store_user_value(username, 'new_cards_limit_last_updated', new_cards_limit_last_updated)
        
        logger.info(f"New cards: {new_cards}")
        logger.info(f"Due cards: {due_cards}")
        logger.info(f"Selected card: {card_to_return}")
        logger.info(f"presented_new_cards: {presented_new_cards}")
        
        # flashcard_app.save_user_progress(session['username'], session[session['username']])
        session['current_card'] = card_to_return
        # print('returning', card_to_return)
        return message, card_to_return


flashcard_app = FlashcardApp()

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

@app.route('/hanziviz')
def hanziviz():
    characters = {}
    for key in flashcard_app.decks:
        if 'hsk' in key:
            for character in flashcard_app.cards[key]:
                characters[character] = flashcard_app.cards[key][character]
    return render_template('hanziviz.html', darkmode=session['darkmode'], characters=characters)


@app.route('/login', methods=['GET', 'POST'])
@timing_decorator
def login():
    if request.method == 'POST':
        username = request.form['username']
        session['username'] = username
        session['current_card'] = None
        
        user_exists = UserProgress.query.filter_by(username=username).first() is not None
        if not user_exists:
            # Create a new user with default values
            logger.info(f"Creating new user: {username}")
            new_user = UserProgress(
                username=username,
                base_new_cards_limit=20,  # Default value
                new_cards_limit=20,  # Default value
                new_cards_limit_last_updated=getshortdate(),
                daily_new_cards={},
                last_new_cards_date={},
                presented_new_cards={},
                progress={}
            )
            db.session.add(new_user)
            db.session.commit()
            return redirect(url_for('welcome'))
        else:
            logger.info(f"User {username} logged in")
            return redirect(url_for('home'))
    return render_template('login.html')

@app.route('/log', methods=['POST'])
def log():
    data = request.json
    if data and 'log' in data:
        log_message = data['log']
        # Do something with the log message, e.g., print it or save it to a file
        logger.info(f"[LOG] {log_message}")
        return jsonify({"status": "success", "message": "Log received"}), 200
    return jsonify({"status": "error", "message": "Invalid log data"}), 400


@app.route('/logout')
def logout():
   session.pop('username', None)
   return redirect(url_for('login'))

# New route for the welcome page
@app.route('/welcome')
@session_required
@timing_decorator
def welcome():
    return render_template('welcome.html', darkmode=session['darkmode'], username=session['username'], decks=flashcard_app.decks)

@app.route('/')
@session_required
@timing_decorator
def home():
    return render_template('home.html', darkmode=session['darkmode'], username=session['username'], decks=flashcard_app.decks)

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

@app.route('/pinyinenglish')
@session_required
@timing_decorator
def pinyinenglish():
    return render_template('pinyinenglish.html', darkmode=session['darkmode'], username=session['username'])


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

@app.route('/characters')
@session_required
@timing_decorator
def characters():
    character = request.args.get('query')
    if not character:
        characters = list(flashcard_app.cards[session['deck']].keys())
        logger.info(f"Initial characters: {len(characters)}")  # Debug print
        return render_template('characters.html', username=session['username'], characters=characters, character=None)
    
    pc = packed_data(character)
    characters = list(flashcard_app.cards[pc['deck']].keys())
    return render_template('characters.html', username=session['username'], characters=characters, character=pc)


@app.route('/grid', methods=['GET'])
@session_required
@timing_decorator
def grid():
    character = request.args.get('query')
    querydeck = request.args.get('deck')
    if not querydeck:
        querydeck = 'minideck'
    logger.info(f"Query deck: {querydeck}")
    if not character:
        characters = list(flashcard_app.cards.get(querydeck, {}).keys())
        logger.info(f"Initial characters: {len(characters)}")  # Debug print
        return render_template('grid.html', username=session['username'], darkmode=session['darkmode'], characters=characters, character=None, decks=flashcard_app.decks, deck=querydeck)
    pc = packed_data(character)
    characters = list(flashcard_app.cards[pc['deck']].keys())
    return render_template('grid.html', username=session['username'], darkmode=session['darkmode'], characters=characters, character=pc, decks=flashcard_app.decks, deck=querydeck)


@app.route('/puzzles')
@session_required
@timing_decorator
def puzzles():
    characters = dict(flashcard_app.cards[session['deck']].items())
    return render_template('puzzles.html', darkmode=session['darkmode'], username=session['username'], characters=characters, decks=flashcard_app.decks, deck=session['deck'])

@app.route('/hanzitest_pinyin')
@session_required
@timing_decorator
def hanzitest_pinyin():
    characters = dict(flashcard_app.cards[session['deck']].items())
    return render_template('puzzles/hanzitest_pinyin.html', darkmode=session['darkmode'], username=session['username'], characters=characters, decks=flashcard_app.decks, deck=session['deck'])

@app.route('/hanzitest_draw')
@session_required
@timing_decorator
def hanzitest_draw():
    deck = session['deck']
    characters_data = []
    for char, data in flashcard_app.cards[deck].items():
        characters_data.append({
            "character": char,
            "pinyin": data['pinyin'],
            "english": data['english'],
        })
    return render_template('puzzles/hanzitest_draw.html', darkmode=session['darkmode'], username=session['username'], characters=characters_data, decks=flashcard_app.decks, deck=session['deck'])

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

@app.route('/get_characters_for_practice', methods=['GET'])
@session_required
@timing_decorator
def get_characters_for_practice():
    deck = session['deck']
    characters_data = []
    for char, data in flashcard_app.cards[deck].items():
        characters_data.append({
            "character": char,
            "pinyin": data['pinyin'],
            "english": data['english'],
        })
    return jsonify({"characters": characters_data})

@app.route('/hanzitest_choices')
@session_required
@timing_decorator
def hanzitest_choices():
    characters = dict(flashcard_app.cards[session['deck']].items())
    return render_template('puzzles/hanzitest_choices.html', darkmode=session['darkmode'], username=session['username'], characters=characters, decks=flashcard_app.decks, deck=session['deck'])


@app.route('/hanzitest_fillin')
@session_required
@timing_decorator
def hanzitest_fillin():
    if 'fillin' not in session:
        session['fillin'] = json.load(open('data/fillin_puzzles.json', 'r', encoding='utf-8'))
    klist = session['fillin']['contextClues']
    random.shuffle(klist)
    fillin = {k: session['fillin']['contextClues'][k] for k in range(10)}
    characters = dict(flashcard_app.cards[session['deck']].items())
    return render_template('puzzles/hanzitest_fillin.html', darkmode=session['darkmode'], fillin=fillin, username=session['username'], characters=characters, decks=flashcard_app.decks, deck=session['deck'])

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


from flask import request, jsonify

@app.route('/get_characters_pinyinenglish', methods=['GET', 'POST'])
@session_required
def get_characters_pinyinenglish():
    all_data = []
    characters = None

    if request.method == 'POST':
        data = request.get_json()
        characters = data.get('characters') if data else None
    
    # print("Request method:", request.method)
    # print("Received characters:", characters)

    inserted = []
    if characters and isinstance(characters, list) and len(characters) > 0:
        # If specific characters are provided
        characters = sorted(characters)
        for character in characters:
            for deck in flashcard_app.cards:
                if character in flashcard_app.cards[deck] and character not in inserted:
                    data = flashcard_app.get_char_from_deck(deck, character)
                    all_data.append({
                        "character": character,
                        "pinyin": data.get('pinyin', ''),
                        "english": data.get('english', ''),
                        "hsk_level": data.get('hsk_level', ''),
                        "deck": deck
                    })
                    inserted.append(character)
                    break  # Stop searching once we find the character in a deck
    else:
        # If no specific characters are provided or it's a GET request, get all characters
        for deck in flashcard_app.cards:
            for character in flashcard_app.cards[deck]:
                data = flashcard_app.get_char_from_deck(deck, character)
                all_data.append({
                    "character": character,
                    "pinyin": data.get('pinyin', ''),
                    "english": data.get('english', ''),
                    "hsk_level": data.get('hsk_level', ''),
                    "deck": deck
                })

    return jsonify({"characters": all_data})



@app.route('/change_font', methods=['POST'])
@timing_decorator
def change_font():
    session['font'] = request.args.get('font')
    logger.info(f"Font changed to {session['font']}")
    return jsonify({"message": "font changed successfully to " + session['font']})


@app.route('/setdarkmode', methods=['POST'])
@session_required
@timing_decorator
def setdarkmode():
    session['darkmode'] = request.args.get('darkmode')
    return jsonify({"message": "darkmode changed successfully to " + session['darkmode']})


@app.route('/getdarkmode', methods=['GET'])
@session_required
@timing_decorator
def getdarkmode():
    return jsonify({"darkmode": session['darkmode']})


@app.route('/increase_max_cards', methods=['POST'])
@timing_decorator
@session_required
def increase_max_cards():
    username = session.get('username')
    current_base_new = load_user_value(username, 'base_new_cards_limit')
    current_new_cards = load_user_value(username, 'new_cards_limit')
    max_cards = current_base_new + current_base_new*0
    success, message = store_user_value(username, 'new_cards_limit', max_cards)
    logger.info(f"Max cards increased to {max_cards}")
    session['new_cards_limit'] = max_cards
    cards = flashcard_app.get_new_cards(username, session['deck'], force_new_cards=True)
    logger.info(f"New cards: {cards}")
    return jsonify({"message": "Increased max cards to " + str(max_cards)})


@app.route('/set_max_cards', methods=['POST'])
@timing_decorator
@session_required
def set_max_cards():
    username = session.get('username')
    if not username:
        logger.warning("Attempt to set max cards without logged in user")
        return jsonify({"message": "User not logged in"}), 401

    try:
        max_cards = int(request.args.get('maxcards'))
    except (ValueError, TypeError):
        logger.error(f"Invalid maxcards value: {request.args.get('maxcards')}")
        return jsonify({"error": "Invalid maxcards value"}), 400

    success, message = store_user_value(username, 'base_new_cards_limit', max_cards)
    if not success:
        logger.error(f"Failed to update base_new_cards_limit for user {username}: {message}")
        return jsonify({"error": message}), 500

    success, message = store_user_value(username, 'new_cards_limit', max_cards)
    if not success:
        logger.error(f"Failed to update new_cards_limit for user {username}: {message}")
        return jsonify({"error": message}), 500

    deck = session.get('deck')
    if deck:
        try:
            cards = flashcard_app.get_new_cards(username, deck)
            daily_new_cards = load_user_value(username, 'daily_new_cards') or {}
            daily_new_cards[deck] = cards
            success, message = store_user_value(username, 'daily_new_cards', daily_new_cards)
            if not success:
                logger.error(f"Failed to update daily_new_cards for user {username}: {message}")
                return jsonify({"error": message}), 500
        except Exception as e:
            logger.exception(f"Error updating daily_new_cards for user {username}")
            return jsonify({"message": "An error occurred updating daily new cards"}), 500

    logger.info(f"Successfully set base_new_cards_limit for user {username} to {max_cards}")
    return jsonify({"message": "Changed base new cards limit successfully"})



@app.route('/get_font')
@session_required
@timing_decorator
def get_font():
    response = jsonify({"font": session['font']})
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
    logger.info(f"Current deck: {session['deck']}")
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
    return render_template('lists.html', darkmode=session['darkmode'], categories=example_lists, initial_uri=uri, decks=flashcard_app.decks, username=session['username'])

@app.route('/kongzi')
@session_required
@timing_decorator
def kongzi():
    uri = request.args.get('uri')
    return render_template('kongzi.html',  decks=flashcard_app.decks, username=session['username'])


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
    logger.info("Mobile or tablet device accessed the flashcard")
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
    logger.info(f"Answer recorded for {character}: {correct}")
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



@app.route('/get_api_key', methods=['GET'])
def get_api_key():
    api_key = os.environ.get('OPENAI_API_KEY_ZHONG_WEN')
    if not api_key:
        file_path = '/home/patakk/.zhongwen-openai-apikey'
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

@app.route('/save_stroke_data', methods=['POST'])
@session_required
def save_stroke_data():
    data = request.json
    character : str = data.get('character')
    strokes : dict[dict[str, float]] = data.get('strokes')
    positioner : dict = data.get('positioner')
    mistakes: int = data.get('mistakes')
    stroke_count : int = data.get('strokeCount')
    username : str = session['username']
    chardata = {
        'character': character,
        'strokes': strokes,
        'positioner': positioner,
        'mistakes': mistakes,
        'strokeCount': stroke_count,
        'username': username,
    }
    
    new_stroke_data = StrokeData.from_dict(chardata)
    db.session.add(new_stroke_data)
    db.session.commit()
    return jsonify({"message": "Stroke data saved successfully"})


def get_all_stroke_data_():
    username = session['username']
    
    characters = db.session.query(StrokeData.character).filter_by(username=username).distinct().all()
    characters = [char[0] for char in characters]

    result = {}
    for character in characters:
        stroke_data_entries = StrokeData.query.filter_by(
            username=username,
            character=character
        ).order_by(StrokeData.timestamp.desc()).all()

        character_attempts = []
        for entry in stroke_data_entries:
            character_attempts.append({
                "id": entry.id,
                "strokes": entry.strokes,
                "positioner": entry.positioner,
                "mistakes": entry.mistakes,
                "stroke_count": entry.stroke_count,
                "timestamp": entry.timestamp.isoformat()
            })

        result[character] = character_attempts

    return result

from io import BytesIO
from flask import send_file

from PIL import Image, ImageDraw
from io import BytesIO

@app.route('/character_animation/<character>', methods=['GET'])
@session_required
def character_animation(character):
    strokes_per_character = get_all_stroke_data_()
    if character not in strokes_per_character:
        return "Character not found", 404

    strokes_datas = strokes_per_character[character]
    frames = []
    
    # Set up the image parameters
    width, height = 100, 100
    background_color = (255, 255, 255)  # White background
    point_color = (0, 0, 0)  # Black points
    
    if len(strokes_datas) < 4:
        return "Not enough data to create animation", 400
    for data in strokes_datas:
        # Create a blank image
        img = Image.new('RGB', (width, height), background_color)
        draw = ImageDraw.Draw(img)
        strokes = data['strokes']
        # Draw strokes up to the current index
        for key in strokes:
            try:
                stroke = strokes[key]
            except:
                stroke = key
            for point in stroke:
                x = int(point['x'] * width)
                y = int((1 - point['y']) * height - height*0.05) 
                draw.ellipse([x-2, y-2, x+2, y+2], fill=point_color)
        
        # Add the frame to our list
        frames.append(img)
    
    # Create GIF
    output = BytesIO()
    frames[0].save(output, format='GIF', save_all=True, append_images=frames[1:], duration=100, loop=0)
    output.seek(0)
    
    return send_file(output, mimetype='image/gif')



@app.route('/get_all_stroke_data', methods=['GET'])
@session_required
def get_all_stroke_data():
    return jsonify(get_all_stroke_data_())

@app.route('/hanzi_strokes_history')
@session_required
# @hard_session_required
def hanzi_strokes_history():
    strokes_per_character = get_all_stroke_data_()
    return render_template('hanzistats.html', darkmode=session['darkmode'], username=session['username'], decks=flashcard_app.decks, strokes_per_character=strokes_per_character)

@app.route('/hanzi_strokes_charlist')
@session_required
# @hard_session_required
def hanzi_strokes_charlist():
    strokes_per_character = get_all_stroke_data_()
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
    app.run(host='0.0.0.0', port=5135, debug=True)
