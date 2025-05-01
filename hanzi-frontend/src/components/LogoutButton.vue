<template>
    <button class="logout-btn" @click="logout" :disabled="loading">
      <span v-if="loading">Logging out…</span>
      <span v-else>Logout</span>
    </button>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useStore } from 'vuex'
  import { useRouter } from 'vue-router'
  
  const store = useStore()
  const router = useRouter()
  const loading = ref(false)
  
  async function logout() {
    loading.value = true
    try {
      await fetch('/api/logout', {
        method: 'GET',
        credentials: 'include',
      })
    } catch {}
    store.dispatch('logout')
    router.push('/')
  }
  </script>
  
  <style scoped>
  .logout-btn {
    padding: .4rem 1.2rem;
    background: #e73c3c;
    color: #fff;
    border: none;
    cursor: pointer;
    font-size: 1em;
    transition: background .15s;
  }
  .logout-btn:disabled {
    background: #aaa;
    cursor: not-allowed;
  }
  
  [data-theme="theme1"] .logout-btn {
      box-shadow: none;
      border: 3px solid black;
      border-radius: 1em;
      box-shadow: 4px 4px 0px 0px rgb(0, 0, 0);
    }
    
  [data-theme="theme1"] .logout-btn:hover {
    box-shadow: 0 4px 12px color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
    box-shadow: 2px 2px 0px 0px var(--fg);
    transform: translate(2px, 2px);
    color: var(--bg);
  }
  </style>