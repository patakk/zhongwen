const englishDisplay = document.getElementById('english-display');
const drawingArea = document.getElementById('drawing-area');
const clearBtn = document.getElementById('clear-btn');
const progressDiv = document.getElementById('progress');
const resultsDiv = document.getElementById('results');
const scoreSpan = document.getElementById('score');
const accuracySpan = document.getElementById('accuracy');
const strokeAccuracySpan = document.getElementById('stroke_accuracy');
const restartBtn = document.getElementById('restart-btn');
const skipBtn = document.getElementById('skip-btn');
const resetBtn = document.getElementById('end-btn');
const pinyinLabel = document.getElementById('pinyin-display');

let currentIndex = 0;
let correctAnswers = 0;
let shuffledWords = [];
let userAnswers = [];
let wordTotalMistakeCount = 0;
let wordTotalStrokeCount = 0;
let totalStrokeCount = 0;
let totalMistakeCount = 0;
let numFinished = 0;
let totalAnswered = 0;
const deckNameElement = document.getElementById('deck-name');
const answerTableBody = document.getElementById('answer-table-body');
let NUM_QUESTIONS = 10;
let currentWriters = [];
let hasCustom = false;


const selectedDeckElement = document.getElementById('selected-deck');
const dropdownToggle = document.getElementById('dropdown-toggle');
const deckOptionsElement = document.getElementById('deck-options');


function populateDropdown(deckj=false) {
    const hskKeys = [];
    const nonHskKeys = [];
    const customKeys = [];
    deckOptionsElement.innerHTML = '';

    Object.keys(decknames).forEach(deck => {
        if (deck.includes("hsk")) {
            hskKeys.push(deck);
        } else if (deck.includes("custom")) {
            customKeys.push(deck);
        } else {
            nonHskKeys.push(deck);
        }
    });
    let sortedKeys;
    if(hasCustom){
        sortedKeys = [...customKeys, ...nonHskKeys, ...hskKeys];
        console.log('has custom');
    }
    else{
        console.log('aaaaaa custom');
        sortedKeys = [...nonHskKeys, ...hskKeys];
    }
    if(deckj){
        selectDeck('custom');
    }
    else{
        selectDeck(hskKeys[0]);
    }
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
  
//   function selectDeck(deckName) {
//     inputdeck = deckName;
//     selectedDeckElement.textContent = decknames[deckName];
//     deckOptionsElement.style.display = 'none';
//     loadNewDeck(deckName, startTest);
//   }

function resetWord(){
    drawingArea.removeEventListener('click', handleAreaClick);
    
    if(pinyinLabel.classList.contains('active')){
        pinyinLabel.classList.remove('active');
    }
    window.scrollTo(0, 0);
    if (currentIndex < shuffledWords.length) {
        // progressDiv.textContent = `Question ${currentIndex + 1} of ${Math.min(NUM_QUESTIONS, shuffledWords.length)}`;
    } else {
        currentIndex = 0;
    }
    let characterData = currentcharacters[shuffledWords[currentIndex]];
    englishDisplay.textContent = characterData.english;
    wordTotalMistakeCount = 0;
    wordTotalStrokeCount = 0;
    
    currentWord = shuffledWords[currentIndex];
    currentEnglish = characterData.english;
    currentPinyin = characterData.pinyin;
    createHanziWriters(shuffledWords[currentIndex]);
    pinyinLabel.textContent = characterData.pinyin;
    confirmDarkmode();
    
    window.scrollTo(0, 1);
}

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
        currentcharacters = data;
        if(func != null){
            func();
        }
    })
    .catch(error => {
        console.error('There was a problem getting new words:', error);
    });
}  

async function checkCustom(func=null){
    fetch(`../api/check_if_custom_is_empty`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        hasCustom = !data.empty;
        populateDropdown(hasCustom);
        if(func != null){
            func();
        }
    })
    .catch(error => {
        console.error('There was a problem getting new words:', error);
    });
}  


function loadNewDeck(deckName, callback) {
    fetch(`/api/load_deck_chars?deck=${deckName}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        characters = data;
        NUM_QUESTIONS = Math.max(5, characters.length);
        callback();
    })
    .catch(error => {
        console.error('There was a problem loading the deck:', error);
    });
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

function startTest() {
    
    
    shuffledWords = Object.keys(currentcharacters);
    shuffleArray(shuffledWords);

    // shuffledWords = shuffledWords.filter(word => word.length <= 2);

    currentIndex = 0;
    correctAnswers = 0;
    wordTotalMistakeCount = 0;
    totalAnswered = 0;
    wordTotalStrokeCount = 0;
    totalStrokeCount = 0;
    totalMistakeCount = 0;
    skipState = 0;
    streakCount = 0;
    numFinished = 0;
    userAnswers = [];
    window.scrollTo(0, 0);
    window.scrollTo(0, 1);
    showWord();
    resultsDiv.style.display = 'none';
    document.getElementById('test-container').style.display = 'block';
}

function showWord() {
    drawingArea.removeEventListener('click', handleAreaClick);
    
    if(pinyinLabel.classList.contains('active')){
        pinyinLabel.classList.remove('active');
    }
    window.scrollTo(0, 0);
    if (currentIndex < shuffledWords.length) {
        // progressDiv.textContent = `Question ${currentIndex + 1} of ${Math.min(NUM_QUESTIONS, shuffledWords.length)}`;
    } else {
        currentIndex = 0;
    }
    let characterData = currentcharacters[shuffledWords[currentIndex]];
    englishDisplay.textContent = characterData.english;
    wordTotalMistakeCount = 0;
    wordTotalStrokeCount = 0;
    
    currentWord = shuffledWords[currentIndex];
    currentEnglish = characterData.english;
    currentPinyin = characterData.pinyin;
    createHanziWriters(shuffledWords[currentIndex]);
    pinyinLabel.textContent = characterData.pinyin;
    confirmDarkmode();
    
    window.scrollTo(0, 1);
}

restartBtn.addEventListener('click', () => {
    startTest();
});


let skipState = 0;

pinyinLabel.addEventListener('click', () => {
    if(pinyinLabel.classList.contains('active')){
        pinyinLabel.classList.remove('active');
    }
    else{
        pinyinLabel.classList.add('active');
    }
});

resetBtn.addEventListener('click', () => {
    skipState = 0;  
    numFinished = 0;
    showWord();
    skipBtn.textContent = 'Reveal';
});

skipBtn.addEventListener('click', () => {
    if(skipState == 0){
        skipState = 1;
        skipBtn.textContent = 'Next';

        function animateCharactersSequentially(writers, index = 0) {
            if (index >= writers.length) {
                return;
            }
            const writer = writers[index];
            writer.cancelQuiz();

            writer.animateCharacter({
                onComplete: function() {
                    totalStrokeCount += writer._character.strokes.length;
                    totalMistakeCount += writer._character.strokes.length;
                    animateCharactersSequentially(writers, index + 1);
                }
            });
        }
        
        totalAnswered++;
        // Start the sequential animation
        animateCharactersSequentially(currentWriters);
        
        currentWriters.forEach(writer => {
            writer.showOutline();
        });

        drawingArea.addEventListener('click', handleAreaClick);
        
        if(!pinyinLabel.classList.contains('active')){
            pinyinLabel.classList.add('active');
        }
        
        userAnswers.push({
            correctCharacter: currentWord,
            english: currentEnglish,
            pinyin: currentPinyin,
            isCorrect: false
        });
        
        streakCount = 0;
        streakCheckpoint = streakIncrement;
    }
    else{
        skipState = 0;
        currentIndex++;
        numFinished = 0;
        
        streakCount = 0;
        streakCheckpoint = streakIncrement;

        showWord();
        skipBtn.textContent = 'Give up';
    }
});

function handleAreaClick(){
    currentWriters.forEach(writer => {
        writer.cancelQuiz();
        writer.animateCharacter();
    });
}

let currentWord = '';
let currentEnglish = '';
let currentPinyin = '';
let streakCount = 0;
let streakIncrement = 20;
let streakCheckpoint = streakIncrement;

function createHanziWriters(characters) {

    drawingArea.innerHTML = '';
    currentWriters = [];
    let writerSize = 400;
    let containerWidth = characters.length * (writerSize + 10); // 10px gap between writers
    drawingArea.style.width = `${containerWidth}px`;
    if(window.innerWidth < window.innerHeight){
        writerSize = window.innerWidth*0.8;
        drawingArea.style.width = window.innerWidth+"px";
        if(window.innerWidth >= 1023){
            writerSize = window.innerWidth*0.6;
            drawingArea.style.width = window.innerWidth*.8+"px";
            console.log('ipad');
        }
    }

    drawingArea.style.display = 'flex';
    drawingArea.style.justifyContent = 'center';
    drawingArea.style.alignItems = 'center';
    drawingArea.style.gap = '10px';

    characters.split('').forEach((char, index) => {
        const strokeWrapper = document.createElement('div');
        strokeWrapper.style.position = 'relative';
        strokeWrapper.id = `flashcard_stroke_wrapper_${index}`;
        drawingArea.appendChild(strokeWrapper);

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", writerSize);
        svg.setAttribute("height", writerSize);
        svg.setAttribute("id", `grid-background-${index}`);
        const dashSize = Math.max(2, Math.floor(writerSize / 25));
        const dashPattern = `${dashSize},${dashSize}`;

        svg.innerHTML = `
            <rect x="0" y="0" width="${writerSize}" height="${writerSize}" fill="none" stroke="#7e779155" stroke-width="4" stroke-dasharray="${dashPattern}" />
            <line x1="0" y1="0" x2="${writerSize}" y2="${writerSize}" stroke="#7e779155" stroke-width="2" stroke-dasharray="${dashPattern}" />
            <line x1="${writerSize}" y1="0" x2="0" y2="${writerSize}" stroke="#7e779155" stroke-width="2" stroke-dasharray="${dashPattern}" />
            <line x1="${writerSize/2}" y1="0" x2="${writerSize/2}" y2="${writerSize}" stroke="#7e779155" stroke-width="2" stroke-dasharray="${dashPattern}" />
            <line x1="0" y1="${writerSize/2}" x2="${writerSize}" y2="${writerSize/2}" stroke="#7e779155" stroke-width="2" stroke-dasharray="${dashPattern}" />
        `;

        strokeWrapper.appendChild(svg);

        let strokeColor = '#000000';
        let radicalColor = '#000000';
            
        
        if(isDarkMode){
            strokeColor = '#ffffff';
            radicalColor = '#ffffff';
        }
        const writer = HanziWriter.create(`grid-background-${index}`, char, {
            width: writerSize,
            height: writerSize,
            padding: 5,
            strokeColor: strokeColor,
            strokeAnimationSpeed: 1,
            delayBetweenStrokes: 170,
            drawingWidth: 40,
            showCharacter: false,
            showOutline: false,
            showHintAfterMisses: 2,
            highlightOnComplete: true,
            highlightCompleteColor: '#77FFAA',
            charDataLoader: function(char) {
                return fetch(`/static/strokes_data/${char}.json`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .catch(error => {
                        console.error('Error loading character data:', error);
                        return null;
                    });
            }
        });
        let strokesdata = [];
        writer.quiz({
            onMistake: function(strokeData) {
                console.log('Oh no! you made a mistake on stroke ' + strokeData.strokeNum);
                console.log("You've made " + strokeData.mistakesOnStroke + " mistakes on this stroke so far");
                console.log("You've made " + strokeData.totalMistakes + " total mistakes on this quiz");
                console.log("There are " + strokeData.strokesRemaining + " strokes remaining in this character");
                console.log('');
                streakCount = 0;
                streakCheckpoint = streakIncrement;
            },
            onCorrectStroke: function(strokeData) {
                streakCount++;
                console.log('Yes!!! You got stroke ' + strokeData.strokeNum + ' correct!');
                console.log('You made ' + strokeData.mistakesOnStroke + ' mistakes on this stroke');
                console.log("You've made " + strokeData.totalMistakes + ' total mistakes on this quiz');
                console.log('There are ' + strokeData.strokesRemaining + ' strokes remaining in this character');
                console.log('');
                strokesdata.push(strokeData.drawnPath.points);
            },
            onComplete: function(summaryData) {
                console.log('You did it! You finished drawing ' + summaryData.character);
                console.log('You made ' + summaryData.totalMistakes + ' total mistakes on this quiz');
                console.log('currecnt wordTotalStrokeCount:', wordTotalStrokeCount);
                console.log('currecnt wordTotalMistakeCount:', wordTotalMistakeCount);
                console.log('');
                if(streakCount >= streakCheckpoint){
                    confetti(streakCheckpoint);
                    while(streakCount >= streakCheckpoint){
                        streakCheckpoint += streakIncrement;
                    }
                }
                wordTotalMistakeCount += summaryData.totalMistakes;
                totalMistakeCount += Math.min(summaryData.totalMistakes, writer._character.strokes.length);
                wordTotalStrokeCount += writer._character.strokes.length;
                totalStrokeCount += writer._character.strokes.length;
                numFinished++;
                
                let www = writer._positioner.width;
                let hhh = writer._positioner.height;
                let xoff = writer._positioner.xOffset;
                let yoff = writer._positioner.yOffset;
                let ppadding = writer._positioner.padding;
                let ssscale = writer._positioner.scale;
                www = www/ssscale;
                hhh = hhh/ssscale;
                strokesdata.forEach(stroke => {
                    stroke.forEach(function(point){
                        point.x = (point.x+xoff)/www;
                        point.y = (point.y+yoff)/hhh;
                    });
                });
                // trueStrokeData.forEach(stroke => {
                //     stroke.forEach(function(point){
                //         point.x = (point.x+xoff)/www;
                //         point.y = (point.y+yoff)/hhh;
                //     });
                // });
                let data = {
                    character: summaryData.character,
                    strokes: strokesdata,
                    positioner: writer._positioner,
                    mistakes: summaryData.totalMistakes,
                    strokeCount: writer._character.strokes.length
                };
                saveData(data);

                if (numFinished === characters.length) {
                    handleAnswer(wordTotalMistakeCount, wordTotalStrokeCount);
                }
            }
        });
        currentWriters.push(writer);
    });
}


function saveData(data) {
    fetch('./api/save_stroke_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        console.log('Data saved successfully');
    })
    .catch(error => {
        console.error('There was a problem saving the data:', error);
    });
}

function confetti(congrats=null) {
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

    if(congrats){
        const congratsEmoji = document.createElement('div');
        congratsEmoji.id = 'congrats';
        congratsEmoji.className = 'congrats';
        if(isDarkMode){
            congratsEmoji.innerHTML = `<span>${congrats} correct strokes in a row!</span>`;
        }
        else{
            congratsEmoji.innerHTML = `<span>${congrats} correct strokes in a row!</span>`;
        }
        container.appendChild(congratsEmoji);
        setTimeout(() => {
            congratsEmoji.remove();
        }, 2000);
    }
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'c') {
        confetti();
    }
});

function handleAnswer(wordTotalMistakeCount, wordTotalStrokeCount) {
    const characterData = currentcharacters[shuffledWords[currentIndex]];
    let isCorrect = false;
    console.log('**********************')
    console.log('Word mistake count:', wordTotalMistakeCount);
    console.log('Word stroke count:', wordTotalStrokeCount);
    if (wordTotalMistakeCount < wordTotalStrokeCount*0.2+1) {
        correctAnswers++;
        isCorrect = true;
    }

    if(correctAnswers == 2){

    }

    userAnswers.push({
        english: characterData.english,
        pinyin: characterData.pinyin,
        correctCharacter: shuffledWords[currentIndex],
        isCorrect: isCorrect
    });
    totalAnswered++;

    //++;
    numFinished = 0;
    skipState = 1;
    skipBtn.textContent = 'Next';
     
    if(!pinyinLabel.classList.contains('active')){
        pinyinLabel.classList.add('active');
    }
    
    setTimeout(() => {
        //showWord();
        //skipState = 1;
        //skipBtn.textContent = 'Next';
        
        drawingArea.addEventListener('click', handleAreaClick);
        
        currentWriters.forEach(writer => {
            writer.showOutline();
        });
    }, 200);
}

function showResults() {
    document.getElementById('test-container').style.display = 'none';
    resultsDiv.style.display = 'block';
    const totalQuestions = NUM_QUESTIONS;
    const score = (correctAnswers / (totalAnswered)) * 100;
    scoreSpan.textContent = `${correctAnswers} / ${(totalAnswered)} (of ${totalQuestions})`;
    accuracySpan.textContent = `${score.toFixed(2)}%`;
    strokeAccuracySpan.textContent = `${((totalStrokeCount - totalMistakeCount) / totalStrokeCount * 100).toFixed(2)}% (${totalStrokeCount-totalMistakeCount}/${totalStrokeCount})`;
    if(totalAnswered == 0){
        strokeAccuracySpan.textContent = `0% (0/0)`;
        scoreSpan.textContent = `0 / 0 of ${totalQuestions}`;
        accuracySpan.textContent = `0%`;
    }

    answerTableBody.innerHTML = '';
    userAnswers.forEach(answer => {
        const row = document.createElement('tr');
        row.className = answer.isCorrect ? 'correct-row' : 'incorrect-row';
        row.innerHTML = `
            <td>${answer.correctCharacter}</td>
            <td>${answer.pinyin}</td>
            <td>${answer.english}</td>
        `;
        answerTableBody.appendChild(row);
    });
    confirmDarkmode();
}

document.addEventListener('DOMContentLoaded', () => {
    checkCustom();
    // Check for deck query parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const deckParam = urlParams.get('deck');
    if(deckParam){
        // remove deck query from url
        const url = new URL(window.location.href);
        url.searchParams.delete('deck');
        window.history.replaceState({}, document.title, url);
    }
    // remove deck from url
    getDarkmode();
    
    populateDropdown(hasCustom);
});

window.addEventListener('resize', () => {
    // startTest();
});

