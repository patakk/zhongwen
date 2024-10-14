const exampleDisplay = document.getElementById('example-display');
const proposalOptions = document.getElementById('proposal-options');
const progressDiv = document.getElementById('progress');
const resultsDiv = document.getElementById('results');
const scoreSpan = document.getElementById('score');
const accuracySpan = document.getElementById('accuracy');
const restartBtn = document.getElementById('restart-btn');

let currentIndex = 0;
let correctAnswers = 0;
let shuffledExamples = [];
let userAnswers = [];
const deckNameElement = document.getElementById('deck-name');
const answerTableBody = document.getElementById('answer-table-body');
const NUM_QUESTIONS = 10;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startTest() {
    shuffledExamples = Object.keys(fillin);
    shuffleArray(shuffledExamples);
    currentIndex = 0;
    correctAnswers = 0;
    userAnswers = [];
    showNextExample();
    resultsDiv.style.display = 'none';
    document.getElementById('test-container').style.display = 'block';
    deckNameElement.textContent = `Current Deck: ${inputdecks[inputdeck].name}`;
}

const chineseDiv = exampleDisplay.querySelector('.chinese');
const pinyinDiv = exampleDisplay.querySelector('.pinyin');

function replaceQWithBlackRectangles(text) {
    return text.replace(/<q>(.*?)<\/q>/g, (match, p1) => {
        return  "<span style='background-color: #000;'>" + '████' + "</span>";
    });
}

function removeBlackRectangles(text) {
    return text.replace(/<q>(.*?)<\/q>/g, (match, p1) => {
        return "<span style='font-weight: 600;'>" + p1 + "</span>";
    });
}

function showNextExample() {
    if (currentIndex < Math.min(NUM_QUESTIONS, shuffledExamples.length)) {
        let exampleKey = shuffledExamples[currentIndex];
        let example = fillin[exampleKey];
        
        // Replace content of <q> tags with black rectangles
        let chineseText = replaceQWithBlackRectangles(example.example);
        let pinyinText = replaceQWithBlackRectangles(example.pinyin);
        
        // Use textContent instead of innerHTML to avoid any HTML parsing
        chineseDiv.innerHTML = chineseText;
        pinyinDiv.innerHTML = pinyinText;
        
        pinyinDiv.style.opacity = 0;
        
        generateProposals(example);
        progressDiv.textContent = `Question ${currentIndex + 1} of ${Math.min(NUM_QUESTIONS, shuffledExamples.length)}`;
    } else {
        showResults();
    }
}


exampleDisplay.addEventListener('mouseenter', function() {
    pinyinDiv.style.opacity = 0.6;
});

exampleDisplay.addEventListener('mouseleave', function() {
    pinyinDiv.style.opacity = 0;
});

function togglePinyin() {
    const chinese = exampleDisplay.querySelector('.chinese');
    const pinyin = exampleDisplay.querySelector('.pinyin');
    chinese.style.display = chinese.style.display === 'none' ? 'block' : 'none';
    pinyin.style.display = pinyin.style.opacity === 0 ? 1 : 0;
}

function generateProposals(example) {
    proposalOptions.innerHTML = '';
    example.proposals.forEach(proposal => {
        const button = document.createElement('div');
        button.className = 'proposal-option';
        button.textContent = proposal;
        button.addEventListener('click', () => checkAnswer(proposal, example));
        proposalOptions.appendChild(button);
    });
}

function checkAnswer(selectedProposal, example) {
    const isCorrect = selectedProposal === example.proposals[0]; // Assuming first proposal is correct

    userAnswers.push({
        example: example.example,
        userAnswer: selectedProposal,
        correctAnswer: example.proposals[0],
        isCorrect: isCorrect
    });

    if (isCorrect) {
        correctAnswers++;
    }

    currentIndex++;
    showNextExample();
}

function showResults() {
    document.getElementById('test-container').style.display = 'none';
    resultsDiv.style.display = 'block';
    const totalQuestions = Math.min(NUM_QUESTIONS, shuffledExamples.length);
    const score = (correctAnswers / totalQuestions) * 100;
    scoreSpan.textContent = `${correctAnswers} / ${totalQuestions}`;
    accuracySpan.textContent = `${score.toFixed(2)}%`;

    answerTableBody.innerHTML = '';
    userAnswers.forEach(answer => {
        const row = document.createElement('tr');
        row.className = answer.isCorrect ? 'correct-row' : 'incorrect-row';
        row.innerHTML = `
            <td>${removeBlackRectangles(answer.example)}</td>
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
