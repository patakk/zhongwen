<template>
  <div 
    v-if="visible" 
    class="bubble-tooltip"
    :style="{ 
      top: `${position.y}px`, 
      left: `${position.x}px` 
    }"
  >
    <div class="bubble-content">
      <div class="bubble-hanzi" :style="{ fontFamily: `'${fontFamily}'` }">
        {{ character }}
      </div>
      <div class="bubble-pinyin">{{ pinyin }}</div>
      <div class="bubble-english">{{ english }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BubbleTooltip',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    character: {
      type: String,
      default: ''
    },
    pinyin: {
      type: String,
      default: ''
    },
    english: {
      type: String,
      default: ''
    },
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    },
    fontFamily: {
      type: String,
      default: 'Noto Sans SC'
    }
  }
}
</script>

<style scoped>
.bubble-tooltip {
  position: fixed;
  z-index: 9999;
  background: var(--bg);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 25%, var(--bg) 10%);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 55%, var(--bg) 10%);
  padding: .5em;
  box-shadow: 0 3px 8px color-mix(in oklab, var(--fg) 15%, #7770 10%);
  min-width: 150px;
  max-width: 300px;
  pointer-events: none;
  /* Position above the grid item */
  transform: translate(-50%, -100%);
  text-align: center;
}

.bubble-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.bubble-hanzi {
  font-size: 1.5em;
  font-weight: 500;
  color: var(--fg);
}

.bubble-pinyin {
  font-size: .8em;
  font-style: italic;
  color: var(--fg);
  opacity: 0.5;
}

.bubble-english {
  font-size: .8em;
  color: var(--fg);
  opacity: 0.7;
}
</style>