<template>
  <div>
    <div
      @mouseenter="startHoverTimer"
      @mouseleave="handleMouseLeave"
      @click="openPopup"
      :class="{ 'modal-open': showPopup }"
    >
      <slot></slot>
    </div>

    <CardModal 
      v-if="showPopup" 
      :data="popupData" 
      @close="closePopup"
    >
      <template #example-word="{ word, index, pinyin, meaning }">
        <div 
          class="example-word-content"
          @mouseenter="startHoverTimerForWord(word)"
          @mouseleave="handleMouseLeaveForWord(word)"
          @click="handleExampleClick(word)"
        >
          <span class="chinese">{{ word }}</span>
          <span class="pinyin">{{ pinyin }}</span>
          <span class="meaning">{{ meaning }}</span>
        </div>
      </template>
    </CardModal>
  </div>
</template>

<script>
import CardModal from './CardModal.vue'

export default {
  name: 'PreloadWrapper',
  components: {
    CardModal
  },
  props: {
    character: {
      type: String,
      required: true
    },
    delay: {
      type: Number,
      default: 300
    }
  },
  data() {
    return {
      hoverTimer: null,
      popupData: null,
      showPopup: false,
      cardDataCache: new Map(), // Cache to store fetched card data
      pendingFetch: null // To track ongoing fetch requests
    }
  },
  beforeDestroy() {
    this.clearHoverTimer();
  },
  methods: {
    startHoverTimer() {
      this.clearHoverTimer();
      this.hoverTimer = setTimeout(() => {
        this.preloadCardData();
      }, this.delay);
    },
    startHoverTimerForWord(word) {
      this.clearHoverTimer();
      this.hoverTimer = setTimeout(() => {
        this.preloadCardDataForWord(word);
      }, this.delay);
    },
    clearHoverTimer() {
      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer);
        this.hoverTimer = null;
      }
    },
    handleMouseLeave() {
      this.clearHoverTimer();
      this.$emit('unhover', this.character);
    },
    handleMouseLeaveForWord(word) {
      this.clearHoverTimer();
      this.$emit('unhover', word);
    },
    async preloadCardData() {
      if (!this.cardDataCache.has(this.character)) {
        await this.fetchCardData(this.character);
      }
    },
    async preloadCardDataForWord(word) {
      if (!this.cardDataCache.has(word)) {
        await this.fetchCardData(word);
      }
    },
    async fetchCardData(character) {
      // If there's already a pending fetch for this character, return that promise
      if (this.pendingFetch?.character === character) {
        return this.pendingFetch.promise;
      }

      // Create new fetch promise
      const fetchPromise = new Promise(async (resolve) => {
        try {
          const response = await fetch(`http://127.0.0.1:5117/get_card_data?character=${character}`);
          const data = await response.json();
          if (data.chars_breakdown) {
            this.cardDataCache.set(character, data);
            resolve(data);
          }
        } catch (error) {
          console.error("Error fetching card data:", error);
          resolve(null);
        }
      });

      // Store the pending fetch
      this.pendingFetch = {
        character,
        promise: fetchPromise
      };

      // Wait for fetch to complete and clear pending fetch
      await fetchPromise;
      this.pendingFetch = null;

      return fetchPromise;
    },
    async openPopup() {
      // If this card is already open, don't do anything
      if (this.showPopup) return;
      
      // If data is in cache, use it immediately
      if (this.cardDataCache.has(this.character)) {
        this.popupData = this.cardDataCache.get(this.character);
        this.showPopup = true;
        return;
      }

      // If data is not in cache, fetch it
      const data = await this.fetchCardData(this.character);
      if (data) {
        this.popupData = data;
        this.showPopup = true;
      }
    },
    async handleExampleClick(word) {
      // If data is in cache, use it immediately
      if (this.cardDataCache.has(word)) {
        this.popupData = this.cardDataCache.get(word);
        return;
      }

      // If data is not in cache, fetch it
      const data = await this.fetchCardData(word);
      if (data) {
        this.popupData = data;
      }
    },
    closePopup() {
      this.showPopup = false;
      this.popupData = null;
    }
  }
}
</script>

<style scoped>
.example-word-content {
  display: grid;
  grid-template-columns: minmax(auto, max-content) minmax(auto, max-content) 1fr;
  gap: 1rem;
  align-items: center;
  padding: 0.15rem 0.5rem;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

.example-word-content:hover {
  background: color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
}

.example-word-content .chinese {
  justify-self: start;
  white-space: nowrap;
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.example-word-content .pinyin {
  justify-self: start;
  white-space: nowrap;
  font-size: 1rem;
  opacity: 0.6;
}

.example-word-content .meaning {
  justify-self: start;
  text-align: left;
  font-size: 1rem;
  width: 100%;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.modal-open {
  cursor: default;
}
</style> 