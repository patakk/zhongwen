import yaml
import string
import json
import os
import re
import regex
from flask import Flask, request, jsonify
from hanziconv import HanziConv
from hanzipy.dictionary import HanziDictionary
from nltk.stem import WordNetLemmatizer
import logging

app = Flask(__name__)
application = app

lemmatizer = WordNetLemmatizer()
lemmatizer.lemmatize('jeans')

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

print('__file__:', __file__)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
CONFIG_PATH = os.path.join(BASE_DIR, 'config.yml')
print('BASE_DIR:', BASE_DIR)
print('CONFIG_PATH:', CONFIG_PATH)

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

def load_config():
    with open(CONFIG_PATH) as f:
        config = yaml.safe_load(f)
    print("Loaded config:")
    print(yaml.dump(config, default_flow_style=False))
    return config

config = load_config()
secrets_path = os.path.join(config['paths']['root'], config['paths']['secrets'])

auth_keys = load_secrets(secrets_path)

DATA_DIR = os.path.join(config['paths']['root'], config['paths']['data_dir'])
indices_cache = json.load(open(os.path.join(DATA_DIR, "indices_cache.json")))
dictionary = HanziDictionary(indices_cache=indices_cache)




def gather_hanzi_results(query, dict_client, include_other_examples=True):
    """Return (results, has_direct_match) for a Hanzi term."""
    results = []
    has_direct = False

    simplified_query = HanziConv.toSimplified(query)
    traditional_query = HanziConv.toTraditional(query)
    prefer_simplified = query == simplified_query

    def choose_hanzi(entry):
        # Match the user's variant (simplified vs traditional) when possible
        if prefer_simplified:
            return entry.get('simplified') or entry.get('traditional')
        return entry.get('traditional') or entry.get('simplified')

    try:
        definition_results = dict_client.definition_lookup(query)
    except KeyError:
        definition_results = []
    for idx, d in enumerate(definition_results):
        results.append({
            'hanzi': choose_hanzi(d),
            'pinyin': d['pinyin'],
            'english': d['definition'],
            'match_type': 'hanzi',
            'order': idx
        })
        has_direct = True

    exact_examples = []
    other_examples = []
    try:
        res = dict_client.get_examples(query)
    except KeyError:
        res = {}
    for fr in res:
        for idx, r in enumerate(res[fr]):
            entry = {
                'hanzi': choose_hanzi(r),
                'pinyin': r['pinyin'],
                'english': r['definition'],
                'match_type': 'hanzi',
                'order': idx
            }
            if r.get('simplified') == simplified_query or r.get('traditional') == traditional_query:
                exact_examples.append(entry)
                has_direct = True
            elif include_other_examples:
                other_examples.append(entry)

    combined = results + exact_examples + (other_examples if include_other_examples else [])
    return combined, has_direct

def add_unique_entries(results, new_entries, seen):
    for r in new_entries:
        key = (r.get('hanzi'), r.get('pinyin'), r.get('english'))
        if key in seen:
            continue
        seen.add(key)
        results.append(r)
    return results

def remove_tones(pinyin):
    return re.sub(r'[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]', lambda m: 'aeiouü'['āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'.index(m.group()) // 4], pinyin)


def remove_all_numbers(pinyin):
    return re.sub(r'\d', '', pinyin)


def normalize_query(text):
    text = text.lower()
    text = text.strip(string.punctuation)
    text = lemmatizer.lemmatize(text)
    return text


@app.route('/search', methods=['GET'])
def search():
    api_key = request.headers.get('X-API-Key')
    if api_key != auth_keys.get('ZHONGWEN_SEARCH_KEY', ''):
        return jsonify({"error": "Unauthorized"}), 401
    query = request.args.get('query', '')
    query = query.strip().lower()
    results = []
    logger.debug("Received search request")
    logger.debug(f"Query: {query}")
    only_hanzi = all(regex.match(r'\p{Han}', char) for char in query if char.strip())
    if only_hanzi:
        seen = set()
        results = []

        # Tokenize on whitespace to support semi-exact matches like "对不起 吧"
        tokens = [t for t in regex.split(r'\s+', query) if t]
        joined = ''.join(tokens)
        is_multi_token = len(tokens) > 1

        def append_lookup(term, include_examples=True):
            res, _ = gather_hanzi_results(term, dictionary, include_other_examples=include_examples)
            add_unique_entries(results, res, seen)

        # 1) Full query (joined tokens) if available
        if joined:
            full_results, full_has_direct = gather_hanzi_results(joined, dictionary, include_other_examples=True)
            add_unique_entries(results, full_results, seen)
        else:
            full_has_direct = False

        # 2) Per-token exact lookups (preserve token order)
        if is_multi_token:
            for tok in tokens:
                append_lookup(tok, include_examples=True)

        # 3) Per-character lookups in order (unique)
        ordered_chars = []
        source_chars = joined if joined else query
        for ch in source_chars:
            if not ch.strip():
                continue
            if ch not in ordered_chars:
                ordered_chars.append(ch)
        include_other = full_has_direct or is_multi_token
        for ch in ordered_chars:
            per_char, _ = gather_hanzi_results(ch, dictionary, include_other_examples=True)
            add_unique_entries(results, per_char, seen)

    else:
        res = dictionary.search_by_pinyin(query)
        hard_results = []
        for r in res:
            dd = dictionary.definition_lookup(r)
            for idx, d in enumerate(dd):
                order = idx
                piny_removed = remove_tones(d['pinyin'].lower())
                piny_removed_numbers = remove_all_numbers(d['pinyin'].lower())
                if d and query in piny_removed:
                    if 'surname' in d['definition']:
                        order = 1000
                    hard_results.append({'hanzi': r, 'pinyin': d['pinyin'], 'english': d['definition'], 'match_type': 'english', 'order': order})
                if d and query in piny_removed_numbers:
                    if 'surname' in d['definition']:
                        order = 1000
                    results.append({'hanzi': r, 'pinyin': d['pinyin'], 'english': d['definition'], 'match_type': 'english', 'order': order})
        if len(results) == 0:
            results = hard_results
        if len(results) == 0:
            query_norm = normalize_query(query)
            res = dictionary.search_by_english(query_norm)
            for r in res:
                dd = dictionary.definition_lookup(r)
                for idx, d in enumerate(dd): # here i take into account the order of the definitions
                    if d and query_norm in d['definition'].lower():
                        results.append({'hanzi': r, 'pinyin': d['pinyin'], 'english': d['definition'], 'match_type': 'english', 'order': idx})
            qwords = query_norm.split(" ") 
            if len(qwords) > 1:
                fresults = []
                for r in results:
                    definition = r['english'].lower()
                    if all(qw in definition for qw in qwords):
                        if r not in fresults:
                            fresults.append(r)
                def order_key(r):
                    definition = r['english']
                    indices = [definition.find(qw) for qw in qwords]
                    return [i if i != -1 else float('inf') for i in indices]  # Handle missing words
                results = sorted(fresults, key=order_key)

    results = [r for r in results if 'variant of' not in r.get('english', '').lower()]
    return jsonify(results)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8001, debug=True)
