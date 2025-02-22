from sqlalchemy.dialects.sqlite import JSON
from werkzeug.security import generate_password_hash, check_password_hash

from backend.db.extensions import db

class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    character = db.Column(db.String(10), unique=True, nullable=False)
    def __repr__(self):
        return f"<Card {self.character}>"

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    progress = db.relationship("UserProgress", backref="user", uselist=False)
    notes = db.relationship("UserNotes", backref="user", lazy=True)
    user_string = db.relationship("UserString", backref="user", uselist=False)
    stroke_entries = db.relationship("StrokeData", backref="user_ref", lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class StrokeData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    character = db.Column(db.String(10), nullable=False)
    strokes = db.Column(JSON, nullable=False)
    positioner = db.Column(JSON, nullable=False)
    mistakes = db.Column(db.Integer, nullable=False)
    stroke_count = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())

    def __repr__(self):
        return f"<StrokeData {self.user_ref.username} - {self.character}>" 

    @classmethod
    def from_dict(cls, data):
        user = User.query.filter_by(username=data['username']).first()
        if not user:
            raise ValueError(f"User not found: {data['username']}")
        
        return cls(
            user_id=user.id,
            character=data['character'],
            strokes=data['strokes'],
            positioner=data['positioner'],
            mistakes=data['mistakes'],
            stroke_count=data['strokeCount'],
        )

class UserProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    base_new_cards_limit = db.Column(db.Integer, nullable=False)
    new_cards_limit = db.Column(db.Integer, nullable=False)
    new_cards_limit_last_updated = db.Column(db.String(32), nullable=False)
    daily_new_cards = db.Column(JSON, nullable=False)
    last_new_cards_date = db.Column(JSON, nullable=False)
    presented_new_cards = db.Column(JSON, nullable=False)
    learning_cards = db.Column(JSON, nullable=False)
    progress = db.Column(JSON, nullable=False)

    def to_dict(self):
        return {
            "base_new_cards_limit": self.base_new_cards_limit,
            "daily_new_cards": self.daily_new_cards,
            "last_new_cards_date": self.last_new_cards_date,
            "new_cards_limit": self.new_cards_limit,
            "new_cards_limit_last_updated": self.new_cards_limit_last_updated,
            "presented_new_cards": self.presented_new_cards,
            "learning_cards": self.learning_cards,
            "progress": self.progress,
        }

    @classmethod
    def from_dict(cls, user, data):
        """
        Create a UserProgress instance from a dictionary.
        
        Args:
            user: Can be either a User instance or user_id
            data: Dictionary containing progress data
        """
        user_id = user.id if isinstance(user, User) else user
        
        return cls(
            user_id=user_id,
            base_new_cards_limit=data["base_new_cards_limit"],
            new_cards_limit=data["new_cards_limit"],
            new_cards_limit_last_updated=data["new_cards_limit_last_updated"],
            daily_new_cards=data["daily_new_cards"],
            last_new_cards_date=data["last_new_cards_date"],
            presented_new_cards=data["presented_new_cards"],
            learning_cards=data["learning_cards"],
            progress=data["progress"],
        )


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


