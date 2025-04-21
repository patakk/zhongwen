<template>
  <div class="preload-wrapper">
    <div
      @mouseenter="startHoverTimer"
      @mouseleave="handleMouseLeave"
      @click="openPopup"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'PreloadWrapper',
  props: {
    character: {
      type: String,
      required: true
    },
    delay: {
      type: Number,
      default: 150
    }
  },
  data() {
    return {
      hoverTimer: null,
      isHovering: false
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
          this.preloadCardData();
        }
      }, this.delay);
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
      this.$emit('unhover', this.character);
    },
    async preloadCardData() {
      try {
        // Use the Vuex action directly
        await this.preloadCardDataAction(this.character);
      } catch (error) {
        console.error('Error preloading card data:', error);
      }
    },
    openPopup() {
      // Use the mapped action from Vuex store
      this.showCardModal(this.character);
    }
  }
}
</script>

<style scoped>
.preload-wrapper {
  cursor: pointer;
}
</style>
