<template>
  <div>
    <div class="sidebar-container" :class="{ 'sidebar-open': isOpen }">
      <button v-if="!isOpen" class="sidebar-toggle" @click.stop="toggleSidebar">
          <font-awesome-icon :icon="['fas', 'bars']" />
      </button>

      <div v-if="isOpen" class="sidebar" @click.stop>
        <nav class="sidebar-nav">
          <RouterLink to="/" class="top-link">Home</RouterLink>
          <template v-if="authStatus">
            <RouterLink to="/lexicon" class="top-link">Lexicon</RouterLink>
          </template>
          <RouterLink :to="{ path: '/explorer', query: $route.query.wordlist ? { wordlist: $route.query.wordlist } : undefined }" class="top-link">Explorer</RouterLink>
          <!--<RouterLink to="/flashcards" class="top-link">Flashcards</RouterLink>
          <RouterLink to="/practice" class="top-link">Strokes</RouterLink>
          <RouterLink to="/search" class="top-link">Search</RouterLink>-->
            <RouterLink to="/about" class="top-link">About</RouterLink>
          <RouterLink to="/settings" class="top-link">Settings</RouterLink>
          <template v-if="!authStatus">
            <RouterLink to="/login" class="top-link">Login</RouterLink>
          </template>
        </nav>
      </div>
    </div>
    <div v-if="isOpen" class="overlay" @click.stop="closeSidebar"></div>
    
    <div class="topbar" :style="{ opacity: topbarOpacity }">
      <div class="top-nav">
        <RouterLink to="/" class="top-link">Home</RouterLink>
        <template v-if="authStatus">
          <RouterLink to="/lexicon" class="top-link">Lexicon</RouterLink>
        </template>
        <RouterLink :to="{ path: '/explorer', query: $route.query.wordlist ? { wordlist: $route.query.wordlist } : undefined }" class="top-link">Explorer</RouterLink>
        <!--<RouterLink to="/flashcards" class="top-link">Flashcards</RouterLink>
        <RouterLink to="/practice" class="top-link">Strokes</RouterLink>
        <RouterLink to="/search" class="top-link">Search</RouterLink>-->
        <RouterLink to="/settings" class="top-link">Settings</RouterLink>
        <template v-if="!authStatus">
          <RouterLink to="/login" class="top-link">Login</RouterLink>
        </template>
        <RouterLink to="/about" class="top-link">About</RouterLink>
      </div>
    </div>
  </div>
</template>


<script>
import LogoutButton from '../components/LogoutButton.vue'

export default {
  name: 'SideBar',
  components: {
    LogoutButton
  },
  data() {
    return {
      isOpen: false,
      scrollPosition: 0,
      topbarOpacity: 1
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
      if (this.isOpen) {
        // Dispatch a custom event when sidebar is opened
        document.dispatchEvent(new CustomEvent('sidebar-opened'))
      }
    },
    closeSidebar() {
      this.isOpen = false
    },
    handleScroll() {
      // Get current scroll position
      const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop
      
      // Calculate opacity based on scroll position
      // Fade starts at 50px and completes at 150px
      if (currentScrollPosition < 50) {
        this.topbarOpacity = 1
      } else if (currentScrollPosition > 150) {
        this.topbarOpacity = 0
      } else {
        this.topbarOpacity = 1 - (currentScrollPosition - 50) / 100
      }
      
      // Update scroll position
      this.scrollPosition = currentScrollPosition
    }
  },
  mounted() {
    document.addEventListener('click', this.closeSidebar)
    window.addEventListener('scroll', this.handleScroll)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeSidebar)
    window.removeEventListener('scroll', this.handleScroll)
  }
}
</script>


<style scoped>

.logout-btn {
  width: 100%;
}

.sidebar-container {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  display: none;
  flex-direction: row;
  transition: transform .1s ease;
  border-left: 0;
  z-index: 30;
}

.sidebar {
  width: 0;
  overflow-x: hidden;
  transition: all .1s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.sidebar-open .sidebar {
  border-left: 2px solid color-mix(in oklab, var(--fg) 25%, var(--bg) 100%);
  width: 250px;
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
}

.sidebar-toggle {
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
  border: none;
  padding: 1rem;
  cursor: pointer;
  font-size: 1rem;
  color: var(--fg);
  transition: background-color .1s ease;
  border-radius: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-icon {
  display: inline-block;
}

.toggle-text {
  display: none;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 25;
}

.sidebar-toggle:hover {
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: .5em .5em .5em 0em;
  margin: 0;
  list-style: none;
  width: 100%;
}

.sidebar-link {
  display: block;
  padding: 0.5rem;
  text-decoration: none;
  color: var(--fg);
  transition: none;
  width: 100%;
  text-align: left;
  white-space: nowrap;
  border-bottom: 2px solid color-mix(in oklab, var(--fg) 11%, var(--bg) 11%);
}

.sidebar-link:last-child {
  border-bottom: none;
}

.sidebar-link:hover {
  background-color: color-mix(in oklab, var(--fg) 15%, var(--bg) 100%);
}

/* Media query for vertical screens (assuming mobile devices) */
@media (max-aspect-ratio: 1/1) or (max-width: 1024px) {
  /* @media (max-width: 1024px) { */
  .sidebar-container {
    height: auto;
    display: flex;
  }

  .sidebar-toggle {
    
    width: 1.5em;
    height: 1.5em;
    color: var(--fg);
    position: fixed;
    padding: var(--spacing-unit);
    z-index: 1000;
    background: none;
    border: none;
    font-size: 1.5em;
    cursor: pointer;
    right: 0;
    top: 0;


  top: 0;
  right: 0;
  padding: 1em;
  }

  .toggle-icon {
    display: none;
  }

  .toggle-text {
    display: inline-block;
  }

  .sidebar-open .sidebar {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: 80%;
    max-width: 250px;
    z-index: 30;
  }
}


.topbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: none;
  z-index: 555;
  display: flex;
  justify-content: center;
}

.top-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: none;
  gap: 2em;
  margin: .25em;
}

.top-link {
  color: var(--fg);
  text-decoration: none;
  font-size: 1em;
  padding: .2em .6em;
  white-space: nowrap;
  /* border-radius: .2em; */
  background: none;
  text-transform: lowercase;
  opacity: .6;
}

.top-link:hover {
  background-color: color-mix(in oklab, var(--primary-color) 25%, var(--bg) 15%);
  opacity: 1;
}

.top-link.router-link-active, .top-link.router-link-exact-active {
  text-transform: uppercase;
  background-color: color-mix(in oklab, var(--primary-color) 25%, var(--bg) 15%);
  opacity: 1;
}

@media (max-aspect-ratio: 1/1) or (max-width: 1024px) {
  .top-nav {
    display: none;
  }
}

@media (min-aspect-ratio: 1/1) {
  /* #mainsidebar {
    display: none;
  } */
} 
</style>
