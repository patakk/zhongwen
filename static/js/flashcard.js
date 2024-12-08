
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
                hoverBox.style.display = 'none';
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



function adjustFlashCardChars(){
    try{
        let cc = document.getElementById('flashcard_character');
        if(isMobileOrTablet()){
            if(currentFont === 'Kaiti'){
                cc.style.fontSize = .23*7 + "em";
            }
            else{
                cc.style.fontSize = .23*6 + "em";
            }
        }
        else {
            if(currentFont === 'Kaiti'){
                cc.style.fontSize = .23*11.5 + "em";
            }
            else{
                cc.style.fontSize = .23*9 + "em";
            }
        }
    }
    catch(e){
    }
}


function createPlotters(data){
    const chars = data.character.split('');
    const plotters = [];
    let size = 255;
    if(chars.length == 2){
        size = 222;
    }
    else if(chars.length > 2){
        size = 166;
    }
    chars.forEach((char, index) => {
        const plotter = new HanziPlotter({char, size, animateOnClick: true});
        plotters.push({plotter: plotter, char: char});
    });
    return plotters;
}

function renderPlotters(plotters, pinyinparts=null){
    const plotterElement = document.getElementById('flashcard_plotter');
    plotterElement.innerHTML = '';
    if(plotterElement && plotters){
        // Store plotters as a property of the container element
        plotterElement.plotters = plotters;
        
        plotters.forEach((plotterinfo, index) => {
            let plotter = plotterinfo.plotter;
            let color = getToneColor(pinyinparts[index]);
            plotter.draw(color);
            plotter.canvas.dataset.plotterIndex = index;
            plotterElement.appendChild(plotter.canvas);
        });
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

function renderCardData(data) {
    const container = document.getElementById('flashcard_container');
    if(container.style.display === 'none' || !container.style.display){
        container.style.display = 'flex';
    }

    const characterElement = document.getElementById('flashcard_character');
    if(characterElement)
        characterElement.innerHTML = '';


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
    // let ai_content = data.html;
    // const aiTempDiv = document.createElement('div');
    // aiTempDiv.innerHTML = ai_content;
    // const hanziRegex = /[\u4e00-\u9fa5]/g;
    // function processTextNode(textNode) {
    //     const text = textNode.nodeValue;
    //     if (hanziRegex.test(text)) {
    //         const span = document.createElement('span');
    //         span.innerHTML = text.replace(hanziRegex, (hanziWord) => {
    //             const wordSpan = `<span class="clickable-hanzi-word" style="cursor: pointer;">${hanziWord}</span>`;
    //             return `${wordSpan}`;
    //         });
    //         textNode.parentNode.replaceChild(span, textNode);
    //     }
    // }
    // function processNode(node) {
    //     if (node.nodeType === Node.TEXT_NODE) {
    //         processTextNode(node);
    //     } else {
    //         Array.from(node.childNodes).forEach(processNode);
    //     }
    // }
    // processNode(aiTempDiv);
    // document.getElementById('flashcard_description').innerHTML = aiTempDiv.innerHTML;
    // document.getElementById('flashcard_description').querySelectorAll('.clickable-hanzi-word, .clickable-hanzi-char').forEach(element => {
    //     element.addEventListener('click', function() {
    //         console.log("click");
    //         const word = this.textContent;
            
    //         if (window.location.pathname.includes('/flashcards')) {
    //             window.open(`./grid?query=${word}`, '_blank');
    //         } else {
    //             showFlashcard(word);
    //             scrollToTop(document.getElementById('flashcard_container'), null);
    //             const newUrl = new URL(window.location);
    //             newUrl.searchParams.set('query', word);
    //             history.pushState({}, '', newUrl);
    //         }
    //     });
    // });
    // document.getElementById('flashcard_description').innerHTML = aiTempDiv.innerHTML;
    let ai_content = data.html;

    // Create the container structure
    const descriptionContainer = document.createElement('div');
    descriptionContainer.id = 'descriptionContainer';

    // Create and add the Notes label
    const descriptionLabel = document.createElement('p');
    descriptionLabel.textContent = "LLM description ";
    descriptionLabel.id = 'descriptionLabel';
    descriptionLabel.class = 'notes-label';
    descriptionContainer.appendChild(descriptionLabel);

    // Create and add the AI content in an editable paragraph
    const descriptionParagraph = document.createElement('p');
    descriptionParagraph.innerHTML = ai_content;
    descriptionParagraph.id = 'descriptionParagraph';
    // descriptionParagraph.setAttribute('contenteditable', 'true');
    // descriptionParagraph.style.display = 'none';  // Initially hidden
    descriptionContainer.appendChild(descriptionParagraph);

    // Add click handler to the label

    // Replace the existing content
    document.getElementById('flashcard_description').innerHTML = '';
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
    if(data.other_user_notes.length === 0){
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
        console.log("kaj");
        console.log(rawMarkdown);
        
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


    document.getElementById('flashcard_description').prepend(publicNotesLabel);
    document.getElementById('flashcard_description').prepend(notesLabel);

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
    // notesLabel.classList.add('collapsed');

    descriptionLabel.addEventListener('click', () => {
        descriptionParagraph.style.display = descriptionParagraph.style.display === 'none' ? 'block' : 'none';
        if (descriptionParagraph.style.display === 'none') {
            descriptionLabel.classList.add('collapsed');
        }
        else {
            descriptionLabel.classList.remove('collapsed');
        }
    });

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

    document.getElementById('flashcard_function').textContent = "(" + data.function + ")";
    document.getElementById('flashcard_practice').textContent = data.character.length <= 3 ? "practice" : "";
    
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


