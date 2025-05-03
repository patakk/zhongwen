<template>
    <div @click="toggleView" class="grid-header">
        <BasePage 
          :page_title="localPageTitle" 
        />
    </div>

    <!-- Toggle button for the leftbar -->
    <button 
      class="leftbar-toggle" 
      @click="toggleLeftbar"
      :class="{ 'leftbar-toggle-active': leftbarVisible }"
    >
    <font-awesome-icon :icon="['fas', 'gear']" />
    </button>

    <!-- Floating leftbar, positioned outside the main flow -->
    <div class="leftbar" :class="{ 'leftbar-hidden': !leftbarVisible }">
        <div class="tab-keyboard-shortcut">[Tab]</div>
        <div class="leftbar-header">
          <div class="leftbar-header-label">Settings</div>
          <button class="close-button" @click="toggleLeftbar">×</button>
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
            :class="{ 'active': fontScale === 0.6 }"
            @click="setFontSize(0.6)"
          >
            <span class="size-icon">小</span>
          </button>
          <button 
            class="size-button" 
            :class="{ 'active': fontScale === 1.0 }"  
            @click="setFontSize(1.0)"
          >
            <span class="size-icon">中</span>
          </button>
          <button 
            class="size-button" 
            :class="{ 'active': fontScale === 2.0 }"
            @click="setFontSize(2.0)"
          >
            <span class="size-icon">大</span>
          </button>
        </div>
        
        <!-- Grid Gap Size Options - only visible in grid mode -->
        <template v-if="!isListView">
          <label>Grid Gap Size:</label>
          <div class="font-size-buttons">
            <button 
              class="size-button" 
              :class="{ 'active': gridGapSize === '0.25em' }"
              @click="setGridGapSize('0.25em')"
            >
              <span class="gap-icon"><font-awesome-icon :icon="['fas', 'square']" class="gap-icon-item"/><font-awesome-icon :icon="['fas', 'square']" class="gap-icon-item"/></span>
            </button>
            <button 
              class="size-button" 
              :class="{ 'active': gridGapSize === '1em' }"
              @click="setGridGapSize('1em')"
            >
              <span class="gap-icon"><font-awesome-icon :icon="['fas', 'square']" class="gap-icon-item"/>&nbsp;<font-awesome-icon :icon="['fas', 'square']" class="gap-icon-item"/></span>
            </button>
            <button 
              class="size-button" 
              :class="{ 'active': gridGapSize === '3em' }"
              @click="setGridGapSize('3em')"
            >
              <span class="gap-icon"><font-awesome-icon :icon="['fas', 'square']" class="gap-icon-item"/>&nbsp;&nbsp;&nbsp;<font-awesome-icon :icon="['fas', 'square']" class="gap-icon-item"/></span>
            </button>
          </div>
          
          <!-- Grid Border Toggle - only visible in grid mode -->
          <label>Grid Borders:</label>
          <button 
            class="single-toggle-button" 
            @click="toggleGridBorders"
          >
            {{ showGridBorders ? 'Hide Borders' : 'Show Borders' }}
          </button>
        </template>
    </div>

    <!-- Background overlay when leftbar is visible -->
    <div v-if="leftbarVisible" class="overlay" @click="closeLeftbar"></div>

    <!-- Main content takes full width regardless of leftbar state -->
      <div class="main-content" ref="mainContent" @scroll="handleScroll">
        <!-- Scroll to top button - FIXED: changed showScrollTop to match data property -->
        <button 
          v-if="showScrollTop" 
          @click="scrollToTop" 
          class="scroll-to-top-button"
          aria-label="Scroll to top"
        >
          ↑
        </button>
        <div v-if="selectedCategory">
          <div class="dictionary-category">
            <!-- Grid View with optimized event delegation -->
            <div 
              v-if="!isListView" 
              class="grid-container" 
              :style="{ 
                gridTemplateColumns: `repeat(auto-fill, minmax(${fontScale*1.1*100}px, 1fr))`, 
                fontSize: `${fontScale*1.1}em`,
                gap: gridGapSize
              }"
              @mousemove="handleGridMouseMove"
              @mouseleave="handleGridMouseLeave"
            >
              <div 
                v-for="(entry, index) in visibleChars" 
                :key="entry.character"
                class="grid-item"
                :data-character="entry.character"
                @click="handleGridItemClick(entry.character)"
                @mouseenter="handleGridItemMouseEnter($event, entry)"
                @mouseleave="handleGridItemMouseLeave"
                :style="{ 
                  border: showGridBorders ? 'var(--grid-item-border)' : 'var(--grid-item-border-transparent)'
                }"
              >
                <div class="hanzi" :style="{ 
                  fontFamily: `'${selectedFont}'`,
                  transform: selectedFont === 'Kaiti' ? 'scale(1.15)' : 'none',
                  fontWeight: selectedFont === 'Noto Serif SC' ? 500 : 400
                }">
                  {{ entry.character }}
                </div>
              </div>
            </div>
            
            <!-- List View still using PreloadWrapper since performance is less critical -->
            <div v-else class="list-container" :style="{fontSize: `${fontScale*1.1}em` }">
              <PreloadWrapper
                v-for="(entry, index) in visibleChars"
                :key="entry.character"
                :character="entry.character"
                :showBubbles="false"
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
      </div>
</template>


<script>
import PreloadWrapper from '../components/PreloadWrapper.vue';
import BasePage from '../components/BasePage.vue';
import { useStore } from 'vuex';

const defaultVisibleCount = 180; // Default number of characters to show

export default {
  data() {
    return {
      selectedCategory: null,
      localPageTitle: 'Grid',
      visibleCount: defaultVisibleCount,
      hoveredItem: null,
      selectedFont: 'Noto Sans SC',
      fontScale: 1,         // ✅ Actual font scale, used in layout
      tempFontScale: 1,     // ✅ Temporary one used by slider
      isListView: false,    // ✅ Toggle between grid and list views
      reloading: false,     // Flag to track view switching reloading
      leftbarVisible: false, // Default to closed for all screen sizes
      waitingForDictData: true, // Flag to track if we're waiting for dictionary data
      attemptedCategory: null, // Store the attempted category from URL
      
      // Grid specific options
      gridGapSize: '0.25em',     // Gap size for grid items: '0', '1em', or '3em'
      showGridBorders: true, // Toggle for grid item borders
      
      // Add tracking for hover state and timers, similar to PreloadWrapper
      currentHoveredCharacter: null,
      hoverTimer: null,
      preloadedCharacters: new Set(), // Track which characters have been preloaded

      // Scroll to top button visibility
      showScrollTop: false  // Controls visibility of the scroll-to-top button
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
    // New methods for bubble tooltip
    showBubble(event, entry) {
      // Get pointer position
      const x = event.clientX;
      const y = event.clientY;
      
      // Show the bubble with character data
      this.$store.dispatch('bubbleTooltip/showBubble', {
        character: entry.character,
        pinyin: this.$toAccentedPinyin(entry.pinyin.join(', ')),
        english: entry.english.join(', '),
        position: { x, y },
        fontFamily: this.selectedFont
      });
    },
    
    hideBubble() {
      this.$store.dispatch('bubbleTooltip/hideBubble');
    },
    
    // New method to handle click on BasePage component
    handleBasepageClick() {
      this.toggleLeftbar();
    },
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
    
    // Methods for individual grid item mouse events
    handleGridItemMouseEnter(event, entry) {
      // Only show bubble on devices that support hover
      if (window.matchMedia('(hover: hover)').matches) {
        const gridItem = event.target.closest('.grid-item');
        if (!gridItem) return;
        
        // Clear any existing hover timer
        if (this.hoverTimer) {
          clearTimeout(this.hoverTimer);
          this.hoverTimer = null;
        }
        
        // Set the current hovered character
        this.currentHoveredCharacter = entry.character;
        
        // Get the position of the grid item for fixed tooltip positioning
        const rect = gridItem.getBoundingClientRect();
        const x = rect.left + (rect.width / 2);
        const y = rect.top;
        
        // Show the bubble tooltip immediately
        this.showBubble({
          clientX: x,
          clientY: y
        }, entry);
        
        // Start preloading
        this.hoverTimer = setTimeout(() => {
          if (!this.preloadedCharacters.has(entry.character)) {
            this.$store.dispatch('cardModal/preloadCardData', entry.character);
            this.preloadedCharacters.add(entry.character);
          }
        }, 150);
      }
    },
    
    handleGridItemMouseLeave() {
      // Hide bubble immediately when leaving the grid item
      this.hideBubble();
      
      // Clear any active hover timer
      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer);
        this.hoverTimer = null;
      }
    },
    
    // Grid event delegation handlers
    handleGridMouseMove(event) {
      // Only show bubble on devices that support hover (non-touch devices)
      if (window.matchMedia('(hover: hover)').matches) {
        // Find the target grid item
        const gridItem = event.target.closest('.grid-item');
        if (!gridItem) return;
        
        const character = gridItem.dataset.character;
        if (!character) return;
        
        // If we're already hovering this character, don't do anything
        if (this.currentHoveredCharacter === character) {
          return;
        }
        
        // Clear any existing hover timer
        if (this.hoverTimer) {
          clearTimeout(this.hoverTimer);
          this.hoverTimer = null;
        }
        
        // Set the current hovered character
        this.currentHoveredCharacter = character;
        
        // Find the entry for this character
        const entry = this.visibleChars.find(entry => entry.character === character);
        if (!entry) return;
        
        // Get the position of the grid item for fixed tooltip positioning
        const rect = gridItem.getBoundingClientRect();
        const x = rect.left + (rect.width / 2);
        const y = rect.top;
        
        // Show the bubble tooltip immediately
        this.showBubble({
          clientX: x,
          clientY: y
        }, entry);
      }
      
      // Always preload data regardless of device type
      // (this happens after a short delay)
      const gridItem = event.target.closest('.grid-item');
      if (!gridItem) return;
      
      const character = gridItem.dataset.character;
      if (!character) return;
      
      // Set the current hovered character for tracking
      this.currentHoveredCharacter = character;
      
      // Clear any existing hover timer
      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer);
        this.hoverTimer = null;
      }
      
      // Start a new hover timer with delay for preloading the card data only
      this.hoverTimer = setTimeout(() => {
        // Only preload if we haven't already preloaded this character in this session
        if (!this.preloadedCharacters.has(character)) {
          this.$store.dispatch('cardModal/preloadCardData', character);
          this.preloadedCharacters.add(character);
        }
      }, 150); // Use the same delay as PreloadWrapper default for preloading
    },
    
    handleGridMouseLeave() {
      // Hide the bubble tooltip when leaving the grid
      this.$store.dispatch('bubbleTooltip/hideBubble');
      
      // Clear any active hover timer
      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer);
        this.hoverTimer = null;
      }
      
      // Reset current hovered character
      this.currentHoveredCharacter = null;
    },
    
    handleGridItemClick(character) {
      if (!character) return;
      
      // Show the card modal using the same action as PreloadWrapper
      this.$store.dispatch('cardModal/showCardModal', character);
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
    toggleLeftbar() {
      this.leftbarVisible = !this.leftbarVisible;
    },
    // Method to close the sidebar
    closeLeftbar() {
      // Only close the leftbar automatically if in mobile/vertical mode
      if (this.leftbarVisible && window.innerWidth <= 1024) {
        this.leftbarVisible = false;
      }
    },
    
    // Method to set grid gap size with optimized loading
    setGridGapSize(size) {
      this.reloading = true;          // Start reloading process
      this.visibleCount = defaultVisibleCount; // Reset visible count
      this.gridGapSize = size;
      
      // Use the same chunk-loading optimization as font size changes
      this.$nextTick(() => {
        this.loadMore();  // Start incremental loading
      });
    },
    
    // Method to toggle grid borders with optimized loading
    toggleGridBorders() {
      this.reloading = true;          // Start reloading process
      this.visibleCount = defaultVisibleCount; // Reset visible count
      this.showGridBorders = !this.showGridBorders;
      
      // Use the same chunk-loading optimization
      this.$nextTick(() => {
        this.loadMore();  // Start incremental loading
      });
    },
    
    // Handle key down events to detect Tab key
    handleKeyDown(event) {
      // Only respond to Tab key, and prevent default behavior
      if (event.key === 'Tab') {
        event.preventDefault();
        this.toggleLeftbar();
      }
    },

    // Method to scroll to top
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Method to handle scroll event
    handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      this.showScrollTop = scrollTop > 200;
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
    
    // Add event listener for the sidebar opening event
    document.addEventListener('sidebar-opened', this.closeLeftbar);
    
    // Use window scroll event instead of container scroll event
    window.addEventListener('scroll', this.handleScroll);
    // Initial check for scroll position
    this.handleScroll();
  },
  beforeUnmount() {
    // Remove event listener for keydown events
    window.removeEventListener('keydown', this.handleKeyDown);
    
    // Remove event listener for the sidebar opening event
    document.removeEventListener('sidebar-opened', this.closeLeftbar);
    
    // Remove window scroll event listener
    window.removeEventListener('scroll', this.handleScroll);
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

.grid-header {
  cursor: pointer;
  text-decoration: underline;
}

.page-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: 100%;
  margin: 2em;
  gap: 1em;
}

.dictionary-category {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.grid-container {
  display: grid;
  gap: 0;
  width: 100%;
  box-sizing: border-box;
}

.grid-item {
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  height: 3em;
  text-align: center;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 10%);
}


.grid-item:hover {
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
  color: var(--primary-color);
}

.grid-item:hover .pinyin {
  /* opacity: 1; */
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
  position: fixed;
  top: 0;
  left: 0;
  width: 400px;
  box-sizing: border-box;
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100vh;
  overflow-y: auto;
  padding: 1em;
  z-index: 30;
  /* box-shadow: 0 0 20px color-mix(in oklab, var(--fg) 16%, var(--bg) 0%); */
  border-right: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 25%, var(--bg) 10%);
  box-shadow: 0 0 20px color-mix(in oklab, var(--bg) 66%, #7770 0%);
  box-shadow: 0 0 20px color-mix(in oklab, var(--fg) 66%, #7770 0%);
  box-shadow: 20px 0 80px var(--bg);
}

.leftbar-hidden {
  transform: translateX(-100%);
  box-shadow: none;
}

.main-content {
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  height: 100%;
  padding: 2em;
  position: relative;
}

.scroll-to-top-button {
  position: fixed;
  bottom: 1em;
  right: 1em;
  background: color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 25%, var(--bg) 100%);
  cursor: pointer;
  font-family: inherit;
  color: var(--fg);
  font-size: 2.1em;
  padding: 0.5em;
  width: 1.8em;
  height: 1.8em;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s, transform 0.3s;
}

.scroll-to-top-button:hover {
  background: color-mix(in oklab, var(--bg) 85%, var(--fg) 30%);
  transform: translateY(-3px);
  color: var(--fg);
}

.tab-keyboard-shortcut {
  position: absolute;
  top: .5em;
  right: .5em;
  font-size: 0.8em;
  color: var(--fg);
  opacity: .5;
}

.leftbar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.leftbar-header-label {
  font-size: 1.5em;
  font-weight: bold;
  color: var(--fg);
  margin-top: 1.5em;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  display: block;
  color: var(--fg);
  opacity: 0.7;
}

.close-button:hover {
  opacity: 1;
}

.leftbar-toggle {
  position: fixed;
  z-index: 5;
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
  background: none;
  outline: none;
  border: none;
  cursor: pointer;
  transform: translate(-50%, -50%);
  color: var(--fg);
  font-size: 1.5em;
  cursor: pointer;
  left: 1.5rem;
  top: 4rem;
}

.toggle-icon {
  font-size: 1.2em;
  display: inline-block;
}

.toggle-text {
  font-size: 1em;
  display: inline-block;
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
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 25%, var(--bg) 100%);
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
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 25%, var(--bg) 100%);
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
  background: color-mix(in oklab, var(--fg) 25%, var(--bg) 50%);
}

.size-icon {
  display: block;
  font-size: 1.4em;
}

.gap-icon {
  display: block;
  font-size: 1.2em;
}

.gap-icon-item {
  padding: .1em;
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
    /* position: fixed;
    top: 10em;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.5em 1em;
    display: flex;
    align-items: center;
    gap: 0.5em;
    background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
    border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 25%, var(--bg) 100%);
    cursor: pointer;
    color: var(--fg); */
  }

  .list-item {
    padding: 1em 0;
    box-shadow: none;
    border-bottom: 1px solid color-mix(in oklab, var(--fg)22%, var(--bg) 10%);
  }


  .main-content {
    padding: 1em;
    width: 100% !important;
    /* padding: 0em;
    margin-top: 1em; */
  }

  .grid-container {
    gap: 0.8em;
  }

  
  .grid-item {
    height: 2em;
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
    opacity: 0;
  }

  
  .hanzi {
    font-size: 1em; /* Scale font size directly */
  }

  .pinyin {
    font-size: 0.8em; /* Scale font size directly */
    color: var(--fg);
    opacity: 0;
    overflow: hidden;
    white-space: nowrap;
  }

  .tab-keyboard-shortcut {
    opacity: 0;
  }
}

/* Small mobile devices */
@media (max-width: 480px) {
  .grid-container {
    /* grid-template-columns: repeat(auto-fill, minmax(100px, 2fr)) !important; */
    /* gap: 0.5em; */
  }

  .grid-item {
    /* aspect-ratio: 4; */
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

