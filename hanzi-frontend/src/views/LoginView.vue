<template>
  <BasePage page_title="Login" />
  <div class="loginregister-container">
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
    
    <div class="register-link">
      Don't have an account? <RouterLink to="/register">Register</RouterLink>
    </div>
    
    <div class="google-divider">
      <span>or</span>
    </div>

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
    await store.dispatch('saveUserDataToStorage')
    // Make sure to await fetchUserData to ensure profile data is completely up-to-date before navigation
    await store.dispatch('fetchUserData')
    await store.dispatch('fetchCustomDictionaryData')

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

<style>

[data-theme='light'] {
  --google-color: color-mix(in oklab, var(--fg) 57%, var(--bg) 100%);
  --bgc-color: color-mix(in oklab, var(--fg) 37%, var(--bg) 100%);
}

[data-theme='dark'] {
  --google-color: color-mix(in oklab, var(--fg) 77%, var(--bg) 50%);
  --bgc-color: color-mix(in oklab, var(--fg) 47%, var(--bg) 100%);
}
</style>

<style scoped>

input {
  display: block;
  width: 100%;
  margin-bottom: 1rem;
  padding: .5rem;
  color: var(--fg);
  outline: none;
  border: 1px solid color-mix(in oklab, var(--fg) 35%, var(--bg) 100%);
  background: color-mix(in oklab, var(--fg) 2%, var(--bg) 100%);
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
  cursor: pointer;
}
button {
  width: 100%;
  color: var(--fg);
  background: color-mix(in oklab, var(--fg) 10%, var(--bg) 100%);
  border: 2px solid color-mix(in oklab, var(--fg) 10%, var(--bg) 100%);
}
button:hover {
  background: color-mix(in oklab, var(--fg) 42%, var(--bg) 40%);
}
.error {
  color: #d33;
  margin-top: 1rem;
}

.register-link {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.register-link a {
  color: var(--primary-color, #4285f4);
  text-decoration: underline;
}

.register-link a:hover {
  opacity: 0.8;
}

.google-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: var(--google-color);
}

.google-divider::before,
.google-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--bgc-color);
}

.google-divider span {
  padding: 0 10px;
}

.google-login {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  color: #757575;
  border: 1px solid #dddddd;
  border-radius: 4px;
}

.google-login:hover {
  background-color: #f5f5f5;
}

@media (max-width: 768px) {
}


</style>
