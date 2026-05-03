"""HTTP endpoints for the FSRS spaced-repetition flow."""

import logging

from flask import Blueprint, jsonify, request, session

from backend.decorators import session_required
from backend.db.fsrs_ops import (
    get_queue_state,
    get_settings,
    get_words_state,
    introduce_new_batch,
    record_review,
    set_settings,
)

logger = logging.getLogger(__name__)

fsrs_bp = Blueprint("fsrs", __name__, url_prefix="/api/fsrs")


_ERROR_STATUS = {
    'auth_required': 401,
    'unknown_deck': 404,
    'card_not_introduced': 404,
    'invalid_rating': 400,
    'invalid_payload': 400,
    'invalid_daily_new_limit': 400,
    'invalid_daily_review_limit': 400,
    'invalid_desired_retention': 400,
    'invalid_card_display_mode': 400,
}


def _err(code):
    status = _ERROR_STATUS.get(code, 500)
    return jsonify({'error': code}), status


def _require_auth():
    username = session.get('username')
    if not username or username == 'tempuser':
        return None
    return username


@fsrs_bp.route('/queue', methods=['GET'])
@session_required
def queue():
    username = _require_auth()
    if username is None:
        return _err('auth_required')
    deck = request.args.get('deck')
    if not deck:
        return jsonify({'error': 'missing_deck'}), 400
    payload, err = get_queue_state(username, deck)
    if err:
        return _err(err)
    return jsonify(payload)


@fsrs_bp.route('/review', methods=['POST'])
@session_required
def review():
    username = _require_auth()
    if username is None:
        return _err('auth_required')
    data = request.get_json(silent=True) or {}
    word = data.get('word')
    rating = data.get('rating')
    deck = data.get('deck')
    if not word or not rating:
        return jsonify({'error': 'missing_fields'}), 400
    payload, err = record_review(username, word, rating, deck_key=deck)
    if err:
        return _err(err)
    return jsonify(payload)


@fsrs_bp.route('/learn-new', methods=['POST'])
@session_required
def learn_new():
    username = _require_auth()
    if username is None:
        return _err('auth_required')
    data = request.get_json(silent=True) or {}
    deck = data.get('deck')
    count = data.get('count', 1)
    if not deck:
        return jsonify({'error': 'missing_deck'}), 400
    payload, err = introduce_new_batch(username, deck, count)
    if err:
        return _err(err)
    return jsonify(payload)


@fsrs_bp.route('/settings', methods=['GET'])
@session_required
def get_user_settings():
    username = _require_auth()
    if username is None:
        return _err('auth_required')
    payload, err = get_settings(username)
    if err:
        return _err(err)
    return jsonify(payload)


@fsrs_bp.route('/settings', methods=['POST'])
@session_required
def update_user_settings():
    username = _require_auth()
    if username is None:
        return _err('auth_required')
    data = request.get_json(silent=True) or {}
    payload, err = set_settings(username, data)
    if err:
        return _err(err)
    return jsonify(payload)


@fsrs_bp.route('/words-state', methods=['POST'])
@session_required
def words_state():
    username = _require_auth()
    if username is None:
        return _err('auth_required')
    data = request.get_json(silent=True) or {}
    words = data.get('words') or []
    if not isinstance(words, list) or not words:
        return jsonify({})
    payload, err = get_words_state(username, words)
    if err:
        return _err(err)
    return jsonify(payload)
