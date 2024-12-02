import io
import json
import logging
import os
from urllib.parse import unquote

from flask import Blueprint, jsonify, request, send_file, session

from backend.db.ops import db_add_stroke_data
from backend.decorators import session_required, timing_decorator
from backend.flashcard_app import get_flashcard_app
from backend.db.ops import get_all_stroke_data_

logger = logging.getLogger(__name__)

flashcard_app = get_flashcard_app()

api_bp = Blueprint("api", __name__, url_prefix="/api")

with open("data/audio_mappings.json", "r", encoding="utf-8") as f:
    audio_mappings = json.load(f)


@api_bp.route("/get_characters")
@session_required
def get_characters():
    characters = list(flashcard_app.load_cards(session["deck"]).keys())
    return jsonify({"characters": characters})


@api_bp.route("/get_characters_with_pinyin")
@session_required
def get_characters_with_pinyin():
    deck = session["deck"]
    characters_data = []
    for char, data in flashcard_app.cards[deck].items():
        characters_data.append({"character": char, "pinyin": data["pinyin"]})
    return jsonify({"characters": characters_data})


@api_bp.route("/get_characters_pinyinenglish", methods=["GET", "POST"])
@session_required
def get_characters_pinyinenglish():
    all_data = []
    characters = None

    if request.method == "POST":
        data = request.get_json()
        characters = data.get("characters") if data else None

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
                    all_data.append(
                        {
                            "character": character,
                            "pinyin": data.get("pinyin", ""),
                            "english": data.get("english", ""),
                            "hsk_level": data.get("hsk_level", ""),
                            "deck": deck,
                        }
                    )
                    inserted.append(character)
                    break  # Stop searching once we find the character in a deck
    else:
        # If no specific characters are provided or it's a GET request, get all characters
        for deck in flashcard_app.cards:
            for character in flashcard_app.cards[deck]:
                data = flashcard_app.get_char_from_deck(deck, character)
                all_data.append(
                    {
                        "character": character,
                        "pinyin": data.get("pinyin", ""),
                        "english": data.get("english", ""),
                        "hsk_level": data.get("hsk_level", ""),
                        "deck": deck,
                    }
                )

    return jsonify({"characters": all_data})


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
    session["darkmode"] = request.args.get("darkmode")
    return jsonify(
        {"message": "darkmode changed successfully to " + session["darkmode"]}
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
    response = jsonify({"font": session["font"]})
    return response


@api_bp.route("/change_deck", methods=["POST"])
@timing_decorator
def change_deck():
    session["deck"] = request.args.get("deck")
    return jsonify({"message": "Deck changed successfully"})


@api_bp.route("/get_deck")
@session_required
@timing_decorator
def get_deck():
    logger.info(f"Current deck: {session['deck']}")
    return jsonify({"deck": session["deck"]})

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


@api_bp.route("/debug")
def debug():
    return jsonify({"debug": flashcard_app.debug})


@api_bp.route("/save_stroke_data", methods=["POST"])
@session_required
def save_stroke_data():
    data = request.json
    character: str = data.get("character")
    strokes: dict[dict[str, float]] = data.get("strokes")
    positioner: dict = data.get("positioner")
    mistakes: int = data.get("mistakes")
    stroke_count: int = data.get("strokeCount")
    username: str = session["username"]
    chardata = {
        "character": character,
        "strokes": strokes,
        "positioner": positioner,
        "mistakes": mistakes,
        "strokeCount": stroke_count,
        "username": username,
    }
    db_add_stroke_data(chardata)
    return jsonify({"message": "Stroke data saved successfully"})


from io import BytesIO

from flask import send_file
from PIL import Image, ImageDraw


@api_bp.route("/character_animation/<character>", methods=["GET"])
@session_required
def character_animation(character):
    username = session["username"]
    strokes_per_character = get_all_stroke_data_(username)
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
        img = Image.new("RGB", (width, height), background_color)
        draw = ImageDraw.Draw(img)
        strokes = data["strokes"]
        # Draw strokes up to the current index
        for key in strokes:
            try:
                stroke = strokes[key]
            except:
                stroke = key
            for point in stroke:
                x = int(point["x"] * width)
                y = int((1 - point["y"]) * height - height * 0.05)
                draw.ellipse([x - 2, y - 2, x + 2, y + 2], fill=point_color)

        # Add the frame to our list
        frames.append(img)

    # Create GIF
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

@api_bp.route("/get_characters_for_practice", methods=["GET"])
@session_required
@timing_decorator
def get_characters_for_practice():
    deck = session["deck"]
    characters_data = [
        {
            "character": char,
            "pinyin": data["pinyin"],
            "english": data["english"],
        }
        for char, data in flashcard_app.cards[deck].items()
    ]
    return jsonify({"characters": characters_data})



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
    flashcard_app.record_answer(username, character, correct)
    return jsonify({"message": "Answer recorded successfully"})