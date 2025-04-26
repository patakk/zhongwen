<template>
  <BasePage page_title="Hanzi" /> 
  <div class="page-info">
    <div class="infoTitle">Chinese Language Learning</div>
    
    <form @submit.prevent="goToSearch" class="search-form">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="search for words or characters..."
        class="search-input"
      />
      <button type="submit" class="search-button">search</button>
    </form>
    
    <div class="content">
      <section class="example-section">
        <h2>My Random Words</h2> 
        <div v-if="loading" class="loading-indicator">
          Loading random words...
        </div>
        <div v-else class="word-grid">
          <div v-for="(word, index) in randomWords" :key="index" class="word-item">
            <PreloadWrapper :character="word.character">
              <span class="chinese-word">{{ word.character }}</span>
            </PreloadWrapper>
            <span class="mpinyin">{{ word.pinyin }}</span>
            <span class="meaning">{{ word.meaning }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import PreloadWrapper from '../components/PreloadWrapper.vue';
import BasePage from '../components/BasePage.vue';

export default {
  name: 'PageInfoView',
  components: {
    PreloadWrapper,
    BasePage
  },
  data() {
    return {
      searchQuery: '',
      randomWords: [],
      numRandomWords: 3,
      loading: true
    };
  },
  computed: {
    storeDecks() {
      // Combine static and custom dictionary data
      const staticData = this.$store.getters.getDictionaryData || {};
      const customData = this.$store.getters.getCustomDictionaryData || {};
      return { ...staticData, ...customData };
    }
  },
  watch: {
    storeDecks: {
      handler(newDecks) {
        // When store decks change and we have data available
        if (Object.keys(newDecks).length > 0) {
          this.loading = false;
          // this.getRandomWords();
        }
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {
    if (Object.keys(this.storeDecks).length > 0) {
      this.loading = false;
      this.getRandomWords();
    } else {
      // If no data in store, force fetch the data
      this.loading = true;
      
      // Dispatch both actions to fetch data (similar to MySpaceView)
      Promise.all([
        this.$store.dispatch('fetchDictionaryData'),
        this.$store.dispatch('fetchCustomDictionaryData')
      ]).then(() => {
        this.loading = false;
        this.getRandomWords();
      }).catch(error => {
        console.error('Error loading dictionary data:', error);
        this.loading = false;
      });
    }
  },
  methods: {
    goToSearch() {
      // Start the search request immediately
      const searchPromise = fetch('/api/search_results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: this.searchQuery }),
      });
      
      // Store the search promise in a global variable that SearchView can access
      window.pendingSearchPromise = searchPromise;
      
      // Navigate to the search page with the query parameter
      this.$router.push({ name: 'SearchPage', query: { q: this.searchQuery } });
    },
    
    getRandomWords() {
      try {
        // Initialize empty arrays to hold characters
        let allCustomChars = [];
        let basicChars = [];
        
        // Get data from store
        const customData = this.$store.getters.getCustomDictionaryData || {};
        const staticData = this.$store.getters.getDictionaryData || {};
        
        // First collect characters from custom dictionaries
        for (const [deckKey, deck] of Object.entries(customData)) {
          const chars = Array.isArray(deck.chars) ? deck.chars : Object.keys(deck.chars);
          allCustomChars = [...allCustomChars, ...chars];
        }
        
        // Collect HSK1 and HSK2 characters as backup
        if (staticData.hsk1 && staticData.hsk1.chars) {
          const chars = Array.isArray(staticData.hsk1.chars) ? staticData.hsk1.chars : Object.keys(staticData.hsk1.chars);
          basicChars = [...basicChars, ...chars];
        }
        
        if (staticData.hsk2 && staticData.hsk2.chars) {
          const chars = Array.isArray(staticData.hsk2.chars) ? staticData.hsk2.chars : Object.keys(staticData.hsk2.chars);
          basicChars = [...basicChars, ...chars];
        }
        
        // Shuffle the custom characters
        allCustomChars = this.shuffleArray(allCustomChars);
        
        // If we don't have enough custom characters, add some from HSK1/HSK2
        if (allCustomChars.length < this.numRandomWords) {
          basicChars = this.shuffleArray(basicChars);
          // Add enough basic characters to reach the desired number
          allCustomChars = [...allCustomChars, ...basicChars.slice(0, this.numRandomWords - allCustomChars.length)];
        }
        
        // Take just the number we need
        const selectedChars = allCustomChars.slice(0, this.numRandomWords);
        
        // Get word info for each character from the store
        this.randomWords = selectedChars.map(char => this.getWordInfoFromStore(char));
      } catch (error) {
        console.error('Error getting random words:', error);
        // Fallback with some default words if there's an error
        this.randomWords = [
          { character: '你好', pinyin: 'nǐ hǎo', meaning: 'Hello' },
          { character: '谢谢', pinyin: 'xièxie', meaning: 'Thank you' },
          { character: '再见', pinyin: 'zàijiàn', meaning: 'Goodbye' }
        ];
      }
    },
    
    getWordInfoFromStore(character) {
      // First look in custom dictionaries
      const customData = this.$store.getters.getCustomDictionaryData || {};
      for (const [deckKey, deck] of Object.entries(customData)) {
        if (Array.isArray(deck.chars)) {
          // Skip decks that have chars as arrays without detailed info
          continue;
        }
        
        // Check if this character exists in the current deck
        if (deck.chars && deck.chars[character]) {
          const charInfo = deck.chars[character];
          return {
            character: character,
            pinyin: this.$toAccentedPinyin(charInfo.pinyin ? charInfo.pinyin[0] : ''),
            meaning: charInfo.english ? charInfo.english[0] : ''
          };
        }
      }
      
      // If not found in custom dictionaries, check static dictionaries
      const staticData = this.$store.getters.getDictionaryData || {};
      for (const [deckKey, deck] of Object.entries(staticData)) {
        if (Array.isArray(deck.chars)) {
          // Skip decks that have chars as arrays without detailed info
          continue;
        }
        
        // Check if this character exists in the current deck
        if (deck.chars && deck.chars[character]) {
          const charInfo = deck.chars[character];
          return {
            character: character,
            pinyin: this.$toAccentedPinyin(charInfo.pinyin ? charInfo.pinyin[0] : ''),
            meaning: charInfo.english ? charInfo.english[0] : ''
          };
        }
      }
      
      // If not found in any deck with detailed info, return basic structure
      return {
        character: character,
        pinyin: '',
        meaning: ''
      };
    },
    
    shuffleArray(array) {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    }
  }
}
</script>

<style scoped>
.page-info {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.content {
  margin-top: 2rem;
  line-height: 1.6;
}

section {
  margin-bottom: 3rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  box-shadow: var(--card-shadow);
  border: var(--card-border);
}

.infoTitle {
  color: var(--fg);
  text-align: center;
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 2rem;
}

h2 {
  color: var(--fg);
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.word-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.word-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--bg);
  border-radius: 8px;
}

.chinese-word {
  font-size: 1.5em;
  color: var(--fg);
  cursor: pointer;
  margin-bottom: 0.5rem;
  background-color: none;
  padding: .125em 0.25em;
}

.chinese-word:hover {
  box-shadow: var(--card-shadow);
  border: var(--card-border);
}

.pinyin {
  color: var(--fg);
  font-size: 0.9em;
  margin-bottom: 0.25rem;
}

.meaning {
  color: var(--fg);
  font-size: 0.9em;
}

.search-form {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  max-width: 600px;
  margin: 0 auto 2rem auto;
  flex-wrap: wrap; /* Add this to make the form wrap on narrow screens */
}

input.search-input {
  flex: 1;
  min-width: 200px; /* This ensures the input doesn't get too narrow before wrapping */
}

.mpinyin {
  color: var(--fg);
  font-size: 0.9em;
  margin-bottom: 0.25rem;
}

.loading-indicator {
  text-align: center;
  padding: 2rem;
  color: var(--fg);
  font-style: italic;
}
</style>
