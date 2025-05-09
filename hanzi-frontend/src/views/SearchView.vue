<template>
  <BasePage page_title="Search" />
  <div class="search-view">
    <form @submit.prevent="doSearch" class="search-form">
      <input
        v-model="query"
        type="text"
        placeholder="enter search term"
        class="search-input"
        @input="handleInput"
      />
      <!-- Search button kept but hidden by default -->
      <button type="submit" class="search-button" style="display: none;">Search</button>
    </form>
    <div v-if="isSearching" class="loading-indicator">
      searching...
    </div>
    <div v-if="!isLoading" class="results">
      <PreloadWrapper
      v-for="(result, index) in results"
      :key="index"
      :character="result.hanzi"
      :showBubbles="false"
      >
        <div class="result-cell">
          <div class="result-number">{{ index + 1 }}</div>
          <div class="hanzipinyin">
          <div class="rhanzi">{{ result.hanzi }}</div>
          <div class="rpinyin" v-html="highlightMatch($toAccentedPinyin(result.pinyin))"></div>
          </div>
          <div class="renglish" v-html="highlightMatch($toAccentedPinyin(result.english))"></div>
        </div>
      </PreloadWrapper>
    </div>
    
    <!-- Scroll to top button -->
    <button 
      v-if="showScrollTop" 
      @click="scrollToTop" 
      class="scroll-to-top-button"
      aria-label="Scroll to top"
    >
      ↑
    </button>
  </div>
</template>

<script>
import BasePage from '../components/BasePage.vue';
import PreloadWrapper from '../components/PreloadWrapper.vue';

export default {
  components: {
    BasePage,
    PreloadWrapper,
  },
  data() {
    return {
      query: '',
      results: [],
      isLoading: false,
      isSearching: false,
      showScrollTop: false,
      searchTimeout: null,
      latestQuery: '', // Track the latest query to ensure no inputs are lost
    };
  },
  created() {
    // Check if there's a query parameter in the URL
    const queryParam = this.$route.query.q;
    if (queryParam) {
      this.query = queryParam;
      
      // Check if we have a pending search promise from PageInfoView
      if (window.pendingSearchPromise) {
        this.isLoading = true;
        // Use the existing promise
        window.pendingSearchPromise
          .then(res => res.json())
          .then(data => {
            this.results = data.results;
            this.isLoading = false;
          })
          .catch(error => {
            console.error("Error processing search results:", error);
            this.isLoading = false;
            // Fallback to a new search if the pending one fails
            this.doSearch();
          })
          .finally(() => {
            // Clear the pending promise
            window.pendingSearchPromise = null;
          });
      } else {
        // If no pending promise exists, perform the search now
        this.debouncedSearch();
      }
    }
  },
  mounted() {
    // Add event listener for scroll
    window.addEventListener('scroll', this.handleScroll);
    // Initial check for scroll position
    this.handleScroll();
  },
  beforeUnmount() {
    // Remove scroll event listener when component is unmounted
    window.removeEventListener('scroll', this.handleScroll);
    // Clear any pending timeouts
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  },
  methods: {
    handleInput() {
      // Store the latest query value
      this.latestQuery = this.query;
      
      // Clear any existing timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      // Only trigger search if query has 2 or more characters
      if (this.query.length >= 2) {
        this.isLoading = true;
        this.searchTimeout = setTimeout(() => {
          this.isSearching = true;
          this.query = this.latestQuery;
          this.doSearch();
        }, 366);
      } else {
        // Clear results and loading state if query is too short
        this.results = [];
        this.isLoading = false;
        this.isSearching = false;
      }
    },
    
    debouncedSearch() {
      // Helper method to handle initial search with debounce logic
      if (this.query.length >= 2) {
        // Store the query as latestQuery to maintain consistency
        this.latestQuery = this.query;
        this.doSearch();
      }
    },
    
    async doSearch() {
      this.isLoading = true;

      try {
        const query = encodeURIComponent(this.latestQuery);
        const res = await fetch(`/api/search_results?query=${query}`);
        const data = await res.json();
        this.results = data.results;
      } catch (error) {
        console.error("Error during search:", error);
      } finally {
        this.isLoading = false;
        this.isSearching = false;
      }
    },
    highlightMatch(text) {
      if (!this.query) return text;

      const stripAccents = (s) =>
        s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

      const plainText = stripAccents(text);
      const plainQuery = stripAccents(this.query);

      if (!plainQuery) return text;

      const indices = [];
      let i = 0;
      while (i < plainText.length) {
        const foundAt = plainText.indexOf(plainQuery, i);
        if (foundAt === -1) break;
        indices.push([foundAt, foundAt + plainQuery.length]);
        i = foundAt + plainQuery.length;
      }

      if (!indices.length) return text;

      // Apply highlights to original text using <mark> tag
      let result = '';
      let last = 0;
      for (const [start, end] of indices) {
        result += text.slice(last, start);
        // result += '<mark>' + text.slice(start, end) + '</mark>';
        result += text.slice(start, end);
        last = end;
      }
      result += text.slice(last);

      return result;
    },
    
    // New methods for scroll to top functionality
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      this.showScrollTop = scrollTop > 200;
    }
  },
};
</script>

<style scoped>
.search-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  flex-wrap: wrap;
}

.search-form {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  max-width: 600px;
  margin: 0 auto 2rem auto;
  flex-wrap: wrap; /* Add this line to make input and button wrap on narrow screens */
}

.loading-indicator {
  margin-top: 2rem;
  font-size: 1.5rem;
  color: var(--fg);
  opacity: 0.8;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  justify-content: center;
  align-items: stretch;
  max-width: 1500px;
}

.result-cell {
  border:var(--thin-border-width) solid color-mix(in oklab, var(--fg) 35%, var(--bg) 50%);
  padding: .5rem;
  font-family: inherit;
  text-align: left;
  background: var(--bg);
  width: 100%;
  display: flex;
  box-sizing: border-box;
  position: relative; /* Added for absolute positioning of number indicator */
}

.result-cell:hover {
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  cursor: pointer;
}

.result-number {
  position: absolute;
  top: .25em;
  right: .25em;
  font-size: 0.9rem;
  color: var(--fg);
  opacity: 0.5;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.hanzipinyin {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  flex: 2;
}

.rhanzi {
  font-size: 2rem;
  padding-right: 2rem;
  font-family: Kaiti;
}

.rpinyin {
  font-style: italic;
  color: var(--fg);
  opacity: 0.6;
}

.renglish {
  color: var(--fg);
  flex: 12;
  margin-right: 1em;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

@media (max-width: 600px) {
  .result-cell {
    flex-direction: column;
    align-items: flex-start;
  }
  .search-view {
    padding: 1rem;
  }
}

/* Scroll to top button styles */
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
</style>

