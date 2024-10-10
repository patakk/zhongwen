const overlay = document.getElementById('flashcard-overlay');
const flashcardContent = document.getElementById('flashcard_container');

let currentFont = 'Noto Sans Mono';

function showFlashcard(character) {
    fetch(`./get_card_data?character=${encodeURIComponent(character)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const container = document.getElementById('flashcard_container');
            const characterElement = container.querySelector('.character');
            characterElement.innerHTML = ''; // Clear existing content


            // Split the character string into individual characters
            recordView(data.character);
            const chars = data.character.split('');
            document.getElementById('font-select').style.display = 'block';
            // Create clickable spans for each character
            chars.forEach(char => {
                const span = document.createElement('span');
                span.textContent = char;
                span.className = 'clickable-char';
                span.style.cursor = 'pointer';
                span.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent triggering the change event
                    window.location.href = `./search?query=${encodeURIComponent(char)}`;
                });
                characterElement.appendChild(span);
                console.log(span);
            });

            container.querySelector('.pinyin').textContent = data.pinyin;
            container.querySelector('.pinyin').dataset.characters = data.character;
            container.querySelector('.english').textContent = data.english;
            container.querySelector('.flashcard').innerHTML = data.html;

            if (chars.length < 4) {
                const strokesContainer = document.createElement('div');
                strokesContainer.className = 'strokes-container';
                document.querySelector('.flashcard').appendChild(strokesContainer);

                chars.forEach((char, i) => {
                    const strokeWrapper = document.createElement('div');
                    strokeWrapper.style.position = 'relative';
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
                });
            }

            overlay.style.display = 'flex';
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
        overlay.style.display = 'none';
    }
});


function isTouchDevice() {
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
}

function isiPad() {
    return /Macintosh/i.test(navigator.userAgent) && isTouchDevice();
}

function playHanziAudio() {
    const pinyinElement = document.getElementById('flashcard_pinyin');
    const encodedHanzi = encodeURIComponent(pinyinElement.dataset.characters);
    const audio = new Audio(`./get_audio?chars=${encodedHanzi}`);
    
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
    });
}


function isMobileOrTablet() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check || /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// if(isMobileOrTablet()){
//     document.addEventListener('click', function(event) {
//         if (!event.target.classList.contains('clickable-char')) {
//             change(event);
//         }
//     });
// }

function adjustHeight() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}


document.addEventListener('keydown', function(event) {
    
});


function changeFont(font) {
    fetch(`./change_font?font=${font}`, {
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

function getFont() {
    fetch('./get_font')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            currentFont = data.font;
            console.log('received font', currentFont);
            document.getElementById('font-select').value = currentFont;
            document.querySelector('.character').style.fontFamily = `"${currentFont}", sans-serif`;
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function handleOrientationChange() {
    const container = document.getElementById('flashcard_container');
    if (window.matchMedia("(min-device-width: 768px) and (max-device-width: 1024px)").matches) {
        if (window.orientation === 90 || window.orientation === -90) {
            // Landscape
            container.style.width = '90%';
            container.style.height = '80vh';
            container.style.maxHeight = '80vh';
            container.style.marginBottom = '20px';
        } else {
            // Portrait
            container.style.width = '90%';
            container.style.height = '80%';
            container.style.maxHeight = '';
            container.style.marginBottom = '';
        }
    }
}
document.getElementById('font-select').addEventListener('change', function(event) {
    currentFont = event.target.value;
    document.querySelector('.character').style.fontFamily = `"${currentFont}", sans-serif`;
    changeFont(currentFont);
    this.blur();
    event.stopPropagation(); // Add this line to prevent the event from bubbling up
});

overlay.addEventListener('click', (e) => {
    if (e.target === overlay && !e.target.closest('#font-select')) {
        overlay.style.display = 'none';
        document.getElementById('font-select').style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('font-select').style.display = 'none';
    getFont();

    const pinyinElement = document.getElementById('flashcard_pinyin');
    pinyinElement.addEventListener('click', function() {
        playHanziAudio();
    });
});


window.addEventListener('resize', adjustHeight);
window.addEventListener('orientationchange', adjustHeight);
adjustHeight();