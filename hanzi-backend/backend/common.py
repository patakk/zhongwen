import json
import random
import requests
import os
from datetime import datetime, timezone
import re
import jieba.posseg as pseg
from hanziconv import HanziConv

import logging


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# from hanzipy.decomposer import HanziDecomposer
from pypinyin import lazy_pinyin, Style

# decomposer = HanziDecomposer()

# from .flashcard_app import init_flashcard_app, get_flashcard_app

with open("data/audio_mappings.json", "r", encoding="utf-8") as f:
    audio_mappings = json.load(f)


def get_combined_audio(characters):
    audio_chunks = []
    for char in characters:
        if char in audio_mappings and "audio" in audio_mappings[char]:
            file_name = audio_mappings[char]["audio"]
            file_path = os.path.join("..", "chinese_audio_clips", file_name)
            file_path2 = os.path.join("chinese_audio_clips", file_name)
            
            if os.path.exists(file_path):
                with open(file_path, "rb") as f:
                    audio_chunks.append(f.read())
            elif os.path.exists(file_path2):
                with open(file_path2, "rb") as f:
                    audio_chunks.append(f.read())
            # else:
            #     # print(f"Audio file not found for character: {char}")
            #     pass
        # else:
        #     # print(f"No audio mapping found for character: {char}")
        #     pass
    
    return b"".join(audio_chunks) if audio_chunks else b""


def load_secrets(secrets_file):
    secrets = {}
    try:
        with open(secrets_file, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, value = line.split('=', 1)
                    secrets[key.strip()] = value.strip()
    except Exception as e:
        print(f"Warning: Could not load secrets file: {e}")
    return secrets

auth_keys = load_secrets('/home/patakk/.zhongweb-secrets')


def get_pinyin(hanzi):
    result = lazy_pinyin(hanzi, style=Style.TONE)
    return ' '.join(result)


DATA_DIR = './data'
CARDDECKS = json.load(open(os.path.join(DATA_DIR, "decks.json")))
CHARS_CACHE = json.load(open(os.path.join(DATA_DIR, "caches", "chars_cache.json")))
STROKES_CACHE = json.load(open(os.path.join(DATA_DIR, "caches", "strokes_cache.json")))
WORDS_CACHE = json.load(open(os.path.join(DATA_DIR, "caches", "words_cache.json")))
DECOMPOSE_CACHE = json.load(open(os.path.join(DATA_DIR, "caches", "decompose_cache.json")))
ANTHROPIC_DATA = json.load(open(os.path.join(DATA_DIR, "anthropic.json")))
TATOEBA_DATA = json.load(open(os.path.join(DATA_DIR, "tatoeba_examples.json")))
TATOEBA_MAP = json.load(open(os.path.join(DATA_DIR, "tatoeba_example_ids_by_char.json")))
DECKS_INFO = {key : CARDDECKS[key]["name"] for key in CARDDECKS}
STROKE_COUNT = json.load(open(os.path.join(DATA_DIR, "stroke_count.json")))
HANZI_DARKNESS_NOTO = json.load(open(os.path.join(DATA_DIR, "hanzi_darkness_noto.json")))
HANZI_DARKNESS_KAITI = json.load(open(os.path.join(DATA_DIR, "hanzi_darkness_kaiti.json")))

default_darkmode = False

DECKNAMES = {
    d : CARDDECKS[d]['name'] for d in CARDDECKS
}

# init_flashcard_app({})
# flashcard_app = get_flashcard_app()

pos_map = {
    'n': 'noun', 'nr': 'proper noun', 'ns': 'place noun', 'nt': 'temporal noun', 'nz': 'other noun', 'v': 'verb', 'a': 'adjective', 'ad': 'adverb', 'an': 'prenoun', 'ag': 'adjective-adverb', 'al': 'adjective-numeral', 'b': 'other', 'c': 'complement', 'd': 'adverb', 'e': 'exclamation', 'f': 'surname', 'g': 'morpheme', 'h': 'prefix', 'i': 'idiom', 'j': 'abbreviation', 'k': 'suffix', 'l': 'temporary word', 'm': 'number', 'ng': 'gender noun', 'nx': 'kernel noun', 'o': 'onomatopoeia', 'p': 'preposition', 'q': 'classifier', 'r': 'pronoun', 'u': 'auxiliary', 'v': 'verb', 'vd': 'verb-auxiliary', 'vg': 'verb-object', 'vn': 'pronoun-verb', 'w': 'punctuation', 'x': 'non-lexeme', 'y': 'language-particle', 'z': 'state-particle'
}


def send_bot_notification(message):
    telegram_api = auth_keys.get("TELEGRAM_BOT_KEY")
    chat_id = auth_keys.get("TELEGRAM_CHAT_ID")
    if not telegram_api or not chat_id:
        return
    url = f"https://api.telegram.org/bot{telegram_api}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
    }
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            logger.info("Notification sent successfully.")
        else:
            logger.error(f"Failed to send notification: {response.status_code}")
    except requests.RequestException as e:
        logger.error(f"Error sending notification: {e}")




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

    for _, t in enumerate(tatoebas):
        try:
            t['cmn'] = simplify_hanzi(t['cmn'])
            words = pseg.cut(t['cmn'])
            cmn = []
            for a, b in words:
                cmn.append({**get_char_info(a), 'character': a})
            examples.append({**t, 'cmn': cmn})
        except:
            pass

    return examples, is_last

def get_char_info(character, full=False):
    if full:
        return CHARS_CACHE.get(character, {})
    return WORDS_CACHE.get(character, {'character': character, 'pinyin': ['N/A'], 'english': ['N/A']})

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

with open("./static/json/carddecks_w_pinyin.json", "w", encoding="utf-8") as f:
    json.dump(CARDDECKS_W_PINYIN, f, ensure_ascii=False)

def get_random_chars_from_deck(deck, n, function=False):
    characters = CARDDECKS[deck]["chars"]
    random.shuffle(characters)
    characters = characters[:n]
    return {c: get_char_info(c) for c in characters}

def char_decomp_info(char):
    return DECOMPOSE_CACHE.get(char, {})
