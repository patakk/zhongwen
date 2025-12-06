import io
import json
import logging
import genanki
import random
import copy
import zlib
import re
import os
import base64
from urllib.parse import unquote

from flask import Blueprint, jsonify, request, send_file, session

from backend.decorators import session_required
from backend.decorators import hard_session_required
from backend.db.ops import db_add_words_to_set
from backend.db.ops import db_create_word_list
from backend.db.ops import db_add_words_to_set
from backend.db.ops import db_get_word_list
from backend.db.ops import db_rename_word_list
from backend.db.ops import db_delete_word_list
from backend.db.ops import db_remove_word_from_set
from backend.db.ops import db_update_wordlist_description

from backend.db.models import Card, UserNotes, User

from backend.common import CARDDECKS
from backend.common import STROKES_CACHE
from backend.common import DECKNAMES
from backend.common import AUDIO_MAPPINGS
from backend.common import DATA_DIR

from backend.common import get_tatoeba_page
from backend.common import get_char_info
from backend.common import get_chars_info
from backend.common import char_decomp_info
from backend.db.models import User, WordList
from backend.common import send_bot_notification
from backend.anki import create_anki_from_wordlist


from flask import Flask, request, Response, stream_with_context
import requests

logger = logging.getLogger(__name__)

api_bp = Blueprint("api", __name__, url_prefix="/api")

@api_bp.route('/version')
def version():
    version_file = '../version'
    if os.path.exists(version_file):
        try:
            with open(version_file, 'r') as f:
                return jsonify({"commit": f.read().strip()})
        except IOError:
            return 'Error reading version file', 500
    return jsonify({"commit": "unknown"}), 200

@api_bp.route("/rename_wordlist", methods=["POST"])
@session_required
def rename_wordlist():
    data = request.get_json()
    if not data or "name" not in data or "newname" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    name = data["name"]
    newname = data["newname"]
    username = session.get("username")
    db_rename_word_list(username, name, newname)
    return jsonify({"message": f"Word list '{name}' renamed to '{newname}'"})

@api_bp.route('/remove_wordlist', methods=["POST"])
@session_required
def remove_wordlist():
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    name = data["name"]
    username = session.get("username")
    db_delete_word_list(username, name)
    print(f"Removing word list '{name}'")
    return jsonify({"message": f"Word list '{name}' removed"})

@api_bp.route("/create_wordlist", methods=["POST"])
@session_required
def create_wordlist():
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    name = data["name"]
    username = session.get("username")
    result = db_create_word_list(username, name)
    if result:
        print(f"Word list '{name}' created successfully")
        send_bot_notification(f"Word list '{name}' created by user '{username}'")
        return jsonify({"message": f"Word list '{name}' created successfully"})
    print(f"Word list creation failed")
    return jsonify({"error": "Word list creation failed"}), 500


@api_bp.route("/get_anki_wordlist", methods=["POST"])
@session_required
def get_anki_wordlist():
    def deterministic_id(name):
        return zlib.crc32(name.encode('utf-8'))
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    deck_name = data["name"]
    username = session.get("username")
    wordlist = db_get_word_list(username, wordlist_name=deck_name)
    if len(wordlist) == 0:
        return jsonify({"error": "Word empty"}), 404
    wordlist_data = [get_char_info(word) for word in wordlist]
    deck_id = deterministic_id(username + deck_name)
    anki_file = create_anki_from_wordlist(wordlist_data, deck_id, deck_name)
    deck_name_low = re.sub(r"[^a-zA-Z0-9_]", "_", deck_name).lower()
    return send_file(
        anki_file,
        as_attachment=True,
        download_name=f'{deck_name_low}_anki_deck.apkg',
        mimetype='application/octet-stream'
    )

# New endpoint to update wordlist description
@api_bp.route("/update_wordlist_description", methods=["POST"])
@session_required
def update_wordlist_description():
    data = request.get_json()
    if not data or "name" not in data or "description" not in data:
        return jsonify({"error": "Missing required fields (name, description)"}), 400
    
    name = data["name"]
    description = data["description"]
    username = session.get("username")
    
    success = db_update_wordlist_description(username, name, description)
    
    if success:
        print(f"Description updated for word list '{name}'")
        return jsonify({"message": f"Description for word list '{name}' updated successfully"})
    else:
        print(f"Failed to update description for word list '{name}' (not found or permission issue)")
        return jsonify({"error": "Failed to update description. Word list not found or permission denied."}), 404


@api_bp.route("/get_examples_page", methods=["POST"])
@session_required
def get_examples_page():
    data = request.get_json()
    if not data or "page" not in data or "character" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    page = data["page"]
    character = data["character"]
    examples, is_last = get_tatoeba_page(character, page)
    # examples = []
    # is_last = False
    return jsonify({"examples": examples, "is_last": is_last})


# =============================
# User Custom Definitions CRUD
# =============================
'''@api_bp.route("/custom_definitions/get", methods=["GET"])
@session_required
def get_custom_definition():
    hanzi = request.args.get('hanzi') or (request.get_json() or {}).get('hanzi')
    if not hanzi:
        return jsonify({"error": "Missing required field 'hanzi'"}), 400
    username = session.get("username")
    data = db_get_custom_definition(username, hanzi)
    if not data:
        return jsonify({"found": False, "hanzi": hanzi})
    return jsonify({"found": True, **data})


@api_bp.route("/custom_definitions/set", methods=["POST"])
@session_required
def set_custom_definition():
    data = request.get_json() or {}
    hanzi = data.get('hanzi')
    if not hanzi:
        return jsonify({"error": "Missing required field 'hanzi'"}), 400
    username = session.get("username")
    result = db_set_custom_definition(
        username,
        hanzi,
        pinyin=data.get('pinyin'),
        english=data.get('english'),
    )
    if result and isinstance(result, tuple) and result[0] is False:
        return jsonify({"error": result[1]}), 500
    return jsonify({"message": "Saved", "data": result})


@api_bp.route("/custom_definitions/delete", methods=["POST", "DELETE"])
@session_required
def delete_custom_definition():
    payload = request.get_json() or {}
    hanzi = payload.get('hanzi') or request.args.get('hanzi')
    if not hanzi:
        return jsonify({"error": "Missing required field 'hanzi'"}), 400
    username = session.get("username")
    ok, err = db_delete_custom_definition(username, hanzi)
    if not ok:
        code = 404 if err == 'Not found' else 500
        return jsonify({"error": err or "Failed"}), code
    return jsonify({"message": "Deleted", "hanzi": hanzi})

@api_bp.route("/custom_definitions/list", methods=["GET"])
@session_required
def list_custom_definitions():
    username = session.get("username")
    items = db_list_custom_definitions(username)
    return jsonify({"items": items})
'''

@api_bp.route("/add_word_learning_with_data", methods=["POST"])
@session_required
def add_word_learning_with_data():
    data = request.get_json()
    if not data or "words" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    words = data["words"]
    words = [w.strip() for w in words if w.strip()]
    
    if not words:
        return jsonify({"error": "No valid Chinese words found in input"}), 400

    username = session.get("username")
    set_name = data.get("set_name")
    
    if not set_name:
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        first_set = WordList.query.filter_by(user_id=user.id).first()
        if not first_set:
            return jsonify({"error": "No word lists found for user"}), 404
            
        set_name = first_set.name
    
    result = db_add_words_to_set(username, set_name, words)
    
    if result is None:
        return jsonify({"error": "User or word list not found"}), 404
    
    words_info = get_chars_info(words)
    
    response = {
        "message": f"Processing complete for list '{set_name}'",
        "added": result["added"],
        "chars_info": words_info
    }   
    
    if result["skipped"]:
        response["skipped"] = result["skipped"]
        response["skipped_reason"] = "Words already exist in the list"
    
    return jsonify(response)


@api_bp.route("/add_word_to_learning", methods=["POST"])
@session_required
def add_word_to_learning():
    data = request.get_json()
    if not data or "word" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    word = data["word"]

    words = word.split(";")
    words = [w.strip() for w in words]
    words = [w for w in words if w]

    
    if not words:
        return jsonify({"error": "No valid Chinese words found in input"}), 400

    username = session.get("username")
    set_name = data.get("set_name")
    get_rows = data.get("get_rows", True)
    
    # If set name not provided, use the user's first available set
    if not set_name:
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        first_set = WordList.query.filter_by(user_id=user.id).first()
        if not first_set:
            return jsonify({"error": "No word lists found for user"}), 404
            
        set_name = first_set.name
    
    result = db_add_words_to_set(username, set_name, words)
    
    if result is None:
        return jsonify({"error": "User or word list not found"}), 404

    if not get_rows:
        return jsonify({"message": "Processing complete"}), 200
    
    response = {
        "message": f"Processing complete for list '{set_name}'",
        "added": result["added"],
    }   
    
    if result["skipped"]:
        response["skipped"] = result["skipped"]
        response["skipped_reason"] = "Words already exist in the list"
    
    return jsonify(response)


@api_bp.route("/remove_word_from_learning", methods=["POST"])
@session_required
def remove_word_from_learning():
    data = request.get_json()
    if not data or "character" not in data or 'set_name' not in data:
        return jsonify({"error": "Missing required fields"}), 400
    character = data["character"]
    set_name = data.get("set_name")
    username = session.get("username")
    print(f"Removing word '{character}' from list '{set_name}'")
    result = db_remove_word_from_set(username, set_name, character)
    return jsonify({"message": f"Word '{character}' removed from list '{set_name}'"})


@api_bp.route("/load_deck_chars")
@session_required
def load_deck():
    wordlist = request.args.get("wordlist")
    characters_data = [
        {
            "character": char,
            "pinyin": data["pinyin"],
            "english": data["english"],
        }
        for char, data in CARDDECKS[wordlist].items()
    ]
    return jsonify(characters_data)




# @api_bp.route("/get_characters")
# @session_required
# def get_characters():
#     characters = list(flashcard_app.load_cards(session["deck"]).keys())
#     return jsonify({"characters": characters})


@api_bp.route("/get_characters_with_pinyin")
@session_required
def get_characters_with_pinyin():
    wordlist = session["wordlist"]
    characters_data = []
    for char, data in CARDDECKS[wordlist].items():
        characters_data.append({"character": char, "pinyin": data["pinyin"]})
    return jsonify({"characters": characters_data})

# @api_bp.route("/get_twang")
# def get_twang():
#     return send_file("../data/twang.mp3", mimetype="audio/mpeg")


# @api_bp.route("/get_story_audio_clip")
# def get_story_audio_clip():
#     name = request.args.get("name")
#     file_path = "../data/stories/clips/" + name + ".mp3"
#     return send_file(file_path, mimetype="audio/mpeg")



@api_bp.route("/get_deck_chars", methods=["GET", "POST"])
@session_required
def get_deck_chars():
    jdata = request.get_json()
    deck = jdata['wordlist']
    characters = CARDDECKS[deck]['chars']
    data = get_chars_info(CARDDECKS[deck]["chars"], pinyin=True)
    return jsonify(data)

@api_bp.route("/get_characters_simple_info", methods=["GET", "POST"])
def get_characters_simple_info():
    if request.method == "POST":
        data = request.get_json()
        characters = data.get("characters") if data else []
    else:
        characters = request.args.get("characters", "")
        characters = characters.split(";") if characters else []
    characters = sorted(characters)
    cinfos = get_chars_info(characters)
    return jsonify(cinfos)


@api_bp.route("/getdarkmode", methods=["GET"])
@session_required
def getdarkmode():
    return jsonify({"darkmode": session.get("darkmode")})


@api_bp.route('/openaiexplain', methods=['POST'])
def chat():
    if not request.is_json:
        return {"error": "Request must be JSON"}, 400

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        api_key = os.environ.get("OPENAI_API_KEY_ZHONG_WEN")
        if not api_key:
            file_path = "/home/patakk/.zhongwen-openai-apikey"
            try:
                with open(file_path, "r") as file:
                    api_key = file.read().strip()
            except Exception as e:
                print(f"Error reading OpenAI API key file: {e}")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    def generate():
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=request.json,
            stream=True
        )

        for chunk in response.iter_lines():
            if chunk:
                yield chunk.decode('utf-8') + '\n'

    return Response(
        stream_with_context(generate()),
        content_type='text/event-stream'
    )


def _strip_tone_marks(pinyin_syllable):
    tone_map = {
        'ā': ('a', 1), 'á': ('a', 2), 'ǎ': ('a', 3), 'à': ('a', 4),
        'ē': ('e', 1), 'é': ('e', 2), 'ě': ('e', 3), 'è': ('e', 4),
        'ī': ('i', 1), 'í': ('i', 2), 'ǐ': ('i', 3), 'ì': ('i', 4),
        'ō': ('o', 1), 'ó': ('o', 2), 'ǒ': ('o', 3), 'ò': ('o', 4),
        'ū': ('u', 1), 'ú': ('u', 2), 'ǔ': ('u', 3), 'ù': ('u', 4),
        'ǖ': ('v', 1), 'ǘ': ('v', 2), 'ǚ': ('v', 3), 'ǜ': ('v', 4),
    }
    tone = None
    letters = []
    for ch in pinyin_syllable:
        if ch in tone_map:
            base, t = tone_map[ch]
            letters.append(base)
            tone = t
        elif ch.isdigit() and ch in '12345':
            tone = int(ch)
        elif ch.isalpha() or ch in ['ü', 'v']:
            letters.append('v' if ch == 'ü' else ch)
    if tone is None:
        tone = 5
    base = ''.join(letters)
    return base + str(tone) if base else ''


def _normalize_pinyin(pinyin):
    if not pinyin:
        return []
    raw = pinyin.strip().lower().replace("'", " ")
    syllables = [s for s in raw.split() if s]
    normalized = []
    for syl in syllables:
        syl = syl.replace('u:', 'v').replace('ü', 'v')
        # If tone number appears inside, move it to the end (e.g., ha3o -> hao3)
        digit = None
        for ch in syl:
            if ch.isdigit() and ch in '12345':
                digit = ch
        if digit:
            base = ''.join(ch for ch in syl if ch.isalpha() or ch in ['v'])
            if base:
                normalized.append(f"{base}{digit}")
            continue

        norm = _strip_tone_marks(syl)
        if norm:
            normalized.append(norm)
    return [s for s in normalized if s]


def _get_combined_audio(pinyin=None):
    audio_chunks = []
    syllables = _normalize_pinyin(pinyin) if pinyin else []
    for syl in syllables:
        file_name = f"{syl}.mp3"
        file_path = os.path.join(DATA_DIR, "chinese_audio_clips", file_name)
        if os.path.exists(file_path):
            with open(file_path, "rb") as f:
                audio_chunks.append(f.read())
    return b"".join(audio_chunks) if audio_chunks else b""

@api_bp.route("/get_audio", methods=["POST", "GET"])
def get_audio():
    pinyin = request.args.get("pinyin", "")

    if not pinyin:
        return "No pinyin provided", 400

    combined_audio = _get_combined_audio(pinyin)
    
    if not combined_audio:
        return "No audio found for the provided characters", 404
    
    buffer = io.BytesIO(combined_audio)
    buffer.seek(0)
    
    return send_file(buffer, mimetype="audio/mpeg")


# @api_bp.route("/debug")
# def debug():
#     return jsonify({"debug": flashcard_app.debug})

@api_bp.route("/getStrokes/<character>")
@session_required
def get_strokes(character):
    if len(character) == 1:
        strokes = STROKES_CACHE.get(character)
        return jsonify(strokes)
    else:
        strokesPerChar = {}
        for char in character:
            strokes = STROKES_CACHE.get(char)
            if strokes:
                strokesPerChar[char] = strokes
        return jsonify(strokesPerChar)


from io import BytesIO

from flask import send_file
from PIL import Image, ImageDraw


import time
# char_decomp_info
@api_bp.route("/get_char_decomp_info", methods=["POST"])
@session_required
def get_char_decomp_info():
    data = request.get_json()
    characters = data.get("characters")
    decomp = char_decomp_info(characters)
    return jsonify(decomp)


@api_bp.route("/get_stories_data/<uri>")
@session_required
def get_stories_data(uri):
    if uri in stories_data:
        return jsonify(stories_data[uri])
    return jsonify({"error": "Story not found"}), 404


@api_bp.route("/log_mobile_access", methods=["POST"])
def log_mobile_access():
    logger.info("Mobile or tablet device accessed the flashcard")
    return "", 204


@api_bp.route("/record_answer")
@session_required
def record_answer():
    character = request.args.get("character")
    correct = request.args.get("correct")
    username = session["username"]
    logger.info(f"Answer recorded for {character}: {correct}")
    # flashcard_app.record_answer(username, character, correct)
    return jsonify({"message": "Answer recorded successfully"})
