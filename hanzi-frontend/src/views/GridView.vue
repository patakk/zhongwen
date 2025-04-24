<template>

    <BasePage :page_title="localPageTitle" />

    <div class="page-layout">
      <!-- Mobile leftbar toggle button -->
      <button v-if="!sidebarVisible" class="leftbar-toggle" @click="toggleSidebar">
        <span class="toggle-icon">▶</span>
        <span class="toggle-text">Settings</span>
      </button>

      <div class="leftbar" :class="{ 'leftbar-hidden': !sidebarVisible }">
        <div class="leftbar-header">
          <h2>Settings</h2>
          <button v-if="sidebarVisible" class="close-button" @click="toggleSidebar">×</button>
        </div>

        <!-- Dictionary Selector -->
        <label for="dictionary-select">Choose a Dictionary:</label>
        <select v-model="selectedCategory" id="dictionary-select"
                @change="localPageTitle = dictionaryData[selectedCategory].name || selectedCategory">
          <option v-for="(category, categoryName) in dictionaryData" :key="categoryName" :value="categoryName">
            {{ category.name || categoryName }}
          </option>
        </select>

        <!-- View Toggle -->
        <label for="view-toggle">Display Mode:</label>
        <button 
          class="single-toggle-button" 
          @click="toggleView"
        >
          {{ isListView ? 'Show Grid' : 'Show List' }}
        </button>

        <!-- Font Selector -->
        <label for="font-select">Font:</label>
        <select v-model="selectedFont" id="font-select">
          <option value="Kaiti">Kaiti</option>
          <option value="Noto Sans SC">Noto Sans</option>
          <option value="Noto Serif SC">Noto Serif</option>
        </select>

        <!-- Font Size Buttons (replacing the slider) -->
        <label>Font Size:</label>
        <div class="font-size-buttons">
          <button 
            class="size-button" 
            @click="setFontSize(0.75)"
          >
            <span class="size-icon">小</span>
          </button>
          <button 
            class="size-button" 
            @click="setFontSize(1.0)"
          >
            <span class="size-icon">中</span>
          </button>
          <button 
            class="size-button" 
            @click="setFontSize(2.0)"
          >
            <span class="size-icon">大</span>
          </button>
        </div>
      </div>

      <div v-if="sidebarVisible" class="overlay" @click="closeSidebar"></div>

      <main class="main-content" :class="{ 'main-content-expanded': !sidebarVisible }">
        
        <div v-if="selectedCategory">
          <div class="dictionary-category">
            <!-- Grid View -->
            <div v-if="!isListView" class="grid-container" :style="{ 
              gridTemplateColumns: `repeat(auto-fill, minmax(${fontScale*1.1*100}px, 1fr))`, 
              fontSize: `${fontScale*1.1}em` 
            }">
              <PreloadWrapper 
                v-for="(entry, index) in visibleChars" 
                :key="entry.character" 
                :character="entry.character"
              >
                <div class="grid-item">
                  <div class="hanzi" :style="{ 
                    fontFamily: `'${selectedFont}'`,
                    transform: selectedFont === 'Kaiti' ? 'scale(1.15)' : 'none',
                    fontWeight: selectedFont === 'Noto Serif SC' ? 500 : 400
                  }">
                    {{ entry.character }}
                  </div>
                  <div class="pinyin">{{ $toAccentedPinyin(entry.pinyin.join(', ')) }}</div>
                </div>
              </PreloadWrapper>
            </div>
            
            <!-- List View -->
            <div v-else class="list-container" :style="{fontSize: `${fontScale*1.1}em` }">
              <PreloadWrapper
                v-for="(entry, index) in visibleChars"
                :key="entry.character"
                :character="entry.character"
              >
                <div class="list-item">
                  <div class="hanzipinyin">
                    <div class="list-hanzi" :style="{ 
                      fontFamily: `'${selectedFont}'`,
                      transform: selectedFont === 'Kaiti' ? 'scale(1.15)' : 'none',
                      fontWeight: selectedFont === 'Noto Serif SC' ? 600 : 400
                    }">
                      {{ entry.character }}
                    </div>
                    <div class="list-pinyin">{{ $toAccentedPinyin(entry.pinyin.join(', ')) }}</div>
                  </div>
                  <div class="list-english">{{ entry.english.join(', ') }}</div>
                </div>
              </PreloadWrapper>
            </div>
          </div>
        </div>
        <div v-else>
          <p>Please select a dictionary to view the characters.</p>
        </div>
      </main>
    </div>
</template>


<script>
import PreloadWrapper from '../components/PreloadWrapper.vue';
import BasePage from '../components/BasePage.vue';

const defaultVisibleCount = 180; // Default number of characters to show

export default {
  data() {
    return {
      selectedCategory: null,
      localPageTitle: 'Grid',
      visibleCount: defaultVisibleCount,
      hoveredItem: null,
      selectedFont: 'Kaiti',
      fontScale: 1,         // ✅ Actual font scale, used in layout
      tempFontScale: 1,     // ✅ Temporary one used by slider
      isListView: false,    // ✅ Toggle between grid and list views
      reloading: false,     // Flag to track view switching reloading
      sidebarVisible: window.innerWidth > 1024, // Default to closed on mobile
      waitingForDictData: true, // Flag to track if we're waiting for dictionary data
      attemptedCategory: null // Store the attempted category from URL
    };
  },
  components: {
    PreloadWrapper,
    BasePage
  },
  computed: {
    dictionaryData() {
      // Get dictionary data from store
      const data = this.$store.getters.getDictionaryData;
      // Get custom dictionary data
      const customData = this.$store.getters.getCustomDictionaryData;
      
      if (data) {
        // Mark that we have dictionary data
        this.waitingForDictData = false;
        
        // Handle category selection once data is loaded
        if (!this.selectedCategory) {
          // Try to use the category from URL
          const wordlist = this.$route.query.wordlist;
          
          if (wordlist && data[wordlist]) {
            // Set category and title if wordlist exists in data
            this.selectedCategory = wordlist;
            this.localPageTitle = data[wordlist].name || wordlist;
            this.attemptedCategory = null; // Clear the attempted category
          } else if (this.attemptedCategory && customData && customData[this.attemptedCategory]) {
            // If we previously attempted to load a custom category and now it's available
            this.selectedCategory = this.attemptedCategory;
            this.localPageTitle = customData[this.attemptedCategory].name || this.attemptedCategory;
            this.attemptedCategory = null; // Clear the attempted category
          } else if (wordlist && !data[wordlist]) {
            // If wordlist specified but not found in current data, store it as attempted category
            // It might be a custom deck that hasn't loaded yet
            this.attemptedCategory = wordlist;
            
            // Don't default to HSK1 yet, wait for custom data to load
            if (customData && Object.keys(customData).length > 0) {
              // We already have custom data but the wordlist is not there, so default to HSK1
              this.selectedCategory = 'hsk1';
              this.localPageTitle = data.hsk1?.name || 'HSK1';
            }
          } else if (!wordlist) {
            // No wordlist in URL, default to HSK1
            this.selectedCategory = 'hsk1';
            this.localPageTitle = data.hsk1?.name || 'HSK1';
          }
        } else if (this.selectedCategory) {
          // Update page title whenever the dictionary data changes
          if (data[this.selectedCategory]) {
            this.localPageTitle = data[this.selectedCategory].name || this.selectedCategory;
          } else if (customData && customData[this.selectedCategory]) {
            this.localPageTitle = customData[this.selectedCategory].name || this.selectedCategory;
          }
        }
      }
      
      return data || {};
    },
    customDictionaryData() {
      // Get custom dictionary data from store and handle potential custom category loading
      const customData = this.$store.getters.getCustomDictionaryData;
      
      if (customData && this.attemptedCategory && customData[this.attemptedCategory]) {
        // If our attempted category is now available in the custom data
        this.selectedCategory = this.attemptedCategory;
        this.localPageTitle = customData[this.attemptedCategory].name || this.attemptedCategory;
        this.attemptedCategory = null; // Clear the attempted category
        this.waitingForDictData = false;
      }
      
      return customData || {};
    },
    slicedChars() {
      if (!this.selectedCategory) return [];

      const standard = this.dictionaryData[this.selectedCategory]?.chars || {};
      const custom = this.customDictionaryData[this.selectedCategory]?.chars || {};

      // First check if it's in the standard dictionary
      if (Object.keys(standard).length > 0) {
        return Object.values(standard);
      }
      // Then check if it's in the custom dictionary
      else if (Object.keys(custom).length > 0) {
        return Object.values(custom);
      }
      
      return [];
    },
    visibleChars() {
      return this.slicedChars.slice(0, this.visibleCount);
    }
  },
  methods: {
    applyFontScale() {
      this.fontScale = this.tempFontScale;
    },
    setFontSize(size) {
      this.reloading = true;          // Start reloading process
      this.visibleCount = defaultVisibleCount; // Reset visible count
      this.fontScale = size;
      this.tempFontScale = size; // Keep them in sync
      
      // Use the same chunk-loading optimization as dictionary changes
      this.$nextTick(() => {
        this.loadMore();  // Start incremental loading
      });
    },
    loadMore() {
      this.visibleCount += defaultVisibleCount;
      if (this.visibleCount >= this.slicedChars.length) {
        this.visibleCount = this.slicedChars.length;
        this.reloading = false; // Done reloading
      }
      this.$nextTick(() => {
        if (this.visibleCount < this.slicedChars.length) {
          setTimeout(this.loadMore, 100); 
        }
      });
    },
    toggleView() {
      this.reloading = true;          // Start reloading
      this.visibleCount = defaultVisibleCount; // Reset visible count
      this.isListView = !this.isListView;
      this.$nextTick(() => {
        this.loadMore();  // Start incremental loading
      });
    },
    // Method to open character modal when word is in URL
    openCharacterModal(character) {
      if (character) {
        this.$store.dispatch('cardModal/showCardModal', character);
      }
    },
    // New improved method to check for word parameter
    checkQueryParams() {
      const wordlist = this.$route.query.wordlist;
      if (wordlist && this.dictionaryData && this.dictionaryData[wordlist]) {
        this.selectedCategory = wordlist;
        this.localPageTitle = this.dictionaryData[wordlist].name || wordlist;
      }
      
      // Skip opening the modal directly from here - let the store handle it
      // This prevents duplicate modal opening when multiple components detect
      // the URL parameter change
    },
    // New method to update the URL when the category changes
    updateUrlWithCategory(category) {
      // Update URL without reloading the page
      this.$router.replace({ 
        query: { 
          ...this.$route.query, 
          wordlist: category 
        }
      }).catch(err => {
        // Ignore navigation duplicate errors
        if (err.name !== 'NavigationDuplicated') {
          throw err;
        }
      });
    },
    // New method to toggle sidebar visibility
    toggleSidebar() {
      this.sidebarVisible = !this.sidebarVisible;
    },
    // Method to close the sidebar
    closeSidebar() {
      if (this.sidebarVisible) {
        this.sidebarVisible = false;
      }
    },
    
    // Handle key down events to detect Tab key
    handleKeyDown(event) {
      // Only respond to Tab key, and prevent default behavior
      if (event.key === 'Tab') {
        event.preventDefault();
        this.toggleSidebar();
      }
    }
  },
  watch: {
    selectedCategory() {
      this.visibleCount = defaultVisibleCount; 
      this.updateUrlWithCategory(this.selectedCategory);
      this.$nextTick(this.loadMore);
    },
    // Add a watcher for route changes to handle direct URL navigation
    '$route.query': {
      handler() {
        this.checkQueryParams();
      },
      immediate: true
    },
    // Watch for dictionary data changes to handle the case where data loads after component
    dictionaryData: {
      handler() {
        this.checkQueryParams();
      },
      immediate: true
    }
  },
  mounted() {
    // Check for URL parameters first when component mounts
    this.checkQueryParams();
    // Then start loading characters incrementally
    this.$nextTick(this.loadMore);
    // Add event listener for keydown events
    window.addEventListener('keydown', this.handleKeyDown);
  },
  beforeUnmount() {
    // Remove event listener for keydown events
    window.removeEventListener('keydown', this.handleKeyDown);
  }
};
</script>


<style>


::-webkit-scrollbar {
  display: none;
}

html, body {
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>
<style scoped>

html, body {
  overflow: hidden;
}

::-webkit-scrollbar {
  display: none;
}

html, body {
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden; /* Prevent outer scroll */
}

.app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Full viewport height */
  overflow: hidden;
}


.page-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: 100%;
  margin: 2em;
}

.dictionary-category {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1.5em;
  width: 100%;
  box-sizing: border-box;
}

.grid-item {
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  padding: 0.55em;
  aspect-ratio: 4;
  border-radius: 1px;
  text-align: center;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}


.hanzi, .pinyin {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hanzi {
  font-size: 1.5em; /* Scale font size directly */
  color: var(--fg);
  opacity: 1;
  white-space: nowrap;
}

.pinyin {
  font-size: 0.8em; /* Scale font size directly */
  color: var(--fg);
  opacity: 0;
  overflow: hidden;
  white-space: nowrap;
}

.grid-item:hover .hanzi {
  opacity: 0;
}

.grid-item:hover .pinyin {
  opacity: 1;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 0rem;
  width: 100%;
}

.list-item {
  display: flex;
  /* border-bottom: 1px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 10%); */
  box-shadow: 0px -1.25px color-mix(in oklab, var(--fg) 10%, var(--bg) 10%);
  padding: .25em;
  font-family: inherit;
  text-align: left;
  background: var(--bg);
  width: 100%;
  cursor: pointer;
  font-size: .75em;
}

.list-item:hover {
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
}

.hanzipinyin {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  flex: 2;
}

.list-hanzi {
  font-size: 1.75em;
  padding-right: 1em;
}

.list-pinyin {
  font-size: 1em;
  font-style: italic;
  color: var(--fg);
  opacity: 0.4;
}

.list-english {
  font-size: 1em;
  color: var(--fg);
  opacity: 0.6;
  flex: 12;
  align-self: center;
}

select {
  margin-bottom: 20px;
  padding: 5px;
  font-size: 1em;
}

.leftbar {
  width: 12%;
  box-sizing: border-box;
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
  /* border-right: 1px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 100%); */
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  overflow: hidden;
  padding: 1em;
  transition: width 0.3s ease, padding 0.3s ease, opacity 0.3s ease;
}

.leftbar-hidden {
  width: 0;
  padding: 0;
  opacity: 0;
}

.leftbar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
}

.leftbar-toggle {
  position: fixed;
  top: 4.5em;
  left: 1em;
  z-index: 5;
  border-radius: 4px;
  padding: 0.5em 1em;
  display: flex;
  align-items: center;
  gap: 0.5em;
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
  border: 2px solid color-mix(in oklab, var(--fg) 25%, var(--bg) 100%);
  cursor: pointer;
  color: var(--fg);
}

.toggle-icon {
  font-size: 1.2em;
  display: inline-block;
}

.toggle-text {
  font-size: 1em;
  display: inline-block;
}

.main-content {
  width: 88%;
  padding: 0em 2.5em 2em 2em;
  box-sizing: border-box;
  overflow-y: auto;
  height: 100%;  
  transition: width 0.3s ease;
}

.main-content-expanded {
  width: 100%;
}

.mobile-title {
  font-size: 1.2em;
  font-weight: bold;
}

select, input[type="range"] {
  display: block;
  width: 100%;
  margin-bottom: 1rem;
}

label {
  font-weight: bold;
  margin-top: 1rem;
  display: block;
}

.toggle-container {
  display: flex;
  gap: 0.5em;
}

.toggle-button {
  flex: 1;
  padding: 0.5em;
  text-align: center;
  border: 1px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 100%);
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  cursor: pointer;
  border-radius: 4px;
}

.toggle-button.active {
  background: color-mix(in oklab, var(--fg) 25%, var(--bg) 50%);
  font-weight: bold;
}

.single-toggle-button {
  display: block;
  width: 100%;
  padding: 0.5em;
  margin-bottom: 1rem;
  text-align: center;
  border: 2px solid color-mix(in oklab, var(--fg) 25%, var(--bg) 100%);
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  cursor: pointer;
  font-family: inherit;
  color: var(--fg);
}

.single-toggle-button:hover {
  background: color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
}

.font-size-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.size-button {
  flex: 1;
  padding: 0.5em;
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  border: 2px solid color-mix(in oklab, var(--fg) 25%, var(--bg) 100%);
  cursor: pointer;
  font-family: inherit;
  color: var(--fg);
  display: flex;
  justify-content: center;
  align-items: center;
}

.size-button:hover {
  background: color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
}

.size-button.active {
  background: color-mix(in oklab, var(--fg) 25%, var(--bg) 50%);
}

.size-icon {
  display: block;
}


.size-icon {
  font-size: 1.4em;
}

@media (max-width: 1024px) {
  .page-layout {
    flex-direction: column;
    margin: 1em;
  }

  .leftbar {
    position: fixed;
    top: 0;
    left: 0;
    width: 80% !important; /* Override default width */
    max-width: 300px;
    height: 100vh;
    z-index: 30;
    padding: 1em;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
  }

  .leftbar-hidden {
    transform: translateX(-100%);
    width: 0 !important;
  }

  .leftbar-toggle {
    position: fixed;
    top: 4em;
    left: 1em;
    border-radius: 4px;
    padding: 0.5em 1em;
    display: flex;
    align-items: center;
    gap: 0.5em;
    background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
    border: 2px solid color-mix(in oklab, var(--fg) 25%, var(--bg) 100%);
    cursor: pointer;
    color: var(--fg);
  }


  .main-content {
    width: 100% !important;
    padding: 0.5em;
    margin-top: 3em; /* Space for the fixed settings toggle */
  }

  .grid-container {
    gap: 0.8em;
  }

  .grid-item {
    aspect-ratio: 3;
  }

  /* Add overlay for mobile */
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 25;
    display: none;
  }

  .leftbar:not(.leftbar-hidden) + .overlay {
    display: block;
  }
}

/* Small mobile devices */
@media (max-width: 480px) {
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)) !important;
    gap: 0.5em;
  }

  .grid-item {
    aspect-ratio: 2.5;
  }

  .list-item {
    flex-direction: column;
    gap: 0.5em;
  }

  .list-english {
    align-self: flex-start;
  }
}
</style>

