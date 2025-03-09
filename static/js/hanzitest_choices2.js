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
let characters = {};
const answerTableBody = document.getElementById('answer-table-body');
const NUM_QUESTIONS = 10;
const NUM_OPTIONS = 16;

const deckNameElement = document.getElementById('deck-name');
const selectedDeckElement = document.getElementById('selected-deck');
const dropdownToggle = document.getElementById('dropdown-toggle');
const deckOptionsElement = document.getElementById('deck-options');

async function loadNewWords(func=null){
    fetch(`../api/get_random_characters`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({deck: inputdeck, num: 100}),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log(data)
        currentcharacters = data;
        if(func != null){
            func();
        }
    })
    .catch(error => {
        console.error('There was a problem getting new words:', error);
    });
}

function populateDropdown() {
    const hskKeys = [];
    const nonHskKeys = [];
    const customKeys = [];

    Object.keys(decknames).forEach(deck => {
        if (deck.includes("hsk")) {
            hskKeys.push(deck);
        } else if (deck.includes("custom")) {
            customKeys.push(deck);
        } else {
            nonHskKeys.push(deck);
        }
    });
    const sortedKeys = [...customKeys, ...nonHskKeys, ...hskKeys];
    selectDeck(hskKeys[0]);
    sortedKeys.forEach(deck => {
        const option = document.createElement('div');
        option.className = 'option';
        option.textContent = decknames[deck];
        option.onclick = () => selectDeck(deck);
        deckOptionsElement.appendChild(option);
    });
}
  
  function selectDeck(deck) {
    inputdeck = deck;
    selectedDeckElement.textContent = decknames[deck];
    deckOptionsElement.style.display = 'none';
    
    loadNewWords(startTest);
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

async function getCharactersInfos(characters=null, func=null) {
    const url = './api/get_characters_simple_info';
    const charactersArray = characters instanceof Set ? Array.from(characters) : characters;
    const payload = { characters: charactersArray };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    };

    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            characters = data;
            if(func){
                func();
            }
        })
        .catch(error => console.error('Error:', error));
}

function startTest() {
    shuffledCharacters = Object.keys(currentcharacters);
    shuffleArray(shuffledCharacters);
    currentIndex = 0;
    correctAnswers = 0;
    userAnswers = new Array(shuffledCharacters).fill(null);
    skippedQuestions = [];
    showNextCharacter();
    resultsDiv.style.display = 'none';
    document.getElementById('test-container').style.display = 'block';
    skipBtn.style.display = 'block';
}

function showNextCharacter() {
    if (currentIndex < Math.min(NUM_QUESTIONS, shuffledCharacters.length)) {
        if (userAnswers[currentIndex] === undefined || currentIndex == 0) {
            let character = shuffledCharacters[currentIndex];
            characterDisplay.textContent = character;
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



function fastConfetti(x, y, hanzi) {
    const container = document.getElementById('confetti-container');
    const emojis = [hanzi];
    let confettiCount = 10;
    if(window.innerWidth < window.innerHeight){
        confettiCount = 7;
    }

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const emoji = document.createElement('div');
            if(i%2 == 0){
                emoji.className = 'confetti-rev';
            }
            else{
                emoji.className = 'confetti';
            }
            emoji.style.left = x + 30*(-1 + 2*Math.random()) + 'px';
            emoji.style.top = y + 40 + 2*(-1 + 2*Math.random()) + 'px';
            const duration = (Math.random() * 3 + 2);
            emoji.style.animationDuration = duration + 's';
            if(window.innerWidth < window.innerHeight){
                emoji.style.fontSize = (Math.random() * 20 + 10) + 'px';
            }
            else{
                emoji.style.fontSize = (Math.random() * 20 + 16) + 'px';
            }
            emoji.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
            
            container.appendChild(emoji);

            // Remove the emoji after it has completed its animation
            setTimeout(() => {
                emoji.remove();
            }, duration * 1000);
        }, i * 22);
    }
}

function checkAnswer(selectedPinyin) {
    let character = shuffledCharacters[currentIndex];
    const correctPinyin = currentcharacters[character].pinyin;
    const isCorrect = selectedPinyin === correctPinyin;

    userAnswers[currentIndex] = {
        character: character,
        userAnswer: selectedPinyin,
        correctAnswer: correctPinyin,
        isCorrect: isCorrect,
        english: currentcharacters[character].english.replace(/;/g, ',')
    };

    if (isCorrect) {
        correctAnswers++;
        fastConfetti(lastmousex, lastmousey + window.scrollY-40, '✅');
    }
    else{
        fastConfetti(lastmousex, lastmousey + window.scrollY-40, '❌');
    }


    if(skippedQuestions.includes(currentIndex)) {
        skippedQuestions = skippedQuestions.filter(question => question !== currentIndex);
    }

    console.log(currentIndex)
    console.log(userAnswers)

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
    characterDisplay.textContent = character;
    generatePinyinOptions(character);
    progressDiv.textContent = `Question ${currentIndex + 1} of ${Math.min(NUM_QUESTIONS, shuffledCharacters.length)}`;
}

restartBtn.addEventListener('click', startTest);
skipBtn.addEventListener('click', skipQuestion);


let lastmousex;
let lastmousey;

function generatePinyinOptions(character) {
    const correctPinyin = shuffledCharacters[currentIndex];
    let options = [currentcharacters[correctPinyin].pinyin];
    while (options.length < Math.min(NUM_OPTIONS, shuffledCharacters.length)) {
        const randomChar = shuffledCharacters[Math.floor(Math.random() * shuffledCharacters.length)];
        const randomPinyin = currentcharacters[randomChar].pinyin;
        if (!options.includes(randomPinyin)) {
            options.push(randomPinyin);
        }
    }

    // options.sort((a, b) => a.localeCompare(b));
    shuffleArray(options);

    pinyinOptions.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('div');
        button.className = 'pinyin-option';
        button.textContent = option;
        button.addEventListener('click', (event) => {
            lastmousex = event.clientX;
            lastmousey = event.clientY;
            checkAnswer(option);
        });
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

function restart(){

    characters = getCharactersInfos(shuffledCharacters, startTest);
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
