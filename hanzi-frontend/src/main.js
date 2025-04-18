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
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons'

// Create a global event bus
export const eventBus = {
  listeners: {},
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  },
  off(event, callback) {
    if (this.listeners[event]) {
      if (callback) {
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      } else {
        delete this.listeners[event];
      }
    }
  }
};

library.add(faSun, faMoon)

store.dispatch('loadUserDataFromStorage')
  .then(() => {
    return store.dispatch('fetchUserData')
  })
  .catch(err => {
  })
  .finally(() => {
    const app = createApp(App)

    app.component('font-awesome-icon', FontAwesomeIcon)
    app.use(createPinia())
    app.use(store)
    app.use(router)

    app.config.globalProperties.$toAccentedPinyin = toAccentedPinyin
    app.mount('#app')
  })