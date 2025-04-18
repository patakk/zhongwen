<template>
  <div class="preload-wrapper">
    <div
      @mouseenter="startHoverTimer"
      @mouseleave="handleMouseLeave"
      @click="openPopup"
    >
      <slot></slot>
    </div>

    <CardModal
      v-if="modalVisible"
      :data="popupData"
      :loading="loading"
      :visible="modalVisible"
      :decompositionData="decompositionData"
      @close="closePopup"
      @fetch-decomp-for-char="fetchCharDecompInfo"
    />

  </div>
</template>

<script>
import CardModal from './CardModal.vue'

// Shared state to track if any modal is currently open
let isAnyModalOpen = false;

export default {
  name: 'PreloadWrapper',
  components: {
    CardModal,
  },
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
      popupData: null,
      modalVisible: false,
      cardDataCache: new Map(),
      pendingFetch: null,
      pendingDecompFetch: null,
      decompositionData: null,
      loading: false,
    }
  },
  beforeDestroy() {
    this.clearHoverTimer();
    
    // Ensure modal-open class is removed when component is destroyed
    if (this.modalVisible) {
      document.body.classList.remove('modal-open');
      this.modalVisible = false;
      this.popupData = null;
    }
  },
  methods: {
    startHoverTimer() {
      this.clearHoverTimer()
      this.hoverTimer = setTimeout(() => {
        this.preloadCardData()
      }, this.delay)
    },
    clearHoverTimer() {
      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer)
        this.hoverTimer = null
      }
    },
    handleMouseLeave() {
      this.clearHoverTimer()
      this.$emit('unhover', this.character)
    },
    async preloadCardData() {
      if (!this.cardDataCache.has(this.character)) {
        await this.fetchCardData(this.character)
      }
    },
    async preloadCardDataForWord(word) {
      if (!this.cardDataCache.has(word)) {
        await this.fetchCardData(word)
      }
    },
    async fetchCardData(character) {
      // If there's already a pending fetch for this character, return that promise
      if (this.pendingFetch?.character === character) {
        return this.pendingFetch.promise
      }

      // Create new fetch promise
      const fetchPromise = new Promise(async (resolve) => {
        try {
          const response = await fetch(
            `/api/get_card_data?character=${character}`
          )
          const data = await response.json()
          if (data.chars_breakdown) {
            this.cardDataCache.set(character, data)
            resolve(data)
          }
        } catch (error) {
          console.error('Error fetching card data:', error)
          resolve(null)
        }
      })

      // Store the pending fetch
      this.pendingFetch = {
        character,
        promise: fetchPromise
      }

      // Wait for fetch to complete and clear pending fetch
      await fetchPromise
      this.pendingFetch = null

      return fetchPromise
    },
    async openPopup() {
      if (this.modalVisible) return;

      this.modalVisible = true;
      this.popupData = null;
      this.loading = true;

      if (!isAnyModalOpen) {
        document.body.classList.add('modal-open');
        isAnyModalOpen = true;
      }

      let data;

      if (this.cardDataCache.has(this.character)) {
        data = this.cardDataCache.get(this.character);
      } else {
        data = await this.fetchCardData(this.character);
      }

      if (data) {
        this.popupData = data;
      }

      // Fetch and print character decomposition info
      this.fetchCharDecompInfo(this.character);

      this.loading = false;
    },
    async handleExampleClick(word) {
      // If data is in cache, use it immediately
      if (this.cardDataCache.has(word)) {
        this.popupData = this.cardDataCache.get(word)
        return
      }

      // If data is not in cache, fetch it
      const data = await this.fetchCardData(word)
      if (data) {
        this.popupData = data
      }
    },
    closePopup() {
      this.modalVisible = false;
      this.popupData = null;
      this.loading = false;

      setTimeout(() => {
        const anyModalVisible = document.querySelector('.modal-overlay');
        if (!anyModalVisible) {
          document.body.classList.remove('modal-open');
          isAnyModalOpen = false;
        }
      }, 0);
    },
    updatePopupData(word) {
      if (this.cardDataCache.has(word)) {
          this.popupData = this.cardDataCache.get(word)
          
          // Also fetch decomposition data for the new word
          this.fetchCharDecompInfo(word);

        this.$nextTick(() => { 
            this.scrollToTopOfModal();
        });
        return
      }

      this.fetchCardData(word).then((data) => {
        if (data) {
          this.popupData = data
          
          // Also fetch decomposition data for the new word
          this.fetchCharDecompInfo(word);
          
          this.$nextTick(() => { 
              this.scrollToTopOfModal();
          });
        }
      })
    },
    scrollToTopOfModal() {
        const modal = document.querySelector('.card-modal');
        if (!modal) return;
        // scroll to card modal to its top
        
        function scrollToTop(element, func=null) {
            setTimeout(() => {
                element.scrollTo(0, 1);
                if(func)
                    func();
                setTimeout(() => {
                    element.scrollTo(0, 0);
                }, 0);
            }, 222);
        }
    },
    async fetchCharDecompInfo(input) {
      // If there's already a pending decomp fetch for this input, return that promise
      if (this.pendingDecompFetch?.character === input) {
        return this.pendingDecompFetch.promise
      }

      // Create new fetch promise
      const fetchPromise = new Promise(async (resolve) => {
        try {
          // Only send characters that are Han script
          const characters = input.split('').filter(char => /\p{Script=Han}/u.test(char));
          
          if (characters.length === 0) {
            this.decompositionData = null;
            resolve(null);
            return;
          }
          
          // For debug - log what we're fetching
          console.log('Fetching decomposition for character:', characters);
          
          const url = '/api/get_char_decomp_info';
          const payload = { characters: characters }; // Send all characters at once
          const options = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          };

          const response = await fetch(url, options);
          const data = await response.json();
          console.log('Character decomposition info received:', data);
          
          // Set decomposition data directly
          this.decompositionData = data;
          
          resolve(this.decompositionData);
        } catch (error) {
          console.error('Error fetching character decomposition info for:', input, error);
          resolve(null);
        }
      });

      // Store the pending decomp fetch
      this.pendingDecompFetch = {
        character: input,
        promise: fetchPromise
      }

      // Wait for fetch to complete and clear pending fetch
      await fetchPromise
      this.pendingDecompFetch = null

      return fetchPromise
    },
  },
  provide() {
    return {
      updatePopupData: this.updatePopupData,
      preloadCardDataForWord: this.preloadCardDataForWord
    }
  }
}
</script>
