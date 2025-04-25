<template>
  <BasePage page_title="Homeeee" />
  <div class="home-view">
    <nav>
      <RouterLink v-if="!authStatus" to="/register">Register</RouterLink><span v-if="!authStatus"> | </span>
      <RouterLink v-if="authStatus" to="/my-lists">My Lists</RouterLink>
      <RouterLink v-if="!authStatus" to="/login">Login</RouterLink> |
      <RouterLink to="/grid">Grid</RouterLink> |
      <RouterLink to="/flashcards">Flashcards</RouterLink> |
      <RouterLink v-if="authStatus" to="/account">Account</RouterLink>
    </nav>
  </div>
</template>

<script>

import BasePage from '../components/BasePage.vue';


export default {
  name: "HomeView",
  computed: {
    authStatus() {
      return this.$store.getters.getAuthStatus
    }
  },
  components: {
    BasePage
  },
}
</script>


<style scoped>
.home-view {
  margin: 2em;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

a {
  color: var(--fg);
  text-decoration: none;
  margin: 0 10px;
}

nav {
}

</style>