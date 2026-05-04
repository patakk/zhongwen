from sqlalchemy.dialects.sqlite import JSON
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.ext.mutable import MutableDict
from backend.db.extensions import db
import secrets


from sqlalchemy import LargeBinary, DateTime, func
import pickle


class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    character = db.Column(db.String(10), unique=True, nullable=False)
    def __repr__(self):
        return f"<Card {self.character}>"


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False,
                         info={'constraint_name': 'uq_user_username'})
    password_hash = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True,
                      info={'constraint_name': 'uq_user_email'})
    email_verified = db.Column(db.Boolean, default=False)
    email_verification_token = db.Column(db.String(100), unique=True, nullable=True, info={'constraint_name': 'uq_user_email_verification_token'})

    google_id = db.Column(db.String(120), unique=True, nullable=True)
    #google_id = db.Column(db.String(120), nullable=True)

    profile_pic = db.Column(db.String(200), nullable=True)
    metainfo = db.Column(MutableDict.as_mutable(JSON), nullable=True, default=dict)
    oauth_token = db.Column(db.String(200), nullable=True)
    oauth_token_expiry = db.Column(db.DateTime, nullable=True)

    word_lists = db.relationship("WordList", backref="user", lazy=True)
    #notes = db.relationship("UserNotes", backref="user", lazy=True)
    #user_string = db.relationship("UserString", backref="user", uselist=False)
    #stroke_entries = db.relationship("StrokeData", backref="user_ref", lazy=True)
    # Per-user custom definitions for custom words (hanzi/pinyin/english)
    #custom_definitions = db.relationship(
    #    "UserCustomDefinition",
    #    backref="user",
    #    lazy=True,
    #    cascade="all, delete-orphan"
    #)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def set_email(self, email, verified=False):
        self.email = email
        self.email_verified = verified

    def verify_email(self):
        self.email_verified = True
        self.email_verification_token = None

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_email_verification_token(self):
        token = secrets.token_urlsafe(32)
        self.email_verification_token = token
        return token

    
class WordList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    words = db.relationship("WordEntry", backref="list", lazy=True, cascade="all, delete-orphan")
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    description = db.Column(db.String(500), nullable=True)


class WordEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(10), nullable=False)
    list_id = db.Column(db.Integer, db.ForeignKey('word_list.id'), nullable=False)


class StrokeData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    character = db.Column(db.String(10), nullable=False)
    _strokes = db.Column(LargeBinary, nullable=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())

    def __repr__(self):
        return f"<StrokeData {self.user_ref.username} - {self.character}>"

    @classmethod
    def from_dict(cls, data):
        user = User.query.filter_by(username=data['username']).first()
        if not user:
            raise ValueError(f"User not found: {data['username']}")
        
        # Serialize strokes to store as integers (multiplied by 1000)
        ss = [
            [[int(p['x'] * 1000) if p['x'] is not None else 0, 
            int(p['y'] * 1000) if p['y'] is not None else 0] 
            for p in stroke]
            for stroke in data['strokes']
        ]
        serialized_strokes = pickle.dumps(ss)
        
        return cls(
            user_id=user.id,
            character=data['character'],
            _strokes=serialized_strokes,
        )

    @property
    def strokes(self):
        """Automatically convert stored strokes back to floats when accessed."""
        deserialized = pickle.loads(self._strokes)
        return [
            [[x / 1000, y / 1000] for x, y in stroke]
            for stroke in deserialized
        ]


class UserNotes(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    card_id = db.Column(db.Integer, db.ForeignKey('card.id'), nullable=False)
    notes = db.Column(db.String(200))
    is_public = db.Column(db.Boolean, default=False)
    __table_args__ = (db.UniqueConstraint('user_id', 'card_id'),)

class UserString(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.String(1000))
    last_updated = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())


class UserCustomDefinition(db.Model):
    """
    A per-user custom word definition (three strings only): hanzi, pinyin, english.
    This is separate from notes and does not alter the core dictionary data.
    """
    __tablename__ = 'user_custom_definition'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)

    # Three primary fields for a custom definition
    # hanzi acts as the identifier for this custom entry
    hanzi = db.Column(db.String(512), nullable=False)
    pinyin = db.Column(db.String(256), nullable=True)
    english = db.Column(db.String(1024), nullable=True)

    created_at = db.Column(DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Ensure one custom definition per (user, hanzi)
    __table_args__ = (
        db.UniqueConstraint('user_id', 'hanzi', name='uq_user_custom_definition_user_hanzi'),
    )

    def __repr__(self):
        return f"<UserCustomDefinition user_id={self.user_id} hanzi={self.hanzi}>"


class FsrsReview(db.Model):
    """
    Per-(user, word) FSRS scheduling state. State is shared across all decks:
    if a word appears in HSK1 and in a custom wordlist, both surfaces show the
    same review history.
    """
    __tablename__ = 'fsrs_review'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    word = db.Column(db.String(64), nullable=False, index=True)

    # FSRS card state. State enum: 1=Learning, 2=Review, 3=Relearning.
    state = db.Column(db.Integer, nullable=False, default=1)
    step = db.Column(db.Integer, nullable=True, default=0)
    stability = db.Column(db.Float, nullable=True)
    difficulty = db.Column(db.Float, nullable=True)
    due = db.Column(DateTime(timezone=True), nullable=False, default=func.now(), index=True)
    last_review = db.Column(DateTime(timezone=True), nullable=True)

    created_at = db.Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        db.UniqueConstraint('user_id', 'word', name='uq_fsrs_review_user_word'),
    )

    def __repr__(self):
        return f"<FsrsReview user_id={self.user_id} word={self.word} due={self.due}>"


class FsrsDailyStats(db.Model):
    """
    Daily counters used to enforce per-user new/review caps. One row per
    (user, date). 'date' is stored as ISO date string in user-local terms; we
    use UTC date for simplicity.
    """
    __tablename__ = 'fsrs_daily_stats'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD (UTC)

    new_introduced = db.Column(db.Integer, nullable=False, default=0)
    reviews_done = db.Column(db.Integer, nullable=False, default=0)

    # Per-rating tallies (subset of reviews_done; used for retention).
    again_count = db.Column(db.Integer, nullable=False, default=0)
    hard_count = db.Column(db.Integer, nullable=False, default=0)
    good_count = db.Column(db.Integer, nullable=False, default=0)
    easy_count = db.Column(db.Integer, nullable=False, default=0)

    # Total time spent answering cards today, in milliseconds.
    time_ms = db.Column(db.Integer, nullable=False, default=0)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'date', name='uq_fsrs_daily_stats_user_date'),
    )


class FsrsReviewLog(db.Model):
    """Append-only log of every review event. Used for stats and future parameter optimization."""
    __tablename__ = 'fsrs_review_log'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    word = db.Column(db.String(64), nullable=False)
    rating = db.Column(db.String(8), nullable=False)  # again | hard | good | easy
    stability_after = db.Column(db.Float, nullable=True)
    difficulty_after = db.Column(db.Float, nullable=True)
    state_after = db.Column(db.Integer, nullable=True)
    reviewed_at = db.Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        db.Index('ix_fsrs_review_log_user_reviewed_at', 'user_id', 'reviewed_at'),
    )
