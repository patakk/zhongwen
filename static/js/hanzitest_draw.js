const englishDisplay = document.getElementById('english-display');
const drawingArea = document.getElementById('drawing-area');
const submitBtn = document.getElementById('submit-btn');
const clearBtn = document.getElementById('clear-btn');
const progressDiv = document.getElementById('progress');
const resultsDiv = document.getElementById('results');
const scoreSpan = document.getElementById('score');
const accuracySpan = document.getElementById('accuracy');
const strokeAccuracySpan = document.getElementById('stroke_accuracy');
const restartBtn = document.getElementById('restart-btn');

let currentIndex = 0;
let correctAnswers = 0;
let shuffledCharacters = [];
let userAnswers = [];
let wordTotalMistakeCount = 0;
let wordTotalStrokeCount = 0;
let totalStrokeCount = 0;
let totalMistakeCount = 0;
let numFinished = 0;
const deckNameElement = document.getElementById('deck-name');
const answerTableBody = document.getElementById('answer-table-body');
const NUM_QUESTIONS = 5;
let currentWriters = [];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startTest() {
    shuffledCharacters = [...characters];
    shuffleArray(shuffledCharacters);
    currentIndex = 0;
    correctAnswers = 0;
    wordTotalMistakeCount = 0;
    wordTotalStrokeCount = 0;
    totalStrokeCount = 0;
    totalMistakeCount = 0;
    numFinished = 0;
    userAnswers = [];
    showNextWord();
    resultsDiv.style.display = 'none';
    document.getElementById('test-container').style.display = 'block';
    deckNameElement.textContent = `Current Deck: ${inputdecks[inputdeck].name}`;
}

function showNextWord() {
    if (currentIndex < Math.min(NUM_QUESTIONS, shuffledCharacters.length)) {
        let characterData = shuffledCharacters[currentIndex];
        englishDisplay.textContent = characterData.english;
        wordTotalMistakeCount = 0;
        wordTotalStrokeCount = 0;
        createHanziWriters(characterData.character);
        progressDiv.textContent = `Question ${currentIndex + 1} of ${Math.min(NUM_QUESTIONS, shuffledCharacters.length)}`;
    } else {
        showResults();
    }
}

restartBtn.addEventListener('click', () => {
    startTest();
});

function createHanziWriters(characters) {
    drawingArea.innerHTML = '';
    currentWriters = [];
    let writerSize = 400;
    let containerWidth = characters.length * (writerSize + 10); // 10px gap between writers
    drawingArea.style.width = `${containerWidth}px`;
    if(window.innerWidth < window.innerHeight){
        writerSize = window.innerWidth*0.8;
        drawingArea.style.width = window.innerWidth+"px";
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
            strokeColor: '#000000',
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
                totalMistakeCount += summaryData.totalMistakes;
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

function handleAnswer(wordTotalMistakeCount, wordTotalStrokeCount) {
    const characterData = shuffledCharacters[currentIndex];
    let isCorrect = false;
    console.log('**********************')
    console.log('Word mistake count:', wordTotalMistakeCount);
    console.log('Word stroke count:', wordTotalStrokeCount);
    if (wordTotalMistakeCount < wordTotalStrokeCount*0.2+1) {
        correctAnswers++;
        isCorrect = true;
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
    const totalQuestions = Math.min(NUM_QUESTIONS, shuffledCharacters.length);
    const score = (correctAnswers / totalQuestions) * 100;
    scoreSpan.textContent = `${correctAnswers} / ${totalQuestions}`;
    accuracySpan.textContent = `${score.toFixed(2)}%`;
    strokeAccuracySpan.textContent = `${((totalStrokeCount - totalMistakeCount) / totalStrokeCount * 100).toFixed(2)}% (${totalStrokeCount-totalMistakeCount}/${totalStrokeCount})`;

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
    deckNameElement.textContent = `Current Deck: ${inputdecks[inputdeck].name}`;
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