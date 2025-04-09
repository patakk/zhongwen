import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/HomeView.vue'
import Login from '../views/LoginView.vue'
import Grid from '../views/GridView.vue'
import Search from '../views/SearchView.vue'
import Flashcards from '../views/FlashcardsView.vue'
import PageInfo from '../views/PageInfoView.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/grid', component: Grid },
  { path: '/search', component: Search },
  { path: '/flashcards', component: Flashcards },
  { path: '/page-info', component: PageInfo },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
