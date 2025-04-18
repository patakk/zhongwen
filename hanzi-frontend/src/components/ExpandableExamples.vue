<template>
  <div class="examples-group">
    <div class="section-header">
      <h4>{{ title }}</h4>
    </div>

    <!-- Always visible portion -->
    <slot name="afew" :is-expanded="isExpanded"></slot>

    <!-- Scrollable overflow container -->
    <div v-show="isExpanded" class="expanded-content">
      <slot name="therest" :is-expanded="isExpanded"></slot>

      <!-- Sticky collapse button -->
    </div>

    <div v-show="isExpanded" class="expand-button sticky-collapse" @click="toggleExpanded">
        collapse ↑
      </div>
    <!-- Expand button (only visible when not expanded) -->
    <div v-show="!isExpanded" class="expand-button" @click="toggleExpanded">
      expand ↓
    </div>
  </div>
</template>


<script>
export default {
  props: {
    title: String,
    defaultExpanded: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isExpanded: this.defaultExpanded
    }
  },
  methods: {
    toggleExpanded() {
      this.isExpanded = !this.isExpanded;
    }
  }
}
</script>

<style scoped>
.examples-group {
  margin-bottom: 1rem;
  background: none !important;
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0.5rem;
  width: 100%;
  box-sizing: border-box;
  min-width: 0; /* Prevent flex item from overflowing */
}
.section-header {
  display: flex;
  justify-content: space-between;
  border-radius: 4px;
  margin: 0.5rem 0;
}
.section-header h4 {
  margin: 0;
  color: var(--fg);
}
.expand-button {
  cursor: pointer;
  text-align: center;
  padding: 0.5rem;
  margin: 1rem auto 0 auto;
  /* background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%); */
  /* border: 2px dashed color-mix(in oklab, var(--fg) 20%, var(--bg) 80%); */
  
  position: sticky;
  bottom: 0;
  background-color: color-mix(in oklab, var(--fg) 4%, var(--bg) 100%);
  z-index: 1;
  width: auto;
  justify-self: center;
  display: inline-block;
  font-size: .8rem;
}

body [data-theme="dark"] .expand-button {
  background-color: color-mix(in oklab, var(--fg) 10%, var(--bg) 30%);
}

body [data-theme="dark"] .expand-button:hover {
  background-color: color-mix(in oklab, var(--fg) 20%, var(--bg) 10%);
}

.expand-button:hover {
  color: var(--fg);
  background-color: color-mix(in oklab, var(--fg) 20%, var(--bg) 20%);
}
</style>
