const characterDisplay = document.getElementById('character-display');
const pinyinOptions = document.getElementById('pinyin-options');
const progressDiv = document.getElementById('progress');
const resultsDiv = document.getElementById('results');
const scoreSpan = document.getElementById('score');
const accuracySpan = document.getElementById('accuracy');
const restartBtn = document.getElementById('restart-btn');
const skipBtn = document.getElementById('skip-btn');

let currentIndex = 0;
let correctAnswers = 0;
let shuffledCharacters = [];
let userAnswers = [];
const answerTableBody = document.getElementById('answer-table-body');
const NUM_QUESTIONS = 16;
const NUM_OPTIONS = 16;




const deckNameElement = document.getElementById('deck-name');
const selectedDeckElement = document.getElementById('selected-deck');
const dropdownToggle = document.getElementById('dropdown-toggle');
const deckOptionsElement = document.getElementById('deck-options');

function populateDropdown() {
    selectDeck(inputdeck);
    Object.keys(inputdecks).forEach(deckName => {
      const option = document.createElement('div');
      option.className = 'option';
      option.textContent = decksinfos[deckName].name;
      option.onclick = () => selectDeck(deckName);
      deckOptionsElement.appendChild(option);
    });
}
  
  function selectDeck(deckName) {
    inputdeck = deckName;
    selectedDeckElement.textContent = decksinfos[deckName].name;
    deckOptionsElement.style.display = 'none';
    startTest();
  }
  
  deckNameElement.onclick = () => {
    deckOptionsElement.style.display = deckOptionsElement.style.display === 'none' ? 'block' : 'none';
  };
  
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.custom-dropdown')) {
      deckOptionsElement.style.display = 'none';
    }
  });



function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

let skippedQuestions = [];

function startTest() {
    characters = inputdecks[inputdeck];
    shuffledCharacters = Object.keys(characters);
    shuffleArray(shuffledCharacters);
    currentIndex = 0;
    correctAnswers = 0;
    userAnswers = new Array(Math.min(NUM_QUESTIONS, shuffledCharacters.length)).fill(null);
    skippedQuestions = [];
    showNextCharacter();
    resultsDiv.style.display = 'none';
    document.getElementById('test-container').style.display = 'block';
    skipBtn.style.display = 'block';
}

function showNextCharacter() {
    if (currentIndex < Math.min(NUM_QUESTIONS, shuffledCharacters.length)) {
        if (userAnswers[currentIndex] === null) {
            let character = shuffledCharacters[currentIndex];
            characterDisplay.textContent = characters[character].english.replace(/;/g, ',');
            generatePinyinOptions(character);
            progressDiv.textContent = `Question ${currentIndex + 1} of ${Math.min(NUM_QUESTIONS, shuffledCharacters.length)}`;
        } else {
            currentIndex++;
            showNextCharacter();
        }
    } else if (skippedQuestions.length > 0) {
        showSkippedQuestions();
    } else {
        showResults();
    }
    confirmDarkmode();
}

function checkAnswer(selectedPinyin) {
    let character = shuffledCharacters[currentIndex];
    const correctPinyin = character;
    const isCorrect = selectedPinyin === correctPinyin;

    userAnswers[currentIndex] = {
        character: character,
        userAnswer: selectedPinyin,
        correctAnswer: correctPinyin,
        isCorrect: isCorrect,
        english: characters[character].english.replace(/;/g, ',')
    };

    if (isCorrect) {
        correctAnswers++;
    }

    if(skippedQuestions.includes(currentIndex)) {
        skippedQuestions = skippedQuestions.filter(question => question !== currentIndex);
    }

    currentIndex++;
    showNextCharacter();
}

function skipQuestion() {
    if (!skippedQuestions.includes(currentIndex)) {
        skippedQuestions.push(currentIndex);
    }
    currentIndex++;
    showNextCharacter();
}

function showSkippedQuestions() {
    console.log('Skipped Questions:', skippedQuestions);
    currentIndex = skippedQuestions[0];
    let character = shuffledCharacters[currentIndex];
    characterDisplay.textContent = characters[character].english.replace(/;/g, ',');
    generatePinyinOptions(character);
    progressDiv.textContent = `Question ${currentIndex + 1} of ${Math.min(NUM_QUESTIONS, shuffledCharacters.length)}`;

    // progressDiv.textContent = `Skipped Question: ${skippedQuestions.length} remaining`;
}

restartBtn.addEventListener('click', startTest);
skipBtn.addEventListener('click', skipQuestion);

function generatePinyinOptions(character) {
    const correctPinyin = character;
    let options = [correctPinyin];

    // Generate incorrect options
    while (options.length < NUM_OPTIONS) {
        const randomChar = shuffledCharacters[Math.floor(Math.random() * shuffledCharacters.length)];
        const randomPinyin = randomChar;
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


function showResults() {
    document.getElementById('test-container').style.display = 'none';
    skipBtn.style.display = 'none';
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
            <td>${answer.english}</td>
            <td>${answer.userAnswer}</td>
            <td>${answer.correctAnswer}</td>
        `;
        answerTableBody.appendChild(row);
    });
    confirmDarkmode();
}


document.addEventListener('DOMContentLoaded', () => {
    // deckNameElement.textContent = `Current Deck: ${inputdeck}`;

    populateDropdown();
});

function changeDeck(deck) {
    fetch(`./api/change_deck?deck=${deck}`, {
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
