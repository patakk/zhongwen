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

<style>

[data-theme='light'] {
  --h1-border: 2px solid color-mix(in oklab, var(--fg) 20%, var(--bg) 50%);
}

[data-theme='dark'] {
  --h1-border: 2px solid color-mix(in oklab, var(--fg) 30%, var(--bg) 50%);
}

h1 {
    font-size: 3em;
    margin: 0;
    padding: 1em 0em 1em 0em;
    width: 100%;
    text-align: center;
    box-sizing: border-box;
    font-family: Arial, Helvetica, sans-serif;
    border-bottom: var(--h1-border);
}

</style>