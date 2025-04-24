<template>
    <BasePage page_title="Delete Account" />
  
    <div class="delete-container">
      <h2>Confirm Account Deletion</h2>
      <p>
        Are you sure you want to delete your account <b>{{ username }}</b>? This cannot be undone.
      </p>
      <div class="actions">
        <button @click="deleteAccount" :disabled="loading" class="btn btn-danger">
          {{ loading ? "Deleting..." : "Delete Account" }}
        </button>
        <RouterLink to="/account" class="btn">Cancel</RouterLink>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </template>
  
  <script setup>
  import BasePage from '../components/BasePage.vue'
  import { computed, ref } from 'vue'
  import { useStore } from 'vuex'
  import { useRouter } from 'vue-router'
  
  const store = useStore()
  const router = useRouter()
  const username = computed(() => store.getters.getUsername)
  const loading = ref(false)
  const error = ref('')
  
  async function deleteAccount() {
    loading.value = true
    error.value = ''
    try {
      // Update API endpoint to match the one in manage.py
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        credentials: 'include',
      })
      
      if (res.ok) {
        // Immediately redirect to home page
        window.location.href = '/'
        // No need to dispatch logout since the session is cleared server-side
        // and the page refresh will reset the app state
      } else {
        const data = await res.json()
        error.value = data.message || 'Failed to delete account.'
      }
    } catch (e) {
      error.value = e.message || 'An error occurred.'
    }
    loading.value = false
  }
  </script>
  
  <style scoped>
  .delete-container {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem;
    background: #fffbe8;
    border: 1px solid #ffeecc;
    border-radius: 8px;
  }
  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  .btn {
    background: #eee;
    border-radius: 5px;
    padding: .4rem 1rem;
    font-weight: bold;
    color: #333;
    border: none;
    text-decoration: none;
    cursor: pointer;
  }
  .btn-danger {
    color: #900;
    background: #fff0f0;
    border: 1px solid
    #faa;
    }
  .error {
    color: #900;
    margin-top: 1rem;
    font-weight: bold;
    }
</style>