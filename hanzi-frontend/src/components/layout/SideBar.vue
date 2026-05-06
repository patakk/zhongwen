<template>
  <div>
    <div class="sidebar-container" :class="{ 'sidebar-open': isOpen }">
      <button class="sidebar-toggle" @click.stop="toggleSidebar">
        <font-awesome-icon :icon="faBars" />
      </button>

      <Transition name="sidebar">
        <div v-if="isOpen" class="sidebar" @click.stop>
          <nav class="sidebar-nav">
            <RouterLink to="/" class="side-link">Search</RouterLink>
            <template v-if="authStatus">
              <RouterLink to="/lexicon" class="side-link">Lexicon</RouterLink>
            </template>
            <RouterLink :to="{ path: '/explorer', query: $route.query.wordlist ? { wordlist: $route.query.wordlist } : undefined }" class="side-link">Lists</RouterLink>
            <RouterLink to="/flashcards" class="side-link">Flashcards</RouterLink>
            <RouterLink to="/tools" class="side-link">Tools</RouterLink>
            <RouterLink to="/settings" class="side-link">Settings</RouterLink>
            <RouterLink to="/about" class="side-link">About</RouterLink>
            <template v-if="!authStatus">
              <RouterLink to="/login" class="side-link">Login</RouterLink>
            </template>
            <button class="side-link side-switch-btn" @click.stop="toggleSide">
              ⇄ Flip side
            </button>
          </nav>
        </div>
      </Transition>
    </div>
    <div v-show="isOpen" class="overlay" @click.stop="closeSidebar"></div>
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
    const savedSide = localStorage.getItem('sidebar-side') || 'right';
    return {
      isOpen: localStorage.getItem('sidebar-open') === '1' || document.body.classList.contains('sidebar-push'),
      sidebarSide: savedSide
    }
  },
  watch: {
    isOpen: {
      immediate: true,
      handler(val) {
        localStorage.setItem('sidebar-open', val ? '1' : '0')
        if (val) {
          document.body.classList.add('sidebar-push')
        } else {
          document.body.classList.remove('sidebar-push')
        }
      }
    },
    sidebarSide: {
      immediate: true,
      handler(val) {
        localStorage.setItem('sidebar-side', val)
        document.body.classList.remove('sidebar-side-right', 'sidebar-side-left')
        document.body.classList.add('sidebar-side-' + val)
      }
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
    },
    toggleSide() {
      this.sidebarSide = this.sidebarSide === 'right' ? 'left' : 'right'
    }
  },
  mounted() {
    this._onKeydown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        this.toggleSidebar()
      }
    }
    document.addEventListener('keydown', this._onKeydown)

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
    document.removeEventListener('keydown', this._onKeydown)
    this._mq.removeEventListener('change', this._onMq)
    document.removeEventListener('click', this.closeSidebar)
  }
}
</script>

<style scoped>
.sidebar-container {}

.sidebar {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 80%;
  max-width: 250px;
  z-index: 30;
  border-left: 2px solid color-mix(in oklab, var(--fg) 25%, var(--bg) 100%);
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.1s ease-out;
}

.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(100%);
}

.sidebar-toggle {
  position: fixed;
  top: 0;
  right: 0;
  padding: 0.5em 0.5em 0 0;
  z-index: 1000;
  background: none;
  border: none;
  font-size: 1.5em;
  color: var(--fg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  border: none;
  box-shadow: none;
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
  padding: 3em 0em .5em 0em;
  width: 100%;
  cursor: default;
}

.side-link {
  color: var(--fg);
  text-decoration: none;
  font-size: 1em;
  padding: 1em .6em;
  white-space: nowrap;
  background: none;
  text-transform: lowercase;
  opacity: .6;
  cursor: pointer;
  box-sizing: border-box;
  corner-shape: var(--superellipse-4);
  border-radius: var(--superellipse-radius);
}

.side-link:hover {
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
  opacity: 1;
  text-transform: uppercase;
  cursor: pointer;
}

.sidebar-nav .side-link {
  border-top: 1px solid color-mix(in oklab, var(--fg) 40%, var(--bg) 100%);
  width: 100%;
}

.side-link.router-link-active,
.side-link.router-link-exact-active {
  text-transform: uppercase;
  /*text-decoration: underline;*/
  background-color: color-mix(in oklab, var(--primary-color) 25%, var(--bg) 15%);

  opacity: 1;
}

.side-switch-btn {
  border: none;
  font-family: inherit;
  text-transform: none;
  opacity: 0.4;
}

.side-switch-btn:hover {
  opacity: 0.8;
  text-transform: none;
  background: none;
}

@media (max-width: 784px) {
  .overlay {
    display: block;
  }
}
</style>

<style>
.sidebar-side-left .sidebar {
  right: auto !important;
  left: 0 !important;
  border-left: none !important;
  border-right: 2px solid color-mix(in oklab, var(--fg) 25%, var(--bg) 100%);
}

.sidebar-side-left .sidebar-toggle {
  right: auto !important;
  left: 0 !important;
  padding: 0.5em 0 0 0.5em !important;
}

.sidebar-side-left .sidebar-enter-from,
.sidebar-side-left .sidebar-leave-to {
  transform: translateX(-100%);
}
</style>
