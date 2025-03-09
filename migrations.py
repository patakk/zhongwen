from flask_migrate import Migrate
from backend.setup import create_app
from backend.db.extensions import db
from backend.db.models import User, UserProgress, UserNotes, UserString, Card, StrokeData, WordList, WordEntry
import click
from flask.cli import with_appcontext
from datetime import datetime


app = create_app()
migrate = Migrate(app, db)

# List users command
@app.cli.command("list-users")
def list_users():
    """List all users and their details."""
    users = User.query.all()
    if not users:
        click.echo("No users found.")
        return
    
    for user in users:
        click.echo(f"\nUser ID: {user.id}")
        click.echo(f"Username: {user.username}")
        click.echo(f"Email: {user.email or 'Not set'}")
        click.echo(f"Email verified: {user.email_verified}")

# Add/update email command
@app.cli.command("set-email")
@click.argument("username")
@click.argument("email")
def set_email(username, email):
    """Set or update email for a user."""
    user = User.query.filter_by(username=username).first()
    if not user:
        click.echo(f"User {username} not found.")
        return
    
    user.email = email
    user.email_verified = True
    user.email_verification_token = None
    db.session.commit()
    click.echo(f"Email for user {username} set to {email} (verified)")

# User stats command
@app.cli.command("user-stats")
@click.argument("username")
def user_stats(username):
    """Show detailed stats for a user."""
    user = User.query.filter_by(username=username).first()
    if not user:
        click.echo(f"User {username} not found.")
        return

    click.echo(f"\nDetailed stats for {username}:")
    click.echo(f"User ID: {user.id}")
    click.echo(f"Email: {user.email or 'Not set'}")
    click.echo(f"Email verified: {user.email_verified}")
    
    # Notes stats
    notes_count = UserNotes.query.filter_by(user_id=user.id).count()
    click.echo(f"Total notes: {notes_count}")
    
    if user.progress:
        click.echo("\nProgress info:")
        click.echo(f"Base new cards limit: {user.progress.base_new_cards_limit}")
        click.echo(f"Current new cards limit: {user.progress.new_cards_limit}")
        click.echo(f"Last updated: {user.progress.new_cards_limit_last_updated}")

# Delete user command
@app.cli.command("delete-user")
@click.argument("username")
@click.confirmation_option(prompt="Are you sure you want to delete this user?")
def delete_user(username):
    """Delete a user and all their associated data."""
    user = User.query.filter_by(username=username).first()
    if not user:
        click.echo(f"User {username} not found.")
        return
    
    # Delete associated records first
    if user.progress:
        db.session.delete(user.progress)
    
    if user.notes:
        for note in user.notes:
            db.session.delete(note)
    
    if user.user_string:
        db.session.delete(user.user_string)
    
    if user.stroke_entries:
        for entry in user.stroke_entries:
            db.session.delete(entry)
    
    if user.word_lists:
        for word_list in user.word_lists:
            # Words will be deleted automatically due to cascade
            db.session.delete(word_list)
    
    # Finally delete the user
    db.session.delete(user)
    db.session.commit()
    click.echo(f"User {username} and all associated data deleted.")


# Reset password command
@app.cli.command("reset-password")
@click.argument("username")
@click.argument("new_password")
def reset_password(username, new_password):
    """Reset a user's password."""
    user = User.query.filter_by(username=username).first()
    if not user:
        click.echo(f"User {username} not found.")
        return
    
    user.set_password(new_password)
    db.session.commit()
    click.echo(f"Password reset for user {username}")


# Add new user command
@app.cli.command("add-user")
@click.argument("username")
@click.argument("password")
@click.option("--email", default=None)
def add_user(username, password, email):
    """Add a new user with optional email."""
    # Check if user already exists
    if User.query.filter_by(username=username).first():
        click.echo(f"User {username} already exists.")
        return

    # Create new user
    user = User(username=username)
    user.set_password(password)
    if email:
        user.email = email
        user.email_verified = True
        user.email_verification_token = None
    
    # Create default UserProgress for the new user
    default_progress = UserProgress(
        user_id=None,  # Will be set after user is committed
        base_new_cards_limit=20,
        new_cards_limit=20,
        new_cards_limit_last_updated=datetime.now().strftime("%Y-%m-%d"),
        daily_new_cards=[],
        last_new_cards_date={},
        presented_new_cards=[],
        learning_cards=[],
        progress={}
    )

    # Add to database
    db.session.add(user)
    db.session.flush()  # This generates the user.id
    default_progress.user_id = user.id
    db.session.add(default_progress)
    db.session.commit()

    click.echo(f"User {username} created successfully.")


@app.cli.command("list-word-lists")
@click.argument("username", required=False)
def list_word_lists(username=None):
    """List all word lists, optionally filtered by username."""
    if username:
        user = User.query.filter_by(username=username).first()
        if not user:
            click.echo(f"User {username} not found.")
            return
        word_lists = WordList.query.filter_by(user_id=user.id).all()
        click.echo(f"\nWord lists for user {username}:")
    else:
        word_lists = WordList.query.all()
        click.echo("\nAll word lists:")
    
    if not word_lists:
        click.echo("No word lists found.")
        return
    
    for wl in word_lists:
        user = User.query.get(wl.user_id)
        click.echo(f"List ID: {wl.id}, Name: {wl.name}, Owner: {user.username}, Words: {len(wl.words)}")

# List words in a word list
@app.cli.command("list-words")
@click.argument("list_id", type=int)
def list_words(list_id):
    """List all words in a specific word list."""
    word_list = WordList.query.get(list_id)
    if not word_list:
        click.echo(f"Word list with ID {list_id} not found.")
        return
    
    user = User.query.get(word_list.user_id)
    click.echo(f"\nWords in list '{word_list.name}' (ID: {word_list.id}, Owner: {user.username}):")
    
    if not word_list.words:
        click.echo("No words in this list.")
        return
    
    for idx, entry in enumerate(word_list.words, 1):
        click.echo(f"{idx}. {entry.word}")

# Create a new word list
@app.cli.command("create-word-list")
@click.argument("username")
@click.argument("list_name")
def create_word_list(username, list_name):
    """Create a new word list for a user."""
    user = User.query.filter_by(username=username).first()
    if not user:
        click.echo(f"User {username} not found.")
        return
    
    word_list = WordList(name=list_name, user_id=user.id)
    db.session.add(word_list)
    db.session.commit()
    click.echo(f"Word list '{list_name}' created for user {username} with ID {word_list.id}")

# Add word to a word list
@app.cli.command("add-word")
@click.argument("list_id", type=int)
@click.argument("word")
def add_word(list_id, word):
    """Add a word to a word list."""
    word_list = WordList.query.get(list_id)
    if not word_list:
        click.echo(f"Word list with ID {list_id} not found.")
        return
    
    # Check if the word already exists in this list
    existing = WordEntry.query.filter_by(list_id=list_id, word=word).first()
    if existing:
        click.echo(f"Word '{word}' is already in this list.")
        return
    
    entry = WordEntry(word=word, list_id=list_id)
    db.session.add(entry)
    db.session.commit()
    click.echo(f"Added word '{word}' to list '{word_list.name}'")

# Delete word from a list
@app.cli.command("delete-word")
@click.argument("list_id", type=int)
@click.argument("word")
def delete_word(list_id, word):
    """Delete a word from a word list."""
    entry = WordEntry.query.filter_by(list_id=list_id, word=word).first()
    if not entry:
        click.echo(f"Word '{word}' not found in list with ID {list_id}.")
        return
    
    db.session.delete(entry)
    db.session.commit()
    click.echo(f"Deleted word '{word}' from list with ID {list_id}")

# Show stroke data stats
@app.cli.command("stroke-stats")
@click.option("--username", "-u", help="Filter by username")
@click.option("--character", "-c", help="Filter by character")
def stroke_stats(username=None, character=None):
    """Show statistics about stroke data entries."""
    query = StrokeData.query
    
    if username:
        user = User.query.filter_by(username=username).first()
        if not user:
            click.echo(f"User {username} not found.")
            return
        query = query.filter_by(user_id=user.id)
    
    if character:
        query = query.filter_by(character=character)
    
    entries = query.all()
    
    if not entries:
        click.echo("No stroke data entries found with the specified filters.")
        return
    
    # Group by character if not filtering by specific character
    if not character:
        char_counts = {}
        for entry in entries:
            char_counts[entry.character] = char_counts.get(entry.character, 0) + 1
        
        click.echo(f"\nTotal stroke data entries: {len(entries)}")
        click.echo("\nEntries per character:")
        for char, count in sorted(char_counts.items(), key=lambda x: x[1], reverse=True):
            click.echo(f"{char}: {count} entries")
    else:
        # When filtering by character, group by user
        user_counts = {}
        for entry in entries:
            user = User.query.get(entry.user_id)
            user_counts[user.username] = user_counts.get(user.username, 0) + 1
        
        click.echo(f"\nTotal stroke data entries for character '{character}': {len(entries)}")
        click.echo("\nEntries per user:")
        for username, count in sorted(user_counts.items(), key=lambda x: x[1], reverse=True):
            click.echo(f"{username}: {count} entries")

# Delete a word list
@app.cli.command("delete-word-list")
@click.argument("list_id", type=int)
@click.confirmation_option(prompt="Are you sure you want to delete this word list and all its words?")
def delete_word_list(list_id):
    """Delete a word list and all its words."""
    word_list = WordList.query.get(list_id)
    if not word_list:
        click.echo(f"Word list with ID {list_id} not found.")
        return
    
    list_name = word_list.name
    user = User.query.get(word_list.user_id)
    
    # WordEntry objects will be deleted automatically due to cascade="all, delete-orphan"
    db.session.delete(word_list)
    db.session.commit()
    click.echo(f"Deleted word list '{list_name}' (ID: {list_id}) belonging to user {user.username}")



'''

# List all word lists
flask --app migrations.py list-word-lists

# List word lists for a specific user
flask --app migrations.py list-word-lists username

# List words in a specific word list
flask --app migrations.py list-words 5

# Create a new word list
flask --app migrations.py create-word-list username "HSK Level 1"

# Add a word to a word list
flask --app migrations.py add-word 5 "你好"

# Delete a word from a word list
flask --app migrations.py delete-word 5 "你好"

# Show stroke data statistics
flask --app migrations.py stroke-stats

# Show stroke data for a specific user
flask --app migrations.py stroke-stats --username johndoe

# Show stroke data for a specific character
flask --app migrations.py stroke-stats --character "好"

# Delete a word list
flask --app migrations.py delete-word-list 5

'''