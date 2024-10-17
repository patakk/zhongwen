
function getCharactersPinyinEnglish(characters=null, func=null) {
    const url = '/get_characters_pinyinenglish';
    
    // Convert Set to Array if it's a Set
    const charactersArray = characters instanceof Set ? Array.from(characters) : characters;
    
    const payload = { characters: charactersArray };
    
    console.log("Sending payload:", payload);  // Debug log

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
            console.log("Received data:", data);
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
    getCharactersPinyinEnglish(allWords, (data)=>{
        // Create a box for each unique word
        let chardict = {};
        for(const char of data.characters){
            chardict[char.character] = char;
        }
        allWords.forEach(word => {
            const wordLink = document.createElement('a');
            // wordLink.href = `./grid?query=${encodeURIComponent(word)}`;
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
            };

            
            wordLink.addEventListener('mouseover', function(e) {
                const pinyin = chardict[word].pinyin;
                const english = chardict[word].english;
                const hsklvl = chardict[word].hsk_level;
                const tooltipContent = `<strong>${pinyin}</strong><br>${english}<br><span style="font-size: 12px; font-style: italic;"> HSK ${hsklvl}</span>`;
                showTooltip(this, tooltipContent, e);
            });
            wordLink.addEventListener('mouseout', hideTooltip);
            wordLink.addEventListener('mousemove', function(e) {
                hoverBox.style.left = `${e.pageX + 10}px`;
                hoverBox.style.top = `${e.pageY + 10}px`;
            });


            wordLink.textContent = word;
            wordLink.className = 'word-link';
            wordsContainer.appendChild(wordLink);
            
        });
    });
    container.appendChild(wordsContainer);
}



function renderCardData(data) {
    const container = document.getElementById('flashcard_container');
    const characterElement = document.getElementById('flashcard_character');
    characterElement.innerHTML = ''; // Clear existing content

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
    chars.forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.dataset.char = char;
        span.className = 'e-char';

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
        span.style.transition = 'text-shadow 0.05s';
        span.style.textShadow = 'none'; 
        characterElement.appendChild(span);
    });

    document.getElementById('flashcard_pinyin').textContent = data.pinyin;
    document.getElementById('flashcard_pinyin').dataset.characters = data.character;
    document.getElementById('flashcard_english').textContent = data.english;
    document.getElementById('flashcard_description').innerHTML = data.html;
    document.getElementById('flashcard_function').textContent = "(" + data.function + ")";
    displayCharMatches(data.char_matches);

    if( data.hsk_level == -1){
        document.getElementById('flashcard_hsk').textContent = "";
    }
    else{
        // check if integer or list
        if(data.hsk_level.constructor === Array){
            // find maximum level
            let max_level = 0;
            for(let i = 0; i < data.hsk_level.length; i++){
                if(data.hsk_level[i] > max_level){
                    max_level = data.hsk_level[i];
                }
            }
            if(max_level > 0){
                document.getElementById('flashcard_hsk').textContent = `HSK ${max_level}`;
            }
            else{
                document.getElementById('flashcard_hsk').textContent = "";
            }
        }
        else{
            console.log(Number.isInteger(data.hsk_level), data.hsk_level);
            if(Number.isInteger(data.hsk_level)){
                document.getElementById('flashcard_hsk').textContent = `HSK ${data.hsk_level}`;
            }
        }
    }


    if (chars.length < 4) {
        const strokesContainer = document.createElement('div');
        strokesContainer.id = 'flashcard_strokes_container';
        document.getElementById('flashcard_description').appendChild(strokesContainer);
        
        let writers = [];
        chars.forEach((char, i) => {
            const strokeWrapper = document.createElement('div');
            strokeWrapper.style.position = 'relative';
            strokeWrapper.id = 'flashcard_stroke_wrapper';
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


