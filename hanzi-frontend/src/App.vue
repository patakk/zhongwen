<template>
  <div id="app" :data-theme="currentTheme">
    <button class="theme-toggle" @click="toggleTheme">
      <font-awesome-icon :icon="faMoon" v-if="currentTheme === 'dark'" />
      <font-awesome-icon :icon="faSun" v-else-if="currentTheme === 'theme1'" />
      <font-awesome-icon :icon="faMoon" v-else-if="currentTheme === 'theme2'" />
      <font-awesome-icon :icon="faSun" v-else />
    </button>
    <div class="history-rail-wrapper" v-if="history.length > 0">
      <div
        class="history-rail"
        :style="{ top: railTop + 'px' }"
        ref="historyRail"
        @mousedown="startDrag"
        @touchstart="startDrag"
      >
        <div
          class="history-title"
          @click.stop="toggleHistoryCollapse"
        >
          <font-awesome-icon :icon="faClipboardList" />
        </div>
        <div class="history-list" :class="{ collapsed: historyCollapsed }">
          <button
            v-for="(item, idx) in history"
            :key="item"
            class="history-item"
            @click="openHistory(item, idx)"
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
import { faSun } from '@/icons';
import { faMoon } from '@/icons';
import { faClipboardList } from '@/icons';
import GlobalCardModal from './components/GlobalCardModal.vue';
import BubbleTooltip from './components/BubbleTooltip.vue';

const store = useStore()
const router = useRouter()
const preserveHistoryRef = ref(false)

// History rail dragging
const historyRail = ref(null)
const isDragging = ref(false)
const isDragCandidate = ref(false)
const hadDragged = ref(false)
const railTop = ref(48) // Initial top position (3rem = 48px)
const dragStartY = ref(0)
const dragStartTop = ref(0)
const dragStartTarget = ref(null)
const historyCollapsed = ref(false)
const suppressClick = ref(false)

// Use theme from Vuex store
const currentTheme = computed(() => store.getters['theme/getCurrentTheme'])
const bubbleData = computed(() => store.getters['bubbleTooltip/getBubbleData'])
const history = computed(() => store.getters['zihistory/getHistory'])
const lastConfettiTime = ref(0)

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

const openHistory = (word, idx = null) => {
  if (suppressClick.value) return
  if (!word) return;
  preserveHistoryRef.value = true;
  const list = history.value || []
  if (list && list.length) {
    store.dispatch('cardModal/setNavContext', { list, current: word, index: idx })
  }
  const payload = { character: word, preserveHistoryOrder: true }
  if (typeof idx === 'number') payload.index = idx
  store.dispatch('cardModal/showCardModal', payload);
}

const toggleHistoryCollapse = () => {
  if (suppressClick.value) return
  historyCollapsed.value = !historyCollapsed.value
}

// Drag functions
const startDrag = (e) => {
  const target = e.target
  const targetEl = target && 'closest' in target ? target : target?.parentElement
  const isHistoryTitle = targetEl && targetEl.closest('.history-title')
  dragStartTarget.value = targetEl
  isDragCandidate.value = true
  isDragging.value = false
  const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY
  dragStartY.value = clientY
  dragStartTop.value = railTop.value

  // Add event listeners
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)

  // Prevent text selection
}

const onDrag = (e) => {
  if ((!isDragCandidate.value && !isDragging.value) || !historyRail.value) return

  if (isDragging.value && e.cancelable) e.preventDefault()

  const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
  const deltaY = clientY - dragStartY.value
  if (!isDragging.value) {
    if (Math.abs(deltaY) < 4) return
    isDragging.value = true
    hadDragged.value = true
  }
  let newTop = dragStartTop.value + deltaY

  // Get rail dimensions
  const railHeight = historyRail.value.offsetHeight
  const viewportHeight = window.innerHeight

  // Constrain within viewport
  const minTop = 0
  const maxTop = viewportHeight - railHeight
  newTop = Math.max(minTop, Math.min(maxTop, newTop))

  railTop.value = newTop

  // Emit character confetti while dragging if history exists
  if (history.value && history.value.length) {
    //emitHistoryConfetti()
  }
}

const emitHistoryConfetti = () => {
  const now = performance.now()
  if (now - lastConfettiTime.value < 90) return
  lastConfettiTime.value = now
  const railEl = historyRail.value
  if (!railEl) return
  const rect = railEl.getBoundingClientRect()
  const char = history.value[Math.floor(Math.random() * history.value.length)] || ''
  if (!char) return
  const span = document.createElement('span')
  span.className = 'history-confetti'
  span.textContent = char
  span.style.left = `${rect.left - 8}px`
  span.style.top = `${rect.top + rect.height / 2}px`
  const x0 = 0
  const y0 = -100 + Math.random() * 200
  const dx = -40 - Math.random() * 60
  const dy = 40 + Math.random() * 140
  const rot = (Math.random() * 60 - 30).toFixed(1)
  span.style.setProperty('--x0', `${x0}px`)
  span.style.setProperty('--y0', `${y0}px`)
  span.style.setProperty('--dx', `${dx}px`)
  span.style.setProperty('--dy', `${dy}px`)
  span.style.setProperty('--rot', `${rot}deg`)
  document.body.appendChild(span)
  const remove = () => span.remove()
  span.addEventListener('animationend', remove, { once: true })
}

const stopDrag = () => {
  isDragging.value = false
  isDragCandidate.value = false
  const startedOnTitle = dragStartTarget.value && dragStartTarget.value.closest('.history-title')
  if (!hadDragged.value && startedOnTitle) {
    toggleHistoryCollapse()
    suppressClick.value = true
    setTimeout(() => { suppressClick.value = false }, 80)
  }
  if (hadDragged.value) {
    suppressClick.value = true
    setTimeout(() => { suppressClick.value = false }, 80)
  }
  hadDragged.value = false
  dragStartTarget.value = null

  // Remove event listeners
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

onMounted(async () => {
  // Initialize theme from localStorage or system preference
  store.dispatch('theme/initTheme');
  
  // Verify user exists in database on each app load/refresh
  await verifyUserExists();
  
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
  z-index: 10;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.0rem;
  padding: 0.5rem;
  border: 1px solid color-mix(in oklab, var(--fg) 10%, var(--bg) 100%);
  background: color-mix(in oklab, var(--fg) 3%, var(--bg) 100%);
  border-radius: var(--border-radius, 4px);
  touch-action: none;
}
.history-title {
  font-size: 1.25rem;
  text-transform: uppercase;
  text-align: center;
  color: color-mix(in oklab, var(--fg) 70%, var(--bg) 30%);
  letter-spacing: 0.04em;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  padding: 0.25rem 0;
  touch-action: none;
}
  .history-title:active {
    cursor: grabbing;
  }
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-top: 0.5em;
    max-height: 60vh;
    overflow: hidden;
    transition: max-height 0.25s ease, padding 0.25s ease;
  }
  .history-list.collapsed {
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
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
    font-weight: var(--hanzi-weight) !important;
  }
  .history-item:focus,
  .history-item:focus-visible {
    outline: none;
    box-shadow: none;
  }
  .history-item:hover {
    background: color-mix(in oklab, var(--fg) 12%, var(--bg) 100%);
  }

  .history-confetti {
    position: fixed;
    pointer-events: none;
    font-size: 1.2rem;
    color: var(--fg);
    opacity: 0.9;
    animation: history-confetti-fall 0.8s ease-in forwards;
    will-change: transform, opacity;
  }

  @keyframes history-confetti-fall {
    0% { transform: translate3d(var(--x0), var(--y0), 0) rotate(0deg) scale(1); opacity: 1; }
    100% { transform: translate3d(var(--dx), var(--dy), 0) rotate(var(--rot)) scale(0.9); opacity: 0.0; }
  }

  
</style>
