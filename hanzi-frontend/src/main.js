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

// Initialize these promises right away
const userDataPromise = store.dispatch('loadUserDataFromStorage')
  .then(() => store.dispatch('fetchUserData'))
  .catch(err => console.error('Error loading user data:', err));

// Start dictionary data loading in the background
const staticDictionaryPromise = store.dispatch('fetchDictionaryData');
const customDictionaryPromise = store.dispatch('fetchCustomDictionaryData');

// We'll proceed with app initialization without waiting for dictionary data to finish
// The components will handle waiting for the dictionary data when needed
userDataPromise.finally(() => {
  const app = createApp(App)

  app.component('font-awesome-icon', FontAwesomeIcon)
  app.use(createPinia())
  app.use(store)
  app.use(router)

  app.config.globalProperties.$toAccentedPinyin = toAccentedPinyin
  app.mount('#app')
})