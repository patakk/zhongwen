import json
import logging
import os
import random
import time
from datetime import date, datetime, timedelta, timezone

from flask import session

from backend.db.ops import (db_load_user_progress, db_load_user_value,
                            db_save_user_progress, db_store_user_value)

logger = logging.getLogger(__name__)

_flashcard_app = None

def getshortdate():
    return datetime.now(timezone.utc).strftime("%Y%m%d")

def init_flashcard_app(cards):
    global _flashcard_app
    _flashcard_app = FlashcardApp(cards)


def get_flashcard_app():
    return _flashcard_app


class FlashcardApp:
    def __init__(self, cards):
        self.NUM_BOXES = 6
        self.REVIEW_INTERVALS = [0, 1, 3, 7, 14, 30]
        self.DIFFICULTY_CAP = 3.0
        self.STREAK_FACTOR = 20
        self.BASE_NEW_CARDS_LIMIT = 5

        self.daily_new_cards = []
        self.last_new_cards_date = []
        self.presented_new_cards = []
        self.cards = cards
    
    def add_word_to_learning(self, username, word):
        current_learning = db_load_user_value(username, "learning_cards") or []
        if word not in current_learning:
            current_learning.append(word)
            success, message = db_store_user_value(username, "learning_cards", current_learning)
            print(message)

    def remove_word_from_learning(self, username, word):
        daily_new_cards = db_load_user_value(username, "daily_new_cards") or []
        if word in daily_new_cards:
            daily_new_cards.remove(word)
            db_store_user_value(username, "daily_new_cards", daily_new_cards)
        current_learning = db_load_user_value(username, "learning_cards") or []
        if word in current_learning:
            current_learning.remove(word)
            db_store_user_value(username, "learning_cards", current_learning)
        presented_new_cards = db_load_user_value(username, "presented_new_cards") or []
        if word in presented_new_cards:
            presented_new_cards.remove(word)
            db_store_user_value(username, "presented_new_cards", presented_new_cards)
            

    def record_answer(self, username, character, correct):
        uprogress = db_load_user_progress(username)
        if character not in uprogress["progress"]:
            uprogress["progress"][character] = {
                "answers": [],
                "box": 1,
                "streak": 0,
                "num_incorrect": 0,
                "views": 0,
                "difficulty": 1.0,
                "next_review": datetime.now(timezone.utc).isoformat(),
            }

        char_progress = uprogress["progress"][character]

        is_ahead_of_schedule = (
            char_progress.get("next_review") > datetime.now(timezone.utc).isoformat()
        )

        if correct == "true":
            char_progress["answers"].append("correct")
            if not is_ahead_of_schedule:
                char_progress["box"] = min(self.NUM_BOXES, char_progress["box"] + 1)
                logger.info(
                    f"Character {character} is not ahead of schedule, so advancing to next box"
                )
            else:
                logger.info(
                    f"Character {character} is ahead of schedule, so not advancing to next box"
                )
            char_progress["streak"] += 1
        else:
            char_progress["answers"].append("incorrect")
            if not is_ahead_of_schedule:
                char_progress["box"] = 1
                logger.info(
                    f"Character {character} is not ahead of schedule, so resetting to box 1"
                )
            else:
                logger.info(
                    f"Character {character} is ahead of schedule, so not resetting to box 1"
                )
            char_progress["num_incorrect"] += 1
            char_progress["streak"] = 0

        char_progress["views"] += 1
        char_progress["difficulty"] = self.calculate_difficulty(char_progress)
        if not is_ahead_of_schedule:
            char_progress["next_review"] = self.calculate_next_review_date(
                char_progress
            )
        else:
            logger.info(
                "Character %s is ahead of schedule, so not updating next review date", character
            )
        uprogress["progress"][character] = char_progress

        db_save_user_progress(username, uprogress)

    def calculate_difficulty(self, char_progress):
        base_difficulty = 1 + max(0, char_progress["num_incorrect"] - 2) / 10
        streak_factor = max(0.5, 1 - (char_progress["streak"] / self.STREAK_FACTOR))
        return min(self.DIFFICULTY_CAP, base_difficulty * streak_factor)

    def calculate_next_review_date(self, char_progress):
        base_interval = self.REVIEW_INTERVALS[char_progress["box"] - 1]
        if base_interval == 0:
            return datetime.now(timezone.utc).isoformat()  # Immediate review for box 1
        difficulty = char_progress["difficulty"]
        # return (datetime.now(timezone.utc) + timedelta(days=base_interval / difficulty)).isoformat()
        return (
            datetime.now(timezone.utc) + timedelta(days=base_interval / difficulty)
        ).isoformat()

    def get_due_cards(self, username, count=10000):
        due_cards = []
        current_time = datetime.now(timezone.utc)

        uprogress = db_load_user_progress(username)
        learning_cards = db_load_user_value(username, "learning_cards") or []
        for character in learning_cards:
            character_progress = uprogress["progress"].get(character, {})
            next_review_str = character_progress.get("next_review")
            if next_review_str:
                try:
                    next_review = datetime.fromisoformat(next_review_str)
                    if next_review.tzinfo is None:
                        next_review = next_review.replace(tzinfo=timezone.utc)
                    if next_review <= current_time:
                        due_cards.append(character)
                except ValueError:
                    logger.info(
                        f"Invalid date format for character {character}: {next_review_str}"
                    )

        random.shuffle(due_cards)
        due_cards = due_cards[:count]

        return due_cards

    def get_new_cards(self, username, force_new_cards=False):
        today = date.today()
        uprogress = db_load_user_progress(username)
        last_new_cards_date = db_load_user_value(username, "last_new_cards_date") or []
        learning_cards = db_load_user_value(username, "learning_cards") or []
        if (
            last_new_cards_date
            != today.isoformat()
            or force_new_cards
        ):

            logger.info(f"Generating new cards for user {username}")

            new_cards = [
                character
                for character in learning_cards
                if character not in uprogress["progress"]
            ]

            seed = int(f"{today.year}{today.month:02d}{today.day:02d}")
            rng = random.Random(seed + 17238)

            new_cards = sorted(new_cards)
            rng.shuffle(new_cards)
            uprogress["daily_new_cards"] = new_cards[
                : uprogress["new_cards_limit"]
            ]
            if force_new_cards:
                logger.info("Forced new cards")
                logger.info(uprogress["daily_new_cards"])
            uprogress["last_new_cards_date"] = today.isoformat()
            if not force_new_cards:
                uprogress["presented_new_cards"] = []
            db_save_user_progress(username, uprogress)

        remaining_new_cards = [
            card
            for card in uprogress["daily_new_cards"]
            if card not in uprogress["presented_new_cards"]
        ]
        return remaining_new_cards

    def select_card(self, username):
        learning_cards = db_load_user_value(username, "learning_cards") or []
        if username == "tempuser":
            return "", random.choice(learning_cards)
        new_cards_limit = db_load_user_value(username, "new_cards_limit")
        # base_new_cards_limit = db_load_user_value(username, 'base_new_cards_limit')
        new_cards_limit_last_updated = (
            db_load_user_value(username, "new_cards_limit_last_updated") or getshortdate()
        )

        message = ""

        due_cards = self.get_due_cards(username)
        new_cards = self.get_new_cards(username)[:new_cards_limit]
        presented_new_cards = db_load_user_value(username, "presented_new_cards") or {}

        card_to_return = None
        attempts = 0
        max_attempts = 10
        while attempts < max_attempts:

            has_due_cards = len(due_cards) > 0
            has_new_cards = len(new_cards) > 0

            if has_due_cards and has_new_cards:
                chance = 0.5
                if len(due_cards) < 5:
                    chance = 0.3
                if len(due_cards) < 3:
                    chance = 0.2
                if len(due_cards) > 16:
                    chance = 0.75
                if len(due_cards) > 20:
                    chance = 0.9
                if random.random() < chance:  # 50% chance for due cards
                    logger.info("Selecting from due cards")
                    card_to_return = random.choice(due_cards)
                else:
                    logger.info("Selecting from new cards")
                    card_to_return = random.choice(new_cards)
            elif has_due_cards and len(due_cards) > 1:
                logger.info("Selecting from due cards only")
                card_to_return = random.choice(due_cards)
                # if len(due_cards) <= min(5, new_cards_limit):
                #     logger.info('too few due cards, adding new cards')
                #     logger.info(new_cards)
                #     new_cards = self.get_new_cards(username, force_new_cards=True)
                #     logger.info(new_cards)
            elif has_new_cards:
                logger.info("Selecting from new cards only")
                logger.info("new cards len " + str(len(new_cards)))
                card_to_return = random.choice(new_cards)
            else:
                logger.info(
                    "No due or new cards (or only 1 due card),  adding new cards"
                )
                new_cards = self.get_new_cards(username, force_new_cards=True)
                logger.info(new_cards)
                if len(new_cards) > 0:
                    card_to_return = random.choice(new_cards)
                elif len(presented_new_cards) > 0:
                    card_to_return = random.choice(presented_new_cards)
                elif has_due_cards and len(due_cards) > 0:
                    logger.info("Selecting from due cards only")
                    card_to_return = random.choice(due_cards)
                else:
                    if learning_cards:
                        card_to_return = random.choice(learning_cards)
                message = ""

            if (
                card_to_return != session["current_card"]
                or session["current_card"] is None
            ):
                break
            attempts += 1

        if attempts == max_attempts:
            logger.info(f"Warning: Max attempts reached when selecting card")

        daily_new_cards = db_load_user_value(username, "daily_new_cards") or []
        presented_new_cards = db_load_user_value(username, "presented_new_cards") or []
        learning_cards = db_load_user_value(username, "learning_cards") or []
        if card_to_return in daily_new_cards:
            if card_to_return not in presented_new_cards:
                presented_new_cards.append(card_to_return)

        db_store_user_value(username, "presented_new_cards", presented_new_cards)
        db_store_user_value(username, "new_cards_limit", new_cards_limit)
        db_store_user_value(
            username, "new_cards_limit_last_updated", new_cards_limit_last_updated
        )

        logger.info(f"New cards: {new_cards}")
        logger.info(f"Due cards: {due_cards}")
        logger.info(f"Selected card: {card_to_return}")
        logger.info(f"presented_new_cards: {presented_new_cards}")
        logger.info(f"learning_cards: {learning_cards}")
        
        session["current_card"] = card_to_return
        return message, card_to_return
