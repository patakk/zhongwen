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
let charIterator = 0;
let numFinished = 0;
let totalAnswered = 0;
const deckNameElement = document.getElementById('deck-name');
const answerTableBody = document.getElementById('answer-table-body');
let NUM_QUESTIONS = 10;
let currentWriters = [];
let hasCustom = false;

let hanziplotterFirstLoad = true;

let writerSize;


let mainCanvas;

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
    }
    else{
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
    cachedStrokes = null;
    selectedDeckElement.textContent = decknames[deck];
    deckOptionsElement.style.display = 'none';
    nextPlotter = null;
    // currentWriters = [];
    loadNewWords(startTest);
  }
  
//   function selectDeck(deckName) {
//     inputdeck = deckName;
//     selectedDeckElement.textContent = decknames[deckName];
//     deckOptionsElement.style.display = 'none';
//     loadNewDeck(deckName, startTest);
//   }

function resetWord(){
  
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'q') {
    }
});


async function renderPlotters(){
    const drawingArea = document.getElementById('drawing-area');
    

    let plotters = currentWriters;
    
    let size = 355;
    if(plotters.length == 2){
        size = 355;
    }
    if(plotters.length == 3){
        size = 300;
    }
    else if(plotters.length > 3){
        size = 250;
    }
    size=writerSize;
    // drawingArea.style.minHeight = `${size/2}px`;
    
    if(drawingArea && plotters){
        // Store plotters as a property of the container element
        drawingArea.plotters = plotters;
        
        // get all internal loadPromise from plotters and await them
        const loadPromises = plotters.map(plotter => plotter.loadPromise);
        await Promise.all(loadPromises);

        plotters.forEach((plotter, index) => {

            let colors = ["#151511ee", "#151511aa", "#151511aa"];
            if(isDarkMode){
                colors = ["#e5ddedec", "#e5ddedaa", "#e5ddedaa"];
            }
            // plotter.displayDiagonals();
            // plotter.clearBg();
            plotter.canvas.dataset.plotterIndex = index;
        });
    }
    else{
        console.error('No plotter element found');
    }
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
    cachedStrokes = null;
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
    // window.scrollTo(0, 0);
    // window.scrollTo(0, 1);
    showWord();
    resultsDiv.style.display = 'none';
    document.getElementById('test-container').style.display = 'block';
}


function replaceAt(str, index, replacement) {
    return str.slice(0, index) + replacement + str.slice(index + 1);
 }

  function showWord() {
    // drawingArea.removeEventListener('click', handleAreaClick);

    pinyinLabel.classList.add('active');
    
    if(!pinyinLabel.classList.contains('active')){
    pinyinLabel.classList.add('active');
}
    if(pinyinLabel.classList.contains('active')){
        pinyinLabel.classList.remove('active');
    }
    // window.scrollTo(0, 0);
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

    let currentSWord = currentWord.split('').map((word, index) => {
        if (word !== currentWord[charIterator%currentWord.length]) {
            return '<span style="opacity: 0.33" class="hanzipart">' + word + '</span>';
        }
        return '<span class="hiddenHanzi hanzipart">' + word + '</span>';
    }
    ).join('');
    let currentPin = characterData.pinyin.split(' ').map((word, index) => {
        if (currentWord.split('')[index] !== currentWord[charIterator%currentWord.length]) {
            return '<span style="opacity: 0.33">' + word + '</span>';
        }
        return '<span>' + word + '</span>';
    }
    ).join(' ');
    if(currentWord.length == 1){
        currentPin = '<span>' + characterData.pinyin + '</span>';
        currentSWord = '<span class="hiddenHanzi hanzipart">' + currentWord + '</span>';
    }
    currentPinyin = currentPin + "<br>" + currentSWord;
    pinyinLabel.innerHTML = currentPinyin;
    // confirmDarkmode();

    if(cachedStrokes && cachedStrokes.character == currentWord[charIterator%currentWord.length]){
        currentWriters[0].replaceStrokes(cachedStrokes.character, cachedStrokes.medians,  cachedStrokes.strokes);
        restartQ();
    }
    else{
        console.log("loading" + currentWord[charIterator%currentWord.length]);
        loadStrokeData(currentWord[charIterator%currentWord.length], () => {
            currentWriters[0].replaceStrokes(cachedStrokes.character, cachedStrokes.medians,  cachedStrokes.strokes);
            restartQ();
        });
    }

    if(hanziplotterFirstLoad){
        hanziplotterFirstLoad = false;
        createHanziWriters(currentWord);
    }
    renderPlotters();

    let nextIdx = (currentIndex + 1) % shuffledWords.length;
    let nextWord = shuffledWords[nextIdx];
    let nextChar = nextWord[charIterator%nextWord.length];
    if(nextIdx == 0){
        nextChar = nextWord[(charIterator+1)%nextWord.length];
    }
    loadStrokeData(nextChar);
    
    // window.scrollTo(0, 1);
}

restartBtn.addEventListener('click', () => {
    
    startTest();
});


let skipState = 0;

pinyinLabel.addEventListener('click', () => {
    if(pinyinLabel.classList.contains('active')){
        // pinyinLabel.classList.remove('active');
    }
    else{
        // pinyinLabel.classList.add('active');
    }
});

function restartQ(){
    skipState = 0;  
    numFinished = 0;
    // showWord();
    
    if(currentWriters.length > 0){
        currentWriters[0].stopAnimation();
        console.log('stopping animation');
    }
    currentWriters.forEach(writer => {
        writer.restartQuiz();
    });
    skipBtn.textContent = 'Reveal';
    pinyinLabel.classList.remove('active');
}

resetBtn.addEventListener('click', () => {
    restartQ();
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
            writer.giveUp();
        }
        
        totalAnswered++;
        // Start the sequential animation
        animateCharactersSequentially(currentWriters);
        
        // currentWriters.forEach(writer => {
        //     writer.showOutline();
        // });

        // drawingArea.addEventListener('click', handleAreaClick);
        
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
        if(currentIndex >= shuffledWords.length){
            currentIndex = 0;
            charIterator++;
        }
        numFinished = 0;
        
        streakCount = 0;
        streakCheckpoint = streakIncrement;
        currentWriters[0].clearBg();

        showWord();
        skipBtn.textContent = 'Reveal';
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
let nextPlotter = null;
let cachedStrokes = null;
let workingPlotter = null;


async function loadStrokeData(character, onLoad=null) {
    try {
        const response = await fetch(`/static/strokes_data/${character}.json`);
        if (!response.ok) {
            console.log('Network response was not ok for character:', character);  
            return;
        }
        const data = await response.json();
        cachedStrokes = data;
        cachedStrokes.character = character;
        if(onLoad){
            onLoad();
        }
    } catch (error) {
        console.error('Error loading character data:', error);
        throw error;
    }
}

function createHanziWriters(characters) {

    // drawingArea.innerHTML = '';

    let char = characters[0];

    let strokeColor = '#000000';
    let radicalColor = '#000000';
        
    
    if(isDarkMode){
        strokeColor = '#ffffff';
        radicalColor = '#ffffff';
    }
    
    workingPlotter = new HanziPlotter({
        character: char,
        dimension: writerSize,
        speed: .075,
        lineThickness: 8*writerSize/200,
        jitterAmp: 0,
        colors: ['#003052ee', '#c1b2db', '#ff4405dd', '#b4ed8c'], // c1 c1d s1 s1d
        showDiagonals: true,
        lineType: "mitter",
        showGrid: false,
        clearBackground: false,
        canvas: mainCanvas,
    });
    workingPlotter.quiz({
        onComplete: (userData) => {
            let userStrokes = userData.strokes;
            let userChar = userData.character;
            numFinished = 0;
            skipState = 1;
            skipBtn.textContent = 'Next';
            
            if(!pinyinLabel.classList.contains('active')){
                pinyinLabel.classList.add('active');
            }

            let normalizedUserStrokes = userStrokes.map(stroke => {
                let nstroke = stroke.map(function(point){
                    return {x: point.x/writerSize, y: point.y/writerSize};
                });
                return nstroke;
            });

            // remove points with none or null or undefined values
            normalizedUserStrokes = normalizedUserStrokes.filter(stroke => stroke.length > 1);
            normalizedUserStrokes = normalizedUserStrokes.map(stroke => {
                return stroke.filter(point => point.x && point.y);
            });

            let data = {
                character: userChar,
                strokes: normalizedUserStrokes,
            };
            saveData(data);

        },
    });
    currentWriters = [workingPlotter];

    let nextChar = shuffledWords[(currentIndex + 1) % shuffledWords.length][0];
    loadStrokeData(nextChar);
   
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
            // writer.showOutline();
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

    writerSize = 800;

    mainCanvas = document.createElement('canvas');
    mainCanvas.id = 'main-canvas';
    mainCanvas.width = writerSize;
    mainCanvas.height = writerSize;
    // mainCanvas.style.width = writerSize/2 + 'px';   
    // mainCanvas.style.height = writerSize/2 + 'px';

    // if screen smaller than 500 width
    if(window.innerWidth < window.innerHeight && window.innerWidth < 500){
        // mainCanvas.style.width = writerSize/2 + 'px';   
        // mainCanvas.style.height = writerSize/2 + 'px';
    }

    
    shuffledWords = Object.keys(currentcharacters);

    drawingArea.appendChild(mainCanvas);
    checkCustom();
    // Check for deck query parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const deckParam = urlParams.get('deck');
    if(deckParam){
        const url = new URL(window.location.href);
        url.searchParams.delete('deck');
        window.history.replaceState({}, document.title, url);
    }
    getDarkmode();
    
});

window.addEventListener('resize', () => {
});

