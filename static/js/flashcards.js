let flashcardElement = document.getElementById('flashcard');
let revealed = false;
let currentWordInfo = {};
let currentStrokes = [];
let nextStrokes = [];

async function getPinyinEnglishFor(character) {
    
    try {
        const response = await fetch(`./get_simple_char_data?character=${encodeURIComponent(character)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        currentWordInfo = await response.json();
        redrawCurrentCard();
    } catch (error) {
        return null;
    }
}

function redrawCurrentCard() {
    let hanziContainer = flashcardElement.querySelector('.hanzi');
    let answerContainer = flashcardElement.querySelector('.answer');
    hanziContainer.textContent = currentWordInfo.character;

    let pinyinContainer = flashcardElement.querySelector('.pinyin');
    pinyinContainer.textContent = currentWordInfo.pinyin;
    let englishContainer = flashcardElement.querySelector('.english');
    englishContainer.textContent = currentWordInfo.english;
    answerContainer.classList.toggle('inactive', !revealed);
    handleFont();
}

function handleFont() {
    let hanziElement = flashcardElement.querySelector('.hanzi');
    if (hanziElement.style.fontFamily !== currentFont) {
        hanziElement.style.fontFamily = `"${currentFont}"`;
        hanziElement.style.fontSize = currentFont.includes('Kai') ? '5em' : '6em';
    }
}

function revealOrNew() {
    if (revealed) {
        getNewWord();
        revealed = false;
    } else {
        revealed = true;
    }
    redrawCurrentCard();
}


function getNewWord() {
    let chars = inputdecks[inputdeck].chars;
    let currentWord = chars[Math.floor(Math.random() * chars.length)];
    while(currentWord === currentWordInfo.character && chars.length > 1) {
        currentWord = chars[Math.floor(Math.random() * chars.length)];
    }
    currentWordInfo = { character: currentWord, pinyin: '/', english: '/' };
    getPinyinEnglishFor(currentWord);
    revealed = false;
    console.log(currentWordInfo)
    redrawCurrentCard();
}

document.addEventListener('DOMContentLoaded', function() {
    currentFont = 'Noto Sans';
    
    const newUrl = new URL(window.location);
    inputdeck = newUrl.searchParams.get('wordlist') || 'hsk1';
    document.querySelectorAll('.deck-change').forEach(opt => {
        if (opt.dataset.deck === inputdeck) {
            opt.classList.add('selected-option');
        }
    });

    confirmDarkmode();
    getNewWord();
    handleFont();
    handleTopLeftButtons();
});


function handleTopLeftButtons() {
    document.getElementById('deckMenu').addEventListener('click', function(event) {
        if(!event.target.closest('#deckSubmenu')){
            document.getElementById('deckSubmenu').classList.add('active')
        }
    });
    
    document.getElementById('fontMenu').addEventListener('click', function(event) {
        if(!event.target.closest('#fontSubmenu')){
            document.getElementById('fontSubmenu').classList.add('active')
        }
    });
    
    document.addEventListener('click', function(event) {
        if (!event.target.closest('#deckMenu')) {
            document.getElementById('deckSubmenu').classList.remove('active');
        }
        if (!event.target.closest('#fontMenu')) {
            document.getElementById('fontSubmenu').classList.remove('active');
        }
    });

    
    document.querySelectorAll('.deck-change').forEach(function(deckOption) {
        deckOption.addEventListener('click', function(e) {
            document.getElementById('fontSubmenu').classList.remove('active');
            document.getElementById('deckSubmenu').classList.remove('active');
            e.preventDefault();
            e.stopPropagation();
            inputdeck = this.dataset.deck;
            console.log("inputdeck change")
            console.log(inputdeck);
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('wordlist', inputdeck);
            history.pushState({}, '', newUrl);
            getNewWord();
            document.querySelectorAll('.deck-change').forEach(opt => opt.classList.remove('selected-option'));
            this.classList.add('selected-option');
        });
    });
   
    document.querySelectorAll('.font-change').forEach(function(fontOption) {
        fontOption.addEventListener('click', function(e) {
            document.getElementById('fontSubmenu').classList.remove('active');
            document.getElementById('deckSubmenu').classList.remove('active');
            e.preventDefault();
            e.stopPropagation();
            currentFont = this.dataset.font;
            document.querySelectorAll('.font-change').forEach(opt => opt.classList.remove('selected-option'));
            this.classList.add('selected-option');
            redrawCurrentCard();
        });
    });

    let flashcard_container = document.getElementById('flashcard_container');
    flashcard_container.addEventListener('click', function(event) {
        revealOrNew();
    });

    document.addEventListener('keydown', function(event) {
        revealOrNew();
    });
}

