
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
        span.className = 'clickable-char';

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

    if( data.hsk_level == -1){
        document.getElementById('flashcard_hsk').textContent = "N/A";
    }
    else{
        // check if integer or list
        if(data.hsk_level.constructor === Array){
            data.hsk_level.forEach((level) => {
                document.getElementById('flashcard_hsk').textContent += `HSK ${level} `;
            });
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
    container.scrollTop = 0;
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
        console.log(e);
    }
}

function displayCard(showAnswer=true, showPinyin=true) {
    const flashcardElement = document.getElementById('flashcard_description');
    const englishElement = document.getElementById('flashcard_english');
    const pinyinElement = document.getElementById('flashcard_pinyin');
    const functionElement = document.getElementById('flashcard_function');
    pinyinElement.classList.toggle('visible', showPinyin || showAnswer);
    flashcardElement.style.visibility = showAnswer ? 'visible' : 'hidden';
    englishElement.style.visibility = showAnswer ? 'visible' : 'hidden';
    functionElement.style.visibility = showAnswer ? 'visible' : 'hidden';
}


