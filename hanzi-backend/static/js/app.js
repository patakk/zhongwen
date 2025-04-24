const routes = {
    '/': async () => import('./routes/home.js').then(module => module.renderHome),
    '/login': async () => import('./routes/login.js').then(module => module.renderLogin),
    '/register': async () => import('./routes/register.js').then(module => module.renderRegister),
    '/search': async () => import('./routes/search.js').then(module => module.renderSearch),
    '/grid': async () => import('./routes/grid.js').then(module => module.renderGrid),
    '/account': async () => import('./routes/account.js').then(module => module.renderAccount),
    '/page_info': async () => import('./routes/page_info.js').then(module => module.renderPageInfo),
    '/flashcards': async () => import('./routes/flashcards.js').then(module => module.renderFlashcards),
    '/hanziwriting': async () => import('./routes/hanziwriting.js').then(module => module.renderHanziwriting),
    '/puzzles': async () => import('./routes/puzzles.js').then(module => module.renderPuzzles),
    '/puzzle_choices': async () => import('./routes/puzzle_choices.js').then(module => module.renderPuzzleChoices),
    '/puzzle_table': async () => import('./routes/puzzle_table.js').then(module => module.renderPuzzleTable),
    '/puzzle_audio': async () => import('./routes/puzzle_audio.js').then(module => module.renderPuzzleAudio),
}



const preloads = {
  '/': async () => import('./routes/home.js').then(module => console.log("loaded home")),
  '/login': async () => import('./routes/login.js').then(module => console.log("loaded login")),
  '/register': async () => import('./routes/register.js').then(module => console.log("loaded register")),
  '/search': async () => import('./routes/search.js').then(module => console.log("loaded search")),
  '/grid': async () => import('./routes/grid.js').then(module => console.log("loaded grid")),
  '/account': async () => import('./routes/account.js').then(module => console.log("loaded account")),
  '/page_info': async () => import('./routes/page_info.js').then(module => console.log("loaded page info")),
  '/flashcards': async () => import('./routes/flashcards.js').then(module => console.log("loaded flashcards")),
  '/hanziwriting': async () => import('./routes/hanziwriting.js').then(module => console.log("loaded hanziwriting")),
  '/puzzles': async () => import('./routes/puzzles.js').then(module => console.log("loaded puzzles")),
  '/puzzle_choices': async () => import('./routes/puzzle_choices.js').then(module => console.log("loaded puzzle_choices")),
  '/puzzle_table': async () => import('./routes/puzzle_table.js').then(module => console.log("loaded puzzle_table")),
  '/puzzle_audio': async () => import('./routes/puzzle_audio.js').then(module => console.log("loaded puzzle_audio")),
}

const callBacks = {
    '/': function(){
    },
    '/search': function(){
        initSearch();   
    },
    '/grid': function(){
        const urlParams = new URLSearchParams(window.location.search);
        currentDeck = urlParams.get('wordlist') || 'hsk1';
        addedtooglelistlistneer = false;
        if(currentDeck === 'hsk1'){
            initGridPage();
        }
        getInputDecks(initGridPage);
    },
    '/account': function(){
      initAccount();
    },
    '/page_info': function(){
    },
    '/flashcards': function(){
    },
    '/hanziwriting': function(){
    },
    '/puzzles': function(){
    },
    '/puzzle_choices': function(){
    },
    '/puzzle_table': function(){
    },
    '/puzzle_audio': function(){
    },
}

let loadedCard = null;
let unlocked = false;
let donefirst = false;

function preload(){
    Object.keys(preloads).forEach(path => {
        const preloadFunction = preloads[path];
        preloadFunction();
    });
}

let pushTimer;


function togglePasswordVisibility() {
  const passwordInput = document.getElementById('password');
  const toggleIcon = document.querySelector('.toggle-password');
  
  if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleIcon.classList.remove('fa-eye-slash');
      toggleIcon.classList.add('fa-eye');
  } else {
      passwordInput.type = 'password';
      toggleIcon.classList.remove('fa-eye');
      toggleIcon.classList.add('fa-eye-slash');
  }
}

function updateUrl(newUrl) {
  // Instant update to visible URL (no history entry)
  history.replaceState(null, '', newUrl);

  // Debounced pushState to avoid throttling
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    history.pushState(null, '', newUrl);
  }, 300); // or longer, like 500ms
}

function navigate(path) {
  // history.pushState(null, null, path) // Change URL without reload
  console.log("navigating to: ", path);
  router() // Re-render based on the new URL
}

// Router function to load the right content
let currentPath = window.location.pathname; // Store the current path
async function router() {

    try {
        hideCard();
    }
    catch(e){
        console.log(e);
    }
    //const path = window.location.pathname
    const path = currentPath;
    const viewFunction = routes[path] || (() => Promise.resolve("404 Not Found"))
    const renderPage = await viewFunction() // Dynamically load the route module
    const html = await renderPage() // Call the corresponding render function
    document.getElementById('app').innerHTML = html // Replace content in #app
    setupLinks();
    confirmDarkmode();

    callBacks[path](); 
}

let eventbylistener = new Map();

function setupLinks() {
  eventbylistener.forEach((evl, link) => {
    link.removeEventListener('click', evl);
  });

  document.querySelectorAll('a[data-link]').forEach(link => {
    const evl = (e) => {
      e.preventDefault();
      const url = link.getAttribute('href');
      currentPath = url; 
      history.pushState(null, '', url);
      router();
    };

    eventbylistener.set(link, evl);
    link.addEventListener('click', evl);
  });
}


// document.body.addEventListener('click', (e) => {
//   if (e.target.matches('[data-link]')) {
//     e.preventDefault() 
//     navigate(e.target.getAttribute('href'))
//   }
// })

window.addEventListener('popstate', router)

document.addEventListener('DOMContentLoaded', () => {
  preload() 
  router()
})
