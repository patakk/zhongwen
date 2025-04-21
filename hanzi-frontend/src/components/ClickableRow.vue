<template>
  <div
    class="example-word-content"
    @mouseenter="startHoverTimer"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
  >
    <slot></slot>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'ClickableRow',
  props: {
    word: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      hoverTimer: null,
      isHovering: false
    }
  },
  inject: {
    updatePopupData: {
      default: () => (word) => console.warn('updatePopupData not provided to ClickableRow')
    }
  },
  methods: {
    ...mapActions({
      showCardModal: 'cardModal/showCardModal',
      preloadCardDataAction: 'cardModal/preloadCardData'
    }),
    startHoverTimer() {
      this.isHovering = true;
      this.clearHoverTimer();
      this.hoverTimer = setTimeout(() => {
        if (this.isHovering) {
          this.preloadData();
        }
      }, 300);
    },
    clearHoverTimer() {
      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer);
        this.hoverTimer = null;
      }
    },
    handleMouseLeave() {
      this.isHovering = false;
      this.clearHoverTimer();
    },
    async preloadData() {
      try {
        // Use the Vuex action directly
        await this.preloadCardDataAction(this.word);
      } catch (error) {
        console.error('Error preloading card data:', error);
      }
    },
    handleClick() {
      // Try to use the injected function first
      if (typeof this.updatePopupData === 'function') {
        this.updatePopupData(this.word);
      } else {
        // Fall back to the Vuex action
        this.showCardModal(this.word);
      }
    }
  }
}
</script>

<style scoped>
</style>
