<template>
  <div class="app-wrapper">

    <BasePage :page_title="localPageTitle" />

    <div class="page-layout">
      <div class="leftbar">
        <h2>Settings</h2>

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
          @click="isListView = !isListView"
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


        <!-- Font Scale Slider -->
        <label for="font-scale">Font Scale:</label>
        <input
          type="range"
          min="0.6"
          max="2"
          step="0.1"
          :value="tempFontScale"
          @input="tempFontScale = parseFloat($event.target.value)"
          @change="applyFontScale"
        />
        <div>{{ tempFontScale }}x</div>
      </div>

      <main class="main-content">
        <div v-if="selectedCategory">
          <div class="dictionary-category">
            <!-- Grid View -->
            <div v-if="!isListView" class="grid-container" :style="{ gridTemplateColumns: `repeat(auto-fill, minmax(${fontScale*1.1*100}px, 1fr))`, fontSize: `${fontScale*1.1}em` }">
              <PreloadWrapper 
                v-for="(entry, index) in slicedChars.slice(0, visibleCount)" 
                :key="entry.character" 
                :character="entry.character"
              >
                <div class="grid-item">
                  <div class="hanzi" :style="{ fontFamily: `'${selectedFont}'` }">
                    {{ entry.character }}
                  </div>
                  <div class="pinyin">{{ $toAccentedPinyin(entry.pinyin.join(', ')) }}</div>
                </div>
              </PreloadWrapper>
            </div>
            
            <!-- List View -->
            <div v-else class="list-container" :style="{fontSize: `${fontScale*1.1}em` }">
              <PreloadWrapper
                v-for="(entry, index) in slicedChars.slice(0, visibleCount)"
                :key="entry.character"
                :character="entry.character"
              >
                <div class="list-item">
                  <div class="hanzipinyin">
                    <div class="list-hanzi" :style="{ fontFamily: `'${selectedFont}'` }">
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
      visibleCount: 180,
      hoveredItem: null,

      selectedFont: 'Kaiti',
      fontScale: 1,         // ✅ Actual font scale, used in layout
      tempFontScale: 1,     // ✅ Temporary one used by slider
      isListView: false     // ✅ Toggle between grid and list views
    };
  },
  components: {
    PreloadWrapper,
    BasePage
  },
  computed: {
    dictionaryData() {
      if (this.$store.getters.getDictionaryData) {
        this.selectedCategory = 'hsk1';
        this.localPageTitle = this.$store.getters.getDictionaryData.hsk1.name || 'hsk1';
      }
      return this.$store.getters.getDictionaryData;
    },
    slicedChars() {
      if (!this.selectedCategory) return [];

      const chars = this.dictionaryData[this.selectedCategory].chars || {};
      return Object.values(chars);
    }
  },
  methods: {
    applyFontScale() {
      this.fontScale = this.tempFontScale;
    },
    loadMore() {
      this.visibleCount += defaultVisibleCount;
      if (this.visibleCount >= this.slicedChars.length) {
        this.visibleCount = this.slicedChars.length;
      }
      this.$nextTick(() => {
        if (this.visibleCount < this.slicedChars.length) {
          setTimeout(this.loadMore, 100); 
        }
      });
    },
    // New method to check for query parameters and update the selected category
    checkQueryParams() {
      const wordlist = this.$route.query.wordlist;
      if (wordlist && this.dictionaryData && this.dictionaryData[wordlist]) {
        this.selectedCategory = wordlist;
        this.localPageTitle = this.dictionaryData[wordlist].name || wordlist;
      }
    }
  },
  watch: {
    selectedCategory() {
      this.visibleCount = defaultVisibleCount; 
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
    this.checkQueryParams();
    this.$nextTick(this.loadMore);
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
  margin: 1em;
}

.dictionary-category {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1em;
  width: 100%;
  box-sizing: border-box;
}

.grid-item {
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  padding: 0.35em;
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
}

.main-content {
  width: 88%;
  padding: 0em 3em 2em 1em;
  box-sizing: border-box;
  overflow-y: auto;
  height: 100%;  
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

</style>

