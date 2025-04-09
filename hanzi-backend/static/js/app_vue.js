new Vue({
    el: '#app',
    data() {
      return {
        searchQuery: ''
      };
    },
    computed: {
      currentPath() {
        return this.$route.path;
      }
    },
    methods: {
      navigateTo(path) {
        this.$router.push(path);
      },
      handleSearch() {
        console.log('Search query:', this.searchQuery);
        // Implement your search functionality here
      }
    }
  });
  