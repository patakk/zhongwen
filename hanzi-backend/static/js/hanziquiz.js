const englishDisplay = document.getElementById('english-display');
const drawingArea = document.getElementById('drawing-area');
const clearBtn = document.getElementById('clear-btn');
const progressDiv = document.getElementById('progress');
const resultsDiv = document.getElementById('results');
const scoreSpan = document.getElementById('score');
const accuracySpan = document.getElementById('accuracy');
const strokeAccuracySpan = document.getElementById('stroke_accuracy');
const helpBtn = document.getElementById('help-btn');
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
    const sortedKeys = decknames_sorted;

    let url = new URL(window.location);
    let deck = url.searchParams.get('wordlist');
    if (deck) {
        inputdeck = deck;
    } else {
        inputdeck = hskKeys[0];
    }
    url.searchParams.set('wordlist', inputdeck);
    window.history.replaceState({}, '', url);
    selectDeck(inputdeck);
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
    
    let url = new URL(window.location);
    url.searchParams.set('wordlist', inputdeck);
    window.history.replaceState({}, '', url);
    
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
        body: JSON.stringify({wordlist: inputdeck, num: 100}),
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
    englishDisplay.textContent = characterData.english[0];
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
    let currentPin = characterData.pinyin[0].split(' ').map((word, index) => {
        if (currentWord.split('')[index] !== currentWord[charIterator%currentWord.length]) {
            return '<span style="opacity: 0.33">' + toAccentedPinyin(word) + '</span>';
        }
        return '<span>' + toAccentedPinyin(word) + '</span>';
    }
    ).join(' ');
    if(currentWord.length == 1){
        currentPin = '<span>' + toAccentedPinyin(characterData.pinyin[0]) + '</span>';
        currentSWord = '<span class="hiddenHanzi hanzipart">' + toAccentedPinyin(currentWord) + '</span>';
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



helpBtn.addEventListener('click', () => {

    const writer = currentWriters[0];
    writer.helpMode();
});


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
    skipBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    pinyinLabel.classList.remove('active');
}

resetBtn.addEventListener('click', () => {

    if(currentWriters[0].userStrokes.length == 0 && skipState == 0){
        skipState = 0;
        currentIndex--;

        if(currentIndex < 0){
            currentIndex = shuffledWords.length - 1;
            if(charIterator > 0){
                charIterator--;
            }
        }
        
        currentWriters[0].clearBg();
        currentWriters[0].demoMode = false;

        showWord();
        skipBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
    else{
        restartQ();
    }
});

skipBtn.addEventListener('click', () => {
    if(skipState == 0){
        skipState = 1;
        skipBtn.innerHTML = '<i class="fa-solid fa-forward-step"></i>';

        function animateCharactersSequentially(writers, index = 0) {
            if (index >= writers.length) {
                return;
            }
            const writer = writers[index];
            writer.giveUp();
        }
        currentWriters[0].quizComplete = true;
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
        currentWriters[0].demoMode = false;

        showWord();
        skipBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
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
        const response = await fetch(`/api/getStrokes/${character}`);
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

function startUserDrawing(e) {
    if (!this.isQuizing) return;
    if (this.isAnimatingStroke) return;
    if (this.isAnimatingInterp) return;

    this.mouseDownWhileQuizing = true;
    
    this.isDrawing = true;
    this.currentStroke = [];
    
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    
    this.lastX = x;
    this.lastY = y;
    
    this.currentStroke.push({ x, y });
    this.drawUserStrokes();
}

function userStrokeMove(e) {
    if (!this.isDrawing || !this.isQuizing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const rawY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    
    // Apply simple smoothing formula
    const x = this.lastX + (rawX - this.lastX) * this.easingFactor;
    const y = this.lastY + (rawY - this.lastY) * this.easingFactor;
    
    // Update last position
    this.lastX = x;
    this.lastY = y;
    
    this.currentStroke.push({ x, y });
    this.drawUserStrokes();
}

function compareToReal(userStroke, realStroke) {
    const scaledRealStroke = realStroke.map(pt => ({
        x: pt.x / 1000,
        y: pt.y / 1000,
    }));
    const scaledUserStroke = userStroke.map(pt => ({
        x: pt.x / writerSize,
        y: pt.y / writerSize,
    }));

    // Get the vector from the first to the last point for both strokes
    const realVector = {
        x: scaledRealStroke[scaledRealStroke.length - 1].x - scaledRealStroke[0].x,
        y: scaledRealStroke[scaledRealStroke.length - 1].y - scaledRealStroke[0].y
    };

    const userVector = {
        x: scaledUserStroke[scaledUserStroke.length - 1].x - scaledUserStroke[0].x,
        y: scaledUserStroke[scaledUserStroke.length - 1].y - scaledUserStroke[0].y
    };

    // Normalize the vectors
    const normalize = (vector) => {
        const length = Math.hypot(vector.x, vector.y);
        return { x: vector.x / length, y: vector.y / length };
    };

    const normalizedRealVector = normalize(realVector);
    const normalizedUserVector = normalize(userVector);

    const dotProduct = normalizedRealVector.x * normalizedUserVector.x + normalizedRealVector.y * normalizedUserVector.y;

    // Check if the first points are relatively close
    const distFirst = Math.hypot(scaledUserStroke[0].x - scaledRealStroke[0].x, scaledUserStroke[0].y - scaledRealStroke[0].y);
    const firstPointThreshold = 0.35;

    // Check if the length of the user stroke is within reasonable threshold of the real stroke
    const realLength = Math.hypot(realVector.x, realVector.y);
    const userLength = Math.hypot(userVector.x, userVector.y);
    const lengthThreshold = 0.5; // 50% difference allowed

    const lengthRatio = Math.abs(userLength - realLength) / realLength;

    const threshold = 0.8; // Cosine similarity threshold for direction comparison

    if(realLength < 0.16)
        return dotProduct > threshold && distFirst < firstPointThreshold;
    
    return dotProduct > threshold && distFirst < firstPointThreshold && lengthRatio < lengthThreshold;
}

function userStrokeEnded() {
    if (!this.isDrawing || !this.isQuizing) return;
    if (this.userStrokes.length >= this.strokes.length) return;

    this.isDrawing = false;
    if (this.currentStroke && this.currentStroke.length > 0) {
        const isGoodMatch = compareToReal(this.currentStroke, this.strokes[this.userStrokes.length]);
        
        // Provide feedback based on match
        if (isGoodMatch) {
            console.log("Good stroke!");
            
            let resampled = resamplePolyline(this.currentStroke, this.strokes[this.userStrokes.length].length);
            this.userStrokes.push(resampled);
            this.strokeAttempts = 0;
            
            // Update streak count for correct strokes
            streakCount++;
            if (streakCount > 0 && streakCount % streakIncrement === 0) {
                confetti(streakCount);
            }
        } else if (this.strokeAttempts < 2) {
            console.log("Try again");
            this.strokeAttempts++;
            streakCount = 0;
        } else {
            console.log("Demoing stroke");
            this.strokeAttempts++;
            this.startStrokeAnimation();
            this.isAnimatingStroke = true;
            streakCount = 0;
        }
        
        // Check if quiz is complete
        if (this.userStrokes.length === this.strokes.length) {
            console.log("Quiz complete!");
            this.quizComplete = true;
            this.clearBg();
            this.demoMode = false;
            cancelAnimationFrame(this.demoAnimationFrame);
            this.startInterpol();
            this.onCompleteQuiz({'strokes': this.userStrokes, 'character': this.character});
        }
        this.currentStroke = null;
    }
    if(!this.quizComplete){
        this.drawUserStrokes();
    }
}

function startStrokeAnimation() {
    if(!this.isQuizing){
        return;
    }
    this.isAnimatingStroke = true;
    this.strokeStartTime = Date.now();
    let numPoints = this.strokes[this.userStrokes.length].length;
    const duration = numPoints / this.speed * 1; // duration in milliseconds
    const animate = () => {

        const elapsed = Date.now() - this.strokeStartTime;
        const progress = Math.min(elapsed / duration, 1);

        this.clearBg();
        this.drawUserStrokes();

        this.ctx.save();
        this.ctx.lineCap = this.lineType;
        this.ctx.lineJoin = this.lineType;
        this.ctx.strokeStyle = this.colors[0];
        this.ctx.lineWidth = this.lineThickness * 1.24;
        if(isDarkMode){
            this.ctx.strokeStyle = this.colors[1];
        }
        this.drawStroke(this.strokes[this.userStrokes.length], progress);

        this.ctx.restore();

        if (progress < 1) {
            this.strokeAnimationFrame = requestAnimationFrame(animate);
        } else {
            cancelAnimationFrame(this.strokeAnimationFrame);
            this.clearBg();
            this.isAnimatingStroke = false;
            this.drawUserStrokes(false);
        }
    };
    
    this.clearBg();
    this.strokeAnimationFrame = requestAnimationFrame(animate);
}

// Implement a function to draw a stroke with progress
function drawStroke(stroke, progress = 1, smooth = false, alpha=1) {
    if (!stroke || stroke.length < 2) return;

    // Ensure progress is between 0 and 1
    progress = Math.min(1, Math.max(0, progress));

    this.ctx.beginPath();

    const scaledStroke = stroke.map(pt => ({
        x: pt.x * this.dimension / 1000,
        y: pt.y * this.dimension / 1000
    }));

    // Calculate total distance and the target length based on progress
    let totalDistance = 0;
    let segmentLengths = [0];

    // Calculate segment lengths
    for (let i = 1; i < scaledStroke.length; i++) {
        const dx = scaledStroke[i].x - scaledStroke[i - 1].x;
        const dy = scaledStroke[i].y - scaledStroke[i - 1].y;
        totalDistance += Math.sqrt(dx * dx + dy * dy);
        segmentLengths.push(totalDistance);
    }

    const targetLength = progress * totalDistance;

    // Draw the stroke up to the target length
    this.ctx.moveTo(scaledStroke[0].x, scaledStroke[0].y);

    let accumulatedLength = 0;
    for (let i = 1; i < scaledStroke.length; i++) {
        const p1 = scaledStroke[i - 1];
        const p2 = scaledStroke[i];
        const segmentDistance = segmentLengths[i] - segmentLengths[i - 1];

        accumulatedLength += segmentDistance;

        // Check if we've reached or surpassed the target length
        if (accumulatedLength >= targetLength) {
            // Interpolate the position on this segment based on progress
            const remainingLength = targetLength - (accumulatedLength - segmentDistance);
            const ratio = remainingLength / segmentDistance;

            const x = p1.x + (p2.x - p1.x) * ratio;
            const y = p1.y + (p2.y - p1.y) * ratio;

            this.ctx.lineTo(x, y);
            break;
        } else {
            // Draw the entire segment as a straight line
            this.ctx.lineTo(p2.x, p2.y);
        }
    }

    this.ctx.stroke();
}

// Start interpolation animation to show transition between user's stroke and correct stroke
function startInterpol(){
    this.isAnimatingInterp = true;
    
    // Resample user strokes to match the number of points in the reference strokes
    let resampleUserStrokes = this.userStrokes;

    let factor = 0.0;
    let frame = 0.0;

    const aanim = () => {
        frame++;
        factor = .5 + Math.cos(frame / 50 * Math.PI) * 0.5;
        let interpolatedStrokes = this.strokes.map((stroke, sidx) => {
            let interpolated = stroke.map((point, pidx) => {
                let userPoint = resampleUserStrokes[sidx][pidx];
                return {
                    x: userPoint.x * factor * 1000 / this.dimension + point.x * (1 - factor),
                    y: userPoint.y * factor * 1000 / this.dimension + point.y * (1 - factor),
                };
            });
            return interpolated;
        });

        let interlength = interpolatedStrokes.reduce((total, stroke) => {
            return total + this.getStrokeLength(stroke);
        }, 0);

        this.draw({ progress: 1, clearbg: true, onDrawComplete: null, alpha: 1, strokes_in: interpolatedStrokes, strokes_in_length: interlength });
        this.interpAnimFrame = requestAnimationFrame(aanim);

       if(frame==50){
            cancelAnimationFrame(this.interpAnimFrame);
            this.clearBg();
            this.isAnimatingInterp = false;
        }
       if(frame==40){
            this.isQuizing = false;
        }
    }

    aanim();
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
        colors: ['#000000ee', '#ffffffee', '#ff4405dd', '#b4ed8c'], // c1 c1d s1 s1d
        showDiagonals: true,
        lineType: "mitter",
        showGrid: false,
        clearBackground: false,
        canvas: mainCanvas,
    });
    
    // Assign methods to the plotter object
    workingPlotter.startUserDrawing = startUserDrawing;
    workingPlotter.userStrokeMove = userStrokeMove;
    workingPlotter.userStrokeEnded = userStrokeEnded;
    workingPlotter.startStrokeAnimation = startStrokeAnimation;
    workingPlotter.drawStroke = drawStroke;
    workingPlotter.startInterpol = startInterpol;
    workingPlotter.compareToReal = compareToReal;
    
    workingPlotter.quiz({
        onComplete: (userData) => {
            let userStrokes = userData.strokes;
            let userChar = userData.character;
            numFinished = 0;
            skipState = 1;
            skipBtn.innerHTML = '<i class="fa-solid fa-forward-step"></i>';
            
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
    
    // Add event listeners for user interaction
    mainCanvas.addEventListener('mousedown', workingPlotter.startUserDrawing.bind(workingPlotter));
    mainCanvas.addEventListener('mousemove', workingPlotter.userStrokeMove.bind(workingPlotter));
    mainCanvas.addEventListener('mouseup', workingPlotter.userStrokeEnded.bind(workingPlotter));
    mainCanvas.addEventListener('mouseout', workingPlotter.userStrokeEnded.bind(workingPlotter));
    
    // Add touch events
    mainCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        mainCanvas.dispatchEvent(mouseEvent);
    });
    
    mainCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        mainCanvas.dispatchEvent(mouseEvent);
    });
    
    mainCanvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        mainCanvas.dispatchEvent(mouseEvent);
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
    populateDropdown();
    // Check for deck query parameter in URL
    // const urlParams = new URLSearchParams(window.location.search);
    // const deckParam = urlParams.get('wordlist');
    // if(deckParam){
    //     const url = new URL(window.location.href);
    //     url.searchParams.delete('wordlist');
    //     window.history.replaceState({}, document.title, url);
    // }
    getDarkmode();
    
});

window.addEventListener('resize', () => {
});



function isMobileOrTablet() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check || /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
