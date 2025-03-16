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

function getCharactersDecompInfo(characters=null, func=null) {
    const url = './api/get_char_decomp_info';
    
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
            return data;
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
    colors = ["#151511aa", "#e5ddedaa"];
    chars.forEach((char, index) => {
        let plotter = null;
        try{
            plotter = new HanziPlotter({
                character: char,
                dimension: size,
                speed: .07,
                lineThickness: 8*size/200,
                jitterAmp: 0,
                colors: colors,
                lineType: "round",
                showDiagonals: false,
                showGrid: false,
                useMask: true,
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

    
    let size = 355;
    if(plotters.length == 2){
        size = 355;
    }
    if(plotters.length == 3){
        size = 300;
    }
    else if(plotters.length > 3){
        size = 250;
    }
    if(isMobileOrTablet()){
        if(plotters.length == 2){
            size = 255;
        }
        if(plotters.length == 3){
            size = 172;
        }
        else if(plotters.length > 3){
            size = 172*2;
        }
        else if(plotters.length > 5){
            size = 122;
        }
    }
    plotterElement.style.minHeight = `${size/2}px`;

    
    if(plotterElement && plotters){
        // Store plotters as a property of the container element
        plotterElement.plotters = plotters;
        
        // get all internal loadPromise ččom plotters and await them
        const loadPromises = plotters.map(plotterinfo => plotterinfo.plotter.loadPromise);
        await Promise.all(loadPromises);
        plotterElement.innerHTML = '';

        plotters.forEach((plotterinfo, index) => {
            const plotter = plotterinfo.plotter;
            let colors = ["#151511ee", "#151511aa", "#151511aa"];
            if(isDarkMode){
                colors = ["#e5ddedec", "#e5ddedaa", "#e5ddedaa"];
            }
                colors = ["#151511ee", "#e5ddedaa", "#e5ddedaa"];
                colors = ["#151511ee", "#e5ddedee", "#e5ddedaa"];
                plotter.setColors(colors);
            try{
                plotter.draw(1, false);
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

let exampleAttempts = 0;

function getExamplesDiv(fdescript, examples, character, is_last) {  // Added fetchCallback parameter
    if(examples.length === 0){
        if(exampleAttempts < 2){
            getExamplesPage(0, character, () => {
                getExamplesDiv(fdescript, currentExamples, character, is_last);
            });
        }
        else{
            return;
        }    
        exampleAttempts++;
    }
    if(document.getElementById('mainExamplesContainer')){
        document.getElementById('mainExamplesContainer').remove();
    }
    let containerDiv = document.createElement('div');
    let page = 0;
    containerDiv.id = 'mainExamplesContainer';
    
    let toggleButton = document.createElement('div');
    toggleButton.innerHTML = '<span style="text-decoration: underline;">expand</span> ↓';
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
    
            let cmnDiv = document.createElement('div');
            const hoverBox = document.getElementById('pinyin-hover-box');
    
            // Iterate through the array of word dictionaries
            mandarin.forEach((wordDict, index) => {
                let spanElement = document.createElement('span');
                spanElement.textContent = wordDict.character;
                spanElement.classList.add('clickable-example-char');
                
                if (character && wordDict.character.includes(character)) {
                    spanElement.style.color = 'var(--accent-word)';
                }
                spanElement.style.cursor = 'pointer';

                function showTooltip(element, x, y) {
                    // Use the pinyin from the dictionary
                    hoverBox.innerHTML = `
                        <div class="hover-hanzi">${wordDict.character}</div>
                        <div class="hover-pinyin">${wordDict.pinyin.map(toAccentedPinyin)}</div>
                        <div class="hover-english">${wordDict.english.map(toAccentedPinyin)}</div>
                    `;
                    hoverBox.style.display = 'block';
                    hoverBox.style.left = `${x + 10}px`;
                    hoverBox.style.top = `${y + 10}px`;
                    hoverBox.style.display = 'block';
                    const windowWidth = window.innerWidth;
                    const tooltipWidth = hoverBox.offsetWidth;
                    const rightEdgePosition = x + 10 + tooltipWidth;
                    if (rightEdgePosition > windowWidth) {
                        x = windowWidth - tooltipWidth - 20;
                    }
                    hoverBox.style.left = `${x + 10}px`;
                }
            
                function hideTooltip() {
                    hoverBox.style.display = 'none';
                }
            
                spanElement.addEventListener('mouseover', function(e) {
                    if(isMobileOrTablet()){
                        return;
                    }
                    showTooltip(this, e.pageX, e.pageY);
                });
                
                spanElement.addEventListener('click', function(e) {
                    if(isMobileOrTablet()){
                        if(hoverBox.style.display === 'block'){
                            loadRenderDisplay(wordDict.character); 
                            const newUrl = new URL(window.location);
                            newUrl.searchParams.set('character', wordDict.character);
                            history.pushState({}, '', newUrl);
                            hoverBox.style.display = 'none';
                        } else {
                            showTooltip(this, e.pageX, e.pageY);
                            
                            // Auto-hide after 2 seconds on mobile
                            setTimeout(() => {
                                hoverBox.style.display = 'none';
                            }, 2000);
                            
                            return;
                        }
                    } else {
                        loadRenderDisplay(wordDict.character); 
                        const newUrl = new URL(window.location);
                        newUrl.searchParams.set('character', wordDict.character);
                        history.pushState({}, '', newUrl);
                        hoverBox.style.display = 'none';
                    }
                });
    
                spanElement.addEventListener('mouseout', hideTooltip);
                spanElement.addEventListener('mousemove', function (e) {
                    const hoverBox = document.getElementById('pinyin-hover-box');
                    const margin = 10;
                    const maxX = window.innerWidth - hoverBox.offsetWidth - margin;
                    const maxY = window.innerHeight - hoverBox.offsetHeight - margin+ window.scrollY;
                
                    let newX = Math.min(e.pageX + margin, maxX);
                    let newY = Math.min(e.pageY + margin - window.scrollY*0, maxY);
                
                    hoverBox.style.left = `${newX}px`;
                    hoverBox.style.top = `${newY}px`;
                    console.log("thissss")
                });
                
                
                cmnDiv.appendChild(spanElement);
            });
            
            let engDiv = document.createElement('div');
            engDiv.classList.add("mainExampleEnglish");
            engDiv.textContent = english;
            
            let pinDiv = document.createElement('div');
            pinDiv.classList.add("mainExamplePinyin");
            // Combine all pinyin from the word dictionaries
            pinDiv.textContent = mandarin.map(word => word.pinyin).join(' ');
            
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
        await getExamplesPage(page, character);
        populateExamples(currentExamples);
        loadLessButton.style.display = 'block'; 
    });

    loadLessButton.addEventListener('click', async () => {
        if (page > 0) {
            page--;
            await getExamplesPage(page, character);
            populateExamples(currentExamples);
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
            toggleButton.innerHTML = '<span style="text-decoration: underline;">collapse</span>↑';
        } else {
            examplesDiv.style.display = 'none';
            loadButtonsContainer.style.display = 'none';
            toggleButton.innerHTML = '<span style="text-decoration: underline;">expand</span> ↓';
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
    
    fdescript.appendChild(containerDiv);

    return containerDiv;
}

let currentExamples = [];

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
        currentExamples = data.examples;
        if(func){
            func();
        }
        let loadMoreButton = document.getElementById('loadMoreButton');
        loadMoreButton.style.display = data.is_last ? 'none' : 'block';
    } catch (error) {
        console.error('Error:', error);
    }
};


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

let prefetchedPlotters = null;

function loadRenderDisplay(character) {
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
            window['loadedCard'] = data;
            renderCard(data);
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
        })
        .catch(error => {
            console.error('Error:', error);
            messageElement.textContent = `Error: ${error.message}`;
        });
}


function addWord(symbol, set_name, get_rows=false){
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

function populateCardSets() {
    const dropdownTrigger = document.getElementById('wordListDropdown');
    const dropdownMenu = document.getElementById('dropdown-options');
    dropdownMenu.innerHTML = '';
    
    custom_deck_names.forEach(listName => {
        const option = document.createElement('div');
        option.className = 'dropdown-item';
        option.textContent = listName;
        option.dataset.value = listName;
        dropdownMenu.appendChild(option);

        // if clicked, call addWord with current word and listName
        option.addEventListener('click', () => {
            dropdownMenu.style.display = 'none';
            dropdownTrigger.innerHTML = `Add to <i class="fa-solid fa-caret-right"></i>`;
            addWord(currentCharacter, listName);
        });
    });
    
    // const createOption = document.createElement('div');
    // createOption.className = 'dropdown-item create-new-option';
    // createOption.innerHTML = '<i class="fa-solid fa-circle-plus"></i>' + " create word list";
    // createOption.dataset.value = "create_new";
    // dropdownMenu.appendChild(createOption);
}

function setupAddToDeck(){
    let addcardDiv = document.getElementById('flashcard_addcard');
    addcardDiv.classList.add("corner-buttons")
    addcardDiv.innerHTML = `
        <div id="wordset-label-container">
            <div id="wordListDropdown" class="card-custom-dropdown-trigger">
                Add to <i class="fa-solid fa-caret-right"></i>
            </div>
        </div>
        <div id="dropdown-options" class="addcard-dropdown-menu" style="display: none;"></div>`;
    const hoverBox = document.getElementById('pinyin-hover-box');
    
    function showTooltip(element, content, event) {
        hoverBox.innerHTML = content;
        hoverBox.style.display = 'block';
        hoverBox.style.left = `${event.pageX + 10}px`;
        hoverBox.style.top = `${event.pageY + 10 - window.scrollY*0}px`;
    }
    
    function hideTooltip() {
        hoverBox.style.display = 'none';
    }

    // Handle click for mobile devices
    const dropdownTrigger = document.getElementById('wordListDropdown');
    const dropdownMenu = document.getElementById('dropdown-options');

    let flashcardElement = document.getElementById('flashcard_container');
    flashcardElement.addEventListener('click', function(e) {
        dropdownTrigger.innerHTML = `Add to <i class="fa-solid fa-caret-right"></i>`;
        dropdownMenu.style.display = 'none';
    });

    populateCardSets();
    dropdownTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = dropdownMenu.style.display === 'block';
        
        if (!isVisible) {
            // Position the dropdown below the trigger
            const rect = dropdownTrigger.getBoundingClientRect();
            // dropdownTrigger.innerHTML = "Select a word list <i class='fas fa-caret-down'></i>";
            dropdownTrigger.innerHTML = 'Add to <i class="fa-solid fa-caret-down"></i>';
            dropdownMenu.style.top = rect.bottom + 'px';
            dropdownMenu.style.left = rect.left + 'px';
            dropdownMenu.style.minWidth = rect.width + 'px';
            
            dropdownMenu.style.display = 'block';
        } else {
            // dropdownTrigger.innerHTML = "Select a word list <i class='fas fa-caret-right'></i>";
            dropdownTrigger.innerHTML = 'Add to <i class="fa-solid fa-caret-right"></i>';
            dropdownMenu.style.display = 'none';
        }
    });
}

function constSimilars(similars, similarsDiv){

    getCharactersDecompInfo(similars, (similars_per_component) => {

        let ss = "";
        let kkeys = Object.keys(similars_per_component);
        kkeys.forEach((component, idx) => {
            if(idx < kkeys.length - 1){
                ss += component + ", ";
            }
            else if(kkeys.length > 2){
                ss += " and" + component;
            }
            else{
                ss += component;
            }
        });

        similarsDiv.innerHTML = `<span class="rawDefLabel">Similar characters by visual components (${ss.trim()}):</span>`;
    
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
                p.innerHTML = "<span class='rawDefLabelHanzi'>" + component + ":</span>";
                similarsDiv.appendChild(p);
                similar_chars.sort((a, b) => chardict[a].darkness - chardict[b].darkness);
                similar_chars.forEach(similar_char => {
                    const wordLink = document.createElement('a');
                    const hoverBox = document.getElementById('pinyin-hover-box');
        
                    function showTooltip(element, content, event) {
                        hoverBox.innerHTML = content;
                        hoverBox.style.display = 'block';
                    
                        const hoverBoxWidth = hoverBox.offsetWidth;
                        const hoverBoxHeight = hoverBox.offsetHeight;
                        const maxX = window.innerWidth - hoverBoxWidth - 10;
                        const maxY = window.innerHeight - hoverBoxHeight - 10+ window.scrollY;
                    
                        let x = event.pageX + 10;
                        let y = event.pageY + 10 - window.scrollY*0;
                    
                        // if (x > maxX) x = maxX;
                        // if (y > maxY) y = maxY;
                    
                        hoverBox.style.left = `${x}px`;
                        hoverBox.style.top = `${y}px`;
                    }
                    
        
                    function hideTooltip() {
                        hoverBox.style.display = 'none';
                    }
        
                    wordLink.addEventListener('mouseover', function (e) {
                        if(isMobileOrTablet()){
                            return;
                        }
                        const pinyin = chardict[similar_char].pinyin.map(toAccentedPinyin)[0];
                        const english = chardict[similar_char].english.map(toAccentedPinyin)[0];
                        const hsklvl = "chardict[similar_char].hsk_level";
                        let tooltipContent = `<strongsfasf>${pinyin}</strong><br>${english}<br>`;
                    
                        if (isDarkMode) {
                            tooltipContent = `<span><strong>${pinyin}</strong><br>${english}</span>`;
                        }
                        
                        tooltipContent = `
                            <div class="hover-hanzi">${similar_char}</div>
                            <div class="hover-pinyin">${pinyin}</div>
                            <div class="hover-english">${english}</div>
                        `;

                        showTooltip(this, tooltipContent, e);
                    });
                    
                    wordLink.addEventListener('click', function (e) {
                        if(isMobileOrTablet()){
                            if(hoverBox.style.display === 'block'){
                                loadRenderDisplay(similar_char);
                                const newUrl = new URL(window.location);
                                newUrl.searchParams.set('character', similar_char);
                                history.pushState({}, '', newUrl);
                                hoverBox.style.display = 'none';
                            } else {
                                const pinyin = chardict[similar_char].pinyin.map(toAccentedPinyin)[0];
                                const english = chardict[similar_char].english.map(toAccentedPinyin)[0];
                                let tooltipContent = `<strong>${pinyin}</strong><br>${english}<br>`;
                                if (isDarkMode) {
                                    tooltipContent = `<span><strong>${pinyin}</strong><br>${english}</span>`;
                                }
                                tooltipContent = `
                                    <div class="hover-hanzi">${similar_char}</div>
                                    <div class="hover-pinyin">${pinyin}</div>
                                    <div class="hover-english">${english}</div>
                                `;
                                showTooltip(this, tooltipContent, e);
                                e.preventDefault();
                                
                                // Auto-hide after 2 seconds on mobile
                                setTimeout(() => {
                                    hoverBox.style.display = 'none';
                                }, 2000);
                                
                                return;
                            }
                        } else {
                            loadRenderDisplay(similar_char);
                            const newUrl = new URL(window.location);
                            newUrl.searchParams.set('character', similar_char);
                            history.pushState({}, '', newUrl);
                            hoverBox.style.display = 'none';
                        }
                    });
        
                    wordLink.addEventListener('mouseout', hideTooltip);
                    wordLink.addEventListener('mousemove', function (e) {
                        const hoverBoxWidth = hoverBox.offsetWidth;
                        const hoverBoxHeight = hoverBox.offsetHeight;
                        const maxX = window.innerWidth - hoverBoxWidth - 10;
                        const maxY = window.innerHeight - hoverBoxHeight - 10+ window.scrollY;
                    
                        let x = e.pageX + 10;
                        let y = e.pageY + 10 - window.scrollY*0;
                    
                        // if (x > maxX) x = maxX;
                        // if (y > maxY) y = maxY;
                    
                        hoverBox.style.left = `${x}px`;
                        hoverBox.style.top = `${y}px`;
                    });
                    
        
                    wordLink.textContent = similar_char;
                    wordLink.classList.add('word-link');
                    wordLink.style.color = 'var(--hanzi-link-color)';
                    if (isDarkMode) wordLink.classList.add('darkmode');
                    linkss.appendChild(wordLink);
                });
        
                // Expand button
                similarsDiv.appendChild(linkss);
                setTimeout(() => {
                    if (num_similars_per_component > 274) {
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
    });
}

function createClickableHanziElements(text) {
    const container = document.createElement('span');
    const regex = /([\u4e00-\u9fa5]+(?:\|[\u4e00-\u9fa5]+)?)(?:\[([^\]]+)\])?/g;
    
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        // Add any text before the match
        if (match.index > lastIndex) {
            container.appendChild(document.createTextNode(
                text.substring(lastIndex, match.index)
            ));
        }
        
        const fullMatch = match[0];
        const hanziPart = match[1];
        
        const hanziWords = hanziPart.split('|');
        
        hanziWords.forEach((word, index) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'clickable-hanzi';
            wordSpan.textContent = word;
            wordSpan.style.cursor = 'pointer';
            wordSpan.style.color = 'var(--hanzi-link-color)';
            // wordSpan.style.textDecoration = 'underline';
            
            wordSpan.addEventListener('click', function() {
                console.log('click');
                loadRenderDisplay(word);
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('character', word);
                history.pushState({}, '', newUrl);
            });
            
            container.appendChild(wordSpan);
            
            if (index < hanziWords.length - 1) {
                container.appendChild(document.createTextNode('|'));
            }
        });
        
        if (match[2]) {
            container.appendChild(document.createTextNode('[' + match[2] + ']'));
        }
        
        lastIndex = match.index + fullMatch.length;
    }
    
    if (lastIndex < text.length) {
        container.appendChild(document.createTextNode(
            text.substring(lastIndex)
        ));
    }
    
    return container;
}


function renderCard(data) {
    const container = document.getElementById('flashcard_container');
    if(container.style.display === 'none' || !container.style.display){
        container.style.display = 'flex';
    }

    const characterElement = document.getElementById('flashcard_character');
    const characterNoto = document.getElementById('flashcard_character_noto');
    characterElement.classList.add('flashcard_character');
    characterNoto.classList.add('flashcard_character');

    if(characterElement){
        characterElement.innerHTML = '';
        characterNoto.innerHTML = '';
    }


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
        if(isMobileOrTablet() || true){
            span.addEventListener('click', function(e) {
                e.stopPropagation();
                // window.location.href = `./search?query=${encodeURIComponent(char)}`;
                window['nextLoadedCard'] = null;
                window['prevLoadedCard'] = null;
                window['loadedCard'] = null;
                loadRenderDisplay(char);
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('character', char);
                history.pushState({}, '', newUrl);
            });
            span.style.hover = 'color: #ffd91c';
            // span.style.cursor = 'pointer';
        }
        span.style.transition = 'text-shadow 0.05s';
        span.style.textShadow = 'none'; 
        if(characterElement)
            characterElement.appendChild(span);

        let spanclone = span.cloneNode(true);
        if(characterNoto)
            characterNoto.appendChild(spanclone);
    });

    const plotterElement = document.getElementById('flashcard_plotter');
    if(plotterElement){
        plotterElement.innerHTML = '';
        renderPlotters(data.plotters, pparts);
    }
    //document.getElementById('flashcard_pinyin').textContent = toAccentedPinyin(data.pinyin);
    document.getElementById('flashcard_english').innerHTML = '';
    let englishList = document.createElement('ul');
    data.english.forEach((english, index) => {
        let pinyItem = document.createElement('span');
        pinyItem.style.opacity = 0.6;
        pinyItem.style.paddingRight = "0.5em";
        pinyItem.style.fontStyle = 'italic';
        let englishItem = createClickableHanziElements(toAccentedPinyin(english.replace(/\//g, ' / ')));
        let englishRow = document.createElement('div');
        pinyItem.textContent = "(" + toAccentedPinyin(data.pinyin[index]) + ")";
        if(index == 0){
            // if(data.pinyin.length > 1){
                // englishRow.appendChild(pinyItem);
            // }
            englishRow.appendChild(englishItem);
            englishList.appendChild(englishRow);
        }
    });
    document.getElementById('flashcard_pinyin').textContent = data.pinyin.map(toAccentedPinyin)[0];
    document.getElementById('flashcard_pinyin').dataset.characters = data.character;
    document.getElementById('flashcard_english').appendChild(englishList);
    // if(chars.length > 1){
    //     document.getElementById('flashcard_english').appendChild(englishList);
    // }
    let ai_content = data.html;


    const descriptionContainer = document.createElement('div');
    descriptionContainer.id = 'descriptionContainer';

    const rawLabel = document.createElement('div');
    rawLabel.innerHTML = "Character breakdown ↓";
    rawLabel.style.marginTop = '2em';
    rawLabel.style.marginBottom = '1em';
    rawLabel.style.opacity = '0.6';
    const exLabel = document.createElement('div');
    exLabel.innerHTML = `Examples including ${data.character} ↓`;
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
        let char_info = data.chars_breakdown[char];
        const english = char_info.english;
        const pinyin = char_info.pinyin;
        const frequency = char_info.frequency;
        const traditional = char_info.traditional;
        const simplified = char_info.simplified;
        const rank = char_info.rank;
        const darkness = char_info.darkness;
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
        if(chars.length > 1){
            tabNav.appendChild(tabButton);
        }
        // Create content div
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('tab-content');
        entryDiv.id = `tab-${index}`;
        entryDiv.innerHTML = '';
        
        // const filteredRadicals = Object.entries(radicals)
        //     .filter(([rad, meaning]) => meaning && meaning !== "No glyph available")
        //     .map(([rad, meaning]) => `${rad} (${meaning})`)
        //     .join(', ');
        
        const filteredRadicals = Object.entries(radicals)
            .map(([rad, meaning]) => {
                let s = `${rad} <span style="opacity: 0.5;">(-)</span>`;
                if(meaning && meaning !== "No glyph available"){
                    s = `${rad} <span style="opacity: 0.5;">(${meaning})</span>`;
                }
                return s;
            })
            .join(', ');


        function createDefEntry(label, content, contentDiv) {
            const entry = document.createElement('div');
            entry.className = 'rawDefEntry';
            
            const labelDiv = document.createElement('div');
            labelDiv.className = 'rawDefLabel';
            labelDiv.textContent = label;
            
            entry.appendChild(labelDiv);
            if(contentDiv){
                contentDiv.className = 'rawDefContent';
                entry.appendChild(contentDiv);
                return entry;
            }
            contentDiv = document.createElement('div');
            contentDiv.className = 'rawDefContent';
            contentDiv.innerHTML = content;
            entry.appendChild(contentDiv);
            return entry;
        }

        const definitionsTable = document.createElement('div');
        definitionsTable.className = 'definitions-grid';

        const headerRow = document.createElement('div');
        headerRow.className = 'grid-row header';

        const pinyinHeader = document.createElement('div');
        pinyinHeader.className = 'grid-cell pinyin-cell';
        pinyinHeader.textContent = 'Pinyin';

        const meaningHeader = document.createElement('div');
        meaningHeader.className = 'grid-cell meaning-cell';
        meaningHeader.textContent = 'Meaning';

        headerRow.appendChild(pinyinHeader);
        headerRow.appendChild(meaningHeader);
        definitionsTable.appendChild(headerRow);

        // Determine the number of rows needed
        const maxEntries = Math.max(pinyin.length, english.length);

        // Create a row for each definition pair
        for (let i = 0; i < maxEntries; i++) {
            const dataRow = document.createElement('div');
            dataRow.className = 'grid-row';
            
            const pinyinCell = document.createElement('div');
            pinyinCell.className = 'grid-cell pinyin-cell';
            pinyinCell.textContent = i < pinyin.length ? toAccentedPinyin(pinyin[i]) : '';
            
            const meaningCell = document.createElement('div');
            meaningCell.className = 'grid-cell meaning-cell';
            meaningCell.appendChild(createClickableHanziElements(toAccentedPinyin(english[i].replace(/\//g, ' / '))));
            
            dataRow.appendChild(pinyinCell);
            dataRow.appendChild(meaningCell);
            definitionsTable.appendChild(dataRow);
        }

        const defLabelDiv = document.createElement('div');
        defLabelDiv.className = 'rawDefLabel';
        defLabelDiv.textContent = "Definitions:";
        
        // append just a horiztonal line
        const hr = document.createElement('hr');
        hr.style.border = '0';
        hr.style.height = '4px';
        hr.style.backgroundColor = 'var(--dimmer-background-color)';
        hr.style.marginLeft = '0';
        hr.style.marginRight = '0';

        entryDiv.appendChild(defLabelDiv);
        entryDiv.appendChild(definitionsTable);
        entryDiv.appendChild(hr);


        if (rank !== null) {
            entryDiv.appendChild(createDefEntry('Frequency rank: ', rank));
        }
        // if (darkness !== null && darkness !== 0 && darkness !== -1) {
        //     entryDiv.appendChild(createDefEntry('Stroke count: ', darkness));
        // }
        if (traditional !== simplified && char !== traditional) {
            entryDiv.appendChild(createDefEntry('Traditional: ', null, createClickableHanziElements(traditional)));
        }
        if (traditional !== simplified && char !== simplified) {
            entryDiv.appendChild(createDefEntry('Simplified: ', null, createClickableHanziElements(simplified)));
        }

        entryDiv.appendChild(createDefEntry('Graphical components: ', graphical_components.join(', ')));
        if (filteredRadicals) {
            entryDiv.appendChild(createDefEntry('Radicals: ', filteredRadicals));
        }

    
        //<div class="rawDefEntry"><div class="rawDefLabel">Main components:</div> <div class="rawDefContent">${main_components.join(', ')}</div></div>
        

        // Similar Characters per Component
        const similarsDiv = document.createElement('div');
        similarsDiv.classList.add('rawDefEntry');
        constSimilars(char, similarsDiv);
        
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
        
                // sort similar_chars by stroke count
                similar_chars.forEach(similar_char => {
                    const wordLink = document.createElement('a');
                    const hoverBox = document.getElementById('pinyin-hover-box');
        
                    
                    function showTooltip(element, content, event) {
                        hoverBox.innerHTML = content;
                        hoverBox.style.display = 'block';
                    
                        const hoverBoxWidth = hoverBox.offsetWidth;
                        const hoverBoxHeight = hoverBox.offsetHeight;
                        const maxX = window.innerWidth - hoverBoxWidth - 10;
                        const maxY = window.innerHeight - hoverBoxHeight - 10+ window.scrollY;
                    
                        let x = event.pageX + 10;
                        let y = event.pageY + 10 - window.scrollY*0;
                    
                        if (x > maxX) x = maxX;
                        // if (y > maxY) y = maxY;
                    
                        hoverBox.style.left = `${x}px`;
                        hoverBox.style.top = `${y}px`;
                    }
        
                    function hideTooltip() {
                        hoverBox.style.display = 'none';
                    }
        
                    wordLink.addEventListener('mouseover', function (e) {
                        if(isMobileOrTablet()){
                            return;
                        }
                        const pinyin = chardict[similar_char].pinyin.map(toAccentedPinyin);
                        const english = chardict[similar_char].definition.map(toAccentedPinyin);
                        const hsklvl = "chardict[similar_char].hsk_level";
                        let tooltipContent = `<strong>${pinyin}</strong><br>${english}<br>`;
                    
                        if (isDarkMode) {
                            tooltipContent = `<span><strong>${pinyin}</strong><br>${english}</span>`;
                        }
                        showTooltip(this, tooltipContent, e);
                    });
                    
                    wordLink.addEventListener('click', function (e) {
                        if(isMobileOrTablet()){
                            if(hoverBox.style.display === 'block'){
                                loadRenderDisplay(similar_char);
                                const newUrl = new URL(window.location);
                                newUrl.searchParams.set('character', similar_char);
                                history.pushState({}, '', newUrl);
                                hoverBox.style.display = 'none';
                            } else {
                                const pinyin = toAccentedPinyin(chardict[similar_char].pinyin[0]);
                                const english = toAccentedPinyin(chardict[similar_char].definition[0]);
                                let tooltipContent = `<span><strong>${pinyin}</strong><br>${english}</span>`;
                                if (isDarkMode) {
                                    tooltipContent = `<span><strong>${pinyin}</strong><br>${english}</span>`;
                                }
                                showTooltip(this, tooltipContent, e);
                                e.preventDefault();
                                
                                // Auto-hide after 2 seconds on mobile
                                setTimeout(() => {
                                    hoverBox.style.display = 'none';
                                }, 2000);
                                
                                return;
                            }
                        } else {
                            loadRenderDisplay(similar_char);
                            const newUrl = new URL(window.location);
                            newUrl.searchParams.set('character', similar_char);
                            history.pushState({}, '', newUrl);
                            hoverBox.style.display = 'none';
                        }
                    });
                    
        
                    wordLink.addEventListener('mouseout', hideTooltip);
                    wordLink.addEventListener('mousemove', function (e) {
                        const hoverBoxWidth = hoverBox.offsetWidth;
                        const hoverBoxHeight = hoverBox.offsetHeight;
                        const maxX = window.innerWidth - hoverBoxWidth - 10;
                        const maxY = window.innerHeight - hoverBoxHeight - 10+ window.scrollY;
                    
                        let x = e.pageX + 10;
                        let y = e.pageY + 10 - window.scrollY*0;
                    
                        if (x > maxX) x = maxX;
                        // if (y > maxY) y = maxY;
                    
                        hoverBox.style.left = `${x}px`;
                        hoverBox.style.top = `${y}px`;
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
            const pinyin = entry.pinyin.map(toAccentedPinyin)[0];
            const english = entry.english.map(toAccentedPinyin)[0];
            wordLink.innerHTML = `<span class="small_hanzi">${similar_char}</span> - <span class="small_english">${english}</span>`;

            const hoverBox = document.getElementById('pinyin-hover-box');

            function showTooltip(element, content, event) {
                if(isMobileOrTablet())
                    return;
                hoverBox.innerHTML = content;
                hoverBox.style.display = 'block';
            
                const hoverBoxWidth = hoverBox.offsetWidth;
                const hoverBoxHeight = hoverBox.offsetHeight;
                const maxX = window.innerWidth - hoverBoxWidth - 10;
                const maxY = window.innerHeight - hoverBoxHeight - 10+ window.scrollY;
            
                let x = event.pageX + 10;
                let y = event.pageY + 10 - window.scrollY*0;
            
                if (x > maxX) x = maxX;
                // if (y > maxY) y = maxY;
            
                hoverBox.style.left = `${x}px`;
                hoverBox.style.top = `${y}px`;
            }

            function hideTooltip() {
                hoverBox.style.display = 'none';
            }
            
            wordLink.onclick = function() {
                loadRenderDisplay(similar_char); 
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('character', similar_char);
                history.pushState({}, '', newUrl);
                hoverBox.style.display = 'none';
            };

            wordLink.addEventListener('mouseover', function(e) {
                if(isMobileOrTablet())
                    return;
                const pinyin = entry.pinyin.map(toAccentedPinyin);
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
            wordLink.addEventListener('mousemove', function (e) {
                const hoverBoxWidth = hoverBox.offsetWidth;
                const hoverBoxHeight = hoverBox.offsetHeight;
                const maxX = window.innerWidth - hoverBoxWidth - 10;
                const maxY = window.innerHeight - hoverBoxHeight - 10+ window.scrollY;
            
                let x = e.pageX + 10;
                let y = e.pageY + 10 - window.scrollY*0;
            
                if (x > maxX) x = maxX;
                // if (y > maxY) y = maxY;
            
                hoverBox.style.left = `${x}px`;
                hoverBox.style.top = `${y}px`;
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
        // entryDiv.appendChild(appearsInDiv);


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

    const llmLabel = document.createElement('p');
    llmLabel.textContent = "LLM description ";
    llmLabel.id = 'descriptionLabel';
    llmLabel.class = 'notes-label';
    const llmParagraph = document.createElement('p');
    llmParagraph.innerHTML = ai_content;
    llmParagraph.id = 'descriptionParagraph';

    if(ai_content.trim() === ''){

    }
    else{
        // descriptionContainer.appendChild(llmLabel);
        // descriptionContainer.appendChild(llmParagraph);
    }

    // Add click handler to the label


    // Replace the existing content
    let fdescript = document.getElementById('flashcard_description');
    fdescript.innerHTML = '';
    fdescript.appendChild(rawLabel);
    fdescript.appendChild(tabNav);
    fdescript.appendChild(descriptionContainer);
    fdescript.appendChild(exLabel);
    // if(data.examples.length > 0){
    exampleAttempts = 0;
    let mainExamplesDiv = getExamplesDiv(fdescript, data.examples, data.character, data.is_last);
    // }

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

    let addcard = document.getElementById('flashcard_addcard');


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
    
    llmLabel.classList.add('collapsed');
    llmParagraph.style.display = 'none';

    llmLabel.addEventListener('click', () => {
        llmParagraph.style.display = llmParagraph.style.display === 'none' ? 'block' : 'none';
        if (llmParagraph.style.display === 'none') {
            llmLabel.classList.add('collapsed');
        }
        else {
            llmLabel.classList.remove('collapsed');
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
    let url = window.location.href;
    // check if url contains "account"
    if(!url.includes("account")){
        setupAddToDeck();
    }
    else{
        addcard.style.display = 'none';
    }
    // setupCloseButton();

    // check if "flashcards" in url
    let urlsplit = url.split('/');
    let last = urlsplit[urlsplit.length - 1];
    if(last === "flashcards"){
        addcard.style.display = 'none';
    }
    if(username === "tempuser"){
        addcard.style.display = 'none';
    }

    container.addEventListener("scroll", function () {
        addcard.style.transform = `translateY(${container.scrollTop}px)`;
    });
    addcard.onclick = function(){
        // print current character
        let rect = document.getElementById('flashcard_addcard').getBoundingClientRect();
        // print the exact location of the document.getElementById('flashcard_addcard') on the screen 
        let x = rect.left;
        let y = rect.top;
        let width = rect.width;
        let height = rect.height;
        let middlex = x + width/2;
        let middley = y + height/2;


        setupAddToDeck();
        // element.classList.add('fall-out');
        // setTimeout(() => {
        //     element.style.display = 'none';
        //     element.classList.remove('fall-out');
        // }, 350);

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
            // overlay.style.display = 'flex';
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
    document.getElementById('flashcard_overlay').style.display = 'flex';
    const flashcardElement = document.getElementById('flashcard_description');
    const englishElement = document.getElementById('flashcard_english');
    const pinyinElement = document.getElementById('flashcard_pinyin');
    const functionElement = document.getElementById('flashcard_function');
    const char_matchesElement = document.getElementById('flashcard_char_matches');
    pinyinElement.classList.toggle('visible', showPinyin || showAnswer);
    flashcardElement.style.visibility = showAnswer ? 'visible' : 'hidden';
    englishElement.style.visibility = showAnswer ? 'visible' : 'hidden';
    // functionElement.style.visibility = showAnswer ? 'visible' : 'hidden';
    functionElement.style.display = 'none';
    char_matchesElement.style.visibility = showAnswer ? 'visible' : 'hidden';
}


