import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/HomeView.vue'
import Login from '../views/LoginView.vue'
import Register from '../views/RegisterView.vue'
import Account from '../views/AccountView.vue'
import DeleteAccount from '../views/DeleteAccountView.vue'
import About from '../views/AboutView.vue'

import Grid from '../views/GridView.vue'
import Search from '../views/SearchView.vue'
import Flashcards from '../views/FlashcardsView.vue'
import PageInfo from '../views/PageInfoView.vue'
import MyLists from '../views/MySpaceView.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/account', component: Account },
  { path: '/delete-account', component: DeleteAccount },
  { path: '/about', component: About },

  { path: '/grid', component: Grid },
  { path: '/search', name: 'SearchPage', component: Search },
  { path: '/flashcards', component: Flashcards },
  { path: '/page-info', component: PageInfo },
  { path: '/my-lists', component: MyLists },
  // Optionally, a catch-all for 404s:
  { path: '/:pathMatch(.*)*', component: Home }  // or NotFoundView
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router