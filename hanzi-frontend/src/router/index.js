import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/LoginView.vue'
import Register from '../views/RegisterView.vue'
import Account from '../views/AccountView.vue'
import About from '../views/AboutView.vue'

import Grid from '../views/GridView.vue'
import Home from '../views/HomeView.vue'
import Flashcards from '../views/FlashcardsView.vue'
import HanziPractice from '../views/HanziPracticeView.vue'
import PageInfo from '../views/PageInfoView.vue'
import MyLists from '../views/MySpaceView.vue'
import WordView from '../views/WordView.vue'
import HanziTree from '../views/HanziTree.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/account', component: Account },
  { path: '/about', name: 'About', component: About },

  { path: '/explorer', component: Grid },
  { path: '/hanzi-tree', component: HanziTree },
  { path: '/flashcards', component: Flashcards },
  { path: '/practice', component: HanziPractice },
  { path: '/page-info', component: PageInfo },
  { path: '/my-lists', component: MyLists },
  { path: '/word/:word', name: 'WordPage', component: WordView },
  { path: '/:pathMatch(.*)*', component: Home } 
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router