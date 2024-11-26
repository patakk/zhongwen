from extensions import db

from sqlalchemy.dialects.sqlite import JSON

deck_cards = db.Table('deck_cards',
    db.Column('deck_id', db.Integer, db.ForeignKey('deck.id'), primary_key=True),
    db.Column('card_id', db.Integer, db.ForeignKey('card.id'), primary_key=True)
)

class Deck(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    cards = db.relationship('Card', secondary=deck_cards, back_populates='decks')

    def __repr__(self):
        return f'<Deck {self.name}>'

class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    character = db.Column(db.String(10), unique=True, nullable=False)
    pinyin = db.Column(db.String(50), nullable=False)
    english = db.Column(db.String(100), nullable=False)
    traditional = db.Column(db.String(10))
    function = db.Column(db.String(50))
    hsk_level = db.Column(db.Integer, nullable=False)
    char_matches = db.Column(db.String)
    pinyin_tones = db.Column(db.String(50))
    decks = db.relationship('Deck', secondary=deck_cards, back_populates='cards')

    def __repr__(self):
        return f'<Card {self.character}>'

class UserProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    base_new_cards_limit = db.Column(db.Integer, nullable=False)
    new_cards_limit = db.Column(db.Integer, nullable=False)
    new_cards_limit_last_updated = db.Column(db.String(32), nullable=False)
    daily_new_cards = db.Column(JSON, nullable=False)
    last_new_cards_date = db.Column(JSON, nullable=False)
    presented_new_cards = db.Column(JSON, nullable=False)
    progress = db.Column(JSON, nullable=False)

    def to_dict(self):
        return {
            "base_new_cards_limit": self.base_new_cards_limit,
            "daily_new_cards": self.daily_new_cards,
            "last_new_cards_date": self.last_new_cards_date,
            "new_cards_limit": self.new_cards_limit,
            "new_cards_limit_last_updated": self.new_cards_limit_last_updated,
            "presented_new_cards": self.presented_new_cards,
            "progress": self.progress
        }

    @classmethod
    def from_dict(cls, username, data):
        return cls(
            username=username,
            base_new_cards_limit=data["base_new_cards_limit"],
            new_cards_limit=data["new_cards_limit"],
            new_cards_limit_last_updated=data["new_cards_limit_last_updated"],
            daily_new_cards=data["daily_new_cards"],
            last_new_cards_date=data["last_new_cards_date"],
            presented_new_cards=data["presented_new_cards"],
            progress=data["progress"]
        )
    

class StrokeData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), db.ForeignKey('user_progress.username'), nullable=False)
    character = db.Column(db.String(10), nullable=False)
    strokes = db.Column(JSON, nullable=False)
    positioner = db.Column(JSON, nullable=False)
    mistakes = db.Column(db.Integer, nullable=False)
    stroke_count = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())

    def __repr__(self):
        return f'<StrokeData {self.username} - {self.character}>'

    @classmethod
    def from_dict(cls, data):
        return cls(
            username=data['username'],
            character=data['character'],
            strokes=data['strokes'],
            positioner=data['positioner'],
            mistakes=data['mistakes'],
            stroke_count=data['strokeCount']
        )