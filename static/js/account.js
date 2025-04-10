let addWordsInput = document.getElementById('newWords');

function addToTable(progressRows) {
    let tableBody = document.getElementById("wordlist-table");
    let hoverBox = document.getElementById('pinyin-hover-box');
    progressRows.sort((a, b) => {
        if(a.character === null || a.character === undefined){
            return 0;
        }
        if(b.character === null || b.character === undefined){
            return 0;
        }
        const pinyinA = a.pinyin[0].toLowerCase();
        const pinyinB = b.pinyin[0].toLowerCase();
        if (pinyinA < pinyinB) return -1;
        if (pinyinA > pinyinB) return 1;
        return 0;
    });
    progressRows.forEach((stat, idx) => {
        if (document.querySelector(`tr[data-character="${stat.character}"]`)) {
            return;
        }
        // skip if stat is empty dictionary

        let row = document.createElement("tr");

        if (stat.is_due) {
            row.style.backgroundColor = "var(--due-color)";
            row.setAttribute("data-isdue", "1");
        } else if (stat.box === 6) {
            row.style.backgroundColor = "var(--learned-color)";
        } 
        row.setAttribute("data-character", stat.character);

        const isodd = idx % 2 === 1 ? " oddrow" : "";

        row.innerHTML = `
            </td>
                <div class="stat-row character${isodd}" data-pinyin="${stat.pinyin}" data-english="${stat.english}"')">
                    <div class="stat-hanzi-pinyin">
                        <div class="stat-hanzi"><a>${stat.character}</a></div>
                        <div class="stat-pinyin">${toAccentedPinyin(stat.pinyin[0])}</div>
                    </div>
                    <div class="stat-english">${toAccentedPinyin(stat.english[0])}</div>
                </div>
            </td>
            <td>
                <div class="remove-card" data-tooltip="Remove from learning" data-character="${stat.character}">
                    <i class="fa-solid fa-xmark"></i>
                </div>
            </td>
        `;

        tableBody.appendChild(row);

        // Add event listeners only to new elements
        let binIcon = row.querySelector('.remove-card');
        binIcon.addEventListener('click', () => {
            let character = binIcon.getAttribute('data-character');
            removeRows(character);
            removeCardFromLearning(currentWordlist, character);
        });

        let characterCell = row.querySelector('.character');
        characterCell.addEventListener('mouseover', function(e) {
            const pinyin = this.getAttribute('data-pinyin');
            const english = this.getAttribute('data-english');
            showTooltip(this, english, e);
        });
        let timeout;
        characterCell.addEventListener('mouseenter', function(e) {
            if(cardVisible){
                return;
            }
            activeCharacter = stat.character;
            timeout = setTimeout(() => {
                loadCard(stat.character, true, 'loadedCard');
            }, 200);
        });
        
        characterCell.addEventListener('mouseleave', () => {
            clearTimeout(timeout);
        });
        characterCell.addEventListener('click', function(e) {
            clearTimeout(timeout);
            maybeLoadRenderAndThenShow(stat.character, 0, true);
        });

        characterCell.addEventListener('mouseout', hideTooltip);

        characterCell.addEventListener('mousemove', function(e) {
            const hoverBoxWidth = hoverBox.offsetWidth;
            const hoverBoxHeight = hoverBox.offsetHeight;
            const scrollY = window.scrollY;
            const maxX = window.innerWidth - hoverBoxWidth - 10;
            const maxY = window.innerHeight - hoverBoxHeight - 10 + scrollY;
        
            let newX = e.pageX + 10;
            let newY = e.pageY + 10;
        
            if (newX > maxX) newX = maxX;
            if (newY > maxY) newY = maxY;
        
            hoverBox.style.left = `${newX}px`;
            hoverBox.style.top = `${newY}px`;
        });
        
    });

    setTimeout(() => {
        let numcards = Object.keys(wordlists_words[currentWordlist]).length;
        document.getElementById('numcards').textContent = `Cards in deck: ${numcards}`;
    }, 100);
}


function getRowData(chars, deck=currentWordlist){
    fetch("./api/get_progress_data_for_chars", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ chars: chars })
    })
    .then(response => response.json())
    .then(data => {
        addToTable(data.progress_stats);
        data.progress_stats.forEach(stat => {
            let pinyin = stat.pinyin;
            let english = stat.english;
            let character = stat.character;
            wordlists_words[deck].push({character: character, pinyin: pinyin, english: english});
        });
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

function populateDropdown() {
    dropdownMenu.innerHTML = '';
    
    Object.keys(wordlists_words).forEach(listName => {
        const option = document.createElement('div');
        option.className = 'wordlist-dropdown-item';
        option.textContent = listName;
        option.dataset.value = listName;
        dropdownMenu.appendChild(option);
    });
    
    const createOption = document.createElement('div');
    createOption.className = 'wordlist-dropdown-item create-new-option';
    createOption.innerHTML = '<i class="fa-solid fa-circle-plus"></i>' + " create word list";
    createOption.dataset.value = "create_new";
    dropdownMenu.appendChild(createOption);
}

function addWordDirect(symbol, set_name){
    addWordsInput.value = '';
    
    fetch("./api/add_word_to_learning", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ word: symbol, set_name: set_name })
    })
    .then(response => response.json())
    .then(data => {
        let addedWords = data.added;
        getRowData(addedWords, set_name);
        // addedWords.forEach(word => {
        //     getRowData([word]);
        // });
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

function renameWordlistInDB(name, newname){
    fetch("./api/rename_wordlist", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: name, newname: newname })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        console.log("Word list renamed successfully");
    })
    .catch(error => {
        console.error("There was a problem renaming the word list:", error);
    });
}

function handleRename(e){
    if(e) e.preventDefault();
    let newName = prompt("Enter a new name for the word list");
    if(newName){
        let oldname = currentWordlist;
        renameWordlistInDB(oldname, newName);
        wordlists_words[newName] = wordlists_words[currentWordlist];
        delete wordlists_words[currentWordlist];
        currentWordlist = newName;
        dropdownTrigger.innerHTML = currentWordlist + " <i class='fa-solid fa-caret-right'></i>";
        populateDropdown();
        addToTable(wordlists_words[currentWordlist]);
        reworkUrls();
    }
}


function removeWordlist(wordlist){
   if(wordlist == currentWordlist){
        
        delete wordlists_words[currentWordlist];
        currentWordlist = Object.keys(wordlists_words)[0];
        dropdownTrigger.innerHTML = currentWordlist + " <i class='fa-solid fa-caret-right'></i>";
        let tableBody = document.getElementById("wordlist-table");
        tableBody.innerHTML = "";
        reworkUrls();
        populateDropdown();
        addToTable(wordlists_words[currentWordlist]);

        fetch("./api/remove_wordlist", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: wordlist })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            console.log("Word list removed successfully");
        })
        .catch(error => {
            console.error("There was a problem removing the word list:", error);
        });
   }
}

function handleAddCards(e){
    e.preventDefault();
    let words = addWordsInput.value;
    let deck = currentWordlist;
    console.log("handling add cards", words, deck); 
    addWordDirect(words, currentWordlist);
}

function formatDateTime(dateTimeString) {
    // Parse the input string
    const date = new Date(dateTimeString);
    
    // Format date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Format time
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    // Combine into a nicely formatted string
    return `${year}-${month}-${day} <br> ${hours}:${minutes}:${seconds}`;
}

function dateToPinyin(formattedDate) {
    const numbersToPinyin = {
        '0': 'líng', '1': 'yī', '2': 'èr', '3': 'sān', '4': 'sì', '5': 'wǔ',
        '6': 'liù', '7': 'qī', '8': 'bā', '9': 'jiǔ', '10': 'shí'
    };

    function numberToPinyin(num) {
        num = parseInt(num);
        if (num <= 10) return numbersToPinyin[num];
        if (num < 20) return `shí ${numbersToPinyin[num - 10]}`.trim();
        const tens = Math.floor(num / 10);
        const ones = num % 10;
        return `${numbersToPinyin[tens]} shí ${ones ? numbersToPinyin[ones] : ''}`.trim();
    }

    const monthsToPinyin = {
        '01': 'yī yuè', '02': 'èr yuè', '03': 'sān yuè', '04': 'sì yuè',
        '05': 'wǔ yuè', '06': 'liù yuè', '07': 'qī yuè', '08': 'bā yuè',
        '09': 'jiǔ yuè', '10': 'shí yuè', '11': 'shíyī yuè', '12': 'shí\'èr yuè'
    };

    const [datePart, timePart] = formattedDate.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = timePart.split(':');

    const yearPinyin = year.split('').map(digit => numbersToPinyin[digit]).join(' ') + ' nián';
    const monthPinyin = monthsToPinyin[month];
    const dayPinyin = numberToPinyin(day) + ' rì';
    const hourPinyin = numberToPinyin(hour) + ' diǎn';
    const minutePinyin = numberToPinyin(minute) + ' fēn';
    const secondPinyin = numberToPinyin(second) + ' miǎo';

    return `${yearPinyin}, ${monthPinyin}, ${dayPinyin}, ${hourPinyin}, ${minutePinyin}, ${secondPinyin}`;
}

function changeDeck(deck, func=null) {
    fetch(`./api/change_deck?deck=${deck}`, {
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

function getFont() {
    console.log('getting font');
    fetch('/api/get_font', {
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

            applyFont(currentFont);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}


let overlay, flashcardContent, messageElement;
window['loadedCard'] = null;
window['nextLoadedCard'] = null;
window['prevLoadedCard'] = null;

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


function removeCardFromLearning(wordlist, character){
    wordlists_words[currentWordlist] = wordlists_words[currentWordlist].filter(word => word.character !== character);
    fetch(`./api/remove_word_from_learning`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ character: character, set_name: wordlist })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        console.log('Card removed successfully');
        
        let numcards = Object.keys(wordlists_words[currentWordlist]).length;
        document.getElementById('numcards').textContent = `Cards in deck: ${numcards}`;
    })
    .catch(error => {
        console.error('There was a problem removing the card:', error);
    });
}

    

function removeRows(character){
    document.querySelectorAll(`tr[data-character='${character}']`).forEach(tr => {
        tr.remove();
    });
}


function showTooltip(element, content, event) {
        if(isMobileOrTablet()) return;

        let hoverBox = document.getElementById('pinyin-hover-box');

        hoverBox.innerHTML = content;
        hoverBox.style.display = 'block';
        hoverBox.style.left = `${event.pageX + 10}px`;
        hoverBox.style.top = `${event.pageY + 10}px`;

        
        // setTimeout(() => {
        //     hideTooltip();
        // }, 400);
    }

function hideTooltip() {
    document.getElementById('pinyin-hover-box').style.display = 'none';
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


function isMobileOrTablet() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check || /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

const addWordInstructions = `
    <p>Enter a single character or a list of words.</p>
    <p>E.g. <span class="codeBlock">你,好,早上,好</span></p>
    <p>or <span class="codeBlock">你 好 早上 好</span></p>
    <p>or even <span class="codeBlock">1. 你 2. 好 3. 早上 4. 好</span></p>
    <p>Any text that has Chinese words sepparated in some way.</p>
    <p>Words will be parsed and added to the current list and will be visible in the table bellow.</p>
`;



document.addEventListener('DOMContentLoaded', function() {
    const tooltipHeaders = document.querySelectorAll('.tooltip-header');
    const dateCells = document.querySelectorAll('.next-review-date');
    const hoverBox = document.getElementById('pinyin-hover-box');

    const addwordInfo = document.getElementById('addwordInfo');
    addwordInfo.addEventListener('mouseover', function(e) {
        showTooltip(this, addWordInstructions, e);
    });
    addwordInfo.addEventListener('mouseout', hideTooltip);
    addwordInfo.addEventListener('mousemove', function(e) {
        hoverBox.style.left = `${e.pageX + 10}px`;
        hoverBox.style.top = `${e.pageY + 10}px`;
    });

    overlay = document.getElementById('flashcard_overlay');
    flashcardContent = document.getElementById('flashcard_container');
    messageElement = document.getElementById('message');
    // overlay.addEventListener('click', (e) => {
    //     if (e.target === overlay) {
    //         cardVisible = false;
    //         overlay.style.display = 'none';
    //         document.getElementById('dropdown-options-card').style.display = 'none';
    //     }
    // });


    // overlay.addEventListener('click', (e) => {
    //     if (e.target === overlay && !e.target.closest('#font-select')) {
    //         cardVisible = false;
    //         overlay.style.display = 'none';
            // bordercanvas.style.display = 'none';
            // document.getElementById('font-select').style.display = 'none';
    //     }
    // });

    
    getFont();
    adjustFlashCardChars();

    tooltipHeaders.forEach(header => {
        header.addEventListener('mouseenter', function(e) {
            const tooltip = this.getAttribute('data-tooltip');
            showTooltip(this, tooltip, e);
        });

        header.addEventListener('mouseout', hideTooltip);

        header.addEventListener('mousemove', function(e) {
            hoverBox.style.left = `${e.pageX + 10}px`;
            hoverBox.style.top = `${e.pageY + 10}px`;
        });
    });

    document.querySelectorAll('.remove-card').forEach(binIcon => {
        binIcon.addEventListener('click', (event) => {
            let character = binIcon.getAttribute('data-charater');
            // remove it from dctionary
            removeRows(character);
            removeCardFromLearning(currentWordlist, character);
        });
    });

    const characters = document.querySelectorAll('.character');
    characters.forEach(character => {
        character.addEventListener('mouseover', function(e) {
            const pinyin = this.getAttribute('data-pinyin');
            const english = this.getAttribute('data-english');
            const character = this.getAttribute('data-character');
            showTooltip(this, english, e);

        });

        let timeout;
        character.addEventListener('mouseenter', function(e) {
            if(cardVisible){
                return;
            }
            activeCharacter = stat.character;
            timeout = setTimeout(() => {
                loadCard(stat.character, true, 'loadedCard');
            }, 200);
        });
        character.addEventListener('click', function(e) {
            clearTimeout(timeout);
            maybeLoadRenderAndThenShow(stat.character);
        });

        character.addEventListener('mouseleave', () => {
            clearTimeout(timeout);
        });
        character.addEventListener('mouseout', hideTooltip);

        character.addEventListener('mousemove', function(e) {
            hoverBox.style.left = `${e.pageX + 10}px`;
            hoverBox.style.top = `${e.pageY + 10}px`;
        });
    });



    const now = new Date();
    dateCells.forEach(cell => {
        const originalDate = new Date(cell.textContent);
        
        const parent = cell.parentElement;
        const isDue = parent.getAttribute('data-isdue');

        if (isDue) {
            cell.textContent = "DUE";
            cell.classList.add('due-date');
        } else {
            const formattedDate = formatDateTime(originalDate);
            const pinyinDate = dateToPinyin(formattedDate.replace('<br> ', ''));
            cell.innerHTML = formattedDate;
            cell.addEventListener('mouseover', function(e) {
                showTooltip(this, pinyinDate, e);
            });

            cell.addEventListener('mouseout', hideTooltip);

            cell.addEventListener('mousemove', function(e) {
                hoverBox.style.left = `${e.pageX + 10}px`;
                hoverBox.style.top = `${e.pageY + 10}px`;
            });
        }
    });

});

const fontMap = {
        "Noto Sans Mono": { family: "Noto Sans Mono", size: 22 },
        "Noto Serif SC": { family: "Noto Serif SC", size: 22 },
        "Kaiti": { family: "Kaiti", size: 26 }
    };


function applyFont(font) {
    const fontInfo = fontMap[font];
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
        characterDiv.style.display = 'block';
        // plotterDiv.style.display = 'none';
    }
    if (fontInfo) {
        currentFont = font;
        adjustFlashCardChars();
        
        const gridItems = document.querySelectorAll('.character');
        gridItems.forEach(item => {
            // item.style.fontSize = `${fontInfo.size}px`;
            item.style.fontFamily = `"${currentFont}"`;
        });
        console.log('selected font', currentFont);
    }
    console.log(fontInfo)
    
}

let currentToggleFont = 0;
function changeFont(font) {
    console.log("calling change font")
    const fontInfo = fontMap[font];
    applyFont(font);

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

function getNeighbors(inputChar){
    let nextcharidx = wordlists_words[currentWordlist].map(word => word.character).indexOf(inputChar) + 1;
    let prevcharidx = wordlists_words[currentWordlist].map(word => word.character).indexOf(inputChar) - 1;
    nextcharidx = nextcharidx % wordlists_words[currentWordlist].length;
    prevcharidx = (prevcharidx + wordlists_words[currentWordlist].length) % wordlists_words[currentWordlist].length;
    let nextchar = wordlists_words[currentWordlist][nextcharidx].character;
    let prevchar = wordlists_words[currentWordlist][prevcharidx].character;
    return {nextchar, prevchar};
}


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
        let nextcharidx = wordlists_words[currentWordlist].map(word => word.character).indexOf(window['loadedCard'].character) + 1;
        let prevcharidx = wordlists_words[currentWordlist].map(word => word.character).indexOf(window['loadedCard'].character) - 1;
        nextcharidx = nextcharidx % wordlists_words[currentWordlist].length;
        prevcharidx = (prevcharidx + wordlists_words[currentWordlist].length) % wordlists_words[currentWordlist].length;
        let nextchar = wordlists_words[currentWordlist][nextcharidx].character;
        let prevchar = wordlists_words[currentWordlist][prevcharidx].character;
        loadCard(nextchar, false, 'nextLoadedCard');
        loadCard(prevchar, false, 'prevLoadedCard');
        // recordView(character);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}


// swipe left right
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
    console.log(xDiff, yDiff);
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 8) {
            loadAndShowPreviousCard();
        } else if (xDiff < -8) {
            loadAndShowNextCard();
        }
    }
    xDown = null;
    yDown = null;
}

function loadAndShowPreviousCard() {
    let idx = wordlists_words[currentWordlist].map(word => word.character).indexOf(activeCharacter);
    let prevChar = wordlists_words[currentWordlist][(idx - 1 + wordlists_words[currentWordlist].length) % wordlists_words[currentWordlist].length].character;
    // activeCharacter = prevChar;
    maybeLoadRenderAndThenShow(prevChar, -1);
}

function loadAndShowNextCard() {
    let idx = wordlists_words[currentWordlist].map(word => word.character).indexOf(activeCharacter);
    let nextChar = wordlists_words[currentWordlist][(idx + 1) % wordlists_words[currentWordlist].length].character;
    // activeCharacter = nextChar;
    maybeLoadRenderAndThenShow(nextChar, 1);
}

let isNavigating = false;
document.addEventListener('keydown', function(event) {
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

