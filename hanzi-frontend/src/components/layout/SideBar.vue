<template>
  <div>
    <div class="sidebar-container" :class="{ 'sidebar-open': isOpen }">
      <button v-if="!isOpen" class="sidebar-toggle" @click.stop="toggleSidebar">
        <font-awesome-icon :icon="faBars" />
      </button>

      <div v-if="isOpen" class="sidebar" @click.stop>
        <nav class="sidebar-nav">
          <RouterLink to="/" class="top-link">Search</RouterLink>
          <template v-if="authStatus">
            <RouterLink to="/lexicon" class="top-link">Lexicon</RouterLink>
          </template>
          <RouterLink :to="{ path: '/explorer', query: $route.query.wordlist ? { wordlist: $route.query.wordlist } : undefined }" class="top-link">Lists</RouterLink>
          <RouterLink to="/flashcards" class="top-link">Flashcards</RouterLink>
          <RouterLink to="/tools" class="top-link">Tools</RouterLink>
          <RouterLink to="/settings" class="top-link">Settings</RouterLink>
          <RouterLink to="/about" class="top-link">About</RouterLink>
          <template v-if="!authStatus">
            <RouterLink to="/login" class="top-link">Login</RouterLink>
          </template>
        </nav>
      </div>
    </div>
    <div v-if="isOpen" class="overlay" @click.stop="closeSidebar"></div>
  </div>
</template>

<script>
import { faBars } from '@/icons'

export default {
  name: 'SideBar',
  setup() {
    return { faBars }
  },
  data() {
    return {
      isOpen: false
    }
  },
  computed: {
    authStatus() {
      return this.$store.getters.getAuthStatus
    }
  },
  methods: {
    toggleSidebar() {
      this.isOpen = !this.isOpen
    },
    closeSidebar() {
      this.isOpen = false
    }
  },
  mounted() {
    this._mq = window.matchMedia('(max-width: 784px)')
    this._onMq = (e) => {
      if (e.matches) {
        document.addEventListener('click', this.closeSidebar)
      } else {
        document.removeEventListener('click', this.closeSidebar)
        this.isOpen = false
      }
    }
    this._mq.addEventListener('change', this._onMq)
    if (this._mq.matches) {
      document.addEventListener('click', this.closeSidebar)
    }
  },
  beforeUnmount() {
    this._mq.removeEventListener('change', this._onMq)
    document.removeEventListener('click', this.closeSidebar)
  }
}
</script>

<style scoped>
.sidebar-container {}

.sidebar {
  width: 0;
  overflow-x: hidden;
  transition: all .1s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.sidebar-open .sidebar {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 80%;
  max-width: 250px;
  z-index: 30;
  border-left: 2px solid color-mix(in oklab, var(--fg) 25%, var(--bg) 100%);
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
}

.sidebar-toggle {
  position: fixed;
  top: 0;
  right: 0;
  width: 1.5em;
  height: 1.5em;
  padding: 1em;
  z-index: 1000;
  background: none;
  border: none;
  font-size: 1.5em;
  color: var(--fg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 25;
  display: none;
  background: var(--overlay-background, rgba(0, 0, 0, 0.3));
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: .5em .5em .5em 0em;
  width: 100%;
}

.top-link {
  color: var(--fg);
  text-decoration: none;
  font-size: 1em;
  padding: .2em .6em;
  white-space: nowrap;
  background: none;
  text-transform: lowercase;
  opacity: .6;
  corner-shape: var(--superellipse-2-5);
  border-radius: var(--superellipse-radius);
}

.top-link:hover {
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
  opacity: 1;
}

.top-link.router-link-active,
.top-link.router-link-exact-active {
  text-transform: uppercase;
  text-decoration: underline;
  background-color: color-mix(in oklab, var(--primary-color) 25%, var(--bg) 15%);
  opacity: 1;
}

@media (max-width: 784px) {
  .overlay {
    display: block;
  }
}
</style>
