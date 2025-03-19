/*
function init(){
    const hanziPlotter = new HanziPlotter({
        character: '籍',
        dimension: 200,
        speed: .4,
        lineThickness: 12,
        jitterAmp: 1
    });
    document.body.appendChild(hanziPlotter.getCanvas());
    hanziPlotter.draw();
}

init();
*/

let input = document.getElementById('hanziInput');
let plottersElem = document.getElementById('plotters');
let plotters = [];
let isMouseDown = false;
let selectedDropdownValue = [1, 1];
let renderFont = 'Kaiti';
let selectedStoryIndex = 1;
let selectedChapterIndex = 1;

let colorList = [
    '#000',
    '#ddd',
    '#500'
];

const backgroundList = [
    '#ddd',
    '#000',
];

const fontList = ['Kaiti', 'Noto Serif SC', 'Noto Sans', 'Ma Shan Zheng', 'Long Cang', 'Zhi Mang Xing'];

function createFontOptions(){

    const container = document.getElementById("fonts-option");

    const label = document.createElement("span");
    label.classList.add("optionLabel");
    label.textContent = "Font:";

    const selectContainer = document.createElement("div");
    selectContainer.classList.add("custom-select");
    selectContainer.id = "fontList";

    const selectedOption = document.createElement("div");
    selectedOption.classList.add("selected-option");
    selectedOption.id = "selectedFont";

    const selectedFont = document.createElement("div");
    selectedFont.classList.add("font-choice");
    selectedFont.textContent = fontList[0];

    selectedOption.appendChild(selectedFont);
    selectContainer.appendChild(selectedOption);

    const optionsContainer = document.createElement("div");
    optionsContainer.classList.add("options");
    optionsContainer.id = "fontOptions";

    fontList.forEach((font, index) => {
        const option = document.createElement("div");
        option.classList.add("option", "isfont");
        option.dataset.value = index + 1;

        const fontChoice = document.createElement("div");
        fontChoice.classList.add("font-choice");
        fontChoice.textContent = font;

        option.appendChild(fontChoice);
        optionsContainer.appendChild(option);
    });

    selectContainer.appendChild(optionsContainer);
    container.appendChild(label);
    container.appendChild(selectContainer);
}

createFontOptions();

function isHanzi(char) {
    return /[\u4e00-\u9fff]/.test(char);
}

function populateStoryOptions() {
    const selectedStory = document.getElementById('selectedStory');
    const optionsContainer = document.getElementById('storyOptions');

    // Populate the selected option (default to the first story)
    selectedStory.innerHTML = `
        <div class="story-option">
            ${stories[selectedStoryIndex-1]}
        </div>
    `;

    // Clear existing options
    optionsContainer.innerHTML = '';

    // Populate the options
    stories.forEach((story, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option isstory';
        optionDiv.setAttribute('data-value', index + 1);
        optionDiv.innerHTML = `
            <div class="story-option">
                ${stories[index]}
            </div>
        `;
        optionsContainer.appendChild(optionDiv);
    });
}

function populateChapterOptions() {
    const selectedChapter = document.getElementById('selectedChapter');
    const optionsContainer = document.getElementById('chapterOptions');

    selectedChapter.innerHTML = `
        <div class="chapter-option">
            ${chapters[selectedStoryIndex-1][selectedChapterIndex-1]}
        </div>
    `;

    // Clear existing options
    optionsContainer.innerHTML = '';

    // Populate the options
    chapters[selectedStoryIndex-1].forEach((chapter, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option ischapter';
        optionDiv.setAttribute('data-value', index + 1);
        optionDiv.innerHTML = `
            <div class="chapter-option">
                ${chapter}
            </div>
        `;
        optionsContainer.appendChild(optionDiv);
    });
}


function populateColorOptions() {
    const selectedColor = document.getElementById('selectedPalette');
    const colorOptions = document.getElementById('colorOptions');
    colorOptions.innerHTML = '';

    let colorListC = [...colorList];

    if(isDarkMode){
        colorListC = [colorList[1], colorList[0], colorList[2]];
    }
    
    selectedColor.innerHTML = `
        <div class="color-pair">
            <div class="color-square" style="background-color: ${colorList[0]}"></div>
        </div>
    `;
    colorList.forEach((color, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option iscolor';
        optionDiv.setAttribute('data-value', index + 1);

        const colorPairDiv = document.createElement('div');
        colorPairDiv.className = 'color-pair';

        const colorSquareDiv = document.createElement('div');
        colorSquareDiv.className = 'color-square';
        colorSquareDiv.style.backgroundColor = color;

        colorPairDiv.appendChild(colorSquareDiv);
        optionDiv.appendChild(colorPairDiv);
        colorOptions.appendChild(optionDiv);
    });
}


async function getPinyinEnglishFor(character) {
    try {
        const response = await fetch(`./get_simple_char_data?character=${encodeURIComponent(character)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}
function isPunctuation(char) {
    return char === "。" || char === "，" || char === "、" || char === "；" || char === "：";
}

function remap(value, low1, high1, low2, high2) {
    return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
}

// let dimsSlider;
// let dimsValue;
// let paddingSlider;
// let paddingValue;
let sizeSlider;
let thicknessSlider;
let thicknessValue;
let noiseSlider;
let noiseValue;
let backgroundCheckbox;
let backgroundCheckbox2;
let pinyinCheckbox;
let naturalCheckbox;

let currentLines = [];

let rmouseX = 0;
let rmouseY = 0;
let mouseX = 0;
let mouseY = 0;

let fullInput = '';
let fullOutputTranslation = '';
let showAllPinyin = false;

let currentHoveredLine = -1;

function unhighlightAllLines(){
    document.querySelectorAll('.line-wrapper').forEach((el) => {
        document.querySelectorAll('.pinyinLabel').forEach((el) => {
            el.classList.add('hidden');
        });
        el.classList.remove('desktop');
        el.classList.remove('fakehover');
    });
    document.getElementById('translationBox').classList.add('hidden');
}

function highLightLine(lineIndex) {
    let translationBox = document.getElementById('translationBox');
    let canvaswrapper = document.getElementById('plottersWrapper');

    translationBox.textContent = chapter.english[lineIndex];
    if(lineIndex == -1){
        translationBox.textContent = chapter.description;
    }
    setTimeout(() => {
        currentHoveredLine = lineIndex;
    }, 333);

    // add hover event to the the .line-wrapper that has dataset.lineindex = lineIndex
    document.querySelectorAll('.line-wrapper').forEach((el) => {
        if (el.dataset.lineIndex == lineIndex) {
            el.classList.add('desktop');
            el.classList.add('fakehover');


            document.querySelectorAll('.pinyinLabel').forEach((el) => {
                if(!document.getElementById('pinyinCheckbox').checked)
                    el.classList.add('hidden');
            });
            document.querySelectorAll('.pinyinLabel.line_' + lineIndex).forEach((el) => {
                if(!document.getElementById('pinyinCheckbox').checked)
                    el.classList.remove('hidden');
            });
        }
        else {
            el.classList.remove('desktop');
            el.classList.remove('fakehover');
        }
    });

    if(translationBox.textContent.length === 0){
        return;
    }
    translationBox.classList.remove('hidden');
    if(isMobileOrTablet()){
        translationBox.style.position = 'absolute';
        translationBox.style.left = 20 + 'px';
        translationBox.style.top = window.scrollY + 20 + 'px';
    }
    else{
        translationBox.style.position = 'absolute';
        translationBox.style.left = '50%';
        translationBox.style.transform = 'translateX(-50%)';
        translationBox.style.bottom = -window.scrollY + 120 + 'px';
    }
}

function addHoverBehaviorToWrapper(wrapper, lineIndex) {

    let translationBox = document.getElementById('translationBox');
    let canvaswrapper = document.getElementById('plottersWrapper');

    wrapper.addEventListener('mouseenter', function (event) {

        if(isMobileOrTablet())
            return;
        wrapper.classList.add('desktop');
        
        highLightLine(lineIndex);
    });

    wrapper.addEventListener('click', function (event) {
        
        if (chapter.clip_ids && isPlaying){
            currentPlayingAudio.pause();
            currentStoryIndex = lineIndex;
            playStory();
        }
        if(!isMobileOrTablet()){
            // if has clip_ids property
            return;
        }
        let translationBox = document.getElementById('translationBox');
        let canvaswrapper = document.getElementById('plottersWrapper');
        wrapper.classList.toggle('desktop');
        translationBox.classList.toggle('hidden');

        translationBox.textContent = chapter.english[lineIndex];
        if(lineIndex == -1){
            translationBox.textContent = chapter.description;
        }
        setTimeout(() => {
            currentHoveredLine = lineIndex;
        }, 1110);

        document.querySelectorAll('.pinyinLabel.line_' + lineIndex).forEach((el) => {
            el.classList.toggle('hidden');
        });

        if(translationBox.textContent.length === 0){
            return;
        }
        // translationBox.classList.remove('hidden');
        if(isMobileOrTablet()){
            translationBox.style.position = 'absolute';
            translationBox.style.left = 20 + 'px';
            translationBox.style.top = window.scrollY + 20 + 'px';
        }
        else{
            translationBox.style.position = 'absolute';
            translationBox.style.left = '50%';
            translationBox.style.transform = 'translateX(-50%)';
            translationBox.style.bottom = -window.scrollY + 120 + 'px';
        }
    });

    wrapper.addEventListener('mousemove', function (event) {
        if(isMobileOrTablet()){
            translationBox.style.position = 'absolute';
            translationBox.style.left = 20 + 'px';
            translationBox.style.top = window.scrollY + 20 + 'px';
            // translationBox.style.transform = "translateX(-" + translationboxwidth + ")";
        }
        else{
            translationBox.style.position = 'absolute';
            translationBox.style.left = '50%';
            translationBox.style.transform = 'translateX(-50%)';
            translationBox.style.bottom = -window.scrollY + 120 + 'px';
        }
    });

    // on scroll event
    window.addEventListener('scroll', function () {
        if(isMobileOrTablet()){
            translationBox.style.position = 'absolute';
            translationBox.style.left = 20 + 'px';
            translationBox.style.top = window.scrollY + 20 + 'px';
            // translationBox.style.transform = "translateX(-" + translationboxwidth + ")";
        }
        else{
            translationBox.style.position = 'absolute';
            translationBox.style.left = '50%';
            translationBox.style.transform = 'translateX(-50%)';
            translationBox.style.bottom = -window.scrollY + 120 + 'px';
        }
    });

    wrapper.addEventListener('mouseleave', function () {
        if(isPlaying){
            highLightLine(currentStoryIndex);
            return;
        }
        wrapper.classList.remove('desktop');
        translationBox.classList.add('hidden');
        currentHoveredLine = -1;
        if (!showAllPinyin) {
            document.querySelectorAll('.pinyinLabel.line_' + lineIndex).forEach((el) => {
                el.classList.add('hidden');
            });
        }
    });
}


function applyPinyinVisibility() {
    document.querySelectorAll('.pinyinLabel').forEach(element => {
        if (showAllPinyin) {
            element.classList.remove('hidden');
        }
        else {
            element.classList.add('hidden');
        }
    });
}

function applyInitialStyles(bubbleobj) {
    let bubble = bubbleobj.bubble;
    let x = 0;
    let y = 0;
    const bubbleWidth = bubble.offsetWidth;
    const bubbleHeight = bubble.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const close = document.createElement('div');
    close.setAttribute('id', 'translation-bubble-close');
    close.style.position = 'absolute';
    close.style.width = '16px';
    close.style.height = '16px';
    close.style.right = '2px';
    close.style.top = '2px';
    close.style.background = '#ffffff88';
    close.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    close.style.borderRadius = '50%';
    close.style.cursor = 'pointer';
    close.style.zIndex = '333';
    close.style.opacity = '0.0';
    close.style.transition = 'opacity 0.3s ease';

    bubble.appendChild(close);
    bubbleobj.closebutton = close;

    const documentClickHandler = function(event) {
        if (!bubble.contains(event.target)) {
            removeBubbleFromDOM(bubbleobj);
            activeBubbles = activeBubbles.filter(b => b !== bubbleobj);
            bubbleobj.removed = true;
            document.body.removeEventListener('click', documentClickHandler);
            hasOpenBubbles = false;
        }
    };
    document.body.addEventListener('click', documentClickHandler);
    bubbleobj.documentClickHandler = documentClickHandler;
}


function applyInitialPos(bubbleobj) {
    let bubble = bubbleobj.bubble;
    let x = 0;
    let y = 0;
    const bubbleWidth = bubble.offsetWidth;
    const bubbleHeight = bubble.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const padding = 50;
    x = rmouseX + window.scrollX - bubbleWidth / 2;
    y = rmouseY + window.scrollY - bubbleHeight - 15;

    if(x + bubbleWidth > window.scrollX + windowWidth - padding)
        x = window.scrollX + windowWidth - padding - bubbleWidth;
    if(x < window.scrollX + padding)
        x = window.scrollX + padding;
    if(y + bubbleHeight > window.scrollY + windowHeight - padding)
        y = window.scrollY + windowHeight - padding - bubbleHeight;
    if(y < window.scrollY + padding)
        y = window.scrollY + padding;


    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
}

let initializeStyle = false;
let activeBubble = null;
let hasOpenBubbles = false;

class Bubble {
    constructor(domelement) {
        this.bubble = domelement;
        this.closebutton = null;
        this.draggablearea = null;
        this.dragged = false;
        this.overdragged = false;
        this.timeoutId = null;
        this.fadeId = null;
        this.mouseover = false;
        this.removed = false;
    }

    setPos(x, y) {
        this.bubble.style.left = `${x}px`;
        this.bubble.style.top = `${y}px`;
        const bubbleWidth = this.bubble.offsetWidth;
        const bubbleHeight = this.bubble.offsetHeight;
        // whiteedge has to be moved because it's not a child of bubble, because it has to be behind (z-index stuff)
    }
}


function addWord(symbol, set_name, get_rows=false){

    try{
    }
    catch(e){
    }

    alert("Added " + symbol + " to " + set_name);
    
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

let currentCharacter;

function populateCardSets() {
    const dropdownTriggerCard = document.getElementById('wordListDropdownCard');
    const dropdownMenu = document.getElementById('dropdown-options-card');
    dropdownMenu.innerHTML = '';

    dropdownMenu.addEventListener('mouseenter', () => {
    });

    dropdownMenu.addEventListener('mouseleave', () => {
        dropdownMenu.style.display = 'none';
    });

    document.addEventListener('click', (e) => {
        if(!dropdownMenu.contains(e.target)){
            dropdownMenu.style.display = 'none';
        }
    });

    custom_deck_names.forEach(listName => {
        const option = document.createElement('div');
        option.className = 'dropdown-item';
        option.textContent = listName;
        option.dataset.value = listName;
        dropdownMenu.appendChild(option);
        option.addEventListener('click', () => {
            dropdownMenu.style.display = 'none';
            addWord(currentCharacter, listName);
        });

        
    });
}

function makeNormalBubble(event, symbol){
    let bubblediv = document.getElementById('info-bubble');
    bubblediv.classList.add('info-bubble');

    bubblediv.innerHTML = "";

    currentCharacter = symbol;

    let hanzidiv = document.createElement('div');
    let pinyindiv = document.createElement('div');
    let englishdiv = document.createElement('div');

    let addcardbutton = document.createElement('button');
    addcardbutton.classList.add('normal-bubble-button');
    addcardbutton.textContent = 'Add word';
    
    const dropdownMenu = document.getElementById('dropdown-options-card');
    let dropdownMenuHeight = dropdownMenu.offsetHeight;
    let dropdownMenuWidth = dropdownMenu.offsetWidth;
    console.log(dropdownMenuHeight, dropdownMenuWidth);
    dropdownMenuHeight = custom_deck_names.length * 40;
    addcardbutton.addEventListener('click', function(event) {
        let mouseX = event.clientX + window.scrollX;
        let mouseY = event.clientY + window.scrollY;
        if(mouseY + dropdownMenuHeight > window.innerHeight + window.scrollY - 100){
            mouseY = window.innerHeight - dropdownMenuHeight + window.scrollY - 100;
        }
        event.stopPropagation();
        const isVisible = dropdownMenu.style.display === 'block';
        if (!isVisible) {
            dropdownMenu.style.top = mouseY + 10 + 'px';
            dropdownMenu.style.left = mouseX + 10 +'px';
            dropdownMenu.style.display = 'block';

        } else {
            dropdownMenu.style.display = 'none';
        }
    });


    hanzidiv.id = 'hanzi';
    pinyindiv.id = 'pinyin';
    englishdiv.id = 'english';

    hanzidiv.innerText = symbol;
    pinyindiv.innerText = word_data[symbol].pinyin.map(toAccentedPinyin).join(' / ');
    word_data[symbol].english.forEach((word, idx) => {
        englishdiv.innerHTML += `<span>- ${word}</span>`;
        if(idx < word_data[symbol].english.length - 1){
            englishdiv.innerHTML += '<br>';
        }
    });

    bubblediv.appendChild(hanzidiv);
    bubblediv.appendChild(pinyindiv);
    bubblediv.appendChild(englishdiv);
    bubblediv.appendChild(addcardbutton);
    bubblediv.style.display = 'flex';
    // position it next to mouse, takign into account the scroll
    let mouseX = event.clientX + window.scrollX;
    let mouseY = event.clientY + window.scrollY;

    let bubbleHeight = bubblediv.offsetHeight;
    let bubbleWidth = bubblediv.offsetWidth;

    if(mouseY + bubbleHeight > window.innerHeight + window.scrollY-100){
        mouseY = window.innerHeight + window.scrollY - bubbleHeight-100;
    }

    bubblediv.style.left = mouseX + 10 + 'px';
    bubblediv.style.top = mouseY + 10 + 'px';
    clearTimeout(bubbletimeout);
    bubbletimeout = setTimeout(() => {
        bubblediv.style.display = 'none';
    }, 2000);

    clearTimeout(dctim);
    document.removeEventListener('click', handledoccl);

    
    dctim = setTimeout(() => {
        document.addEventListener('click', handledoccl);
    }, 33);
}
let bubbletimeout;
let dctim;

function handledoccl(event) {
    let bubblediv = document.getElementById('info-bubble');
    if(!bubblediv.contains(event.target)){
        bubblediv.style.display = 'none';
    }
}

function setupNormalBubbleInteractions(){
    
    let bubblediv = document.getElementById('info-bubble');
    bubblediv.addEventListener('mouseenter', function(event) {
        clearTimeout(bubbletimeout);
    });

    bubblediv.addEventListener('mouseleave', function(event) {
        clearTimeout(bubbletimeout);
        bubbletimeout = setTimeout(() => {
            bubblediv.style.display = 'none';
            clearTimeout(dctim);
            document.removeEventListener('click', handledoccl);
        }, 2000);
    });
    populateCardSets();

}

function makeAIBubble(prompt, symbol=null){
    // removeBubbleFromDOM();
    // remove all bubbles
    if(activeBubble){
        removeBubbleFromDOM(activeBubble);
    }
    let style = null;

    let bubblediv = document.getElementById('translation-bubble');
    bubblediv.className = 'translation-bubble';
    window.getSelection().removeAllRanges();

    // create a text container
    let bubbletext = document.createElement('div');
    bubbletext.className = 'translation-bubble-text';
    bubbletext.innerHTML = "<span class='translation-bubble-text italic-text'>thinking...</span>";
    if(isDarkMode){
        bubbletext.innerHTML = "<span class='italic-text darkmode'>thinking...</span>";
    }
    // bubbletext.style.display = 'none';
    // bubbletext.innerHTML = prompt;

    // bubblediv.innerHTML = request.translatedText;
    // button with lable "open in grid"
    let openInGridButton = document.createElement('button');
    openInGridButton.textContent = 'Explore in other words';
    openInGridButton.classList.add('bubble-button');
    openInGridButton.addEventListener('click', function() {
        window.open(`/search?query=${symbol}`, '_blank', 'noopener,noreferrer');
        if(activeBubble){
            removeBubbleFromDOM(activeBubble);
        }
    });
    
    let addToLearningButton = document.createElement('button');
    addToLearningButton.textContent = 'Add to learning';
    addToLearningButton.classList.add('bubble-button');
    addToLearningButton.addEventListener('click', function() {
        console.log("ello")
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

        // if (activeBubble) {
        //     removeBubbleFromDOM(activeBubble);
        // }
    });
    
    let aiDescriptionButton = document.createElement('div');
    // bubbletext.innerHTML = "<span class='translation-bubble-text italic-text'>thinking...</span>";

    aiDescriptionButton.innerHTML = '<span class="italic-text">' + llm_model_name + '</span> description';
    aiDescriptionButton.classList.add('ai-bubble-button');
    if(isDarkMode){
        aiDescriptionButton.innerHTML = '<span class="italic-text darkmode">' + llm_model_name + '</span> description';
    }
    aiDescriptionButton.addEventListener('click', function() {
        // if(bubbletext.style.display === 'none'){
        //     bubbletext.style.display = 'flex';
        // }
        // else{
        //     bubbletext.style.display = 'none';
        // }
    });


    bubblediv.appendChild(aiDescriptionButton);
    bubblediv.appendChild(bubbletext);
    bubblediv.appendChild(openInGridButton);
    bubblediv.appendChild(addToLearningButton);
    document.body.appendChild(bubblediv);
    

    if(isMobileOrTablet()){
        setTimeout(() => {
            hasOpenBubbles = true;
            window.getSelection().removeAllRanges();
        }, 1000);
    }
    else{
        hasOpenBubbles = true;
    }

    let bubbleobj = new Bubble(bubblediv);
    activeBubble = bubbleobj;
    bubbleobj.bubbletext = bubbletext;

    bubblediv.classList.add('bubble-div');
    bubbletext.classList.add('bubble-text');
    if(isDarkMode){
        bubblediv.classList.add('darkmode');
        bubbletext.classList.add('darkmode');
        aiDescriptionButton.classList.add('darkmode');
        openInGridButton.classList.add('darkmode');
        addToLearningButton.classList.add('darkmode');
    }
    
    // bubbletext.style.overflowY = bubbletext.scrollHeight > bubbletext.clientHeight ? 'scroll' : 'hidden';

    applyInitialPos(bubbleobj);
    

    const documentClickHandler = function(event) {
        if (!bubblediv.contains(event.target)) {
            if(!bubbleobj.removed){
                removeBubbleFromDOM(bubbleobj);
                bubbleobj.removed = true;
                document.body.removeEventListener('click', documentClickHandler);
                hasOpenBubbles = false;
            }
        }
    };
    setInterval(() => {
        document.body.addEventListener('click', documentClickHandler);
        bubbleobj.documentClickHandler = documentClickHandler;
    }, 110);
        

    fetchStream(prompt, bubbleobj);
}

let timeouts = [];


let isPlaying = false;
function createPlaybackController() {
    const controller = document.createElement('div');
    controller.id = 'playback-controller';

    const rewindButton = document.createElement('div');
    rewindButton.id = 'rewind-button';
    rewindButton.classList.add('playback-button');
    rewindButton.innerHTML = '<i class="fa-solid fa-backward"></i>';

    const playButton = document.createElement('div');
    playButton.id = 'play-button';
    playButton.classList.add('playback-button');
    playButton.innerHTML = '<i class="fa-solid fa-circle-play"></i>';

    playButton.addEventListener('click', () => {
        if (isPlaying) {
            playButton.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
            pauseStory();
        } else {
            playStory();
            playButton.innerHTML = '<i class="fa-solid fa-pause"></i>';
        }
        isPlaying = !isPlaying;
    });

    rewindButton.addEventListener('click', () => {
        playButton.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
        rewindStory();
    });

    controller.appendChild(rewindButton);
    controller.appendChild(playButton);
    document.body.appendChild(controller);
}




function addBubbleInteractions(bubbleobj) {

    let bubble = bubbleobj.bubble;
    bubble.addEventListener('mousedown', function(event) {
        event.stopPropagation();  // Prevent the bubble from closing when clicked
    }, false);

    const draggableArea = document.createElement('div');
    // set id
    draggableArea.setAttribute('id', 'translation-bubble-draggable');
    draggableArea.style.width = '50px';
    draggableArea.style.height = '14px';
    draggableArea.style.position = 'absolute';
    draggableArea.style.top = '2px';
    draggableArea.style.left = '50%';
    draggableArea.style.transform = 'translateX(-50%)';
    draggableArea.style.cursor = 'move';
    draggableArea.style.background = '#ffffff88';
    draggableArea.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    draggableArea.style.borderRadius = '4px';
    draggableArea.style.cursor = 'pointer';
    draggableArea.style.zIndex = '333';
    draggableArea.style.opacity = '0.0';
    draggableArea.style.transition = 'opacity 0.3s ease';
    bubble.appendChild(draggableArea);

    bubbleobj.draggablearea = draggableArea;

    draggableArea.addEventListener('mousedown', function(event) {
        bubbleobj.dragged = true;
        offsetX = (event.clientX + window.scrollX - parseInt(bubble.style.left, 10));
        offsetY = (event.clientY + window.scrollY - parseInt(bubble.style.top, 10));
        // event.preventDefault(); // Prevent text selection
    });
    
    draggableArea.addEventListener('mouseover', function(event) {
        let close = bubbleobj.closebutton;
        let drag = bubbleobj.draggablearea;
        close.style.opacity = '1.0';
        drag.style.opacity = '1.0';
        bubbleobj.overdragged = true;
        console.log('overdragged');
    });

    draggableArea.addEventListener('mouseout', function(event) {
        let close = bubbleobj.closebutton;
        let drag = bubbleobj.draggablearea;
        close.style.opacity = '0.0';
        drag.style.opacity = '0.0';
        bubbleobj.overdragged = false;
    });

    document.addEventListener('mousemove', function(event) {
        if (bubbleobj.dragged) {
            bubbleobj.setPos(
                event.clientX + window.scrollX - offsetX,
                event.clientY + window.scrollY - offsetY
            );
        }
    });
    
    document.addEventListener('mouseup', function() {
        bubbleobj.dragged = false;
        // checkMouseOver(bubbleobj);
    });


    document.addEventListener('mousemove', function(event) {
        let x = event.clientX + window.scrollX;
        let y = event.clientY + window.scrollY;
        mouseX = x;
        mouseY = y;
        // checkMouseOver(bubbleobj);
    });
}

document.addEventListener('mousemove', function(event) {
    rmouseX = event.clientX;
    rmouseY = event.clientY;
});


function checkMouseOver(bubbleobj){
    let x = mouseX;
    let y = mouseY;
    let close = bubbleobj.closebutton;
    let drag = bubbleobj.draggablearea;
    let bubble = bubbleobj.bubble;
    let bubbleX = parseInt(bubble.style.left, 10);
    let bubbleY = parseInt(bubble.style.top, 10);
    let bubbleWidth = bubble.offsetWidth;
    let bubbleHeight = bubble.offsetHeight;
    if(x > bubbleX && x < bubbleX + bubbleWidth && y > bubbleY && y < bubbleY + bubbleHeight) {
        close.style.opacity = '1.0';
        drag.style.opacity = '1.0';
        bubbleobj.mouseover = true;
        clearTimeout(bubbleobj.fadeId);
        bubbleobj.fadeId = null;
        // after one second fade it back to 0.0
        if(!bubbleobj.dragged){
            if(!bubbleobj.fadeId){
                bubbleobj.fadeId = setTimeout(() => {
                    if(!bubbleobj.overdragged){
                        close.style.opacity = '0.0';
                        drag.style.opacity = '0.0';
                    }
                }, 1000);
            }
        }
        if (bubbleobj.timeoutId) {
            clearTimeout(bubbleobj.timeoutId);
            bubbleobj.timeoutId = null;      
        }
    } else {
        close.style.opacity = '0.0';
        drag.style.opacity = '0.0';
        if(bubbleobj.mouseover)
            resetTimeout(bubbleobj);
        bubbleobj.mouseover = false;
    }
}

function resetTimeout(bubbleobj) {
    if (bubbleobj.timeoutId) {
        clearTimeout(bubbleobj.timeoutId);
        bubbleobj.timeoutId = null;            
    }
    bubbleobj.timeoutId = setTimeout(() => {
        if (!bubbleobj.removed) {
            removeBubbleFromDOM(bubbleobj);
            activeBubbles = activeBubbles.filter(b => b !== bubbleobj);
            bubbleobj.removed = true; // Mark the object as removed
        }
    }, 3333);
}

function removeBubbleFromDOM(bubbleobj) {
    // Animate opacity from 1 to 0
    document.removeEventListener('click', bubbleobj.documentClickHandler);
    bubbleobj.bubble.style.transition = 'opacity 0.2';
    // bubbleobj.closebutton.style.transition = 'opacity 0.2';
    // bubbleobj.draggablearea.style.transition = 'opacity 0.2';

    bubbleobj.bubble.style.opacity = '0';
    // bubbleobj.closebutton.style.opacity = '0';
    // bubbleobj.draggablearea.style.opacity = '0';

    // Set a timeout to remove the elements from the DOM after the animation
    setTimeout(() => {
        if(bubbleobj.bubble.parentNode){
            bubbleobj.bubble.parentNode.removeChild(bubbleobj.bubble);
        }
        else{
            console.log("???")
        }
        // bubbleobj.closebutton.parentNode.removeChild(bubbleobj.closebutton);
        // bubbleobj.draggablearea.parentNode.removeChild(bubbleobj.draggablearea);
    }, 200);  // Delay of 1000 milliseconds
}

function getStory(selectedStoryIndex, selectedChapterIndex, func=null) {
    if(activeBubble){
        removeBubbleFromDOM(activeBubble);
    }
    fetch(`./get_story/${selectedStoryIndex}/${selectedChapterIndex}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            chapter = data.chapter;
            dataPerCharacter = data.char_data;
            word_data = data.word_data;
            if(func) {
                func();
            }
            // Optionally, you can call getStoryStrokes here if you want to start loading stroke data immediately
            getStoryStrokes(selectedStoryIndex, selectedChapterIndex);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error.message);
        });
}

function getStoryStrokes(selectedStoryIndex, selectedChapterIndex, func=null) {
    fetch(`./get_story_strokes/${selectedStoryIndex}/${selectedChapterIndex}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(strokeData => {
            for (let char in strokeData) {
                if (dataPerCharacter.hasOwnProperty(char)) {
                    dataPerCharacter[char].strokes = strokeData[char];
                }
            }
            if(func) {
                func();
            }
            // You can call a function here to update the UI with stroke data if needed
        })
        .catch(error => {
            console.error('There was a problem fetching stroke data:', error.message);
        });
}

let removeDropdownListeners = null;
function setupDropdowns() {
    let dropdowns = [
        {
            elem: document.getElementById('storyList'),
            childquery: '.story-option',
            childquery2: '.isstory',
            selected: document.getElementById('selectedStory'),
        },
        {
            elem: document.getElementById('chapterList'),
            childquery: '.chapter-option',
            childquery2: '.ischapter',
            selected: document.getElementById('selectedChapter'),
        },
        {
            elem: document.getElementById('fontList'),
            childquery: '.font-choice',
            childquery2: '.isfont',
            selected: document.getElementById('selectedFont'),
        }
    ];

    let eventListeners = [];

    dropdowns.forEach((drop, idx) => {
        const toggleDropdownListener = function(event) {
            event.stopPropagation();
            drop.elem.classList.toggle('open');
        };
        drop.elem.addEventListener('click', toggleDropdownListener);
        eventListeners.push({ elem: drop.elem, type: 'click', listener: toggleDropdownListener });

        let optionsElements = document.querySelectorAll(drop.childquery2);
        optionsElements.forEach(option => {
            const optionClickListener = function() {
                const value = parseInt(option.dataset.value);
                selectedDropdownValue[idx] = value;
                const row = option.querySelector(drop.childquery).cloneNode(true);
                drop.selected.innerHTML = '';
                drop.selected.appendChild(row);
                if (drop.elem.id == 'chapterList') {
                    selectedChapterIndex = value;
                    chapter = getStory(selectedStoryIndex, selectedChapterIndex, redrawText);
                    populateChapterOptions();
                    removeDropdownListeners();
                    setupDropdowns();
                    naturalCheckbox.checked = false;
                    document.querySelectorAll('.stroke-options').forEach((el) => {
                        el.style.display = 'none';
                    });
                } else if (drop.elem.id == 'storyList') {
                    selectedStoryIndex = value;
                    selectedChapterIndex = 1;
                    chapter = getStory(selectedStoryIndex, selectedChapterIndex, redrawText);
                    populateChapterOptions();
                    removeDropdownListeners();
                    setupDropdowns();
                    naturalCheckbox.checked = false;
                    document.querySelectorAll('.stroke-options').forEach((el) => {
                        el.style.display = 'none';
                    });
                } else if (drop.elem.id == 'fontList') {
                    renderFont = fontList[value - 1];
                    naturalCheckbox.checked = false;
                    document.querySelectorAll('.stroke-options').forEach((el) => {
                        el.style.display = 'none';
                    });
                    redrawText();
                } else {
                    redrawPlotters();
                }
            };
            option.addEventListener('click', optionClickListener);
            eventListeners.push({ elem: option, type: 'click', listener: optionClickListener });
        });

        // Document click event to close dropdown
        const closeDropdownListener = function() {
            drop.elem.classList.remove('open');
        };
        document.addEventListener('click', closeDropdownListener);
        eventListeners.push({ elem: document, type: 'click', listener: closeDropdownListener });
    });

    // Return the function to remove all listeners
    function removeDropdownListeners_() {
        eventListeners.forEach(event => {
            event.elem.removeEventListener(event.type, event.listener);
        });
        eventListeners = []; // Reset the list after removing all listeners
    }

    // Return the remove function for external use
    removeDropdownListeners = removeDropdownListeners_;
}

let stopRequested = false;
let currentStoryIndex = 0;
let currentPlayingAudio = null;

function rewindStory() {
    pauseStory();
    unhighlightAllLines();
    currentStoryIndex = 0;
    highLightLine(currentStoryIndex);
    isPlaying = false;
}

function playStory() {
    stopRequested = false;

    function playLine(idx) {
        if (stopRequested) {
            unhighlightAllLines();
            return;
        }

        currentStoryIndex = idx;
        highLightLine(idx);
        playLineClip(chapter.clip_ids[idx], () => {
            if (!stopRequested && idx < currentLines.length - 1) {
                playLine(idx + 1);
            } else {
                unhighlightAllLines();
                currentStoryIndex = 0; // Reset when finished
            }
        });
    }

    playLine(currentStoryIndex);
}

function pauseStory() {
    stopRequested = true;
    if(isMobileOrTablet()){
        unhighlightAllLines();
    }
    if (currentPlayingAudio) {
        currentPlayingAudio.pause();
    }
}




// on 'tab' press toggle visibiliy of id=inputContainer

document.addEventListener("DOMContentLoaded", async function () {
    // dimsSlider = document.getElementById('dimsSlider');
    // paddingSlider = document.getElementById('paddingSlider');
    
    await Promise.all([
        waitForImage(okhslImage),
    ]);



    createPlaybackController();
    setupNormalBubbleInteractions();

    colorCanvas.width = okhslImage.width;
    colorCanvas.height = okhslImage.height;
    colorCtx.drawImage(okhslImage, 0, 0);
    
    document.querySelectorAll('.stroke-options').forEach((el) => {
        el.style.display = 'none';
    });

    sizeSlider = document.getElementById('sizeSlider');
    thicknessSlider = document.getElementById('thicknessSlider');
    noiseSlider = document.getElementById('noiseSlider');

    // dimsValue = document.getElementById('dimsValue');
    // paddingValue = document.getElementById('paddingValue');
    sizeValue = document.getElementById('sizeValue');
    thicknessValue = document.getElementById('thicknessValue');
    noiseValue = document.getElementById('noiseValue');

    if(isMobileOrTablet()){
        sizeSlider.value = 40;
        sizeValue.textContent = 40;
    }



    backgroundCheckbox = document.getElementById('backgroundCheckbox');
    backgroundCheckbox2 = document.getElementById('backgroundCheckbox2');
    pinyinCheckbox = document.getElementById('pinyinCheckbox');
    naturalCheckbox = document.getElementById('naturalCheckbox');

    plottersWrapper = document.getElementById('plottersWrapper');
    plottersElem = document.getElementById('plotters');

    noiseValue.textContent = noiseSlider.value;
    pinyinCheckbox.checked = showAllPinyin;
    populateStoryOptions();
    populateChapterOptions();
    // populateColorOptions();
    // redrawPlotters();
    // updateCount();
    setupDropdowns();
    
    chapter = getStory(1, 1, redrawText);



    sizeSlider.addEventListener('change', function() {
        sizeValue.textContent = this.value;
        if(naturalCheckbox.checked){
            redrawPlotters();
        }
    });

    sizeSlider.addEventListener('input', function() {
        sizeValue.textContent = this.value;
        if(!naturalCheckbox.checked){
            redrawText();
        }
    });

    thicknessSlider.addEventListener('change', function() {
        thicknessValue.textContent = this.value + 'pt';
        if (!plottersElem.classList.contains('empty')) {
            redrawPlotters();
        }
    });

    noiseSlider.addEventListener('change', function() {
        noiseValue.textContent = this.value;
        if (!plottersElem.classList.contains('empty')) {
            redrawPlotters();
        }
    });

    backgroundCheckbox.addEventListener('input', function() {
        if (!plottersElem.classList.contains('empty')) {
            redrawPlotters();
        }
    });

    backgroundCheckbox2.addEventListener('input', function() {
        if (!plottersElem.classList.contains('empty')) {
            redrawPlotters();
        }
    });

    naturalCheckbox.addEventListener('change', function() {
        if (!plottersElem.classList.contains('empty')) {
            redrawPlotters();
        }
        if(!this.checked){
            document.querySelectorAll('.stroke-options').forEach((el) => {
                el.style.display = 'none';
            });
        }
        else{
            document.querySelectorAll('.stroke-options').forEach((el) => {
                el.style.display = 'flex';
            });
        }
    });

    pinyinCheckbox.addEventListener('change', function() {
        showAllPinyin = this.checked;
        applyPinyinVisibility();
    });

    plottersElem.addEventListener('mousedown', function(e) {
        // e.preventDefault();
    });
});


document.addEventListener("mousedown", function () {
    isMouseDown = true;
});

document.addEventListener("mouseup", function () {
    isMouseDown = false;
});

document.addEventListener("keydown", function (e) {
    if (e.key === 'q') {
        showAllPinyin = !showAllPinyin;
        applyPinyinVisibility();
    }
});

document.addEventListener("mousemove", function (e) {
    if (isMouseDown) {
        const plotterIndex = e.target.dataset.plotterIndex;
        if (plotterIndex !== undefined) {
            plotters[plotterIndex].plotter.canvas.click();
        }
    }
});

const llm_model_name = "gpt-4o";
function fetchStream(prompt, bubble) {
    fetch("/api/openaiexplain", { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: llm_model_name,
            messages: [
                {"role": "system", "content": "I am a genius Chinese language instructor."},
                {"role": "user", "content": prompt}
            ],
            max_tokens: 400,
            stream: true
        })
    })
    .then(response => {
        const reader = response.body.getReader();
        let streamText = '';
        let isFirstChunk = true;  // Flag to check if it's the first chunk

        return reader.read().then(function processText({ done, value }) {
            if (done) {
                // console.log('sending last chunk');
                // chrome.tabs.sendMessage(tabId, {
                //     type: "sendTranslationEnd"
                // });
                // storeTranslation(fullInput, fullOutputTranslation);
                return streamText;
            }
            streamText += new TextDecoder("utf-8").decode(value, {stream: true});

            let lastNewline = streamText.lastIndexOf('\n');
            if (lastNewline > -1) {
                let messages = streamText.substring(0, lastNewline).split('\n');
                messages.forEach(message => {
                    if (message.startsWith('data: ')) {
                        message = message.substring(6); // Remove 'data: ' prefix
                        // if message is text, just print it
                        if(!message.startsWith('[DONE]')) {
                            try {
                                const data = JSON.parse(message);
                                if (data.choices) {
                                    data.choices.forEach(choice => {
                                        if (choice.delta && choice.delta.content) {
                                            if (isFirstChunk) {
                                                // console.log('sending first chunk')
                                                bubble.bubbletext.innerHTML = choice.delta.content;
                                                isFirstChunk = false;  // Update the flag after sending the first message
                                            } else {
                                                let chunk = choice.delta.content;
                                                fullOutputTranslation += chunk;
                                                bubble.bubbletext.innerHTML += chunk;
                                            }
                                        }
                                    });
                                }
                            } catch (error) {
                                console.log('Received non-JSON or special message:', error);
                            }
                        }
                    }
                });
                streamText = streamText.substring(lastNewline + 1);
            }
            return reader.read().then(processText);
        });
    })
    .catch(err => console.error('Error:', err));
}

function renderTextToDom(plotterElement, plotters, showAllPinyin, colors, size, dataPerCharacter, currentLines, storyTitleElem) {
    plotterElement.innerHTML = '';
    
    plotterElement.dataset.plotters = plotters;

    let translationBox = document.createElement('div');
    translationBox.setAttribute('id', 'translationBox');
    translationBox.classList.add('hidden');
    if(isDarkMode){
        translationBox.classList.add('darkmode');
    }
    //plotterElement.appendChild(translationBox);
    // let plottersWrapper = document.getElementById('plottersWrapper');
    // plottersWrapper.appendChild(translationBox);
    document.body.appendChild(translationBox);

    let currentLineIndex = null;    
    let currentWrapper = null;

    storyTitleElem.style.fontSize = size / 40 + 'em';

    let storyPlaying = false;

    plotters.forEach((plotterinfo, index) => {
        let plotter = plotterinfo.plotter;
        let lineIndex = plotterinfo.lineIndex;
        let char = plotterinfo.char;

        let isTitle = lineIndex === -1;

        if (lineIndex !== currentLineIndex) {
            currentWrapper = document.createElement('div');
            currentWrapper.className = 'line-wrapper';
            if(!isMobileOrTablet()){
                currentWrapper.classList.add('desktop');
            }
            if(isDarkMode){
                currentWrapper.classList.add('darkmode');
            }
            if(isTitle){
                currentWrapper.style.textAlign = 'center';
            }
            currentWrapper.dataset.lineIndex = lineIndex;
            if(isTitle){
                currentWrapper.onclick = () => {
                    if(!storyPlaying){
                        // playStory();
                        storyPlaying = true;
                    }
                    else{
                        storyPlaying = false;
                        // pauseStory();
                    }
                }
            }
            plotterElement.appendChild(currentWrapper);
            currentLineIndex = lineIndex;
            addHoverBehaviorToWrapper(currentWrapper, lineIndex);
        }
        if (isHanzi(char) && !isPunctuation(char)) {
            let charContainer = document.createElement('div');
            charContainer.style.display = 'inline-block';
            charContainer.style.textAlign = 'center';
            charContainer.classList.add('plotterContainer');

            let pinyinElement = document.createElement('div');
            pinyinElement.classList.add('pinyinLabel');
            pinyinElement.classList.add('line_' + lineIndex);
            pinyinElement.style.fontSize = (size / 150) + 'em'; // Adjust this ratio as needed
            pinyinElement.style.height = '20px';
            pinyinElement.style.userSelect = 'none';
            if (!showAllPinyin) {
                pinyinElement.classList.add('hidden');
            }

            let charSpan = document.createElement('span');
            charSpan.classList.add('chinese-text');
            charSpan.style.fontFamily = renderFont;
            charSpan.textContent = char;
            charSpan.style.fontSize = size / 50 + 'em';
            charSpan.style.color = colors[0];

            charSpan.addEventListener(isMobileOrTablet() ? 'touchstart' : 'click', function(event) {
                let timer;
                let touchDuration = 1500; 

                if (isMobileOrTablet()) {
                    // event.preventDefault();
                    timer = setTimeout(() => {
                        // deselect all text
                        handleInteraction();
                    }, touchDuration);

                    charSpan.addEventListener('touchend', () => {
                        clearTimeout(timer);
                    }, { once: true });
                } else {
                    
                    handleInteraction();
                }

                function handleInteraction() {
                    if (lineIndex !== currentHoveredLine && isMobileOrTablet()) {
                        return;
                    }
                    let prompt = 'explain to me briefly the function of the word/character ' + char + ' in the context of the sentence: "' + currentLines[lineIndex] + '". If it belongs to a word alongside other characters, please explain the word as a whole. Be brief, give me pinyin, and don\'t repeat the sentence and dont say "in the context..". If the char is not in the sentence, dont mention that fact, pretend its there.';
                    makeNormalBubble(event, char);
                    translationBox.classList.add('hidden');
                }
            });

            if(!isMobileOrTablet()){
                charSpan.classList.add('chinese-text-desktop')
            }
            if(isDarkMode){
                charSpan.classList.add('darkmode')
            }

            if(isTitle){
                charSpan.style.fontSize = size / 30 + 'em';
                charSpan.style.color = sampleOKHSL((selectedChapterIndex-1)/chapters[selectedStoryIndex-1].length, 0.4, 0.7, 1.);
                let shadowcolor = sampleOKHSL((selectedChapterIndex-1)/chapters[selectedStoryIndex-1].length, 0.5, 0.75, 0.15);
                charSpan.style.textShadow = `0 0 10px ${shadowcolor}, 0 0 10px ${shadowcolor}, 0 0 10px ${shadowcolor}, 0 0 10px ${shadowcolor}`;
                if(isDarkMode){
                    charSpan.style.color = sampleOKHSL((selectedChapterIndex-1)/chapters[selectedStoryIndex-1].length, 0.4, 0.7, 1.);
                    let shadowcolor = sampleOKHSL((selectedChapterIndex-1)/chapters[selectedStoryIndex-1].length, 0.5, 0.75, 0.15);
                    charSpan.style.textShadow = `0 0 10px ${shadowcolor}, 0 0 10px ${shadowcolor}, 0 0 10px ${shadowcolor}, 0 0 10px ${shadowcolor}`;
                }
            }

            charContainer.appendChild(pinyinElement);
            charContainer.appendChild(charSpan);
            currentWrapper.appendChild(charContainer);

            let charlist = char.split('');
            let resultcontent = '';
            charlist.forEach((char) => {
                if (char in dataPerCharacter) {
                    if (dataPerCharacter[char].pinyin) {
                        resultcontent += dataPerCharacter[char].pinyin + ' ';
                    }
                }
            });
            pinyinElement.textContent = resultcontent;
        } else {
            let latin = document.createElement('span');
            latin.classList.add('latin');
            latin.innerHTML = plotterinfo.char.replace("'", "\"");
            
            latin.style.color = colors[0];
            let rs = 50;
            if (isMobileOrTablet()) {
                latin.style.fontSize = size/rs + 'em';
            } else {
                latin.style.fontSize = size/rs + 'em';
            }
            latin.style.userSelect = 'none';
            currentWrapper.appendChild(latin);
        }
    });
}


function renderPlottersToDOM(plotterElement, plotters, showAllPinyin, colors, size, dataPerCharacter, currentLines, storyTitleElem) {
    plotterElement.innerHTML = '';
    
    plotterElement.dataset.plotters = plotters;

    let translationBox = document.createElement('div');
    translationBox.setAttribute('id', 'translationBox');
    translationBox.classList.add('hidden');
    if(isDarkMode){
        translationBox.classList.add('darkmode');
    }
    //plotterElement.appendChild(translationBox);
    // let plottersWrapper = document.getElementById('plottersWrapper');
    // plottersWrapper.appendChild(translationBox);
    document.body.appendChild(translationBox);

    let currentLineIndex = null;    
    let currentWrapper = null;
    let useTextRendering = !naturalCheckbox.checked;

    if (useTextRendering) { 
        storyTitleElem.style.fontSize = size / 40 + 'em';
        // plotterElement.appendChild(storyTitleElem);
    }
    else{
        storyTitleElem.style.fontSize = size / 35 + 'em';
        let text = storyTitleElem.textContent;
        storyTitleElem.innerHTML = "";
        // create plotters for each char in title
        let refplot = plotters[0];
        let numLines = currentLines.length;
        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            
        }
    }

    plotters.forEach((plotterinfo, index) => {
        let plotter = plotterinfo.plotter;
        let lineIndex = plotterinfo.lineIndex;

        let isTitle = lineIndex === -1;

        if (lineIndex !== currentLineIndex) {
            currentWrapper = document.createElement('div');
            currentWrapper.className = 'line-wrapper';
            if(!isMobileOrTablet()){
                currentWrapper.classList.add('desktop');
            }
            if(isDarkMode){
                currentWrapper.classList.add('darkmode');
            }
            if(isTitle){
                currentWrapper.style.textAlign = 'center';
            }
            currentWrapper.dataset.lineIndex = lineIndex;
            plotterElement.appendChild(currentWrapper);
            currentLineIndex = lineIndex;

            addHoverBehaviorToWrapper(currentWrapper, lineIndex);
        }

        if (plotter) {
            let char = plotterinfo.char;
            let canvasContainer = document.createElement('div');
            let pinyinElement = document.createElement('div');

            plotter.draw();
            plotter.canvas.dataset.plotterIndex = index;
            
            canvasContainer.style.position = 'relative';
            canvasContainer.style.display = 'inline-block';
            canvasContainer.classList.add('plotterContainer');
            
            pinyinElement.style.textAlign = 'center';
            pinyinElement.style.userSelect = 'none';
            pinyinElement.style.height = '20px';
            if (!showAllPinyin) {
                pinyinElement.classList.add('hidden');
            }
            pinyinElement.classList.add('pinyinLabel');
            // pinyinElement.classList.add('pinyinLabelColor');
            pinyinElement.classList.add('line_' + lineIndex);
            
            canvasContainer.addEventListener('click', function(event) {
                let prompt = 'explain to me briefly the function of the word/character ' + char + ' in the context of the sentence: "' + currentLines[lineIndex] + '". If it belongs to a word alongside other characters, please explain the word as a whole. Be brief, don\'t repeat the sentence. If the char is not in the sentence, dont mention that fact, pretend its there.';

                if(lineIndex !== currentHoveredLine){
                    return;
                }
                makeNormalBubble(event, char);
                translationBox.classList.add('hidden');

            });
            

            canvasContainer.appendChild(pinyinElement);
            canvasContainer.appendChild(plotter.getCanvas());

            canvasContainer.classList.add('line_' + lineIndex);
            canvasContainer.classList.add('chinese-text-desktop');
            
            currentWrapper.appendChild(canvasContainer);

            if (char in dataPerCharacter) {
                let strokes = dataPerCharacter[char].strokes.medians.map(stroke => {
                    stroke.map(point => {
                        point.x = point[0];
                        point.y = point[1];
                    });
                    let spoints = evenOutPoints(stroke, 22);
                    return spoints;
                });
                let pinyinAndEnglish = { pinyin: dataPerCharacter[char].pinyin, english: null };
                if (pinyinAndEnglish && pinyinAndEnglish.pinyin) {
                    pinyinElement.textContent = pinyinAndEnglish.pinyin;
                }
            } else {
                //let readyPromise = loadStrokeData();
                plotter.loadPinyinEnglish();
            }
        } else {
            let latin = document.createElement('span');
            latin.classList.add('latin');
            latin.innerHTML = plotterinfo.char;
            
            latin.style.color = colors[0];
            let rs = 50;
            if(useTextRendering)
                rs = 50;
            if (isMobileOrTablet()) {
                latin.style.fontSize = size/rs + 'em';
            } else {
                latin.style.fontSize = size/rs + 'em';
            }
            latin.style.userSelect = 'none';
            currentWrapper.appendChild(latin);
        }
    });
}

function redrawText(){
    let titleHanzi = chapter.name.concat(['\n']);
    //prepend title to chapter.hanzi
    
    currentLines = chapter.hanzi;
    let words = [];
    currentLines.forEach(line => {
        words = words.concat(line);
        words = words.concat(['\n']);
    });
    currentLines = currentLines.map(line => line.join(''));
    let joinedLines = currentLines.join('\n');
    let numLines = currentLines.length;
    let lineIndex = -1;
    let titlelength = titleHanzi.length;
    let characters = titleHanzi.concat(joinedLines.split(''));
    words = titleHanzi.concat(words);

    const plotterElement = document.getElementById('plotters');
    plotterElement.innerHTML = '';
    plotters = [];
    
    let size = parseFloat(sizeSlider.value)*2;

    let storyTitleElem = document.createElement('div');
    storyTitleElem.classList.add('story-title');
    storyTitleElem.style.fontFamily = renderFont;
    storyTitleElem.style.fontSize = size / 40 + 'em';
    storyTitleElem.textContent = titleHanzi;

    colors = ['#111'];
    if(isDarkMode){
        colors = ['#ddd'];
    }
    
    let lineType = 'round'; 
    lineType = 'round'; 
    lineType = 'miter'; 
    if (isMobileOrTablet()) {
        // console.log('Mobile or tablet detected');
        // size = 48;
    }
    words.forEach((char, index) => {
        plotters.push({ plotter: null, char: char, lineIndex: lineIndex });
        if (char === '\n') {
            plotters.push({ plotter: null, char: '<br>', lineIndex: lineIndex });
            lineIndex++;
        }
    });
    if (plotters.length > 0) {
        plottersElem.classList.remove('empty');
    }
    else {
        plottersElem.classList.add('empty');
    }

    if (plotterElement && plotters) {
        renderTextToDom(plotterElement, plotters, showAllPinyin, colors, size, dataPerCharacter, currentLines, storyTitleElem);
    }

}

function redrawPlotters() {
    let titleHanzi = chapter.name.concat(['\n']);
    //prepend title to chapter.hanzi
    let currentLines = chapter.hanzi;
    currentLines = currentLines.map(line => line.join(''));
    let joinedLines = currentLines.join('\n');
    let numLines = currentLines.length;
    let lineIndex = -1;
    let titlelength = titleHanzi.length;
    let characters = titleHanzi.concat(joinedLines.split(''));

    const plotterElement = document.getElementById('plotters');
    plotterElement.innerHTML = '';
    plotters = [];
    
    let size = parseFloat(sizeSlider.value)*2;

    let storyTitleElem = document.createElement('div');
    storyTitleElem.classList.add('story-title');
    storyTitleElem.style.fontFamily = renderFont;
    storyTitleElem.style.fontSize = size / 40 + 'em';
    storyTitleElem.textContent = titleHanzi;

    let speed = .03;
    let lineThickness = parseFloat(thicknessSlider.value*size/200);
    let jitterAmp = parseFloat(noiseSlider.value*30);
    colors = ['#111'];
    if(isDarkMode){
        colors = ['#ddd'];
    }
    
    let lineType = 'round'; 
    lineType = 'round'; 
    lineType = 'miter'; 
    if (isMobileOrTablet()) {
        // console.log('Mobile or tablet detected');
        // size = 48;
    }
    characters.forEach((char, index) => {
        let strokes = undefined;
        if(dataPerCharacter){
            if(dataPerCharacter[char]){
                strokes = dataPerCharacter[char].strokes.medians;
            }
        }
        if (isHanzi(char) && !isPunctuation(char)) {
            let usedcolors = [...colors];
            if(lineIndex === -1){
                let tt = sampleOKHSL((selectedChapterIndex-1)/chapters[selectedStoryIndex-1].length, 0.4, 0.7, 1.);
                if(isDarkMode){
                    let tt = sampleOKHSL((selectedChapterIndex-1)/chapters[selectedStoryIndex-1].length, 0.4, 0.7, 1.);
                }
                
                usedcolors = [tt,tt,tt]
            }
            const plotter = new HanziPlotter({
                character: char,
                strokes: strokes,
                dimension: size * (1 + .2*(lineIndex===-1)),
                speed: speed,
                lineThickness: lineThickness * (1 + 1*(lineIndex===-1)),
                jitterAmp: jitterAmp,
                colors: usedcolors,
                lineType: lineType,
                showDiagonals: backgroundCheckbox.checked,
                showGrid: backgroundCheckbox2.checked,
                clickAnimation: false,
            });
            plotters.push({ plotter: plotter, char: char, lineIndex: lineIndex });
        }
        else {
            plotters.push({ plotter: null, char: char, lineIndex: lineIndex });
            if (char === '\n') {
                plotters.push({ plotter: null, char: '<br>', lineIndex: lineIndex });
                lineIndex++;
            }
        }
    });
    if (plotters.length > 0) {
        plottersElem.classList.remove('empty');
    }
    else {
        plottersElem.classList.add('empty');
    }

    if (plotterElement && plotters) {
        renderPlottersToDOM(plotterElement, plotters, showAllPinyin, colors, size, dataPerCharacter, currentLines, storyTitleElem);
    }

}

function throttle(func, limit) {
    let inThrottle = false;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    }
}

function updateCount() {
    let hanziCount = document.getElementById('hanziCount');
    hanziCount.textContent = input.value.length + ' characters';
}


function playLineClip(clipName, callback=null) {
    console.log('Playing clip:', clipName);
    currentPlayingAudio = new Audio(`./api/get_story_audio_clip?name=${clipName}`);

    currentPlayingAudio.playbackRate = .75;
    currentPlayingAudio.play();
    currentPlayingAudio.onended = function() {
        if (callback) {
            callback();
        }
    };
}