<template>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
  />
    <SideBar id="mainsidebar" />
    
    <div id="maintitle">
      <div id="maintitlein" @click.stop="$emit('title-click')" :class="{ 'underlined': is_underlined }">{{ page_title }}</div>
    </div> 
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
      },
      is_underlined: {
        type: Boolean,
        default: false
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
  margin: 0;
  padding: 1.5em 1em 1em 1em;
  text-align: left;
  box-sizing: border-box;
  font-family: var(--second-font);
  border-bottom: var(--h1-border);
  /* opacity: 0; */
}

#maintitlein {
  font-family: var(--second-font);
  display: inline-block;
}

.underlined {
  text-decoration: underline;
}
.underlined:hover {
  cursor: pointer;
}

@media (max-width: 784px) {
  #maintitle {
    font-size: 2em;
    margin: 0;
  }
}

@media (max-aspect-ratio: 1/1) or (max-width: 1024px) {
  #maintitle {
    padding: 1.5em .5em 1em .5em;
  }
}


</style>
