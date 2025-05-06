import './assets/main.css'
import './assets/theme1.css'
import './assets/theme2.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia' // You can remove if not using Pinia
import { toAccentedPinyin } from './helpers.js'

import App from './App.vue'
import router from './router'
import store from './stores'
//import './lib/fontawesome_unminified.js'; 

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { 
  faSun, 
  faMoon, 
  faPencil, 
  faBars, 
  faPalette, 
  faArrowRotateRight, 
  faPenFancy, 
  faGear, 
  faSquare, 
  faTrash, 
  faFile, 
  faMagnifyingGlass,
  faSitemap,
  faScissors,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faSun, 
  faMoon, 
  faPencil, 
  faBars, 
  faPalette, 
  faArrowRotateRight, 
  faPenFancy, 
  faGear, 
  faSquare, 
  faTrash, 
  faFile, 
  faMagnifyingGlass,
  faSitemap,
  faScissors,
)

// IMMEDIATELY clear login state on page load before checking backend
localStorage.removeItem('userData');
store.dispatch('logout');

// Router-based Ko-fi widget control
const setupKofiWidget = () => {
  // Add style to head to control Ko-fi widget visibility
  const style = document.createElement('style');
  style.id = 'kofi-style-control';
  style.textContent = '.floatingchat-container-wrap { display: none !important; }';
  document.head.appendChild(style);

  // Function to update Ko-fi visibility based on route
  const updateKofiVisibility = () => {
    const style = document.getElementById('kofi-style-control');
    if (!style) return;
    
    if (window.location.pathname === '/about') {
      style.textContent = '.floatingchat-container-wrap { display: block !important; }';
    } else {
      style.textContent = '.floatingchat-container-wrap { display: none !important; }';
    }
  };

  // Create a more aggressive observer to watch for the Ko-fi widget
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        const kofiElements = document.querySelectorAll('.floatingchat-container-wrap');
        if (kofiElements.length > 0) {
          // Ko-fi widget found, update its visibility multiple times to ensure it sticks
          updateKofiVisibility();
        }
      }
    }
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true
  });

  // Update visibility on route change BEFORE and AFTER navigation
  router.beforeEach((to, from, next) => {
    next();
  });
  
  router.afterEach((to) => {
    
    // Set correct visibility immediately
  });

  // Initialize Ko-fi if not already loaded
  const initKofi = () => {
    if (document.getElementById('kofi-widget-script')) return;
    
    const script = document.createElement('script');
    script.id = 'kofi-widget-script';
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    script.onload = () => {
      if (!window.kofiWidgetOverlay) return;
      
      // Wait a bit before initializing to make sure everything is ready
      setTimeout(() => {
        try {
          window.kofiWidgetOverlay.draw('patakk', {
            'type': 'floating-chat',
            'floating-chat.donateButton.text': 'Contribute',
            'floating-chat.donateButton.background-color': '#222',
            'floating-chat.donateButton.text-color': '#fff',
            'floating-chat.donateButton.windowPosition': 'right'
          });
          
          // Update visibility based on current route
          
        } catch (e) {
          console.error('Failed to initialize Ko-fi widget:', e);
        }
      }, 300);
    };
    
    document.head.appendChild(script);
  };

  // Initial visibility update
  
  // Load Ko-fi widget once
};

// Check if backend is available
const checkBackendConnectivity = async () => {
  try {
    // Try a lightweight endpoint with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch('/version', { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn('Backend unavailable (error response), keeping logout state');
      return false;
    }
    
    const text = await response.text();
    if (!text) {
      console.warn('Backend returned empty response, keeping logout state');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error connecting to backend:', error);
    return false;
  }
};

// Initialize app once we know the backend state
const initApp = async () => {
  const isConnected = await checkBackendConnectivity();
  
  if (isConnected) {
    // Only try to restore user session if backend is definitely available
    await store.dispatch('loadUserDataFromStorage');
    await store.dispatch('fetchUserData').catch(err => {
      console.error('Failed to fetch user data, keeping logout state', err);
    });
  } else {
  }
  
  // Only start dictionary data loading if backend is available
  if (isConnected) {
    store.dispatch('fetchDictionaryData').then(async (dictionaryData) => {
      // After dictionary data is loaded, preload a character from HSK1 for practice
      if (dictionaryData && dictionaryData.hsk1 && dictionaryData.hsk1.chars) {
        try {
          // Get a sample character from HSK1
          const hsk1Chars = Array.isArray(dictionaryData.hsk1.chars) 
            ? dictionaryData.hsk1.chars 
            : Object.keys(dictionaryData.hsk1.chars);
            
          if (hsk1Chars.length > 0) {
            // Choose a random character to preload instead of always the first one
            const randomIndex = Math.floor(Math.random() * hsk1Chars.length);
            const charToPreload = hsk1Chars[randomIndex];
            
            // Only preload stroke data, not character info since it's already in the dictionary
            await store.dispatch('preloadPracticeCharacterStrokes', charToPreload);
          }
        } catch (err) {
          console.error('Error preloading HSK1 character:', err);
        }
      }
    });
    
    // Only fetch custom dictionary data if the user is logged in
    if (store.getters.isLoggedIn) {
      store.dispatch('fetchCustomDictionaryData');
    }
  }
  
  // Create and mount the app
  const app = createApp(App)
  app.component('font-awesome-icon', FontAwesomeIcon)
  app.use(createPinia())
  app.use(store)
  app.use(router)
  app.config.globalProperties.$toAccentedPinyin = toAccentedPinyin
  app.mount('#app')
  
  // Set up Ko-fi widget after app is mounted
  setupKofiWidget();
};

// Start app initialization
initApp();