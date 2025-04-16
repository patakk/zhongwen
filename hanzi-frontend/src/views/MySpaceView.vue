<template>
    <BasePage page_title="My Space" />
    <div class="myspace-view">
      <div class="wordlist-container">
        <div class="wordlist-header">
          <h2>My Wordlists</h2>
  
          <div class="wordlist-selector">
            <label for="wordlist-select">Select Wordlist:</label>
            <select
              id="wordlist-select"
              v-model="selectedWordlist"
              @change="loadWordlistWords"
            >
              <option
                v-for="list in customDecks"
                :key="list.name"
                :value="list.name"
              >
                {{ list.name }}
              </option>
            </select>
          </div>
        </div>
  
        <div v-if="loading" class="loading">Loading wordlist...</div>
  
        <div v-else-if="!selectedWordlist" class="empty-list">
          <p>Please select a wordlist from the dropdown above.</p>
        </div>
  
        <div v-else>
          <div v-if="words.length === 0" class="empty-list">
            <p>This wordlist is empty. Add words from the Search or Grid views.</p>
          </div>
  
          <div v-else>
            <!-- Dummy info panel -->
            <div class="wordlist-info">
              <p><strong>Description:</strong> {{ wordlistDescription }}</p>
              <p><strong>Created:</strong> {{ wordlistCreatedDate }}</p>
              <p><strong>Number of Words:</strong> {{ words.length }}</p>
              <p>
                <strong>Tags:</strong>
                <span v-for="tag in wordlistTags" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </p>
            </div>
  
            <!-- Navigation buttons -->
            <div class="nav-buttons">
              <router-link
                :to="{
                  path: '/flashcards',
                  query: { wordlist: selectedWordlist }
                }"
                class="nav-button"
                title="Go to Flashcards"
              >
                flashcards
              </router-link>
              <router-link
                :to="{
                  path: '/grid',
                  query: { wordlist: selectedWordlist }
                }"
                class="nav-button"
                title="Go to Grid View"
              >
                grid view
              </router-link>
            </div>
  
            <!-- Word list -->
            <div class="word-list">
                <PreloadWrapper :character="word.character"
                    v-for="word in words"
                    :key="word.character"
                    class="word-item"
                    :title="word.english[0]"
                >
                    <div class="word-cell">
                        <div class="hanzipinyin">
                        <div class="word-hanzi">{{ word.character }}</div>
                        <div class="word-pinyin">
                            {{ $toAccentedPinyin(word.pinyin[0]) }}
                        </div>
                        </div>
                        <div class="word-english">{{ word.english[0] }}</div>
                        <button
                            class="remove-button"
                            @click.stop="removeWord(word.character)"
                            title="Remove from wordlist"
                            >
                            ✕
                        </button>
                    </div>
                </PreloadWrapper>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import BasePage from '../components/BasePage.vue';
  import PreloadWrapper from '../components/PreloadWrapper.vue';
  
  export default {
    name: 'MySpaceView',
    components: {
      BasePage,
      PreloadWrapper,
    },
    data() {
      return {
        selectedWordlist: '',
        words: [],
        loading: false,
        // Dummy data for future fields
        wordlistDescription: 'A curated list of useful vocabulary.',
        wordlistCreatedDate: '2024-01-15',
        wordlistTags: ['Beginner', 'HSK1', 'Favorites'],
      };
    },
    computed: {
      customDecks() {
        return this.$store.getters.getCustomDecks;
      },
      customDecksData() {
        return this.$store.getters.getCustomDictionaryData;
      },
    },
    watch: {
      selectedWordlist(newVal) {
        // Reset dummy info on wordlist change (could be dynamic later)
        this.wordlistDescription = `Description for "${newVal}"`;
        this.wordlistCreatedDate = '2024-01-15'; // static for now
        this.wordlistTags = ['ExampleTag1', 'ExampleTag2'];
      },
    },
    mounted() {
      if (this.customDecks && this.customDecks.length > 0) {
        this.selectedWordlist = this.customDecks[0].name;
  
        if (
          this.customDecksData &&
          this.customDecksData[this.selectedWordlist]
        ) {
          this.loadWordlistWords();
        } else {
          this.loading = true;
          this.$store
            .dispatch('fetchCustomDictionaryData')
            .then(() => {
              this.loading = false;
              this.loadWordlistWords();
            })
            .catch((err) => {
              console.error('Error loading custom dictionary data:', err);
              this.loading = false;
            });
        }
      } else {
        this.loading = true;
        this.$store
          .dispatch('fetchUserData')
          .then(() => this.$store.dispatch('fetchCustomDictionaryData'))
          .then(() => {
            this.loading = false;
            if (this.customDecks && this.customDecks.length > 0) {
              this.selectedWordlist = this.customDecks[0].name;
              this.loadWordlistWords();
            }
          })
          .catch((err) => {
            console.error('Error loading user or dictionary data:', err);
            this.loading = false;
          });
      }
    },
    methods: {
      loadWordlistWords() {
        try {
          if (
            this.customDecksData &&
            this.selectedWordlist &&
            this.customDecksData[this.selectedWordlist]
          ) {
            const charsData = this.customDecksData[this.selectedWordlist].chars;
  
            if (charsData) {
              this.words = Object.entries(charsData).map(([character, data]) => ({
                character,
                ...data,
              }));
            } else {
              this.words = [];
            }
          } else {
            this.words = [];
          }
        } catch (error) {
          console.error('Error loading wordlist words:', error);
          this.words = [];
        }
      },
  
      removeWord(character) {
        if (!this.selectedWordlist) return;
  
        this.words = this.words.filter((word) => word.character !== character);
  
        this.$store.dispatch('removeWordFromCustomDeck', {
          character,
          selectedWordlist: this.selectedWordlist,
        });
  
        fetch('/api/remove_word_from_learning', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            character,
            set_name: this.selectedWordlist,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              console.error('Failed to remove word');
              this.loadWordlistWords();
            }
          })
          .catch((error) => {
            console.error('Error removing word:', error);
            this.loadWordlistWords();
          });
      },
    },
  };
  </script>
  
  <style scoped>
  .myspace-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    background: var(--bg);
    min-height: 100vh;
  }
  
  .wordlist-container {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    background: var(--bg-alt);
    /* border-radius: 12px; */
    box-shadow: 0 4px 12px color-mix(in oklab, var(--fg) 20%, var(--bg) 50%);
    padding: 2rem;
    box-sizing: border-box;
  }
  
  .wordlist-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .wordlist-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  select {
    padding: 0.5rem 0.75rem;
    border: 2px solid var(--fg);
    background: var(--bg);
    color: var(--fg);
    font-family: inherit;
    /* border-radius: 6px; */
    cursor: pointer;
  }
  
  select:hover,
  select:focus {
    border-color: var(--accent);
    outline: none;
  }
  
  .loading,
  .empty-list {
    text-align: center;
    padding: 2rem;
    color: var(--fg);
    opacity: 0.7;
    font-style: italic;
  }
  
  .wordlist-info {
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
    color: var(--fg);
    line-height: 1.4;
  }
  
  .wordlist-info p {
    margin: 0.3rem 0;
  }
  
  .tag {
    display: inline-block;
    background: var(--accent);
    color: var(--bg);
    padding: 0.15rem 0.5rem;
    margin-right: 0.4rem;
    border-radius: 4px;
    font-size: 0.85rem;
    user-select: none;
  }
  
  .nav-buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .nav-button {
    background: var(--bg);
    color: color-mix(in oklab, var(--fg) 100%, var(--bg) 50%);
    padding: 0.5rem 1.2rem;
    /* border-radius: 8px; */
    text-decoration: none;
    user-select: none;
    box-shadow: 0 2px 6px color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  }
  
  .nav-button:hover {
    background: var(--accent-dark);
    box-shadow: 0 4px 12px color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
    color: color-mix(in oklab, var(--fg) 100%, var(--bg) 0%);
  }
  
  .word-list {
    display: flex;
    flex-direction: column;
    gap: .5rem;
    overflow-y: auto;
    padding-right: 0.5rem;
  }
  
  .word-item {
    border: 2px solid color-mix(in oklab, var(--fg) 12%, var(--bg) 12%);
    background: var(--bg);
    align-items: stretch;
    width: 100%;
    box-sizing: border-box;
  }
  
  .word-item:hover {
    background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  }
  
  .word-cell {
    width: 100%;
    display: flex;
    padding: .3rem;
    cursor: pointer;
    user-select: none;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    position: relative;
  }
  
  .hanzipinyin {
    display: flex;
    flex-direction: column;
    width: 110px;
    min-width: 110px;
    margin-right: 1rem;
    user-select: text;
  }
  
  .word-hanzi {
    font-size: 1.7rem;
    font-family: Kaiti, serif;
    user-select: text;
  }
  
  .word-pinyin {
    font-size: .8em;
    font-style: italic;
    color: var(--fg);
    opacity: 0.6;
    user-select: text;
  }
  
  .word-english {
    font-size: .8em;
    flex: 1;
    display: flex;
    align-items: center;
    font-weight: 500;
    user-select: text;
  }
  
  .remove-button {
    background: transparent;
    border: none;
    color: var(--fg);
    opacity: 0.35;
    padding: 0 1rem;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    margin-left: auto;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s, background-color 0.2s;
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    height: auto;
  }
  
  .remove-button:hover {
    opacity: 1;
    /* background-color: color-mix(in oklab, var(--fg) 15%, var(--bg) 50%); */
  }
  </style>
