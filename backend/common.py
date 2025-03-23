import json
import random
import os
from datetime import datetime, timezone
import re
import jieba.posseg as pseg
from hanziconv import HanziConv

from hanzipy.decomposer import HanziDecomposer
from hanzipy.dictionary import HanziDictionary
from pypinyin import lazy_pinyin, Style

decomposer = HanziDecomposer()
dictionary = HanziDictionary()

# from .flashcard_app import init_flashcard_app, get_flashcard_app

DATA_DIR = './data'

def load_secrets(secrets_file):
    secrets = {}
    try:
        with open(secrets_file, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, value = line.split('=', 1)
                    secrets[key.strip()] = value.strip()
    except Exception as e:
        print(f"Warning: Could not load secrets file: {e}")
    return secrets

auth_keys = load_secrets('/home/patakk/.zhongweb-secrets')


def get_pinyin(hanzi):
    result = lazy_pinyin(hanzi, style=Style.TONE)
    return ' '.join(result)


CARDDECKS = json.load(open(os.path.join(DATA_DIR, "decks.json")))
ANTHROPIC_DATA = json.load(open(os.path.join(DATA_DIR, "anthropic.json")))
TATOEBA_DATA = json.load(open(os.path.join(DATA_DIR, "tatoeba_examples.json")))
TATOEBA_MAP = json.load(open(os.path.join(DATA_DIR, "tatoeba_example_ids_by_char.json")))
DECKS_INFO = {key : CARDDECKS[key]["name"] for key in CARDDECKS}
STROKE_COUNT = json.load(open(os.path.join(DATA_DIR, "stroke_count.json")))
HANZI_DARKNESS_NOTO = json.load(open(os.path.join(DATA_DIR, "hanzi_darkness_noto.json")))
HANZI_DARKNESS_KAITI = json.load(open(os.path.join(DATA_DIR, "hanzi_darkness_kaiti.json")))


DECKNAMES = {
    d : CARDDECKS[d]['name'] for d in CARDDECKS
}

# init_flashcard_app({})
# flashcard_app = get_flashcard_app()

pos_map = {
    'n': 'noun', 'nr': 'proper noun', 'ns': 'place noun', 'nt': 'temporal noun', 'nz': 'other noun', 'v': 'verb', 'a': 'adjective', 'ad': 'adverb', 'an': 'prenoun', 'ag': 'adjective-adverb', 'al': 'adjective-numeral', 'b': 'other', 'c': 'complement', 'd': 'adverb', 'e': 'exclamation', 'f': 'surname', 'g': 'morpheme', 'h': 'prefix', 'i': 'idiom', 'j': 'abbreviation', 'k': 'suffix', 'l': 'temporary word', 'm': 'number', 'ng': 'gender noun', 'nx': 'kernel noun', 'o': 'onomatopoeia', 'p': 'preposition', 'q': 'classifier', 'r': 'pronoun', 'u': 'auxiliary', 'v': 'verb', 'vd': 'verb-auxiliary', 'vg': 'verb-object', 'vn': 'pronoun-verb', 'w': 'punctuation', 'x': 'non-lexeme', 'y': 'language-particle', 'z': 'state-particle'
}



def get_tatoeba_page(character, page):
    tatoebas = []
    tids = TATOEBA_MAP.get(character, [])
    examples = []
    is_last = False
    if not tids:
        return examples, is_last
    perpage = 5
    aa = perpage*page
    bb = aa + perpage
    if aa < 0:
        aa = 0
        bb = perpage
    if bb > len(TATOEBA_MAP.get(character)):
        bb = len(TATOEBA_MAP.get(character))
        aa = bb - perpage
        is_last = True
    if perpage > len(TATOEBA_MAP.get(character)):
        aa = 0
        bb = len(TATOEBA_MAP.get(character))
        is_last = True
    for tid in tids[aa:bb]:
        tatoebas.append(TATOEBA_DATA[tid])

    for idx, t in enumerate(tatoebas):
        try:
            t['cmn'] = simplify_hanzi(t['cmn'])
            words = pseg.cut(t['cmn'])
            cmn = []
            for a, b in words:
                cmn.append({**get_char_info(a, pinyin=True, english=True), 'character': a})
            examples.append({**t, 'cmn': cmn})
        except:
            pass

    return examples, is_last

def simplify_hanzi(text):
    return HanziConv.toSimplified(text)

def apply_exceptions(character, definitions):
    # if character in ['說', '说', '號', '号']:
    #     first = definitions[1]
    #     definitions[1] = definitions[0]
    #     definitions[0] = first
    return definitions

def get_char_info(character, pinyin=False, english=False, function=False, full=False):
    if full:
        return char_full_info_(character)
    info = {}
    try:
        # definition_results = dictionary.definition_lookup(character)
        # if pinyin:
        #     # info['pinyin'] = get_pinyin(character)
        #     info['pinyin'] = definition_results[0]['pinyin']
        # if english:
        #     if len(definition_results) == 1:
        #         best_entry = definition_results[0]
        #     else:
        #         best_entry = next((entry for entry in definition_results if entry_req(entry['definition'])), definition_results[0])

        #     definition = best_entry['definition']
        #     info['english'] = definition.strip("/")

        info['english'] = []
        info['pinyin'] = []
        definition_results = dictionary.definition_lookup(simplify_hanzi(character))
        if len(definition_results) >= 1:
            best_entry = next((entry for entry in definition_results if entry_req(entry['definition'])), 
                              definition_results[0])
            
            info['english'].append(best_entry['definition'])
            info['pinyin'].append(best_entry['pinyin'])
            
            for entry in definition_results:
                if entry != best_entry:
                    info['english'].append(entry['definition'])
                    info['pinyin'].append(entry['pinyin'])
            info['english'] = apply_exceptions(character, info['english'])
            info['pinyin'] = apply_exceptions(character, info['pinyin'])
    except:
        info['pinyin'] = [get_pinyin(character)]
        info['english'] = ["N/A"]
    info['character'] = character
    info['darkness'] = HANZI_DARKNESS_KAITI.get(character, -1)
    return info


def getshortdate():
    return datetime.now(timezone.utc).strftime("%Y%m%d")

def get_chars_info(characters, pinyin=False, english=False, function=False):
    return {c: get_char_info(c, pinyin, english, function) for c in characters}

CARDDECKS_W_PINYIN = {
    deck: {
        "name": CARDDECKS[deck]["name"],
        "chars": get_chars_info(CARDDECKS[deck]["chars"], pinyin=True)
    } for deck in CARDDECKS
}

def get_random_chars_from_deck(deck, n, pinyin=False, english=False, function=False):
    characters = CARDDECKS[deck]["chars"]
    random.shuffle(characters)
    characters = characters[:n]
    return {c: get_char_info(c, pinyin, english, function) for c in characters}

def char_decomp_info(char):
    decomposed = decomposer.decompose(char)
    # radicals = decomposed.get('radical', [])
    # radicals_with_meaning = {}
    # for radical in radicals:
    #     meaning = decomposer.get_radical_meaning(radical)
    #     radicals_with_meaning[radical] = meaning

    main_components = decomposed.get('once', [])
    main_components = [x for x in main_components if len(x) == 1]

    if not main_components:
        main_components = [char]

    ccs = []
    similars = {}
    for comp in main_components:
        try:
            similar = decomposer.get_characters_with_component(comp)
            if similar:
                similars[comp] = similar[:]
                ccs += similar
        except:
            pass
    # ccs = list(set(ccs))
    # ccs_f = []
    # for c in ccs:
    #     flag = True
    #     for comp in main_components:
    #         if c not in similars.get(comp, []):
    #             flag = False
    #     if flag:
    #         ccs_f.append(c)

    #return {char: ccs_f}
    return similars


def entry_req(definition):
    
    cleaned_definition = re.sub(r"/CL:[^/]+", "", definition)
    cleaned_definition = re.sub(r"/variant of [^/]+", "", cleaned_definition)
    cleaned_definition = re.sub(r"/used in [^/]+", "", cleaned_definition)
    cleaned_definition = re.sub(r"/abbr. for [^/]+", "", cleaned_definition)

    cleaned_definition = cleaned_definition.strip("/").strip()
    if not cleaned_definition:
        return False

    r1 = "surname " not in cleaned_definition
    r2 = "variant of" not in cleaned_definition
    r3 = "used in" not in cleaned_definition
    r4 = "abbr. for" not in cleaned_definition

    return r1 and r2 and r3 and r4

def char_full_info_(original_char):
    char = simplify_hanzi(original_char)
    example_words = []
    definition = []
    pinyin = []
    if True:
        definition_results = dictionary.definition_lookup(char)
        examples = dictionary.get_examples(char)
        examples_hf = examples['high_frequency']
        examples_mf = examples['mid_frequency']
        
        if len(definition_results) >= 1:
            best_entry = next((entry for entry in definition_results if entry_req(entry['definition'])), 
                              definition_results[0])
            
            example_words.append(best_entry['simplified'])
            definition.append(best_entry['definition'])
            pinyin.append(best_entry['pinyin'])
            
            for entry in definition_results:
                if entry != best_entry and "variant of" not in entry['definition']:
                    example_words.append(entry['simplified'])
                    definition.append(entry['definition'])
                    pinyin.append(entry['pinyin'])
        for examp in examples_hf:
            if examp['simplified'] != char:
                definition.append(examp['definition'])
                pinyin.append(examp['pinyin'])
                example_words.append(examp['simplified'])
        for examp in examples_mf:
            if examp['simplified'] != char:
                definition.append(examp['definition'])
                pinyin.append(examp['pinyin'])
                example_words.append(examp['simplified'])
    else:
        definition = ["-"]
        pinyin = ["-"]
        example_words = ["-"]
    frequency = "-"
    rank = "-"
    try:
        fr = dictionary.get_character_frequency(char)
        frequency = float(fr['percentage'])
        rank = int(fr['number'])
    except:
        pass
        
    decomposed = decomposer.decompose(char)
    radicals = decomposed.get('radical', [])
    radicals_with_meaning = {}
    for radical in radicals:
        meaning = decomposer.get_radical_meaning(radical)
        radicals_with_meaning[radical] = meaning

    graphical = list(set(decomposed.get('graphical', [])))

    main_components = decomposed.get('once', [])
    main_components = [x for x in main_components if len(x) == 1]

    similars = {}
    appears_in = []
    # for comp in main_components:
    #     similar = decomposer.get_characters_with_component(comp)
    #     if similar:
    #         similars[comp] = similar[:]
    # try:
    #     exam = dictionary.dictionary_search(char)
    #     appears_in = []
    #     for e in exam:
    #         if e['simplified'] == char:
    #             continue
    #         appears_in.append({'simplified': e['simplified'], 'pinyin': e['pinyin'], 'english': e['definition']})
    #         # if len(appears_in) > 5:
    #         #     break
    # except:
    #     appears_in = []
    definition = apply_exceptions(original_char, definition)
    pinyin = apply_exceptions(original_char, pinyin)

    return {
        'english': definition,
        'frequency': frequency,
        'rank': rank,
        'simplified': HanziConv.toSimplified(char),
        'traditional': HanziConv.toTraditional(char),
        'darkness': HANZI_DARKNESS_KAITI.get(original_char, -1),
        'radicals': radicals_with_meaning,
        'graphical': graphical,
        'main_components': main_components,
        'similars': similars,
        'appears_in': appears_in,
        'pinyin': pinyin,
        'example_words': example_words,
        # 'pinyin': get_pinyin(char),
    }