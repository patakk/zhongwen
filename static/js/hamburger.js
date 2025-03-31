


function changeDeck(deck, func=null) {
    fetch(`/api/change_deck?deck=${deck}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        console.log('Deck changed successfully to ', deck);
        if (func) {
            func();
        }
    })
    .catch(error => {
        console.error('There was a problem changing the deck:', error);
    });
}


function changeFont(font) {
    try {
        if(font === 'Noto Serif SC'){
            console.log('changing font to', `"${font}", serif`);
            document.getElementById('flashcard_character').style.fontFamily = `"${font}"`;
        } else{
            document.getElementById('flashcard_character').style.fontFamily = `"${font}", sans-serif`;
        }
    }
    catch (e) {
        console.log(e);
    }

    fetch(`/api/change_font?font=${font}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

    })
    .catch(error => {
        console.error('There was a problem changing the font:', error);
    });
}


function toAccentedPinyin(input) {
    input = input.replace(/u:/g, 'ü');
    const toneMap = {
        '1': 'āēīōūǖ',
        '2': 'áéíóúǘ',
        '3': 'ǎěǐǒǔǚ',
        '4': 'àèìòùǜ',
        '5': 'aeiouü'
    };
    
    function applyToneMark(syllable, tone) {
        if (!tone) return syllable;
        
        const vowels = ['a', 'e', 'i', 'o', 'u', 'ü'];
        let syllableLower = syllable.toLowerCase();
        
        if (syllableLower.includes('a')) {
            let index = syllableLower.indexOf('a');
            let result = syllable.split('');
            result[index] = toneMap[tone][0];
            return result.join('');
        }
        
        if (syllableLower.includes('e')) {
            let index = syllableLower.indexOf('e');
            let result = syllable.split('');
            result[index] = toneMap[tone][1];
            return result.join('');
        }
        
        if (syllableLower.includes('ou')) {
            let index = syllableLower.indexOf('o');
            let result = syllable.split('');
            result[index] = toneMap[tone][3];
            return result.join('');
        }
        
        for (let i = syllableLower.length - 1; i >= 0; i--) {
            let char = syllableLower[i];
            let vowelIndex = vowels.indexOf(char);
            if (vowelIndex !== -1) {
                let result = syllable.split('');
                result[i] = toneMap[tone][vowelIndex];
                return result.join('');
            }
        }
        
        return syllable;
    }

    let result = input.replace(/\[([a-zü]+)([1-5])?\]/gi, (match, syllable, tone) => {
        return '[' + applyToneMark(syllable, tone) + ']';
    });

    result = result.replace(/\b([a-zü]+)([1-5])?\b/gi, (match, syllable, tone) => {
        return applyToneMark(syllable, tone);
    });
    
    return result;
}

function getDeck(func=null) {
    fetch('/api/get_deck')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            currentDeck = data.deck;
            // document.getElementById('deck-select').value = currentDeck;
            if (func) {
                func();
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}


function getFont() {
    fetch('/api/get_font')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            currentFont = data.font;
            console.log('received font', currentFont);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function getDeck_c() {
    fetch('/api/get_deck')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            currentDeck = data.deck;
            // document.getElementById('deck-select').value = currentDeck;
            // For deck changes
            document.querySelectorAll('.deck-option-parent').forEach(function(element) {
                element.addEventListener('click', function(e) {
                    // Get the deck-option element, whether it was clicked directly or via parent
                    const deckOption = element.classList.contains('deck-option') 
                        ? element 
                        : element.querySelector('.deck-option');
            
                    if (deckOption) {
                        currentDeck = deckOption.getAttribute('data-deck');
            
                        // Change deck
                        changeDeck(currentDeck);
            
                        let submenu = document.getElementById('deckSubmenu');
                        submenu.classList.remove('active');
                        // Update highlighting
                        document.querySelectorAll('.deck-option').forEach(opt => opt.classList.remove('selected-option'));
                        deckOption.classList.add('selected-option');
                        console.log('Deck changed to', currentDeck);
                        
                        const newUrl = new URL(window.location);
                        newUrl.searchParams.set('wordlist', currentDeck);
                        history.pushState({}, '', newUrl);

                        // classList.remove('active');
            
                        // Close dropdown
                        // document.getElementById('dropdownMenu').style.display = 'none';
                    }
                });
            });

            function initializeHighlighting() {
                const currentFontOption = document.querySelector(`.font-change[data-font="${currentFont}"]`);
                if (currentFontOption) currentFontOption.classList.add('selected-option');

                // const currentDeckOption = document.querySelector(`.deck-option[data-deck="${currentDeck}"]`);
                // if (currentDeckOption) currentDeckOption.classList.add('selected-option');
            }

            initializeHighlighting();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function getFont_c() {
    fetch('/api/get_font')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            currentFont = data.font;
            currentDeck = getDeck_c();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

document.addEventListener('DOMContentLoaded', hamburgerInit);
hamburgerInit();

function hamburgerInit() {
    var hamburger = document.getElementById('hamburgerMenu');
    var dropdownMenu = document.getElementById('dropdownMenu');
    var submenus = document.querySelectorAll('.has-submenu');
    var fontChangers = document.querySelectorAll('.font-change');
    var deckChangers = document.querySelectorAll('.deck-change');

    if(isDarkMode){
        document.getElementById('darkmode-toggle').textContent = 'Light mode';
    }
    else{
        document.getElementById('darkmode-toggle').textContent = 'Dark mode';
    }
    
    document.getElementById('darkmode-toggle').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('mainSubmenu').classList.remove('active');
    });
    
    document.getElementById('mainMenu').addEventListener('click', function(event) {
        if(!event.target.closest('#mainSubmenu')){
            document.getElementById('mainSubmenu').classList.add('active');
        }
    });
    document.addEventListener('click', function(event) {
        if (!event.target.closest('#mainMenu')) {
            document.getElementById('mainSubmenu').classList.remove('active');
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const deck = urlParams.get('wordlist') || 'hsk1';
    currentDeck = deck;
    
    if(username === 'tempuser'){
        try{
            let logoutbutton = document.getElementById('logoutButton');
            logoutbutton.style.display = 'none';
        }
        catch(e){
        }
    }
    
    // currentFont = getFont_c();

    if (username && username !== 'tempuser') {
        const loginMenuItem = document.getElementById('loginMenuItem');
        // loginMenuItem.innerHTML = `<a class="deck-option" href="/account"><i class="fa-solid fa-user"></i> ${username}</a>`;
        loginMenuItem.innerHTML = `<a class="deck-option" href="/account"><span>Account</span><span><i class="fa-solid fa-user"></i></span></a>`;
        loginMenuItem.parentNode.append(loginMenuItem);
    }

    // hamburger.addEventListener('click', function(e) {
    //     e.stopPropagation();
    //     dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    // });

    // submenus.forEach(function(submenu) {
    //     submenu.addEventListener('click', function(e) {
    //         e.stopPropagation();
            
    //         submenus.forEach(function(otherSubmenu) {
    //             if (otherSubmenu !== submenu) {
    //                 otherSubmenu.classList.remove('active');
    //             }
    //         });
    //     });
    // });

    // fontChangers.forEach(function(fontChanger) {
    //     fontChanger.addEventListener('click', function(e) {
    //         e.preventDefault();
    //         e.stopPropagation();
    //         // changeFont(this.getAttribute('data-font'));
    //     });
    // });

    // deckChangers.forEach(function(deckChanger) {
    //     deckChanger.addEventListener('click', function(e) {
    //         e.preventDefault();
    //         e.stopPropagation();
    //         changeDeck(this.getAttribute('data-deck'));
    //     });
    // });

    // document.addEventListener('click', function(e) {
    //     if (!dropdownMenu.contains(e.target) && e.target !== hamburger) {
    //         dropdownMenu.style.display = 'none';
    //         submenus.forEach(function(submenu) {
    //             submenu.classList.remove('active');
    //         });
    //     }
    // });

    // document.querySelectorAll('.dropdown-menu a').forEach(function(option) {
    //     option.addEventListener('click', function() {
    //         submenus.forEach(function(submenu) {
    //             submenu.classList.remove('active');
    //         });
    //         document.getElementById('dropdownMenu').style.display = 'none';
    //     });
    // });


    document.querySelectorAll('.color-change').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const color = this.getAttribute('data-color');
            // Apply the color change here. For example:
            // overlay.style.backgroundColor = color + "80";
            // Or update your color variable:
            // currentColor = color;
            // You might need to call a function to redraw your canvas or update other elements
        });
    });


    // function changeFont(fontName) {
    //     document.body.style.fontFamily = `"${fontName}", sans-serif`;
    //     const flashcardCharacter = document.getElementById('flashcard_character');
    //     if (flashcardCharacter) {
    //         flashcardCharacter.style.fontFamily = `"${fontName}", sans-serif`;
    //     }
    //     currentFont = fontName;
    // }

    // Initialize highlighting based on current selections
}

function toggleMenu() {
    var menu = document.getElementById('dropdownMenu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

window.onclick = function(event) {
    if (!event.target.matches('.hamburger') && !event.target.matches('.hamburger span')) {
        // var menu = document.getElementById('dropdownMenu');
        // if (menu.style.display === 'block') {
        //     menu.style.display = 'none';
        // }
    }
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

handleOrientationChange();