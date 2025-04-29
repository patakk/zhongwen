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