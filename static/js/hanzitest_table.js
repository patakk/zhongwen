const characterDisplay = document.getElementById('character-display');
const textInput = document.getElementById('text-input');
// const submitBtn = document.getElementById('submit-btn');
const progressDiv = document.getElementById('progress');
const resultsDiv = document.getElementById('results');
const scoreSpan = document.getElementById('score');
const accuracySpan = document.getElementById('accuracy');
const restartBtn = document.getElementById('restart-btn');
const revealBtn = document.getElementById('reveal-btn');

let currentIndex = 0;
let correctAnswers = 0;
let shuffledCharacters = [];
let userAnswers = [];
const answerTableBody = document.getElementById('answer-table-body');
const NUM_QUESTIONS = 3*2*4; // Change this to set the number of questions


const deckNameElement = document.getElementById('deck-name');
const selectedDeckElement = document.getElementById('selected-deck');
const dropdownToggle = document.getElementById('dropdown-toggle');
const deckOptionsElement = document.getElementById('deck-options');

  
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



function setupCharacters() {
    shuffledCharacters = Object.keys(inputdecks[inputdeck]);
    shuffleArray(shuffledCharacters);
    shuffledCharacters = shuffledCharacters.slice(0, NUM_QUESTIONS);

    characters = shuffledCharacters.reduce((obj, key) => {
        obj[key] = inputdecks[inputdeck][key];
        return obj;
    }, {});


    currentIndex = 0;
    correctAnswers = 0;
    userAnswers = [];
    // showNextCharacter();
    resultsDiv.style.display = 'none';
    document.getElementById('test-container').style.display = 'block';
    // deckNameElement.textContent = `Current Deck: ${decksinfos[inputdeck].name}`;
    confirmDarkmode();
}

function showNextCharacter() {
    // if (currentIndex < Math.min(NUM_QUESTIONS, shuffledCharacters.length)) {
    //     let character = shuffledCharacters[currentIndex];
    //     characterDisplay.textContent = character;
    //     textInput.value = '';
    //     textInput.focus();
    //     progressDiv.textContent = `Question ${currentIndex + 1} of ${Math.min(NUM_QUESTIONS, shuffledCharacters.length)}`;
    // } else {
    //     showResults();
    // }
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
            .replace(/['\s]+/g, ''); // Remove spaces and apostrophes
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
            .replace(/['\s]+/g, ''); // Remove spaces and apostrophes
    } else {
        // If it doesn't contain numbers and we want to keep accents
        return pinyin.toLowerCase().replace(/['\s]+/g, '');
    }
}

function checkAnswer() {
    const userInput = textInput.value.trim();
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
// submitBtn.addEventListener('click', checkAnswer);

function scrollToTop() {
    setTimeout(() => {
        window.scrollTo(0, 1);
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 0);
    }, 100);
}

textInput.addEventListener('input', (e) => {
    // if (e.key === 'Enter' && textInput.value.trim() !== '') {
    //     checkAnswer();
    // }
    // scrollToTop();

    // find first input with incorrect answer
});

restartBtn.addEventListener('click', init);
revealBtn.addEventListener('click', revealAnswers);

let allinputs = [];
let inputsbyhanzi = {};
let allhanzi = [];

function populateGrid() {
    allinputs = [];
    inputsbyhanzi = {};
    allhanzi = [];
    const grid = document.getElementById("puzzle-grid");
    grid.innerHTML = "";
    
    // let characters = shuffledCharacters.reduce((obj, key) => {
    //     obj[key] = inputdecks[inputdeck][key];
    //     return obj;
    // }, {});

    allhanzi = Object.keys(characters);

    Object.keys(characters).forEach(hanzi => {
        const gridItem = document.createElement("div");
        gridItem.classList.add("grid-item");
        
        const hanziDiv = document.createElement("div");
        hanziDiv.classList.add("hanzi");
        hanziDiv.textContent = hanzi;

        // tapping on hanzidiv creates a popup with .english, clicking anywhere else destroys it
        hanziDiv.addEventListener('click', function(e) {
            const popup = document.createElement('div');
            popup.className = 'pinyin-popup';
            popup.textContent = characters[hanzi].english;
            
            document.body.appendChild(popup);
        
            popup.style.left = `${e.clientX}px`;
            popup.style.top = `${e.clientY}px`;
        
            popup.addEventListener('click', function() {
                popup.remove();
            });

            setInterval(() => {
                document.addEventListener('click', function(e) {
                    if (e.target !== popup) {
                        popup.remove();
                    }
                });
            }, 100);
        });
        


        const input = document.createElement("input");
        input.classList.add("pinyin-input");
        input.type = "text";
        input.dataset.hanzi = hanzi; // Store Hanzi as a data attribute
        input.dataset.correct = false;

        allinputs.push(input);
        inputsbyhanzi[hanzi] = input;

        if(isDarkMode){
            gridItem.classList.add("darkmode");
            hanziDiv.classList.add("darkmode");
            input.classList.add("darkmode");
        }

        
        // add calback for typing into input
        input.addEventListener('input', function(e) {
            // check if tab
            if(e.key === "Tab"){
                e.target.classList.remove('pinyin-correct');
                e.target.dataset.correct = false;
                e.target.blur();

                let flag = false;
                let firstIncorrectInput = null;
                for(let i = 0; i < allhanzi.length; i++){
                    if(allhanzi[i] == hanzi){
                        flag = true;
                    }
                    if(flag){
                        if(inputsbyhanzi[allhanzi[i]].dataset.correct === 'false' && allhanzi[i] != hanzi){
                            // inputsbyhanzi[allhanzi[i]].classList.add("editing");
                            // curentHanzi = allhanzi[i];
                            // characterDisplay.textContent = allhanzi[i];
                            // textInput.value = "";
                            // textInput.focus();
                            firstIncorrectInput = inputsbyhanzi[allhanzi[i]];
                            break;
                        }
                    }
                }
                if(firstIncorrectInput == null){
                        //first incorrect input
                        for(let i = 0; i < allhanzi.length; i++){
                            if(inputsbyhanzi[allhanzi[i]].dataset.correct === 'false' && allhanzi[i] != hanzi){
                                firstIncorrectInput = inputsbyhanzi[allhanzi[i]];
                                break;
                            }
                        }
                }
                else{
                    characterDisplay.textContent = firstIncorrectInput.dataset.hanzi;
                    inputsbyhanzi[curentHanzi].classList.remove("editing");
                    curentHanzi = firstIncorrectInput.dataset.hanzi;
                }
                //first next incorrect input
                
                
                inputsbyhanzi[curentHanzi].classList.add("editing");
                
                textInput.value = "";
                textInput.focus();
                return;
            }
            const userInput = e.target.value.trim();
            if (userInput === "") {
                return;
            }
            e.target.dataset.userInput = userInput;
            const hanzi = e.target.dataset.hanzi;
            const pinyin = characters[hanzi].pinyin;
            const hasNumbers = /[1-4]/.test(userInput);
            const userAnswer = simplifyPinyin(userInput);
            const simplifiedCorrectPinyin = simplifyPinyin(pinyin, !hasNumbers);
            const isCorrect = userAnswer === simplifiedCorrectPinyin;
            // console.log('Correct:', simplifiedCorrectPinyin, 'User:', userAnswer, 'Result:', isCorrect);
            if (isCorrect) {
                
                let x = e.target.getBoundingClientRect().left + e.target.getBoundingClientRect().width/2;
                let y = e.target.getBoundingClientRect().top + e.target.getBoundingClientRect().height/2;
                fastConfetti(x, y, pinyin);
                e.target.classList.add('pinyin-correct');
                e.target.dataset.correct = true;
                // defocus
                e.target.blur();
                e.target.disabled = true;
                
                let flag = false;
                let firstIncorrectInput = null;
                for(let i = 0; i < allhanzi.length; i++){
                    if(allhanzi[i] == hanzi){
                        flag = true;
                    }
                    if(flag){
                        if(inputsbyhanzi[allhanzi[i]].dataset.correct === 'false' && allhanzi[i] != hanzi){
                            // inputsbyhanzi[allhanzi[i]].classList.add("editing");
                            // curentHanzi = allhanzi[i];
                            // characterDisplay.textContent = allhanzi[i];
                            // textInput.value = "";
                            // textInput.focus();
                            firstIncorrectInput = inputsbyhanzi[allhanzi[i]];
                            break;
                        }
                    }
                }
                if(firstIncorrectInput == null){
                    //first incorrect input
                    for(let i = 0; i < allhanzi.length; i++){
                        if(inputsbyhanzi[allhanzi[i]].dataset.correct === 'false' && allhanzi[i] != hanzi){
                            firstIncorrectInput = inputsbyhanzi[allhanzi[i]];
                            break;
                        }
                    }
                    // check if all are correct
                    if(firstIncorrectInput == null){
                        characterDisplay.textContent = "DONE!";
                        textInput.value = "";
                        finished = true;
                        inputsbyhanzi[curentHanzi].classList.remove("editing");
                        restartBtn.classList.remove("hidden");
                        startConfetti();
                    }
                    else{
                        characterDisplay.textContent = firstIncorrectInput.dataset.hanzi;
                        inputsbyhanzi[curentHanzi].classList.remove("editing");
                        curentHanzi = firstIncorrectInput.dataset.hanzi;
                        //first next incorrect input
                        
                        inputsbyhanzi[curentHanzi].classList.add("editing");
                        
                        textInput.value = "";
                        inputsbyhanzi[curentHanzi].focus();
                    }
                }
                else{
                    characterDisplay.textContent = firstIncorrectInput.dataset.hanzi;
                    inputsbyhanzi[curentHanzi].classList.remove("editing");
                    curentHanzi = firstIncorrectInput.dataset.hanzi;
                    //first next incorrect input
                    
                    inputsbyhanzi[curentHanzi].classList.add("editing");
                    
                    textInput.value = "";
                    inputsbyhanzi[curentHanzi].focus();
                }
            }
            else{
                e.target.classList.remove('pinyin-correct');
                e.target.dataset.correct = false;
            }
        }); 

        input.addEventListener('focus', function(e) {
            inputsbyhanzi[curentHanzi].classList.remove("editing");
            input.classList.add("editing");
            curentHanzi = e.target.dataset.hanzi;

            characterDisplay.textContent = e.target.dataset.hanzi;
        });

        // callback for losing focus
        input.addEventListener('blur', function(e) {
            e.target.classList.remove('editing');
            

            const userInput = e.target.dataset.userInput;
            if(userInput == null){
                return;
            }
            if(userInput === ""){
                return;
            }
            const hanzi = e.target.dataset.hanzi;
            const pinyin = characters[hanzi].pinyin;
            const hasNumbers = /[1-4]/.test(userInput);
            const userAnswer = simplifyPinyin(userInput);
            const simplifiedCorrectPinyin = simplifyPinyin(pinyin, !hasNumbers);
            const isCorrect = userAnswer === simplifiedCorrectPinyin;
            if(isCorrect) {
            }
            else{
                e.target.value = "";
                e.target.dataset.userInput = "";
                e.target.classList.remove('pinyin-correct');
                e.target.dataset.correct = false;
            }
        });

        
        gridItem.appendChild(hanziDiv);
        gridItem.appendChild(input);
        grid.appendChild(gridItem);
    });

    textInput.addEventListener('input', function(e) {
        let tableinput = inputsbyhanzi[curentHanzi];
        tableinput.value = e.target.value;
        tableinput.dispatchEvent(new Event('input')); 

    });

    textInput.addEventListener('blur', function(e) {
        
        let tableinput = inputsbyhanzi[curentHanzi];
        if(!finished)
            tableinput.value = "";
        tableinput.classList.remove("editing");
        textInput.value = "";
    });

    textInput.addEventListener('focus', function(e) {

        let tableinput = inputsbyhanzi[curentHanzi];
        tableinput.classList.add("editing");
    });
}

function revealAnswers(){
    console.log(characters)
    allinputs.forEach(input => {
        if(input.dataset.correct === 'false'){
            input.value = characters[input.dataset.hanzi].pinyin;
            input.classList.add('pinyin-revealed');
            input.disabled = true;
        }
        restartBtn.classList.remove("hidden");
        // input.dispatchEvent(new Event('input'));
    });
}

let curentHanzi = null;
let finished = false;

function selectDeck(deckName) {
    inputdeck = deckName;
    selectedDeckElement.textContent = decksinfos[deckName].name;
    deckOptionsElement.style.display = 'none';
    restartBtn.classList.add("hidden");

}

function init(){
    let inputfield = document.getElementById('text-input');
    inputfield.focus();
    
    selectDeck(inputdeck);
    setupCharacters();

    deckOptionsElement.innerHTML = '';
    Object.keys(inputdecks).forEach(deckName => {
      const option = document.createElement('div');
      option.className = 'option';
      option.textContent = decksinfos[deckName].name;
      option.onclick = () => {inputdeck = deckName; init();};
      deckOptionsElement.appendChild(option);
    });

    populateGrid();
            
    let firstIncorrectInput = allinputs.find(input => input.dataset.correct === 'false');
    characterDisplay.textContent = firstIncorrectInput.dataset.hanzi;
    curentHanzi = firstIncorrectInput.dataset.hanzi;

    inputsbyhanzi[curentHanzi].classList.add("editing");

    setTimeout(() => textInput.focus(), 333);
}

document.addEventListener('DOMContentLoaded', () => {
    init();
});


function changeDeck(deck, func=null) {
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


function startConfetti(congrats=null) {
    const container = document.getElementById('confetti-container');
    const emojis = ['🎉', '🎊', '🥳', '🎈', '🎊', '🍰', '🎂', '🥂'];
    let confettiCount = 60;
    if(window.innerWidth < window.innerHeight){
        confettiCount = 30;
    }

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const emoji = document.createElement('div');
            emoji.className = 'confetti';
            emoji.style.left = Math.random() * 100 + 'vw';
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