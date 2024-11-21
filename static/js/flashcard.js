
let currentWriters = [];
function getCharactersPinyinEnglish(characters=null, func=null) {
    const url = './get_characters_pinyinenglish';
    
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
                let tooltipContent = `<strong>${pinyin}</strong><br>${english}<br><span style="font-size: 12px; font-style: italic;"> HSK ${hsklvl}</span>`;

                if(isDarkMode){
                    tooltipContent = `<span><strong>${pinyin}</strong><br>${english}</span><br><span style="font-size: 12px; font-style: italic; color: #ffd91c;"> HSK ${hsklvl}</span>`;
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

function renderCardData(data) {
    const container = document.getElementById('flashcard_container');
    if(container.style.display === 'none' || !container.style.display){
        container.style.display = 'flex';
    }

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
        span.className = 'clickable-char';

        let pinyin_part = pinyin_split_list[index];

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
    document.getElementById('flashcard_english').innerHTML = data.english;
    document.getElementById('flashcard_description').innerHTML = data.html;
    document.getElementById('flashcard_function').textContent = "(" + data.function + ")";
    document.getElementById('flashcard_practice').textContent = data.character.length <= 3 ? "practice" : "";
    // change the url it's leading to
    document.getElementById('flashcard_practice').href = `./hanzipractice?character=${encodeURIComponent(data.character)}`;
    displayCharMatches(data.char_matches);

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
            if(Number.isInteger(data.hsk_level)){
                document.getElementById('flashcard_hsk').textContent = `HSK ${data.hsk_level}`;
            }
        }
    }


    if (chars.length < 4) {
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
                radicalColor: radicalColor
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


