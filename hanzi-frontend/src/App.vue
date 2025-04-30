<template>
  <div id="app" :data-theme="theme">
    <button class="theme-toggle" @click="toggleTheme">
      <font-awesome-icon :icon="['fas', 'moon']" v-if="theme === 'dark'" />
      <font-awesome-icon :icon="['fas', 'sun']" v-else />
    </button>
    <router-view />
    <GlobalCardModal />
    <BubbleTooltip 
      :visible="$store.getters['bubbleTooltip/isBubbleVisible']"
      :character="bubbleData.character"
      :pinyin="bubbleData.pinyin"
      :english="bubbleData.english"
      :position="bubbleData.position"
      :fontFamily="bubbleData.fontFamily"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import GlobalCardModal from './components/GlobalCardModal.vue';
import BubbleTooltip from './components/BubbleTooltip.vue';

const store = useStore()
const router = useRouter()

const theme = ref(localStorage.getItem('theme') || 'light')
const bubbleData = computed(() => store.getters['bubbleTooltip/getBubbleData'])

// Create a watcher for route changes to close the modal and bubble tooltip when navigating
watch(
  () => router.currentRoute.value.path,
  (newPath, oldPath) => {
    // Only close UI elements if we're actually changing paths (not just query params)
    if (newPath !== oldPath) {
      // Check if modal is visible before trying to close it
      if (store.getters['cardModal/isCardModalVisible']) {
        console.log('Route changed, closing modal', newPath, oldPath);
        store.dispatch('cardModal/hideCardModal');
      }
      
      // Hide bubble tooltip if visible
      if (store.getters['bubbleTooltip/isBubbleVisible']) {
        console.log('Route changed, hiding bubble tooltip');
        store.dispatch('bubbleTooltip/hideBubble');
      }
    }
  }
);

// Function to verify user on app load and page refreshes
const verifyUserExists = async () => {
  if (store.getters.isLoggedIn) {
    try {
      // Check if backend is available before trying to fetch user data
      const backendAvailable = await checkBackendConnectivity();
      if (!backendAvailable) {
        console.warn('Backend unavailable during verification, logging out');
        store.dispatch('logout');
        return;
      }
      
      // Fetch user data to verify user still exists in the database
      await store.dispatch('fetchUserData');
      
      // If after fetchUserData the auth status is false, user no longer exists
      if (!store.getters.getAuthStatus) {
        console.warn('User session invalid, logging out after verification');
        store.dispatch('logout');
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      // On error, assume user session is invalid
      store.dispatch('logout');
    }
  }
};

// Check if backend is available
const checkBackendConnectivity = async () => {
  try {
    // Try a lightweight endpoint with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch('/version', { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error connecting to backend:', error);
    return false;
  }
};

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  document.documentElement.setAttribute('data-theme', theme.value)

  // Add the spin class
  const button = document.querySelector('.theme-toggle')
  button.classList.add('spin')

  // Remove the spin class after the animation ends
  setTimeout(() => {
    button.classList.remove('spin')
  }, 200) // Match the duration of the animation
}

onMounted(async () => {
  // Check system preference on first load if no theme is set in localStorage
  if (!localStorage.getItem('theme')) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.value = prefersDark ? 'dark' : 'light'
    localStorage.setItem('theme', theme.value)
  }
  document.documentElement.setAttribute('data-theme', theme.value)
  
  // Verify user exists in database on each app load/refresh
  await verifyUserExists();
  
  // Load dictionary data
  await Promise.all([
    store.dispatch("fetchDictionaryData"),
    store.dispatch("fetchCustomDictionaryData")
  ]);
  
  // Wait for the next tick to ensure the router and store are fully initialized
  nextTick(() => {
    console.log('App mounted, checking for word parameter');
    // Check for word parameter in URL on initial load
    // Only if we're not already on the /word/ route
    if (!router.currentRoute.value.path.startsWith('/word/')) {
      store.dispatch("cardModal/checkForWordParameter");
    }
  });
})
</script>

<style>
  
</style>