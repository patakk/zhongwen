import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia' // You can remove if not using Pinia
import { toAccentedPinyin } from './helpers.js'

import App from './App.vue'
import router from './router'
import store from './stores'

// Hydrate from localStorage before mounting the app
store.dispatch('loadUserDataFromStorage')
  .then(() => {
    // Optionally, try to fetch user from backend API if session/cookie exists (recommended)
    // This will also refresh user data after Google OAuth redirect
    return store.dispatch('fetchUserData')
  })
  .catch(err => {
    // Optionally log the error or ignore it
    // If request fails, localStorage state will still be used
    // console.error('Error during user data hydration:', err);
  })
  .finally(() => {
    const app = createApp(App)

    app.use(createPinia()) // Only if you actually use Pinia stores elsewhere
    app.use(store)
    app.use(router)

    app.config.globalProperties.$toAccentedPinyin = toAccentedPinyin
    app.mount('#app')
  })