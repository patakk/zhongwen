<template>
  <div>
    <h1>Home</h1>
    <nav>
      <RouterLink to="/login">Login</RouterLink> |
      <RouterLink to="/grid">Grid</RouterLink> |
      <RouterLink to="/search">Search</RouterLink> |
      <RouterLink to="/flashcards">Flashcards</RouterLink> |
      <RouterLink to="/page-info">Page Info</RouterLink>
    </nav>
  </div>
</template>

<script>
export default {
  name: "HomeView",
  computed: {
  },
  created() {
    // Fetch dictionary data when the component is created
    this.$store.dispatch("fetchDictionaryData");
  }
};
</script>