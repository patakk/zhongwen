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


def ensure_neutral_tone(term):
    tokens = [t for t in term.split() if t]
    if not any(re.search(r'\d', t) for t in tokens):
        return term
    adjusted = []
    for t in tokens:
        if re.search(r'\d', t) or '*' in t:
            adjusted.append(t)
        else:
            adjusted.append(t + '5')
    return ' '.join(adjusted)


def ensure_pinyin_wildcards(term):
    if '*' in term or re.search(r'\d', term):
        return term
    parts = term.split()
    if len(parts) > 1:
        return ' '.join(p + '*' if p else p for p in parts)
    return term + '*' if term else term


def build_mixed_pinyin_query(tokens, dict_client):
    inferred = []
    for tok in tokens:
        has_hanzi = any(regex.match(r'\p{Han}', ch) for ch in tok if ch.strip())
        if has_hanzi:
            try:
                defs = dict_client.definition_lookup(tok)
            except KeyError:
                defs = []
            base = ''
            if defs:
                base = defs[0].get('pinyin', '') or ''
                base = re.sub(r'\s+', ' ', base).strip().lower()
            if not base:
                continue
            if not re.search(r'\d', base) and '*' not in base:
                base = base + '*'
            inferred.append(base)
        else:
            tok_prepared = ensure_neutral_tone(tok)
            inferred.append(ensure_pinyin_wildcards(tok_prepared))
    inferred = [part for part in inferred if part]
    return ' '.join(inferred)


def expand_pinyin_wildcards(term):
    if '*' not in term:
        return [term]
    replacements = ['1', '2', '3', '4', '5', '']
    expanded = ['']
    for ch in term:
        if ch == '*':
            expanded = [prefix + rep for prefix in expanded for rep in replacements]
        else:
            expanded = [prefix + ch for prefix in expanded]
    uniq = []
    seen = set()
    for t in expanded:
        if not t or t in seen:
            continue
        seen.add(t)
        uniq.append(t)
    return uniq


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

        def safe_gather(term, include_examples=True):
            try:
                return gather_hanzi_results(term, dictionary, include_other_examples=include_examples)
            except KeyError:
                return [], False

        def append_lookup(term, include_examples=True):
            res, _ = safe_gather(term, include_examples=include_examples)
            add_unique_entries(results, res, seen)

        # 1) Full query (joined tokens) if available
        if joined:
            full_results, full_has_direct = safe_gather(joined, include_examples=True)
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
            per_char, _ = safe_gather(ch, include_examples=True)
            add_unique_entries(results, per_char, seen)

    else:
        seen = set()
        seen_map = {}
        def append_unique(entries):
            for r in entries:
                key = (r.get('hanzi'), r.get('pinyin'), r.get('english'))
                if key in seen_map:
                    existing = seen_map[key]
                    if r.get('is_pinyin_exact') and not existing.get('is_pinyin_exact'):
                        existing['is_pinyin_exact'] = True
                        existing['matched_query'] = r.get('matched_query', existing.get('matched_query'))
                    continue
                seen.add(key)
                seen_map[key] = r
                results.append(r)

        def search_pinyin_term(term, mark_exact=False, source_query=None):
            res_local = []
            hard_results_local = []
            normalized_term = ensure_pinyin_wildcards(ensure_neutral_tone(term))
            candidate_terms = expand_pinyin_wildcards(normalized_term)
            for cand in candidate_terms:
                res = dictionary.search_by_pinyin(cand)
                for r in res:
                    dd = dictionary.definition_lookup(r)
                    for idx, d in enumerate(dd):
                        order = idx
                        piny_removed = remove_tones(d['pinyin'].lower())
                        piny_removed_numbers = remove_all_numbers(d['pinyin'].lower())
                        cand_lower = cand.lower()
                        cand_no_numbers = remove_all_numbers(cand_lower)
                        base_entry = {'hanzi': r, 'pinyin': d['pinyin'], 'english': d['definition'], 'match_type': 'pinyin', 'order': order, 'is_pinyin_exact': mark_exact, 'matched_query': source_query or term}
                        if d and cand_lower in piny_removed:
                            if 'surname' in d['definition']:
                                order = 1000
                                base_entry['order'] = order
                            hard_results_local.append(base_entry)
                        if d and (cand_lower in piny_removed_numbers or (cand_no_numbers and cand_no_numbers in piny_removed_numbers)):
                            if 'surname' in d['definition']:
                                order = 1000
                            res_entry = dict(base_entry)
                            res_entry['order'] = order
                            res_local.append(res_entry)
            if len(res_local) == 0:
                res_local = hard_results_local
            return res_local

        tokens = [t for t in query.split() if t]
        joined = ''.join(tokens)
        has_hanzi_token = any(any(regex.match(r'\p{Han}', ch) for ch in tok if ch.strip()) for tok in tokens)

        # Prefer full query first (with spaces preserved)
        append_unique(search_pinyin_term(query))
        if len(tokens) > 1:
            # Also try a joined form for multi-syllable exacts
            append_unique(search_pinyin_term(joined))
            for tok in tokens:
                append_unique(search_pinyin_term(tok))

        # Mixed hanzi + pinyin: infer combined pinyin and try exact lookup
        if has_hanzi_token:
            inferred = build_mixed_pinyin_query(tokens, dictionary)
            if inferred:
                append_unique(search_pinyin_term(inferred, mark_exact=True, source_query=inferred))
            # Also surface direct hanzi lookups for hanzi tokens
            for tok in tokens:
                if any(regex.match(r'\p{Han}', ch) for ch in tok if ch.strip()):
                    try:
                        hanzi_res, _ = gather_hanzi_results(tok, dictionary, include_other_examples=True)
                        append_unique(hanzi_res)
                    except KeyError:
                        pass

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
