const grid = document.getElementById('character-grid');
const overlay = document.getElementById('flashcard-overlay');
const flashcardContent = document.getElementById('flashcard_container');
const messageElement = document.getElementById('message');

let currentDeck = 'shas';
let isAnswerVisible = false;
let currentFont = 'Noto Sans Mono';

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

let showList = false;

let typingTimer = null;
let inputString = '';

function cleanString(str) {
    return str.toLowerCase()
            .replace(/[.,;?!'"()\s]/g, '') // Remove punctuation and spaces
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
}

function removeTones(pinyin) {
    const toneMap = {
        'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
        'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
        'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
        'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
        'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
        'ǖ': 'ü', 'ǘ': 'ü', 'ǚ': 'ü', 'ǜ': 'ü'
    };

    return pinyin.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, match => toneMap[match] || match);
}


let typedDisplay = document.getElementById('typedDisplay');


document.addEventListener('keydown', function(event) {

    if(event.key === 'Escape') {
        drawBothLayouts(currentData);
        typedDisplay.style.display = 'none';
        return;
    }

    if (event.key.length === 1) {
        inputString += event.key;
        
        // Update and show the typed display
        typedDisplay.textContent = inputString;
        typedDisplay.style.display = 'block';

        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            if (inputString === '') {
                typedDisplay.style.display = 'none';
                return;
            }
            else if (inputString === ' ') {
                drawBothLayouts(currentData);
                typedDisplay.style.display = 'none';
                return
            }
            else{
                let filteredData = {};
                filteredData.characters = currentData.characters.filter(char => {
                    const cleanedInput = cleanString(inputString);
                    const cleanedPinyin = cleanString(removeTones(char.pinyin));
                    const cleanedEnglish = cleanString(char.english);

                    return cleanedPinyin.includes(cleanedInput) || cleanedEnglish.includes(cleanedInput);
                });
                drawBothLayouts(filteredData, true);
                
                console.log(inputString);
                inputString = '';
                document.getElementById('deck-select').value = null;
                
                // Hide the typed display
                typedDisplay.style.display = 'none';
            }
        }, 455);
    }
});

// Add this to handle backspace
document.addEventListener('keydown', function(event) {
    if (event.key === 'Backspace') {
        inputString = inputString.slice(0, -1);
        typedDisplay.textContent = inputString;
        if (inputString === '') {
            typedDisplay.style.display = 'none';
        }
    }
});


function toggleGridList(){
    if(showList){
        showList = false;
        document.getElementById('grid-cont').style.display = 'block';
        document.getElementById('lcontainer').style.display = 'none';
    } else {
        document.getElementById('lcontainer').style.display = 'block';
        document.getElementById('grid-cont').style.display = 'none';
        if(window.innerWidth / window.innerHeight > 16/9){
        }
        showList = true;
    }
}

let charCounter = 0;
function createGrid(characters, useAllDecks){
    const grid = document.getElementById('character-grid');
    grid.innerHTML = '';
    charCounter = 0;
    characters.forEach(charData => {
        if (charData.deck !== currentDeck && !useAllDecks) {
            return;
        }
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.innerHTML = `
            <span class="char">${charData.character}</span>
            <span class="grid-pinyin">${charData.pinyin}</span>
        `;
        gridItem.setAttribute('data-length', charData.character.length);
        gridItem.addEventListener('click', () => showFlashcard(charData.character));
        grid.appendChild(gridItem);
        charCounter++;
    });

    updateCounterTitle();
}

function updateCounterTitle(){
    document.getElementById('title').textContent = `grid (${charCounter})`;
    
    // const namesmap = {
    //     'shas': 'ShaSha\'s Class',
    //     'top140': 'Top 140',
    //     'hsk1': 'HSK 1',
    //     'hsk2': 'HSK 2',
    //     'hsk3': 'HSK 3',
    //     'hsk4': 'HSK 4',
    //     'hsk5': 'HSK 5',
    //     'hsk6': 'HSK 6',
    // };
    // const deckLength = charCounter;
    // document.getElementById('title').textContent = `${namesmap[currentDeck]} (${deckLength} words)`;  
    // if(useAllDecks){
    //     document.getElementById('title').textContent = `${deckLength} words`;  
    // }
    // else{
    //     document.getElementById('title').textContent = `${namesmap[currentDeck]} (${deckLength} words)`;
    // }
}

function createLists(characters, useAllDecks) {
    const container = document.getElementById('lcontainer'); // Assume there's a container div in your HTML
    container.innerHTML = ''; // Clear existing content
    const gridWrapper = document.createElement('div');
    gridWrapper.id = 'lgrid-wrapper';
    gridWrapper.className = 'lgrid-wrapper';
    container.appendChild(gridWrapper);

    gridWrapper.innerHTML = ''; // Clear existing items
    characters.forEach((charData, idx) => {
        if (charData.deck !== currentDeck && !useAllDecks) {
            return;
        }
        const gridItem = createListItem(charData, idx);
        gridItem.className = 'lgrid-item';
        gridWrapper.appendChild(gridItem);
    });
}

function populateList(list, characters) {
    list.innerHTML = ''; // Clear existing items
    characters.forEach((char, idx) => {
        const listItem = createListItem(char, idx);
        list.appendChild(listItem);
    });
}

function createListItem(char, idx) {
    const item = document.createElement('div');
    item.className = 'pinyin-english-item';
    item.innerHTML = `
        <div class="char-pinyin-group">
            <div class="index-container">
                <span class="list-index">${idx + 1}.</span>
            </div>
            <span class=" list-character list-character-size">${char.character}</span>
            <span class="list-pinyin">${char.pinyin}</span>
        </div>
        <span class="list-english">${char.english}</span>
    `;
    item.addEventListener('click', () => showFlashcard(char.character));
    return item;
}

// Call this function when the page loads and on window resize



function showFlashcard(character) {
    messageElement.textContent = 'Loading...';
    fetch(`./get_card_data?character=${encodeURIComponent(character)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            showAfterLoad(data);

            recordView(character);
        })
        .catch(error => {
            console.error('Error:', error);
            messageElement.textContent = `Error: ${error.message}`;
        });
}

function showAfterLoad(data){
    const container = document.getElementById('flashcard_container');
    const characterElement = container.querySelector('.character');
    characterElement.innerHTML = ''; // Clear existing content
    characterElement.dataset.characters = data.character; // Clear existing content

    const newUrl = new URL(window.location);
    newUrl.searchParams.set('query', data.character);
    history.pushState({}, '', newUrl);

    
    document.getElementById('font-select').style.top = '15px';
    document.getElementById('font-select').style.marginTop = '0px';
    document.getElementById('deck-select').style.display = 'none';
    document.getElementById('deck-select').value = data.deck;


    // Split the character string into individual characters
    const chars = data.character.split('');
    
    // Create clickable spans for each character
    chars.forEach(char => {
        const span = document.createElement('span');
        span.textContent = char;
        span.className = 'clickable-char';
        span.style.cursor = 'pointer';
        span.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering the change event
            window.location.href = `./search?query=${encodeURIComponent(char)}`;
        });
        characterElement.appendChild(span);
        console.log(span);
    });
    const pinyinElement = document.getElementById('flashcard_pinyin');
    pinyinElement.dataset.characters = data.character;
    container.querySelector('.pinyin').textContent = data.pinyin;
    container.querySelector('.english').textContent = data.english;
    container.querySelector('.flashcard').innerHTML = data.html;
    if (chars.length < 4) {
        const strokesContainer = document.createElement('div');
        strokesContainer.className = 'strokes-container';
        document.querySelector('.flashcard').appendChild(strokesContainer);

        chars.forEach((char, i) => {
            const strokeWrapper = document.createElement('div');
            strokeWrapper.style.position = 'relative';
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
        });
    }

    overlay.style.display = 'flex';
    messageElement.textContent = '';
    isAnswerVisible = true;
    updateVisibility();
    
    // Scroll to the top of the flashcard content
    flashcardContent.scrollTop = 0;
}

function drawBothLayouts(data, useAllDecks=false){    
    createGrid(data.characters, useAllDecks);
    createLists(data.characters, useAllDecks);
}

let currentData = null;
let filteredData = null;

function loadCharacters() {
    drawBothLayouts(currentData);
    // fetch('./get_characters_pinyinenglish')
    //     .then(response => response.json())
    //     .then(data => {
    //         currentData = data;
    //         drawBothLayouts(data);
    //     })
    //     .catch(error => console.error('Error:', error))
    //     .finally(() => {
    //     });
}


function showInfo(gridItem) {
    gridItem.querySelector('.char').style.display = 'none';
    gridItem.querySelector('.hover-info').style.display = 'block';
}

function hideInfo(gridItem) {
    gridItem.querySelector('.char').style.display = 'block';
    gridItem.querySelector('.hover-info').style.display = 'none';
}


function showPinyin(gridItem, character) {
    const pinyinSpan = gridItem.querySelector('.pinyin');
    if (pinyinSpan.textContent === '') {
        fetch(`./get_pinyin?character=${encodeURIComponent(character)}`)
            .then(response => response.json())
            .then(data => {
                pinyinSpan.textContent = data.pinyin;
                gridItem.querySelector('.char').style.display = 'none';
                pinyinSpan.style.display = 'block';
            })
            .catch(error => console.error('Error:', error));
    } else {
        gridItem.querySelector('.char').style.display = 'none';
        pinyinSpan.style.display = 'block';
    }
}

function hidePinyin(gridItem) {
    gridItem.querySelector('.char').style.display = 'block';
    gridItem.querySelector('.pinyin').style.display = 'none';
}


document.getElementById('deck-select').addEventListener('change', function(event) {
    changeDeck(event.target.value);
    this.blur(); // Remove focus from the dropdown after selection
});

// Initial load of characters

function updateVisibility() {
    const pinyin = document.querySelector('.pinyin');
    const english = document.querySelector('.english');
    const flashcard = document.querySelector('.flashcard');

    if (isAnswerVisible) {
        pinyin.classList.add('visible');
        english.style.visibility = 'visible';
        flashcard.style.visibility = 'visible';
    } else {
        pinyin.classList.remove('visible');
        english.style.visibility = 'hidden';
        flashcard.style.visibility = 'hidden';
    }
}

/*document.addEventListener('keydown', (e) => {
    if (overlay.style.display === 'flex') {
        isAnswerVisible = !isAnswerVisible;
        updateVisibility();
    }
});*/

document.addEventListener('keydown', function(event) {
    if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault(); // Prevent default scrolling behavior
        // if (overlay.style.display === 'flex') {
        //     isAnswerVisible = !isAnswerVisible;
        //     updateVisibility();
        // }
    }
});

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


function changeDeck(deck) {
    currentDeck = deck;
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
    })
    .catch(error => {
        console.error('There was a problem changing the deck:', error);
    });
    const grid = document.getElementById('character-grid');
    grid.innerHTML = '';
    drawBothLayouts(currentData);
}


// if(isMobileOrTablet()){
//     document.addEventListener('click', function(event) {
//         if (!event.target.classList.contains('clickable-char')) {
//             change(event);
//         }
//     });
// }

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
            drawBothLayouts(currentData);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
        overlay.style.display = 'none';
        document.getElementById('font-select').style.top = '45px';
        document.getElementById('font-select').style.marginTop = '15px';
        document.getElementById('deck-select').style.display = 'block';
        
        // Remove the character parameter from the URL
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('query');
        history.pushState({}, '', newUrl);
    }
});


function playHanziAudio() {
    const pinyinElement = document.getElementById('flashcard_pinyin');
    const encodedHanzi = encodeURIComponent(pinyinElement.dataset.characters);
    const audio = new Audio(`./get_audio?chars=${encodedHanzi}`);
    
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
    });
}

function loadAllData(){
    fetch('./get_characters_pinyinenglish')
    .then(response => response.json())
    .then(data => {
        currentData = data;
        getDeck();
        getFont();
        handleOrientationChange();
    })
    .catch(error => console.error('Error:', error))
    .finally(() => {
    });
}

document.addEventListener('DOMContentLoaded', function() {
    
    loadAllData();


    const pinyinElement = document.getElementById('flashcard_pinyin');
    pinyinElement.addEventListener('click', function() {
        playHanziAudio();
    });
    
    const title = document.getElementById('title');
    title.addEventListener('click', function() {
        toggleGridList();
    });
    
    if(characterdata){
        showAfterLoad(characterdata);
    }
});


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
    fetch('./get_font', {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            cache: 'no-store'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            currentFont = data.font;
            console.log('received font', currentFont);

            updateFontFamily(currentFont);

            document.getElementById('font-select').value = currentFont;
            document.querySelector('.character').style.fontFamily = `"${currentFont}", sans-serif`;
            document.querySelector('.grid').style.fontFamily = `"${currentFont}", sans-serif`;
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
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

const fontMap = {
    "Noto Sans Mono": { family: "Noto Sans Mono", size: 22 },
    "Noto Serif SC": { family: "Noto Serif SC", size: 22 },
    "Kaiti": { family: "Kaiti", size: 26 }
};

function updateFontFamily(fontFamily) {
    const styleElement = document.getElementById('dynamic-styles');
    if (!styleElement) {
        console.error('Style element not found');
        return;
    }

    // Update or create the CSS rule
    styleElement.textContent = `
        .list-character {
            font-family: "${fontFamily}", sans-serif;
            padding-right: 15px;
        }
    `;
}

document.getElementById('font-select').addEventListener('change', function(event) {
    const selectedFont = event.target.value;
    const fontInfo = fontMap[selectedFont];
    
    if (fontInfo) {
        console.log(fontInfo.family)
        const grid = document.querySelector('.grid');
        grid.style.fontFamily = `"${fontInfo.family}", sans-serif`;
        
        // Set font size for grid items
        const gridItems = grid.querySelectorAll('.char');
        gridItems.forEach(item => {
            item.style.fontSize = `${fontInfo.size}px`;
        });
        
        const flashcardCharacter = document.querySelector('.character');
        flashcardCharacter.style.fontFamily = `"${fontInfo.family}", sans-serif`;

        updateFontFamily(fontInfo.family);
        
        // Also set font size for the character in the flashcard overlay
        // if (flashcardCharacter) {
        //     flashcardCharacter.style.fontSize = `${fontInfo.size * 2}px`; // Larger size for the flashcard
        // }
        
        currentFont = selectedFont;
        console.log('selected font', currentFont);
        changeFont(currentFont);
    }
    
    this.blur();
    event.stopPropagation();
});


overlay.addEventListener('click', (e) => {
    if (e.target === overlay && !e.target.closest('#font-select')) {
        overlay.style.display = 'none';
    }
});
