<template>
  <div class="modal-overlay" v-if="visible" @click="closeModal">
    
    <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <div>Loading...</div>
      </div>
    <div v-else class="modal card-modal" @click.stop="handleModalClick">
      <button @click="closeModal" class="close-btn">×</button>

      <!-- Add to wordlist dropdown button -->
      <div v-if="isLoggedIn" class="wordlist-dropdown">
        <button @click.stop="toggleWordlistDropdown" class="wordlist-btn">
          <span class="plus-icon">+</span> Add to list
        </button>
        <div v-if="showWordlistDropdown" class="dropdown-content" @click.stop>
          <div v-if="customWordlists.length === 0" class="no-lists">No custom wordlists available</div>
          <div v-else>
            <div v-for="wordlist in customWordlists" :key="wordlist.id" 
                class="wordlist-item"
                @click.stop="addWordToList(wordlist.name)">
              {{ wordlist.name }}
            </div>
          </div>
        </div>
      </div>

      <!-- ✅ Loading State -->

      <!-- ✅ Actual Modal Content -->
        <!-- Main word section -->
        <div class="main-word-section">
          <div class="main-word">
            <span
              v-for="(char, index) in data.character.split('')"
              :key="index"
              class="main-word-char"
              @click="setActiveChar(char)"
            >
              {{ char }}
            </span>
          </div>
          <div class="minor-character">{{ data.character }}</div>

          <!-- Check if there are multiple pronunciations -->
          <div v-if="data.pinyin.length > 1" class="multi-pronunciation">
            <div v-for="(pinyin, index) in data.pinyin" :key="index" class="pronunciation-item">
              <div class="p-pinyin">{{ $toAccentedPinyin(pinyin) }}</div>
              <div class="p-english">{{ data.english[index] }}</div>
            </div>
          </div>

          <!-- Single pronunciation -->
          <div v-else>
            <div class="main-pinyin">{{ $toAccentedPinyin(data.pinyin[0]) }}</div>
            <div class="main-english">{{ data.english[0] }}</div>
          </div>
        </div>

        <!-- Character breakdown section -->
        <div class="breakdown-section" v-if="data.chars_breakdown">
          <h3 class="char-breakdown">Character Breakdown ↓</h3>

          <!-- Tabs -->
          <div class="tabs" v-if="validChars.length > 1">
            <button
              v-for="char in validChars"
              :key="char"
              :class="['tab-btn', { active: activeChar === char }]"
              @click="activeChar = char"
            >
              {{ char }}
            </button>
          </div>

          <!-- Tab content -->
          <div class="tab-content" v-if="activeCharData">
            <div class="char-details">
              <div class="freq-trad-anim">
                <div class="freq-trad">
                  <!-- <div class="detail-group">
                    <span class="basic-label">Frequency rank:</span> {{ activeCharData.rank }}
                  </div> -->
                  <div class="detail-group">
                    <!-- <span class="basic-label">Pinyin:</span> {{ $toAccentedPinyin(activeCharData.main_word_pinyin[0]) }} -->
                    <span class="basic-label">Pinyin:</span> {{ activeCharData.main_word_pinyin.map((word) => $toAccentedPinyin(word)) }}
                  </div>
                  <div class="detail-group">
                    <!-- <span class="basic-label">Pinyin:</span> {{ $toAccentedPinyin(activeCharData.main_word_english[0]) }} -->
                    <span class="basic-label">Meaning:</span> {{ activeCharData.main_word_english.map((word) => $toAccentedPinyin(word)) }}
                  </div>

                  <div v-if="activeChar !== activeCharData.traditional" class="detail-group">
                      <span class="basic-label">Traditional: </span>
                      <span
                        class="trad-simple"
                      >
                        {{ activeCharData.traditional }}
                      </span>
                  </div>

                  <div v-if="activeChar !== activeCharData.simplified" class="detail-group">
                    <span class="basic-label">Simplified: </span>
                    <span
                      class="trad-simple"
                    >{{ activeCharData.simplified }}</span>
                  </div>

                  <div class="detail-group radicals-group">
                    <span class="basic-label">Radicals: </span>
                    <div class="radicals">
                      <span
                        v-for="(meaning, char) in activeCharData.radicals"
                        :key="char"
                        class="radical"
                      >
                        <span class="radical-char">{{ char }}</span>
                        <span class="radical-meaning">{{ meaning }}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div class="hanzi-anim">
                  <AnimatedHanzi 
                    :character="activeCharData.character"
                    :strokes="activeCharData.strokes"
                    :animatable="true" 
                    :drawThin="false" 
                    :animSpeed="0.1"
                  />
                </div>
              </div>

              <ExpandableExamples title="Related words">
                <template v-slot:afew="slotProps">
                  <div class="example-words">
                    <ClickableRow
                      v-for="(word, index) in activeCharData.example_words.slice(0, 5)"
                      :key="index"
                      :word="word"
                      :class="{ therest: !slotProps.isExpanded }"
                    >
                      <template #default>
                        <div class="example-chinese-pinyin">
                          <span class="example-chinese">{{ word }}</span>
                          <span class="example-pinyin">
                            {{ $toAccentedPinyin(activeCharData.pinyin[index]) }}
                          </span>
                        </div>
                        <span class="example-meaning">{{ activeCharData.english[index] }}</span>
                      </template>
                    </ClickableRow>
                  </div>
                </template>

                <template v-slot:therest="slotProps">
                  <div class="example-words">
                    <ClickableRow
                      v-for="(word, index) in activeCharData.example_words.slice(5)"
                      :key="index + 5"
                      :word="word"
                      class="therest"
                    >
                      <template #default>
                        <div class="example-chinese-pinyin">
                          <span class="example-chinese">{{ word }}</span>
                          <span class="example-pinyin">
                            {{ $toAccentedPinyin(activeCharData.pinyin[index + 5]) }}
                          </span>
                        </div>
                        <span class="example-meaning">{{ activeCharData.english[index + 5] }}</span>
                      </template>
                    </ClickableRow>
                  </div>
                </template>
              </ExpandableExamples>

              <div v-if="activeCharData.main_components">
                <div class="medium-label">Components</div class="medium-label">
              
              <!-- Character Decomposition Section -->
              <div class="decomp-section" v-if="currentDecompositionData && currentDecompositionData[activeChar]">
                <div class="decomposition-items">
                  <div v-for="(componentArray, componentName) in currentDecompositionData[activeChar]" :key="componentName" class="decomp-group">
                    <div class="decomp-component">{{ componentName }}:</div>
                    <div class="decomp-chars">
                      <span 
                        v-for="char in componentArray" 
                        :key="char"
                        :character="char"
                        :strokes="getCharStrokes(char)"
                        @mouseenter="startHoverTimer(char)"
                        @mouseleave="clearHoverTimer"
                        @click="updateModalContent(char)"
                        class="decomp-char"
                      >
                        {{ char }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              
            </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script>
import ExpandableExamples from './ExpandableExamples.vue'
import ClickableRow from './ClickableRow.vue'
import AnimatedHanzi from './AnimatedHanzi.vue'
import { mapGetters } from 'vuex'

export default {
  props: {
    data: {
      type: Object,
      default: null // allow null while loading
    },
    visible: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    decompositionData: {
      type: Object,
      default: null
    }
  },
  inject: ['updatePopupData', 'preloadCardDataForWord'],
  components: {
    ExpandableExamples,
    ClickableRow,
    AnimatedHanzi
  },
  name: 'CardModal',
  emits: ['close', 'fetch-decomp-for-char'],
  data() {
    return {
      activeChar: null,
      hoverTimer: null,
      hoverWord: null,
      currentDecompositionData: null,
      strokesPerChar: null,
      showWordlistDropdown: false,
      addingToList: false, // Flag to track when we're adding a word to a list
      notificationMessage: '', // For showing success/error messages
      notificationVisible: false, // Control notification visibility
    }
  },
  computed: {
    ...mapGetters({
      isLoggedIn: 'isLoggedIn',
      customWordlists: 'getCustomDecks'
    }),
    validChars() {
      if (!this.data || !this.data.character) return []
      return this.data.character.split('').filter(char => /\p{Script=Han}/u.test(char))
    },
    activeCharData() {
      if (!this.data || !this.data.chars_breakdown) return null;
      const charToShow = this.activeChar || this.validChars[0];
      const breakdown = this.data.chars_breakdown[charToShow];
      const goodindices = [];
      const shortindices = [];
      if(breakdown.example_words){
        breakdown.example_words.forEach((word, index) => {
        if (word.length > 1) {
          goodindices.push(index);
        }
        if (word.length === 1) {
          shortindices.push(index);
        }
      });
      }

      return {
        ...breakdown,
        example_words: breakdown.example_words.filter((_, index) => goodindices.includes(index)),
        pinyin: breakdown.pinyin.filter((_, index) => goodindices.includes(index)),
        english: breakdown.english.filter((_, index) => goodindices.includes(index)),
        main_word_pinyin: breakdown.pinyin.filter((_, index) => shortindices.includes(index)),
        main_word_english: breakdown.english.filter((_, index) => shortindices.includes(index)),
      };
    },
    isVisible() {
      return this.visible
    }
  },
  watch: {
    visible: {
      handler(newVisible) {
        if (newVisible) {
          document.body.classList.add('modal-open')
        } else {
          document.body.classList.remove('modal-open')
        }
      },
      immediate: true
    },
    data: {
      handler(newData) {
        if (newData && newData.chars_breakdown) {
          this.activeChar = this.validChars[0]
        }
      },
      immediate: true
    },
    activeChar: {
      handler(newChar) {
        if (newChar && this.decompositionData) {
          // Update currentDecompositionData to show decomposition for the current character
          if (typeof this.decompositionData === 'object') {
            if (this.decompositionData[newChar]) {
              // Only show decomposition for the active character
              this.currentDecompositionData = this.decompositionData;
            } else {
              // If we don't have data for this specific character, fetch it
              this.$emit('fetch-decomp-for-char', newChar);
            }
          }
        }
      },
      immediate: true
    },
    decompositionData: {
      handler(newData) {
        if (newData && this.activeChar) {
          // Update currentDecompositionData when decompositionData changes
          if (typeof newData === 'object') {
            this.currentDecompositionData = newData;
          }
        }
      },
      immediate: true
    }
  },
  mounted() {
    window.addEventListener('keydown', this.handleEscKey)
    if (this.visible) {
      document.body.classList.add('modal-open')
    }
    // Add event listener to close dropdown when clicking outside
    document.addEventListener('click', this.handleOutsideClick)
    // this.loadStrokesData(this.data.character, () => {
      // this.$emit('fetch-decomp-for-char', this.data.character);
    // });
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleEscKey)
    // Remove the document click event listener
    document.removeEventListener('click', this.handleOutsideClick)
    document.body.classList.remove('modal-open')
  },
  methods: {
    async loadStrokesData(characters, onReady=null) {
        try {
            const response = await fetch(`/api/getStrokes/${characters}`);
            if (!response.ok) {
                console.log('Strokes doesn\'t exist, will be rendered using text.', this.character);  
                return;
            }
            const data = await response.json();
            this.strokesPerChar = data.strokes;

            if(onReady){
                onReady();
            }
        } catch (error) {
            console.error('Error loading character data:', error);
            throw error;
        }
    },
    getCharStrokes(char) {
      if (this.strokesPerChar && this.strokesPerChar[char]) {
        return this.strokesPerChar[char];
      }
      return null;
    },
    closeModal() {
      // Remove the word parameter from the URL when closing the modal
      this.updateUrlWithoutWord();
      this.$emit('close');
    },
    // Helper method to remove the word parameter from the URL
    updateUrlWithoutWord() {
      const query = { ...this.$route.query };
      delete query.word;
      
      this.$router.replace({ query }).catch(err => {
        // Ignore navigation duplicate errors
        if (err.name !== 'NavigationDuplicated') {
          throw err;
        }
      });
    },
    handleEscKey(event) {
      if (event.key === 'Escape') {
        this.closeModal();
      }
    },
    startHoverTimer(word) {
      this.clearHoverTimer();
      this.hoverWord = word;
      this.hoverTimer = setTimeout(() => {
        this.preloadData();
      }, 300);
    },
    clearHoverTimer() {
      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer);
        this.hoverTimer = null;
      }
      this.hoverWord = null;
    },
    async preloadData() {
      if (this.hoverWord) {
        await this.preloadCardDataForWord(this.hoverWord);
      }
    },
    updateModalContent(word) {
      this.clearHoverTimer();
      this.updatePopupData(word);
    },
    setActiveChar(char) {
      if (this.validChars.includes(char)) {
        this.activeChar = char; // Set the active character
      }
    },
    toggleWordlistDropdown() {
      this.showWordlistDropdown = !this.showWordlistDropdown;
    },
    addWordToList(setName) {
      this.addingToList = true;
      this.showWordlistDropdown = false;
      
      // Get the character/word to add
      const word = this.data.character;
      
      // Send request to the backend API
      fetch("/api/add_word_to_learning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ word: word, set_name: setName})
      })
      .then(response => response.json())
      .then(data => {
        this.addingToList = false;
        
        // Update the Vuex store to show the word immediately in wordlists
        this.$store.dispatch('addWordToCustomDeck', {
          word: word,
          setName: setName,
          wordData: {
            pinyin: this.data.pinyin,
            english: this.data.english,
            character: this.data.character
          }
        });
        
        this.showNotification(`Added "${word}" to "${setName}" list`, 'success');
      })
      .catch(error => {
        console.error("Error:", error);
        this.addingToList = false;
        this.showNotification(`Error adding word: ${error.message}`, 'error');
      });
    },
    showNotification(message, type = 'success') {
      // Create a notification element
      const notification = document.createElement('div');
      notification.className = `card-modal-notification ${type}`;
      notification.textContent = message;
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.left = '20px';
      notification.style.backgroundColor = type === 'success' ? 'var(--green-notif, #4caf50)' : '#f44336';
      notification.style.color = 'white';
      notification.style.padding = '10px 15px';
      notification.style.borderRadius = '4px';
      notification.style.zIndex = '10000';  // Ensure it's on top of everything
      notification.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.2)';
      
      // Add animation manually
      notification.style.animation = 'fadeInOut 3s ease forwards';
      
      // Add to document body instead of modal
      document.body.appendChild(notification);
      
      // Remove after a few seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    },
    highlightItem(itemId) {
      const item = this.$el.querySelector(`[data-id="${itemId}"]`);
      if (item) {
        item.style.backgroundColor = 'var(--primary-color-hover)';
      }
    },
    unhighlightItem(itemId) {
      const item = this.$el.querySelector(`[data-id="${itemId}"]`);
      if (item) {
        item.style.backgroundColor = '';
      }
    },
    handleOutsideClick(event) {
      // Check if the dropdown is open and if the click is outside the dropdown element itself
      if (this.showWordlistDropdown) {
        const dropdownButton = this.$el.querySelector('.wordlist-btn');
        const dropdownContent = this.$el.querySelector('.dropdown-content');
        
        // Close dropdown if click is outside both the dropdown button and its content
        if (
          (!dropdownButton || !dropdownButton.contains(event.target)) && 
          (!dropdownContent || !dropdownContent.contains(event.target))
        ) {
          this.showWordlistDropdown = false;
        }
      }
    },
    handleModalClick(event) {
      // Only close the dropdown if we're clicking on the modal itself
      // and not on the dropdown button or dropdown content
      const dropdownButton = this.$el.querySelector('.wordlist-btn');
      const dropdownContent = this.$el.querySelector('.dropdown-content');
      
      if (this.showWordlistDropdown &&
          dropdownButton && !dropdownButton.contains(event.target) &&
          dropdownContent && !dropdownContent.contains(event.target)) {
        this.showWordlistDropdown = false;
      }
    },
  }
}
</script>

<style scoped>

.medium-label {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  font-size: 1.2em;
  color: #666;
}
.spinner {
  width: 40px;
  height: 40px;
  margin-bottom: 12px;
  border: 4px solid #ccc;
  border-top-color: #333;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
/* Copy all the styles from PopupModal.vue */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-background);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  cursor: default;
}

.modal {
  position: fixed;
  width: 34vw;
  max-width: 34vw;
  height: 90vh;
  max-height: 90vh;
  border: 2px dashed var(--fg);
  border: 4px solid var(--fg-dim);
  box-shadow: 5px 5px 26px 12px color-mix(in oklab, var(--primary-color) 26%, var(--bg) 35%);
  box-shadow: 5px 5px 2px 2px color-mix(in oklab, var(--primary-color) 26%, var(--bg) 35%);
  box-shadow: 14px 10px 0px 0px var(--fg);
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  box-sizing: border-box;
  z-index: 20;
  font-weight: 400;
  overflow-y: auto;
  overflow-x: hidden;
  -ms-overflow-style: none;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: default;
}

.modal {
  box-shadow: 5px 5px 26px 12px color-mix(in oklab, var(--primary-color) 26%, var(--bg) 35%);
}


.modal::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.main-word-section {
  text-align: center;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.main-word {
  font-size: 11rem;
  margin: 0.1em 0 0.2em 0;
  line-height: 1;
  width: 100%;
  text-align: center;
}

.main-word-char {
  font-family: 'Noto Serif SC';
}

.minor-character {
  font-size: 2.5rem;
  font-family: 'Noto Sans SC';
}

.minor-character {
  font-size: 2.5rem;
  font-family: 'Noto Sans SC';
}

.main-pinyin {
  font-size: 1.2rem;
  margin-top: 1em;
}

.main-english {
  font-size: 1rem;
  box-sizing: border-box;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  width: 100%;
  margin-top: 1em;
  opacity: 0.6;
}

.multi-pronunciation {
  display: flex;
  flex-direction: column;
  gap: .25rem;
  margin-top: 1em;
  width: 100%;
  text-align: left;
  border-bottom: 1px solid color-mix(in oklab, var(--fg) 35%, var(--bg) 85%);
  border-radius: var(--border-radius);
}
.multi-pronunciation:last-child {
  border-bottom: none;
}

.pronunciation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 2em;
  border-bottom: 1px solid color-mix(in oklab, var(--fg) 10%, var(--bg) 90%);
}

.pronunciation-item:last-child {
  border-bottom: none;
}


.p-pinyin {
  font-size: 1.2rem;
}

.p-english {
  font-size: .8rem;
  padding: 0em 2em;
  opacity: 0.6;
  font-style: italic;
  color: var(--text-secondary);
}

.example-words {
  display: grid;
  gap: 0rem;
  width: 100%;
  min-width: 0;
  background-color: color-mix(in oklab, var(--fg) 2%, var(--bg) 90%);
}

.example-word-content {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-direction: row;
  padding: 0.5rem 0.5rem;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  border-bottom: 2px dashed color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
}

.example-word-content.therest:last-child {
  border-bottom: none;
}

.example-word-content:hover {
  background-color: color-mix(in oklab, var(--fg) 3%, var(--bg) 90%);
}

.example-chinese-pinyin {
  min-width: 20%;
  width: 20%;
  overflow: hidden;
  white-space: nowrap;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  /* border-right: 2px dashed color-mix(in oklab, var(--fg) 15%, var(--bg) 50%); */
  height: 100%;
  box-sizing: border-box;
}


.example-chinese {
  font-size: 1.45rem;
  font-family: 'Kaiti', 'STKaiti', 'Kai', '楷体';
}

.example-pinyin {
  font-size: .85rem;
  opacity: 0.6;
}

.example-meaning {
  font-size: .85rem;
  width: 100%;
  opacity: .6;
  max-width: 100%;
  transition: color 0.2s ease;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  align-self: flex-start;
  overflow: hidden;
  box-sizing: border-box;
}


.example-word-content:hover > .example-chinese {
}

.example-word-content:hover > .example-pinyin {
}

.example-word-content:hover > .example-meaning {
}

.trad-simple {
  font-size: 2rem;
  font-family: 'Kaiti', 'STKaiti', 'Kai', '楷体';
}

.trad-simple:hover {
  /* text-decoration: underline; */
}

.breakdown-section {
  border-top: 2px dashed color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  padding-top: 1.5rem;
  width: 100%;
  min-width: 0; /* Prevent flex item from overflowing */
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-top: 0;
  margin-bottom: 1rem;
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-bottom: 2px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  position: relative;
  overflow: visible;
}

.tab-btn {
  position: relative;
  font-size: 1.2rem;
  padding: 0.5rem 1rem;
  border: 2px solid color-mix(in oklab, var(--fg) 25%, var(--bg) 50%);
  cursor: pointer;
  font-family: "Noto Serif SC";
  font-weight: 400;
  color: var(--primary-primary);
  white-space: nowrap;
  opacity: 0.35;
  background: var(--bg);
  transform: translate(0, 2px);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.tab-btn.active {
  border: 2px solid color-mix(in oklab, var(--fg) 25%, var(--bg) 50%);
  opacity: 1;
  z-index: 2;
  border-bottom: none;
}

.char-details {
  display: grid;
  gap: 0.6rem;
  width: 100%;
  min-width: 0; 
}

.detail-group {
  padding: 0rem 1rem;
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 3em;
  box-sizing: border-box;
  font-size: 1rem;
  min-width: 0;
  border-bottom: 1px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 15%);
}

.radicals-group {
  height: auto;
}

.detail-group:last-child {
  border-bottom: none;
}

.freq-trad-anim {
  display: flex;
  gap: 0.5rem;
  flex-direction: row;
}

.freq-trad {
  display: flex;
  flex-direction: column;
  flex: 2;
  justify-self: flex-start;
  background-color: color-mix(in oklab, var(--fg) 3%, var(--bg) 100%);
  height: 100%;
  justify-content: space-around;
  align-items: center;
  justify-content: space-around;
}

.hanzi-anim {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 1;
}

.anim-character {
  font-size: 12rem;
  font-family: 'Kaiti', 'STKaiti', 'Kai', '楷体';
}

.components,
.radicals {
  display: inline-flex;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  gap: .5rem;
}

.radicals {
  justify-content: flex-end;
}

.radical {
  align-items: center;
  font-size: 1em;
  padding: 0.2rem 0.75rem;
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  flex-shrink: 0; 
}

.radical:hover {
  /* border-color: var(--fg);
  background: color-mix(in oklab, var(--fg) 15%, var(--bg) 50%); */
}

.radical-char {
  padding-right: .5em;
}

.basic-label {
  font-size: 1em;
  opacity: 0.5;
}


.char-breakdown {
  font-size: 1.25rem;
  font-weight: normal;
  margin: 0;
  opacity: .75;
  margin-bottom: .5em;
  text-decoration: dotted;
}


.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--text-primary);
  opacity: 0.5;
  transition: opacity 0.2s;
  padding: 0.5rem;
  line-height: 1;
}

.close-btn:hover {
  opacity: 1;
}

.decomp-section {
  height: auto !important;
  margin-top: 1rem !important;
  padding: 1rem !important;
  border: 2px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 50%) !important;
}

.decomposition-items {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.decomp-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.decomp-component {
  font-size: 1.2rem;
  font-weight: normal;
  color: var(--fg);
  margin-bottom: 0.5rem;
}

.decomp-chars {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.5rem;
}

.decomp-char {
  font-size: 1.5rem;
  padding: 0.3rem 0.7rem;
  background-color: color-mix(in oklab, var(--fg) 8%, var(--bg) 92%);
  /* border: 1px solid color-mix(in oklab, var(--fg) 20%, var(--bg) 80%); */
  /* border-radius: 4px; */
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Kaiti', 'STKaiti', 'Kai', '楷体';
}

.decomp-char:hover {
  /* background-color: color-mix(in oklab, var(--fg) 15%, var(--bg) 85%);
  transform: scale(1.1); */
}

.wordlist-dropdown {
  position: absolute;
  top: 1rem;
  left: 1rem;
}

.wordlist-btn {
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  color: var(--fg);
  border: none;
  padding: 0.5rem 1rem;
  font-size: .9rem;
  cursor: pointer;
}

.wordlist-btn:hover {
  background-color: color-mix(in oklab, var(--fg) 8%, var(--bg) 50%);
}

.plus-icon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
}

.dropdown-content {
  position: absolute;
  top: 2.5rem;
  left: 0;
  background-color: var(--bg);
  border: 1px solid var(--fg);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.wordlist-item {
  font-size: .9rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: color-mix(in oklab, var(--fg) 8%, var(--bg) 50%);
}

.wordlist-item:hover {
  background-color: var(--primary-color);
  color: var(--fg);
  font-weight: 500;
}

.no-lists {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Add notification styles */
.card-modal-notification {
  position: fixed;
  top: 20px;
  left: 20px;
  padding: 10px 15px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  opacity: 0;
  animation: fadeInOut 3s ease forwards;
}

.card-modal-notification.success {
  background-color: var(--green-notif, #4caf50);
  color: white;
}

.card-modal-notification.error {
  background-color: #f44336;
  color: white;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(20px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}

@media screen and (max-width: 768px) {
  .modal {
    width: 90vw;
    padding: 1rem;
  }

  .character {
    font-size: 4rem;
  }

  .main-pinyin,
  .english {
    font-size: 1rem;
  }
}

@media screen and (min-width: 1200px) {
  .character {
    font-size: 8rem;
  }
}

h2,
h3,
h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.5rem;
}


@media (max-width: 1024px) {
  .modal {
    width: 90vw;
    max-width: 90vw;
    height: 80vh;
    max-height: 80vh;
    padding: 1rem;
  }
}


</style>

<!-- Add this unscoped style block -->
<style>
body.modal-open {
  /* overflow: hidden !important;
  position: fixed !important;
  width: 100% !important;
  height: 100% !important;
  top: 0 !important;
  left: 0 !important; */
}
</style>
