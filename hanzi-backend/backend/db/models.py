from sqlalchemy.dialects.sqlite import JSON
from werkzeug.security import generate_password_hash, check_password_hash

from backend.db.extensions import db
import secrets


from sqlalchemy import LargeBinary
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
    oauth_token = db.Column(db.String(200), nullable=True)
    oauth_token_expiry = db.Column(db.DateTime, nullable=True)

    notes = db.relationship("UserNotes", backref="user", lazy=True)
    user_string = db.relationship("UserString", backref="user", uselist=False)
    stroke_entries = db.relationship("StrokeData", backref="user_ref", lazy=True)
    word_lists = db.relationship("WordList", backref="user", lazy=True)

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


