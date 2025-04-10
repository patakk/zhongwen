<template>
  <div>
    <h1>Dictionary Data</h1>

    <label for="dictionary-select">Choose a Dictionary:</label>
    <select v-model="selectedCategory" id="dictionary-select">
      <option v-for="(category, categoryName) in dictionaryData" :key="categoryName" :value="categoryName">
        {{ category.name || categoryName }}
      </option>
    </select>

    <div v-if="selectedCategory">
      <div v-for="(category, categoryName) in dictionaryData" :key="categoryName">
        <div v-if="categoryName === selectedCategory" class="dictionary-category">
          <h2>{{ category.name || categoryName }}</h2>
          <div class="grid-container">
            <div
              v-for="(entry, charKey) in category.chars"
              :key="charKey"
              class="grid-item"
              @mouseenter="startHoverTimer(entry.character)"
              @mouseleave="clearHoverTimer(entry.character)"
              @click="openPopup(entry.character)"
            >
              <div class="hanzi">{{ entry.character }}</div>
              <div class="pinyin">{{ entry.pinyin.join(', ') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Popup component to show the card data -->
    <PopupModal 
      v-if="showPopup" 
      :data="popupData" 
      @close="closePopup"
      @character-hover="handlePopupCharacterHover"
      @character-click="handlePopupCharacterClick"
    />

    <!-- Fallback message if no category is selected -->
    <div v-else>
      <p>Please select a dictionary to view the characters.</p>
    </div>
  </div>
</template>


<script>
import PopupModal from '../components/PopupModal.vue';

export default {
  data() {
    return {
      selectedCategory: null,
      hoverTimers: new Map(),
      popupData: null,
      showPopup: false,
      cardDataCache: new Map(), // Cache to store fetched card data
      pendingFetch: null // To track ongoing fetch requests
    };
  },
  components: {
    PopupModal
  },
  computed: {
    dictionaryData() {
      return this.$store.getters.getDictionaryData;
    }
  },
  methods: {
    startHoverTimer(character) {
      this.clearHoverTimer(character);
      const timer = setTimeout(() => {
        this.preloadCardData(character);
      }, 300);
      
      this.hoverTimers.set(character, timer);
    },

    clearHoverTimer(character) {
      if (this.hoverTimers.has(character)) {
        clearTimeout(this.hoverTimers.get(character));
        this.hoverTimers.delete(character);
      }
    },
    
    beforeDestroy() {
      this.hoverTimers.forEach(timer => clearTimeout(timer));
      this.hoverTimers.clear();
    },

    handlePopupCharacterHover(character) {
      this.startHoverTimer(character);
    },

    handlePopupCharacterClick(character) {
      this.openPopup(character);
    },

    async preloadCardData(character) {
      if (!this.cardDataCache.has(character)) {
        await this.fetchCardData(character);
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
          console.log(data);
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

    async openPopup(character) {
      // If data is in cache, use it immediately
      if (this.cardDataCache.has(character)) {
        this.popupData = this.cardDataCache.get(character);
        this.showPopup = true;
        return;
      }

      // If data is not in cache, fetch it
      const data = await this.fetchCardData(character);
      if (data) {
        this.popupData = data;
        this.showPopup = true;
      }
    },

    closePopup() {
      this.showPopup = false;
      this.popupData = null;
    }
  }
};
</script>

<style scoped>
/* Grid layout */

.dictionary-category {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  padding: 16px;
  width: 100%;
  max-width: 1200px;
}

.grid-item {
  background: var(--dim-background);
  padding: 12px;
  border-radius: 1px;
  text-align: center;
  position: relative;
  cursor: pointer;
}

.hanzi {
  font-size: 2em;
}

.pinyin {
  position: absolute;
  font-size: 1em;
  left: 50%;
  top: 50%;
  transform: translateX(-50%) translateY(-50%);
  visibility: hidden;
  vertical-align: center;
  opacity: 0;
  color: var(--primary-text);
}

.grid-item:hover .pinyin {
  visibility: visible;
  opacity: 1;
}

.grid-item:hover .hanzi {
  visibility: hidden;
  opacity: 0;
}

.grid-item:hover {
}

select {
  margin-bottom: 20px;
  padding: 5px;
  font-size: 1em;
}
</style>

