let addWordsInput = document.getElementById('newWords');
let cardVisible = false;    

function addToTable(progressRows) {
    let tableBody = document.querySelector("table tbody");
    let hoverBox = document.getElementById('pinyin-hover-box');
    
    progressRows.forEach(stat => {
        if (document.querySelector(`tr[data-character="${stat.character}"]`)) {
            return; // Skip if character already exists
        }

        let row = document.createElement("tr");

        if (stat.is_due) {
            row.style.backgroundColor = "var(--due-color)";
            row.setAttribute("data-isdue", "1");
        } else if (stat.box === 6) {
            row.style.backgroundColor = "var(--learned-color)";
        } 
        row.setAttribute("data-character", stat.character);

        row.innerHTML = `
            <td style="text-align: left;" class="character" data-pinyin="${stat.pinyin}" onclick="showFlashcard('${stat.character}')">
                <a>${stat.character}</a>
            </td>
            <td class="varvar" style="text-align: right;">${(stat.box / 6 * 100).toFixed(1)}%</td>
            <td class="varvar" style="text-align: right;">${stat.streak}</td>
            <td class="varvar" style="text-align: right;">${stat.num_incorrect}</td>
            <td style="text-align: right;" class="varvar next-review-date">
                ${stat.is_due ? "DUE" : (stat.next_review ? stat.next_review : "/")}
            </td>
            <td class="remove-card tooltip-header" data-tooltip="Remove from learning" data-character="${stat.character}">
                <i class="fa-solid fa-circle-xmark"></i>
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
            showTooltip(this, pinyin, e);
        });
        let timeout;
        characterCell.addEventListener('mouseenter', function(e) {
            if(cardVisible){
                return;
            }
            activeCharacter = stat.character;
            console.log(activeCharacter)
            timeout = setTimeout(() => {
                loadCard(stat.character);
            }, 200);
        });
        
        characterCell.addEventListener('mouseleave', () => {
            clearTimeout(timeout);
        });
        characterCell.addEventListener('click', function(e) {
            clearTimeout(timeout);
            showFlashcard(stat.character);
        });

        characterCell.addEventListener('mouseout', hideTooltip);

        characterCell.addEventListener('mousemove', function(e) {
            hoverBox.style.left = `${e.pageX + 10}px`;
            hoverBox.style.top = `${e.pageY + 10}px`;
        });
    });

    setTimeout(() => {
        let numcards = Object.keys(wordlists_words[currentWordlist]).length;
        document.getElementById('numcards').textContent = `Cards in deck: ${numcards}`;
    }, 100);
}


function getRowData(chars){
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
            let character = stat.character;
            wordlists_words[currentWordlist].push({character: character, pinyin: pinyin});
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
        option.className = 'dropdown-item';
        option.textContent = listName;
        option.dataset.value = listName;
        dropdownMenu.appendChild(option);
    });
    
    const createOption = document.createElement('div');
    createOption.className = 'dropdown-item create-new-option';
    createOption.innerHTML = '<i class="fa-solid fa-circle-plus"></i>' + " create word list";
    createOption.dataset.value = "create_new";
    dropdownMenu.appendChild(createOption);
}

function addWordTable(symbol, set_name){
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
        getRowData(addedWords);
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
    e.preventDefault();
    let newName = prompt("Enter a new name for the word list");
    if(newName){
        let oldname = currentWordlist;
        renameWordlistInDB(oldname, newName);
        wordlists_words[newName] = wordlists_words[currentWordlist];
        delete wordlists_words[currentWordlist];
        currentWordlist = newName;
        dropdownTrigger.innerHTML = currentWordlist + " <i class='fa-solid fa-circle'></i>";
        populateDropdown();
        addToTable(wordlists_words[currentWordlist]);
        reworkUrls();
        console.log("Renamed word list to " + newName);
    }
}


function removeWordlist(wordlist){
   if(wordlist == currentWordlist){
        
        delete wordlists_words[currentWordlist];
        currentWordlist = Object.keys(wordlists_words)[0];
        dropdownTrigger.innerHTML = currentWordlist + " <i class='fa-solid fa-circle'></i>";
        let tableBody = document.querySelector("table tbody");
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
    addWordTable(words, currentWordlist);
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
let loadedCard = null;

function loadCard(character) {
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
        let chars = character.split('');
        data.plotters = createPlotters(data);
        loadedCard = data;
        renderCard(loadedCard);
        let overlay = document.getElementById('flashcard_overlay');
        // let currentColor = getColorByTime(overlaycolors);
        loadedCard = data;
        messageElement.textContent = "";
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

        hoverBox.textContent = content;
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

document.addEventListener('DOMContentLoaded', function() {
    const tooltipHeaders = document.querySelectorAll('.tooltip-header');
    const dateCells = document.querySelectorAll('.next-review-date');
    const hoverBox = document.getElementById('pinyin-hover-box');

    overlay = document.getElementById('flashcard_overlay');
    flashcardContent = document.getElementById('flashcard_container');
    messageElement = document.getElementById('message');

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            cardVisible = false;
            overlay.style.display = 'none';
        }
    });


    overlay.addEventListener('click', (e) => {
        if (e.target === overlay && !e.target.closest('#font-select')) {
            cardVisible = false;
            overlay.style.display = 'none';
            // bordercanvas.style.display = 'none';
            // document.getElementById('font-select').style.display = 'none';
        }
    });

    
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
            const character = this.getAttribute('data-character');
            showTooltip(this, pinyin, e);

        });

        let timeout;
        character.addEventListener('mouseenter', function(e) {
            if(cardVisible){
                return;
            }
            activeCharacter = stat.character;
            timeout = setTimeout(() => {
                console.log(stat.character + "asfakslnfask");
                loadCard(stat.character);
            }, 200);
        });
        character.addEventListener('click', function(e) {
            clearTimeout(timeout);
            showFlashcard(stat.character);
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

function showFlashcard(character) {
    cardVisible = true;
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
        // bordercanvas.style.display = 'block';
        data.plotters = createPlotters(data);
        loadedCard = data;
        renderCard(data);
        displayCard(true, true);
        // recordView(character);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
