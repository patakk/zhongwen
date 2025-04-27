import io
import re
import genanki

MODEL_ID = 1607444419  # keep fixed

def to_accented_pinyin(input_text):
    if not input_text:
        return input_text

    tone_map = {
        '1': 'āēīōūǖ',
        '2': 'áéíóúǘ',
        '3': 'ǎěǐǒǔǚ',
        '4': 'àèìòùǜ',
        '5': 'aeiouü'
    }

    vowels = ['a', 'e', 'i', 'o', 'u', 'ü']

    def apply_tone_mark(syllable, tone):
        if not tone:
            return syllable

        syllable_lower = syllable.lower()

        if 'a' in syllable_lower:
            index = syllable_lower.index('a')
            result = list(syllable)
            result[index] = tone_map[tone][0]
            return ''.join(result)

        if 'e' in syllable_lower:
            index = syllable_lower.index('e')
            result = list(syllable)
            result[index] = tone_map[tone][1]
            return ''.join(result)

        if 'ou' in syllable_lower:
            index = syllable_lower.index('o')
            result = list(syllable)
            result[index] = tone_map[tone][3]
            return ''.join(result)

        for i in range(len(syllable_lower) - 1, -1, -1):
            char = syllable_lower[i]
            if char in vowels:
                vowel_index = vowels.index(char)
                result = list(syllable)
                result[i] = tone_map[tone][vowel_index]
                return ''.join(result)

        return syllable

    def replace_bracketed(match):
        syllable, tone = match.group(1), match.group(2)
        return '[' + apply_tone_mark(syllable, tone) + ']'

    def replace_plain(match):
        syllable, tone = match.group(1), match.group(2)
        return apply_tone_mark(syllable, tone)

    result = re.sub(r'\[([a-zü]+)([1-5])?\]', replace_bracketed, input_text, flags=re.IGNORECASE)
    result = re.sub(r'\b([a-zü]+)([1-5])?\b', replace_plain, result, flags=re.IGNORECASE)

    return result

def create_anki_from_wordlist(wordlist, deck_id, deck_name):
    model = genanki.Model(
        MODEL_ID,
        'Simple Model',
        fields=[
            {'name': 'Word'},
            {'name': 'PinyinEnglish'},  # Renamed to reflect combined content
            {'name': 'Extra'},  # Keep a third field for potential future use
        ],
        templates=[
            {
                'name': 'Card 1',
                'qfmt': '''
<div class="character">{{Word}}</div>
''',
                'afmt': '''
<div class="character">{{Word}}</div>
<hr id="answer">
<div class="pinyin-english">{{PinyinEnglish}}</div>
''',
            },
        ],
        css='''
.character {
  font-size: 4rem;
  text-align: center;
  margin: 1rem 0;
  font-weight: bold;
}

.pinyin-english {
  text-align: center;
  margin: 0.5rem 0;
  font-size: 1.5rem;
}

#answer {
  margin: 1rem auto;
  width: 50%;
  border: 1px solid #ccc;
}
''',
    )

    deck = genanki.Deck(
        deck_id,
        deck_name,
    )

    for item in wordlist:
        # Convert fields to strings and handle potential lists for pinyin and english
        character = str(item['character'])
        
        # Create pairs of pinyin-english entries for better readability
        paired_content = []
        for i in range(len(item['pinyin'])):
            if i < len(item['english']):
                pinyin_accented = str(to_accented_pinyin(item['pinyin'][i]))
                english_text = str(to_accented_pinyin(item['english'][i]))
                paired_content.append(f"{pinyin_accented} - {english_text}")
        
        # Join the paired content with line breaks
        pinyin_english_pairs = '<br>'.join(paired_content)
        
        note = genanki.Note(
            model=model,
            fields=[character, pinyin_english_pairs, ''],  # Empty string for the English field as we're not using it separately
        )
        deck.add_note(note)

    output = io.BytesIO()
    package = genanki.Package(deck)
    package.write_to_file(output)
    output.seek(0)

    return output
