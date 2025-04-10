<!-- src/components/ExpandableSection.vue -->
<template>
    <div class="detail-group">
      <div class="section-header" @click="toggleExpanded">
        <h4>{{ title }}</h4>
        <span class="toggle-icon">{{ isExpanded ? '▼' : '▶' }}</span>
      </div>
      <div v-show="isExpanded">
        <slot></slot>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      title: String,
      defaultExpanded: {
        type: Boolean,
        default: true
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
.detail-group {
    margin-bottom: 1rem;
}
.section-header {
    display: flex;
    justify-content: space-between;
    cursor: pointer;
    padding: 0.5rem;
    background-color: var(--dim-background);
    border-radius: 4px;
}
.section-header h4 {
    margin: 0;
}
.toggle-icon {
    font-size: 1.2rem;
    transition: transform 0.3s;
}
.toggle-icon:hover {
    transform: scale(1.2);
}
</style>