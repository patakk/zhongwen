"""
FSRS (Free Spaced Repetition Scheduler) operations.

State is per-(user, word). A row in fsrs_review represents a card that has
been introduced for review at least once. Words from any deck (HSK or custom
wordlist) share the same row when the word string matches.

Settings (daily caps, target retention) are stored in user.metainfo['fsrs'].
Daily counters are persisted in fsrs_daily_stats keyed by (user_id, UTC date).
"""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm.attributes import flag_modified

from fsrs import Card, Rating, Scheduler, State

from backend.db.extensions import db
from backend.db.models import (
    FsrsDailyStats,
    FsrsReview,
    FsrsReviewLog,
    User,
    WordEntry,
    WordList,
)
from backend.common import CARDDECKS

logger = logging.getLogger(__name__)


DEFAULT_SETTINGS = {
    'daily_new_limit': 20,
    'daily_review_limit': 200,
    'desired_retention': 0.9,
    'card_display_mode': 'animated',
}

CARD_DISPLAY_MODES = {'animated', 'plain'}

LEARN_AHEAD_MINUTES = 1

RATING_MAP = {
    'again': Rating.Again,
    'hard': Rating.Hard,
    'good': Rating.Good,
    'easy': Rating.Easy,
}


# ----- helpers -------------------------------------------------------------

def _now_utc():
    return datetime.now(timezone.utc)


def _today_utc_iso():
    return _now_utc().date().isoformat()


def _ensure_aware(dt):
    """SQLite may return naive datetimes; treat them as UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _get_user(username):
    if not username or username == 'tempuser':
        return None
    return User.query.filter_by(username=username).first()


def _deck_words(user, deck_key):
    """
    Resolve a deck key to its list of word strings.

    Static decks (CARDDECKS, e.g. 'hsk1') win over custom wordlists with the
    same name. Returns None if the key cannot be resolved.
    """
    if deck_key in CARDDECKS:
        return list(CARDDECKS[deck_key].get('chars') or [])
    if user is None:
        return None
    wl = WordList.query.filter_by(user_id=user.id, name=deck_key).first()
    if not wl:
        return None
    entries = (
        WordEntry.query
        .filter_by(list_id=wl.id)
        .order_by(WordEntry.id.asc())
        .all()
    )
    return [e.word for e in entries]


def _settings_for(user):
    meta = user.metainfo or {}
    saved = meta.get('fsrs', {})
    return {**DEFAULT_SETTINGS, **{k: saved[k] for k in DEFAULT_SETTINGS if k in saved}}


def _scheduler_for(user):
    s = _settings_for(user)
    meta = user.metainfo or {}
    custom_params = meta.get('fsrs', {}).get('parameters')
    return Scheduler(
        desired_retention=float(s['desired_retention']),
        parameters=custom_params if custom_params else DEFAULT_PARAMETERS,
    )


def _card_from_review(rev):
    return Card(
        state=State(rev.state),
        step=rev.step,
        stability=rev.stability,
        difficulty=rev.difficulty,
        due=_ensure_aware(rev.due) or _now_utc(),
        last_review=_ensure_aware(rev.last_review),
    )


def _apply_card(rev, card):
    rev.state = int(card.state)
    rev.step = card.step
    rev.stability = card.stability
    rev.difficulty = card.difficulty
    rev.due = card.due
    rev.last_review = card.last_review


def _preview_intervals(user, rev):
    """Seconds until next review for each rating, without persisting."""
    scheduler = _scheduler_for(user)
    now = _now_utc()
    out = {}
    for label, rating in (('again', Rating.Again), ('hard', Rating.Hard), ('good', Rating.Good), ('easy', Rating.Easy)):
        card = _card_from_review(rev)
        new_card, _log = scheduler.review_card(card, rating, now)
        out[label] = max(0.0, (new_card.due - now).total_seconds())
    return out


def _get_or_create_daily(user_id, date_iso):
    row = FsrsDailyStats.query.filter_by(user_id=user_id, date=date_iso).first()
    if row is None:
        row = FsrsDailyStats(user_id=user_id, date=date_iso, new_introduced=0, reviews_done=0)
        db.session.add(row)
        db.session.flush()
    return row


# ----- queue / stats -------------------------------------------------------

def _build_queue_payload(user, deck_key, settings, daily, deck_words, due_review=None):
    """Shape the queue/stats payload returned by every endpoint."""
    now = _now_utc()
    introduced_count = (
        db.session.query(func.count(FsrsReview.id))
        .filter(FsrsReview.user_id == user.id, FsrsReview.word.in_(deck_words))
        .scalar() or 0
    )
    new_available = len(deck_words) - introduced_count

    due_count = (
        db.session.query(func.count(FsrsReview.id))
        .filter(
            FsrsReview.user_id == user.id,
            FsrsReview.word.in_(deck_words),
            FsrsReview.due <= now,
            FsrsReview.state == int(State.Review),
        )
        .scalar() or 0
    )

    new_remaining = max(0, settings['daily_new_limit'] - daily.new_introduced)
    review_remaining = max(0, settings['daily_review_limit'] - daily.reviews_done)

    payload = {
        'deck': deck_key,
        'due_count': due_count,
        'new_available': new_available,
        'new_introduced_today': daily.new_introduced,
        'reviews_done_today': daily.reviews_done,
        'daily_new_limit': settings['daily_new_limit'],
        'daily_review_limit': settings['daily_review_limit'],
        'new_remaining': new_remaining,
        'review_remaining': review_remaining,
        'desired_retention': settings['desired_retention'],
        'card_display_mode': settings['card_display_mode'],
        'card': None,
    }

    # Learning/Relearning cards bypass the daily review cap — their intervals are
    # minutes, not days, so blocking them mid-session breaks the algorithm.
    in_active_step = due_review is not None and due_review.state in (
        int(State.Learning), int(State.Relearning)
    )
    if due_review is not None and (review_remaining > 0 or in_active_step):
        payload['card'] = {
            'word': due_review.word,
            'state': due_review.state,
            'due': _ensure_aware(due_review.due).isoformat(),
            'intervals': _preview_intervals(user, due_review),
        }

    return payload


def get_queue_state(username, deck_key):
    """Return next due card (if any) and full deck/limit stats."""
    user = _get_user(username)
    if user is None:
        return None, 'auth_required'

    deck_words = _deck_words(user, deck_key)
    if deck_words is None:
        return None, 'unknown_deck'
    if not deck_words:
        # Empty deck — return zeros, no card.
        settings = _settings_for(user)
        daily = _get_or_create_daily(user.id, _today_utc_iso())
        db.session.commit()
        return _build_queue_payload(user, deck_key, settings, daily, deck_words, None), None

    settings = _settings_for(user)
    daily = _get_or_create_daily(user.id, _today_utc_iso())

    now = _now_utc()
    ahead = now + timedelta(minutes=LEARN_AHEAD_MINUTES)
    due_review = (
        db.session.query(FsrsReview)
        .filter(
            FsrsReview.user_id == user.id,
            FsrsReview.word.in_(deck_words),
            FsrsReview.due <= ahead,
        )
        .order_by(FsrsReview.due.asc())
        .first()
    )

    db.session.commit()
    return _build_queue_payload(user, deck_key, settings, daily, deck_words, due_review), None


# ----- review --------------------------------------------------------------

def record_review(username, word, rating_str, deck_key=None, time_ms=0):
    """
    Apply a rating to the user's existing FsrsReview for `word`. Increments the
    daily review counter, the per-rating tally, and total time spent. If
    `deck_key` is provided, the response payload also contains the next due
    card from that deck.
    """
    user = _get_user(username)
    if user is None:
        return None, 'auth_required'

    rating_str = (rating_str or '').lower()
    if rating_str not in RATING_MAP:
        return None, 'invalid_rating'

    rev = FsrsReview.query.filter_by(user_id=user.id, word=word).first()
    if rev is None:
        return None, 'card_not_introduced'

    try:
        time_ms_int = max(0, min(int(time_ms or 0), 10 * 60 * 1000))
    except (TypeError, ValueError):
        time_ms_int = 0

    try:
        scheduler = _scheduler_for(user)
        card = _card_from_review(rev)
        new_card, _log = scheduler.review_card(card, RATING_MAP[rating_str], review_duration=time_ms_int or None)
        _apply_card(rev, new_card)

        daily = _get_or_create_daily(user.id, _today_utc_iso())
        daily.reviews_done += 1
        setattr(daily, f'{rating_str}_count', getattr(daily, f'{rating_str}_count', 0) + 1)
        daily.time_ms = (daily.time_ms or 0) + time_ms_int

        db.session.add(FsrsReviewLog(
            user_id=user.id,
            word=word,
            rating=rating_str,
            stability_after=new_card.stability,
            difficulty_after=new_card.difficulty,
            state_after=int(new_card.state),
        ))

        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.exception("FSRS review failed")
        return None, f'db_error: {e}'

    if deck_key is None:
        return {'ok': True}, None

    payload, err = get_queue_state(username, deck_key)
    if err:
        return None, err
    return payload, None


# ----- introducing new cards ----------------------------------------------

def introduce_new_batch(username, deck_key, count):
    """
    Create FsrsReview rows for up to `count` not-yet-introduced words from the
    deck, capped by the user's remaining daily-new budget. Returns the updated
    queue payload along with the list of words introduced.
    """
    user = _get_user(username)
    if user is None:
        return None, 'auth_required'

    deck_words = _deck_words(user, deck_key)
    if deck_words is None:
        return None, 'unknown_deck'

    settings = _settings_for(user)
    daily = _get_or_create_daily(user.id, _today_utc_iso())
    budget = max(0, settings['daily_new_limit'] - daily.new_introduced)
    take = max(0, min(int(count or 0), budget))

    introduced = []
    if take > 0 and deck_words:
        existing = {
            w for (w,) in db.session.query(FsrsReview.word)
            .filter(FsrsReview.user_id == user.id, FsrsReview.word.in_(deck_words))
            .all()
        }
        candidates = [w for w in deck_words if w not in existing][:take]
        if candidates:
            now = _now_utc()
            for w in candidates:
                rev = FsrsReview(
                    user_id=user.id,
                    word=w,
                    state=int(State.Learning),
                    step=0,
                    stability=None,
                    difficulty=None,
                    due=now,
                    last_review=None,
                )
                db.session.add(rev)
                introduced.append(w)
            daily.new_introduced += len(introduced)

    try:
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.exception("FSRS introduce_new failed")
        return None, f'db_error: {e}'

    payload, err = get_queue_state(username, deck_key)
    if err:
        return None, err
    payload['introduced'] = introduced
    return payload, None


# ----- settings ------------------------------------------------------------

def get_settings(username):
    user = _get_user(username)
    if user is None:
        return None, 'auth_required'
    return _settings_for(user), None


def set_settings(username, patch):
    user = _get_user(username)
    if user is None:
        return None, 'auth_required'

    if not isinstance(patch, dict):
        return None, 'invalid_payload'

    cleaned = {}
    if 'daily_new_limit' in patch:
        try:
            v = int(patch['daily_new_limit'])
        except (TypeError, ValueError):
            return None, 'invalid_daily_new_limit'
        if v < 0 or v > 10000:
            return None, 'invalid_daily_new_limit'
        cleaned['daily_new_limit'] = v
    if 'daily_review_limit' in patch:
        try:
            v = int(patch['daily_review_limit'])
        except (TypeError, ValueError):
            return None, 'invalid_daily_review_limit'
        if v < 0 or v > 100000:
            return None, 'invalid_daily_review_limit'
        cleaned['daily_review_limit'] = v
    if 'desired_retention' in patch:
        try:
            v = float(patch['desired_retention'])
        except (TypeError, ValueError):
            return None, 'invalid_desired_retention'
        if not (0.5 <= v <= 0.99):
            return None, 'invalid_desired_retention'
        cleaned['desired_retention'] = v
    if 'card_display_mode' in patch:
        v = patch['card_display_mode']
        if v not in CARD_DISPLAY_MODES:
            return None, 'invalid_card_display_mode'
        cleaned['card_display_mode'] = v

    if user.metainfo is None:
        user.metainfo = {}
    fsrs_meta = dict(user.metainfo.get('fsrs') or {})
    fsrs_meta.update(cleaned)
    user.metainfo['fsrs'] = fsrs_meta
    flag_modified(user, 'metainfo')

    try:
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.exception("FSRS set_settings failed")
        return None, f'db_error: {e}'

    return _settings_for(user), None


# ----- per-word state -------------------------------------------------------

def get_words_state(username, words):
    """
    Return per-word FSRS state for a list of words. Returns a dict mapping
    word → {state, stability, difficulty, due, last_review} or None for words
    that haven't been introduced yet.
    """
    user = _get_user(username)
    if user is None:
        return None, 'auth_required'

    if not words:
        return {}, None

    reviews = (
        FsrsReview.query
        .filter(FsrsReview.user_id == user.id, FsrsReview.word.in_(words))
        .all()
    )

    return {
        r.word: {
            'state': r.state,
            'stability': r.stability,
            'difficulty': r.difficulty,
            'due': _ensure_aware(r.due).isoformat() if r.due else None,
            'last_review': _ensure_aware(r.last_review).isoformat() if r.last_review else None,
        }
        for r in reviews
    }, None


# ----- stats / activity calendar ------------------------------------------

def get_stats(username, year=None):
    """
    Return today's review stats and an activity calendar for the given year.
    """
    user = _get_user(username)
    if user is None:
        return None, 'auth_required'

    if year is None:
        year = _now_utc().year
    else:
        year = int(year)

    today_iso = _today_utc_iso()
    start_iso = f'{year}-01-01'
    end_iso = f'{year}-12-31'

    # --- today's stats (read directly off daily counters) ---
    daily = (
        db.session.query(FsrsDailyStats)
        .filter(FsrsDailyStats.user_id == user.id, FsrsDailyStats.date == today_iso)
        .first()
    )
    if daily is None:
        cards_studied = 0
        retention = None
        time_ms = 0
    else:
        cards_studied = daily.reviews_done or 0
        rated = (daily.again_count or 0) + (daily.hard_count or 0) + (daily.good_count or 0) + (daily.easy_count or 0)
        if rated > 0:
            retention = round(((daily.good_count or 0) + (daily.easy_count or 0)) / rated, 4)
        else:
            retention = None
        time_ms = daily.time_ms or 0

    # --- activity calendar ---
    rows = (
        db.session.query(FsrsDailyStats)
        .filter(
            FsrsDailyStats.user_id == user.id,
            FsrsDailyStats.date >= start_iso,
            FsrsDailyStats.date <= end_iso,
        )
        .all()
    )
    activity = {}
    for row in rows:
        activity[row.date] = (row.new_introduced or 0) + (row.reviews_done or 0)

    return {
        'today': {
            'date': today_iso,
            'cards_studied': cards_studied,
            'retention': retention,
            'time_ms': time_ms,
        },
        'activity': activity,
        'year': year,
    }, None
