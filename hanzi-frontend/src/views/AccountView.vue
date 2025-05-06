<template>
    <BasePage page_title="Settings" />

    <!-- Theme Settings Section (Available to all users) -->
    <div class="account-container">
      <div class="settings-section theme-settings">
        <h3>Appearance</h3>
        <div class="section-divider"></div>
        <div class="theme-selection">
          <div class="theme-option-label">Theme:</div>
          <div class="theme-buttons">
            <button 
              class="theme-button" 
              :class="{ 'active': isDefaultThemeSystem }" 
              @click="selectThemeSystem('default')"
            >
              Classic
            </button>
            <button 
              class="theme-button" 
              :class="{ 'active': !isDefaultThemeSystem }" 
              @click="selectThemeSystem('custom')"
            >
              Tooney
            </button>
          </div>
        </div>
        <!-- <div class="current-theme">
          <div class="theme-option-label">Current Theme:</div>
          <div class="theme-value">{{ currentThemeName }}</div>
          <button class="btn theme-toggle-btn" @click="toggleCurrentTheme">Toggle Theme</button>
        </div> -->
      </div>
    </div>

    <!-- Account Settings Section (Only for logged-in users) -->
    <div v-if="loggedIn" class="account-container">
        <h3>Account</h3>
        <div class="section-divider"></div>

      <div class="profile-info-grid">
        <div class="profile-row">
          <div class="profile-label">Username:</div>
          <div class="profile-value">
            {{ username }}
            <button @click="openUsernameModal" class="btn-small btn-change-username">Change Username</button>
          </div>
        </div>
        <div class="profile-row">
          <div class="profile-label">Email:</div>
          <div class="profile-value">
            {{ email || 'Not set' }}
            <span v-if="email" :class="{ 'status-verified': emailVerified, 'status-unverified': !emailVerified }">
              ({{ emailVerified ? 'Verified' : 'Unverified' }})
            </span>
            <button v-if="email && !emailVerified && !googleLinked" @click="resendVerification" class="btn-small btn-verify">Resend Verification</button>
          </div>
        </div>
        <div class="profile-row">
          <div class="profile-label">Profile Picture:</div>
          <div class="profile-value">
            <img v-if="image" :src="image" alt="Profile" class="profile-pic" />
            <span v-else>No profile picture</span>
          </div>
        </div>
        <div class="profile-row">
          <div class="profile-label">Login Method:</div>
          <div class="profile-value">{{ googleLinked ? "Google Account" : (hasPassword ? "Password" : "Unknown") }}</div>
        </div>
      </div>

      <div class="account-actions">
        <template v-if="!googleLinked">
            <button v-if="!email" @click="openEmailModal('add')" class="btn">Add Email</button>
            <button v-else @click="openEmailModal('change')" class="btn">Change Email</button>
        </template>

        <template v-if="!googleLinked">
            <button v-if="hasPassword" @click="openPasswordModal('change')" class="btn">Change Password</button>
            <button v-else @click="openPasswordModal('add')" class="btn">Set Password</button>
        </template>

        <button v-if="!googleLinked" class="btn google-btn" @click="linkGoogle">
          <img class="google-logo" src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/google.svg" alt="Google" width="20" style="vertical-align:middle; margin-right:8px;">
          Link Google Account
        </button>
        <button v-else class="btn" @click="openUnlinkModal">Unlink Google Account</button>

        <LogoutButton v-if="authStatus" />
      </div>
      
      <div class="danger-zone">
        <h3>Danger Zone</h3>
        <p>Permanently delete your account and all associated data.</p>
        <button @click="openDeleteConfirmModal" class="btn btn-danger delete-account-btn">Delete Account</button>
      </div>
    </div>

    <!-- Rest of modals and ui components -->
    <div v-if="showEmailModal" class="modal-overlay" @click="closeEmailModal">
      <div class="modal-content" @click.stop>
        <h3>{{ emailModalMode === 'add' ? 'Add' : 'Change' }} Email</h3>
        <p v-if="emailModalMode === 'change'">A verification link will be sent to the new address.</p>
        <div class="modal-form">
          <label for="email-input">Email Address:</label>
          <input
            id="email-input"
            type="email"
            v-model="emailInput"
            placeholder="Enter email address"
            @keyup.enter="submitEmail"
            @keyup.esc="closeEmailModal"
            ref="emailModalInput"
            autocomplete="email"
          />
        </div>
        <div v-if="modalError" class="modal-error">{{ modalError }}</div>
        <div class="modal-buttons">
          <button @click="closeEmailModal" class="cancel-button">Cancel</button>
          <button @click="submitEmail" class="confirm-button" :disabled="modalLoading">
            {{ modalLoading ? 'Sending...' : 'Submit' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showPasswordModal" class="modal-overlay" @click="closePasswordModal">
      <div class="modal-content" @click.stop>
        <h3>{{ passwordModalMode === 'add' ? 'Set' : 'Change' }} Password</h3>
        <div class="modal-form">
          <label v-if="passwordModalMode === 'change'" for="current-password-input">Current Password:</label>
          <input
            v-if="passwordModalMode === 'change'"
            id="current-password-input"
            type="password"
            v-model="currentPasswordInput"
            placeholder="Enter current password"
            ref="currentPasswordModalInput"
            autocomplete="current-password"
          />
          <label for="new-password-input">New Password:</label>
          <input
            id="new-password-input"
            type="password"
            v-model="newPasswordInput"
            placeholder="Enter new password (min 6 chars)"
            @keyup.enter="submitPassword"
            @keyup.esc="closePasswordModal"
            ref="newPasswordModalInput"
            autocomplete="new-password"
          />
          <label for="confirm-password-input">Confirm New Password:</label>
          <input
            id="confirm-password-input"
            type="password"
            v-model="confirmPasswordInput"
            placeholder="Confirm new password"
            @keyup.enter="submitPassword"
            @keyup.esc="closePasswordModal"
            autocomplete="new-password"
          />
        </div>
        <div v-if="modalError" class="modal-error">{{ modalError }}</div>
        <div class="modal-buttons">
          <button @click="closePasswordModal" class="cancel-button">Cancel</button>
          <button @click="submitPassword" class="confirm-button" :disabled="modalLoading">
            {{ modalLoading ? 'Saving...' : 'Save Password' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showUnlinkModal" class="modal-overlay" @click="closeUnlinkModal">
      <div class="modal-content" @click.stop>
        <h3>Set Password to Unlink Google</h3>
        <p>To unlink your Google account, please set a password for standard login.</p>
        <div class="modal-form">
          <label for="unlink-new-password-input">New Password:</label>
          <input
            id="unlink-new-password-input"
            type="password"
            v-model="newPasswordInput"
            placeholder="Enter new password (min 6 chars)"
            @keyup.enter="submitUnlink"
            @keyup.esc="closeUnlinkModal"
            ref="unlinkModalInput"
            autocomplete="new-password"
          />
          <label for="unlink-confirm-password-input">Confirm New Password:</label>
          <input
            id="unlink-confirm-password-input"
            type="password"
            v-model="confirmPasswordInput"
            placeholder="Confirm new password"
            @keyup.enter="submitUnlink"
            @keyup.esc="closeUnlinkModal"
            autocomplete="new-password"
          />
        </div>
        <div v-if="modalError" class="modal-error">{{ modalError }}</div>
        <div class="modal-buttons">
          <button @click="closeUnlinkModal" class="cancel-button">Cancel</button>
          <button @click="submitUnlink" class="confirm-button" :disabled="modalLoading">
            {{ modalLoading ? 'Processing...' : 'Set Password & Unlink' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteConfirmModal" class="modal-overlay" @click="closeDeleteConfirmModal">
      <div class="modal-content" @click.stop>
        <h3>Confirm Account Deletion</h3>
        <div class="modal-message">
          <p><strong>Warning:</strong> {{ confirmDeleteData.message }}</p>
          <p>All your data, including wordlists and progress, will be lost. This action cannot be undone.</p>
        </div>
         <div v-if="modalError" class="modal-error">{{ modalError }}</div>
        <div class="modal-buttons">
          <button @click="closeDeleteConfirmModal" class="cancel-button">Cancel</button>
          <button @click="deleteAccountConfirmed" class="confirm-button delete-confirm-button" :disabled="modalLoading">
             {{ modalLoading ? 'Deleting...' : 'Delete My Account' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showUsernameModal" class="modal-overlay" @click="closeUsernameModal">
      <div class="modal-content" @click.stop>
        <h3>Change Username</h3>
        <p>This will change your username and you'll need to use the new username to log in.</p>
        <div class="modal-form">
          <label for="username-input">New Username:</label>
          <input
            id="username-input"
            type="text"
            v-model="usernameInput"
            placeholder="Enter new username (min 3 chars)"
            @keyup.enter="submitUsername"
            @keyup.esc="closeUsernameModal"
            ref="usernameModalInput"
            autocomplete="username"
          />
        </div>
        <div v-if="modalError" class="modal-error">{{ modalError }}</div>
        <div class="modal-buttons">
          <button @click="closeUsernameModal" class="cancel-button">Cancel</button>
          <button @click="submitUsername" class="confirm-button" :disabled="modalLoading">
            {{ modalLoading ? 'Updating...' : 'Update Username' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <ToastNotification
      v-model:visible="showToast"
      :message="toastMessage"
      :type="toastType"
      :duration="toastType === 'error' ? 6000 : 4000"
      @hidden="onToastHidden"
    />
</template>

<script setup>
import BasePage from '../components/BasePage.vue'
import LogoutButton from '../components/LogoutButton.vue'
import ToastNotification from '../components/ToastNotification.vue'
import { computed, onMounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'

const store = useStore()
const router = useRouter()
const route = useRoute()

// Theme system functions and variables
const currentTheme = computed(() => store.getters['theme/getCurrentTheme'])
const isDefaultThemeSystem = computed(() => store.getters['theme/isDefaultThemeSystem'])
const currentThemeName = computed(() => store.getters['theme/getCurrentThemeName'])

// Theme system functions
function selectThemeSystem(system) {
  store.dispatch('theme/setThemeSystem', system);
  showSuccessToast(`Switched to ${currentThemeName.value}`);
}

function toggleCurrentTheme() {
  store.dispatch('theme/toggleTheme');
  showSuccessToast(`Switched to ${currentThemeName.value}`);
}

const showEmailModal = ref(false)
const showPasswordModal = ref(false)
const showUnlinkModal = ref(false)
const showDeleteConfirmModal = ref(false)
const showUsernameModal = ref(false)
const emailModalMode = ref('add')
const passwordModalMode = ref('add')
const modalLoading = ref(false)
const modalError = ref('')

const emailInput = ref('')
const currentPasswordInput = ref('')
const newPasswordInput = ref('')
const confirmPasswordInput = ref('')
const usernameInput = ref('')

const emailModalInput = ref(null)
const currentPasswordModalInput = ref(null)
const newPasswordModalInput = ref(null)
const unlinkModalInput = ref(null)
const usernameModalInput = ref(null)

// Toast notification state
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('info') // 'success', 'error', 'info'
const toastTimeout = ref(null)

// Double confirmation state for account deletion
const confirmDeleteData = ref({
    firstConfirmed: false,
    message: "Are you sure you want to permanently delete your account?"
});

// Toast notification methods
function showSuccessToast(message) {
    showToast.value = true
    toastMessage.value = message
    toastType.value = 'success'
    
    // Auto-hide after 4 seconds
    if (toastTimeout.value) clearTimeout(toastTimeout.value)
    toastTimeout.value = setTimeout(hideToast, 4000)
}

function showErrorToast(message) {
    showToast.value = true
    toastMessage.value = message
    toastType.value = 'error'
    
    // Auto-hide after 6 seconds for errors (longer to read)
    if (toastTimeout.value) clearTimeout(toastTimeout.value)
    toastTimeout.value = setTimeout(hideToast, 6000)
}

function hideToast() {
    showToast.value = false
    if (toastTimeout.value) {
        clearTimeout(toastTimeout.value)
        toastTimeout.value = null
    }
}

function onToastHidden() {
    hideToast();
}

const loggedIn = computed(() => store.getters.getAuthStatus)
const username = computed(() => store.getters.getUsername)
const profile = computed(() => store.getters.getProfile)
const image = computed(() => store.getters.getImage)
const email = computed(() => profile.value?.email || '')
const emailVerified = computed(() => profile.value?.email_verified || false)
const googleLinked = computed(() => store.getters.getGoogleLinked)
const hasPassword = computed(() => store.getters.getHasPassword)
const authStatus = computed(() => store.getters.getAuthStatus)

watch(() => route.path, (newPath) => {
  if (newPath === '/account') {
    store.dispatch('fetchUserData');
  }
});

watch(profile, (newProfile) => {
}, { immediate: true, deep: true })

onMounted(() => {
  if (!profile.value) {
      store.dispatch('fetchUserData');
  }
})

function resetModalState() {
    modalLoading.value = false;
    modalError.value = '';
    emailInput.value = '';
    currentPasswordInput.value = '';
    newPasswordInput.value = '';
    confirmPasswordInput.value = '';
    usernameInput.value = '';
    confirmDeleteData.value.firstConfirmed = false;
    confirmDeleteData.value.message = "Are you sure you want to permanently delete your account?";
}

function openEmailModal(mode) {
    resetModalState();
    emailModalMode.value = mode;
    emailInput.value = mode === 'change' ? email.value : '';
    showEmailModal.value = true;
    nextTick(() => emailModalInput.value?.focus());
}
function closeEmailModal() {
    showEmailModal.value = false;
}

function openPasswordModal(mode) {
    resetModalState();
    passwordModalMode.value = mode;
    showPasswordModal.value = true;
    nextTick(() => currentPasswordModalInput.value?.focus());
}
function closePasswordModal() {
    showPasswordModal.value = false;
}

function openUnlinkModal() {
    resetModalState();
    showUnlinkModal.value = true;
    nextTick(() => unlinkModalInput.value?.focus());
}
function closeUnlinkModal() {
    showUnlinkModal.value = false;
}

function openDeleteConfirmModal() {
    resetModalState();
    showDeleteConfirmModal.value = true;
}
function closeDeleteConfirmModal() {
    showDeleteConfirmModal.value = false;
}

function openUsernameModal() {
    resetModalState();
    usernameInput.value = username.value;
    showUsernameModal.value = true;
    nextTick(() => usernameModalInput.value?.focus());
}
function closeUsernameModal() {
    showUsernameModal.value = false;
}

async function apiCall(url, options, successMessage) {
    modalLoading.value = true;
    modalError.value = '';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(options.body),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error ${response.status}`);
        }

        // alert(data.message || successMessage);
        await store.dispatch('fetchUserData');
        return true;

    } catch (error) {
        console.error(`Error during API call to ${url}:`, error);
        modalError.value = error.message || 'An unexpected error occurred.';
        return false;
    } finally {
        modalLoading.value = false;
    }
}

async function submitEmail() {
    const success = await apiCall('/api/email-management', {
        body: { email: emailInput.value }
    }, 'Verification email sent.');

    if (success) {
        closeEmailModal();
        if (emailModalMode.value === 'add' || !emailVerified.value) {
            showSuccessToast("Verification email sent. Please check your inbox for the verification link.");
        } else {
            showSuccessToast("Email updated successfully.");
        }
    }
}

async function resendVerification() {
    const success = await apiCall('/api/email-management', {
        body: { email: email.value }
    }, 'Verification email resent.');
    
    if (success) {
        showSuccessToast("Verification email resent. Please check your inbox.");
    }
}

async function submitPassword() {
    if (newPasswordInput.value !== confirmPasswordInput.value) {
        modalError.value = "New passwords do not match.";
        return;
    }
    if (newPasswordInput.value.length < 6) {
         modalError.value = "Password must be at least 6 characters.";
         return;
    }

    const url = passwordModalMode.value === 'add' ? '/api/add-password' : '/api/change-password';
    const body = {
        new_password: newPasswordInput.value,
        confirm_password: confirmPasswordInput.value,
    };
    if (passwordModalMode.value === 'change') {
        body.current_password = currentPasswordInput.value;
    }

    const success = await apiCall(url, { body }, 'Password updated successfully.');
    if (success) {
        closePasswordModal();
        showSuccessToast(passwordModalMode.value === 'add' ? 
            "Password set successfully." : 
            "Password changed successfully.");
    }
}

async function submitUnlink() {
    if (newPasswordInput.value !== confirmPasswordInput.value) {
        modalError.value = "Passwords do not match.";
        return;
    }
     if (newPasswordInput.value.length < 6) {
         modalError.value = "Password must be at least 6 characters.";
         return;
    }

    const success = await apiCall('/api/google_auth/unlink_and_set_password', {
        body: {
            new_password: newPasswordInput.value,
            confirm_password: confirmPasswordInput.value,
        }
    }, 'Google account unlinked and password set.');

    if (success) {
        closeUnlinkModal();
        showSuccessToast("Google account unlinked and password set successfully.");
    }
}

async function linkGoogle() {
  try {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/google_auth/link_account';
    document.body.appendChild(form);
    form.submit();
  } catch (e) {
    console.error("Error initiating Google link:", e);
    showErrorToast("An error occurred initiating Google link. Please try again.");
  }
}

async function deleteAccountConfirmed() {
    if (!confirmDeleteData.value.firstConfirmed) {
        // First confirmation
        confirmDeleteData.value.firstConfirmed = true;
        confirmDeleteData.value.message = "Are you ABSOLUTELY sure? This action cannot be undone!";
        return;
    }
    
    const success = await apiCall('/api/delete-account', {
        body: {}
    }, 'Account deleted successfully.');
    
    if (success) {
        closeDeleteConfirmModal();
        
        // Clear local data and logout immediately
        store.commit('clearUserData');
        
        // Redirect to homepage immediately without showing "Please log in..." message
        router.push('/');
        
        // Show toast notification after redirect
        setTimeout(() => {
            showSuccessToast("Your account has been successfully deleted.");
        }, 100);
    }
}

async function submitUsername() {
    if (usernameInput.value.length < 3) {
        modalError.value = "Username must be at least 3 characters.";
        return;
    }

    if (usernameInput.value === username.value) {
        modalError.value = "New username must be different from current username.";
        return;
    }

    const success = await apiCall('/api/change-username', {
        body: { new_username: usernameInput.value }
    }, 'Username updated successfully.');

    if (success) {
        closeUsernameModal();
        showSuccessToast("Username changed successfully. Please use your new username to log in next time.");
    }
}

</script>

<style>
[data-theme='light'] {
  --green-btn-clr:  rgb(59, 119, 197);
}

[data-theme='dark'] {
  --green-btn-clr:  rgb(110, 173, 255);
}
</style>


<style scoped>
h2 {
  margin-top: 0;
}

.account-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid color-mix(in oklab, var(--fg) 2%, var(--bg) 100%);
  border-radius: 8px;
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
  border-radius: var(--modal-border-radius);
  border: var(--thin-border-width) solid var(--fg);
  box-shadow: var(--card-shadow);

}

.profile-info-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.profile-row {
  display: grid;
  grid-template-columns: 150px 1fr;
  align-items: center;
  gap: 1rem;
}

.profile-label {
  font-weight: 500;
  color: color-mix(in oklab, var(--fg) 85%, var(--bg) 100%);
}

.profile-value {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  word-break: break-word;
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

.danger-zone {
  margin-top: 2rem;
  padding: 1rem;
  border: var(--thin-border-width) dashed var(--danger-color, #dc3545);
  background: color-mix(in oklab, var(--danger-color, #dc3545) 5%, var(--bg) 100%);
}

.danger-zone h3 {
  margin-top: 0;
  color: var(--danger-color, #dc3545);
}

.danger-zone p {
  margin-bottom: 1rem;
  color: color-mix(in oklab, var(--fg) 80%, var(--bg) 100%);
}

.delete-account-btn {
  background: var(--danger-color, #dc3545);
  color: #fff;
}

.delete-account-btn:hover {
  background: color-mix(in oklab, var(--danger-color, #dc3545) 80%, black 20%);
  color: #fff;
}

.status-verified {
  color: #2a9d8f;
  font-size: 0.92em;
}

.status-unverified {
  color: #e76f51;
  font-size: 0.92em;
}

.btn {
  background: var(--bg-alt);
  border: 1px solid color-mix(in oklab, var(--fg) 20%, var(--bg) 100%);
  border-radius: 2px;
  padding: .4rem 1rem;
  font-weight: bold;
  color: var(--fg);
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}
.btn:hover {
  background-color: color-mix(in oklab, var(--fg) 10%, var(--bg) 100%);
  border-color: color-mix(in oklab, var(--fg) 40%, var(--bg) 100%);
}



.btn-small {
  padding: .2rem .5rem;
  font-size: 0.8em;
  margin-left: 0.5rem;
  color: var(--fg);
  outline: none;
  cursor: pointer;
  border: var(--thin-border-width) solid color-mix(in oklab, rgb(255, 0, 30) 70%, var(--bg) 100%);
  background-color: color-mix(in oklab, rgb(255, 0, 30) 40%, var(--bg) 100%);
  margin-left: 0;
}

/* .btn-small:hover {
  border: var(--thin-border-width) solid color-mix(in oklab, rgb(255, 0, 30) 90%, var(--bg) 100%);
  background-color: color-mix(in oklab, rgb(255, 0, 30) 60%, var(--bg) 100%);
} */


.btn-change-username {
  border: var(--thin-border-width) solid color-mix(in oklab, var(--green-btn-clr) 70%, var(--bg) 100%);
  background-color: color-mix(in oklab, var(--green-btn-clr) 40%, var(--bg) 100%);
}
/* .btn-change-username:hover {
  border: var(--thin-border-width) solid color-mix(in oklab, var(--green-btn-clr) 90%, var(--bg) 100%);
  background-color: color-mix(in oklab, var(--green-btn-clr) 60%, var(--bg) 100%);
} */

.btn-danger {
  color: #fff;
  background: var(--danger-color);
  border-color: var(--danger-color);
}
.btn-danger:hover {
  color: #fff;
  background: var(--danger-color);
}
/* .btn-danger:hover {
  background: color-mix(in oklab, var(--danger-color) 80%, black 20%);
  border-color: color-mix(in oklab, var(--danger-color) 80%, black 20%);
} */

.google-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.google-icon {
  width: 20px;
  height: 20px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: color-mix(in oklab, var(--bg) 13%, var(--bg) 83%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.modal-content {
  background: var(--bg-alt);
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.modal-content h3 {
    margin-top: 0;
    margin-bottom: 1rem;
}
.modal-content p {
    margin-bottom: 1.5rem;
    font-size: 0.95em;
    color: color-mix(in oklab, var(--fg) 80%, var(--bg) 100%);
}

.modal-form {
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-form label {
    margin-bottom: -0.5rem;
    font-size: 0.9em;
    color: color-mix(in oklab, var(--fg) 70%, var(--bg) 100%);
}

.modal-form input[type="email"],
.modal-form input[type="password"],
.modal-form input[type="text"] {
  padding: 0.75rem;
  border: 1px solid color-mix(in oklab, var(--fg) 20%, var(--bg) 100%);
  background: var(--bg);
  color: var(--fg);
  font-family: inherit;
  border-radius: 4px;
  font-size: 1rem;
}
.modal-form input:focus {
    outline: none;
    border-color: var(--accent-color, #007bff);
    box-shadow: 0 0 0 2px color-mix(in oklab, var(--accent-color, #007bff) 30%, transparent 100%);
}

.modal-error {
    color: var(--danger-color, #dc3545);
    margin-top: -0.5rem;
    margin-bottom: 1rem;
    font-size: 0.9em;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-button,
.confirm-button {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.cancel-button {
  background: color-mix(in oklab, var(--fg) 15%, var(--bg) 100%);
  color: var(--fg);
}
.cancel-button:hover {
    background: color-mix(in oklab, var(--fg) 25%, var(--bg) 100%);
}

.confirm-button {
  background: var(--accent-color, #007bff);
  color: #fff;
}
.confirm-button:hover {
    background: color-mix(in oklab, var(--accent-color, #007bff) 85%, black 15%);
}
.confirm-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.delete-confirm-button {
  background: var(--danger-color, #dc3545);
  color: #fff;
}
.delete-confirm-button:hover {
  background: color-mix(in oklab, var(--danger-color, #dc3545) 80%, black 20%);
}
.modal-message {
  margin: 1.5rem 0;
  color: var(--fg);
  line-height: 1.5;
}
.modal-message p {
    margin-bottom: .5rem;
}
.modal-message strong {
    color: var(--danger-color, #dc3545);
}

.settings-section {
  margin-bottom: 1.5rem;
}

h3 {
  margin-top: 0;
  /* margin-bottom: 2rem; */
  /* color: var(--fg); */
  /* border-bottom: 1px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 100%); */
  /* padding-bottom: 0.5rem; */
}

.section-divider {
  margin: 2rem 0;
  border-top: 2px solid color-mix(in oklab, var(--fg) 10%, var(--bg) 100%);
}

.theme-selection, .current-theme {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}

.theme-option-label {
  min-width: 120px;
  font-weight: 500;
  color: color-mix(in oklab, var(--fg) 85%, var(--bg) 100%);
}

.theme-buttons {
  display: flex;
  gap: 0.5rem;
}

.theme-button {
  padding: 0.4rem 1rem;
  background: var(--bg-alt);
  border: 2px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 100%);
  border-radius: 0px;
  cursor: pointer;
  color: var(--fg);
  /* transition: all 0.2s; */
  
	font-weight: bold;
	border: 3px solid var(--black) !important;
	background: var(--bg) !important;
	opacity: .5;
}

.theme-button.active {
  background: color-mix(in oklab, var(--green-btn-clr, #f11) 30%, var(--bg) 100%);
  border-color: color-mix(in oklab, var(--green-btn-clr, #f11) 80%, var(--bg) 100%);
  color: color-mix(in oklab, var(--green-btn-clr, #f11) 90%, var(--fg) 100%);
	opacity: 1;
}

.theme-button:hover:not(.active) {
  background: color-mix(in oklab, var(--fg) 10%, var(--bg) 100%);
}

.theme-value {
  font-weight: 500;
  color: var(--green-btn-clr, #f11);
  margin-right: 1rem;
}

.theme-toggle-btn {
  padding: 0.3rem 0.8rem;
  font-size: 0.9em;
}

@media (max-width: 768px) {
  
  .account-container {
    max-width: 600px;
    margin: 1rem auto;
    padding: 1rem;
    border: none;
    border-radius: 8px;
    box-shadow: none !important;
    background: none;
  }

  .profile-row {
    border-bottom: 2px solid color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
    padding-bottom: 1rem;
  }

  .account-actions {
    border-bottom: 2px solid color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
    padding-bottom: 1rem;
  }

  .theme-selection, .current-theme {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .theme-option-label {
    margin-bottom: 0.5rem;
  }
}

</style>