<template>
  <div id="app" :data-theme="currentTheme">
    <button class="theme-toggle" @click="toggleTheme">
      <font-awesome-icon :icon="['fas', 'moon']" v-if="currentTheme === 'dark'" />
      <font-awesome-icon :icon="['fas', 'sun']" v-else-if="currentTheme === 'theme1'" />
      <font-awesome-icon :icon="['fas', 'moon']" v-else-if="currentTheme === 'theme2'" />
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
import { onMounted, nextTick, watch, computed } from 'vue'
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import GlobalCardModal from './components/GlobalCardModal.vue';
import BubbleTooltip from './components/BubbleTooltip.vue';

const store = useStore()
const router = useRouter()

// Use theme from Vuex store
const currentTheme = computed(() => store.getters['theme/getCurrentTheme'])
const bubbleData = computed(() => store.getters['bubbleTooltip/getBubbleData'])

// Create a watcher for route changes to close the modal and bubble tooltip when navigating
watch(
  () => router.currentRoute.value.path,
  (newPath, oldPath) => {
    // Only close UI elements if we're actually changing paths (not just query params)
    if (newPath !== oldPath) {
      // Check if modal is visible before trying to close it
      if (store.getters['cardModal/isCardModalVisible']) {
        store.dispatch('cardModal/hideCardModal');
      }
      
      // Hide bubble tooltip if visible
      if (store.getters['bubbleTooltip/isBubbleVisible']) {
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

// Use theme toggle from Vuex store
const toggleTheme = () => {
  store.dispatch('theme/toggleTheme');
  
  // Add the spin animation class
  const button = document.querySelector('.theme-toggle');
  button.classList.add('spin');

  // Remove the spin class after the animation ends
  setTimeout(() => {
    button.classList.remove('spin');
  }, 200); // Match the duration of the animation
}

onMounted(async () => {
  // Initialize theme from localStorage or system preference
  store.dispatch('theme/initTheme');
  
  // Verify user exists in database on each app load/refresh
  await verifyUserExists();
  
  // Load dictionary data
  await Promise.all([
    store.dispatch("fetchDictionaryData"),
    store.dispatch("fetchCustomDictionaryData")
  ]);
  
  // Wait for the next tick to ensure the router and store are fully initialized
  nextTick(() => {
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