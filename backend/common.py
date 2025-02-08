import json
import os

from .flashcard_app import init_flashcard_app, get_flashcard_app

BASE_DIR = '.'
DATA_DIR = os.path.join(BASE_DIR, 'data')

DECKS_INFO = {
    "minideck": {"file": "mini_deck.json", "name": "Minideck"},
    "hsk1": {"file": "hsk1_cards.json", "name": "HSK 1"},
    "hsk2": {"file": "hsk2_cards.json", "name": "HSK 2"},
    "hsk3": {"file": "hsk3_cards.json", "name": "HSK 3"},
    "hsk4": {"file": "hsk4_cards.json", "name": "HSK 4"},
    "hsk5": {"file": "hsk5_cards.json", "name": "HSK 5"},
    "hsk6": {"file": "hsk6_cards.json", "name": "HSK 6"},
}

def _load_json_file(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        return {}

def _load_cards(deck_name):
    if deck_name not in DECKS_INFO:
        return {}
    filename = DECKS_INFO[deck_name]["file"]
    filepath = os.path.join(DATA_DIR, filename)
    return _load_json_file(filepath)

CARDDECKS = {deck: _load_cards(deck) for deck in DECKS_INFO}
ANTHROPIC_DATA = _load_json_file(os.path.join(DATA_DIR, "anthropic.json"))

init_flashcard_app({}, ANTHROPIC_DATA)
flashcard_app = get_flashcard_app()

def get_card_examples(deck, character):
    base_data = CARDDECKS[deck].get(character, {})
    if not base_data:
        for deck_name in CARDDECKS:
            if deck_name != deck and character in CARDDECKS[deck_name]:
                base_data = CARDDECKS[deck_name][character]
                break
    anthropic_data = ANTHROPIC_DATA.get(character, {})
    return {**base_data, **anthropic_data}

def get_char_from_deck(deck, character):
    base_data = CARDDECKS[deck].get(character, {})
    if not base_data:
        for deck_name in CARDDECKS:
            if deck_name != deck and character in CARDDECKS[deck_name]:
                base_data = CARDDECKS[deck_name][character]
                break
    return base_data