<template>
  <BasePage page_title="Search" />
  <div class="search-view">
    <form @submit.prevent="doSearch" class="search-form">
      <input
        v-model="query"
        type="text"
        placeholder="Enter search term"
        class="search-input"
      />
      <button type="submit" class="search-button">Search</button>
    </form>
    <div v-if="isLoading" class="loading-indicator">
      searching...
    </div>
    <div v-else class="results">
      <PreloadWrapper
        v-for="(result, index) in results"
        :key="index"
        :character="result.hanzi"
      >
        <div class="result-cell">
          <div class="hanzipinyin">
            <div class="rhanzi">{{ result.hanzi }}</div>
            <div class="rpinyin" v-html="highlightMatch($toAccentedPinyin(result.pinyin))"></div>
          </div>
          <div class="renglish" v-html="highlightMatch($toAccentedPinyin(result.english))"></div>
        </div>
      </PreloadWrapper>
    </div>
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
        this.doSearch();
      }
    }
  },
  methods: {
    async doSearch() {
      this.isLoading = true;
      this.results = [];  // Clear current results immediately
      
      try {
        const res = await fetch('/api/search_results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: this.query }),
        });
        const data = await res.json();
        this.results = data.results;
        console.log(this.results);
      } catch (error) {
        console.error("Error during search:", error);
      } finally {
        this.isLoading = false;
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
  border: 2px solid color-mix(in oklab, var(--fg) 35%, var(--bg) 50%);
  padding: .5rem;
  font-family: inherit;
  text-align: left;
  background: var(--bg);
  width: 100%;
  display: flex;
}

.result-cell:hover {
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  cursor: pointer;
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
}
</style>

