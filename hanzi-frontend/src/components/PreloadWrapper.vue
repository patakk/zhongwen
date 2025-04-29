<template>
  <div class="preload-wrapper">
    <div
      @mouseenter="startHoverTimer($event)"
      @mouseleave="handleMouseLeave"
      @mousemove="handleMouseMove"
      @click="handleClick"
      @auxclick="handleAuxClick"
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
    },
    preferDedicatedPage: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      hoverTimer: null,
      isHovering: false,
      bubbleData: null,
      lastMouseEvent: null // Store the last mouse event
    }
  },
  methods: {
    ...mapActions({
      showCardModal: 'cardModal/showCardModal',
      preloadCardDataAction: 'cardModal/preloadCardData',
      showBubble: 'bubbleTooltip/showBubble',
      hideBubble: 'bubbleTooltip/hideBubble'
    }),
    startHoverTimer(event) {
      this.isHovering = true;
      this.lastMouseEvent = event; // Store the initial mouse event
      this.clearHoverTimer();
      this.hoverTimer = setTimeout(() => {
        if (this.isHovering && this.lastMouseEvent) {
          this.preloadCardData();
          // Show the bubble tooltip with the last known mouse position
          this.showBubbleTooltip(this.lastMouseEvent);
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
      this.lastMouseEvent = null; // Clear the stored event
      this.clearHoverTimer();
      this.$emit('unhover', this.character);
      // Hide the bubble tooltip
      this.hideBubble();
    },
    handleMouseMove(event) {
      // Store the latest mouse event
      this.lastMouseEvent = event;
      
      // Update bubble position on mouse move if we're hovering
      if (this.isHovering && this.bubbleData) {
        this.showBubbleTooltip(event);
      }
    },
    showBubbleTooltip(event) {
      if (!event) return; // Safety check
      
      // Get character data from store if available
      const dictionaryData = this.$store.getters.getDictionaryData || {};
      let pinyin = '';
      let english = '';
      
      // Look for the character data in dictionary
      for (const [deckKey, deck] of Object.entries(dictionaryData)) {
        if (!deck.chars || Array.isArray(deck.chars)) continue;
        
        if (deck.chars[this.character]) {
          const charInfo = deck.chars[this.character];
          pinyin = charInfo.pinyin ? this.$toAccentedPinyin(charInfo.pinyin[0]) : '';
          english = charInfo.english ? charInfo.english[0].split('/')[0] : '';
          break;
        }
      }
      
      // Update bubble data
      this.bubbleData = {
        character: this.character,
        pinyin: pinyin,
        english: english,
        position: { x: event.clientX, y: event.clientY },
        fontFamily: 'Noto Sans SC'
      };
      
      // Show the bubble with updated position
      this.showBubble(this.bubbleData);
    },
    async preloadCardData() {
      try {
        // Use the Vuex action directly
        await this.preloadCardDataAction(this.character);
      } catch (error) {
        console.error('Error preloading card data:', error);
      }
    },
    handleClick(event) {
      // If CTRL key is pressed or preferDedicatedPage is true, navigate to dedicated page
      this.openPopup();
      // if (event.ctrlKey || this.preferDedicatedPage) {
      //   event.preventDefault();
      //   this.navigateToDedicatedPage();
      //   return;
      // } else {
      //   this.openPopup();
      // }
    },
    // Handle middle-click (auxclick event)
    handleAuxClick(event) {
      // Check if it's a middle click (button 1)
      if (event.button === 1) {
        // event.preventDefault();
        // const url = this.$router.resolve({
        //   name: 'WordPage',
        //   params: { word: this.character }
        // }).href;
        // window.open(url, '_blank');
      }
    },
    openPopup() {
      // Use the mapped action from Vuex store
      this.showCardModal(this.character);
    },
    navigateToDedicatedPage() {
      // Navigate to the dedicated page for this word
      this.$router.push({ name: 'WordPage', params: { word: this.character } });
    }
  }
}
</script>

<style scoped>
.preload-wrapper {
  cursor: pointer;
}
</style>
