import io
import json
import logging
import random
import re
import os
from urllib.parse import unquote

from flask import Blueprint, jsonify, request, send_file, session

from backend.db.ops import db_add_stroke_data
from backend.decorators import session_required
from backend.decorators import timing_decorator
from backend.decorators import hard_session_required
from backend.db.ops import db_update_or_create_note
from backend.db.ops import db_add_words_to_set
from backend.db.ops import db_create_set
from backend.db.ops import db_add_words_to_set
from backend.db.ops import db_get_user_wordlists
from backend.db.ops import db_rename_word_list
from backend.db.ops import db_delete_word_list
from backend.db.ops import db_get_stroke_data_for_character
from backend.db.ops import db_remove_word_from_set

from backend.db.models import Card, UserNotes
from backend.db.extensions import db

from backend.common import CARDDECKS
from backend.common import DECKNAMES
from backend.common import CARDDECKS_W_PINYIN

from backend.common import dictionary
from backend.common import get_tatoeba_page
from backend.common import get_char_info
from backend.common import get_chars_info
from backend.common import char_decomp_info
from backend.db.models import User, WordList

logger = logging.getLogger(__name__)

api_bp = Blueprint("api", __name__, url_prefix="/api")

with open("data/audio_mappings.json", "r", encoding="utf-8") as f:
    audio_mappings = json.load(f)


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
    result = db_create_set(username, name)
    if result:
        print(f"Word list '{name}' created successfully")
        return jsonify({"message": f"Word list '{name}' created successfully"})
    print(f"Word list creation failed")
    return jsonify({"error": "Word list creation failed"}), 500

@api_bp.route("/get_examples_page", methods=["POST"])
@session_required
def get_examples_page():
    data = request.get_json()
    if not data or "page" not in data or "character" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    page = data["page"]
    character = data["character"]
    examples, is_last = get_tatoeba_page(character, page)
    return jsonify({"examples": examples, "is_last": is_last})

import datetime
from datetime import timezone

@api_bp.route('/get_progress_data_for_chars', methods=["POST"])
@session_required
def get_progress_data_for_chars():
    data = request.get_json()
    
    username = data.get('user', session.get('username'))
    if not username:
        return "User or deck not specified", 400

    acards = data.get('chars', [])

    if not acards:
        return jsonify([])

    progress_stats = []
    for character in acards:
        char_progress = {}
        correct_answers = char_progress.get('answers', []).count('correct')
        total_answers = len(char_progress.get('answers', []))
        accuracy = (correct_answers / total_answers * 100) if total_answers > 0 else 0
        simple_char_info = get_char_info(character, pinyin=True, english=True)
        stats = {
            'character': character,
            'english': simple_char_info.get('english', ['N/A']),
            'pinyin': simple_char_info.get('pinyin', ['N/A']),
            'box': char_progress.get('box', 0),
            'views': char_progress.get('views', 0),
            'streak': char_progress.get('streak', 0),
            'difficulty': char_progress.get('difficulty', None),
            'accuracy': round(accuracy, 2),
            'num_incorrect': char_progress.get('num_incorrect', 0),
            'next_review': char_progress.get('next_review', None),
            'is_due': char_progress.get('next_review') and datetime.fromisoformat(char_progress['next_review']).replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc),
        }
        progress_stats.append(stats)

    return jsonify({'progress_stats': progress_stats})



@api_bp.route("/add_word_to_learning", methods=["POST"])
@session_required
def add_word_to_learning():
    data = request.get_json()
    print(data)
    if not data or "word" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    word = data["word"]

    words = re.split(r'[^\u4e00-\u9fff]+', word)
    words = [w for w in words if w and len(w) <= 6]
    
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


@api_bp.route('/storeNotesVisibility', methods=['POST'])
@session_required
def store_notes_visibility():
    try:
        data = request.get_json()
        if not data or 'character' not in data or 'is_public' not in data:
            return jsonify({'error': 'Missing required fields'}), 400

        character = data['character']
        is_public = data['is_public']
        username = session.get('username')

        card = Card.query.filter_by(character=character).first()
        if not card:
            return jsonify({'success': True, 'message': 'Character not found'})

        user_note = UserNotes.query.filter_by(
            username=username,
            card_id=card.id
        ).first()

        if not user_note:
            return jsonify({'success': True, 'message': 'Note not found'})

        user_note.is_public = is_public
        db.session.commit()

        return jsonify({'success': True, 'message': 'Visibility updated successfully'})
    #except Exception as e:
    except:
        db.session.rollback()
        #return jsonify({'error': str(e)}), 500
        return jsonify({'error': 'error'}), 500


@api_bp.route('/storeNotes', methods=['POST'])
@session_required
def store_notes():
    data = request.get_json()
    success, error = db_update_or_create_note(
        username=session.get('username'),
        word=data.get('word'),
        notes=data.get('notes'),
        is_public=data.get('is_public', False)
    )
    if not success:
        print(f"Error storing notes: {error}")
        return jsonify({"status": "error", "message": error}), 404
    return jsonify({"status": "success"})


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

@api_bp.route("/get_twang")
def get_twang():
    return send_file("../data/twang.mp3", mimetype="audio/mpeg")


@api_bp.route("/get_story_audio_clip")
def get_story_audio_clip():
    name = request.args.get("name")
    file_path = "../data/stories/clips/" + name + ".mp3"
    return send_file(file_path, mimetype="audio/mpeg")



@api_bp.route("/get_characters_simple_info", methods=["GET", "POST"])
@session_required
def get_characters_simple_info():
    all_data = []
    characters = None

    if request.method == "POST":
        data = request.get_json()
        characters = data.get("characters") if data else None

    inserted = []
    characters = sorted(characters)
    cinfos = {}
    for char in characters:
        try:
            cinfo = dictionary.definition_lookup(char)[0]
        except:
            cinfo = {"definition": "-", "pinyin": "-"}
        cinfos[char] = cinfo
    cinfos = get_chars_info(characters, pinyin=True, english=True)
    return jsonify(cinfos)

@api_bp.route("/get_deck_chars", methods=["GET", "POST"])
@session_required
def get_deck_chars():
    jdata = request.get_json()
    deck = jdata['wordlist']
    characters = CARDDECKS[deck]['chars']
    data = get_chars_info(CARDDECKS[deck]["chars"], pinyin=True)
    return jsonify(data)

@api_bp.route("/get_characters_pinyinenglish", methods=["GET", "POST"])
@session_required
def get_characters_pinyinenglish():
    inserted = []
    characters = None
    if request.method == "POST":
        data = request.get_json()
        characters = data.get("characters") if data else None

    if characters and isinstance(characters, list) and len(characters) > 0:
        characters = sorted(characters)
    else:
        characters = []
        for deck in CARDDECKS:
            for character in CARDDECKS[deck]["chars"]:
                characters.append(character)
        characters = sorted(characters)
    return jsonify({"characters": get_chars_info(characters, pinyin=True, english=True)})




@api_bp.route("/get_all_chars_pinyinenglish", methods=["GET", "POST"])
@session_required
def get_all_chars_pinyinenglish():
    characters = {}
    for deck in CARDDECKS:
        print(deck)
        for character in CARDDECKS[deck]["chars"]:
            characters[deck] = get_chars_info(CARDDECKS[deck]["chars"], pinyin=True)
    return jsonify(characters)


@api_bp.route("/change_font", methods=["POST"])
@timing_decorator
def change_font():
    session["font"] = request.args.get("font")
    logger.info(f"Font changed to {session['font']}")
    return jsonify({"message": "font changed successfully to " + session["font"]})


@api_bp.route("/setdarkmode", methods=["POST"])
@session_required
@timing_decorator
def setdarkmode():
    darkmode = request.args.get("darkmode")
    if darkmode not in ["true", "false"]:
        return jsonify({"error": "Invalid darkmode value"}), 400
    if darkmode == "true":
        session["darkmode"] = True
    else:
        session["darkmode"] = False
    return jsonify(
        {"message": "darkmode changed successfully to " + str(session["darkmode"])}
    )


@api_bp.route("/getdarkmode", methods=["GET"])
@session_required
@timing_decorator
def getdarkmode():
    return jsonify({"darkmode": session["darkmode"]})


@api_bp.route("/get_font")
@session_required
@timing_decorator
def get_font():
    response = jsonify({"font": session.get("font", "Noto Sans SC")})
    logger.info(f"Current font: {session.get('font', 'Noto Sans SC')}")
    return response


@api_bp.route("/change_deck", methods=["POST"])
@timing_decorator
def change_deck():
    session["deck"] = request.args.get("wordlist")
    return jsonify({"message": "Deck changed successfully"})


@api_bp.route("/get_deck")
@session_required
@timing_decorator
def get_deck():
    logger.info(f"Current deck: {session['deck']}")
    return jsonify({"wordlist": session["deck"]})

@api_bp.route("/get_api_key", methods=["GET"])
def get_api_key():
    api_key = os.environ.get("OPENAI_API_KEY_ZHONG_WEN")
    if not api_key:
        file_path = "/home/patakk/.zhongwen-openai-apikey"
        try:
            with open(file_path, "r") as file:
                api_key = file.read().strip()
        except FileNotFoundError:
            return (
                jsonify(
                    {"error": "API key not found in environment variables or file"}
                ),
                404,
            )
        except IOError:
            return jsonify({"error": "Error reading API key file"}), 500

    if api_key:
        return jsonify({"api_key": api_key}), 200
    else:
        return jsonify({"error": "API key not found"}), 404

from flask import Flask, request, Response, stream_with_context
import requests

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

@api_bp.route("/get_audio", methods=["POST", "GET"])
def get_audio():
    characters = request.args.get("chars", "")
    if not characters:
        return "No characters provided", 400

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
            else:
                # print(f"Audio file not found for character: {char}")
                pass
        else:
            # print(f"No audio mapping found for character: {char}")
            pass

    if not audio_chunks:
        return "No audio found for the provided characters", 404

    combined_audio = b"".join(audio_chunks)

    buffer = io.BytesIO(combined_audio)
    buffer.seek(0)

    return send_file(buffer, mimetype="audio/mpeg")


# @api_bp.route("/debug")
# def debug():
#     return jsonify({"debug": flashcard_app.debug})


@api_bp.route("/save_stroke_data", methods=["POST"])
@hard_session_required
def save_stroke_data():
    data = request.json
    character: str = data.get("character")
    strokes: dict[dict[str, float]] = data.get("strokes")
    username: str = session["username"]
    chardata = {
        "character": character,
        "strokes": strokes,
        "username": username,
    }
    db_add_stroke_data(chardata)
    print(f"Stroke data saved for {character}")
    return jsonify({"message": "Stroke data saved successfully"})


from io import BytesIO

from flask import send_file
from PIL import Image, ImageDraw


@api_bp.route("/character_animation/<character>", methods=["GET"])
@session_required
def character_animation(character):
    strokes_datas = db_get_stroke_data_for_character(session["username"], character)
    if len(strokes_datas) < 2:
        return jsonify({"status": "insufficient_data"}), 204 
    
    frames = []
    width, height = 100, 100
    background_color = (255, 255, 255) 
    point_color = (0, 0, 0) 

    for data in strokes_datas:
        img = Image.new("RGB", (width, height), background_color)
        draw = ImageDraw.Draw(img)
        strokes = data["strokes"]
        for stroke in strokes:
            for point in stroke:
                x = int(point[0] * width)
                y = int(point[1] * height)
                draw.ellipse([x - 2, y - 2, x + 2, y + 2], fill=point_color)
        frames.append(img)
    output = BytesIO()
    frames[0].save(
        output,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        duration=100,
        loop=0,
    )
    output.seek(0)

    return send_file(output, mimetype="image/gif")


@api_bp.route("/get_random_characters", methods=["POST"])
@session_required
@timing_decorator
def get_random_characters():
    username = session.get('username')
    
    custom_wordlists = db_get_user_wordlists(username)
    cd = {
        **custom_wordlists,
        **CARDDECKS
    }

    data = request.get_json()
    deck = data.get("wordlist")
    num = int(data.get("num", 24))
    random_chars = cd[deck]['chars']
    random.shuffle(random_chars)
    random_chars = random_chars[:num]
    characters_data = get_chars_info(random_chars, pinyin=True, english=True)
    return jsonify(characters_data)

import time
# char_decomp_info
@api_bp.route("/get_char_decomp_info", methods=["POST"])
@session_required
@timing_decorator
def get_char_decomp_info():
    data = request.get_json()
    characters = data.get("characters")
    print("hello", characters)
    return jsonify(char_decomp_info(characters))


@api_bp.route("/get_all_stroke_data", methods=["GET"])
@session_required
def get_all_stroke_data():
    username = session["username"]
    return jsonify(get_all_stroke_data_(username))


with open("data/examples.json", "r", encoding="utf-8") as f:
    parsed_data = json.load(f)

with open("data/stories.json", "r", encoding="utf-8") as f:
    stories_data = json.load(f)


@api_bp.route("/get_examples_data/<category>/<subcategory>/<chinese>")
@session_required
@timing_decorator
def get_examples_data(category, subcategory, chinese):
    category = unquote(category)
    subcategory = unquote(subcategory)
    chinese = unquote(chinese)

    logger.info(f"Category: {category}, Subcategory: {subcategory}, Chinese: {chinese}")
    if category in parsed_data and subcategory in parsed_data[category]:
        for item in parsed_data[category][subcategory]:
            if item["chinese"] == chinese:
                return jsonify(item)
    return jsonify({"error": "Translation not found"}), 404


@api_bp.route("/get_stories_data/<uri>")
@session_required
@timing_decorator
def get_stories_data(uri):
    if uri in stories_data:
        return jsonify(stories_data[uri])
    return jsonify({"error": "Story not found"}), 404


@api_bp.route("/log_mobile_access", methods=["POST"])
def log_mobile_access():
    logger.info("Mobile or tablet device accessed the flashcard")
    return "", 204


@api_bp.route("/record_answer")
@timing_decorator
@session_required
def record_answer():
    character = request.args.get("character")
    correct = request.args.get("correct")
    username = session["username"]
    logger.info(f"Answer recorded for {character}: {correct}")
    # flashcard_app.record_answer(username, character, correct)
    return jsonify({"message": "Answer recorded successfully"})
