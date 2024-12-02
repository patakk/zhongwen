let currentCharacter = null;
let showingAnswer = false;
let prefetchedCard = null;
let pinyinRevealed = false;
let messageTimeout = null;
let body = null;
let indicator = null;

function generatePseudoRandomNumbers(hanziChar) {
    const charCode = hanziChar.charCodeAt(0);

    let seed = 0;
    for (let i = 0; i < hanziChar.length; i++) {
        seed = ((seed << 5) - seed) + hanziChar.charCodeAt(i);
        seed = seed & seed; // Convert to 32-bit integer
    }

    function customRandom() {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return (seed / 0x7fffffff);
    }

    const numbers = [];
    for (let i = 0; i < 5; i++) {
        numbers.push(customRandom());
    }

    return numbers;
}

function randomizeTextColor(element){
    let colors = ['#ff421c', '#ffd91c', '#444444', '#0044FF', '#EE82EE'];
    const randomNumbers = generatePseudoRandomNumbers(element.textContent);
    randomNumbers.forEach((number, i) => {
        randomNumbers[i] = Math.floor(number * colors.length);
    });
    element.style.transition = 'text-shadow 0.125s';
    element.style.textShadow = `0 0 20px ${colors[randomNumbers[1]]}, 0 0 30px ${colors[randomNumbers[1]]}, 0 0 40px ${colors[randomNumbers[2]]}, 0 0 80px ${colors[randomNumbers[1]]}, 0 0 120px ${colors[randomNumbers[2]]}`;
}



function toneTextColor(element) {
    let colors = ['#58d38f', '#ffd91c', '#9f5dc1', '#ff421c', '#b1cbff']; // Corresponds to tones 1, 2, 3, 4, and neutral

    // Function to determine tone from pinyin
    function getToneFromPinyin(pinyin) {
        if (!pinyin) return 4; // Default to neutral tone if no pinyin
        
        // Tone mark to number mapping
        const toneMarks = {
            'ā': 0, 'ē': 0, 'ī': 0, 'ō': 0, 'ū': 0, 'ǖ': 0,
            'á': 1, 'é': 1, 'í': 1, 'ó': 1, 'ú': 1, 'ǘ': 1,
            'ǎ': 2, 'ě': 2, 'ǐ': 2, 'ǒ': 2, 'ǔ': 2, 'ǚ': 2,
            'à': 3, 'è': 3, 'ì': 3, 'ò': 3, 'ù': 3, 'ǜ': 3
        };

        for (let char of pinyin) {
            if (char in toneMarks) {
                return toneMarks[char];
            }
        }
        return 4; // Neutral tone if no tone mark found
    }


    const tone = getToneFromPinyin(element.dataset.pinyin);
    const color = colors[tone];

    // Commented out random color selection
    // const randomNumbers = generatePseudoRandomNumbers(element.dataset.char);
    // randomNumbers.forEach((number, i) => {
    //     randomNumbers[i] = Math.floor(number * colors.length);
    // });

    element.style.transition = 'text-shadow 0.125s';
    element.style.textShadow = `0 0 20px ${color}, 0 0 30px ${color}, 0 0 40px ${color}, 0 0 80px ${color}, 0 0 120px ${color}`;
}

function initializeColorTime(element, timeout){
    setInterval(() => {
        toneTextColor(element);
    }, timeout);
}


// handle touch start and end, and measure distance
let touchStartX = null;
let touchStartY = null;
let touchEndX = null;
let isDragging = false;

let mouseStartX = null;
let currentMouseX = null;
let isMouseDragging = false;

let holdTimer = null;
let isHolding = false;

let correctColor = '#8cffcf';
correctColor = '#82eba2';
let incorrectColor = '#ff4f20';
incorrectColor = '#e62300';
let neutralColor = 'rgba(255, 255, 255, .0)';

let hanziBlack = '#000000';
let hanziWhite = '#ffffff';

let neutralBorderStyle = "2px dashed #00000000";
// neutralBorderStyle = "2px dashed #000000";
let neutralBackgroundColor = "#ffffff";
let neutralPadding = "40px";
let correctBorderStyle = '20px solid #82eba277';
let incorrectBorderStyle = '20px solid #e6230077';
let incorrectBackgroundColor = '#f54c57';
let correctBackgroundColor = '#82eba2';

let keyIsDown = false;
let borderLock = false;

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' || event.keyCode === 32 || event.key.toLowerCase() === 'x') {
        event.preventDefault();
    }
    if (keyIsDown) {
        return;
    }

    const flashcard = document.getElementById('flashcard_container');
    const flashcard_hsk = document.getElementById('flashcard_hsk');

    keyIsDown = true;

    if (!showingAnswer) {
        showingAnswer = true;
        displayCard(true, true);
        let chars = document.querySelectorAll('.clickable-char');
        chars.forEach((char) => {
            toneTextColor(char);
        });
        return;
    }
    else if ((event.code === 'Space' || event.keyCode === 32 || event.key.toLowerCase() === 'x') && showingAnswer) {
        event.preventDefault();
        
        const isCorrect = event.key.toLowerCase() !== 'x';
        
        // flashcard.style.border = isCorrect ? correctBorderStyle : incorrectBorderStyle;
        // flashcard.style.padding = '22px';
        // flashcard_hsk.style.padding = "4px";
        // flashcard.style.background = isCorrect ? correctBackgroundColor : incorrectBackgroundColor;

        
        indicator.style.borderColor = isCorrect ? correctBackgroundColor : incorrectBackgroundColor;

        setTimeout(() => {
            recordAnswer(isCorrect);
            // renderBorder();
            // flashcard.style.border = neutralBorderStyle;
            // flashcard.style.padding = neutralPadding;
            // flashcard_hsk.style.padding = "22px";
            indicator.style.borderColor = neutralColor;
        }, 170); // Increased to 1 second for visibility
    }
}, false);

document.addEventListener('keyup', function(event) {
    keyIsDown = false;
});


// Add a keyup event listener to reset the keyIsDown flag
document.addEventListener('keyup', function(event) {
    keyIsDown = false;
}, false);




// document.addEventListener('keydown', function(event) {
//     // Check if the pressed key is the space bar
//     if ((event.code === 'Space' || event.keyCode === 32 || event.key.toLowerCase() === 'x')) {
//         event.preventDefault();
//     }

//     if(isHolding)
//         return;

//     if(!showingAnswer){
//         showingAnswer = true;
//         displayCard(true, true);
//         let chars = document.querySelectorAll('.clickable-char');
//         chars.forEach((char) => {
//             toneTextColor(char);
//         });
//         return;
//     }
//     else if ((event.code === 'Space' || event.keyCode === 32 || event.key.toLowerCase() === 'x') && showingAnswer) {
//         event.preventDefault();
//         const flashcard = document.getElementById('flashcard_container');
//         const hanzi = document.getElementById('flashcard_character');
//         isHolding = true;
//         indicator.style.borderColor = correctColor;
//         if(event.key.toLowerCase() === 'x'){
//             indicator.style.borderColor = incorrectColor;
//         }

//         holdTimer = setTimeout(() => {
//             if(event.key.toLowerCase() === 'x'){
//                 recordAnswer(false);
//             }
//             else{
//                 recordAnswer(true);
//             }
//             indicator.style.borderColor = neutralColor;
//         }, 200);   
//     }
// }, false);


// Add a corresponding keyup listener to handle key release
document.addEventListener('keyup', function(event) {
    if ((event.code === 'Space' || event.keyCode === 32 || event.key.toLowerCase() === 'x') && isHolding) {
        isHolding = false;
        clearTimeout(holdTimer);
        indicator.style.borderColor = neutralColor;
    }
}, false);

let clickStartTime;
let tmout = null;


function recordAnswer(isCorrect, func=null) {
    fetch(`./api/record_answer?character=${encodeURIComponent(currentCharacter)}&correct=${isCorrect}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
    getNextCard(func);
}

document.getElementById('flashcard_container').addEventListener('mousedown', function(event) {
    const flashcard = document.getElementById('flashcard_container');
    const flashcard_hsk = document.getElementById('flashcard_hsk');
    isHolding = true;
    clickStartTime = new Date().getTime();

    if(!showingAnswer){
        showingAnswer = true;
        displayCard(true, true);
        
        let chars = document.querySelectorAll('.clickable-char');
        chars.forEach((char) => {
            toneTextColor(char);
        });
    }
    tmout = setTimeout(() => {
        // indicator.style.borderColor = incorrectColor;
        if(event.clientX > window.innerWidth/2){
            // indicator.style.borderColor = correctColor;
        }

        // let hanzichars = document.getElementById('flashcard_character').querySelectorAll('.clickable-char');
        // hanzichars.forEach((element) => {
        //     element.style.color = hanziWhite;
        //     element.style.transition = 'color 0.5s';
        // });
        tmout = null;
    }, 100);
    
    holdTimer = setTimeout(() => {
        // if(event.clientX < window.innerWidth/2){
        //     recordAnswer(false);
        // }
        // else{
        //     recordAnswer(true);
        // }
        
        const isCorrect = event.clientX > window.innerWidth/2;
        
        // flashcard.style.border = isCorrect ? correctBorderStyle : incorrectBorderStyle;
        // flashcard.style.padding = '22px';
        // flashcard_hsk.style.padding = "4px";
        
        // flashcard.style.background = isCorrect ? correctBackgroundColor : incorrectBackgroundColor;
        indicator.style.borderColor = isCorrect ? correctBackgroundColor : incorrectBackgroundColor;

        // renderBorder();
        recordAnswer(isCorrect);
        setTimeout(() => {
            // flashcard.style.border = neutralBorderStyle;
            // flashcard.style.padding = neutralPadding;
            indicator.style.borderColor = neutralColor;
            // flashcard_hsk.style.padding = "22px";
        }, 300); // Increased to 1 second for visibility

        isHolding = false;
        // let hanzichars = document.getElementById('flashcard_character').querySelectorAll('.clickable-char');
        // hanzichars.forEach((element) => {
        //     element.style.color = hanziBlack;
        //     element.style.transition = 'color 0.5s';
        // });
    }, 200);
}, false);

document.getElementById('flashcard_container').addEventListener('mouseup', function(event) {
    const flashcard = document.getElementById('flashcard_container');
    const clickDuration = new Date().getTime() - clickStartTime;
    
    if(isHolding){
        clearTimeout(holdTimer);
    }

    if(tmout){
        clearTimeout(tmout);
    }
    
    if(clickDuration < 100) { // Short click (less than 500ms)
        // if(!showingAnswer){
        //     showingAnswer = true;
        //     displayCard(true, true);
            
        //     let chars = document.querySelectorAll('.clickable-char');
        //     chars.forEach((char) => {
        //         toneTextColor(char);
        //     });
        // }
    }
    
    console.log("mouse up");
    indicator.style.borderColor = neutralColor;
    isHolding = false;
}, false);


let isScrolling = false;
const DRAG_THRESHOLD = 10; // pixels

document.getElementById('flashcard_container').addEventListener('touchstart', function(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    isDragging = false;
    recordLock = false;
    isScrolling = false;
}, { passive: true });

let lasttouchX = 0;
document.getElementById('flashcard_container').addEventListener('touchmove', function(event) {
    if (isScrolling) return; // If we've determined it's a scroll, do nothing
    
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;
    const deltaX = touchX - touchStartX;
    const deltaY = touchY - touchStartY;

    lasttouchX = touchX;
    
    if (!isDragging) {
        // Determine if it's a drag or scroll based on initial movement
        if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                isScrolling = true;
                return; // Allow default scrolling behavior
            } else {
                isDragging = true;
                event.preventDefault(); // Prevent scrolling for horizontal drags
            }
        } else {
            return; // Wait until we've moved enough to decide
        }
    }
    
    if (isDragging) {
        event.preventDefault();
        handleTouchMove(deltaX);
    }
}, { passive: false });

document.getElementById('flashcard_container').addEventListener('touchend', function(event) {
    if (isDragging) {
        handleTouchEnd();
    }
    isDragging = false;
    isScrolling = false;
}, false);


function sendlogtoflask(string1, string2=null, string3=null, string4=null){
    let alls = string1;
    if(string2){
        alls += ", " + string2;
    }
    if(string3){
        alls += ", " + string3;
    }
    if(string4){
        alls += ", " + string4;
    }
    fetch('./log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({"log": alls }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        console.log('Log sent successfully');
    })
    .catch(error => {
        console.error('There was a problem sending the log:', error);
    });
}

let recordLock = false;
function handleTouchMove(dragDistance){
    const screenwidth = window.innerWidth;
    const percentage = dragDistance/screenwidth;
    const apercentage = Math.abs(percentage);

    const flashcard = document.getElementById('flashcard_container');
    
    const rect = flashcard.getBoundingClientRect();
    const fwidth = rect.width;
    const fheight = rect.height;
    const fcenterX = rect.left + fwidth / 2;
    const fcenterY = rect.top + fheight / 2;
    const fbottom = rect.bottom;
    const ftop = rect.top;

    if(isIPhone()){
        flashcard.style.transform = `translate(${dragDistance}px) translateY(8%) rotate(${dragDistance/10}deg)`;
    }
    else{
        flashcard.style.transform = `translate(${dragDistance}px) rotate(${dragDistance/10}deg)`;
    }

    const dim = Math.max(0, 255-apercentage*255);
    if(percentage > 0){
        indicator.style.borderColor = `rgb(${dim}, 255, ${dim})`;
        indicator.style.borderColor = correctBackgroundColor;
    }
    else {
        indicator.style.borderColor = `rgb(255, ${dim}, ${dim})`;
        indicator.style.borderColor = incorrectBackgroundColor;
    }

    let threshold = 0.3;
    if(isIPhone()){
        threshold = 0.45;
    }
    if(isiPad()){
        threshold = 0.18;
    }
    if(apercentage > threshold && recordLock === false){
        if(dragDistance > 0){
            // renderBorder();
            recordAnswer(true);
        }
        else{
            // renderBorder();
            recordAnswer(false);
        }
        touchStartX = null;
        touchStartY = null;
        currentTouchX = null;
        isDragging = false;
        mouseStartX = null;
        currentMouseX = null;
        recordLock = true;
        isMouseDragging = false;
        flashcard.style.transform = isIPhone() ? 'translateY(8%)' : 'translateY(0%)';
        indicator.style.borderColor = neutralColor;
        const canvas = document.getElementById('backgroundCanvas');
        // bordercanvas.style.transform = isIPhone() ? 'translateY(0%)' : 'translateY(0%)';
    }
}

function handleTouchEnd(){

    const deltaX = lasttouchX - touchStartX;
    
    if(recordLock === false && Math.abs(deltaX) > 100){
        if(deltaX > 0){
            recordAnswer(true);
        }
        else{
            recordAnswer(false);
        }
    }

    touchStartX = null;
    currentTouchX = null;
    isDragging = false;
    mouseStartX = null;
    currentMouseX = null;
    isMouseDragging = false;
    
    const flashcard = document.getElementById('flashcard_container');
    flashcard.style.transform = isIPhone() ? 'translateY(8%)' : 'translateY(0%)';
    indicator.style.borderColor = neutralColor;
    const canvas = document.getElementById('backgroundCanvas');
    // bordercanvas.style.transform = isIPhone() ? 'translateY(0%)' : 'translateY(0%)';
}


function displayChoices() {
    const container = document.getElementById('choicesContainer');
    const correctButton = document.getElementById('correctButton');
    const incorrectButton = document.getElementById('incorrectButton');

    correctButton.onclick = () => console.log('Correct clicked');
    incorrectButton.onclick = () => console.log('Incorrect clicked');

    container.style.display = 'flex';
}

function hideChoices() {
    const container = document.getElementById('choicesContainer');
    container.style.display = 'none';
}

function fetchCard() {
    return fetch(`./get_card_data`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
}

let alertMessage = 'hello';

function increaseNewCardCount(){
    prefetchedCard = null;
    fetch(`./increase_max_cards`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        getNextCard();
        return response.json();
    })
    .then(() => {
        
    })
    .catch((error) => {
        
    });

}


function showCustomPrompt(message) {
    // Create the prompt container
    let flashcard = document.getElementById('flashcard_container');
    flashcard.style.display = 'none';

    const promptContainer = document.createElement('div');
    promptContainer.id = 'prompt-container';
    promptContainer.innerHTML = `
        <p id="prompt-text">${message}</p>
        <div id="button-container">
            <button id="yes-button">Add more</button>
            <button id="no-button">Review</button>
        </div>
    `;

    document.body.appendChild(promptContainer);
    document.getElementById('yes-button').addEventListener('click', function() {
        increaseNewCardCount();
        promptContainer.remove();
    });
    
    document.getElementById('no-button').addEventListener('click', function() {
        getNextCard();
        promptContainer.remove();
    });
}


function getNextCard(func=null) {
    if (prefetchedCard && !(prefetchedCard.message && prefetchedCard.message.length > 0)) {
        console.log('Using prefetched card:', prefetchedCard);
        showingAnswer = false;
        currentCharacter = prefetchedCard.character;
        // prefetchedCard.plotters.forEach((plotter) => {
        //     plotter.draw();
        // });
        
        const chars = prefetchedCard.character.split('');
        const pinyin = prefetchedCard.pinyin;

        let pinyin_split = "";
        const toneMarks = ['ā', 'ē', 'ī', 'ō', 'ū', 'ǖ', 'á', 'é', 'í', 'ó', 'ú', 'ǘ', 'ǎ', 'ě', 'ǐ', 'ǒ', 'ǔ', 'ǚ', 'à', 'è', 'ì', 'ò', 'ù', 'ǜ'];
        for (let i = 0; i < pinyin.length; i++) {
            let flag = false;
            for (let j = 0; j < toneMarks.length; j++) {
                if (pinyin[i] === toneMarks[j]) {
                    flag = true;
                    break;
                }
            }
            if (!flag) {
                pinyin_split += pinyin[i];
            }
            else {
                pinyin_split += pinyin[i] + "_";
            }
        }
        let pinyin_split_list = pinyin_split.split("_");
        let pparts = [];

        chars.forEach((char, index) => {
            let pinyin_part = pinyin_split_list[index];
            pparts.push(pinyin_part);
        });
        renderPlotters(prefetchedCard.plotters, pparts)
        if(prefetchedCard.message && prefetchedCard.message.length > 0){
            // let promptMessage = "";
            // if(prefetchedCard.message === "message_1"){
            //     promptMessage = "You have only 1 due card. <br> <span style=\"color:#000000;\">Do you want to add more new cards, or keep reviewing today's cards?</span>";
            // }
            // else if(prefetchedCard.message === "message_2"){
            //     promptMessage = "No more due cards. <br> <span style=\"color:#000000;\">Do you want to add more new cards, or keep reviewing today's cards?</span>";
            // }

            // if (promptMessage) {
            //     showCustomPrompt(promptMessage);
            // }
        }
        else{
            renderCardData(prefetchedCard);
            displayCard(false, false);
            console.log('ooovo')
        }
        if (func) {
            func();
        }
        prefetchedCard = null;
        prefetchNextCard();
        // toggleInvertAllElements();
        // toggleInvertAllElements();
    } else {
        console.log('Fetching new card');
        fetchCard()
            .then(data => {
                data.plotters = createPlotters(data);
                showingAnswer = false;
                currentCharacter = data.character;
                if(data.message && data.message.length > 0){
                    getNextCard();
                    // let promptMessage = "";
                    // if(data.message === "message_1"){
                    //     promptMessage = "You have only 1 due card and no new cards. <br> <span style=\"color:#000000;\">Do you want to add more new cards, or keep reviewing today's cards?</span>";
                    // }
                    // else if(data.message === "message_2"){
                    //     promptMessage = "No more due cards. <br> <span style=\"color:#000000;\">Do you want to add more new cards, or keep reviewing today's cards?</span>";
                    // }

                    // if (promptMessage) {
                    //     showCustomPrompt(promptMessage);
                    // }
                }
                else{
                    renderCardData(data);
                    displayCard(false, false);
                }
                if (func) {
                    func();
                }
                prefetchNextCard();
                // toggleInvertAllElements();
                // toggleInvertAllElements();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            document.getElementById('flashcard_character').textContent = 'Error loading card';
        });
    }
    document.getElementById('flashcard_container').scrollTop = 0;
    hideChoices();
}

function prefetchNextCard() {
    fetchCard()
        .then(data => {
            prefetchedCard = data;
            prefetchedCard.plotters = createPlotters(data);
            console.log(prefetchedCard.plotters)
            console.log('Prefetched next card:', data.character);
        })
        .catch(error => {
            console.error('Error prefetching next card:', error);
        });
}



function isTouchDevice() {
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
}

function isiPad() {
    return /Macintosh/i.test(navigator.userAgent) && isTouchDevice();
}

function isMobileOrTablet() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check || /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

if(isMobileOrTablet()){
    document.getElementById('flashcard_container').addEventListener('click', function(event) {
        if (event.target.closest('.flashcard_character')) {
            return;
        }
        if (event.target.closest('.flashcard_character')) {
            return;
        }

        if (!event.target.classList.contains('clickable-char') && 
            !event.target.closest('#flashcard_stroke_wrapper')) {
            // advanceCardState(event);
        }
    });

    // Add this event listener to prevent clicks on characters from propagating
    document.getElementById('flashcard_character').addEventListener('click', function(event) {
        event.stopPropagation();
    });
}

function handleOrientationChange() {
    const container = document.getElementById('flashcard_container');
    if (window.matchMedia("(min-device-width: 768px) and (max-device-width: 1024px)").matches) {
        if (window.orientation === 90 || window.orientation === -90) {
            // Landscape
            container.style.width = '90%';
            container.style.height = '80vh';
            container.style.maxHeight = '80vh';
            container.style.marginBottom = '20px';
        } else {
            // Portrait
            container.style.width = '90%';
            container.style.height = '80%';
            container.style.maxHeight = '';
            container.style.marginBottom = '';
        }
    }
}

window.addEventListener('orientationchange', handleOrientationChange);
window.addEventListener('resize', handleOrientationChange);


function playHanziAudio() {
    const pinyinElement = document.getElementById('flashcard_pinyin');
    const encodedHanzi = encodeURIComponent(pinyinElement.dataset.characters);
    const audio = new Audio(`./api/get_audio?chars=${encodedHanzi}`);
    
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
    });
}

function isIPhone(){
    const ua = navigator.userAgent;
    if (ua.includes('iPhone')) {
        return true;
    }
    return false;
}

function isiPad(){
    const ua = navigator.userAgent;
    if (ua.includes('iPad')) {
        return true;
    }
    return false;
}

function isLandscape(){
    return window.innerHeight > window.innerWidth;
}

const fontMap = {
    "Noto Sans Mono": { family: "Noto Sans Mono", size: 22 },
    "Noto Serif SC": { family: "Noto Serif SC", size: 22 },
    "Kaiti": { family: "Kaiti", size: 26 }
};

let currentToggleFont = 0;
function changeFont(font) {
    const characterDiv = document.getElementById('flashcard_character');
    const plotterDiv = document.getElementById('flashcard_plotter');
    console.log("calling change font")
    if(font === 'Render'){
        characterDiv.style.display = 'none';
        plotterDiv.style.display = 'block';
        currentToggleFont = 3;
        return;
    }
    else{
        let fontMapKeys = Object.keys(fontMap);
        currentToggleFont = fontMapKeys.indexOf(font);
        characterDiv.style.display = 'block';
        // plotterDiv.style.display = 'none';
        if(font === 'Noto Serif SC'){
            console.log('changing font to', `"${font}", serif`);
            document.getElementById('flashcard_character').style.fontFamily = `"${font}"`;
        } else{
            document.getElementById('flashcard_character').style.fontFamily = `"${font}", sans-serif`;
        }
    }
    const fontInfo = fontMap[font];
    console.log(fontInfo)
    
    if (fontInfo) {
        currentFont = font;
        adjustFlashCardChars();
        console.log('selected font', currentFont);
    }

    fetch(`./api/change_font?font=${font}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        console.log('Font changed successfully');
    })
    .catch(error => {
        console.error('There was a problem changing the font:', error);
    });
}


document.addEventListener('DOMContentLoaded', function() {
    body = document.getElementById('body');
    indicator = document.getElementById('indicator');
    
    // getDeck(getNextCard);
    currentDeck = inputdeck;
    
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('deck', currentDeck);
    history.pushState({}, '', newUrl);

    document.querySelectorAll('.deck-option').forEach(opt => opt.classList.remove('selected-option'));
    document.querySelector(`.deck-option[data-deck="${currentDeck}"]`).classList.add('selected-option');
    changeDeck(currentDeck);
    getNextCard();
    getFont();
    adjustFlashCardChars();
    handleOrientationChange(); // Call this on initial load
    // setupBackgroundCanvas();
    // renderBorder();

    const flashcard = document.getElementById('flashcard_container');
    if(isMobileOrTablet()){
        flashcard.style.transition = 'transform 0.2s, background-color 0.0s';
    }

    // flashcard.style.backgroundColor = neutralColor;
    indicator.style.borderColor = neutralBorderStyle;
    // flashcard.style.border = neutralBorderStyle;

    const pinyinElement = document.getElementById('flashcard_pinyin');
    pinyinElement.addEventListener('click', function() {
        playHanziAudio();
    });

    if(!(isiPad() || isIPhone())){
        // document.getElementById('space-instruction').style.opacity = 1;
        // document.getElementById('space-instruction').style.transition = 'opacity 4s ease-out';
        // messageTimeout = setTimeout(() => {
        //     document.getElementById('space-instruction').style.opacity = 0;
        // }, 2000);
    }
    else {
    }

    document.querySelectorAll('.deck-option').forEach(function(deckOption) {
        deckOption.addEventListener('click', function(e) {
            currentDeck = this.getAttribute('data-deck');

            // Change deck
            
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('deck', currentDeck);
            history.pushState({}, '', newUrl);

            prefetchedCard = null;
            changeDeck(currentDeck, getNextCard);
            console.log("deck changed", currentDeck);

            // Update highlighting
            document.querySelectorAll('.deck-option').forEach(opt => opt.classList.remove('selected-option'));
            this.classList.add('selected-option');

            // Close dropdown
            document.getElementById('dropdownMenu').style.display = 'none';
            var menu = document.getElementById('dropdownMenu');
            menu.style.display = 'none';
        });
    });

    
});


// function changeDeck(deck, func=getNextCard) {
//     fetch(`./api/change_deck?deck=${deck}`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error('Network response was not ok');
//         }
//         console.log('Deck changed successfully');
//         prefetchedCard = null;
//         getNextCard();
//     })
//     .catch(error => {
//         console.error('There was a problem changing the deck:', error);
//     });
// }

// document.getElementById('space-instruction').addEventListener('click', function(e) {
//     e.stopPropagation();
//     var elementBelow = document.elementFromPoint(e.clientX, e.clientY);
//     if (elementBelow) {
//         elementBelow.click();
//     }
// }, true);