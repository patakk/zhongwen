<template>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
  />
    <SideBar id="mainsidebar" />
    
    <div id="maintitle">{{ page_title }}</div> 
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

:root {
  --h1-border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 50%);
}

[data-theme='dark'] {
  --h1-border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 30%, var(--bg) 50%);
}

[data-theme='theme1'] {
  --h1-border: var(--thin-border-width) solid var(--fg);
}


</style>

<style scoped>


#maintitle {
  font-size: 3em;
  font-weight: bold;
  /* letter-spacing: -0.1em; */
  margin: 0;
  margin: 0;
  padding: 1.5em 0em 1em 0em;
  width: 100%;
  text-align: center;
  box-sizing: border-box;
  font-family: var(--second-font);
  border-bottom: var(--h1-border);
  /* opacity: 0; */
}

@media (max-width: 784px) {
  #maintitle {
    font-size: 2em;
    margin: 0;
  }
}

@media (max-aspect-ratio: 1/1) or (max-width: 1024px) {
  #maintitle {
    padding: 1em 0em 1em 0em;
  }
}


</style>