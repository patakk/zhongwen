import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/LoginView.vue'
import Register from '../views/RegisterView.vue'
import Settings from '../views/SettingsView.vue'
import About from '../views/AboutView.vue'

import Grid from '../views/GridView.vue'
import Home from '../views/HomeView.vue'
// import Flashcards from '../views/FlashcardsView.vue'
// import HanziPractice from '../views/HanziPracticeView.vue'
// import PageInfo from '../views/PageInfoView.vue'
import Lexicon from '../views/LexiconView.vue'
import Tools from '../views/ToolsView.vue'
//import WordView from '../views/WordView.vue'
//import HanziTree from '../views/HanziTree.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/settings', component: Settings },
  { path: '/about', name: 'About', component: About },

  { path: '/explorer', component: Grid },
  //{ path: '/hanzi-tree', component: HanziTree },
  //{ path: '/flashcards', component: Flashcards },
  //{ path: '/practice', component: HanziPractice },
  //{ path: '/page-info', component: PageInfo },
  { path: '/lexicon', component: Lexicon },
  { path: '/tools', component: Tools },
  //{ path: '/word/:word', name: 'WordPage', component: WordView },
  { path: '/:pathMatch(.*)*', component: Home } 
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router