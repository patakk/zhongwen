function getCharactersHoverInfo(characters=null, func=null) {
    const url = './api/get_characters_simple_info';
    
    // Convert Set to Array if it's a Set
    const charactersArray = characters instanceof Set ? Array.from(characters) : characters;
    
    const payload = { characters: charactersArray };
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    };

    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if(func){
                func(data);
            }
            // updateCharacterDisplay(data.characters);
        })
        .catch(error => console.error('Error:', error));
}

let currentWriters = [];
function getCharactersPinyinEnglish(characters=null, func=null) {
    const url = './api/get_characters_pinyinenglish';
    
    // Convert Set to Array if it's a Set
    const charactersArray = characters instanceof Set ? Array.from(characters) : characters;
    
    const payload = { characters: charactersArray };
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    };

    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if(func){
                func(data);
            }
            // updateCharacterDisplay(data.characters);
        })
        .catch(error => console.error('Error:', error));
}



function displayCharMatches(charMatches) {
    const container = document.getElementById('flashcard_char_matches');
    container.innerHTML = ''; // Clear existing content

    const wordsContainer = document.createElement('div');
    wordsContainer.className = 'words-container';

    // Flatten the structure and get all unique words
    const allWords = new Set();
    for (const char in charMatches) {
        for (const hskLevel in charMatches[char]) {
            charMatches[char][hskLevel].forEach(word => allWords.add(word));
        }
    }
    if(allWords.size === 0){
        return;
    }
    getCharactersPinyinEnglish(allWords, (data)=>{
        // Create a box for each unique word
        let chardict = {};
        for(const char of data.characters){
            chardict[char.character] = char;
        }
        allWords.forEach(word => {
            // wordLink.href = `./grid?query=${encodeURIComponent(word)}`;
            const wordLink = document.createElement('a');
            const hoverBox = document.getElementById('pinyin-hover-box');

            function showTooltip(element, content, event) {
                hoverBox.innerHTML = content;
                hoverBox.style.display = 'block';
                hoverBox.style.left = `${event.pageX + 10}px`;
                hoverBox.style.top = `${event.pageY + 10}px`;
                
            }

            function hideTooltip() {
                hoverBox.style.display = 'none';
            }
            
            wordLink.onclick = function() {
                showFlashcard(word); 
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('query', word);
                history.pushState({}, '', newUrl);
                hoverBox.style.display = 'none';
            };

            
            wordLink.addEventListener('mouseover', function(e) {
                const pinyin =  chardict[word].pinyin;
                const english = chardict[word].english;
                const hsklvl = chardict[word].hsk_level;
                let tooltipContent = `<strong>${pinyin}</strong><br>${english}<br>`;

                if(isDarkMode){
                    // tooltipContent = `<span><strong>${pinyin}</strong><br>${english}</span><br><span style="font-size: 12px; font-style: italic; color: #ffd91c;"> HSK ${hsklvl}</span>`;
                    tooltipContent = `<span><strong>${pinyin}</strong><br>${english}</span>`;
                    hoverBox.style.backgroundColor = '#1a1a1a';
                }
                showTooltip(this, tooltipContent, e);
            });
            wordLink.addEventListener('mouseout', hideTooltip);
            wordLink.addEventListener('mousemove', function(e) {
                hoverBox.style.left = `${e.pageX + 10}px`;
                hoverBox.style.top = `${e.pageY + 10}px`;
            });


            wordLink.textContent = word;
            wordLink.className = 'word-link';
            if(isDarkMode)
                wordLink.classList.add('darkmode');
            wordsContainer.appendChild(wordLink);
            
        });
    });
    container.appendChild(wordsContainer);
}


function isMobileOrTablet() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check || /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
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


function createPlotters(data){
    const chars = data.character.split('');
    const plotters = [];
    let lineType = 'round'; 
    lineType = 'miter'; 
    let size = 355;
    if(chars.length == 2){
        size = 355;
    }
    if(chars.length == 3){
        size = 300;
    }
    else if(chars.length > 3){
        size = 250;
    }
    if(isMobileOrTablet()){
        if(chars.length == 2){
            size = 255;
        }
        if(chars.length == 3){
            size = 172;
        }
        else if(chars.length > 3){
            size = 172;
        }
        else if(chars.length > 5){
            size = 122;
        }
    }
    let colors = ["#151511aa", "#151511aa", "#151511aa"];
    if(isDarkMode){
        colors = ["#e5ddedaa", "#e5ddedaa", "#e5ddedaa"];
    }
    chars.forEach((char, index) => {
        let plotter = null;
        try{
            plotter = new HanziPlotter({
                character: char,
                dimension: size,
                speed: .04,
                lineThickness: 11*size/200,
                jitterAmp: 0,
                colors: colors,
                lineType: lineType,
                showDiagonals: false,
                showGrid: false,
            });
        }
        catch(e){
        }
        // check if undefined strokes
        plotters.push({plotter: plotter, char: char});
    });
    return plotters;
}

async function renderPlotters(plotters, pinyinparts=null){
    const plotterElement = document.getElementById('flashcard_plotter');
    plotterElement.innerHTML = '';
    if(plotterElement && plotters){
        // Store plotters as a property of the container element
        plotterElement.plotters = plotters;
        
        // get all internal loadPromise from plotters and await them
        const loadPromises = plotters.map(plotterinfo => plotterinfo.plotter.loadPromise);
        await Promise.all(loadPromises);

        plotters.forEach((plotterinfo, index) => {
            const plotter = plotterinfo.plotter;
            let colors = ["#151511ee", "#151511aa", "#151511aa"];
            if(isDarkMode){
                colors = ["#e5ddedec", "#e5ddedaa", "#e5ddedaa"];
            }
            plotter.setColors(colors);
            try{
                plotter.draw();
                plotter.canvas.dataset.plotterIndex = index;
                plotterElement.appendChild(plotter.canvas);
            }
            catch(e){
                let span = document.createElement('span');
                span.textContent = plotterinfo.char;
                span.style.fontSize = '10em';
                span.style.fontFamily = 'Noto Serif SC';
                span.style.margin = '0.em';
                span.style.display = 'inline-block';
                plotterElement.appendChild(span);
            }
        });
        scrollToTop(document.getElementById('flashcard_container'));
    }
    else{
        console.error('No plotter element found');
    }
}
    
function toAccentedPinyin(input) {
    const toneMap = {
        '1': 'āēīōūǖ',
        '2': 'áéíóúǘ',
        '3': 'ǎěǐǒǔǚ',
        '4': 'àèìòùǜ',
        '5': 'aeiouü'
    };

    return input.split(' ').map(word => 
        word.replace(/([a-z]+)([1-5])/i, (_, syllable, tone) => {
            let vowels = ['a', 'e', 'i', 'o', 'u', 'ü'];
            let index = syllable.split('').findIndex(c => vowels.includes(c));
            if (syllable.includes('ou')) index = syllable.indexOf('o');
            if (index !== -1) {
                let charArray = syllable.split('');
                charArray[index] = toneMap[tone][vowels.indexOf(charArray[index])];
                return charArray.join('');
            }
            return syllable;
        })
    ).join(' ');
}

function wrapImageUrls(inputString) {
    // const imageRegex = /(?:^|\s)(https?:\/\/[^\s<>"]+?\.(?:jpg|jpeg|png|gif|bmp|webp))(?:\s|$|<)/gi;
    const imageRegex = /(?:^|\s)(https?:\/\/[^\s<>"]+?)(?:\s|$|<)/gi;
    
    // if (inputString.trim().match(/^https?:\/\/[^\s<>"]+?\.(?:jpg|jpeg|png|gif|bmp|webp)$/i)) {
    if (inputString.trim().match(/^https?:\/\/[^\s<>"]+?$/i)) {
        return `<img class="notes-image" src="${inputString.trim()}" alt="${inputString.trim()}" />`;
    }
    
    let outputString = inputString.replace(imageRegex, (match, url) => {
        return match.replace(url, `<img class="notes-image" src="${url.trim()}" alt="${url.trim()}" />`);
    });
    return outputString;
}

function getExamplesDiv(examples, character, is_last) {  // Added fetchCallback parameter
    let containerDiv = document.createElement('div');
    let page = 0;
    containerDiv.id = 'mainExamplesContainer';
    
    let toggleButton = document.createElement('div');
    toggleButton.innerHTML = '<span style="text-decoration: underline;">expand</span> ⤵';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.opacity = '0.4';
    toggleButton.style.textAlign = 'center';
    toggleButton.style.fontSize = '0.8em';

    // Create a container for the load buttons
    let loadButtonsContainer = document.createElement('div');
    loadButtonsContainer.style.display = 'none';  // Initially hidden
    loadButtonsContainer.style.justifyContent = 'flex-end';  // Changed from space-between to flex-end
    loadButtonsContainer.style.alignItems = 'center';
    loadButtonsContainer.style.fontSize = '0.8em';

    let loadLessButton = document.createElement('div');
    loadLessButton.innerHTML = '⟵ <span style="text-decoration: underline;">previous page</span>';
    loadLessButton.style.cursor = 'pointer';
    loadLessButton.style.opacity = '0.4';
    loadLessButton.style.display = 'none';  // Initially hidden
    loadLessButton.style.marginRight = 'auto';  // Add this to push it to the left when visible

    let loadMoreButton = document.createElement('div');
    loadMoreButton.id = 'loadMoreButton';
    loadMoreButton.innerHTML = '<span style="text-decoration: underline;">next page</span> ⟶';
    loadMoreButton.style.cursor = 'pointer';
    if(is_last){
        loadMoreButton.style.display = 'none';
    }
    loadMoreButton.style.opacity = '0.4';
    
    let examplesDiv = document.createElement('div');
    examplesDiv.id = 'mainExamples';
    examplesDiv.style.display = 'none';
    function populateExamples(exs){
    examplesDiv.innerHTML = '';
    exs.forEach((example, index) => {
        let exampleD = document.createElement('div');
        let mandarin = example.cmn;
        let english = example.eng[0];
        let pinyin = example.pinyin;

        let mchars = mandarin.split("");
        let pwords = pinyin.split(" ");
        
        let cmnDiv = document.createElement('div');
        let mandarinHtml = "";
        const hoverBox = document.getElementById('pinyin-hover-box');

        mchars.forEach((char, index) => {
            let spanElement = document.createElement('span');
            spanElement.textContent = char;
            spanElement.classList.add('clickable-example-char');
            
            if (character && character.includes(char)) {
                spanElement.style.color = 'var(--accent-word)';
            }
            spanElement.style.cursor = 'pointer';
        
            function showTooltip(element, content, x, y) {
                hoverBox.innerHTML = content;
                hoverBox.style.display = 'block';
                hoverBox.style.left = `${x + 10}px`;
                hoverBox.style.top = `${y + 10}px`;
            }
        
            function hideTooltip() {
                hoverBox.style.display = 'none';
            }
        
            // Mouse events
            spanElement.addEventListener('mouseover', function(e) {
                showTooltip(this, pwords[index] || '', e.pageX, e.pageY);
            });
            spanElement.addEventListener('click', function(e) {
                showFlashcard(char); 
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('query', char);
                history.pushState({}, '', newUrl);
                hoverBox.style.display = 'none';

            });
            spanElement.addEventListener('mouseout', hideTooltip);
            spanElement.addEventListener('mousemove', function(e) {
                hoverBox.style.left = `${e.pageX + 10}px`;
                hoverBox.style.top = `${e.pageY + 10}px`;
            });
        
            // Touch events
            spanElement.addEventListener('touchstart', function(e) {
                e.preventDefault();
                const touch = e.touches[0];
                if (hoverBox.style.display === 'none') {
                    showTooltip(this, pwords[index] || '', touch.pageX, touch.pageY);
                } else {
                    hideTooltip();
                }
            });
            
            cmnDiv.appendChild(spanElement);
        });
        
        
        let engDiv = document.createElement('div');
        engDiv.style.opacity = '0.6';
        engDiv.textContent = english;
        
        let pinDiv = document.createElement('div');
        pinDiv.style.opacity = '0.8';
        pinDiv.style.fontSize = '0.7em';
        pinDiv.style.color = 'var(--dimmer-text-color)';
        pinDiv.textContent = pinyin;
        
        exampleD.appendChild(cmnDiv);
        exampleD.appendChild(engDiv);
        exampleD.style.marginBottom = '1em';
        examplesDiv.appendChild(exampleD);
    });
}

    
    populateExamples(examples);

    
    // Add click handlers for load buttons
    loadMoreButton.addEventListener('click', async () => {
        page++;
        getExamplesPage(page, character, populateExamples);
        loadLessButton.style.display = 'block'; 
    });

    loadLessButton.addEventListener('click', async () => {
        if (page > 0) {
            page--;
            getExamplesPage(page, character, populateExamples);
            if (page === 0) {
                loadLessButton.style.display = 'none'; 
            }
        }
    });

    toggleButton.addEventListener('click', () => {
        if (examplesDiv.style.display === 'none') {
            examplesDiv.style.display = 'block';
            loadButtonsContainer.style.display = 'flex';
            toggleButton.style.textAlign = 'center';
            toggleButton.innerHTML = '<span style="text-decoration: underline;">collapse</span> ⤴';
        } else {
            examplesDiv.style.display = 'none';
            loadButtonsContainer.style.display = 'none';
            toggleButton.innerHTML = '<span style="text-decoration: underline;">expand</span> ⤵';
            toggleButton.style.cursor = 'pointer';
            toggleButton.style.opacity = '0.4';
            toggleButton.style.textAlign = 'center';
        }
    });

    // Add buttons to the container
    loadButtonsContainer.appendChild(loadLessButton);
    loadButtonsContainer.appendChild(loadMoreButton);

    containerDiv.appendChild(examplesDiv);
    containerDiv.appendChild(toggleButton);
    containerDiv.appendChild(loadButtonsContainer);
    
    return containerDiv;
}

const getExamplesPage = async (page, character, func) => {
    try {
        const response = await fetch('./api/get_examples_page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ character: character, page: page })
        });
        const data = await response.json();
        func(data.examples);
        let loadMoreButton = document.getElementById('loadMoreButton');
        loadMoreButton.style.display = data.is_last ? 'none' : 'block';
    } catch (error) {
        console.error('Error:', error);
    }
};

function addWordToLearning(symbol){
    fetch("./api/add_word_to_learning", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ word: symbol })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data); 
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

function setupCloseButton(){
    let addcardDiv = document.getElementById('flashcard_close');
    addcardDiv.classList.add("corner-buttons")
    addcardDiv.textContent = "×";
    addcardDiv.addEventListener('click', function(){
        hideCard();
    });
    if(true){
        document.getElementById('flashcard_close').style.display = 'block';
    }
}

function setupAddToDeck(){
    let addcardDiv = document.getElementById('flashcard_addcard');
    addcardDiv.classList.add("corner-buttons")
    addcardDiv.textContent = "+";
    const hoverBox = document.getElementById('pinyin-hover-box');
    
    function showTooltip(element, content, event) {
        hoverBox.innerHTML = content;
        hoverBox.style.display = 'block';
        hoverBox.style.left = `${event.pageX + 10}px`;
        hoverBox.style.top = `${event.pageY + 10}px`;
    }

    function hideTooltip() {
        hoverBox.style.display = 'none';
    }

    addcardDiv.addEventListener('mouseover', function (e) {
        let tooltipContent = `add to learning deck`;
        showTooltip(this, tooltipContent, e);
    });

    addcardDiv.addEventListener('mouseout', hideTooltip);
    addcardDiv.addEventListener('mousemove', function (e) {
        hoverBox.style.left = `${e.pageX + 10}px`;
        hoverBox.style.top = `${e.pageY + 10}px`;
    });
}

function renderCardData(data) {
    const container = document.getElementById('flashcard_container');
    if(container.style.display === 'none' || !container.style.display){
        container.style.display = 'flex';
    }

    const characterElement = document.getElementById('flashcard_character');
    if(characterElement)
        characterElement.innerHTML = '';


    let chars = data.character.split('');
    chars = chars.filter(char => char.match(/[\u4e00-\u9fa5]/));
    let uniqueChars = [...new Set(chars)];
    chars = uniqueChars;
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
    let pparts = [];
    chars.forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.dataset.char = char;
        span.className = 'clickable-char';

        let pinyin_part = pinyin_split_list[index];
        pparts.push(pinyin_part);
        span.dataset.pinyin = pinyin_part;
        if(isMobileOrTablet()){
            span.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent triggering the change event
                window.location.href = `./search?query=${encodeURIComponent(char)}`;
            });
            span.style.hover = 'color: #ffd91c';
            // span.style.cursor = 'pointer';
        }
        span.style.transition = 'text-shadow 0.05s';
        span.style.textShadow = 'none'; 
        if(characterElement)
            characterElement.appendChild(span);
    });

    const plotterElement = document.getElementById('flashcard_plotter');
    if(plotterElement){
        plotterElement.innerHTML = '';
        renderPlotters(data.plotters, pparts);
    }

    let craw_info = data.raw_info;
    //document.getElementById('flashcard_pinyin').textContent = toAccentedPinyin(data.pinyin);
    document.getElementById('flashcard_pinyin').textContent = data.pinyin;
    document.getElementById('flashcard_pinyin').dataset.characters = data.character;
    if(data.english.constructor === Array){
        document.getElementById('flashcard_english').innerHTML = '';
        let englishList = document.createElement('ul');
        data.english.forEach(english => {
            let englishItem = document.createElement('li');
            englishItem.textContent = english;
            englishList.appendChild(englishItem);
        });
        document.getElementById('flashcard_english').appendChild(englishList);
    } else {
        document.getElementById('flashcard_english').innerHTML = data.english;
    }
   
    let ai_content = data.html;


    const descriptionContainer = document.createElement('div');
    descriptionContainer.id = 'descriptionContainer';

    const rawLabel = document.createElement('div');
    rawLabel.textContent = "Character breakdown ⤵";
    rawLabel.style.marginTop = '2em';
    rawLabel.style.marginBottom = '1em';
    rawLabel.style.opacity = '0.6';
    const exLabel = document.createElement('div');
    exLabel.textContent = "Examples ⤵";
    exLabel.style.marginTop = '2em';
    exLabel.style.marginBottom = '1em';
    exLabel.style.opacity = '0.6';
    const inidididn = document.createElement('div');
    // inidididn.innerHTML = "↓"
    // inidididn.style.fontSize = '1.5em';
    // inidididn.style.paddingTop = '0.25em';
    // inidididn.style.paddingBottom = '0.5em';
    // inidididn.style.transform = 'scaleY(1.5)'; 
    // descriptionContainer.appendChild(inidididn);
    // rawLabel.id = 'rawLabel';
    // rawLabel.classList.add('notes-label');

    // Create tab navigation
    const tabNav = document.createElement('div');
    tabNav.classList.add('tab-nav');

    // Create content container
    const tabContentContainer = document.createElement('div');
    tabContentContainer.classList.add('tab-content-container');
    descriptionContainer.appendChild(tabContentContainer);

    // Populate tabs and content
    chars.forEach((char, index) => {
        let char_info = craw_info[char];
        const english = char_info.english;
        const pinyin = char_info.pinyin;
        const frequency = char_info.frequency;
        const rank = char_info.rank;
        const graphical_components = char_info.graphical; // list of chars
        const main_components = char_info.main_components; // list of chars
        const radicals = char_info.radicals; // dict of radicals with meaning
        const similars_per_component = char_info.similars; // dict of lists of similar chars per component
        const appears_in = char_info.appears_in; // list of dicts
        
        // Create tab button
        const tabButton = document.createElement('button');
        tabButton.classList.add('tab-button');
        tabButton.textContent = char;
        tabButton.dataset.target = `tab-${index}`;
        tabNav.appendChild(tabButton);

        // Create content div
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('tab-content');
        entryDiv.id = `tab-${index}`;
        const filteredRadicals = Object.entries(radicals)
            .filter(([rad, meaning]) => meaning && meaning !== "No glyph available")
            .map(([rad, meaning]) => `${rad} (${meaning})`)
            .join(', ');

            entryDiv.innerHTML = `
            <div class="rawDefEntry"><div class="rawDefLabel">Definition:</div> <div class="rawDefContent">${english}</div></div>
            <div class="rawDefEntry"><div class="rawDefLabel">Pinyin:</div> <div class="rawDefContent">${pinyin}</div></div>
            ${rank !== null ? `<div class="rawDefEntry"><div class="rawDefLabel">Frequency rank:</div> <div class="rawDefContent">${rank}</div></div>` : ''}
            <div class="rawDefEntry"><div class="rawDefLabel">Graphical components:</div> <div class="rawDefContent">${graphical_components.join(', ')}</div></div>
            ${filteredRadicals ? `<div class="rawDefEntry"><div class="rawDefLabel">Radicals:</div> <div class="rawDefContent">${filteredRadicals}</div></div>` : ''}
        `;
        //<div class="rawDefEntry"><div class="rawDefLabel">Main components:</div> <div class="rawDefContent">${main_components.join(', ')}</div></div>
        
    

        // Similar Characters per Component
        const similarsDiv = document.createElement('div');
        similarsDiv.innerHTML = `<span class="rawDefLabel">Components of ${char} in other characters:</span>`;
        similarsDiv.classList.add('rawDefEntry');

        let allWords = new Set();
        Object.values(similars_per_component).forEach(similar_chars => {
            similar_chars.forEach(similar_char => allWords.add(similar_char));
        }); 

        getCharactersHoverInfo(allWords, (data) => {
            let chardict = data;
            Object.entries(similars_per_component).forEach(([component, similar_chars]) => {
                const p = document.createElement('p');
                let num_similars_per_component = similar_chars.length;
                const linkss = document.createElement('div');
                linkss.classList.add('scrollableHanzis'); // Fixed style assignment
                const expandBtn = document.createElement('button');
        
                linkss.style.paddingLeft = '1em';
                p.style.paddingLeft = '1em';
                p.textContent = component;
                similarsDiv.appendChild(p);
        
                similar_chars.forEach(similar_char => {
                    const wordLink = document.createElement('a');
                    const hoverBox = document.getElementById('pinyin-hover-box');
        
                    function showTooltip(element, content, event) {
                        hoverBox.innerHTML = content;
                        hoverBox.style.display = 'block';
                        hoverBox.style.left = `${event.pageX + 10}px`;
                        hoverBox.style.top = `${event.pageY + 10}px`;
                    }
        
                    function hideTooltip() {
                        hoverBox.style.display = 'none';
                    }
        
                    wordLink.onclick = function () {
                        showFlashcard(similar_char);
                        const newUrl = new URL(window.location);
                        newUrl.searchParams.set('query', similar_char);
                        history.pushState({}, '', newUrl);
                        hoverBox.style.display = 'none';
                    };
        
                    wordLink.addEventListener('mouseover', function (e) {
                        const pinyin = toAccentedPinyin(chardict[similar_char].pinyin);
                        const english = chardict[similar_char].english;
                        const hsklvl = "chardict[similar_char].hsk_level";
                        let tooltipContent = `<strong>${pinyin}</strong><br>${english}<br>`;
        
                        if (isDarkMode) {
                            tooltipContent = `<span><strong>${pinyin}</strong><br>${english}</span>`;
                        }
                        showTooltip(this, tooltipContent, e);
                    });
        
                    wordLink.addEventListener('mouseout', hideTooltip);
                    wordLink.addEventListener('mousemove', function (e) {
                        hoverBox.style.left = `${e.pageX + 10}px`;
                        hoverBox.style.top = `${e.pageY + 10}px`;
                    });
        
                    wordLink.textContent = similar_char;
                    wordLink.className = 'word-link';
                    if (isDarkMode) wordLink.classList.add('darkmode');
                    linkss.appendChild(wordLink);
                });
        
                // Expand button
                similarsDiv.appendChild(linkss);
                setTimeout(() => {
                    if (num_similars_per_component > 74) {
                        expandBtn.textContent = "...";
                        expandBtn.className = "expand-button";
                        expandBtn.onclick = function () {
                            if (linkss.classList.contains("expanded")) {
                                linkss.classList.remove("expanded");
                                expandBtn.textContent = "...";
                                expandBtn.style.fontWeight = "bold";
                                expandBtn.style.backgroundColor = "var(--dimmer-background-color)";
                            } else {
                                linkss.classList.add("expanded");
                                expandBtn.textContent = "collapse";
                                expandBtn.style.fontWeight = "normal";
                                expandBtn.style.backgroundColor = "var(--dimmer-background-color)";
                            }
                        };

                        // Append the button after the corresponding 'linkss' element (not inside)
                        //similarsDiv.appendChild(expandBtn);
                        similarsDiv.insertBefore(expandBtn, linkss.nextSibling);
                    }
                }, 110);
            });
        });
        
        // check appears_in length
        const appearsInDiv = document.createElement('div');
        if(appears_in.length !== 0){
            appearsInDiv.innerHTML = `<span class="rawDefLabel">${char} in other words:</span>`;
        }
        //appearsInDiv.id = 'appearsInDiv' + index;
        appearsInDiv.classList.add('appearsInDiv');
        appearsInDiv.classList.add('rawDefEntry');

        //get flashcard container's top left corner
        // setTimeout(() => {
        //     let flashcardContainer = document.getElementById('flashcard_container');
        //     let flashcardContainerRect = flashcardContainer.getBoundingClientRect();
        //     let flashcardContainerTop = flashcardContainerRect.top;
        //     let flashcardContainerLeft = flashcardContainerRect.left;
        //     let flashcardContainerWidth = flashcardContainerRect.width;
        //     let flashcardContainerHeight = flashcardContainerRect.height;
        //     let displayWidth = window.innerWidth;
        //     let leftSpaceLeft = flashcardContainerLeft;
        //     let rightSpaceLeft = displayWidth - flashcardContainerLeft - flashcardContainerWidth;
        //     let ownWidth = leftSpaceLeft*0.8;
        //     let padding = 1 + "em";
        //     appearsInDiv.style.left = leftSpaceLeft - ownWidth + "px";
        //     appearsInDiv.style.top = flashcardContainerTop + 20 + "px";
        //     appearsInDiv.style.width = ownWidth + "px";
        //     appearsInDiv.style.margin = 0 + "px";
        //     appearsInDiv.style.padding = padding;
        //     appearsInDiv.style.display = 'block';
        //     appearsInDiv.style.height = flashcardContainerHeight - 20*2 + "px";
        //     appearsInDiv.style.maxHeight = flashcardContainerHeight - 20*2 + "px";
        // }, 100);
        const linkss = document.createElement('p');
        linkss.classList.add('scrollableHanzis');
        linkss.classList.add('examplesDiv');
        const expandBtn = document.createElement('button');
        linkss.style.paddingLeft = '1em';
        appears_in.forEach((entry) => {
            let wordLink = document.createElement('a');
            let similar_char = entry.simplified;
            wordLink.classList.add('word-link-example');
            // wordLink.classList.add('word-link-small');
            // show hanzi and pinyin and enlgish
            const pinyin = toAccentedPinyin(entry.pinyin);
            const english = entry.english;
            wordLink.innerHTML = `<span class="small_hanzi">${similar_char}</span> - <span class="small_english">${english}</span>`;

            const hoverBox = document.getElementById('pinyin-hover-box');

            function showTooltip(element, content, event) {
                hoverBox.innerHTML = content;
                hoverBox.style.display = 'block';
                hoverBox.style.left = `${event.pageX + 10}px`;
                hoverBox.style.top = `${event.pageY + 10}px`;
                
            }

            function hideTooltip() {
                hoverBox.style.display = 'none';
            }
            
            wordLink.onclick = function() {
                showFlashcard(similar_char); 
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('query', similar_char);
                history.pushState({}, '', newUrl);
                hoverBox.style.display = 'none';
            };

            wordLink.addEventListener('mouseover', function(e) {
                const pinyin = toAccentedPinyin(entry.pinyin);
                const english = entry.english;
                const hsklvl = "chardict[similar_char].hsk_level";
                //let tooltipContent = `<span><strong>${pinyin}</strong><br>${english}<br></span>`;
                let tooltipContent = `<span><strong>${pinyin}</strong></span>`;

                if(isDarkMode){
                    //tooltipContent = `<span><strong>${pinyin}</strong><br>${english}</span>`;
                    tooltipContent = `<span><strong>${pinyin}</strong></span>`;
                    //hoverBox.style.backgroundColor = '#1a1a1a';
                }
                showTooltip(this, tooltipContent, e);
            });
            wordLink.addEventListener('mouseout', hideTooltip);
            wordLink.addEventListener('mousemove', function(e) {
                hoverBox.style.left = `${e.pageX + 10}px`;
                hoverBox.style.top = `${e.pageY + 10}px`;
            });

            // wordLink.textContent = similar_char;
            if(isDarkMode)
                wordLink.classList.add('darkmode');

            linkss.appendChild(wordLink);
            
            
        });
        appearsInDiv.appendChild(linkss);

        setTimeout(() => {
            if (appears_in.length > 7) {
                expandBtn.textContent = "...";
                expandBtn.className = "expand-button";
                expandBtn.onclick = function () {
                    if (linkss.classList.contains("expanded")) {
                        linkss.classList.remove("expanded");
                        expandBtn.textContent = "...";
                        expandBtn.style.fontWeight = "bold";
                        expandBtn.style.backgroundColor = "var(--dimmer-background-color)";
                    } else {
                        linkss.classList.add("expanded");
                        expandBtn.textContent = "collapse";
                        expandBtn.style.fontWeight = "normal";
                        expandBtn.style.backgroundColor = "var(--dimmer-background-color)";
                    }
                };

                // Append the button after the corresponding 'linkss' element (not inside)
                appearsInDiv.insertBefore(expandBtn, linkss.nextSibling);
                //entryDiv.appendChild(expandBtn);
            }
        }, 110);

        //document.getElementById('flashcard_overlay').appendChild(appearsInDiv);
        entryDiv.appendChild(similarsDiv);
        entryDiv.appendChild(appearsInDiv);


        tabContentContainer.appendChild(entryDiv);

        // Show the first tab by default
        if (index === 0) {
            tabButton.classList.add('active');
            entryDiv.classList.add('active');
        }

        // Tab click event
        tabButton.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            tabButton.classList.add('active');
            entryDiv.classList.add('active');
        });
    });

    const descriptionLabel = document.createElement('p');
    descriptionLabel.textContent = "LLM description ";
    descriptionLabel.id = 'descriptionLabel';
    descriptionLabel.class = 'notes-label';
    const descriptionParagraph = document.createElement('p');
    descriptionParagraph.innerHTML = ai_content;
    descriptionParagraph.id = 'descriptionParagraph';

    if(ai_content.trim() === ''){

    }
    else{
        descriptionContainer.appendChild(descriptionLabel);
        descriptionContainer.appendChild(descriptionParagraph);
    }

    // Add click handler to the label


    // Replace the existing content
    document.getElementById('flashcard_description').innerHTML = '';
    document.getElementById('flashcard_description').appendChild(exLabel);
    if(data.tatoeba.length > 0){
        let mainExamplesDiv = getExamplesDiv(data.tatoeba, data.character, data.is_last);
        document.getElementById('flashcard_description').appendChild(mainExamplesDiv);
    }
    document.getElementById('flashcard_description').appendChild(rawLabel);
    document.getElementById('flashcard_description').appendChild(tabNav);
    document.getElementById('flashcard_description').appendChild(descriptionContainer);

    const notesParagraph = document.createElement('p');
    // Initially render the markdown
    let rendered = marked.parse(data.user_notes || '');
    rendered = rendered.replace(/>\n\n</g, '>\n<'); // Remove whitespace between tags
    rendered = wrapImageUrls(rendered);
    notesParagraph.innerHTML =  wrapImageUrls(data.user_notes || '');
    notesParagraph.id = 'notesParagraph';

    let rawMarkdown = data.user_notes || ''; // Store the raw markdown

    let isemptyinitNotes = false;
    if (rawMarkdown.trim() === '') {
        notesParagraph.classList.add('empty');
        notesParagraph.innerHTML = 'Click to add a note...';
        rawMarkdown = 'Click to add a note...';
        isemptyinitNotes = true;
    }

    let isemptyOtherNotes = false;
    try{
        if(data.other_user_notes.length === 0){
            isemptyOtherNotes = true;
        }
    }
    catch(e){
        isemptyOtherNotes = true;
    }

    let isemptyinitDescription = false;
    if (ai_content.trim() === '') {
        isemptyinitDescription = true;
    }

    document.getElementById('flashcard_description').prepend(notesParagraph);
    notesParagraph.setAttribute('contenteditable', 'true');

    // add checkbox in top right corner with lable "public"
    // add checkbox in top right corner with label "public"
    const checkboxContainer = document.createElement('div');
    checkboxContainer.style.float = 'right';
    // top right corner
    checkboxContainer.style.top = '0';
    checkboxContainer.style.right = '0';
    checkboxContainer.id = 'checkboxContainer';

    const publicCheckbox = document.createElement('input');
    publicCheckbox.type = 'checkbox';
    publicCheckbox.id = 'publicCheckbox';
    publicCheckbox.checked = data.are_notes_public;

    const publicLabel = document.createElement('label');
    publicLabel.htmlFor = 'publicCheckbox';
    publicLabel.textContent = 'make public';
    publicLabel.id = 'publicLabel';

    publicCheckbox.addEventListener('change', function() {

        rawMarkdown = notesParagraph.innerHTML;
        if (rawMarkdown.endsWith('<br>')) {
            rawMarkdown = rawMarkdown.slice(0, -4);
        }
        // rawMarkdown = rawMarkdown.replace(/<div>/g, '');
        // rawMarkdown = rawMarkdown.replace(/<\/div>/g, '');
        rawMarkdown = wrapImageUrls(rawMarkdown);
        
        fetch('./api/storeNotes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                notes: rawMarkdown,
                word: data.character,
                is_public: publicCheckbox.checked
            })
        })
        .then(response => response.json())
        .then(data => console.log('Success:', data))
        .catch((error) => console.error('Error:', error));

        // fetch('./api/storeNotesVisibility', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({
        //         is_public: this.checked,
        //         character: data.character
        //     })
        // })
        // .then(response => {
        //     if (!response.ok) {
        //         throw new Error('Network response was not ok');
        //     }
        //     return response.json();
        // })
        // .then(data => {
        //     console.log('Success:', data);
        // })
        // .catch((error) => {
        //     console.error('Error:', error);
        // });
    });
    checkboxContainer.appendChild(publicCheckbox);
    checkboxContainer.appendChild(publicLabel);
    document.getElementById('flashcard_description').prepend(checkboxContainer);


    marked.setOptions({
        breaks: true,
        gfm: true,
    });

    notesParagraph.addEventListener('focus', function() {
        if (this.classList.contains('empty')) {
            this.classList.remove('empty');
            rawMarkdown = '';
            this.innerHTML = '';
        } else {
            this.innerHTML = rawMarkdown;
        }
    });
    notesParagraph.addEventListener('paste', function(e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
    });
    notesParagraph.addEventListener('blur', function() {
        rawMarkdown = this.innerHTML;
        this.classList.remove('empty');

        if (rawMarkdown.endsWith('<br>')) {
            rawMarkdown = rawMarkdown.slice(0, -4);
        }
        
        // rawMarkdown = rawMarkdown.replace(/<div>/g, '');
        // rawMarkdown = rawMarkdown.replace(/<\/div>/g, '');

        rawMarkdown = wrapImageUrls(rawMarkdown);
        // this.innerHTML = marked.parse(rawMarkdown);
        
        this.innerHTML = rawMarkdown;
        fetch('./api/storeNotes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                notes: rawMarkdown,
                word: data.character,
                is_public: publicCheckbox.checked
            })
        })
        .then(response => response.json())
        .then(data => console.log('Success:', data))
        .catch((error) => console.error('Error:', error));
    
        if (this.innerHTML.trim() === '') {
            this.classList.add('empty');
            this.innerHTML = 'Click to add a note...';
            rawMarkdown = 'Click to add a note...';
        }
    });
    // Initially hide the paragraph;


    // Create and add the Notes label

    let otherUserNotes = data.other_user_notes;
    
    let otherNotesContainer = document.createElement('div');
    if(otherUserNotes){
        otherUserNotes.forEach((note) => {
            const noteContainer = document.createElement('div');
            noteContainer.classList.add('note-container');
            
            const noteParagraph = document.createElement('p');
            noteParagraph.innerHTML = note.notes;
            noteParagraph.classList.add('other-user-notes');
            
            const username = document.createElement('span');
            username.textContent = note.username;
            username.classList.add('note-username');
            
            noteContainer.appendChild(noteParagraph);
            noteContainer.appendChild(username);
            otherNotesContainer.appendChild(noteContainer);
        });
    }
    
    const personalNotesLabel = document.createElement('p');
    personalNotesLabel.textContent = "My notes ";
    personalNotesLabel.id = 'personalNotesLabel';
    personalNotesLabel.class = 'notes-label';

    document.getElementById('flashcard_description').prepend(personalNotesLabel);
    document.getElementById('flashcard_description').prepend(otherNotesContainer);

    const notesLabel = document.createElement('p');
    notesLabel.textContent = "Notes ";
    notesLabel.id = 'notesLabel';
    notesLabel.class = 'notes-label';
    
    const publicNotesLabel = document.createElement('p');
    publicNotesLabel.textContent = "Public notes ";
    publicNotesLabel.id = 'publicNotesLabel';
    publicNotesLabel.class = 'notes-label';


    // document.getElementById('flashcard_description').prepend(publicNotesLabel);
    // document.getElementById('flashcard_description').prepend(notesLabel);

    notesLabel.addEventListener('click', () => {
        notesParagraph.style.display = notesParagraph.style.display === 'none' && username !== "tempuser" ? 'block' : 'none';
        otherNotesContainer.style.display = notesParagraph.style.display;
        publicNotesLabel.style.display = publicNotesLabel.style.display === 'none' ? 'block' : 'none';
        if(publicNotesLabel.style.display === 'none' || publicNotesLabel.classList.contains('collapsed')){
            otherNotesContainer.style.display = 'none';
        }
        else if(!publicNotesLabel.classList.contains('collapsed')){
            otherNotesContainer.style.display = 'block';
        }
        checkboxContainer.style.display = notesParagraph.style.display;
        personalNotesLabel.style.display = notesParagraph.style.display;
        if(notesParagraph.style.display === 'none' && otherNotesContainer.style.display === 'none'){
            notesLabel.classList.add('collapsed');
            // publicNotesLabel.classList.add('collapsed');
        }
        else{
            notesLabel.classList.remove('collapsed');
            // publicNotesLabel.classList.remove('collapsed');
        }
    });
    
    publicNotesLabel.addEventListener('click', () => {
        otherNotesContainer.style.display = otherNotesContainer.style.display === 'none' ? 'block' : 'none';
        if(otherNotesContainer.style.display === 'none'){
            publicNotesLabel.classList.add('collapsed');
        }
        else{
            publicNotesLabel.classList.remove('collapsed');
        }
    });
    
    descriptionLabel.classList.add('collapsed');
    descriptionParagraph.style.display = 'none';

    descriptionLabel.addEventListener('click', () => {
        descriptionParagraph.style.display = descriptionParagraph.style.display === 'none' ? 'block' : 'none';
        if (descriptionParagraph.style.display === 'none') {
            descriptionLabel.classList.add('collapsed');
        }
        else {
            descriptionLabel.classList.remove('collapsed');
        }
    });
    // rawLabel.addEventListener('click', () => {
    //     tabNav.style.display = tabNav.style.display === 'none' ? 'block' : 'none';
    //     tabContentContainer.style.display = tabContentContainer.style.display === 'none' ? 'block' : 'none';
    //     if (tabNav.style.display === 'none') {
    //         rawLabel.classList.add('collapsed');
    //     }
    //     else {
    //         rawLabel.classList.remove('collapsed');
    //     }
    // });

    if(isemptyOtherNotes){
        publicNotesLabel.classList.add('collapsed');
        otherNotesContainer.style.display = 'none';
    }

    if(username === "tempuser"){
        personalNotesLabel.style.display = 'none';
        notesParagraph.style.display = 'none';
    }

    if(isemptyinitNotes && isemptyOtherNotes){
        otherNotesContainer.style.display = 'none';
        notesParagraph.style.display = 'none';
        publicNotesLabel.style.display = 'none';
        personalNotesLabel.style.display = 'none';
        notesLabel.classList.add('collapsed')
    }
    if(isemptyinitDescription){
        descriptionParagraph.style.display = 'none';
        descriptionLabel.classList.add('collapsed');
    }
    checkboxContainer.style.display = notesParagraph.style.display;

    if(data.function)
        document.getElementById('flashcard_function').textContent = "(" + data.function + ")";
    // document.getElementById('flashcard_practice').textContent = data.character.length <= 3 ? "practice" : "";
    // document.getElementById('flashcard_practice').href = `./hanzipractice?character=${encodeURIComponent(data.character)}`;
    // displayCharMatches(data.char_matches);
    setupAddToDeck();
    // setupCloseButton();
    if(data.is_learning || username === "tempuser"){
        document.getElementById('flashcard_addcard').style.display = 'none';
    }
    else{
        document.getElementById('flashcard_addcard').style.display = 'block';
    }
    document.getElementById('flashcard_addcard').onclick = function(){
        // print current character
        addWordToLearning(data.character);
        let rect = document.getElementById('flashcard_addcard').getBoundingClientRect();
        // print the exact location of the document.getElementById('flashcard_addcard') on the screen 
        let x = rect.left;
        let y = rect.top;
        let width = rect.width;
        let height = rect.height;
        let middlex = x + width/2;
        let middley = y + height/2;

        const element = document.getElementById('flashcard_addcard');
        element.classList.add('fall-out');
        setTimeout(() => {
            element.style.display = 'none';
            element.classList.remove('fall-out');
        }, 350);

        // let smallcanvas = document.createElement('canvas');
        // smallcanvas.width = 200;
        // smallcanvas.height = 400;
        // smallcanvas.style.width = 100 + "px";
        // smallcanvas.style.height = 200 + "px";
        // smallcanvas.style.display = 'block';
        // smallcanvas.style.left = middlex + "px";
        // smallcanvas.style.top = middley + "px";
        // smallcanvas.style.position = 'absolute';
        // smallcanvas.style.zIndex = 2222;
        // smallcanvas.style.transform = 'translate(-50%, -50%)';

        // // draw an expanding circle and then remove after 1 second
        // let ctx = smallcanvas.getContext('2d');
        // let yy = 0;
        // let maxradius = Math.max(width, height);
        // let radius = maxradius;
        // let opacity = 1.;
        // let interval = setInterval(() => {
        //     ctx.clearRect(0, 0, smallcanvas.width, smallcanvas.height);
        //     ctx.beginPath();
        //     // ctx.arc(100, 200 + yy, radius, 0, 2 * Math.PI);
        //     ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
        //     // ctx.fill();
        //     ctx.fillRect(100-radius*2/2, 200+yy, radius*2, radius*2);
        //     radius -= 5;
        //     opacity -= 0.1;
        //     yy += 10;
        //     if(radius < 0){
        //         clearInterval(interval);
        //         document.body.removeChild(smallcanvas);
        //     }
        // }
        // , 50);
        // document.body.appendChild(smallcanvas);
    };

    try{
        // if(isDarkMode){
        //     const wordLinks = document.querySelectorAll('.word-link');
        //     wordLinks.forEach(wordLink => {
        //         wordLink.classList.add('darkmode');
        //     });
        // }
    }
    catch(e){
        console.log(e);
    }

    // if( data.hsk_level == -1){
    //     document.getElementById('flashcard_addcard').textContent = "";
    // }
    // else{
    //     if(data.hsk_level.constructor === Array){
    //         let max_level = 0;
    //         for(let i = 0; i < data.hsk_level.length; i++){
    //             if(data.hsk_level[i] > max_level){
    //                 max_level = data.hsk_level[i];
    //             }
    //         }
    //         if(max_level > 0){
    //             document.getElementById('flashcard_addcard').textContent = `HSK ${max_level}`;
    //         }
    //         else{
    //             document.getElementById('flashcard_addcard').textContent = "";
    //         }
    //     }
    //     else{
    //         if(Number.isInteger(data.hsk_level)){
    //             document.getElementById('flashcard_addcard').textContent = `HSK ${data.hsk_level}`;
    //         }
    //     }
    // }


    if (chars.length < 4 && false) {
        const strokesContainer = document.createElement('div');
        strokesContainer.id = 'flashcard_strokes_container';
        document.getElementById('flashcard_description').appendChild(strokesContainer);
        
        chars.forEach((char, i) => {
            const strokeWrapper = document.createElement('div');
            strokeWrapper.style.position = 'relative';
            strokeWrapper.id = 'flashcard_stroke_wrapper';
            strokesContainer.appendChild(strokeWrapper);

            let writerSize = chars.length < 3 ? 221 : 150;
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
                <rect x="0" y="0" width="${writerSize}" height="${writerSize}" fill="none" stroke="#A005" stroke-width="4" stroke-dasharray="${dashPattern}" />
                <line x1="0" y1="0" x2="${writerSize}" y2="${writerSize}" stroke="#A005" stroke-width="2" stroke-dasharray="${dashPattern}" />
                <line x1="${writerSize}" y1="0" x2="0" y2="${writerSize}" stroke="#A005" stroke-width="2" stroke-dasharray="${dashPattern}" />
                <line x1="${writerSize/2}" y1="0" x2="${writerSize/2}" y2="${writerSize}" stroke="#A005" stroke-width="2" stroke-dasharray="${dashPattern}" />
                <line x1="0" y1="${writerSize/2}" x2="${writerSize}" y2="${writerSize/2}" stroke="#A005" stroke-width="2" stroke-dasharray="${dashPattern}" />
            `;

            strokeWrapper.appendChild(svg);

            let strokeColor = '#000000';
            let radicalColor = '#e83a00';
            if(isDarkMode){
                strokeColor = '#ffffff';
            }

            const writer = HanziWriter.create(`grid-background-${i}`, char, {
                width: writerSize,
                height: writerSize,
                padding: 5,
                strokeColor: strokeColor,
                drawingColor: strokeColor,
                strokeAnimationSpeed: 1,
                delayBetweenStrokes: 220,
                radicalColor: radicalColor,
                charDataLoader: function(char) {
                    return fetch(`/static/strokes_data/${char}.json`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .catch(error => {
                            console.error('Error loading character data:', error);
                            return null;
                        });
                }
            });

            strokeWrapper.addEventListener('click', function() {
                writer.animateCharacter();
            });
            currentWriters.push(writer);
        });
    }
    confirmDarkmode();
    currentCharacter = data.character;
    // try

    try {
        if(overlay){
            overlay.style.display = 'flex';
        }
        if(messageElement){
            messageElement.textContent = '';
        }
    }
    catch (e) {
    }
}

function handleOrientationChange() {
    const container = document.getElementById('flashcard_container');
    if (window.matchMedia("(min-height: 846px) and (max-height: 1024px) and (orientation:landscape)").matches) {
        container.style.width = '60%';
        console.log("2asfasfasf")
    }
    else if (window.matchMedia("(min-width: 846px) and (max-width: 1024px)").matches) {
        container.style.width = '90%';
        container.style.height = '80%';
        container.style.maxHeight = '';
        container.style.marginBottom = '';
    }
    else if (window.matchMedia("(max-height: 846px) and (orientation:landscape)").matches) {
        container.style.width = '60%';
    }
    else if (window.matchMedia("(max-width: 846px)").matches) {
        container.style.width = '90%';
    }
}

window.addEventListener('orientationchange', handleOrientationChange);
window.addEventListener('resize', handleOrientationChange);
handleOrientationChange();

function scrollToTop(element, func=null) {
    setTimeout(() => {
        element.scrollTo(0, 1);
        if(func)
            func();
        setTimeout(() => {
            element.scrollTo(0, 0);
        }, 0);
    }, 22);
}

function displayCard(showAnswer=true, showPinyin=true) {
    const flashcardElement = document.getElementById('flashcard_description');
    const englishElement = document.getElementById('flashcard_english');
    const pinyinElement = document.getElementById('flashcard_pinyin');
    const functionElement = document.getElementById('flashcard_function');
    const char_matchesElement = document.getElementById('flashcard_char_matches');
    pinyinElement.classList.toggle('visible', showPinyin || showAnswer);
    flashcardElement.style.visibility = showAnswer ? 'visible' : 'hidden';
    englishElement.style.visibility = showAnswer ? 'visible' : 'hidden';
    functionElement.style.visibility = showAnswer ? 'visible' : 'hidden';
    char_matchesElement.style.visibility = showAnswer ? 'visible' : 'hidden';
}


