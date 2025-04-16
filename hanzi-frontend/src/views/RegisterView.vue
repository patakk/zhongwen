<template>
  <BasePage page_title="Register" />

  <div class="register-container">
    <form @submit.prevent="handleRegister">
      <div>
        <label for="username">Username:</label>
        <input id="username" v-model="username" required autocomplete="username" />
      </div>
      <div>
        <label for="email">Email (optional):</label>
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

    <!-- Optional extra Register button -->
    <button @click="handleRegister" :disabled="loading" class="register-button">
      Register
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
    router.push('/account')
  } catch (err) {
    error.value = err.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
  border-radius: 8px;
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
}
input {
  display: block;
  width: 100%;
  margin-bottom: 1rem;
  padding: .5rem;
  box-sizing: border-box;
}
button {
  padding: .5rem 1rem;
  margin-top: 1rem;
}
.register-button {
  width: 100%;
  background: color-mix(in oklab, var(--fg) 2%, var(--bg) 100%);
  border: 1px solid color-mix(in oklab, var(--fg) 7%, var(--bg) 100%);
}
.error {
  color: #d33;
  margin-top: 1rem;
}
</style>
