import os
import json
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.sqlite import JSON

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
    daily_new_cards = db.Column(JSON, nullable=False)
    last_new_cards_date = db.Column(JSON, nullable=False)
    presented_new_cards = db.Column(JSON, nullable=False)
    learning_cards = db.Column(JSON, nullable=False)
    progress = db.Column(JSON, nullable=False)

# Function to migrate JSON files to database
def migrate_json_to_db(delete_files=False):
    json_dir = 'user_progress'
    
    # Ensure the database and tables exist
    with app.app_context():
        db.create_all()
    
    for filename in os.listdir(json_dir):
        if filename.endswith('.json'):
            file_path = os.path.join(json_dir, filename)
            username = os.path.splitext(filename)[0]  # Username is the filename without extension

            if username not in ['贝海', 'beihai', 'Triksi', 'Shuyu']:
                continue
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Create or update UserProgress entry
            with app.app_context():
                user_prog = UserProgress.query.filter_by(username=username).first()
                if not user_prog:
                    user_prog = UserProgress(username=username)
                
                user_prog.base_new_cards_limit = data.get('base_new_cards_limit', 20)
                user_prog.new_cards_limit = data.get('new_cards_limit', 20)
                user_prog.new_cards_limit_last_updated = data.get('new_cards_limit_last_updated', '')
                user_prog.daily_new_cards = data.get('daily_new_cards', {})
                user_prog.last_new_cards_date = data.get('last_new_cards_date', {})
                user_prog.presented_new_cards = data.get('presented_new_cards', {})
                user_prog.learning_cards = data.get('learning_cards', {})
                user_prog.progress = data.get('progress', {})
                
                db.session.add(user_prog)
                db.session.commit()
            
            print(f"Migrated {filename} to database.")
            
            # if delete_files:
            #     os.remove(file_path)
            #     print(f"Deleted {filename}")

# Run the migration
if __name__ == '__main__':
    migrate_json_to_db(delete_files=False)  # Set to True if you want to delete JSON files after migration
