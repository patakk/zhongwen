const grid = document.getElementById('character-grid');
const overlay = document.getElementById('flashcard_overlay');
const flashcardContent = document.getElementById('flashcard_container');
const messageElement = document.getElementById('message');

let isAnswerVisible = false;
let currentGridPlotters = [];


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
    if(document.getElementById('chatbox')){
        const chatboxStyle = document.getElementById('chatbox').style.display;
        if (chatboxStyle !== 'none' && chatboxStyle !== '') {
            return;
        }
    }

    if(cardVisible){
        if(event.key === 'Escape'){
            hideCard();
            return;
        }
        return;
    }

    if(event.key === 'Escape') {
        drawBothLayouts(currentData);
        typedDisplay.style.display = 'none';
        return;
    }

    if(ctrlPressed){
        return;
    }

    if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault(); // Prevent default scrolling behavior
        // if (overlay.style.display === 'flex') {
        //     isAnswerVisible = !isAnswerVisible;
        //     updateVisibility();
        // }
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
                filteredData = currentData.filter(char => {
                    const cleanedInput = cleanString(inputString);
                    const cleanedPinyin = cleanString(removeTones(char.pinyin));
                    const cleanedEnglish = cleanString(char.english);

                    return cleanedPinyin.includes(cleanedInput) || cleanedEnglish.includes(cleanedInput);
                });

                // sort by piniyn
                filteredData.sort((a, b) => {
                    const cleanedInput = cleanString(inputString);
                    const cleanedPinyinA = cleanString(removeTones(a.pinyin));
                    const cleanedPinyinB = cleanString(removeTones(b.pinyin));
                
                    if (cleanedPinyinA === cleanedInput) return -1;
                    if (cleanedPinyinB === cleanedInput) return 1;


                    if (cleanedPinyinA.startsWith(cleanedInput)) return -1;
                    if (cleanedPinyinB.startsWith(cleanedInput)) return 1;
                
                    let minl = Math.min(cleanedPinyinA.length, cleanedInput.length);
                    for(let i = 0; i < minl; i++){
                        if(cleanedPinyinA[i] !== cleanedInput[i] && i == 0){
                            break;
                        }
                        if(cleanedPinyinA[i] !== cleanedInput[i] && i > 0){
                            return cleanedPinyinA[i].charCodeAt(0) - cleanedInput[i].charCodeAt(0);
                        }
                    }
                    // Check if English starts with input
                
                    // If neither starts with input, fall back to includes
                    return cleanedPinyinA.includes(cleanedInput) - cleanedPinyinB.includes(cleanedInput);
                });
                drawBothLayouts(filteredData, true);
                
                
                console.log(inputString);
                inputString = '';
                // document.getElementById('deck-select').value = null;
                
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

    if (event.key === 'c') {
        confetti();
    }

});


function toggleGridList(){
    console.log('toggling grid list');
    if(showList){
        showList = false;
        document.getElementById('grid-cont').style.display = 'block';
        document.getElementById('lcontainer').style.display = 'none';
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('list');
        history.pushState({}, '', newUrl);
    } else {
        document.getElementById('lcontainer').style.display = 'flex';
        document.getElementById('grid-cont').style.display = 'none';
        if(window.innerWidth / window.innerHeight > 16/9){
        }
        showList = true;
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('list', 'true');
        history.pushState({}, '', newUrl);
    }
    confirmDarkmode();
}

// let prefetchedPlotters = null;
let charCounter = 0;
let activeCharacter;
function createGrid(characters, useAllDecks){
    const grid = document.getElementById('character-grid');
    grid.innerHTML = '';
    charCounter = 0;
    if(currentDeck === null){
        try{
            currentDeck = inputdeck;
        } catch(e){
            currentDeck = 'shas'
        }
    }
    let ichars = Object.keys(characters);
    // if(useAllDecks){
    //     ichars = [];
    //     for (const [key, value] of Object.entries(characters)) {
    //         ichars = ichars.concat(value);
    //     }
    // }
    ichars.forEach(character => {
        let charData = characters[character];
        charData.character = character;
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.innerHTML = `
            <span class="char">${charData.character}</span>
            <span class="grid-pinyin">${charData.pinyin}</span>
        `;
        gridItem.setAttribute('data-length', charData.character.length);
        if(isDarkMode){
            gridItem.classList.add('darkmode');
        }
        gridItem.addEventListener('click', () => {
            // loadAndShow(charData.character); 
            showLoaded();
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('query', charData.character);
            history.pushState({}, '', newUrl);
        });
        let timeout;
        gridItem.addEventListener('mouseenter', () => {
            activeCharacter = charData.character;
            timeout = setTimeout(() => {
                loadCard(charData.character);
            }, 200);
        });
        gridItem.addEventListener('mouseleave', () => {
            clearTimeout(timeout);
        });
        grid.appendChild(gridItem);
        charCounter++;
    });

    updateCounterTitle();
    // toggleInvertAllElements();
    // toggleInvertAllElements();
}

function updateCounterTitle(){
    
    const deckLength = charCounter;
    // document.getElementById('title').textContent = `${namesmap[currentDeck]} (${deckLength} words)`;  
    // if(useAllDecks){
    //     document.getElementById('title').textContent = `${deckLength} words`;  
    // }
    // else{
    //     document.getElementById('title').textContent = `${namesmap[currentDeck]} (${deckLength} words)`;
    // }
    // document.getElementById('title').textContent = `${namesmap[currentDeck]} (${charCounter})`;
    if(inputdeck){
        currentDeck = inputdeck;
        inputdeck = null;
    }
    document.getElementById('title').textContent = `${inputdecks[currentDeck].name}`;  
    document.getElementById('title_word_count').textContent = `(${deckLength} words)`;  
}

function createLists(characters, useAllDecks) {
    const container = document.getElementById('lcontainer'); // Assume there's a container div in your HTML
    container.innerHTML = ''; // Clear existing content
    const gridWrapper = document.createElement('div');
    gridWrapper.id = 'lgrid-wrapper';
    gridWrapper.className = 'lgrid-wrapper';
    container.appendChild(gridWrapper);

    gridWrapper.innerHTML = ''; // Clear existing items
    let coco = 0;

    
    let ichars = Object.keys(characters);
    ichars.forEach((character, idx) => {
        let charData = characters[character];
        charData.character = character;
        const gridItem = createListItem(charData, coco);
        gridItem.className = 'lgrid-item';
        gridWrapper.appendChild(gridItem);
        coco++;
    });
}

function populateList(list, characters) {
    list.innerHTML = ''; // Clear existing items
    characters.forEach((char, idx) => {
        const listItem = createListItem(char, idx);
        list.appendChild(listItem);
    });
}

function createListItem(charData, idx) {
    const item = document.createElement('div');
    item.className = 'pinyin-english-item';
    item.innerHTML = `
        <div class="char-pinyin-group">
            <div class="index-container">
                <span class="list-index">${idx + 1}.</span>
            </div>
            <span class=" list-character list-character-size">${charData.character}</span>
            <span class="list-pinyin">${charData.pinyin}</span>
        </div>
        <span class="list-english">${charData.english}</span>
    `;
    item.addEventListener('click', () => {
        loadAndShow(charData.character); 
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('query', charData.character);
        history.pushState({}, '', newUrl);
    });
    return item;
}

// Call this function when the page loads and on window resize

let canvasrendered = false;

function getColorByTime(colors) {
    // Get current time
    let now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    
    // Print current time
    console.log(`Current local time: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    // Calculate the total minutes passed since 9 AM
    let totalMinutes = (hours * 60 + minutes - 9 * 60 + 24 * 60) % (24 * 60);
    
    // add last color to beggingn of array
    colors.unshift(colors[colors.length-1]);
    // Check if we're in the cycle period (9 AM to 10 PM)
    if (totalMinutes < 13 * 60) { // 13 hours from 9 AM to 10 PM
        let cycleDuration = 13 * 60; // 13 hours in minutes
        let colorIndex = Math.floor(totalMinutes / (cycleDuration / colors.length));
        let nextColorIndex = (colorIndex + 1) % colors.length;
        
        let interpolationFactor = (totalMinutes % (cycleDuration / colors.length)) / (cycleDuration / colors.length);
        
        let color1 = hexToRgb(colors[colorIndex]);
        let color2 = hexToRgb(colors[nextColorIndex]);
        
        let r = Math.round(color1.r + (color2.r - color1.r) * interpolationFactor);
        let g = Math.round(color1.g + (color2.g - color1.g) * interpolationFactor);
        let b = Math.round(color1.b + (color2.b - color1.b) * interpolationFactor);
        let a = 0.7;
        
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
        let lastColor = hexToRgb(colors[colors.length - 1]);
        return `rgba(${lastColor.r}, ${lastColor.g}, ${lastColor.b}, 0.7)`;
    }
}

// Helper function to convert hex to RGB (unchanged)
function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


let overlaycolors = 'f94144-f3722c-f8961e-f9844a-f9c74f-90be6d-43aa8b-4d908e-577590-277da1'.split('-');
overlaycolors = 'eaf4f4-F9844A-ffca3a-8ac926-1982c4-6a4c93'.split('-');
overlaycolors.forEach((color, idx) => {
    overlaycolors[idx] = `#${color}`;
});

function loadAndShow(character) {
    messageElement.textContent = 'Loading...';
    fetch(`./get_card_data?character=${encodeURIComponent(character)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            try{
                bordercanvas.style.display = 'block';
            }
            catch(e){

            }

            let chars = character.split('');
            // if(prefetchedPlotters){
            //     let isOkay = true;
            //     prefetchedPlotters.forEach((plotter, idx) => {
            //         if(plotter.char !== chars[idx]){
            //             isOkay = false;
            //         }
            //     });
            //     if(isOkay)
            //         data.plotters = prefetchedPlotters;
            //     else
            //         data.plotters = createPlotters(data);
            // }
            // else{
                data.plotters = createPlotters(data);
            // }
            // overlay.style.backgroundColor = overlaycolors[hsklvl];
            let overlay = document.getElementById('flashcard_overlay');
            let currentColor = getColorByTime(overlaycolors);
            // overlay.style.backgroundColor = currentColor;
            // let hexstring = 'f9414450-f3722c50-f8961e50-f9844a50-f9c74f50-90be6d50-43aa8b50-4d908e50-57759050-277da150'
            // overlay.style.backgroundColor = `#${hexstring.split('-')[Math.floor(Math.random() * hexstring.split('-').length)]}`;
           
            renderCardData(data);
            currentGridPlotters = data.plotters;
            displayCard(true, true);
            cardVisible = true;
            try{
                if(!canvasrendered || true){
                    renderBorder();
                    canvasrendered = true;
                }
            }
            catch(e){

            }
            messageElement.textContent = '';
            // recordView(character);
        })
        .catch(error => {
            console.error('Error:', error);
            messageElement.textContent = `Error: ${error.message}`;
        });
}

let loadedCard = null;

function showLoaded(){
    if(!loadedCard || loadedCard.character !== activeCharacter){
        loadAndShow(activeCharacter);
        return;
    }
    renderCardData(loadedCard);
    currentGridPlotters = loadedCard.plotters;
    displayCard(true, true);
    cardVisible = true;
}

function loadCard(character) {
    messageElement.textContent = 'Loading...';
    fetch(`./get_card_data?character=${encodeURIComponent(character)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            try{
                bordercanvas.style.display = 'block';
            }
            catch(e){

            }

            let chars = character.split('');
            // if(prefetchedPlotters){
            //     let isOkay = true;
            //     prefetchedPlotters.forEach((plotter, idx) => {
            //         if(plotter.char !== chars[idx]){
            //             isOkay = false;
            //         }
            //     });
            //     if(isOkay)
            //         data.plotters = prefetchedPlotters;
            //     else
            //         data.plotters = createPlotters(data);
            // }
            // else{
                data.plotters = createPlotters(data);
            // }
            // overlay.style.backgroundColor = overlaycolors[hsklvl];
            let overlay = document.getElementById('flashcard_overlay');
            let currentColor = getColorByTime(overlaycolors);
            // overlay.style.backgroundColor = currentColor;
            // let hexstring = 'f9414450-f3722c50-f8961e50-f9844a50-f9c74f50-90be6d50-43aa8b50-4d908e50-57759050-277da150'
            // overlay.style.backgroundColor = `#${hexstring.split('-')[Math.floor(Math.random() * hexstring.split('-').length)]}`;
           
            // renderCardData(data);
            // currentGridPlotters = data.plotters;
            // displayCard(true, true);
            // cardVisible = true;
            loadedCard = data;
            messageElement.textContent = "";
        })
        .catch(error => {
            console.error('Error:', error);
            messageElement.textContent = `Error: ${error.message}`;
        });
}

function showAfterLoad(data){
    data.plotters = createPlotters(data);
    console.log("data")
    console.log(data)
    renderCardData(data);
    currentGridPlotters = data.plotters;
    displayCard(true, true);
    cardVisible = true;
}


function drawBothLayouts(data, useAllDecks=false){    
    createGrid(data, useAllDecks);
    createLists(data, useAllDecks);
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


// function showPinyin(gridItem, character) {
//     const pinyinSpan = gridItem.querySelector('.pinyin');
//     if (pinyinSpan.textContent === '') {
//         fetch(`./get_pinyin?character=${encodeURIComponent(character)}`)
//             .then(response => response.json())
//             .then(data => {
//                 pinyinSpan.textContent = data.pinyin;
//                 gridItem.querySelector('.char').style.display = 'none';
//                 pinyinSpan.style.display = 'block';
//             })
//             .catch(error => console.error('Error:', error));
//     } else {
//         gridItem.querySelector('.char').style.display = 'none';
//         pinyinSpan.style.display = 'block';
//     }
// }

// function hidePinyin(gridItem) {
//     gridItem.querySelector('.char').style.display = 'block';
//     gridItem.querySelector('.pinyin').style.display = 'none';
// }


// document.getElementById('deck-select').addEventListener('change', function(event) {
//     changeDeck(event.target.value);
//     this.blur(); // Remove focus from the dropdown after selection
// });

// Initial load of characters

function updateVisibility() {
    const pinyin = document.getElementById('pinyin');
    const english = document.getElementById('english');
    const flashcard = document.getElementById('flashcard');

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
    currentData = inputdecks[currentDeck].chars;
    // fetch(`./api/?deck=${deck}`, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    // })
    // .then(response => {
    //     if (!response.ok) {
    //         throw new Error('Network response was not ok');
    //     }
    // })
    // .catch(error => {
    //     console.error('There was a problem changing the deck:', error);
    // });
    const grid = document.getElementById('character-grid');
    grid.innerHTML = '';
    // change url parameter deck to currentDeck
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('deck', deck);
    history.pushState({}, '', newUrl);
    drawBothLayouts(currentData);
    window.scrollTo(0, 0);
    document.getElementById('deckSubmenu').classList.remove('active');
}


// if(isMobileOrTablet()){
//     document.addEventListener('click', function(event) {
//         if (!event.target.classList.contains('clickable-char')) {
//             change(event);
//         }
//     });
// }

// function getDeck() {
//     fetch('./api/get_deck')
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }
//             return response.json();
//         })
//         .then(data => {
//             currentDeck = data.deck;
//             drawBothLayouts(currentData);
//         })
//         .catch(error => {
//             console.error('There was a problem with the fetch operation:', error);
//         });
// }

window.addEventListener('popstate', function(event) {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    
    if (query) {
        loadAndShow(query);
        scrollToTop(document.getElementById('flashcard_container'), null);
    }
});

let cardVisible = false;
function hideCard() {
    // overlay.style.display = 'none';
    cardVisible = false;
    scrollToTop(document.getElementById('flashcard_container'), () => {overlay.style.display = 'none';});
        
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('query');
    history.pushState({}, '', newUrl);
}
overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
        hideCard();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        hideCard();
    }
});

function playHanziAudio() {
    const pinyinElement = document.getElementById('flashcard_pinyin');
    const encodedHanzi = encodeURIComponent(pinyinElement.dataset.characters);
    const audio = new Audio(`./api/get_audio?chars=${encodedHanzi}`);
    
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
    });
}



function addWord(symbol, set_name, get_rows=false){
    alert("Adaaaaaaaaaaaaaded " + symbol + " to " + set_name);
    inputdecks[set_name].chars[symbol] = currentData[symbol];
    
    fetch("./api/add_word_to_learning", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ word: symbol, set_name: set_name, get_rows: get_rows})
    })
    .then(response => response.json())
    .then(data => {
        // addedWords.forEach(word => {
        //     getRowData([word]);
        // });
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

function addWordToLearning(symbol){
    // inputdecks['custom'].chars[symbol] = currentData[symbol];
    // fetch("./api/add_word_to_learning", {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify({ word: symbol })
    // })
    // .then(response => response.json())
    // .then(data => {
    //     console.log(data); 
    // })
    // .catch(error => {
    //     console.error("Error:", error);
    // });
}

function loadAllData(){
    fetch('./api/get_deck_chars', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ deck: currentDeck })
    })
    .then(response => response.json())
    .then(data => {
        currentData = data;
        // getDeck();
        
        // get deck from url
        const urlParams = new URLSearchParams(window.location.search);
        const deck = urlParams.get('deck') || 'hsk1';
        currentDeck = deck;
        drawBothLayouts(currentData);

        getFont();
        handleOrientationChange();
    })
    .catch(error => console.error('Error:', error))
    .finally(() => {
    });
}

let ctrlPressed = false;

document.addEventListener('keydown', function(event) {
    if (event.ctrlKey) {
        ctrlPressed = true;
    }
});

document.addEventListener('keyup', function(event) {
    if (event.key === 'Control') {
        ctrlPressed = false;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    
    const characterDiv = document.getElementById('flashcard_character');
    const plotterDiv = document.getElementById('flashcard_plotter');

    document.getElementById('deckMenu').addEventListener('click', function(event) {
        if(!event.target.closest('#deckSubmenu')){
            document.getElementById('deckSubmenu').classList.add('active')
        }
    });
    
    document.getElementById('fontMenu').addEventListener('click', function(event) {
        if(!event.target.closest('#fontSubmenu')){
            document.getElementById('fontSubmenu').classList.add('active')
        }
    });

    document.addEventListener('click', function(event) {
        if (!event.target.closest('#deckMenu')) {
            document.getElementById('deckSubmenu').classList.remove('active');
        }
        if (!event.target.closest('#fontMenu')) {
            document.getElementById('fontSubmenu').classList.remove('active');
        }
    });



    if (inputdeck) {
        currentDeck = inputdeck;
    }
    currentData = inputdecks[currentDeck].chars;
    confirmDarkmode();
    
    drawBothLayouts(currentData);
    document.querySelectorAll('.deck-option').forEach(opt => opt.classList.remove('selected-option'));
    document.querySelector(`.deck-option[data-deck="${currentDeck}"]`).classList.add('selected-option');

    if(isMobileOrTablet()){
        // document.getElementById('deckSubmenuName').innerText = "charset";
        // document.getElementById('fontSubmenuName').innerText = "fonts";
    }

    
    if(username === 'tempuser'){
        try{
            let logoutbutton = document.getElementById('logoutButton');
            logoutbutton.style.display = 'none';
            logoutbutton.parentElement.style.display = 'none';
        }
        catch(e){
            console.log(e);
        }
    }

    document.querySelectorAll('.deck-change').forEach(function(deckOption) {
        deckOption.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const selectedDeck = this.dataset.deck;
            changeDeck(selectedDeck);
            document.querySelectorAll('.deck-change').forEach(opt => opt.classList.remove('selected-option'));
            this.classList.add('selected-option');
        });
    });
   
    document.querySelectorAll('.font-change').forEach(function(fontOption) {
        fontOption.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const selectedFont = this.dataset.font;
            changeFont(selectedFont);
            document.querySelectorAll('.font-change').forEach(opt => opt.classList.remove('selected-option'));
            this.classList.add('selected-option');
        });
    });


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
        let overlay = document.getElementById('flashcard_overlay');
        let currentColor = getColorByTime(overlaycolors);
        // overlay.style.backgroundColor = currentColor;
        console.log(currentColor)
        
        scrollToTop(document.getElementById('flashcard_container'));
    }

    // if there is a query parameter for togglign the list grid, apply it
    const urlParams = new URLSearchParams(window.location.search);
    const list = urlParams.get('list');
    if(list === 'true'){
        toggleGridList();
    }

});

let currentToggleFont = 0;
function changeFont(font) {
    const characterDiv = document.getElementById('flashcard_character');
    const plotterDiv = document.getElementById('flashcard_plotter');
    if(font === 'Render'){
        characterDiv.style.display = 'none';
        plotterDiv.style.display = 'block';
        currentToggleFont = 3;
        return;
    }
    else{
        let fontMapKeys = Object.keys(fontMap);
        currentToggleFont = fontMapKeys.indexOf(font);
        console.log(currentToggleFont);
        characterDiv.style.display = 'block';
        // plotterDiv.style.display = 'none';
    }
    const fontInfo = fontMap[font];
    
    if (fontInfo) {
        currentFont = font;
        adjustFlashCardChars();
        
        document.querySelector('.grid').style.fontFamily = `"${currentFont}", sans-serif`;
        const gridItems = grid.querySelectorAll('.char');
        gridItems.forEach(item => {
            item.style.fontSize = `${fontInfo.size}px`;
        });
        updateFontFamily(fontInfo.family);
    }

    document.getElementById('fontSubmenu').classList.remove('active');

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

function getFont() {
    fetch('./api/get_font', {
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

            // document.getElementById('font-select').value = currentFont;
            // let cc = document.getElementById('flashcard_character')
            // if(currentFont === 'Noto Serif SC'){
            //     if(cc)
            //         cc.style.fontFamily = `"${currentFont}", serif`;
            //     document.querySelector('.grid').style.fontFamily = `"${currentFont}", serif`;
            // } else{
            //     if(cc)
            //         cc.style.fontFamily = `"${currentFont}", sans-serif`;
            //     document.querySelector('.grid').style.fontFamily = `"${currentFont}", sans-serif`;
            // }

            try{
                adjustFlashCardChars();
            }
            catch(e){}

        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}



function adjustFlashCardChars(){
    try{
        let cc = document.getElementById('flashcard_character');
        if(isMobileOrTablet()){
            if(currentFont === 'Kaiti'){
                cc.style.transform = 'scale(1)';
            }
            else{
                cc.style.transform = 'scale(1)';
            }
        }
        else {
            if(currentFont === 'Kaiti'){
                cc.style.transform = 'scale(1)';
            }
            else{
                cc.style.transform = 'scale(1)';
            }
        }
    }
    catch(e){
    }
}



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

// document.getElementById('font-select').addEventListener('change', function(event) {
//     const selectedFont = event.target.value;
//     const fontInfo = fontMap[selectedFont];
    
//     if (fontInfo) {
//         console.log(fontInfo.family)
//         const grid = document.querySelector('.grid');
//         grid.style.fontFamily = `"${fontInfo.family}", sans-serif`;
        
//         // Set font size for grid items
//         const gridItems = grid.querySelectorAll('.char');
//         gridItems.forEach(item => {
//             item.style.fontSize = `${fontInfo.size}px`;
//         });
        
//         const flashcardCharacter = document.querySelector('.flashcard_character');
//         flashcardCharacter.style.fontFamily = `"${fontInfo.family}", sans-serif`;

//         updateFontFamily(fontInfo.family);
        
//         // Also set font size for the character in the flashcard overlay
//         // if (flashcardCharacter) {
//         //     flashcardCharacter.style.fontSize = `${fontInfo.size * 2}px`; // Larger size for the flashcard
//         // }
        
//         currentFont = selectedFont;
//         console.log('selected font', currentFont);
//         changeFont(currentFont);
//     }
    
//     this.blur();
//     event.stopPropagation();
// });


// overlay.addEventListener('click', (e) => {
//     if (e.target === overlay && !e.target.closest('#font-select')) {
//         overlay.style.display = 'none';
//     }
// });
