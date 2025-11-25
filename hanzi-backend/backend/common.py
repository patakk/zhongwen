import json
import random
import requests
import os
from datetime import datetime, timezone
import yaml
import re
import jieba.posseg as pseg
from hanziconv import HanziConv
from backend.setup import config
from backend.setup import auth_keys
from backend.setup import BASE_DIR
from backend.setup import DOMAIN
import copy

import logging


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# from hanzipy.decomposer import HanziDecomposer
from pypinyin import lazy_pinyin, Style

# decomposer = HanziDecomposer()

# from .flashcard_app import init_flashcard_app, get_flashcard_app
default_darkmode = False

DATA_DIR = os.path.join(config['paths']['root'], config['paths']['data_dir'])
print("DATA_DIR:", DATA_DIR)
CARDDECKS = json.load(open(os.path.join(DATA_DIR, "decks.json")))
CHARS_CACHE = json.load(open(os.path.join(DATA_DIR, "chars_cache.json")))
STROKES_CACHE = json.load(open(os.path.join(DATA_DIR, "strokes_cache.json")))
WORDS_CACHE = json.load(open(os.path.join(DATA_DIR, "words_cache.json")))
DECOMPOSE_CACHE = json.load(open(os.path.join(DATA_DIR, "decompose_cache.json")))
TATOEBA_DATA = json.load(open(os.path.join(DATA_DIR, "tatoeba_examples.json")))
TATOEBA_MAP = json.load(open(os.path.join(DATA_DIR, "tatoeba_example_ids_by_char.json")))
AUDIO_MAPPINGS = json.load(open(os.path.join(DATA_DIR, "audio_mappings.json")))
STROKE_COUNT = json.load(open(os.path.join(DATA_DIR, "stroke_count.json")))
HANZI_DARKNESS_NOTO = json.load(open(os.path.join(DATA_DIR, "hanzi_darkness_noto.json")))
HANZI_DARKNESS_KAITI = json.load(open(os.path.join(DATA_DIR, "hanzi_darkness_kaiti.json")))
RELATED_CONCEPTS = json.load(open(os.path.join(DATA_DIR, "related_cache.json")))
OPPOSITE_CONCEPTS = json.load(open(os.path.join(DATA_DIR, "opposites_cache.json")))
DECKS_INFO = {key : CARDDECKS[key]["name"] for key in CARDDECKS}

cache_json_names = [
    'decks', 'chars_cache', 'strokes_cache', 'words_cache',
    'decompose_cache', 'tatoeba_examples', 'tatoeba_example_ids_by_char',
    'audio_mappings', 'stroke_count', 'hanzi_darkness_noto', 'hanzi_darkness_kaiti',
    'related_cache', 'opposites_cache'
]



DECKNAMES = {
    d : CARDDECKS[d]['name'] for d in CARDDECKS
}

# init_flashcard_app({})
# flashcard_app = get_flashcard_app()

pos_map = {
    'n': 'noun', 'nr': 'proper noun', 'ns': 'place noun', 'nt': 'temporal noun', 'nz': 'other noun', 'v': 'verb', 'a': 'adjective', 'ad': 'adverb', 'an': 'prenoun', 'ag': 'adjective-adverb', 'al': 'adjective-numeral', 'b': 'other', 'c': 'complement', 'd': 'adverb', 'e': 'exclamation', 'f': 'surname', 'g': 'morpheme', 'h': 'prefix', 'i': 'idiom', 'j': 'abbreviation', 'k': 'suffix', 'l': 'temporary word', 'm': 'number', 'ng': 'gender noun', 'nx': 'kernel noun', 'o': 'onomatopoeia', 'p': 'preposition', 'q': 'classifier', 'r': 'pronoun', 'u': 'auxiliary', 'v': 'verb', 'vd': 'verb-auxiliary', 'vg': 'verb-object', 'vn': 'pronoun-verb', 'w': 'punctuation', 'x': 'non-lexeme', 'y': 'language-particle', 'z': 'state-particle'
}


def send_bot_notification(message):
    """Send notification through configured channels"""
    try:
        logger.info(f"Notification: {message}")
        # Add implementation for your notification system here
    except Exception as e:
        logger.error(f"Error sending notification: {e}")

def get_pinyin(hanzi):
    result = lazy_pinyin(hanzi, style=Style.TONE)
    return ' '.join(result)


def get_tatoeba_page(character, page):
    def simplify_hanzi(text):
        return HanziConv.toSimplified(text)
    tatoebas = []
    tids = TATOEBA_MAP.get(character, [])
    examples = []
    is_last = False
    if not tids:
        return examples, is_last
    perpage = 5
    aa = perpage*page
    bb = aa + perpage
    if aa < 0:
        aa = 0
        bb = perpage
    if bb > len(TATOEBA_MAP.get(character)):
        bb = len(TATOEBA_MAP.get(character))
        aa = bb - perpage
        is_last = True
    if perpage > len(TATOEBA_MAP.get(character)):
        aa = 0
        bb = len(TATOEBA_MAP.get(character))
        is_last = True
    for tid in tids[aa:bb]:
        tatoebas.append(TATOEBA_DATA[tid])

    '''for _, t in enumerate(tatoebas):
        try:
            t['cmn'] = simplify_hanzi(t['cmn'])
            words = pseg.cut(t['cmn'])
            cmn = []
            for a, b in words:
                cmn.append({**get_char_info(a), 'character': a})
            examples.append({**t, 'cmn': cmn})
        except:
            pass'''

    return tatoebas, is_last

def remove_variantof(char_info, ew=False):
    pinyin = [p for p in char_info['pinyin']]
    english = [p for p in char_info['english']]
    if ew:
        ewords = [p for p in char_info['example_words']]
        ewords2 = []
    else:
        ewords = [None]*len(english)
    pinyin2 = []
    english2 = []
    for eng, pin, eword in zip(english, pinyin, ewords):
        if 'variant of' in eng.lower():
            continue
        pinyin2.append(pin)
        english2.append(eng)
        if ew:
            ewords2.append(eword)
    char_info['pinyin'] = pinyin2
    char_info['english'] = english2
    if ew:
        char_info['example_words'] = ewords2
    return char_info

def get_char_info(character, full=False):
    if full:
        char_info = copy.deepcopy(CHARS_CACHE.get(character, {}))
        char_info = remove_variantof(char_info, ew=True)
    else:
        char_info = copy.deepcopy(WORDS_CACHE.get(character, {
            'character': character,
            'pinyin': ['N/A'],
            'english': ['N/A']
        }))
        char_info = remove_variantof(char_info, ew=False)

    return char_info


def getshortdate():
    return datetime.now(timezone.utc).strftime("%Y%m%d")

def get_chars_info(characters, function=False):
    return {c: get_char_info(c) for c in characters}


CARDDECKS_W_PINYIN = {
    deck: {
        "name": CARDDECKS[deck]["name"],
        "chars": get_chars_info(CARDDECKS[deck]["chars"])
    } for deck in CARDDECKS
}

with open(f"{DATA_DIR}/decks_cache.json", "w", encoding="utf-8") as f:
    json.dump(CARDDECKS_W_PINYIN, f, ensure_ascii=False)


def get_random_chars_from_deck(deck, n, function=False):
    characters = CARDDECKS[deck]["chars"][:]
    random.shuffle(characters)
    characters = characters[:n]
    return get_chars_info(characters)


def get_recursive_decomposition(char, memo=None):
    if memo is None:
        memo = {}
    if char in memo:
        return memo[char]
    parts = DECOMPOSE_CACHE.get(char, {}).get('parts', [])
    result = {part: get_recursive_decomposition(part, memo) for part in parts}
    memo[char] = result
    return result

def char_decomp_info(chars):
    result = {}
    for c in chars:
        if c in DECOMPOSE_CACHE:
            entry = copy.deepcopy(DECOMPOSE_CACHE[c])
            if 'present_in' in entry:
                entry['present_in'] = entry['present_in'][:50]
            entry['recursive'] = get_recursive_decomposition(c)
            result[c] = entry
    return result

