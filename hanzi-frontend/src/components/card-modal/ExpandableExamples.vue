<template>
  <div class="examples-group">
    <!-- <div class="section-header">
      <div class="medium-label">{{ title }}</div> 
    </div> -->

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
    <!-- Expand button (only visible when not expanded AND there is content to expand) -->
    <div v-show="!isExpanded && hasExpandableContent" class="expand-button" @click="toggleExpanded">
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
    },
    itemCount: {
      type: Number,
      default: 0
    },
    thresholdForExpand: {
      type: Number,
      default: 3
    }
  },
  data() {
    return {
      isExpanded: this.defaultExpanded
    }
  },
  computed: {
    hasExpandableContent() {
      return this.itemCount > this.thresholdForExpand;
    }
  },
  methods: {
    toggleExpanded() {
      this.isExpanded = !this.isExpanded;
    },
    setCollapse() {
      this.isExpanded = false;
    },
    resetExpandedState() {
      this.isExpanded = this.defaultExpanded;
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
  width: 100%;
  padding: 0;
  box-sizing: border-box;
  min-width: 0; /* Prevent flex item from overflowing */
}


.medium-label {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
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
  margin: -1rem auto 0 auto;
  
  position: sticky;
  bottom: 0;
  background-color: color-mix(in oklab, var(--fg) 14%, var(--bg) 100%);
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
