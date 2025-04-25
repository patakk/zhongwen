<template>
  <div v-if="isVisible" class="global-modal-container">
    <div class="card-modal-overlay" @click="closeModal">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <div>Loading...</div>
      </div>
      
      <div v-else class="modal card-modal" @click.stop="handleModalClick">
        
        <!-- Add to wordlist dropdown button -->
        <div v-if="isLoggedIn" class="wordlist-dropdown">
          <button @click.stop="toggleWordlistDropdown" class="wordlist-btn">
            <span class="plus-icon">+</span> Add to list
          </button>
          <div v-if="showWordlistDropdown" class="dropdown-content" @click.stop>
            <div v-if="!isLoggedIn" class="no-lists">Please log in to add words to lists</div>
            <div v-else-if="customWordlists && customWordlists.length === 0" class="no-lists">No custom wordlists available</div>
            <div v-else>
              <div v-for="wordlist in customWordlists" :key="wordlist.name" 
                  class="wordlist-item"
                  @click.stop="addWordToList(wordlist.name)">
                {{ wordlist.name }}
              </div>
            </div>
          </div>
        </div>

        <!-- Main word section -->
        <div class="main-word-section">
          <div class="main-word">
            <span
              v-for="(char, index) in cardData.character.split('')"
              :key="index"
              class="main-word-char"
              @click="setActiveChar(char)"
            >
              {{ char }}
            </span>
          </div>
          <div class="minor-character">{{ cardData.character }}</div>
          
          <div class="main-pinyin">{{ $toAccentedPinyin(cardData.pinyin[0]) }}</div>
          <div class="main-english">{{ cardData.english[0] }}</div>

          <!-- Concept toggle buttons with dropdown functionality -->
          <div class="concepts-container">
            <div class="concept-toggle" @click="toggleConcepts('related')" :class="{ 'active': showRelatedConcepts }">
              <span class="concept-label">related concepts</span>
            </div>
            
            <div class="concept-toggle" @click="toggleConcepts('opposite')" :class="{ 'active': showOppositeConcepts }">
              <span class="concept-label">opposite concepts</span>
            </div>
          </div>

          <!-- Concept content containers -->
          <div v-if="showRelatedConcepts" class="concept-content related-content">
            <div v-if="formattedSimilars.length === 0" class="no-concepts">
              No related concepts available
            </div>
            <div v-else class="concept-items">
              <div 
                v-for="(item, index) in formattedSimilars" 
                :key="index" 
                class="concept-item"
                @click="updateModalContent(item.character)"
              >
                <div class="concept-character">{{ item.character }}</div>
                <div class="concept-pinyin">{{ item.pinyin && item.pinyin.length > 0 ? $toAccentedPinyin(item.pinyin[0]) : '' }}</div>
                <div class="concept-english">{{ item.english && item.english.length > 0 ? item.english[0].split('/')[0] : '' }}</div>
              </div>
            </div>
          </div>
          
          <div v-if="showOppositeConcepts" class="concept-content opposite-content">
            <div v-if="formattedOpposites.length === 0" class="no-concepts">
              No opposite concepts available
            </div>
            <div v-else class="concept-items">
              <div 
                v-for="(item, index) in formattedOpposites" 
                :key="index" 
                class="concept-item"
                @click="updateModalContent(item.character)"
              >
                <div class="concept-character">{{ item.character }}</div>
                <div class="concept-pinyin">{{ item.pinyin && item.pinyin.length > 0 ? $toAccentedPinyin(item.pinyin[0]) : '' }}</div>
                <div class="concept-english">{{ item.english && item.english.length > 0 ? item.english[0].split('/')[0] : '' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Character breakdown section -->
        <div class="breakdown-section" v-if="cardData.chars_breakdown">
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
                  <!-- Replace the separate pinyin and meaning sections with a combined section -->
                  <div class="detail-group pinyin-meaning-group">
                    <span class="basic-label">Pronunciation & Meaning:</span>
                    <div class="pinyin-meaning-pairs">
                      <div v-for="(pinyin, index) in activeCharData.main_word_pinyin" :key="index" class="pinyin-meaning-pair">
                        <div class="pm-pinyin" :class="getToneClass(pinyin)"><span class="pinyinshadow">{{ $toAccentedPinyin(pinyin) }}</span></div>
                        <div class="pm-meaning">{{ activeCharData.main_word_english[index] || '' }}</div>
                      </div>
                      <div v-if="activeCharData.main_word_pinyin.length === 0" class="no-pinyin-meaning">
                        No pronunciation data available
                      </div>
                    </div>
                  </div>

                  <div v-if="activeChar !== activeCharData.traditional" class="detail-group">
                      <span class="basic-label">Traditional: </span>
                      <span class="trad-simple">{{ activeCharData.traditional }}</span>
                  </div>

                  <div v-if="activeChar !== activeCharData.simplified" class="detail-group">
                    <span class="basic-label">Simplified: </span>
                    <span class="trad-simple">{{ activeCharData.simplified }}</span>
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

              <ExpandableExamples title="Words containing this character">
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

              <!-- Components section - Formatted decomposition data -->
              <div>
                <div class="medium-label">Components</div>
              
                <!-- Show formatted decomposition data if available -->
                <div class="decomp-section">
                  <div class="decomposition-items">
                    <!-- For Han characters, check if their components exist in decompositionData -->
                    <div v-if="activeChar && decompositionData && decompositionData[activeChar]" 
                         v-for="(charArray, component) in decompositionData[activeChar]" 
                         :key="component" 
                         class="decomp-group">
                      <div class="decomp-component">
                        <span class="component-char">{{ component }}</span>
                        <span class="component-label">component in {{ activeChar }}</span>
                      </div>
                      <div class="decomp-chars">
                        <span 
                          v-for="char in charArray" 
                          :key="char"
                          @click="updateModalContent(char)"
                          @mouseenter="startHoverTimer(char)"
                          @mouseleave="clearHoverTimer"
                          class="decomp-char"
                          :class="{ 'current-char': char === activeChar }"
                        >
                          {{ char }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- If no components found -->
                    <div v-if="activeChar && (!decompositionData || !decompositionData[activeChar] || Object.keys(decompositionData[activeChar]).length === 0)" class="decomp-message">
                      <p>No component data available for this character</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Fixed position close button at bottom right -->
    <button @click="closeModal" class="close-btn fixed-close"><span class="x-centered">×</span></button>
    
    <ToastNotification
      v-model:visible="notificationVisible"
      :message="notificationMessage"
      :type="notificationType"
      position="bottom-right"
    />
  </div>
</template>

<script>
import ExpandableExamples from './ExpandableExamples.vue'
import ClickableRow from './ClickableRow.vue'
import AnimatedHanzi from './AnimatedHanzi.vue'
import ToastNotification from './ToastNotification.vue'
import { mapGetters, mapActions } from 'vuex'

export default {
  components: {
    ExpandableExamples,
    ClickableRow,
    AnimatedHanzi,
    ToastNotification
  },
  name: 'GlobalCardModal',
  data() {
    return {
      activeChar: null,
      hoverTimer: null,
      hoverWord: null,
      showWordlistDropdown: false,
      addingToList: false,
      notificationMessage: '',
      notificationVisible: false,
      notificationType: 'success',
      showRelatedConcepts: false,
      showOppositeConcepts: false,
    }
  },
  provide() {
    return {
      updatePopupData: this.updateModalContent,
      preloadCardDataForWord: this.preloadCardData
    }
  },
  computed: {
    ...mapGetters({
      isLoggedIn: 'isLoggedIn',
      customWordlists: 'getCustomDecks', // Use the original getter
      isVisible: 'cardModal/isCardModalVisible',
      isLoading: 'cardModal/isCardModalLoading',
      cardData: 'cardModal/getCardData',
      decompositionData: 'cardModal/getDecompositionData',
      currentCharacter: 'cardModal/getCurrentCharacter'
    }),
    validChars() {
      if (!this.cardData || !this.cardData.character) return []
      return this.cardData.character.split('').filter(char => /\p{Script=Han}/u.test(char))
    },
    // Format similar concepts for display
    formattedSimilars() {
      if (!this.cardData || !this.cardData.similars) return [];
      
      const result = [];
      const similars = this.cardData.similars;
      
      // Process the entire array of similar items
      if (Array.isArray(similars)) {
        for (let item of similars) {
          if (typeof item === 'string') {
            // Handle string items
            result.push({
              character: item,
              pinyin: [],
              english: []
            });
          } else if (typeof item === 'object') {
            // For objects, process ALL character keys
            const charKeys = Object.keys(item);
            for (let charKey of charKeys) {
              if (item[charKey]) {
                result.push({
                  character: charKey,
                  pinyin: item[charKey].pinyin || [],
                  english: item[charKey].english || []
                });
              }
            }
          }
        }
      }
      
      return result;
    },
    // Format opposite concepts for display
    formattedOpposites() {
      if (!this.cardData || !this.cardData.opposites) return [];
      
      const result = [];
      const opposites = this.cardData.opposites;
      
      // Process the entire array of opposite items
      if (Array.isArray(opposites)) {
        for (let item of opposites) {
          if (typeof item === 'string') {
            // Handle string items
            result.push({
              character: item,
              pinyin: [],
              english: []
            });
          } else if (typeof item === 'object') {
            // For objects, process ALL character keys
            const charKeys = Object.keys(item);
            for (let charKey of charKeys) {
              if (item[charKey]) {
                result.push({
                  character: charKey,
                  pinyin: item[charKey].pinyin || [],
                  english: item[charKey].english || []
                });
              }
            }
          }
        }
      }
      
      return result;
    },
    activeCharData() {
      if (!this.cardData || !this.cardData.chars_breakdown) return null;
      const charToShow = this.activeChar || this.validChars[0];
      const breakdown = this.cardData.chars_breakdown[charToShow];
      const goodindices = [];
      const shortindices = [];
      
      if (breakdown?.example_words) {
        breakdown.example_words.forEach((word, index) => {
          if (word.length > 1) {
            goodindices.push(index);
          }
          if (word.length === 1) {
            shortindices.push(index);
          }
        });
      }

      return breakdown ? {
        ...breakdown,
        example_words: breakdown.example_words?.filter((_, index) => goodindices.includes(index)) || [],
        pinyin: breakdown.pinyin?.filter((_, index) => goodindices.includes(index)) || [],
        english: breakdown.english?.filter((_, index) => goodindices.includes(index)) || [],
        main_word_pinyin: breakdown.pinyin?.filter((_, index) => shortindices.includes(index)) || [],
        main_word_english: breakdown.english?.filter((_, index) => shortindices.includes(index)) || [],
      } : null;
    }
  },
  watch: {
    isVisible: {
      handler(visible) {
        if (visible) {
          document.body.classList.add('modal-open');
          
          // Set the initial active char when modal becomes visible
          if (this.cardData && this.validChars.length > 0) {
            this.activeChar = this.validChars[0];
          }
        } else {
          document.body.classList.remove('modal-open');
          
          // Reset toast notification state when modal closes
          this.notificationVisible = false;
          this.notificationMessage = '';
        }
      },
      immediate: true
    },
    cardData: {
      handler(newData) {
        if (newData && this.validChars.length > 0) {
          this.activeChar = this.validChars[0];
          
          // Reset concept sections when new card data is loaded
          this.showRelatedConcepts = false;
          this.showOppositeConcepts = false;
        }
      }
    },
    currentCharacter: {
      handler(newChar) {
        if (newChar && this.validChars.includes(newChar)) {
          this.activeChar = newChar;
        }
      }
    },
    decompositionData: {
      handler(newData) {
        if (newData && this.activeChar) {
          console.log('Decomposition data changed in watcher:', newData);
          console.log('Current active char in watcher:', this.activeChar);
          // Force component update
          this.$forceUpdate();
        }
      },
      deep: true
    }
  },
  mounted() {
    // Debug logging of wordlists
    console.log("GlobalCardModal - Available wordlists:", this.customWordlists);
    console.log("GlobalCardModal - Is user logged in?", this.isLoggedIn);
    
    window.addEventListener('keydown', this.handleEscKey);
    window.addEventListener('keydown', this.handleDebugKey); // Add the debug key handler
    document.addEventListener('click', this.handleOutsideClick);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleEscKey);
    window.removeEventListener('keydown', this.handleDebugKey); // Remove the debug key handler
    document.removeEventListener('click', this.handleOutsideClick);
    
    if (this.isVisible) {
      document.body.classList.remove('modal-open');
    }
  },
  methods: {
    ...mapActions({
      hideCardModal: 'cardModal/hideCardModal',
      showCardModal: 'cardModal/showCardModal',
      fetchCardData: 'cardModal/fetchCardData'
      // Removed fetchDecompositionData to prevent direct calls
    }),
    // Add a new method to determine tone class
    getToneClass(pinyin) {
      if (!pinyin) return 'pinyin-neutral';
      
      // Check for tone numbers in the original pinyin
      if (pinyin.includes('1')) return 'pinyin-first';
      if (pinyin.includes('2')) return 'pinyin-second';
      if (pinyin.includes('3')) return 'pinyin-third';
      if (pinyin.includes('4')) return 'pinyin-fourth';
      
      // If no tone number is found, it's a neutral tone
      return 'pinyin-neutral';
    },
    closeModal() {
      this.hideCardModal();
      this.showWordlistDropdown = false;
    },
    handleEscKey(event) {
      if (event.key === 'Escape' && this.isVisible) {
        this.closeModal();
      }
    },
    handleDebugKey(event) {
      if (event.key === 'd') {
        this.debugCardData();
      }
    },
    // Debug function to log card data to console
    debugCardData() {
      console.log('===== CARD DATA DEBUG =====');
      console.log('Card Data:', JSON.stringify(this.cardData, null, 2));
      console.log('Active Char Data:', JSON.stringify(this.activeCharData, null, 2));
      console.log('Decomposition Data:', JSON.stringify(this.decompositionData, null, 2));
      console.log('Current Character:', this.currentCharacter);
      console.log('Valid Chars:', this.validChars);
      console.log('Active Char:', this.activeChar);
      this.showNotification('Card data logged to console. Press F12 to view.', 'info');
    },
    startHoverTimer(word) {
      this.clearHoverTimer();
      this.hoverWord = word;
      this.hoverTimer = setTimeout(() => {
        // Only preload if we still have the same hover word
        if (this.hoverWord === word) {
          this.$store.dispatch('cardModal/preloadCardData', word);
        }
      }, 300);
    },
    clearHoverTimer() {
      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer);
        this.hoverTimer = null;
      }
      this.hoverWord = null;
    },
    async preloadCardData(word) {
      try {
        await this.$store.dispatch('cardModal/preloadCardData', word);
      } catch (error) {
        console.error('Error preloading card data:', error);
      }
    },
    updateModalContent(word) {
      this.clearHoverTimer();
      
      // Don't call showCardModal if we're already showing this word
      if (this.isVisible && this.cardData && this.cardData.character === word) {
        console.log('Already showing this word, skipping updateModalContent call:', word);
        
        // Just update the active character if needed
        if (this.validChars.includes(word) && this.activeChar !== word) {
          this.activeChar = word;
        }
        return;
      }
      
      // This will trigger fetchCardData, which will then fetch decomp data ONCE
      this.showCardModal(word);
    },
    setActiveChar(char) {
      if (this.validChars.includes(char)) {
        this.activeChar = char;
        // Don't fetch decomposition data here - rely on what's already loaded
      }
    },
    toggleWordlistDropdown() {
      console.log("Toggling dropdown, current wordlists:", this.customWordlists);
      console.log("Is user logged in?", this.isLoggedIn);
      if (this.isLoggedIn && (!this.customWordlists || this.customWordlists.length === 0)) {
        // If we're logged in but have no wordlists, try to fetch them
        console.log("Attempting to fetch user data due to missing wordlists");
        this.$store.dispatch('fetchUserData')
          .then(() => this.$store.dispatch('fetchCustomDictionaryData'));
      }
      this.showWordlistDropdown = !this.showWordlistDropdown;
    },
    addWordToList(setName) {
      this.addingToList = true;
      this.showWordlistDropdown = false;
      
      // Get the character/word to add
      const word = this.cardData.character;
      
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
            pinyin: this.cardData.pinyin,
            english: this.cardData.english,
            character: this.cardData.character
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
      this.notificationMessage = message;
      this.notificationType = type;
      this.notificationVisible = true;
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
    getCharacterComponents(character) {
      // Extract the actual components from decompositionData
      if (!this.decompositionData) return [];
      
      console.log('FULL DECOMPOSITION DATA:', JSON.stringify(this.decompositionData));
      console.log('Looking for components for character:', character);
      
      // With the restructured data, we need to look for the character as a key first level
      // Then return all component keys under that character
      const components = [];
      
      // In our data structure, the components are the direct keys inside each character's object
      // For example: decompositionData = { '不': { '丆': [...], '卜': [...] } }
      // So we need to return ['丆', '卜'] for character '不'
      if (this.decompositionData[character]) {
        // This character has decomposition info - return its component keys
        return Object.keys(this.decompositionData[character]);
      }
      
      console.log(`No decomposition data found directly for ${character}`);
      return components;
    },
    toggleConcepts(type) {
      if (type === 'related') {
        this.showRelatedConcepts = !this.showRelatedConcepts;
        this.showOppositeConcepts = false;
      } else if (type === 'opposite') {
        this.showOppositeConcepts = !this.showOppositeConcepts;
        this.showRelatedConcepts = false;
      }
    }
  }
}
</script>

<style>

[data-theme='light'] {
  --card-shadow: 14px 10px 0px 0px var(--fg);
}

[data-theme='dark'] {
  --card-shadow: 5px 5px 26px 12px color-mix(in oklab, var(--primary-color) 26%, var(--bg) 35%);
}



@media (max-width: 1024px) {

  [data-theme='light'] {
    --card-shadow: 14px 10px 0px 0px var(--fg);
  }

  [data-theme='dark'] {
    --card-shadow: 5px 5px 13px 7px color-mix(in oklab, var(--primary-color) 26%, var(--bg) 35%);
  }
}

</style>

<style scoped>
.global-modal-container {
  position: fixed;
  z-index: 20;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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

.card-modal-overlay {
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
  height: 90vh;
  max-height: 90vh;
  /* width: 34vw;
  max-width: 34vw; */
  aspect-ratio: .75;
  border: 2px dashed var(--fg);
  border: 4px solid var(--fg-dim);
  box-shadow: var(--card-shadow);
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
  scrollbar-width: none;
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
  font-weight: 600;
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

.trad-simple {
  font-size: 2rem;
  font-family: 'Kaiti', 'STKaiti', 'Kai', '楷体';
}

.breakdown-section {
  border-top: 2px dashed color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  padding-top: 1.5rem;
  width: 100%;
  min-width: 0;
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
  font-family: "Noto Sans SC";
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
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 4rem;
  min-height: 4rem;
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
  background-color: color-mix(in oklab, var(--fg) 3%, var(--bg) 100%);
  height: 100%;
  justify-self: flex-start;
  align-items: center;
  /* justify-content: space-around; */
}

.hanzi-anim {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 1;
}

.anim-character {
  /* font-size: 12rem;
  font-family: 'Kaiti', 'STKaiti', 'Kai', '楷体'; */
}

.radicals {
  display: inline-flex;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  gap: .5rem;
  justify-content: flex-end;
}

.radical {
  align-items: center;
  font-size: 1em;
  padding: 0.2rem 0.75rem;
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  flex-shrink: 0; 
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
}

.close-btn:hover {
  opacity: 1;
}

/* Fixed position close button for thumb accessibility */
.fixed-close {
  font-size: 2rem;
  cursor: pointer;
  border: none;
  border-radius: 50%;

  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background-color: color-mix(in oklab, var(--fg) 25%, var(--bg) 100%);
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  box-shadow: 0 4px 8px rgba(124, 98, 98, 0.2);
  opacity: 0.8;
  z-index: 30;
  line-height: 0;
  padding: 0;
}

.fixed-close:hover {
  opacity: 1;
  transform: scale(1.05);
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
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Kaiti', 'STKaiti', 'Kai', '楷体';
}

.decomp-char.current-char {
  background-color: color-mix(in oklab, var(--primary-color) 30%, var(--bg) 70%);
  font-weight: bold;
}

.component-char {
  font-size: 1.8rem;
  font-family: 'Kaiti', 'STKaiti', 'Kai', '楷体';
  margin-right: 0.5rem;
}

.component-label {
  font-size: 0.9rem;
  opacity: 0.6;
}

.wordlist-dropdown {
  position: fixed;
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

.medium-label {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.pinyin-meaning-group {
  height: auto;
  flex-direction: column;
  align-items: flex-start;
}

.pinyin-meaning-pairs {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.pinyin-meaning-pair {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius);
  background-color: color-mix(in oklab, var(--fg) 3%, var(--bg) 100%);
}

.pm-pinyin {
  font-size: 1.2rem;
  font-weight: 500;
  /* min-width: 5rem; */
  /* color: var(--pinyin-color); */
}

.pinyinshadow{

}

.pm-meaning {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-style: italic;
  white-space: wrap;
  overflow-wrap: break-word;
  word-break: break-all;
}

.no-pinyin-meaning {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-style: italic;
  padding: 0.5rem;
}

.concepts-container {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.concept-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  border-radius: var(--border-radius);
  transition: background-color 0.2s ease;
}

.concept-toggle.active {
  /* background-color: var(--primary-color); */
  background-color: color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  color: var(--fg);
}

.concept-bookmark {
  font-size: 1.2rem;
}

.concept-label {
  font-size: 1rem;
}

.concept-content {
  margin-top: 1rem;
}

.related-content,
.opposite-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.no-concepts {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-style: italic;
}

.concept-items {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.concept-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.concept-item:hover {
  background-color: var(--primary-color);
  color: var(--fg);
}

.concept-character {
  font-size: 1.5rem;
  font-family: 'Kaiti', 'STKaiti', 'Kai', '楷体';
}

.concept-pinyin {
  font-size: 1rem;
  opacity: 0.6;
}

.concept-english {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-style: italic;
}

@media (max-width: 1024px) {
  .modal {
    width: 95vw;
    max-width: 95vw;
    height: 80vh;
    max-height: 80vh;
    padding: 1rem;
    border: none;
  }

  .wordlist-dropdown {
      position: fixed;
      top: 3em;
      left: 1rem;
    }
}

@media screen and (max-width: 768px) {
    .modal {
      width: 100%;
      max-width: 100%;
      height: 100%;
      max-height: 100%;
      padding: 3rem 1rem 1rem 1rem;
    }
    
    .wordlist-dropdown {
      position: fixed;
      top: 3em;
      left: 1rem;
    }

    .main-word {
      font-size: 8rem;
      margin-top: 3rem;
    }

    .main-pinyin,
    .main-english {
      font-size: 1rem;
    }

  .freq-trad-anim {
    flex-direction: column;
  }
  
  .tab-btn {
    font-size: 1rem;
    border: none;
    padding: 0.25rem .5rem;
  }

  .tabs {
    display: flex;
    gap: 0rem;
    margin-top: 0;
    margin-bottom: 1rem;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-bottom: 2px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
    position: relative;
    overflow: visible;
  }
}

/* X centering element */
.x-centered {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  margin-bottom: 3px; /* Fine-tune vertical positioning */
}
</style>

<style>

body.modal-open {
  overflow: hidden;
}
</style>