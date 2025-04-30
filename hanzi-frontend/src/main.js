import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia' // You can remove if not using Pinia
import { toAccentedPinyin } from './helpers.js'

import App from './App.vue'
import router from './router'
import store from './stores'
//import './lib/fontawesome_unminified.js'; 

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faSun, faMoon, faPencil, faBars } from '@fortawesome/free-solid-svg-icons'

library.add(faSun, faMoon, faPencil, faBars)

// IMMEDIATELY clear login state on page load before checking backend
console.log('Clearing login state on page load before checking backend');
localStorage.removeItem('userData');
store.dispatch('logout');

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
    
    console.log('Backend connection confirmed');
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
    console.log('Backend available, attempting to restore session');
    await store.dispatch('loadUserDataFromStorage');
    await store.dispatch('fetchUserData').catch(err => {
      console.error('Failed to fetch user data, keeping logout state', err);
    });
  } else {
    console.log('App started with backend unavailable, maintaining logged out state');
  }
  
  // Only start dictionary data loading if backend is available
  if (isConnected) {
    store.dispatch('fetchDictionaryData');
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
};

// Start app initialization
initApp();