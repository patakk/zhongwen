<template>
    <nav>
      <ul>
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/login">Login</router-link></li>
        <li><router-link :to="{ path: '/grid', query: $route.query.wordlist ? { wordlist: $route.query.wordlist } : undefined }">Grid</router-link></li>
        <li><router-link to="/flashcards">Flashcards</router-link></li>
        <li><router-link to="/search">Search</router-link></li>
        <li><router-link to="/page-info">Page Info</router-link></li>
        <!-- More links -->
      </ul>
    </nav>
  </template>
  
  <script>
  export default {
    name: "Navbar",
  };
  </script>
  
  <style scoped>
  /* Add your styles here */
  </style>
  
