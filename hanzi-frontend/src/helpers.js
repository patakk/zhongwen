export function toAccentedPinyin(input) {
    const toneMap = {
        '1': 'āēīōūǖ',
        '2': 'áéíóúǘ',
        '3': 'ǎěǐǒǔǚ',
        '4': 'àèìòùǜ',
        '5': 'aeiouü'
    };
    
    function applyToneMark(syllable, tone) {
        if (!tone) return syllable;
        
        const vowels = ['a', 'e', 'i', 'o', 'u', 'ü'];
        let syllableLower = syllable.toLowerCase();
        
        if (syllableLower.includes('a')) {
            let index = syllableLower.indexOf('a');
            let result = syllable.split('');
            result[index] = toneMap[tone][0];
            return result.join('');
        }
        
        if (syllableLower.includes('e')) {
            let index = syllableLower.indexOf('e');
            let result = syllable.split('');
            result[index] = toneMap[tone][1];
            return result.join('');
        }
        
        if (syllableLower.includes('ou')) {
            let index = syllableLower.indexOf('o');
            let result = syllable.split('');
            result[index] = toneMap[tone][3];
            return result.join('');
        }
        
        for (let i = syllableLower.length - 1; i >= 0; i--) {
            let char = syllableLower[i];
            let vowelIndex = vowels.indexOf(char);
            if (vowelIndex !== -1) {
                let result = syllable.split('');
                result[i] = toneMap[tone][vowelIndex];
                return result.join('');
            }
        }
        
        return syllable;
    }

    let result = input.replace(/\[([a-z]+)([1-5])?\]/gi, (match, syllable, tone) => {
        return '[' + applyToneMark(syllable, tone) + ']';
    });
    
    result = result.replace(/\b([a-z]+)([1-5])?\b/gi, (match, syllable, tone) => {
        return applyToneMark(syllable, tone);
    });
    
    return result;
}
