<template>
  <div id="app" :data-theme="currentTheme">
    <button class="theme-toggle" @click="toggleTheme">
      <font-awesome-icon :icon="['fas', 'moon']" v-if="currentTheme === 'dark'" />
      <font-awesome-icon :icon="['fas', 'sun']" v-else-if="currentTheme === 'theme1'" />
      <font-awesome-icon :icon="['fas', 'moon']" v-else-if="currentTheme === 'theme2'" />
      <font-awesome-icon :icon="['fas', 'sun']" v-else />
    </button>
    <div class="history-rail-wrapper" v-if="history.length > 0">
      <div class="history-rail">
        <div class="history-title">History</div>
        <div class="history-list">
          <button
            v-for="(item, idx) in history"
            :key="item"
            class="history-item"
            @click="openHistory(item)"
          >
            {{ item }}
          </button>
        </div>
      </div>
    </div>
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
import { onMounted, nextTick, watch, computed, ref } from 'vue'
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import GlobalCardModal from './components/GlobalCardModal.vue';
import BubbleTooltip from './components/BubbleTooltip.vue';

const store = useStore()
const router = useRouter()
const preserveHistoryRef = ref(false)

// Use theme from Vuex store
const currentTheme = computed(() => store.getters['theme/getCurrentTheme'])
const bubbleData = computed(() => store.getters['bubbleTooltip/getBubbleData'])
const history = computed(() => store.getters['zihistory/getHistory'])

// Close modal/bubble when navigating to a different path
watch(
  () => router.currentRoute.value.path,
  (newPath, oldPath) => {
    if (newPath !== oldPath) {
      if (store.getters['cardModal/isCardModalVisible']) {
        store.dispatch('cardModal/hideCardModal');
      }
      if (store.getters['bubbleTooltip/isBubbleVisible']) {
        store.dispatch('bubbleTooltip/hideBubble');
      }
    }
  }
);

// Sync modal with ?word= changes on the same path
watch(
  () => router.currentRoute.value.query.word,
  (newWord, oldWord) => {
    const path = router.currentRoute.value.path || '';
    // Ignore dedicated word pages
    if (path.startsWith('/word/')) return;
    if (newWord) {
      const preserve = preserveHistoryRef.value;
      preserveHistoryRef.value = false;
      store.dispatch('cardModal/showCardModal', { character: newWord, preserveHistoryOrder: preserve });
    } else {
      preserveHistoryRef.value = false;
      if (store.getters['cardModal/isCardModalVisible']) {
        store.dispatch('cardModal/hideCardModal');
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

  // Remove the spin class after the animation ends
}

const openHistory = (word) => {
  if (!word) return;
  preserveHistoryRef.value = true;
  store.dispatch('cardModal/showCardModal', { character: word, preserveHistoryOrder: true });
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
  /* History rail */
  
  .history-rail-wrapper {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    display: flex;
    align-items: center;
    z-index: 10;
  }

  .history-rail {
    position: fixed;
    top: 1rem;
    z-index: 10;
    right: 1rem;
    display: flex;
    flex-direction: column;
    top: 50%;
    transform: translateY(-50%);
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid color-mix(in oklab, var(--fg) 10%, var(--bg) 100%);
    background: color-mix(in oklab, var(--fg) 3%, var(--bg) 100%);
    border-radius: var(--border-radius, 4px);
  }
  .history-title {
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    text-align: center;
    color: color-mix(in oklab, var(--fg) 70%, var(--bg) 30%);
    letter-spacing: 0.04em;
  }
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .history-item {
    cursor: pointer;
    border: 1px solid color-mix(in oklab, var(--fg) 20%, var(--bg) 100%);
    background: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
    color: var(--fg);
    font-family: var(--main-word-font, 'Noto Serif SC', 'Kaiti', serif);
    font-size: 1.1rem;
    padding: 0.35rem 0.25rem;
    text-align: center;
    border-radius: var(--border-radius, 4px);
  }
  .history-item:hover {
    background: color-mix(in oklab, var(--fg) 12%, var(--bg) 100%);
  }

  
</style>