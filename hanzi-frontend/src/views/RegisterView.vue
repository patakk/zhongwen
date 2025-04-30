<template>
  <BasePage page_title="Register" />

  <div class="loginregister-container">
    <form @submit.prevent="handleRegister">
      <div>
        <label for="username">Username:</label>
        <input id="username" v-model="username" required autocomplete="username" />
      </div>
      <div>
        <label for="email">Email <span style="font-size: .8em;">(optional, used for recovery):</span> </label>
        <input id="email" v-model="email" type="email" autocomplete="email" />
      </div>
      <div>
        <label for="password">Password:</label>
        <input id="password" v-model="password" required type="password" autocomplete="new-password" />
      </div>
      <div>
        <label for="confirm_password">Confirm Password:</label>
        <input id="confirm_password" v-model="confirmPassword" required type="password" autocomplete="new-password" />
      </div>
    </form>

    <!-- Register button -->
    <button @click="handleRegister" :disabled="loading" class="register-button">
      Register
    </button>

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
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  loading.value = true

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords don't match"
    loading.value = false
    return
  }

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        email: email.value || '',
        password: password.value,
        confirm_password: confirmPassword.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      error.value = data.error || 'Failed to register'
      loading.value = false
      return
    }

    store.commit('setUserData', data)
    await store.dispatch('saveUserDataToStorage')
    // Fetch user data again to ensure all profile details are up-to-date
    await store.dispatch('fetchUserData')
    router.push('/account')
  } catch (err) {
    error.value = err.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}

const loginWithGoogle = () => {
  window.location.href = '/api/google_auth/login'
}

</script>

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

input:focus {
  border: 1px solid color-mix(in oklab, var(--fg) 100%, var(--bg) 100%);
}


button {
  padding: .5rem 1rem;
  margin-top: 1rem;
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

.google-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: color-mix(in oklab, var(--fg) 1%, var(--bg) 100%);
  border: 1px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 100%);
  color: var(--fg);
  padding: .5rem;
  cursor: pointer;
  font-weight: 500;
}

.google-button:hover {
  background: color-mix(in oklab, var(--fg) 8%, var(--bg) 100%);
}

.google-icon {
  width: 1.2em;
  height: 1.2em;
  margin-right: 0.8em;
}

</style>
