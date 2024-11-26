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

def transfer_stroke_data(from_username, to_username):
    session = Session()
    try:
        # Query all entries for the source user
        entries = session.query(StrokeData).filter_by(username=from_username).all()
        
        if not entries:
            print(f"No entries found for user '{from_username}'")
            return
        
        transfer_count = 0
        for entry in entries:
            # Create a new entry for the target user
            new_entry = StrokeData(
                username=to_username,
                character=entry.character,
                strokes=entry.strokes,
                positioner=entry.positioner,
                mistakes=entry.mistakes,
                stroke_count=entry.stroke_count,
                timestamp=entry.timestamp
            )
            session.add(new_entry)
            transfer_count += 1
        
        session.commit()
        print(f"Successfully transferred {transfer_count} entries from user '{from_username}' to user '{to_username}'")
    except OperationalError as e:
        print(f"Database error occurred: {e}")
        print("Retrying in 5 seconds...")
        time.sleep(5)
        transfer_stroke_data(from_username, to_username)  # Recursive retry
    finally:
        session.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python transfer_stroke_data.py <from_username> <to_username>")
        sys.exit(1)
    
    from_username = sys.argv[1]
    to_username = sys.argv[2]
    
    transfer_stroke_data(from_username, to_username)
