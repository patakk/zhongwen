<template>
    <BasePage page_title="Account" />
  
    <div class="account-container" v-if="loggedIn">
      <h2>Account Info</h2>
      <div class="profile-row">
        <label>Username:</label> <span>{{ username }}</span>
      </div>
      <div class="profile-row">
        <label>Email:</label>
        <span>
          {{ email || 'Not set' }}
          <span v-if="email && !emailVerified" class="warn">(Unverified)</span>
        </span>
      </div>
      <div class="profile-row">
        <label>Profile Picture:</label>
        <span>
          <img v-if="image" :src="image" alt="Profile" class="profile-pic" />
          <span v-else>No profile picture</span>
        </span>
      </div>
      <div class="profile-row">
        <label>Google Linked:</label>
        <span>{{ googleLinked ? "Yes" : "No" }}</span>
      </div>
      <div class="account-actions">
        <LogoutButton v-if="authStatus" />
        <!-- <RouterLink to="/api/delete-account" class="btn btn-danger">Delete Account</RouterLink> -->
        <!-- Buttons for link/unlink Google -->
        <button v-if="!googleLinked" class="btn" @click="linkGoogle">Link Google Account</button>
        <button v-else class="btn" @click="unlinkGoogle">Unlink Google Account</button>
        <!-- Button for changing password can be added here -->
      </div>
    </div>
    <div v-else>
      <p>Please log in to view your account.</p>
      <RouterLink to="/login" class="btn">Login</RouterLink>
    </div>
  </template>
  
  <script setup>
  import BasePage from '../components/BasePage.vue'
  import LogoutButton from '../components/LogoutButton.vue'
  import { computed } from 'vue'
  import { useStore } from 'vuex'
  import { useRouter } from 'vue-router'
  
  const store = useStore()
  const router = useRouter()
  
  const loggedIn = computed(() => store.getters.getAuthStatus)
  const username = computed(() => store.getters.getUsername)
  const profile = computed(() => store.getters.getProfile)
  const image = computed(() => store.getters.getImage)
  
  // Profile fields
  const email = computed(() => profile.value?.email || '')
  const emailVerified = computed(() => profile.value?.email_verified || false)
  
  // Google linked (google_id set in backend, fetch in profile if needed)
  const googleLinked = computed(() => !!profile.value?.google_id)

  // set computed
  const authStatus = computed(() => store.getters.getAuthStatus)
  
  
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

  // Link/unlink handlers
  async function linkGoogle() {
    try {
      console.log("Linking Google account...");
      // Create a form to submit a POST request
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/google_auth/link_account';
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      console.error("Error initiating Google link:", e);
      alert("An error occurred. Please try again.");
    }
  }
  
  async function unlinkGoogle() {
    try {
      console.log("Unlinking Google account...");
      const res = await fetch('/api/google_auth/unlink_account', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      console.log("Response status:", res.status);
      
      if (res.ok) {
        try {
          const data = await res.json();
          console.log("Response data:", data);
          // Refresh user data to update the UI
          await store.dispatch('fetchUserData');
          // Optional: Show a success message to the user
          alert(data.message || "Successfully unlinked Google account");
        } catch (jsonError) {
          console.error("Error parsing JSON:", jsonError);
          // If JSON parsing fails but status was 200, still consider it successful
          await store.dispatch('fetchUserData');
          alert("Successfully unlinked Google account");
        }
      } else {
        // Handle error response
        console.error("Error response:", res.status, res.statusText);
        alert("Failed to unlink Google account. Please try again.");
      }
    } catch (e) {
      console.error("Error unlinking Google account:", e);
      alert("An error occurred. Please try again.");
      
      // Despite the error, still try to refresh user data
      // as the backend operation might have succeeded
      await store.dispatch('fetchUserData');
    }
  }
  
  </script>
  
  <style scoped>
  .account-container {
    max-width: 450px;
    margin: 2rem auto;
    padding: 2rem;
    border: 1px solid color-mix(in oklab, var(--fg) 2%, var(--bg) 100%);
    border-radius: 8px;
    background: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);;
  }
  .profile-row {
    display: flex;
    align-items: center;
    margin-bottom: 0.7rem;
  }
  .profile-row label {
    width: 120px;
  }
  .profile-pic {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    vertical-align: middle;
    border: 1px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 100%);;
  }
  .account-actions {
    margin-top: 1.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .btn {
    background: #eee;
    border-radius: 5px;
    padding: .4rem 1rem;
    font-weight: bold;
    color: #333;
    text-decoration: none;
    border: none;
    cursor: pointer;
  }
  .btn-danger {
    color: #900;
    background: color-mix(in oklab, #f00 5%, var(--bg) 100%);;
    border: 1px solid #faa;
  }
  .warn {
    color: #d98d00;
    font-size: 0.92em;
    margin-left: 8px;
  }
  </style>