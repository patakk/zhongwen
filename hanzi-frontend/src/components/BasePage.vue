<template>
    <SideBar />
    <h1>{{ page_title }}</h1> <!-- change this label per file -->
  </template>
  
  <script>
  import SideBar from '../components/SideBar.vue';
  
  export default {
    components: {
      SideBar
    },
    props: {
      page_title: {
        type: String,
        required: true
      }
    }
  };
  </script>

<style scoped>
h1 {
    font-size: 3em;
    margin: 0;
    padding: 1em;
    width: 100%;
    text-align: center;
    box-sizing: border-box;
    font-family: Arial, Helvetica, sans-serif;
}

</style>