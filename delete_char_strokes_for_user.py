import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dbmodels import StrokeData
from sqlalchemy.exc import OperationalError
import time

basedir = os.path.abspath(os.path.dirname(__file__))
engine = create_engine('sqlite:///' + os.path.join(basedir, 'flashcards.db'))
Session = sessionmaker(bind=engine)

def delete_stroke_data(username, character):
    session = Session()
    try:
        entries = session.query(StrokeData).filter_by(username=username, character=character).all()
        
        if not entries:
            print(f"No entries found for user '{username}' and character '{character}'")
            return
        
        for entry in entries:
            session.delete(entry)
        
        session.commit()
        print(f"Successfully deleted {len(entries)} entries for user '{username}' and character '{character}'")
    except OperationalError as e:
        print(f"Database error occurred: {e}")
        print("Retrying in 5 seconds...")
        time.sleep(5)
        delete_stroke_data(username, character)  # Recursive retry
    finally:
        session.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python delete_stroke_data.py <username> <character>")
        sys.exit(1)
    
    username = sys.argv[1]
    character = sys.argv[2]
    
    delete_stroke_data(username, character)
