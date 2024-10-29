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
const endBtn = document.getElementById('end-btn');
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
let NUM_QUESTIONS = 5;
let currentWriters = [];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startTest() {
    shuffledWords = [...characters];
    shuffleArray(shuffledWords);

    shuffledWords = shuffledWords.filter(word => word.character.length <= 2);

    currentIndex = 0;
    correctAnswers = 0;
    wordTotalMistakeCount = 0;
    totalAnswered = 0;
    wordTotalStrokeCount = 0;
    totalStrokeCount = 0;
    totalMistakeCount = 0;
    numFinished = 0;
    userAnswers = [];
    showNextWord();
    resultsDiv.style.display = 'none';
    document.getElementById('test-container').style.display = 'block';
    deckNameElement.innerHTML = `(current Deck: <span style="font-weight: 500;">${inputdecks[inputdeck].name}</span>)`;
}

function showNextWord() {
    
    currentWriters.forEach(writer => {
        if(isDarkMode){
            writer.updateColor('strokeColor', '#fff')
            writer.updateColor('radicalColor', '#fff')
        }
        else{
            writer.updateColor('strokeColor', '#000')
            writer.updateColor('radicalColor', '#000')
        }
    });
    totalAnswered++;
    if(pinyinLabel.classList.contains('active')){
        pinyinLabel.classList.remove('active');
    }
    window.scrollTo(0, 0);
    if (currentIndex < Math.min(NUM_QUESTIONS, shuffledWords.length)) {
        let characterData = shuffledWords[currentIndex];
        englishDisplay.textContent = characterData.english;
        wordTotalMistakeCount = 0;
        wordTotalStrokeCount = 0;
        
        currentWord = characterData.character;
        currentEnglish = characterData.english;
        currentPinyin = characterData.pinyin;
        createHanziWriters(characterData.character);
        pinyinLabel.textContent = characterData.pinyin;
        progressDiv.textContent = `Question ${currentIndex + 1} of ${Math.min(NUM_QUESTIONS, shuffledWords.length)}`;
    } else {
        showResults();
    }
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

endBtn.addEventListener('click', () => {
    showResults();
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
        
        // Start the sequential animation
        animateCharactersSequentially(currentWriters);

        drawingArea.addEventListener('click', () => {
            currentWriters.forEach(writer => {
                writer.cancelQuiz();
                writer.animateCharacter();
            });
        });

        
        userAnswers.push({
            correctCharacter: currentWord,
            english: currentEnglish,
            isCorrect: false
        });
    }
    else{
        skipState = 0;
        currentIndex++;
        numFinished = 0;

        showNextWord();
        skipBtn.textContent = 'Reveal';
    }
});

let currentWord = '';
let currentEnglish = '';
let currentPinyin = '';

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
            <rect x="0" y="0" width="${writerSize}" height="${writerSize}" fill="none" stroke="#A005" stroke-width="4" stroke-dasharray="${dashPattern}" />
            <line x1="0" y1="0" x2="${writerSize}" y2="${writerSize}" stroke="#A005" stroke-width="2" stroke-dasharray="${dashPattern}" />
            <line x1="${writerSize}" y1="0" x2="0" y2="${writerSize}" stroke="#A005" stroke-width="2" stroke-dasharray="${dashPattern}" />
            <line x1="${writerSize/2}" y1="0" x2="${writerSize/2}" y2="${writerSize}" stroke="#A005" stroke-width="2" stroke-dasharray="${dashPattern}" />
            <line x1="0" y1="${writerSize/2}" x2="${writerSize}" y2="${writerSize/2}" stroke="#A005" stroke-width="2" stroke-dasharray="${dashPattern}" />
        `;

        strokeWrapper.appendChild(svg);

        const writer = HanziWriter.create(`grid-background-${index}`, char, {
            width: writerSize,
            height: writerSize,
            padding: 5,
            strokeColor: '#000',
            strokeAnimationSpeed: 1,
            delayBetweenStrokes: 220,
            
            showCharacter: false,
            showOutline: false,
            showHintAfterMisses: 2,
            highlightOnComplete: true,
            highlightCompleteColor: '#77FFAA',
        });
        writer.quiz({
            onMistake: function(strokeData) {
                console.log('Oh no! you made a mistake on stroke ' + strokeData.strokeNum);
                console.log("You've made " + strokeData.mistakesOnStroke + " mistakes on this stroke so far");
                console.log("You've made " + strokeData.totalMistakes + " total mistakes on this quiz");
                console.log("There are " + strokeData.strokesRemaining + " strokes remaining in this character");
                console.log('');
            },
            onCorrectStroke: function(strokeData) {
                console.log('Yes!!! You got stroke ' + strokeData.strokeNum + ' correct!');
                console.log('You made ' + strokeData.mistakesOnStroke + ' mistakes on this stroke');
                console.log("You've made " + strokeData.totalMistakes + ' total mistakes on this quiz');
                console.log('There are ' + strokeData.strokesRemaining + ' strokes remaining in this character');
                console.log('');
            },
            onComplete: function(summaryData) {
                console.log('You did it! You finished drawing ' + summaryData.character);
                console.log('You made ' + summaryData.totalMistakes + ' total mistakes on this quiz');
                console.log('currecnt wordTotalStrokeCount:', wordTotalStrokeCount);
                console.log('currecnt wordTotalMistakeCount:', wordTotalMistakeCount);
                console.log('');
                wordTotalMistakeCount += summaryData.totalMistakes;
                totalMistakeCount += Math.min(summaryData.totalMistakes, writer._character.strokes.length);
                wordTotalStrokeCount += writer._character.strokes.length;
                totalStrokeCount += writer._character.strokes.length;
                numFinished++;
                if (numFinished === characters.length) {
                    handleAnswer(wordTotalMistakeCount, wordTotalStrokeCount);
                }
            }
        });
        currentWriters.push(writer);
    });
}

function confetti() {
    const container = document.getElementById('confetti-container');
    const emojis = ['🎉', '🎊', '🥳', '🎈', '🎊', '🍰', '🎂', '🥂'];
    const confettiCount = 150;

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const emoji = document.createElement('div');
            emoji.className = 'confetti';
            emoji.style.left = Math.random() * 100 + 'vw';
            const duration = (Math.random() * 3 + 2);
            emoji.style.animationDuration = duration + 's';
            emoji.style.fontSize = (Math.random() * 20 + 10) + 'px';
            emoji.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
            
            container.appendChild(emoji);

            // Remove the emoji after it has completed its animation
            setTimeout(() => {
                emoji.remove();
            }, duration * 1000);
        }, i * 100/3);
    }
}

let isDarkMode = false;

document.addEventListener('keydown', (event) => {
    if (event.key === 'c') {
        confetti();
    }
});

function handleAnswer(wordTotalMistakeCount, wordTotalStrokeCount) {
    const characterData = shuffledWords[currentIndex];
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
        correctCharacter: characterData.character,
        isCorrect: isCorrect
    });

    currentIndex++;
    numFinished = 0;
    setTimeout(() => {
        showNextWord();
    }, 1000);
}

function showResults() {
    document.getElementById('test-container').style.display = 'none';
    resultsDiv.style.display = 'block';
    const totalQuestions = Math.min(NUM_QUESTIONS, shuffledWords.length);
    const score = (correctAnswers / (totalAnswered-1)) * 100;
    scoreSpan.textContent = `${correctAnswers} / ${(totalAnswered-1)} (of ${totalQuestions})`;
    accuracySpan.textContent = `${score.toFixed(2)}%`;
    strokeAccuracySpan.textContent = `${((totalStrokeCount - totalMistakeCount) / totalStrokeCount * 100).toFixed(2)}% (${totalStrokeCount-totalMistakeCount}/${totalStrokeCount})`;
    if(totalAnswered-1 == 0){
        strokeAccuracySpan.textContent = `0% (0/0)`;
        scoreSpan.textContent = `0 / 0 of ${totalQuestions}`;
        accuracySpan.textContent = `0%`;
    }

    answerTableBody.innerHTML = '';
    userAnswers.forEach(answer => {
        const row = document.createElement('tr');
        row.className = answer.isCorrect ? 'correct-row' : 'incorrect-row';
        row.innerHTML = `
            <td>${answer.english}</td>
            <td>${answer.correctCharacter}</td>
        `;
        answerTableBody.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    deckNameElement.textContent = `(current Deck: ${inputdecks[inputdeck].name})`;
    NUM_QUESTIONS = Math.max(5, characters.length);
    startTest();
});

window.addEventListener('resize', () => {
    // startTest();
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