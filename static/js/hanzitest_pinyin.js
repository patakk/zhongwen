const characterDisplay = document.getElementById('character-display');
const pinyinInput = document.getElementById('pinyin-input');
const submitBtn = document.getElementById('submit-btn');
const progressDiv = document.getElementById('progress');
const resultsDiv = document.getElementById('results');
const scoreSpan = document.getElementById('score');
const accuracySpan = document.getElementById('accuracy');
const restartBtn = document.getElementById('restart-btn');

let currentIndex = 0;
let correctAnswers = 0;
let shuffledCharacters = [];
let userAnswers = [];
const deckNameElement = document.getElementById('deck-name');
const answerTableBody = document.getElementById('answer-table-body');
const NUM_QUESTIONS = 10; // Change this to set the number of questions

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startTest() {
    shuffledCharacters = Object.keys(characters);
    shuffleArray(shuffledCharacters);
    currentIndex = 0;
    correctAnswers = 0;
    userAnswers = [];
    showNextCharacter();
    resultsDiv.style.display = 'none';
    document.getElementById('test-container').style.display = 'block';
    deckNameElement.textContent = `Current Deck: ${inputdecks[inputdeck].name}`;
}

function showNextCharacter() {
    if (currentIndex < Math.min(NUM_QUESTIONS, shuffledCharacters.length)) {
        let character = shuffledCharacters[currentIndex];
        characterDisplay.textContent = character;
        pinyinInput.value = '';
        pinyinInput.focus();
        progressDiv.textContent = `Question ${currentIndex + 1} of ${Math.min(NUM_QUESTIONS, shuffledCharacters.length)}`;
    } else {
        showResults();
    }
    confirmDarkmode();
}

function convertToNumberedPinyin(pinyin) {
    const toneMarks = {
        'ā': 'a1', 'á': 'a2', 'ǎ': 'a3', 'à': 'a4',
        'ē': 'e1', 'é': 'e2', 'ě': 'e3', 'è': 'e4',
        'ī': 'i1', 'í': 'i2', 'ǐ': 'i3', 'ì': 'i4',
        'ō': 'o1', 'ó': 'o2', 'ǒ': 'o3', 'ò': 'o4',
        'ū': 'u1', 'ú': 'u2', 'ǔ': 'u3', 'ù': 'u4',
        'ǖ': 'v1', 'ǘ': 'v2', 'ǚ': 'v3', 'ǜ': 'v4',
    };

    return pinyin.split(' ').map(word => {
        let tone = '';
        word = word.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, match => {
            tone = toneMarks[match][1];
            return toneMarks[match][0];
        });
        return word + tone;
    }).join(' ');
}


function simplifyPinyin(pinyin, removeAccents = true) {
    if (/[1-4]/.test(pinyin)) {
        // If it contains numbers, convert to accented pinyin
        return pinyin.toLowerCase().trim()
            .replace(/a([1-4])/g, match => 'āáǎà'[parseInt(match[1]) - 1])
            .replace(/e([1-4])/g, match => 'ēéěè'[parseInt(match[1]) - 1])
            .replace(/i([1-4])/g, match => 'īíǐì'[parseInt(match[1]) - 1])
            .replace(/o([1-4])/g, match => 'ōóǒò'[parseInt(match[1]) - 1])
            .replace(/u([1-4])/g, match => 'ūúǔù'[parseInt(match[1]) - 1])
            .replace(/v([1-4])/g, match => 'ǖǘǚǜ'[parseInt(match[1]) - 1])
            .replace(/\s+/g, '');
    } else if (removeAccents) {
        // If it doesn't contain numbers and we want to remove accents
        return pinyin
            .toLowerCase().trim()
            .replace(/[āáǎà]/g, 'a')
            .replace(/[ēéěè]/g, 'e')
            .replace(/[īíǐì]/g, 'i')
            .replace(/[ōóǒò]/g, 'o')
            .replace(/[ūúǔù]/g, 'u')
            .replace(/[ǖǘǚǜü]/g, 'v')
            .replace(/\s+/g, '');
    } else {
        // If it doesn't contain numbers and we want to keep accents
        return pinyin.toLowerCase().replace(/\s+/g, '');
    }
}

function checkAnswer() {
    const userInput = pinyinInput.value.trim();
    const hasNumbers = /[1-4]/.test(userInput);
    const userAnswer = simplifyPinyin(userInput);
    let character = shuffledCharacters[currentIndex];
    const correctPinyin = characters[character].pinyin;
    const simplifiedCorrectPinyin = simplifyPinyin(correctPinyin, !hasNumbers);

    const isCorrect = userAnswer === simplifiedCorrectPinyin;
    console.log('Correct:', simplifiedCorrectPinyin, 'User:', userAnswer, 'Result:', isCorrect);

    userAnswers.push({
        character: character,
        userAnswer: userInput,
        correctAnswer: correctPinyin,
        isCorrect: isCorrect
    });

    if (isCorrect) {
        correctAnswers++;
    }

    currentIndex++;
    showNextCharacter();
}


// Modify the showResults function
function showResults() {
    document.getElementById('test-container').style.display = 'none';
    resultsDiv.style.display = 'block';
    const totalQuestions = Math.min(NUM_QUESTIONS, shuffledCharacters.length);
    const score = (correctAnswers / totalQuestions) * 100;
    scoreSpan.textContent = `${correctAnswers} / ${totalQuestions}`;
    accuracySpan.textContent = `${score.toFixed(2)}%`;

    // Generate the answer table
    answerTableBody.innerHTML = '';
    userAnswers.forEach(answer => {
        const row = document.createElement('tr');
        row.className = answer.isCorrect ? 'correct-row' : 'incorrect-row';
        row.innerHTML = `
            <td>${answer.character}</td>
            <td>${answer.userAnswer}</td>
            <td>${answer.correctAnswer}</td>
        `;
        answerTableBody.appendChild(row);
    });
    confirmDarkmode();
}
submitBtn.addEventListener('click', checkAnswer);

function scrollToTop() {
    setTimeout(() => {
        window.scrollTo(0, 1);
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 0);
    }, 100);
}

pinyinInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && pinyinInput.value.trim() !== '') {
        checkAnswer();
    }
    scrollToTop();
});

restartBtn.addEventListener('click', startTest);

document.addEventListener('DOMContentLoaded', () => {
    deckNameElement.textContent = `Current Deck: ${inputdecks[inputdeck].name}`;
    let inputfield = document.getElementById('pinyin-input');
    inputfield.focus();
    startTest();
});


function changeDeck(deck, func=null) {
    fetch(`./change_deck?deck=${deck}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        console.log('Deck changed successfully');
        window.location.reload();
    })
    .catch(error => {
        console.error('There was a problem changing the deck:', error);
    });
}