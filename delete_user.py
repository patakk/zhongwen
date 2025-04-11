from app import db, UserProgress, app

def delete_user(username):
    with app.app_context():
        user = UserProgress.query.filter_by(username=username).first()
        if user:
            try:
                db.session.delete(user)
                db.session.commit()
                print(f"User '{username}' and their progress have been deleted successfully.")
            except Exception as e:
                db.session.rollback()
                print(f"An error occurred while deleting user '{username}': {str(e)}")
        else:
            print(f"User '{username}' not found.")

if __name__ == "__main__":
    all_users = None
    with app.app_context():
        all_users = UserProgress.query.all()
    print("All users:")
    for user in all_users:
        print("  ", user.username)

    username_to_delete = input("Enter the username to delete: ")
    delete_user(username_to_delete)