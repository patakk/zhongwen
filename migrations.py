from flask_migrate import Migrate
from backend.setup import create_app
from backend.db.extensions import db
from backend.db.models import User, UserProgress, UserNotes, UserString, Card, StrokeData
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
    
    # Stroke data stats
    stroke_count = StrokeData.query.filter_by(user_id=user.id).count()
    click.echo(f"Total stroke entries: {stroke_count}")
    
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

# List learning cards command
@app.cli.command("list-learning-cards")
@click.argument("username")
def list_learning_cards(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        print(f"User {username} not found")
        return

    user_progress = UserProgress.query.filter_by(user_id=user.id).first()
    if not user_progress:
        print(f"No progress data for {username}")
        return

    print(f"\nLearning cards for {username}:")
    for card in user_progress.learning_cards:
        print(card)

@app.cli.command("add-learning-card")
@click.argument("username")
@click.argument("hanzi")
def add_learning_card(username, hanzi):
    """Add a hanzi word to user's learning cards."""
    user = User.query.filter_by(username=username).first()
    if not user:
        click.echo(f"User {username} not found.")
        return
    
    if not user.progress:
        click.echo(f"No progress record found for user {username}")
        return
    
    # Get current learning cards
    learning_cards = list(user.progress.learning_cards or [])  # Create a new list
    
    # Check if card already exists
    if hanzi in learning_cards:
        click.echo(f"'{hanzi}' is already in learning cards.")
        return
    
    # Add new card
    learning_cards.append(hanzi)
    
    # Force SQLAlchemy to recognize the change
    user.progress.learning_cards = None  # First set to None
    db.session.flush()  # Flush the change
    user.progress.learning_cards = learning_cards  # Then set the new list
    
    db.session.commit()
    
    # Verify the change
    db.session.refresh(user.progress)
    click.echo(f"Added '{hanzi}' to learning cards for user {username}")
    click.echo(f"Current learning cards: {user.progress.learning_cards}")



'''

# List all users and their details
flask --app migrations.py list-users

# Set/update email for a user
flask --app migrations.py set-email username user@example.com

# Show detailed stats for a user
flask --app migrations.py user-stats username

# Delete a user (will ask for confirmation)
flask --app migrations.py delete-user username

# Reset a user's password
flask --app migrations.py reset-password username newpassword

# Add a new user
flask --app migrations.py add-user username password --email optional@email.com

# List learning cards for a user
flask --app migrations.py list-learning-cards username

# Add a hanzi word to learning cards
flask --app migrations.py add-learning-card username "鸡肉"

'''