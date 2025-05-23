import json
import random

from flask import Blueprint, jsonify, render_template, session
from backend.decorators import session_required
from backend.common import get_chars_info
from backend.db.ops import db_get_word_list_names_only


from backend.common import DECKS_INFO
from backend.common import CARDDECKS
from backend.common import DECKNAMES

puzzles_bp = Blueprint("puzzles", __name__, url_prefix="/puzzles")


all_chars = set()
for deck in CARDDECKS.values():
    all_chars.update(deck.keys())
FLATTENED_Q = sorted(all_chars)

def get_common_context():
    return {
        "darkmode": session.get("darkmode", False),
        "username": session.get("username"),
        "wordlist": "hsk1",
    }


def add_sorted_decknames_to_context(username, context):
    user_wordlists = db_get_word_list_names_only(username)
    if user_wordlists:
        user_wordlists = {wl: wl for wl in user_wordlists}
        context["decknames"] = {
            **DECKNAMES,
            **user_wordlists
        }
        hsk_keys = [k for k in DECKNAMES.keys() if 'hsk' in k]
        nonhsk_keys = [k for k in DECKNAMES.keys() if 'hsk' not in k and k not in user_wordlists]
        context["decknames_sorted"] = list(sorted(user_wordlists.keys())) + list(sorted(hsk_keys)) + list(sorted(nonhsk_keys))
    else:
        context["decknames"] = DECKNAMES
        hsk_keys = [k for k in DECKNAMES.keys() if 'hsk' in k]
        nonhsk_keys = [k for k in DECKNAMES.keys() if 'hsk' not in k]
        context["decknames_sorted"] = list(sorted(hsk_keys)) + list(sorted(nonhsk_keys))


@puzzles_bp.route("/")
@session_required
def puzzles():
    #characters = dict(CARDDECKS[session["deck"]].items())
    context = get_common_context()
    #context["characters"] = characters
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
def hanzitest_pinyin():
    characters = dict(CARDDECKS[session["deck"]].items())
    context = get_common_context()
    context["characters"] = characters
    return render_template("puzzles/hanzitest_pinyin.html", **context)



def get_random_chars_from_deck(deck, n, pinyin=False, english=False, function=False):
    characters = CARDDECKS[deck]["chars"]
    random.shuffle(characters)
    characters = characters[:n]
    return get_chars_info(characters, pinyin, english, function)

@puzzles_bp.route("/hanzitest_table")
@session_required
def hanzitest_table():
    context = get_common_context()
    
    add_sorted_decknames_to_context(session.get('username'), context)
    return render_template("puzzles/hanzitest_table.html", **context)


@puzzles_bp.route("/hanzitest_audio")
@session_required
def hanzitest_audio():
    context = get_common_context()
    
    add_sorted_decknames_to_context(session.get('username'), context)
    return render_template("puzzles/hanzitest_audio.html", **context)


@puzzles_bp.route("/hanzitest_draw")
@session_required
def hanzitest_draw():
    context = get_common_context()
    add_sorted_decknames_to_context(session.get('username'), context)
    return render_template("puzzles/hanzitest_draw.html", **context)



@puzzles_bp.route("/hanzitest_choices")
@session_required
def hanzitest_choices():
    context = get_common_context()
    add_sorted_decknames_to_context(session.get('username'), context)
    return render_template("puzzles/hanzitest_choices.html", **context)


@puzzles_bp.route("/hanzitest_fillin")
@session_required
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
