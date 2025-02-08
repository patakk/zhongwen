from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import json
import sys
import os

# Setup Flask and SQLAlchemy
app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'flashcards.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# UserProgress model (make sure this matches your current model)
class UserProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    base_new_cards_limit = db.Column(db.Integer, nullable=False)
    new_cards_limit = db.Column(db.Integer, nullable=False)
    new_cards_limit_last_updated = db.Column(db.String(8), nullable=False)
    daily_new_cards = db.Column(db.JSON, nullable=False)
    last_new_cards_date = db.Column(db.JSON, nullable=False)
    presented_new_cards = db.Column(db.JSON, nullable=False)
    learning_cards = db.Column(db.JSON, nullable=False)
    progress = db.Column(db.JSON, nullable=False)

def print_all_user_progress():
    with app.app_context():
        all_users = UserProgress.query.all()
        
        if not all_users:
            print("No user progress data found in the database.")
            return

        for user in all_users:
            if user.username != sys.argv[1]:
                continue
            print(f"\n--- User: {user.username} ---")
            print(f"Base New Cards Limit: {user.base_new_cards_limit}")
            print(f"New Cards Limit: {user.new_cards_limit}")
            print(f"New Cards Limit Last Updated: {user.new_cards_limit_last_updated}")
            print("\nDaily New Cards:")
            print(json.dumps(user.daily_new_cards, indent=2, ensure_ascii=False))
            print("\nLast New Cards Date:")
            print(json.dumps(user.last_new_cards_date, indent=2, ensure_ascii=False))
            print("\nPresented New Cards:")
            print(json.dumps(user.presented_new_cards, indent=2, ensure_ascii=False))
            print("\nLearning Cards:")
            print(json.dumps(user.learning_cards, indent=2, ensure_ascii=False))
            print("\nProgress:")
            print(json.dumps(user.progress, indent=2, ensure_ascii=False))
            print("\n" + "="*50)

if __name__ == '__main__':
    print_all_user_progress()
