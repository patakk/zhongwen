import json
import random

from flask import Blueprint, jsonify, render_template, session

from backend.decorators import session_required, timing_decorator
from backend.flashcard_app import get_flashcard_app

flashcard_app = get_flashcard_app()

from backend.common import DECKS_INFO
from backend.common import CARDDECKS

puzzles_bp = Blueprint("puzzles", __name__, url_prefix="/puzzles")


def get_common_context():
    return {
        "darkmode": session["darkmode"],
        "username": session["username"],
        "decks": CARDDECKS,
        "decksinfos": DECKS_INFO,
        "deck": "hsk1",
    }



@puzzles_bp.route("/")
@session_required
@timing_decorator
def puzzles():
    characters = dict(CARDDECKS[session["deck"]].items())
    context = get_common_context()
    context["characters"] = characters
    return render_template("puzzles.html", **context)


# def hanzitest_pinyin():
#     characters = dict(CARDDECKS[session["deck"]].items())
#     return render_template(
#         "puzzles/hanzitest_pinyin.html",
#         darkmode=session["darkmode"],
#         username=session["username"],
#         characters=characters,
#         decks=flashcard_app.decks,
#         deck=session["deck"],
#     )


@puzzles_bp.route("/hanzitest_pinyin")
@session_required
@timing_decorator
def hanzitest_pinyin():
    characters = dict(CARDDECKS[session["deck"]].items())
    context = get_common_context()
    context["characters"] = characters
    return render_template("puzzles/hanzitest_pinyin.html", **context)


@puzzles_bp.route("/hanzitest_table")
@session_required
@timing_decorator
def hanzitest_table():
    characters = dict(CARDDECKS[session["deck"]].items())
    context = get_common_context()
    context["characters"] = characters
    return render_template("puzzles/hanzitest_table.html", **context)


@puzzles_bp.route("/hanzitest_draw")
@session_required
@timing_decorator
def hanzitest_draw():
    context = get_common_context()
    deck = context["deck"]
    characters_data = [
        {
            "character": char,
            "pinyin": data["pinyin"],
            "english": data["english"],
        }
        for char, data in CARDDECKS[deck].items()
    ]
    context["characters"] = characters_data
    return render_template("puzzles/hanzitest_draw.html", **context)


@puzzles_bp.route("/hanzitest_choices")
@session_required
@timing_decorator
def hanzitest_choices():
    context = get_common_context()
    characters = dict(CARDDECKS[context["deck"]].items())
    context["characters"] = characters
    return render_template("puzzles/hanzitest_choices.html", **context)


@puzzles_bp.route("/hanzitest_fillin")
@session_required
@timing_decorator
def hanzitest_fillin():
    if "fillin" not in session:
        session["fillin"] = json.load(
            open("data/fillin_puzzles.json", "r", encoding="utf-8")
        )
    klist = session["fillin"]["contextClues"]
    random.shuffle(klist)
    fillin = {k: session["fillin"]["contextClues"][k] for k in range(10)}
    characters = dict(CARDDECKS[session["deck"]].items())

    context = get_common_context()
    context.update(
        {
            "fillin": fillin,
            "characters": characters,
        }
    )
    return render_template("puzzles/hanzitest_fillin.html", **context)
