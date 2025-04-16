<template>
  <BasePage page_title="Login" />
  <div class="login-container">
    <form @submit.prevent="handleLogin">
      <div>
        <label for="username">Username:</label>
        <input id="username" v-model="username" required autocomplete="username" />
      </div>
      <div>
        <label for="password">Password:</label>
        <input id="password" v-model="password" required type="password" autocomplete="current-password" />
      </div>

    </form>

    <button @click="handleLogin" :disabled="loading" class="login-button">
      Login
    </button>

    <hr />

    <button @click="loginWithGoogle" class="google-login">
      <img class="google-logo" src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/google.svg" alt="Google" width="20" style="vertical-align:middle; margin-right:8px;">
      Continue with Google
    </button>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
import BasePage from '../components/BasePage.vue'
import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error || 'Invalid credentials')
    }

    const data = await response.json()
    store.commit('setUserData', data)
    store.dispatch('saveUserDataToStorage')
    store.dispatch('fetchUserData')
    store.dispatch('fetchCustomDictionaryData')

    router.push('/')
  } catch (err) {
    error.value = err.message || 'Login failed'
  } finally {
    loading.value = false
  }
}

const loginWithGoogle = () => {
  window.location.href = '/api/google_auth/login'
}
</script>

<style scoped>
.login-container {
  max-width: 380px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
  border-radius: 8px;
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  box-sizing: border-box;
}
input {
  display: block;
  width: 100%;
  margin-bottom: 1rem;
  padding: .5rem;
  box-sizing: border-box;
}

hr {
  width: 100%;
  opacity: 0.5;
  margin: 1.5em 0;
}

button {
  padding: .5rem 1rem;
  margin-top: 1rem;
}
.login-button {
  width: 100%;
  color: var(--fg);
  background: color-mix(in oklab, var(--fg) 12%, var(--bg) 100%);
  border: 2px solid color-mix(in oklab, var(--fg) 10%, var(--bg) 100%);
}
.login-button:hover {
  background: color-mix(in oklab, var(--fg) 22%, var(--bg) 100%);
}
.google-login {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklab, var(--fg) 2%, var(--bg) 100%);
  color: color-mix(in oklab, var(--fg) 57%, var(--bg) 100%);
  border: 1px solid color-mix(in oklab, var(--fg) 22%, var(--bg) 100%);
  border-radius: 4px;
  cursor: pointer;
  margin: 0;
}
.error {
  color: #d33;
  margin-top: 1rem;
}


body [data-theme="dark"] .google-logo {
  filter: invert(1);
}

@media (max-aspect-ratio: 1/1) {
  .login-container {
    width: 100%;
    margin: 2rem auto;
  }
}


</style>
