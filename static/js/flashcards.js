let currentCard = null;
let showingAnswer = false;
let currentDeck = 'shas';
let currentFont = 'Noto Sans Mono';
let prefetchedCard = null;
let pinyinRevealed = false;
let messageTimeout = null;

function displayCard(showAnswer, showPinyin = false) {
    const flashcardElement = document.querySelector('.flashcard');
    const englishElement = document.querySelector('.english');
    const pinyinElement = document.querySelector('.pinyin');

    pinyinElement.classList.toggle('visible', showPinyin || showAnswer);
    pinyinRevealed = showPinyin || showAnswer;

    flashcardElement.style.visibility = showAnswer ? 'visible' : 'hidden';
    englishElement.style.visibility = showAnswer ? 'visible' : 'hidden';
}

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

    console.log("pinnn", element.dataset.pinyin);
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

function displayCardData(data) {
    const container = document.getElementById('flashcard_container');
    const characterElement = container.querySelector('.character');
    characterElement.innerHTML = ''; // Clear existing content

    // Split the character string into individual characters
    const chars = data.character.split('');
    const pinyin = data.pinyin;

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
    console.log("pinyin_split", pinyin_split);
    console.log("pinyin_split_list", pinyin_split_list);
    // Create clickable spans for each character
    chars.forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.dataset.char = char;
        span.className = 'clickable-char';

        let pinyin_part = pinyin_split_list[index];
        console.log("pinyin_part", pinyin_part);


        span.dataset.pinyin = pinyin_part;
        if(isMobileOrTablet()){
            span.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent triggering the change event
                window.location.href = `./search?query=${encodeURIComponent(char)}`;
            });
            span.style.hover = 'color: #ffd91c';
            // span.style.cursor = 'pointer';
        }
        characterElement.appendChild(span);
        console.log("span", span);

        //toneTextColor(span)
        span.style.transition = 'text-shadow 0.05s';
        span.style.textShadow = 'none'; 
        //initializeColorTime(span, 44);
    });

    container.querySelector('.pinyin').textContent = data.pinyin;
    container.querySelector('.pinyin').dataset.characters = data.character;
    container.querySelector('.english').textContent = data.english;
    container.querySelector('.flashcard').innerHTML = data.html;

    if (chars.length < 4) {
        const strokesContainer = document.createElement('div');
        strokesContainer.className = 'strokes-container';
        container.querySelector('.flashcard').appendChild(strokesContainer);

        let writers = [];
        chars.forEach((char, i) => {
            const strokeWrapper = document.createElement('div');
            strokeWrapper.style.position = 'relative';
            strokeWrapper.className = 'stroke-wrapper';
            strokesContainer.appendChild(strokeWrapper);

            let writerSize = chars.length === 1 ? 150 : 150;
            if(screen.width < 768 && chars.length === 3){
                writerSize = 90;
            }

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", writerSize);
            svg.setAttribute("height", writerSize);
            svg.setAttribute("id", `grid-background-${i}`);
            const dashSize = Math.max(2, Math.floor(writerSize / 25)); // Adjust the divisor as needed
            const dashPattern = `${dashSize},${dashSize}`;

            svg.innerHTML = `
                <rect x="0" y="0" width="${writerSize}" height="${writerSize}" fill="none" stroke="#AAA" stroke-dasharray="${dashPattern}" />
                <line x1="0" y1="0" x2="${writerSize}" y2="${writerSize}" stroke="#AAA" stroke-dasharray="${dashPattern}" />
                <line x1="${writerSize}" y1="0" x2="0" y2="${writerSize}" stroke="#AAA" stroke-dasharray="${dashPattern}" />
                <line x1="${writerSize/2}" y1="0" x2="${writerSize/2}" y2="${writerSize}" stroke="#AAA" stroke-dasharray="${dashPattern}" />
                <line x1="0" y1="${writerSize/2}" x2="${writerSize}" y2="${writerSize/2}" stroke="#AAA" stroke-dasharray="${dashPattern}" />
            `;

            strokeWrapper.appendChild(svg);

            const writer = HanziWriter.create(`grid-background-${i}`, char, {
                width: writerSize,
                height: writerSize,
                padding: 5,
                strokeColor: '#000000',
                strokeAnimationSpeed: 1,
                delayBetweenStrokes: 220,
                radicalColor: '#ff0000'
            });

            strokeWrapper.addEventListener('click', function() {
                writer.animateCharacter();
            });
            writers.push(writer);
        });
    }

    currentCard = data.character;
    showingAnswer = false;
    displayCard(false);

    container.scrollTop = 0;
}

function change(event) {
    const target = event.target;

    if (target.classList.contains('clickable-char')) {
        return; // Do nothing for clicks on characters
    }
    if (target.classList.contains('pinyin')) {
        if (!showingAnswer) {
            pinyinRevealed = !pinyinRevealed;
            displayCard(false, pinyinRevealed);
        }
        return;
    }

    // Remove this check, as we're now using stopPropagation on the stroke-wrapper
    // if (target.closest('.strokes-container')) {
    //     return;
    // }

    if (!currentCard || showingAnswer) {
        getNextCard();
    } else {
        displayCard(true);
        showingAnswer = true;
        
        document.querySelectorAll('.clickable-char').forEach((char) => {
            toneTextColor(char);
        });
        recordView(currentCard);
    }

    // Scroll to the top of the container
    document.getElementById('flashcard_container').scrollTop = 0;
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

function getNextCard() {
    if (prefetchedCard) {
        displayCardData(prefetchedCard);
        prefetchedCard = null;
        prefetchNextCard();
    } else {
        fetchCard()
            .then(data => {
                displayCardData(data);
                prefetchNextCard();
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                document.querySelector('.character').textContent = 'Error loading card';
            });
    }
}

function prefetchNextCard() {
    fetchCard()
        .then(data => {
            prefetchedCard = data;
        })
        .catch(error => {
            console.error('Error prefetching next card:', error);
        });
}


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
        prefetchedCard = null;
        getNextCard();
    })
    .catch(error => {
        console.error('There was a problem changing the deck:', error);
    });
}



function getDeck() {
    fetch('./get_deck')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            currentDeck = data.deck;
            document.getElementById('deck-select').value = currentDeck;
            getNextCard();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}


function changeFont(font) {
    fetch(`./change_font?font=${font}`, {
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

function getFont() {
    fetch('./get_font')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            currentFont = data.font;
            console.log('received font', currentFont);
            document.getElementById('font-select').value = currentFont;
            document.querySelector('.character').style.fontFamily = `"${currentFont}", sans-serif`;
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}


// function recordView(character) {
//     fetch('./ ', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ character: character }),
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error('Network response was not ok');
//         }
//         return response.json();
//     })
//     .then(data => {
//         console.log(data.message);
//     })
//     .catch(error => {
//         console.error('There was a problem with the fetch operation:', error);
//     });
// }

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
        if (event.target.closest('.character')) {
            return;
        }
        if (event.target.closest('.character')) {
            return;
        }

        if (!event.target.classList.contains('clickable-char') && 
            !event.target.closest('#font-select') && 
            !event.target.closest('.stroke-wrapper') && 
            !event.target.closest('#deck-select')) {
            change(event);
        }
    });

    // Add this event listener to prevent clicks on characters from propagating
    document.querySelector('.character').addEventListener('click', function(event) {
        event.stopPropagation();
    });
}



document.addEventListener('keydown', function(event) {
    if(!chatOpened){
        if (event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            change(event);
    
            if(messageTimeout){
                clearTimeout(messageTimeout);
                document.getElementById('space-instruction').style.opacity = 0;
                document.getElementById('space-instruction').style.transition = 'none';
            }
        }
    }
});

document.getElementById('deck-select').addEventListener('change', function(event) {
    currentDeck = event.target.value;
    changeDeck(currentDeck);
    this.blur();
});

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
    console.log(pinyinElement);
    const encodedHanzi = encodeURIComponent(pinyinElement.dataset.characters);
    const audio = new Audio(`./get_audio?chars=${encodedHanzi}`);
    
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    getDeck();
    getFont();
    handleOrientationChange(); // Call this on initial load
    
    const pinyinElement = document.getElementById('flashcard_pinyin');
    pinyinElement.addEventListener('click', function() {
        playHanziAudio();
    });

    if(!isMobileOrTablet()){
        document.getElementById('space-instruction').style.opacity = 1;
        document.getElementById('space-instruction').style.transition = 'opacity 4s ease-out';
        messageTimeout = setTimeout(() => {
            document.getElementById('space-instruction').style.opacity = 0;
        }, 2000);
    }
});

document.getElementById('font-select').addEventListener('change', function(event) {
    const selectedFont = event.target.value;
    document.querySelector('.character').style.fontFamily = `"${selectedFont}", sans-serif`;
    currentFont = event.target.value;
    changeFont(currentFont);
    this.blur();
});

// document.getElementById('space-instruction').addEventListener('click', function(e) {
//     e.stopPropagation();
//     var elementBelow = document.elementFromPoint(e.clientX, e.clientY);
//     if (elementBelow) {
//         elementBelow.click();
//     }
// }, true);