const overlay = document.getElementById('flashcard_overlay');
const flashcardContent = document.getElementById('flashcard_container');
const messageElement = document.getElementById('message');

let canvasrendered = false;
let loadedCard = null;
let activeCharacter;

function showFlashcard(character) {
    cardVisible = true;
    messageElement.textContent = 'Loading...';
    let url = new URL(window.location);
    url.searchParams.set('character', character);
    window.history.replaceState({}, '', url);

    if(loadedCard && loadedCard.character === activeCharacter){
        displayCard(true, true);
        confirmDarkmode();
        return;
    }

    fetch(`./get_card_data?character=${encodeURIComponent(character)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // activeCharacter = character;
            data.plotters = createPlotters(data);
            loadedCard = data;
            renderCard(data);
            displayCard(true, true);
            confirmDarkmode();
        })
        .catch(error => {
            console.error('Error:', error);
            messageElement.textContent = `Error: ${error.message}`;
        });
}

function loadCard(character, render=false, targetVar = 'loadedCard') {
    let messageElement = document.getElementById('message');
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
        data.plotters = createPlotters(data);
        window[targetVar] = data;
        if(render){
            renderCard(window[targetVar]);
        }
        messageElement.textContent = "";
        unlocked = true;
    })
    .catch(error => {
        console.error('Error:', error);
        messageElement.textContent = `Error: ${error.message}`;
    });
}

overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
        cardVisible = false;
        overlay.style.display = 'none';
        // ccanvas.style.display = 'none';
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

function playHanziAudio() {
    const pinyinElement = document.getElementById('flashcard_pinyin');
    const encodedHanzi = encodeURIComponent(pinyinElement.dataset.characters);
    const audio = new Audio(`./api/get_audio?chars=${encodedHanzi}`);
    
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
    });
}


function isMobileOrTablet() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check || /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function adjustHeight() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

overlay.addEventListener('click', (e) => {
    if (e.target === overlay && !e.target.closest('#font-select')) {
        overlay.style.display = 'none';
        let url = new URL(window.location);
        url.searchParams.delete('character');
        window.history.replaceState({}, '', url);
    }
});


function showAfterLoad(data){
    data.plotters = createPlotters(data);
    loadedCard = data;
    renderCard(data);
    currentGridPlotters = data.plotters;
    displayCard(true, true);
    cardVisible = true;
}

document.addEventListener('DOMContentLoaded', function() {
});

let currentCharList = [];
function updateSearchResults(results, query) {
    // Update the characters list first
    currentCharList = results.length ? results.map(result => result.hanzi) : [];
    
    const resultsContainer = document.getElementById('results');
    
    // Use document fragment for batch DOM operations
    const fragment = document.createDocumentFragment();
    
    if (results && results.length > 0) {
        // Prepare template HTML for better performance
        const template = document.createElement('template');
        
        // Build results using innerHTML for faster DOM construction
        results.forEach((result, index) => {
            const traditional = result.traditional ? 
                `<div>Traditional: ${result.traditional}</div>` : '';
                
            // Create each item using template
            template.innerHTML = `
                <div class="result-item">
                    <span class="result-index">${index + 1}</span>
                    <div class="hanzi-section">${result.hanzi}</div>
                    <div class="details-section">
                        <div class="res-pin">${toAccentedPinyin(result.pinyin)}</div>
                        <div class="res-eng">${toAccentedPinyin(result.english)}</div>
                        ${traditional}
                    </div>
                </div>
            `.trim();
            
            const resultItem = template.content.firstChild.cloneNode(true);
            
            // Use function reference instead of anonymous functions
            resultItem.addEventListener('click', () => {
                maybeLoadRenderAndThenShow(result.hanzi);
            });
            
            let timeout;
            resultItem.addEventListener('mouseenter', () => {
                if(cardVisible) return;
                activeCharacter = result.hanzi;
                timeout = setTimeout(() => {
                    loadCard(result.hanzi, true, 'loadedCard');
                }, 200);
            });
            
            resultItem.addEventListener('mouseleave', () => {
                clearTimeout(timeout);
            });
            
            fragment.appendChild(resultItem);
        });
    } else if (query) {
        const noResults = document.createElement('div');
        noResults.textContent = `No results found for "${query}"`;
        fragment.appendChild(noResults);
    }
    
    // Clear and update container in a single operation
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(fragment);
}
    




window['loadedCard'] = null;
window['nextLoadedCard'] = null;
window['prevLoadedCard'] = null;

let unlocked = false;
let donefirst = false;
function maybeLoadRenderAndThenShow(character, dir=0, force_unlock=false){
    cardVisible = true;
    console.log("clicked", character, unlocked, donefirst);

    if(!unlocked && donefirst){
        donefirst = false;
        return;
    }
    donefirst = true;
    unlocked = true;

    let url = new URL(window.location);
    url.searchParams.set('character', character);
    window.history.replaceState({}, '', url);
    if(dir == 1){
        if(window['nextLoadedCard']){
            console.log("loaded next", window['nextLoadedCard'].character);
            renderCard(window['nextLoadedCard']);
            activeCharacter = character;
            window['prevLoadedCard'] = Object.assign({}, window['loadedCard']);
            window['loadedCard'] = Object.assign({}, window['nextLoadedCard']);
            
            let next_neighs = getNeighbors(character);
            let next_nextchar = next_neighs.nextchar;
            let next_prevchar = next_neighs.prevchar;
            console.log("loading next next", next_nextchar);
            loadCard(next_nextchar, false, 'nextLoadedCard');
            return;
        }
        else{
            maybeLoadRenderAndThenShow(nextchar, 0);
            return;
        }
    }
    if(dir == -1){
        if(window['prevLoadedCard']){
            renderCard(window['prevLoadedCard']);
            activeCharacter = character;
            window['nextLoadedCard'] = Object.assign({}, window['loadedCard']);
            window['loadedCard'] = Object.assign({}, window['prevLoadedCard']);
            
            let prev_neighs = getNeighbors(character);
            let prev_nextchar = prev_neighs.nextchar;
            let prev_prevchar = prev_neighs.prevchar;
            loadCard(prev_prevchar, false, 'prevLoadedCard');
            return;
        }
        else{
            maybeLoadRenderAndThenShow(prevchar, 0);
            return;
        }
    }
    if(window['loadedCard'] && window['loadedCard'].character === activeCharacter){
        let neighs = getNeighbors(character);
        let nextchar = neighs.nextchar;
        let prevchar = neighs.prevchar;
        displayCard(true, true);
        confirmDarkmode();
        loadCard(nextchar, false, 'nextLoadedCard');
        loadCard(prevchar, false, 'prevLoadedCard');

        return;
    }

    fetch(`./get_card_data?character=${encodeURIComponent(character)}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // bordercanvas.style.display = 'block';
        data.plotters = createPlotters(data);
        window['loadedCard'] = data;
        renderCard(data);
        displayCard(true, true);
        unlocked = true;
        // let nextcharidx = wordlists_words[currentWordlist].map(word => word.character).indexOf(window['loadedCard'].character) + 1;
        // let prevcharidx = wordlists_words[currentWordlist].map(word => word.character).indexOf(window['loadedCard'].character) - 1;
        // nextcharidx = nextcharidx % wordlists_words[currentWordlist].length;
        // prevcharidx = (prevcharidx + wordlists_words[currentWordlist].length) % wordlists_words[currentWordlist].length;
        // let nextchar = wordlists_words[currentWordlist][nextcharidx].character;
        // let prevchar = wordlists_words[currentWordlist][prevcharidx].character;
        // loadCard(nextchar, false, 'nextLoadedCard');
        // loadCard(prevchar, false, 'prevLoadedCard');
        // recordView(character);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function getNeighbors(inputChar){
    let charidx = currentCharList.indexOf(inputChar);
    let nexcharidx = (charidx + 1) % currentCharList.length;
    let prevcharidx = (charidx - 1 + currentCharList.length) % currentCharList.length;
    let nextchar = currentCharList[nexcharidx];
    let prevchar = currentCharList[prevcharidx];
    return {nextchar, prevchar};
}

function loadAndShowPreviousCard() {
    let currentCharacter = activeCharacter;
    let neighs = getNeighbors(currentCharacter);
    let prevChar = neighs.prevchar;
    let nextChar = neighs.nextchar;
    maybeLoadRenderAndThenShow(prevChar, -1);
}

function loadAndShowNextCard() {
    let currentCharacter = activeCharacter;
    let neighs = getNeighbors(currentCharacter);
    let prevChar = neighs.prevchar;
    let nextChar = neighs.nextchar;
    maybeLoadRenderAndThenShow(nextChar, 1);
}


let xDown = null;
let yDown = null;
document.addEventListener('touchstart', handleTouchStart, false);
document.addEventListener('touchmove', handleTouchMove, false);
function getTouches(evt) {
    return evt.touches || evt.originalEvent.touches;
}
function handleTouchStart(evt) {
    const firstTouch = getTouches(evt)[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
}
function handleTouchMove(evt) {
    if (!xDown || !yDown) {
        return;
    }
    let xUp = evt.touches[0].clientX;
    let yUp = evt.touches[0].clientY;
    let xDiff = xDown - xUp;
    let yDiff = yDown - yUp;
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0) {
            loadAndShowPreviousCard();
        } else {
            loadAndShowNextCard();
        }
    }
    xDown = null;
    yDown = null;
}


let isNavigating = false;
document.addEventListener('keydown', function(event) {
    if(event.key === 'Escape') {
        hideCard();
        return;
    }

    if (cardVisible && !isNavigating) {
        if (event.key === 'ArrowLeft' || event.key === 'a') {
            isNavigating = true;
            loadAndShowPreviousCard();
            setTimeout(function() {
                isNavigating = false;
            }, 22);
        } else if (event.key === 'ArrowRight' || event.key === 'd') {
            isNavigating = true;
            loadAndShowNextCard();
            setTimeout(function() {
                isNavigating = false;
            }, 22); 
        }
    }
});