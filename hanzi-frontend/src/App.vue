<template>
  <div id="app" :data-theme="theme">
    <button class="theme-toggle" @click="toggleTheme">
      <font-awesome-icon :icon="['fas', 'moon']" v-if="theme === 'dark'" />
      <font-awesome-icon :icon="['fas', 'sun']" v-else />
    </button>
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

import { useStore } from "vuex";  // Import Vuex store

const store = useStore()  // Access the Vuex store

const theme = ref(localStorage.getItem('theme') || 'light')

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

onMounted(() => {
  // Check system preference on first load if no theme is set in localStorage
  if (!localStorage.getItem('theme')) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.value = prefersDark ? 'dark' : 'light'
    localStorage.setItem('theme', theme.value)
  }
  document.documentElement.setAttribute('data-theme', theme.value)
})

store.dispatch("fetchDictionaryData");
store.dispatch("fetchCustomDictionaryData");
</script>

<style>
  
</style>