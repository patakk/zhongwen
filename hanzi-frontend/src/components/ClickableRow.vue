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
        hoverTimer: null
      }
    },
    inject: ['updatePopupData', 'preloadCardDataForWord'], // Inject the function
    emits: ['example-clicked'],
    beforeDestroy() {
      this.clearHoverTimer()
    },
    methods: {
      startHoverTimer() {
        this.clearHoverTimer()
        this.hoverTimer = setTimeout(() => {
          this.preloadData()
        }, 300) // Use the same delay as PreloadWrapper
      },
      clearHoverTimer() {
        if (this.hoverTimer) {
          clearTimeout(this.hoverTimer)
          this.hoverTimer = null
        }
      },
      handleMouseLeave() {
        this.clearHoverTimer()
      },
      async preloadData() {
        await this.preloadCardDataForWord(this.word)
      },
      handleClick() {
        this.updatePopupData(this.word)
        this.$emit('example-clicked')
      }
    }
  }
  </script>
  
  <style scoped>
  </style>
