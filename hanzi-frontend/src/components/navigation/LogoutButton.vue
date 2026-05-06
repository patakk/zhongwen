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
    cursor: pointer;
    font-size: 1em;
    transition: background .15s;
    
    border: 1px solid color-mix(in oklab, var(--fg) 15%, transparent 50%);
    box-shadow: inset 0 1.0px 0 var(--highlight);
  }
  .logout-btn:disabled {
    background: #aaa;
    cursor: not-allowed;
  }
  
  </style>