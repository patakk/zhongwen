<template>
    <div class="grid-header" @click="handleHeaderClick">
        <BasePage 
          :page_title="localPageTitle"
          :is_underlined="true"
          @title-click="toggleDeckDropdown"
        />
        <!-- Dropdown under the clickable title -->
        <div 
          id="deck-options" 
          :class="{ 'show': isSubmenuOpen }"
          @click.stop
          v-if="isSubmenuOpen"
        >
          <div 
            v-for="(deck, key) in decks" 
            :key="key" 
            class="option"
            :class="{ 'selected': selectedCategory === key }"
            @click.stop="changeDeck(key)"
          >
            {{ deck.name || key }}
          </div>
        </div>
    </div>

    <!-- Fixed bottom-left toggle for grid/list view -->
    <button 
      class="view-toggle-fixed" 
      @click="toggleView"
      :title="isGridView ? 'Show List' : 'Show Grid'"
      aria-label="Toggle view"
    >

      <font-awesome-icon v-if="isGridView" :icon="faBars" />
      <font-awesome-icon v-else :icon="faGrip" />
    </button>


    <!-- Background overlay when leftbar is visible -->

    <!-- Main content takes full width regardless of leftbar state -->
      <div class="main-content" ref="mainContent" @scroll="handleScroll" @click="handleMainClick">
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
              v-if="isGridView" 
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
                  fontWeight: selectedFont === 'Noto Serif SC' ? 200 : 200
                }">
                  {{ entry.character }}
                </div>
              </div>
            </div>
            
            <!-- List View still using PreloadWrapper since performance is less critical -->
            <div v-else class="list-container" :style="{fontSize: `${fontScale*1.0}em` }">
              <PreloadWrapper
                v-for="(entry, index) in visibleChars"
                    :key="entry.character"
                    :character="entry.character"
                    :navList="navCharList"
                    :showBubbles="false"
                    :class="'word-item'"
              >
                  <div class="word-hanzipinyin">
                    <div class="word-hanzi" :style="{ 
                      fontFamily: `'${selectedFont}'`,
                      transform: selectedFont === 'Kaiti' ? 'scale(1.15)' : 'none',
                      fontWeight: selectedFont === 'Noto Sans SC' ? 400 : 400
                    }" v-html="colorizeHanzi(entry.character, displayListPinyin(entry.character, (entry.pinyin && entry.pinyin[0]) || ''))"></div>
                    <div class="word-pinyin" :class="{ 'pinyin-hidden': !showPinyin }" v-html="colorizePinyin(displayListPinyin(entry.character, (entry.pinyin && entry.pinyin[0]) || ''))"></div>
                  </div>
                  <div class="word-english">{{ displayListEnglish(entry.character, (entry.english && entry.english[0]) || '') }}</div>
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
import { faBars, faGrip } from '../icons.js'
import { colorizeHanzi as toneColorizeHanzi, colorizePinyin as toneColorizePinyin } from '../lib/toneColorizer';

const defaultVisibleCount = 180; // Default number of characters to show

export default {
  data() {
    return {
      selectedCategory: null,
      localPageTitle: 'Grid',
      isSubmenuOpen: false,
      visibleCount: defaultVisibleCount,
      hoveredItem: null,
      selectedFont: (() => {
        try {
          const key = (this && this.$store && this.$store.getters && this.$store.getters['theme/getCurrentFont']) || 'noto-serif';
          const map = { 'kaiti': 'Kaiti', 'noto-sans': 'Noto Sans SC', 'noto-serif': 'Noto Serif SC', 'fusion-pixel': 'Fusion Pixel S' };
          return map[key] || 'Noto Serif SC';
        } catch(e) { return 'Noto Serif SC'; }
      })(),
      fontScale: 1,         // ✅ Actual font scale, used in layout
      tempFontScale: 1,     // ✅ Temporary one used by slider
      isGridView: false,    // ✅ Toggle between grid and list views
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
      showScrollTop: false,  // Controls visibility of the scroll-to-top button
      
      // Pinyin visibility toggle for list mode
      showPinyin: true  // Controls visibility of pinyin in list mode
    };
  },
  components: {
    PreloadWrapper,
    BasePage
  },
  computed: {
    // Combine store decks like in Flashcards
    decks() {
      const staticData = this.$store.getters.getDictionaryData || {};
      const customData = this.$store.getters.getCustomDictionaryData || {};
      return { ...staticData, ...customData };
    },
    currentDeckName() {
      if (!this.selectedCategory) return '';
      const deck = this.decks[this.selectedCategory];
      return deck?.name || this.selectedCategory;
    },
    dictionaryData() {
      // Pure computed: return store data without side effects
      return this.$store.getters.getDictionaryData || {};
    },
    customDictionaryData() {
      // Pure computed: return store data without side effects
      return this.$store.getters.getCustomDictionaryData || {};
    },
    slicedChars() {
      if (!this.selectedCategory) return [];

      const staticDeck = this.dictionaryData[this.selectedCategory];
      const customDeck = this.customDictionaryData[this.selectedCategory];
      const deck = staticDeck || customDeck || {};
      const charsData = deck?.chars ?? {};
      const explicitOrder = Array.isArray(deck?.order) ? deck.order : null;

      // If an explicit order exists, use it exactly
      if (explicitOrder && charsData && typeof charsData === 'object' && !Array.isArray(charsData)) {
        return explicitOrder
          .filter((c) => !!charsData[c])
          .map((c) => {
            const d = charsData[c];
            return d && typeof d === 'object' ? (d.character ? d : { ...d, character: c }) : { character: c };
          });
      }

      // Otherwise preserve original behavior (no extra sorting)
      const standard = staticDeck?.chars || {};
      const custom = customDeck?.chars || {};
      if (standard && Object.keys(standard).length > 0) {
        return Array.isArray(standard) ? standard : Object.values(standard);
      } else if (custom && Object.keys(custom).length > 0) {
        return Array.isArray(custom) ? custom : Object.values(custom);
      }
      return [];
    },
    visibleChars() {
      return this.slicedChars.slice(0, this.visibleCount);
    },
    // Full navigation list for current wordlist
    navCharList() {
      return (this.slicedChars || []).map(e => e.character);
    },
    toneColorEnabled() {
      try { return this.$store.getters['theme/isToneColorEnabled'] !== false; } catch (e) { return true; }
    },
    toneColorScheme() {
      try { return this.$store.getters['theme/getToneColorScheme'] || 'default'; } catch (e) { return 'default'; }
    }
  },
  methods: {
    displayListPinyin(hanzi, base) {
      try {
        const def = this.$store.getters.getCustomDefinition && this.$store.getters.getCustomDefinition(hanzi);
        const p = (def && def.pinyin) ? def.pinyin : base;
        return this.$toAccentedPinyin(p || '');
      } catch (e) {
        return this.$toAccentedPinyin(base || '');
      }
    },
    displayListEnglish(hanzi, base) {
      try {
        const def = this.$store.getters.getCustomDefinition && this.$store.getters.getCustomDefinition(hanzi);
        const e = (def && def.english) ? def.english : base;
        return e || '';
      } catch (err) {
        return base || '';
      }
    },
    colorizePinyin(pinyin) {
      return toneColorizePinyin(pinyin, { enabled: this.toneColorEnabled, palette: this.toneColorScheme });
    },
    colorizeHanzi(hanzi, pinyin) {
      return toneColorizeHanzi(hanzi, pinyin, { enabled: this.toneColorEnabled, palette: this.toneColorScheme });
    },
    ensureNavContextForUrlWord() {
      try {
        const isModalVisible = this.$store.getters['cardModal/isCardModalVisible'];
        const currentWord = this.$route.query.word || this.$store.getters['cardModal/getCurrentCharacter'];
        if (!currentWord) return;
        const list = this.navCharList || [];
        if (list.length === 0) return;
        // Only set context if modal is (or will be) shown and the word exists in current list
        if (list.includes(currentWord)) {
          this.$store.dispatch('cardModal/setNavContext', { list, current: currentWord });
        }
      } catch (e) {}
    },
    toggleDeckDropdown() {
      // Clicking the title toggles the dropdown instead of toggling view
      // Also collapse the leftbar when interacting with the header/title
      console.log('[GridView] toggleDeckDropdown fired');
      if (this.leftbarVisible) this.closeLeftbar();
      this.isSubmenuOpen = !this.isSubmenuOpen;
    },
    handleHeaderClick() {
      console.log('[GridView] header clicked');
      if (this.leftbarVisible) this.closeLeftbar();
    },
    changeDeck(deckKey) {
      // Switch deck using same behavior as Flashcards dropdown
      if (!deckKey || deckKey === this.selectedCategory) {
        this.isSubmenuOpen = false;
        return;
      }
      this.selectedCategory = deckKey;
      const deck = this.decks[deckKey];
      this.localPageTitle = deck?.name || deckKey;
      this.updateUrlWithCategory(deckKey);
      this.isSubmenuOpen = false;
    },
    handleOutsideClick(event) {
      try {
        // Close deck dropdown when clicking anywhere outside the dropdown
        const dropdownEl = document.getElementById('deck-options');
        const clickedInsideDropdown = dropdownEl && dropdownEl.contains(event.target);
        if (this.isSubmenuOpen && !clickedInsideDropdown) {
          this.isSubmenuOpen = false;
        }
      } catch (e) {

      }
    },
    // New methods for bubble tooltip
    showBubble(event, entry) {
      // Get pointer position
      const x = event.clientX;
      const y = event.clientY;
      
      // Prefer custom definition if available
      let custom = null;
      try {
        const getter = this.$store.getters.getCustomDefinition;
        if (getter) custom = getter(entry.character);
      } catch (e) {}

      const basePinyin = Array.isArray(entry.pinyin) ? (entry.pinyin[0] || '') : (entry.pinyin || '');
      const baseEnglish = Array.isArray(entry.english) ? (entry.english[0] || '') : (entry.english || '');
      const pinyinText = this.$toAccentedPinyin((custom && custom.pinyin) ? custom.pinyin : basePinyin);
      const englishText = (custom && custom.english) ? custom.english : baseEnglish;

      // Show the bubble with character data
      this.$store.dispatch('bubbleTooltip/showBubble', {
        character: entry.character,
        pinyin: pinyinText,
        english: englishText,
        position: { x, y },
        fontFamily: this.selectedFont
      });
    },
    
    hideBubble() {
      this.$store.dispatch('bubbleTooltip/hideBubble');
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
      const total = this.slicedChars.length;
      // If data isn't ready yet, avoid resetting counts to 0
      if (total === 0) return;

      this.visibleCount += defaultVisibleCount;
      if (this.visibleCount >= total) {
        this.visibleCount = total;
        this.reloading = false; // Done reloading
      }
      this.$nextTick(() => {
        if (this.visibleCount < total) {
          setTimeout(this.loadMore, 100);
        }
      });
    },
    toggleView() {
      this.reloading = true;          // Start reloading
      this.visibleCount = defaultVisibleCount; // Reset visible count
      this.isGridView = !this.isGridView;
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
    
    handleGridItemMouseEnter(event, entry) {
      if (window.matchMedia('(hover: hover)').matches) {
        const gridItem = event.target.closest('.grid-item');
        if (!gridItem) return;
        
        if (this.hoverTimer) {
          clearTimeout(this.hoverTimer);
          this.hoverTimer = null;
        }
        
        this.currentHoveredCharacter = entry.character;
        
        const rect = gridItem.getBoundingClientRect();
        const x = rect.left + (rect.width / 2);
        const y = rect.top;
        
        this.showBubble({
          clientX: x,
          clientY: y
        }, entry);
        
        this.hoverTimer = setTimeout(() => {
          if (!this.preloadedCharacters.has(entry.character)) {
            this.$store.dispatch('cardModal/preloadCardData', entry.character);
            this.preloadedCharacters.add(entry.character);
          }
        }, 150);
      }
    },
    
    handleGridItemMouseLeave() {
      this.hideBubble();
      
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
      // Set navigation context to full list, then open modal
      if (this.navCharList && this.navCharList.length) {
        this.$store.dispatch('cardModal/setNavContext', { list: this.navCharList, current: character });
      }
      // Show the card modal using the same action as PreloadWrapper
      this.$store.dispatch('cardModal/showCardModal', character);
    },
    // Build a query object from current state
    buildQueryFromState() {
      const existing = { ...this.$route.query };

      // Compute fallback category (default) to decide if we should omit wordlist
      const dict = this.dictionaryData || {};
      const keys = Object.keys(dict || {});
      const fallback = keys.length ? (dict.hsk1 ? 'hsk1' : keys[0]) : null;

      // Determine wordlist to include. Always include it in URL; preserve existing until resolved.
      let wordlistVal;
      if (this.selectedCategory) {
        wordlistVal = this.selectedCategory;
      } else {
        wordlistVal = existing.wordlist; // keep original until resolved
      }

      const storeDefaultKey = (this.$store && this.$store.getters && this.$store.getters['theme/getCurrentFont']) || 'noto-serif';
      const defaultFontMap = { 'kaiti': 'Kaiti', 'noto-sans': 'Noto Sans SC', 'noto-serif': 'Noto Serif SC' };
      const defaultFont = defaultFontMap[storeDefaultKey] || 'Noto Serif SC';

      const query = {
        ...existing,
        wordlist: wordlistVal,
        // Only include non-default values
        view: this.isGridView ? 'grid' : undefined, // default is grid
        font: this.selectedFont !== defaultFont ? this.selectedFont : undefined,
        fontScale: this.fontScale !== 1 ? String(this.fontScale) : undefined,
        gridGap: this.gridGapSize !== '0.25em' ? this.gridGapSize : undefined,
        borders: this.showGridBorders !== true ? (this.showGridBorders ? '1' : '0') : undefined,
        pinyin: this.showPinyin !== true ? (this.showPinyin ? '1' : '0') : undefined
      };
      // Remove undefined to avoid stray params
      Object.keys(query).forEach(k => (query[k] === undefined ? delete query[k] : null));
      console.log('qq')
      console.log(query)
      return query;
    },
    // Replace URL with current state encoded in query params
    updateUrl() {
      const newQuery = this.buildQueryFromState();
      this.$router.replace({
        query: newQuery
      }).catch(err => {
        if (err && err.name !== 'NavigationDuplicated') throw err;
      });
    },
    // New improved method to check for word parameter and other settings
    checkQueryParams() {
      const wordlist = this.$route.query.wordlist;
      const dict = this.dictionaryData;
      const custom = this.customDictionaryData;

      // If URL specifies a valid wordlist in either dataset, use it
      if (wordlist) {
        if (this.selectedCategory === wordlist) {
          return;
        }
        if (dict[wordlist]) {
          this.selectedCategory = wordlist;
          this.localPageTitle = dict[wordlist].name || wordlist;
          this.attemptedCategory = null;
          return;
        }
        if (custom[wordlist]) {
          this.selectedCategory = wordlist;
          this.localPageTitle = custom[wordlist].name || wordlist;
          this.attemptedCategory = null;
          return;
        }
        // Not found yet; likely a custom deck that will load later
        this.attemptedCategory = wordlist;
      }

      // If no URL param and data is available, default to HSK1 (or first deck)
      if (!wordlist && Object.keys(dict).length > 0 && !this.selectedCategory) {
        const fallback = dict.hsk1 ? 'hsk1' : Object.keys(dict)[0];
        if (fallback) {
          this.selectedCategory = fallback;
          this.localPageTitle = dict[fallback].name || fallback;
          this.updateUrlWithCategory(fallback);
        }
      }
      
      // Parse view/layout settings
      const { view, font, fontScale, gridGap, borders, pinyin } = this.$route.query;
      if (view === 'list' || view === 'grid') {
        this.isGridView = (view === 'grid');
      }
      if (typeof font === 'string' && font.length > 0) {
        this.selectedFont = font;
      }
      if (typeof fontScale !== 'undefined') {
        const parsed = parseFloat(fontScale);
        if (!Number.isNaN(parsed) && parsed > 0 && parsed < 10) {
          this.fontScale = parsed;
          this.tempFontScale = parsed;
        }
      }
      if (typeof gridGap === 'string') {
        const allowed = new Set(['0.25em', '1em', '3em']);
        if (allowed.has(gridGap)) this.gridGapSize = gridGap;
      }
      if (typeof borders !== 'undefined') {
        this.showGridBorders = borders === '1' || borders === 'true';
      }
      if (typeof pinyin !== 'undefined') {
        this.showPinyin = pinyin === '1' || pinyin === 'true';
      }

      // Skip opening the modal directly from here - let the store handle it
      // This prevents duplicate modal opening when multiple components detect
      // the URL parameter change
    },
    // New method to update the URL when the category changes
    updateUrlWithCategory(category) {
      // Update URL, letting buildQueryFromState decide whether to include wordlist
      const newQuery = this.buildQueryFromState();
      this.$router.replace({ query: newQuery }).catch(err => {
        if (err && err.name !== 'NavigationDuplicated') throw err;
      });
    },
    // New method to toggle sidebar visibility
    // Method to close the sidebar (always collapse on outside click)
    
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

    // Method to scroll to top
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'auto' });
    },

    // Method to handle scroll event
    handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      this.showScrollTop = scrollTop > 200;
    },
    
    // Method to toggle pinyin visibility in list mode
    togglePinyin() {
      this.showPinyin = !this.showPinyin;
    },
    // Close dropdown when clicking anywhere in main content; also collapse leftbar
    handleMainClick() {
      if (this.isSubmenuOpen) this.isSubmenuOpen = false;
    }
  },
  watch: {
    // Reset to default font when entering explorer without an explicit font query
    '$route.path'(newPath) {
      try {
        if (newPath === '/explorer' && !this.$route.query.font) {
          const key = this.$store.getters['theme/getCurrentFont'] || 'noto-serif';
          const map = { 'kaiti': 'Kaiti', 'noto-sans': 'Noto Sans SC', 'noto-serif': 'Noto Serif SC' };
          this.selectedFont = map[key] || 'Noto Serif SC';
        }
      } catch (e) {}
    },
    // When the underlying list changes, reapply context for URL word if present
    slicedChars() {
      this.ensureNavContextForUrlWord();
    },
    '$route.query.word'(/*val*/) {
      this.ensureNavContextForUrlWord();
    },
    selectedCategory() {
      this.visibleCount = defaultVisibleCount; 
      this.updateUrlWithCategory(this.selectedCategory);
      this.$nextTick(this.loadMore);
    },
    // Sync key settings to URL so links preserve view state
    isGridView() {
      this.updateUrl();
    },
    selectedFont() {
      this.updateUrl();
    },
    fontScale() {
      this.updateUrl();
    },
    gridGapSize() {
      this.updateUrl();
    },
    showGridBorders() {
      this.updateUrl();
    },
    showPinyin() {
      this.updateUrl();
    },
    // Add a watcher for route changes to handle direct URL navigation
    '$route.query': {
      handler() {
        this.checkQueryParams();
      },
      immediate: true
    },
    // Watch for dictionary data changes to handle initial load and title updates
    dictionaryData: {
      handler(newVal, oldVal) {
        this.waitingForDictData = Object.keys(newVal || {}).length === 0;
        // Re-evaluate URL/defaults when dict data changes
        this.checkQueryParams();
        // Keep title in sync for selected category
        if (this.selectedCategory) {
          const key = this.selectedCategory;
          if (newVal[key]) {
            this.localPageTitle = newVal[key].name || key;
          } else if (this.customDictionaryData[key]) {
            this.localPageTitle = this.customDictionaryData[key].name || key;
          }
        }
      },
      immediate: true
    },
    // Watch for custom data to resolve attempted custom categories
    customDictionaryData: {
      handler(newVal) {
        if (this.attemptedCategory && newVal[this.attemptedCategory]) {
          const key = this.attemptedCategory;
          this.selectedCategory = key;
          this.localPageTitle = newVal[key].name || key;
          this.attemptedCategory = null;
          this.updateUrlWithCategory(key);
        } else if (this.selectedCategory && newVal[this.selectedCategory]) {
          const key = this.selectedCategory;
          this.localPageTitle = newVal[key].name || key;
        }
      },
      immediate: true
    }
  },
  mounted() {
    // Check for URL parameters first when component mounts
    this.checkQueryParams();
    // Initial load will be triggered when category/data are ready
    // Add event listener for keydown events
    window.addEventListener('keydown', this.handleKeyDown);

    // Close deck dropdown on outside click (bind to preserve component context)
    this._onDocClick = (e) => this.handleOutsideClick(e);
    document.addEventListener('click', this._onDocClick);
    // Add event listener for the sidebar opening event
    
    // Use window scroll event instead of container scroll event
    window.addEventListener('scroll', this.handleScroll);
    // Initial check for scroll position
    this.handleScroll();

    // Ensure nav context if page opened with ?word=
    this.$nextTick(() => this.ensureNavContextForUrlWord());
  },
  beforeUnmount() {
    // Remove event listener for keydown events
    window.removeEventListener('keydown', this.handleKeyDown);
    
    // Remove event listener for the sidebar opening event
    
    // Remove window scroll event listener
    window.removeEventListener('scroll', this.handleScroll);

    // Remove outside click listener
    if (this._onDocClick) {
      document.removeEventListener('click', this._onDocClick);
      this._onDocClick = null;
    }
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
  text-decoration: underline;
  position: relative;
}

.view-toggle-fixed {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
  color: var(--fg);
  border: 2px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 25%);
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  z-index: 10;
}

.view-toggle-fixed:hover {
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 60%);
}

#deck-options {
  position: absolute;
  top: 100%;
  width: 100%;
  max-width: 300px;
  max-height: 0;
  background-color: var(--bg);
  z-index: 1;
  left: 1em;
  top: 5em;
  left: 14em;
  /*left: 50%;
  transform: translateX(-50%);*/
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
  font-weight: var(--hanzi-weight) !important;
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
  gap: 0.5rem;
  gap: 0.0rem;
  width: 100%;
}


@media (min-width: 1024px) {
  .list-container {
    width: 60%;
    margin: 0 auto;
  }
}


.hanzipinyin {
}


.list-item:hover .list-pinyin.pinyin-hidden {
  visibility: visible;
}

.list-english {
  font-size: 1em;
  color: var(--fg);
  opacity: 0.6;
  opacity: 1.0;
  flex: 12;
  min-width: 0;        /* prevent flex item from forcing overflow */
  max-width: 100%;
  white-space: normal; /* allow wrapping */
  overflow-wrap: anywhere; /* break long words without spaces */
  word-break: break-word;   /* fallback */
  word-wrap: break-word;    /* legacy fallback */
}

select {
  margin-bottom: 20px;
  padding: 5px;
  font-size: 1em;
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
  font-size: 1.1em;
  padding: 1em;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 1;
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

.close-button {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  display: block;
  color: var(--fg);
  opacity: 0.7;
  padding:
}

.close-button:hover {
  opacity: 1;
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

  .list-item {
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


  #deck-options {
    position: absolute;
    top: 90%;
    width: 100%;
    max-width: 300px;
    max-height: 0;
    background-color: var(--bg);
    z-index: 1;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
