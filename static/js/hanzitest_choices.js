const characterDisplay = document.getElementById('character-display');
const pinyinOptions = document.getElementById('pinyin-options');
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
const NUM_QUESTIONS = 10;
const NUM_OPTIONS = 16;

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
        generatePinyinOptions(character);
        progressDiv.textContent = `Question ${currentIndex + 1} of ${Math.min(NUM_QUESTIONS, shuffledCharacters.length)}`;
    } else {
        showResults();
    }
}

function generatePinyinOptions(character) {
    const correctPinyin = characters[character].pinyin;
    let options = [correctPinyin];

    // Generate incorrect options
    while (options.length < NUM_OPTIONS) {
        const randomChar = shuffledCharacters[Math.floor(Math.random() * shuffledCharacters.length)];
        const randomPinyin = characters[randomChar].pinyin;
        if (!options.includes(randomPinyin)) {
            options.push(randomPinyin);
        }
    }

    options.sort((a, b) => a.localeCompare(b));

    pinyinOptions.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('div');
        button.className = 'pinyin-option';
        button.textContent = option;
        button.addEventListener('click', () => checkAnswer(option));
        pinyinOptions.appendChild(button);
    });
}


function checkAnswer(selectedPinyin) {
    let character = shuffledCharacters[currentIndex];
    const correctPinyin = characters[character].pinyin;
    const isCorrect = selectedPinyin === correctPinyin;

    userAnswers.push({
        character: character,
        userAnswer: selectedPinyin,
        correctAnswer: correctPinyin,
        isCorrect: isCorrect
    });

    if (isCorrect) {
        correctAnswers++;
    }

    currentIndex++;
    showNextCharacter();
}

function showResults() {
    document.getElementById('test-container').style.display = 'none';
    resultsDiv.style.display = 'block';
    const totalQuestions = Math.min(NUM_QUESTIONS, shuffledCharacters.length);
    const score = (correctAnswers / totalQuestions) * 100;
    scoreSpan.textContent = `${correctAnswers} / ${totalQuestions}`;
    accuracySpan.textContent = `${score.toFixed(2)}%`;

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
}

restartBtn.addEventListener('click', startTest);

document.addEventListener('DOMContentLoaded', () => {
    deckNameElement.textContent = `Current Deck: ${inputdeck}`;
    startTest();
});

function changeDeck(deck) {
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
