import json
import os
import jieba.posseg as pseg

from hanzipy.decomposer import HanziDecomposer
from hanzipy.dictionary import HanziDictionary

decomposer = HanziDecomposer()
dictionary = HanziDictionary()

from .flashcard_app import init_flashcard_app, get_flashcard_app

BASE_DIR = '.'
DATA_DIR = os.path.join(BASE_DIR, 'data')


from pypinyin import lazy_pinyin, Style

def get_pinyin(hanzi):
    result = lazy_pinyin(hanzi, style=Style.TONE)
    return ' '.join(result)


CARDDECKS = json.load(open(os.path.join(DATA_DIR, "decks.json")))
ANTHROPIC_DATA = json.load(open(os.path.join(DATA_DIR, "anthropic.json")))
TATOEBA_DATA = json.load(open(os.path.join(DATA_DIR, "tatoeba_examples.json")))
TATOEBA_MAP = json.load(open(os.path.join(DATA_DIR, "tatoeba_example_ids_by_char.json")))
DECKS_INFO = {key : CARDDECKS[key]["name"] for key in CARDDECKS}

init_flashcard_app({})
flashcard_app = get_flashcard_app()

pos_map = {
    'n': 'noun', 'nr': 'proper noun', 'ns': 'place noun', 'nt': 'temporal noun', 'nz': 'other noun', 'v': 'verb', 'a': 'adjective', 'ad': 'adverb', 'an': 'prenoun', 'ag': 'adjective-adverb', 'al': 'adjective-numeral', 'b': 'other', 'c': 'complement', 'd': 'adverb', 'e': 'exclamation', 'f': 'surname', 'g': 'morpheme', 'h': 'prefix', 'i': 'idiom', 'j': 'abbreviation', 'k': 'suffix', 'l': 'temporary word', 'm': 'number', 'ng': 'gender noun', 'nx': 'kernel noun', 'o': 'onomatopoeia', 'p': 'preposition', 'q': 'classifier', 'r': 'pronoun', 'u': 'auxiliary', 'v': 'verb', 'vd': 'verb-auxiliary', 'vg': 'verb-object', 'vn': 'pronoun-verb', 'w': 'punctuation', 'x': 'non-lexeme', 'y': 'language-particle', 'z': 'state-particle'
}


def get_character_page(character, page):
    tatoebas = []
    tids = TATOEBA_MAP.get(character, [])
    if not tids:
        return None
    perpage = 5
    is_last = False
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
    return tatoebas, is_last

def character_simple_info(character):
    definition = ''
    hsk = 'IMPLEMENT ME (HSK)'

    words = pseg.cut(character)
    functions = []
    for _, flag in words:
        f = pos_map.get(flag, 'unknown')
        functions.append(f)
    function = 'IMPLEMENT ME (FUNCTION)'
    if len(functions) == 1:
        function = functions[0]
    else:
        function = functions

    try:
        dlup = dictionary.definition_lookup(character)
        definition = ''
        definition = dlup[0]['definition']
    except:
        pass
    return {
        'english': definition,
        'pinyin': get_pinyin(character),
        'hsk_level': hsk,
        'function': function,
    }



def character_info(char):
    definition = "-"
    try:
        definition = dictionary.definition_lookup(char)[0]['definition']
    except:
        pass
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
    for comp in main_components:
        similar = decomposer.get_characters_with_component(comp)
        if similar:
            similars[comp] = similar[:]

    try:
        # exam = dictionary.get_examples(char)
        # appears_in = []
        # for fr in exam:
        #     for e in exam[fr]:
        #         if e['simplified'] == char:
        #             continue
        #         appears_in.append({'simplified': e['simplified'], 'pinyin': e['pinyin'], 'definition': e['definition']})

        exam = dictionary.dictionary_search(char)
        appears_in = []
        for e in exam:
            if e['simplified'] == char:
                continue
            appears_in.append({'simplified': e['simplified'], 'pinyin': e['pinyin'], 'english': e['definition']})
            # if len(appears_in) > 5:
            #     break

    except:
        appears_in = []
    return {
        'english': definition,
        'frequency': frequency,
        'rank': rank,
        'radicals': radicals_with_meaning,
        'graphical': graphical,
        'main_components': main_components,
        'similars': similars,
        'appears_in': appears_in,
        'pinyin': get_pinyin(char),
    }