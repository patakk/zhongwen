
let currentDeck = 'hsk1';
let currentFont = 'Noto Sans Mono';


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

    })
    .catch(error => {
        console.error('There was a problem changing the font:', error);
    });
}


function getDeck(func=null) {
    fetch('./api/get_deck')
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
    fetch('./api/get_font')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            currentFont = data.font;
            console.log('received font', currentFont);
            try {
                if(currentFont === 'Noto Serif SC'){
                    document.getElementById('flashcard_character').style.fontFamily = `"${currentFont}", serif`;
                } else{
                    document.getElementById('flashcard_character').style.fontFamily = `"${currentFont}", sans-serif`;
                }
            }
            catch (e) {
                console.log(e);
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function getDeck_c() {
    fetch('./api/get_deck')
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
                        newUrl.searchParams.set('deck', currentDeck);
                        history.pushState({}, '', newUrl);

                        // classList.remove('active');
            
                        // Close dropdown
                        document.getElementById('dropdownMenu').style.display = 'none';
                    }
                });
            });
            // font
            document.querySelectorAll('.font-change').forEach(function(fontOption) {
                fontOption.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const selectedFont = this.getAttribute('data-font');
                    changeFont(selectedFont);
                    // Update highlighting
                    document.querySelectorAll('.font-change').forEach(opt => opt.classList.remove('selected-option'));
                    this.classList.add('selected-option');

                    // Close dropdown
                    document.getElementById('dropdownMenu').style.display = 'none';
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
    fetch('./api/get_font')
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

document.addEventListener('DOMContentLoaded', function() {
    var hamburger = document.getElementById('hamburgerMenu');
    var dropdownMenu = document.getElementById('dropdownMenu');
    var submenus = document.querySelectorAll('.has-submenu');
    var fontChangers = document.querySelectorAll('.font-change');
    var deckChangers = document.querySelectorAll('.deck-change');

    const urlParams = new URLSearchParams(window.location.search);
    const deck = urlParams.get('deck') || 'hsk1';
    currentDeck = deck;
    
    if(username === 'tempuser'){
        try{
            let logoutbutton = document.getElementById('logoutButton');
            logoutbutton.style.display = 'none';
        }
        catch(e){
            console.log(e);
        }
    }
    
    currentFont = getFont_c();

    const loginMenuItem = document.getElementById('loginMenuItem');
    if (username && username !== 'tempuser') {
        loginMenuItem.innerHTML = `<a href="./user_progress">你好 ${username}!</a>`;
    }

    hamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

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

    fontChangers.forEach(function(fontChanger) {
        fontChanger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // changeFont(this.getAttribute('data-font'));
        });
    });

    deckChangers.forEach(function(deckChanger) {
        deckChanger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            changeDeck(this.getAttribute('data-deck'));
        });
    });

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
});

function toggleMenu() {
    var menu = document.getElementById('dropdownMenu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

window.onclick = function(event) {
    if (!event.target.matches('.hamburger') && !event.target.matches('.hamburger span')) {
        var menu = document.getElementById('dropdownMenu');
        if (menu.style.display === 'block') {
            menu.style.display = 'none';
        }
    }
}