import json
from collections import defaultdict
import json
import jieba
import jieba.posseg as pseg
from pypinyin import pinyin, lazy_pinyin, Style

FILES = [
    #'data/shas_class_cards.json',
    #'data/hsk1_cards.json',
    #'data/hsk2_cards.json',
    #'data/hsk3_cards.json',
    #'data/hsk4_cards.json',
    #'data/hsk5_cards.json',
    #'data/hsk6_cards.json',
    #'data/mini_deck.json',
    'data/review_deck.json',
]

files = [
    'data/shas_class_cards.json',
    'data/hsk1_cards.json',
    'data/hsk2_cards.json',
    'data/hsk3_cards.json',
    'data/hsk4_cards.json',
    'data/hsk5_cards.json',
    'data/hsk6_cards.json',
    'data/mini_deck.json',
    'data/review_deck.json',
]

shas = json.load(open(files[0]))
hsk1 = json.load(open(files[1]))
hsk2 = json.load(open(files[2]))
hsk3 = json.load(open(files[3]))
hsk4 = json.load(open(files[4]))
hsk5 = json.load(open(files[5]))
hsk6 = json.load(open(files[6]))
review = json.load(open(files[7]))

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

from pypinyin import pinyin, lazy_pinyin, Style

tone_list = ['ā', 'á', 'ǎ', 'à', 'ē', 'é', 'ě', 'è', 'ī', 'í', 'ǐ', 'ì', 'ō', 'ó', 'ǒ', 'ò', 'ū', 'ú', 'ǔ', 'ù', 'ü', 'ǘ', 'ǚ', 'ǜ', 'ü']
pos_map = {
    'n': 'noun', 'nr': 'proper noun', 'ns': 'place noun', 'nt': 'temporal noun', 'nz': 'other noun', 'v': 'verb', 'a': 'adjective', 'ad': 'adverb', 'an': 'prenoun', 'ag': 'adjective-adverb', 'al': 'adjective-numeral', 'b': 'other', 'c': 'complement', 'd': 'adverb', 'e': 'exclamation', 'f': 'surname', 'g': 'morpheme', 'h': 'prefix', 'i': 'idiom', 'j': 'abbreviation', 'k': 'suffix', 'l': 'temporary word', 'm': 'number', 'ng': 'gender noun', 'nx': 'kernel noun', 'o': 'onomatopoeia', 'p': 'preposition', 'q': 'classifier', 'r': 'pronoun', 'u': 'auxiliary', 'v': 'verb', 'vd': 'verb-auxiliary', 'vg': 'verb-object', 'vn': 'pronoun-verb', 'w': 'punctuation', 'x': 'non-lexeme', 'y': 'language-particle', 'z': 'state-particle'
}

def add_hsk_and_tones(files):
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

    # Second pass: Recalculate char_matches for each word and add pinyin_tones
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
            
            # Add pinyin_tones field
            pin = ' '.join(lazy_pinyin(word))
        
            original_pinyin = word_data.get('pinyin', '')
            try:
                processed = ''
                idxo = 0
                for i, char in enumerate(pin):
                    if char == ' ' and original_pinyin[idxo] != ' ':
                        processed += ' '
                    else:
                        processed += original_pinyin[idxo]
                        idxo += 1
            except:
                if pin[-2:] == 'er':
                    pin = pin[:-2] + 'r'
                processed = ''
                idxo = 0
                for i, char in enumerate(pin):
                    if char == ' ' and original_pinyin[idxo] != ' ':
                        processed += '-'
                    else:
                            processed += original_pinyin[idxo]
                            idxo += 1


            word_data['pinyin_tones'] = processed.strip()

            if 'pinyin_tones_1' in word_data:
                del word_data['pinyin_tones_1']
            if 'pinyin_tones_2' in word_data:
                del word_data['pinyin_tones_2']
                
        # Save the updated data back to the file
        save_json_file(file, data)
        print(f"Updated {file}")

    print("All files have been processed and updated.")

def add_functions(files):
    for file in files:
        j = json.load(open(file))
        from pypinyin import pinyin, lazy_pinyin, Style
        
        for w in list(j.keys())[:]:
            word = j[w]['pinyin']
            eword = j[w]['english']
            
            sentence = w
            words = pseg.cut(sentence)

            if 'function' in j[w]:
                continue

            print('adding function to', w)
        
            functions = []
            hsk_levels = []
            for word, flag in words:
                function = pos_map.get(flag, 'unknown')
                functions.append(function)

                if word in hsk1:
                    hsk_levels.append(1)
                elif word in hsk2:
                    hsk_levels.append(2)
                elif word in hsk3:
                    hsk_levels.append(3)
                elif word in hsk4:
                    hsk_levels.append(4)
                elif word in hsk5:
                    hsk_levels.append(5)
                elif word in hsk6:
                    hsk_levels.append(6)
                else:
                    hsk_levels.append(-1)
                # words_dict[word] = {
                #     "pinyin": pinyin,
                #     "english": english,
                #     "functions": functions
                # }
            if len(functions) == 1:
                j[w]['function'] = functions[0]
            else:
                j[w]['function'] = functions
            if len(hsk_levels) == 1:
                j[w]['hsk_level'] = hsk_levels[0]
            else:
                j[w]['hsk_level'] = hsk_levels
        
        with open(file, 'w') as f: 
            f.write(json.dumps(j, indent=4, ensure_ascii=False))
    print("All files have been processed and updated.")

# Run the process
add_hsk_and_tones(FILES)
add_functions(FILES)
