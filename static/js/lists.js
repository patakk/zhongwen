const overlay = document.getElementById('flashcard-overlay');
const flashcardContent = document.getElementById('flashcard_container');
let currentIndex = 0;
let currentState = 'hanzi';
let currentHanzi, currentPinyin, currentEnglish, currentTitle;

let prefetchTimer = null;
let currentFetch = null;

function prefetchStoryData(title) {
    if (currentFetch) {
        return currentFetch;
    }

    const origin = window.location.origin;
    const pathParts = window.location.pathname.split('/');
    let basePath = '';
    if (pathParts.includes('zhongwen')) {
        basePath = '/zhongwen';
    }
    const url = `${origin}${basePath}/get_lists_data/${title}`;

    console.log('Fetching:', url);
    currentFetch = fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('List not found');
            }
            console.log('response:', response);
            return response.json();
        })
        .catch(error => {
            console.error('Error:', error);
        })
        .finally(() => {
            console.log('Fetch complete');
            // currentFetch = null;
        });

    return currentFetch;
}

function isTouchDevice() {
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
}


function isMobileOrTablet() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check || /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}


function splitText(text, separator) {
    return text.split(separator).map(sentence => sentence.trim()).filter(Boolean);
}

function showFlashcard(hanzi, pinyin, english) {
    // Clear the hover box
    const hoverBox = document.getElementById('hover-box');
    hoverBox.style.display = 'none';
    hoverBox.querySelector('.pinyin').textContent = '';
    hoverBox.querySelector('.english').textContent = '';

    // Reset scroll position
    const flashcardContainer = document.getElementById('flashcard_container');
    flashcardContainer.scrollTop = 0;

    let titleHtml = `
        <div class="title-wrapper">
            <h2 class="title">${hanzi[0]}</h2>
        </div>
    `;
    document.querySelector('.title').outerHTML = titleHtml;
    document.querySelector('.title').style.fontFamily = `"${currentFont}", sans-serif`;

    currentHanzi = hanzi;
    currentPinyin = pinyin;
    currentEnglish = english;
    currentTitle = hanzi[0];
    currentState = 'hanzi';

    overlay.style.display = 'flex';
    updateFlashcardContent();
    setupHoverEffects();
}

function updateFlashcardContent() {
    document.querySelector('.title').textContent = currentTitle;
    
    let content = currentHanzi.slice(1).map((sentence, index) => 
        `<div class="hanzi-row-container" data-index="${index + 1}">
            <span class="row-number">${index + 1}.</span>
            <span class="hanzi-row">${sentence}</span>
        </div>`
    ).join('');
    
    document.querySelector('.character').innerHTML = content;

    setupHoverEffects();
}

function setupHoverEffects() {
    const hoverBox = document.getElementById('hover-box');
    const flashcardContainer = document.getElementById('flashcard_container');
    const allRows = document.querySelectorAll('.hanzi-row-container, .title-container');

    let activeRow = null;
    let touchStartY;
    let isTouchMove = false;

    function showHoverBox(element) {
        let pinyin, english;
        if (element.classList.contains('title-container')) {
            pinyin = currentPinyin[0];
            english = currentEnglish[0];
        } else {
            const index = parseInt(element.dataset.index);
            pinyin = currentPinyin[index];
            english = currentEnglish[index];
        }

        hoverBox.querySelector('.pinyin').textContent = pinyin;
        hoverBox.querySelector('.english').textContent = english;
        
        const rect = flashcardContainer.getBoundingClientRect();
        hoverBox.style.width = `${rect.width}px`;
        hoverBox.style.left = `${rect.left}px`;
        hoverBox.style.top = `${rect.bottom + window.scrollY}px`;
        hoverBox.style.display = 'block';

        if (activeRow) {
            activeRow.classList.remove('highlighted');
        }
        element.classList.add('highlighted');
        activeRow = element;
    }

    function hideHoverBox() {
        hoverBox.style.display = 'none';
        if (activeRow) {
            activeRow.classList.remove('highlighted');
            activeRow = null;
        }
    }

    if (isMobileOrTablet()) {
        flashcardContainer.addEventListener('touchstart', function(e) {
            touchStartY = e.touches[0].clientY;
            isTouchMove = false;
        }, { passive: true });

        flashcardContainer.addEventListener('touchmove', function(e) {
            if (Math.abs(e.touches[0].clientY - touchStartY) > 10) {
                isTouchMove = true;
                hideHoverBox();
            }
        }, { passive: true });

        flashcardContainer.addEventListener('touchend', function(e) {
            if (!isTouchMove) {
                const row = e.target.closest('.hanzi-row-container, .title-container');
                if (row) {
                    if (activeRow === row) {
                        hideHoverBox();
                    } else {
                        showHoverBox(row);
                    }
                } else {
                    hideHoverBox();
                }
            }
            isTouchMove = false;
        }, { passive: true });
    } else {
        allRows.forEach((row) => {
            row.addEventListener('mouseover', function() {
                showHoverBox(this);
            });
            row.addEventListener('mouseout', hideHoverBox);
        });
    }
}


function cycleContent() {
    if (currentState === 'hanzi') {
        currentState = 'pinyin';
    } else if (currentState === 'pinyin') {
        currentState = 'english';
    } else {
        currentState = 'hanzi';
    }
    updateFlashcardContent();
}

function handleMouseDown(e) {
    e.preventDefault();
    if (e.button === 0) { // Left click
        currentState = 'pinyin';
    } else if (e.button === 2) { // Right click
        currentState = 'english';
    }
    updateFlashcardContent();
}

function handleMouseUp() {
    currentState = 'hanzi';
    updateFlashcardContent();
}


function changeFont(font) {
    
    const origin = window.location.origin;
    const pathParts = window.location.pathname.split('/');
    let basePath = '';
    if (pathParts.includes('zhongwen')) {
        basePath = '/zhongwen';
    }
    const url = `${origin}${basePath}/change_font?font=${font}`;

    fetch(url, {
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
    const origin = window.location.origin;
    const pathParts = window.location.pathname.split('/');
    let basePath = '';
    if (pathParts.includes('zhongwen')) {
        basePath = '/zhongwen';
    }
    const url = `${origin}${basePath}/get_font`;

    fetch(url, {
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
            document.getElementById('font-select').value = currentFont;
            document.querySelector('.character').style.fontFamily = `"${currentFont}", sans-serif`;
            document.querySelector('.title').style.fontFamily = `"${currentFont}", sans-serif`;
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

// document.getElementById('font-select').addEventListener('change', function(event) {
//     const selectedFont = event.target.value;
//     document.querySelector('.character').style.fontFamily = `"${selectedFont}", sans-serif`;
//     document.querySelector('.title').style.fontFamily = `"${selectedFont}", sans-serif`;
//     currentFont = event.target.value;
//     changeFont(currentFont);
//     this.blur();
//     event.stopPropagation(); // Add this line to prevent the event from bubbling up
// });

overlay.addEventListener('click', (e) => {
    if (e.target === overlay && !e.target.closest('#font-select')) {
        closeStory();
    }
});


function displayStoryData(data, title) {
    console.log("Story data received:", data);
    currentStory = data;  // Store the story data
    showFlashcard(data.hanzi, data.pinyin, data.english);
    
    // Update the URL without reloading the page
    const newUrl = `${window.location.pathname}?uri=${encodeURIComponent(title)}`;
    history.pushState(null, '', newUrl);
}


function closeStory() {
    overlay.style.display = 'none';
    currentFetch = null;
    document.getElementById('font-select').style.display = 'none';
    if (isMobileOrTablet()) {
        flashcardContent.removeEventListener('click', cycleContent);
    } else {
        flashcardContent.removeEventListener('mousedown', handleMouseDown);
        flashcardContent.removeEventListener('mouseup', handleMouseUp);
    }
    
    // Clear the hover box
    const hoverBox = document.getElementById('hover-box');
    hoverBox.style.display = 'none';
    hoverBox.querySelector('.pinyin').textContent = '';
    hoverBox.querySelector('.english').textContent = '';
    
    // Reset scroll position
    const flashcardContainer = document.getElementById('flashcard_container');
    flashcardContainer.scrollTop = 0;
    
    // Update the URL to remove the story URI
    const newUrl = window.location.pathname;
    history.pushState(null, '', newUrl);
}




if(isMobileOrTablet()){
    document.getElementById('flashcard_container').addEventListener('click', function(event) {
        if (event.target.closest('.character')) {
            return;
        }if (event.target.classList.contains('clickable-char')) {
            return;
        }
        if (event.target.closest('#font-select')) {
            return;
        }
    });

    // Add this event listener to prevent clicks on characters from propagating
    document.querySelector('.character').addEventListener('click', function(event) {
        event.stopPropagation();
    });
}

let currentStory;


function loadStory(title) {
    if (currentFetch) {
        currentFetch.then(data => {
            if (data) {
                displayStoryData(data, title);
            }
        });
    } else {
        console.log('????')
        prefetchStoryData(title).then(data => {
            if (data) {
                displayStoryData(data, title);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.listlist').forEach(item => {
        const title = item.getAttribute('uri-index');
        
        item.addEventListener('mouseenter', function() {
            prefetchTimer = setTimeout(() => {
                prefetchStoryData(title);
            }, 333);
        });

        item.addEventListener('mouseleave', function() {
            currentFetch = null;
            if (prefetchTimer) {
                clearTimeout(prefetchTimer);
            }
        });

        // Modify the onclick attribute to use the new loadStory function
        item.setAttribute('onclick', `loadStory('${title}')`);
    });


    document.getElementById('font-select').style.display = 'none';
    getFont();
    setupHoverEffects();
});
window.addEventListener('resize', setupHoverEffects);
// Highlight the first item by default
// highlightListItem(0);


window.onpopstate = function(event) {
    const pathParts = window.location.pathname.split('/');
    const storyUri = pathParts[pathParts.length - 1];
    if (storyUri && storyUri !== 'lists') {
        loadStory(storyUri);
    } else {
        closeStory();
    }
};