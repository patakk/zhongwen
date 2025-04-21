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
import { faSun, faMoon, faPencil } from '@fortawesome/free-solid-svg-icons'

library.add(faSun, faMoon, faPencil)

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