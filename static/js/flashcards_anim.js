let flashcardElement = document.getElementById('flashcard');
let revealed = false;
let currentWordInfo = {};
let nextWordInfo = {};
let prevWordInfo = {};

let lineWidth = 6;
let lineType = 'round';

async function getPinyinEnglishFor(word) {

    let promises = [];
    promises.push(
        fetch(`./get_simple_char_data?character=${encodeURIComponent(word)}`)
        .then(response => response.json())
        .then(data => {
            return data;
        })
    );
    let spromises = loadStrokesAll(word, function() {});
    promises = promises.concat(spromises);
    return await Promise.all(promises);
}

function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let numchars = currentWordInfo.strokes.length;
    let charwidth = canvas.height;
    let charheight = canvas.height;
    currentWordInfo.strokes.forEach(function(charstrokes, idx) {
        let cx = canvas.width / 2 - (numchars * charwidth) / 2 + idx * charwidth;
        let cy = canvas.height / 2 - charheight / 2;
        charstrokes.strokes.forEach(function(stroke) {
            let x0 = cx + stroke[0].x * charwidth;
            let y0 = cy + stroke[0].y * charheight;
            ctx.moveTo(x0, y0);
            ctx.beginPath();
            for (let i = 1; i < stroke.length; i++) {
                let x = cx + stroke[i].x * charwidth;
                let y = cy + stroke[i].y * charheight;
                ctx.lineTo(x, y);
            }
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = isDarkMode ? 'white' : 'black';
            ctx.lineCap = lineType;
            ctx.lineJoin = lineType;
            ctx.stroke();
        });
    });
}

function redrawCurrentCard() {
    let hanziContainer = flashcardElement.querySelector('.hanzi');
    let answerContainer = flashcardElement.querySelector('.answer');
    // hanziContainer.textContent = currentWordInfo.character;

    drawCanvas();

    let pinyinContainer = flashcardElement.querySelector('.pinyin');
    pinyinContainer.textContent = currentWordInfo.pinyin;
    let englishContainer = flashcardElement.querySelector('.english');
    englishContainer.textContent = currentWordInfo.english;
    answerContainer.classList.toggle('inactive', !revealed);
    handleFont();
}


function power(p, g) {
    if (p < 0.5)
        return 0.5 * Math.pow(2 * p, g);
    else
        return 1 - 0.5 * Math.pow(2 * (1 - p), g);
}

function interpolateCards() {
    let hanziContainer = flashcardElement.querySelector('.hanzi');
    let answerContainer = flashcardElement.querySelector('.answer');
    // hanziContainer.textContent = currentWordInfo.character;

    let pinyinContainer = flashcardElement.querySelector('.pinyin');
    pinyinContainer.textContent = currentWordInfo.pinyin;
    let englishContainer = flashcardElement.querySelector('.english');
    englishContainer.textContent = currentWordInfo.english;
    answerContainer.classList.toggle('inactive', !revealed);
    handleFont();

    let progress = 0;
    function animation(){
        progress += 0.035;
        if(progress >= 1){
            progress = 1;
        }

        let usedprogress = power(progress, 2.5)*1.3;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let numchars1 = prevWordInfo.strokes.length;
        let numchars2 = currentWordInfo.strokes.length;
        let charwidth = canvas.height;
        let charheight = canvas.height;

        let numchars = Math.max(numchars1, numchars2);

        for(let idx = 0; idx < numchars; idx++){
            let cx1 = canvas.width / 2 - (numchars1 * charwidth) / 2 + Math.min(idx, numchars1-1) * charwidth;
            let cy1 = canvas.height / 2 - charheight / 2;
            let cx2 = canvas.width / 2 - (numchars2 * charwidth) / 2 + Math.min(idx, numchars2-1) * charwidth;
            let cy2 = canvas.height / 2 - charheight / 2;

            let charstrokes1 = prevWordInfo.strokes[Math.min(idx, numchars1-1)].strokes;
            let charstrokes2 = currentWordInfo.strokes[Math.min(idx, numchars2-1)].strokes;
            let numcharstrokes = Math.max(charstrokes1.length, charstrokes2.length);
            for(let charstrokeidx = 0; charstrokeidx < numcharstrokes; charstrokeidx++){
                let stroke1 = charstrokes1[charstrokeidx%charstrokes1.length];
                let stroke2 = charstrokes2[charstrokeidx%charstrokes2.length];
                stroke1 = resamplePolyline(stroke1, stroke2.length);
                let x0 = cx1 + stroke1[0].x * charwidth + (cx2+stroke2[0].x * charwidth - stroke1[0].x * charwidth-cx1) * usedprogress;
                let y0 = cy1 + stroke1[0].y * charheight + (cy2+stroke2[0].y * charheight - stroke1[0].y * charheight-cy1) * usedprogress;
                ctx.moveTo(x0, y0);
                ctx.beginPath();
                for (let i = 1; i < stroke1.length; i++) {
                    let popo = power(i/stroke1.length, 2.5)*0.3;
                    let x = cx1 + stroke1[i].x * charwidth + (cx2+stroke2[i].x * charwidth - stroke1[i].x * charwidth-cx1) * Math.min(1, Math.max(0, usedprogress - popo));
                    let y = cy1 + stroke1[i].y * charheight + (cy2+stroke2[i].y * charheight - stroke1[i].y * charheight-cy1) * Math.min(1, Math.max(0, usedprogress - popo));
                    ctx.lineTo(x, y);
                }

                let saw = (1-2*Math.abs(.5-progress));
                lineWidth = flashcardElement.offsetWidth*.035 * (.7+.6*saw*saw*saw);;

                let lightness = isDarkMode ? 1 : 0;

                if(isDarkMode)
                    lightness = lightness - .2*(saw);
                else
                    lightness = lightness + .15*(saw);

                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = `rgba(${lightness*255},${lightness*255},${lightness*255},${1})`;
                ctx.lineCap = 'mitter';
                ctx.lineJoin = 'mitter';
                ctx.stroke();
            }
        }

        if(progress < 1){
            requestAnimationFrame(animation);
        }
    }
    animation();
}

function handleFont() {
    let hanziElement = flashcardElement.querySelector('.hanzi');
    if (hanziElement.style.fontFamily !== currentFont) {
        hanziElement.style.fontFamily = `"${currentFont}"`;
        hanziElement.style.fontSize = currentFont.includes('Kai') ? '5em' : '6em';
    }
}

function revealOrNew() {
    if (revealed) {
        getNewWord();
        revealed = false;
    } else {
        revealed = true;
        redrawCurrentCard();
    }
}

let currentWord = '';
let nextWord = '';

function cloneWordInfo(wordInfo) {
    return {
        character: wordInfo.character,
        pinyin: wordInfo.pinyin,
        english: wordInfo.english,
        strokes: wordInfo.strokes
    };
}

function getNewWord() {
    let chars = inputdecks[inputdeck].chars;

    if(currentWord === ''){
        currentWord = chars[Math.floor(Math.random() * chars.length)];
        
        getPinyinEnglishFor(currentWord).then(function(data) {
            currentWordInfo.character = currentWord;
            currentWordInfo.pinyin = data[0].pinyin;
            currentWordInfo.english = data[0].english;
            currentWordInfo.strokes = data[1];
            redrawCurrentCard();
        });
    }
    else{
        currentWord = nextWord;
        prevWordInfo = cloneWordInfo(currentWordInfo);
        currentWordInfo = cloneWordInfo(nextWordInfo);
        revealed = false;
        // redrawCurrentCard();
        interpolateCards();
    }
    nextWord = chars[Math.floor(Math.random() * chars.length)];
    while(nextWord === currentWord && chars.length > 1) {
        nextWord = chars[Math.floor(Math.random() * chars.length)];
    }

    getPinyinEnglishFor(nextWord).then(function(data) {
        nextWordInfo.character = nextWord;
        nextWordInfo.pinyin = data[0].pinyin;
        nextWordInfo.english = data[0].english;
        nextWordInfo.strokes = data[1];
    });
}


async function loadStrokesAll(word, onLoad=null) {
    let promises = [];
    for (let character of word) {
        promises.push(loadStrokeData(character, onLoad));
    }
    return await Promise.all(promises);
}


function calculatePolylineLength(line) {
    let totalLength = 0;
    let segmentLengths = [];
    for (let i = 0; i < line.length - 1; i++) {
        let p1 = line[i];
        let p2 = line[i + 1];
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        totalLength += distance;
        segmentLengths.push(distance);
    }
    return { totalLength, segmentLengths };
}


function getPointAtPercentage(line, percentage) {
    let polylen = calculatePolylineLength(line);
    let totalLength = polylen.totalLength;
    let segmentLengths = polylen.segmentLengths;

    let targetLength = totalLength * percentage;
    let accumulatedLength = 0;
    for (let i = 0; i < segmentLengths.length; i++) {
        accumulatedLength += segmentLengths[i];
        if (accumulatedLength >= targetLength) {
            let p1 = line[i];
            let p2 = line[i + 1];
            let remainingLength = targetLength - (accumulatedLength - segmentLengths[i]);
            let t = remainingLength / segmentLengths[i];
            return {
                x: p1.x + t * (p2.x - p1.x),
                y: p1.y + t * (p2.y - p1.y)
            };
        }
    }
    return line[line.length - 1];
}


function resamplePolyline(line, numPoints) {
    let resampledLine = [];
    for (let i = 0; i < numPoints; i++) {
        let percentage = i / (numPoints - 1);
        let point = getPointAtPercentage(line, percentage);
        resampledLine.push(point);
    }
    return resampledLine;
}

function evenOutPoints(line, maxLength = 100) {
    let newLine = [];
    for (let i = 0; i < line.length - 1; i++) {
        let p1 = line[i];
        let p2 = line[i + 1];
        newLine.push(p1);
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > maxLength) {
            let segments = Math.ceil(distance / maxLength);
            for (let j = 1; j < segments; j++) {
                let t = j / segments;
                newLine.push({
                    x: p1.x + dx * t,
                    y: p1.y + dy * t
                });
            }
        }
    }
    newLine.push(line[line.length - 1]);
    let needsMoreDivision = newLine.some((p, i) =>
        i < newLine.length - 1 &&
        Math.hypot(newLine[i + 1].x - p.x, newLine[i + 1].y - p.y) > maxLength
    );
    return needsMoreDivision ? this.evenOutPoints(newLine, maxLength) : newLine;
}

function removeShortSegments(line, minLength = 5) {
    if (line.length < 3) return line; // Keep lines with 2 or fewer points unchanged

    let newLine = [line[0]]; // Always keep the first point

    for (let i = 1; i < line.length - 1; i++) {
        let p1 = newLine[newLine.length - 1];
        let p2 = line[i];
        let p3 = line[i + 1];

        let d1 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        let d2 = Math.hypot(p3.x - p2.x, p3.y - p2.y);

        // Keep the point if either adjacent segment is long enough
        if (d1 >= minLength || d2 >= minLength) {
            newLine.push(p2);
        }
    }

    newLine.push(line[line.length - 1]); // Always keep the last point

    return newLine;
}
function fix(strokes) {
    let nstrokes = strokes.map(stroke => {
        stroke = removeShortSegments(stroke, 30);
        stroke = subdivideCurve(stroke, 4);
        stroke = smoothCurve(stroke, 0.5); 
        stroke.map(point => {
            point.x = point.x/1000;
            point.y = point.y/1000;
        });
        return stroke;
    });
    return nstrokes;
}

function processStrokes(strokes) {
    strokes.map(stroke => {
        stroke.map(point => {
            point.x = point[0];
            point.y = 1000-point[1];
        });
    });

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    strokes.forEach(stroke => {
        stroke.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });
    });
    const offsetX = (1000 - (maxX - minX)) / 2 - minX;
    const offsetY = (1000 - (maxY - minY)) / 2 - minY;
    strokes = strokes.map(stroke => stroke.map(point => ({
        x: (point.x + offsetX),
        y: (point.y + offsetY)
    })));

    let fstrokes = fix(strokes);
    return fstrokes;
}

async function loadStrokeData(character, onLoad=null) {
    try {
        const response = await fetch(`/static/strokes_data/${character}.json`);
        if (!response.ok) {
            console.log('Network response was not ok for character:', character);  
            return;
        }
        const data = await response.json();
        if(onLoad){
            onLoad();
        }
        return {
            strokes: processStrokes(data.medians),
            character: character,
        }
    } catch (error) {
        console.error('Error loading character data:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    currentFont = 'Noto Sans';

    let url = new URL(window.location.href);
    let deck = url.searchParams.get('deck');
    if(deck && inputdecks[deck]){
        inputdeck = deck;
    }
    else{
        inputdeck = 'hsk1';
        let newUrl = new URL(window.location);
        newUrl.searchParams.set('deck', inputdeck);
        history.pushState({}, '', newUrl);
    }

    confirmDarkmode();
    getNewWord();
    handleFont();
    handleTopLeftButtons();
});

let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');


function setupCanvas(){
    canvas.width = flashcardElement.offsetWidth*2;
    canvas.height = flashcardElement.offsetWidth*.25*2;
    canvas.style.width = flashcardElement.offsetWidth + 'px';
    canvas.style.height = flashcardElement.offsetWidth*.25 + 'px';
    canvas.style.position = 'absolute';
    canvas.style.top = flashcardElement.offsetWidth*.05 + 'px';
    canvas.style.left = '0';

    progress = 0;
    let saw = (1-2*Math.abs(.5-progress));
    lineWidth = flashcardElement.offsetWidth*.035 * (.7+.6*saw*saw*saw);;
    if(isMobileOrTablet()){
        // canvas.width = flashcardElement.offsetWidth*2;
        // canvas.height = flashcardElement.offsetWidth*.25*2;
        // canvas.style.width = flashcardElement.offsetWidth + 'px';
        // canvas.style.height = flashcardElement.offsetWidth*.25 + 'px';
        // canvas.style.position = 'absolute';
        // canvas.style.top = '0';
        // canvas.style.left = '0';
    }

    let hanziContainer = flashcardElement.querySelector('.hanzi');
    hanziContainer.appendChild(canvas);
}

function handleTopLeftButtons() {

    setupCanvas();

    document.getElementById('deckMenu').addEventListener('click', function(event) {
        if(!event.target.closest('#deckSubmenu')){
            document.getElementById('deckSubmenu').classList.add('active')
        }
    });
    
    document.getElementById('fontMenu').addEventListener('click', function(event) {
        if(!event.target.closest('#fontSubmenu')){
            document.getElementById('fontSubmenu').classList.add('active')
        }
    });
    
    document.addEventListener('click', function(event) {
        if (!event.target.closest('#deckMenu')) {
            document.getElementById('deckSubmenu').classList.remove('active');
        }
        if (!event.target.closest('#fontMenu')) {
            document.getElementById('fontSubmenu').classList.remove('active');
        }
    });

    
    document.querySelectorAll('.deck-change').forEach(function(deckOption) {
        deckOption.addEventListener('click', function(e) {
            document.getElementById('fontSubmenu').classList.remove('active');
            document.getElementById('deckSubmenu').classList.remove('active');
            e.preventDefault();
            e.stopPropagation();
            inputdeck = this.dataset.deck;
            let newUrl = new URL(window.location);
            newUrl.searchParams.set('deck', inputdeck);
            history.pushState({}, '', newUrl);
            currentWord = '';
            getNewWord();
            document.querySelectorAll('.deck-change').forEach(opt => opt.classList.remove('selected-option'));
            this.classList.add('selected-option');
        });
    });
   
    document.querySelectorAll('.font-change').forEach(function(fontOption) {
        fontOption.addEventListener('click', function(e) {
            document.getElementById('fontSubmenu').classList.remove('active');
            document.getElementById('deckSubmenu').classList.remove('active');
            e.preventDefault();
            e.stopPropagation();
            currentFont = this.dataset.font;
            document.querySelectorAll('.font-change').forEach(opt => opt.classList.remove('selected-option'));
            this.classList.add('selected-option');
            redrawCurrentCard();
        });
    });

    let flashcard_container = document.getElementById('flashcard_container');
    flashcard_container.addEventListener('click', function(event) {
        revealOrNew();
    });

    document.addEventListener('keydown', function(event) {
        revealOrNew();
    });

    window.addEventListener('resize', function() {
        setupCanvas();
        redrawCurrentCard();
    });
}





function isMobileOrTablet() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check || /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
