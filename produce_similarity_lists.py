import json
from collections import defaultdict

FILES = [
    'data/shas_class_cards.json',
    'data/hsk1_cards.json',
    'data/hsk2_cards.json',
    'data/hsk3_cards.json',
    'data/hsk4_cards.json',
    'data/hsk5_cards.json',
    'data/hsk6_cards.json',
    'data/mini_deck.json',
]

HSK_FILES = [file for file in FILES if 'hsk' in file]

def load_json_file(file):
    with open(file, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json_file(file, data):
    with open(file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def determine_hsk_level(word, hsk_data):
    for level, words in hsk_data.items():
        if word in words:
            return level
    return 'unknown'

def process_files(files):
    all_words = {}
    file_data = {}
    hsk_data = {}

    # First pass: Load all data and collect HSK words
    for file in files:
        data = load_json_file(file)
        file_data[file] = data
        all_words.update(data)
        
        if 'hsk' in file:
            level = file.split('_')[0].split('/')[-1]
            hsk_data[level] = data

    # Second pass: Recalculate char_matches for each word in each file
    for file in files:
        data = file_data[file]
        for word, word_data in data.items():
            char_matches = defaultdict(lambda: defaultdict(list))
            for char in word:
                for other_word in all_words:
                    if char in other_word and other_word != word:
                        level = determine_hsk_level(other_word, hsk_data)
                        char_matches[char][level].append(other_word)
            
            # Update char_matches for this word
            word_data['char_matches'] = {
                char: dict(levels) for char, levels in char_matches.items()
            }
        
        # Save the updated data back to the file
        save_json_file(file, data)
        print(f"Updated {file}")

    print("All files have been processed and updated.")

# Run the process
process_files(FILES)
