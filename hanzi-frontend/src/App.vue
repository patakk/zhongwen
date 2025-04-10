<template>
  <div id="app" :data-theme="theme">
    <button class="theme-toggle" @click="toggleTheme">
      {{ theme === 'dark' ? '🌞' : '🌙' }}
    </button>
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'


const theme = ref(localStorage.getItem('theme') || 'light')

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  document.documentElement.setAttribute('data-theme', theme.value)
}

onMounted(() => {
  // Check system preference on first load
  if (!localStorage.getItem('theme')) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.value = prefersDark ? 'dark' : 'light'
    localStorage.setItem('theme', theme.value)
  }
  document.documentElement.setAttribute('data-theme', theme.value)
})
</script>