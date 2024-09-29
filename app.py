from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import os
import json
from datetime import datetime
import random
from functools import wraps

app = Flask(__name__)
app.secret_key = os.urandom(24)
application = app

class FlashcardApp:
    def __init__(self):
        self.user_progress_dir = "user_progress"
        self.decks = {
            "shas": "shas_class_cards.json",
            "hsk1": "hsk1_cards.json",
            "hsk2": "hsk2_cards.json",
            "hsk3": "hsk3_cards.json",
            "hsk4": "hsk4_cards.json",
            "hsk5": "hsk5_cards.json",
            "hsk6": "hsk6_cards.json",
        }
        self.current_deck = "shas"
        self.cards = {}
        for deck in self.decks:
            self.cards[deck] = self.load_cards(deck)
        with open("anthropic.json", 'r', encoding='utf-8') as f:
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
def login():
    if request.method == 'POST':
        username = request.form['username']
        session['username'] = username
        session['deck'] = 'shas'
        return redirect(url_for('home'))
    return render_template('login.html')

@app.route('/home')
@session_required
def home():
    return render_template('home.html', username=session['username'])

@app.route('/flashcards')
@session_required
def flashcards():
    return render_template('flashcards.html', username=session['username'])

@app.route('/characters')
@session_required
def characters():
    characters = list(flashcard_app.cards[session['deck']].keys())
    print(f"Initial characters: {len(characters)}")  # Debug print
    return render_template('characters.html', username=session['username'], characters=characters)


@app.route('/get_characters')
@session_required
def get_characters():
    characters = list(flashcard_app.load_cards(session['deck']).keys())
    return jsonify({"characters": characters})

@app.route('/get_card_data')
@session_required
def get_card_data():
    print(session['deck'])
    character = request.args.get('character')
    if not character:
        character = flashcard_app.select_random_card(session['deck'])
    data = flashcard_app.get_card_examples(session['deck'], character)
    return jsonify({
        "character": character,
        "pinyin": data.get('pinyin', ''),
        "english": data.get('english', ''),
        "html": data.get('examples', '')
    })


@app.route('/change_deck', methods=['POST'])
def change_deck():
    session['deck'] = request.args.get('deck')
    return jsonify({"message": "Deck changed successfully"})


@app.route('/get_deck')
@session_required
def get_deck():
    return jsonify({"deck": session['deck']})
    
@app.route('/record_view', methods=['POST'])
@session_required
def record_view():
    data = request.json
    username = session['username']
    character = data['character']
    
    flashcard_app.record_view(username, character)
    return jsonify({"message": "View recorded successfully"})

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))

with open('examples.json', 'r', encoding='utf-8') as f:
    parsed_data = json.load(f)

@app.route('/translations')
@session_required
def translations():
    categories = {
        'vocabulary': list(parsed_data['vocabulary'].keys()),
        'examples': list(parsed_data['examples'].keys())
    }
    return render_template('translations.html', categories=categories)

from urllib.parse import unquote


@app.route('/translations/<category>/<subcategory>')
@session_required
def translation_category(category, subcategory):
    category = unquote(category)
    subcategory = unquote(subcategory)
    if category not in parsed_data or subcategory not in parsed_data[category]:
        return "Category not found", 404
    translations = parsed_data[category][subcategory]
    return render_template('translation_category.html', category=category, subcategory=subcategory, translations=translations)


@app.route('/get_translation_data/<category>/<subcategory>/<chinese>')
@session_required
def get_translation_data(category, subcategory, chinese):
    category = unquote(category)
    subcategory = unquote(subcategory)
    chinese = unquote(chinese)
    
    app.logger.info(f"Category: {category}, Subcategory: {subcategory}, Chinese: {chinese}")
    if category in parsed_data and subcategory in parsed_data[category]:
        for item in parsed_data[category][subcategory]:
            if item['chinese'] == chinese:
                return jsonify(item)
    return jsonify({"error": "Translation not found"}), 404




if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
