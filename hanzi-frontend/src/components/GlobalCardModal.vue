<template>
  <div v-if="isVisible || pageMode" :class="['global-modal-container', { 'page-mode-container': pageMode }]">
    <div :class="['card-modal-overlay', { 'page-mode-overlay': pageMode }]" @click="closeModal">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <div>Loading...</div>
      </div>
      
      <div v-else class="modal card-modal" @click.stop="handleModalClick">
        
        <!-- Add to wordlist dropdown button - now shown to all users -->
        <div class="wordlist-dropdown">
          <button @click.stop="toggleWordlistDropdown" class="wordlist-btn" ref="dropdownButton">
            <span class="plus-icon">+</span>
          </button>
          <div v-if="showWordlistDropdown" class="dropdown-content" ref="dropdownContent" @click.stop>
            <div v-if="!isLoggedIn" class="no-lists">
              Adding to custom wordlists is possible only upon <router-link to="/register" class="register-link">registration</router-link> or <router-link to="/login" class="register-link">login</router-link>.
            </div>
            <div v-else-if="customWordlists && customWordlists.length === 0" class="no-lists">No custom wordlists available</div>
            <div v-else>
              <div v-for="wordlist in customWordlists" :key="wordlist.name" 
                  class="wordlist-item"
                  @click.stop="addWordToList(wordlist.name)">
                {{ wordlist.name }}
              </div>
              <!-- Add "Create New List" option at the bottom of dropdown -->
              <div class="wordlist-item create-list-item" @click.stop="showCreateListModal = true">
                <span class="create-icon">+</span> Create New List
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
            
            <!-- New: quick examples button -->
            <div class="concept-toggle" @click="toggleExamples" :class="{ 'active': showExamples }">
              <span class="concept-label">examples</span>
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

        <!-- Examples view -->
        <div v-if="showExamples" class="examples-group examples-view">
          <div class="section-header">
            <div class="medium-label">Examples</div>
          </div>
          <div class="examples-list">
            <div v-for="(ex, idx) in formattedExamples" :key="idx" class="example-sentence">
              <div class="ex-chinese">{{ ex.hanzi }}</div>
                <div class="ex-pinyin">{{ $toAccentedPinyin(ex.pinyin).charAt(0).toUpperCase() + $toAccentedPinyin(ex.pinyin).slice(1) }}</div>
              <div class="ex-english">{{ ex.english }}</div>
            </div>
          </div>
          <div class="examples-nav">
            <div 
              class="concept-toggle examples-nav-btn" 
              :class="{ disabled: examplesLoading || examplesPage === 1 }"
              @click="examplesPage === 1 || examplesLoading ? null : prevExamples()"
            >
              ← Prev
            </div>
            <div class="examples-page-indicator">Page {{ examplesPage }}</div>
            <div 
              class="concept-toggle examples-nav-btn" 
              :class="{ disabled: examplesLoading || examplesIsLast }"
              @click="examplesIsLast || examplesLoading ? null : nextExamples()"
            >
              Next →
            </div>
          </div>
        </div>

        <!-- Character breakdown section -->
        <div class="breakdown-section" v-if="!showExamples && cardData.chars_breakdown">
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


              <!-- Character details section -->
              <div class="freq-trad-anim">
                <div class="freq-trad">
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
                      <PreloadWrapper
                        :character="activeCharData.traditional"
                        :showBubbles="false"
                        class="trad-simple"
                      >
                        {{ activeCharData.traditional }}
                      </PreloadWrapper>
                  </div>

                  <div v-if="activeChar !== activeCharData.simplified" class="detail-group">
                    <span class="basic-label">Simplified: </span>
                    <PreloadWrapper
                      :character="activeCharData.simplified"
                      :showBubbles="false"
                      class="trad-simple"
                    >
                      {{ activeCharData.simplified }}
                    </PreloadWrapper>
                  </div>

                  <!-- <div class="detail-group radicals-group">
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
                  </div> -->

                </div>

                <div class="hanzi-anim" v-if="activeCharData.strokes && activeCharData.strokes.medians && activeCharData.strokes.strokes">
                  <AnimatedHanzi 
                    :character="activeCharData.character"
                    :strokes="activeCharData.strokes"
                    :animatable="true" 
                    :drawThin="false" 
                    :animSpeed="0.1"
                  />
                </div>
              </div>

              <!-- Only render ExpandableExamples if there are example words -->
              <ExpandableExamples 
                v-if="activeCharData.example_words && activeCharData.example_words.length > 0" 
                title="Words containing this character"
                :itemCount="activeCharData.example_words.length"
                :thresholdForExpand="3"
                ref="examplesComponent">
                <template v-slot:afew="slotProps">
                    <div 
                    class="example-words first-words" 
                    :class="{ 'collapsed-words': !slotProps.isExpanded }"
                    >
                    <ClickableRow
                      v-for="(word, index) in activeCharData.example_words.slice(0, 3)"
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
                  <div class="example-words rest-words">
                    <ClickableRow
                      v-for="(word, index) in activeCharData.example_words.slice(3)"
                      :key="index + 3"
                      :word="word"
                      class="therest"
                    >
                      <template #default>
                        <div class="example-chinese-pinyin">
                          <span class="example-chinese">{{ word }}</span>
                          <span class="example-pinyin">
                            {{ $toAccentedPinyin(activeCharData.pinyin[index + 3]) }}
                          </span>
                        </div>
                        <span class="example-meaning">{{ activeCharData.english[index + 3] }}</span>
                      </template>
                    </ClickableRow>
                  </div>
                </template>
              </ExpandableExamples>

              <!-- Present In section: show characters from presentInChars with loading state -->
              <div v-if="activeChar && decompositionData && decompositionData[activeChar] && decompositionData[activeChar].present_in && decompositionData[activeChar].present_in.length > 0" class="present-in-section">
                <div class="medium-label">{{ activeChar }} Present in:</div>
                <div class="present-in-chars" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                  <PreloadWrapper
                    v-for="char in limitedPresentInChars"
                    :key="char"
                    :character="char"
                    :showBubbles="false"
                    class="present-in-char"
                  >
                  {{ char }}
                  </PreloadWrapper>
                  <span 
                    v-if="hasMorePresentInChars" 
                    class="more-chars" 
                    @click="loadMorePresentInChars"
                    :class="{ 'loading': isLoadingMoreChars }"
                  >
                    +
                  </span>
                </div>
              </div>

              <!-- Components section - Formatted decomposition data -->
              <div v-if="activeChar && decompositionData && decompositionData[activeChar] && decompositionData[activeChar].recursive && Object.keys(decompositionData[activeChar].recursive).length > 0">
                <div class="medium-label">Decomposition</div>
                <div class="decomp-section">
                  <RecursiveDecomposition :data="{ [activeChar]: decompositionData[activeChar].recursive }" />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Fixed position close button at bottom right - only show in modal mode -->
    <button v-if="!pageMode" @click="closeModal" class="close-btn fixed-close"><span class="x-centered">×</span></button>
    
    <ToastNotification
      v-model:visible="notificationVisible"
      :message="notificationMessage"
      :type="notificationType"
      position="bottom-right"
    />
  </div>

  <!-- Add Create New List modal -->
  <div v-if="showCreateListModal" class="create-list-modal-overlay" @click="closeCreateListModal">
    <div class="create-list-modal-container" @click.stop>
      <h3>Create New List</h3>
      <div class="create-list-form">
        <label for="new-list-name">List Name:</label>
        <input 
          id="new-list-name" 
          v-model="newListName" 
          placeholder="Enter list name"
          @keyup.enter="createNewListAndAddWord"
          @keyup.esc="closeCreateListModal"
          ref="createListInput"
          autocomplete="off"
        />
      </div>
      <div class="create-list-buttons">
        <button @click="closeCreateListModal" class="cancel-button">Cancel</button>
        <button @click="createNewListAndAddWord" class="confirm-button">Create & Add Word</button>
      </div>
    </div>
  </div>
</template>

<script>
import ExpandableExamples from './ExpandableExamples.vue'
import ClickableRow from './ClickableRow.vue'
import AnimatedHanzi from './AnimatedHanzi.vue'
import ToastNotification from './ToastNotification.vue'
import RecursiveDecomposition from './RecursiveDecomposition.vue'
import PreloadWrapper from './PreloadWrapper.vue'
import { mapGetters, mapActions } from 'vuex'

export default {
  components: {
    ExpandableExamples,
    ClickableRow,
    AnimatedHanzi,
    ToastNotification,
    RecursiveDecomposition,
    PreloadWrapper
  },
  name: 'GlobalCardModal',
  props: {
    pageMode: {
      type: Boolean,
      default: false
    },
    forcedCharacter: {
      type: String,
      default: null
    }
  },
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
      showExamples: false,
      showCreateListModal: false,
      newListName: '',
      presentInChunkIndex: 0,  // Track the current chunk index
      isLoadingMoreChars: false, // Track loading state for more characters
      loadedPresentInChars: {}, // Store all loaded character chunks by character
      displayedPresentInChars: {}, // Store characters that are currently displayed
      isTypingEffect: false // Track if typing effect is in progress
      ,
      // Examples pagination state
      examplesPage: 1,
      examplesIsLast: false,
      examplesLoading: false,
      fetchedExamples: {}
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
      currentCharacter: 'cardModal/getCurrentCharacter',
      navList: 'cardModal/getNavList',
      navIndex: 'cardModal/getNavIndex'
    }),
    validChars() {
      if (!this.cardData || !this.cardData.character) return [];
      return Array.from(new Set(this.cardData.character.split('').filter(char => /\p{Script=Han}/u.test(char))));
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
    formattedExamples() {
      if (!this.cardData) return [];
      // Use fetched page if available; else use initial examples for page 1
      const pageData = this.fetchedExamples[this.examplesPage];
      const examples = Array.isArray(pageData)
        ? pageData
        : (this.examplesPage === 1 && Array.isArray(this.cardData.examples) ? this.cardData.examples : []);
      try {
        return examples.map((ex) => {
          const hanzi = typeof ex.cmn === 'string'
            ? ex.cmn
            : (Array.isArray(ex.cmn) ? ex.cmn.map(part => part.character).join(' ') : '');
          const english = Array.isArray(ex.eng) && ex.eng.length ? ex.eng[0] : '';
          const pinyin = typeof ex.pinyin === 'string' ? ex.pinyin : '';
          return { hanzi, english, pinyin };
        });
      } catch {
        return [];
      }
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
    },
    limitedPresentInChars() {
      if (!this.activeChar || !this.decompositionData || !this.decompositionData[this.activeChar] || !this.decompositionData[this.activeChar].present_in) {
        return [];
      }

      // If we've loaded additional chunks for this character, return those instead
      if (this.loadedPresentInChars[this.activeChar]) {
        return this.loadedPresentInChars[this.activeChar];
      }
      
      // Default behavior - use the first chunk from decomposition data
      return this.decompositionData[this.activeChar].present_in;
    },
    hasMorePresentInChars() {
      if (!this.activeChar || !this.decompositionData || !this.decompositionData[this.activeChar] || !this.decompositionData[this.activeChar].present_in) {
        return false;
      }

      // If we've loaded additional chunks for this character, use the API's has_more flag
      if (this.loadedPresentInChars[this.activeChar]) {
        return this._presentInHasMore === true;
      }
      
      // Default behavior - assume there's more if initial chunk is full (exactly 50 characters)
      return this.decompositionData[this.activeChar].present_in.length === 50;
    },
    presentInHasMore() {
      // This is set by the loadMorePresentInChars method
      return this._presentInHasMore || false;
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

          // Reset ExpandableExamples component state
          if (this.$refs.examplesComponent) {
            this.$refs.examplesComponent.resetExpandedState();
          }
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
          // Force component update
          this.$forceUpdate();
        }
      },
      deep: true
    },
    activeChar: {
      handler(newChar) {
        if (newChar) {
          // Reset the chunk index when active character changes
          this.presentInChunkIndex = 0;
          
          // Reset expanded examples state when active character changes
          if (this.$refs.examplesComponent) {
            this.$refs.examplesComponent.resetExpandedState();
          }
        }
      }
    }
  },
  mounted() {
    // Debug logging of wordlists
    
    // If we're in page mode and have a forcedCharacter, show the modal with that character
    if (this.pageMode && this.forcedCharacter) {
      this.showCardModal(this.forcedCharacter);
    }
    
    window.addEventListener('keydown', this.handleEscKey);
    window.addEventListener('keydown', this.handleDebugKey); // Add the debug key handler
    window.addEventListener('keydown', this.handleArrowNav);
    document.addEventListener('click', this.handleOutsideClick);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleEscKey);
    window.removeEventListener('keydown', this.handleDebugKey); // Remove the debug key handler
    window.removeEventListener('keydown', this.handleArrowNav);
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
    logExamples() {
      try {
        console.log('[GlobalCardModal] examples for', this.cardData?.character, this.cardData?.examples || []);
      } catch (e) {}
    },
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
      // Reset the loaded present-in characters when modal closes
      this.loadedPresentInChars = {};
      this.presentInChunkIndex = 0;
    },
    setActiveChar(char) {
      if (this.validChars.includes(char)) {
        if (this.activeChar !== char) {
          this.activeChar = char;
          // Reset loaded present-in characters when changing to a new character
          this.loadedPresentInChars = {};
          this.presentInChunkIndex = 0;
        }
      }
    },
    createNewListAndAddWord() {
      if (!this.newListName.trim()) {
        this.showNotification('Please enter a valid list name.', 'error');
        return;
      }

      const name = this.newListName.trim();
      const word = this.cardData.character;
      
      // First update the store (optimistic update)
      this.$store.dispatch('createWordlist', { name });
      
      // Close the modal
      this.closeCreateListModal();
      
      // Create the new list on the backend
      fetch("./api/create_wordlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to create wordlist');
        }
        
        // After list is created, add the word to it
        return fetch("./api/add_word_to_learning", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            word: word, 
            set_name: name 
          })
        });
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to add word to list');
        }
        
        // Update store with the new word
        this.$store.dispatch('addWordToCustomDeck', {
          word: word,
          setName: name,
          wordData: {
            pinyin: this.cardData.pinyin,
            english: this.cardData.english,
            character: this.cardData.character
          }
        });
        
        // Show success notification
        this.showNotification(`Added "${word}" to new list "${name}"`, 'success');
        
        // Refresh custom dictionary data
        this.$store.dispatch('fetchCustomDictionaryData');
      })
      .catch(error => {
        console.error("Error:", error);
        this.showNotification(`Error: ${error.message}`, 'error');
        
        // If there's an error, refresh data to get the correct state
        this.$store.dispatch('fetchUserData')
          .then(() => this.$store.dispatch('fetchCustomDictionaryData'));
      });
    },
    handleEscKey(event) {
      if (event.key === 'Escape' && this.isVisible) {
        this.closeModal();
      }
    },
    handleDebugKey(event) {
      if (event.key === 'd') {
        // this.debugCardData();
      }
    },
    handleArrowNav(event) {
      if (!this.isVisible) return;
      if (!this.navList || this.navList.length === 0) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.$store.dispatch('cardModal/navigateNext');
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.$store.dispatch('cardModal/navigatePrev');
      }
    },
    // Debug function to log card data to console
    debugCardData() {
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
        
        // Just update the active character if needed
        if (this.validChars.includes(word) && this.activeChar !== word) {
          this.activeChar = word;
        }
        return;
      }
      
      // This will trigger fetchCardData, which will then fetch decomp data ONCE
      
      this.showCardModal(word);
    },
    toggleWordlistDropdown() {
      if (this.isLoggedIn && (!this.customWordlists || this.customWordlists.length === 0)) {
        // If we're logged in but have no wordlists, try to fetch them
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
        const dropdownButton = this.$refs.dropdownButton;
        const dropdownContent = this.$refs.dropdownContent;
        
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
      const dropdownButton = this.$refs.dropdownButton;
      const dropdownContent = this.$refs.dropdownContent;
      
      if (this.showWordlistDropdown &&
          dropdownButton && !dropdownButton.contains(event.target) &&
          dropdownContent && !dropdownContent.contains(event.target)) {
        this.showWordlistDropdown = false;
      }
    },
    getCharacterComponents(character) {
      // Extract the actual components from decompositionData
      if (!this.decompositionData) return [];
      
      
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
      
      return components;
    },
    toggleConcepts(type) {
      if (type === 'related') {
        this.showRelatedConcepts = !this.showRelatedConcepts;
        this.showOppositeConcepts = false;
        this.showExamples = false;
      } else if (type === 'opposite') {
        this.showOppositeConcepts = !this.showOppositeConcepts;
        this.showRelatedConcepts = false;
        this.showExamples = false;
      }
    },
    toggleExamples() {
      this.showExamples = !this.showExamples;
      if (this.showExamples) {
        this.showRelatedConcepts = false;
        this.showOppositeConcepts = false;
        // reset pagination when opening examples
        this.examplesPage = 1;
        this.examplesIsLast = false;
        this.examplesLoading = false;
        this.fetchedExamples = {};
      }
    },
    async loadExamplesPage(page) {
      if (!this.cardData || !this.cardData.character) return;
      this.examplesLoading = true;
      try {
        const res = await fetch('/api/get_examples_page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ character: this.cardData.character, page })
        });
        if (!res.ok) throw new Error('Failed to load examples page');
        const data = await res.json();
        const examples = Array.isArray(data.examples) ? data.examples : [];
        this.fetchedExamples = { ...this.fetchedExamples, [page]: examples };
        this.examplesIsLast = Boolean(data.is_last);
        this.examplesPage = page;
      } catch (e) {
        console.error('Error loading examples page:', e);
      } finally {
        this.examplesLoading = false;
      }
    },
    nextExamples() { this.loadExamplesPage(this.examplesPage + 1); },
    prevExamples() { this.loadExamplesPage(this.examplesPage - 1); },
    // Add this new method to load more characters
    loadMorePresentInChars() {
      if (this.isLoadingMoreChars || !this.activeChar || this.isTypingEffect) return;
      
      this.isLoadingMoreChars = true;
      this.presentInChunkIndex++;
      
      // Call the new API endpoint
      fetch(`/api/get_present_in_chunk?character=${encodeURIComponent(this.activeChar)}&chunk_index=${this.presentInChunkIndex}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load more characters');
          }
          return response.json();
        })
        .then(data => {
          // Initialize the array for this character if it doesn't exist
          if (!this.loadedPresentInChars[this.activeChar]) {
            const initialChars = this.decompositionData[this.activeChar].present_in || [];
            this.loadedPresentInChars[this.activeChar] = [...initialChars];
          }
          
          // Store the current loaded characters
          const currentChars = [...this.loadedPresentInChars[this.activeChar]];
          
          // If we have new characters, add them one by one with typing effect
          if (data.characters && data.characters.length > 0) {
            this.isTypingEffect = true;
            
            // Add characters one by one with a delay
            let charIndex = 0;
            const addNextChar = () => {
              if (charIndex < data.characters.length) {
                // Add the next character
                this.loadedPresentInChars[this.activeChar] = [
                  ...this.loadedPresentInChars[this.activeChar],
                  data.characters[charIndex]
                ];
                charIndex++;
                
                // Schedule the next character after 50ms delay
                setTimeout(addNextChar, 50);
              } else {
                // We've added all characters
                this.isTypingEffect = false;
              }
            };
            
            // Start the typing effect
            addNextChar();
          }
          
          // Update the hasMore flag
          this._presentInHasMore = data.has_more;
          
          // Show notification if we've loaded all characters
          if (!data.has_more && data.total_count) {
            this.showNotification(`Loaded all ${data.total_count} characters`, 'info');
          }
        })
        .catch(error => {
          console.error('Error loading more characters:', error);
          this.showNotification('Failed to load more characters', 'error');
          // Reset the index since this request failed
          this.presentInChunkIndex--;
          this.isTypingEffect = false;
        })
        .finally(() => {
          this.isLoadingMoreChars = false;
        });
    }
  }
}
</script>

<style>


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
  aspect-ratio: .75;
  border: var(--modal-border-width) solid var(--fg);
  box-shadow: var(--card-shadow);
  background: var(--modal-bg);
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
  border-radius: var(--modal-border-radius);
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
  font-family: "Noto Serif SC", "Kaiti", sans-serif;

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
  width: 100%;
  margin-top: 1em;
  opacity: 0.6;
  
  white-space: wrap;
  word-wrap: break-word;
  word-break: break-word;
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
  box-sizing: border-box;
  min-width: 0;
  background-color: var(--freq-trad-bg, color-mix(in oklab, var(--fg) 3%, var(--bg) 100%));
}


.example-word-content {
  display: flex;
  box-sizing: border-box;
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
  background-color: color-mix(in oklab, var(--fg) 85%, var(--bg) 50%) !important;
  color: var(--bg) !important;
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

.examples-view {
  padding: 0 0rem;
  box-sizing: border-box;
  min-width: 100%;
}

.examples-list {
  display: flex;
  flex-direction: column;
  gap: 0rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.example-sentence {
  background-color: var(--freq-trad-bg, color-mix(in oklab, var(--fg) 3%, var(--bg) 100%));
  border-bottom: 2px dashed color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  padding: 0.75rem 1rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.example-sentence:last-child {
  border-bottom: none;
}

.examples-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
}

.examples-nav-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.examples-page-indicator {
  font-size: 0.85rem;
  opacity: 0.7;
}

.ex-chinese {
  font-size: 1.2rem;
  font-family: 'Kaiti', 'STKaiti', 'Kai', '楷体';
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.ex-pinyin {
  font-size: 0.9rem;
  opacity: 0.46;
  margin-top: 0.25rem;
  margin-left: 1rem;
  white-space: normal;
  overflow-wrap: anywhere;
}

.ex-english {
  font-size: 0.95rem;
  opacity: 0.8;
  margin-top: 0.25rem;
  margin-left: 1rem;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-top: 0;
  margin-bottom: 1rem;
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-bottom: 3.5px solid color-mix(in oklab, var(--fg) 55%, var(--bg) 50%);
  position: relative;
  overflow: visible;
}

.tab-btn {
  position: relative;
  font-size: 1.2rem;
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
  font-family: "Noto Sans SC";
  font-weight: 400;
  color: var(--primary-primary);
  white-space: nowrap;
  opacity: 0.35; 
  border: 3.5px solid #0000;
  background: #0000;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  border-bottom: 3.5px solid #0000;
  transform: translate(0, 3.5px);
}

.tab-btn.active {
  border: 3.5px solid color-mix(in oklab, var(--fg) 55%, var(--bg) 50%);
  background: var(--modal-bg);
  opacity: 1;
  z-index: 2;
  transform: translate(0, 3.5px);
  border-bottom: 3.5px solid #0000;
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
  background-color: var(--freq-trad-bg, color-mix(in oklab, var(--fg) 3%, var(--bg) 100%));
  height: 100%;
  justify-self: flex-start;
  align-items: center;
  
  border: var(--pinyin-meaning-group-border);
  border-radius: var(--pinyin-meaning-group-border-radius, 0);
  /* justify-content: space-around; */
  box-sizing: border-box;
}

.hanzi-anim {
  flex: 1;
  display: flex;
  justify-content: left;
  align-items: center;
  line-height: 1;
  box-sizing: border-box;
}

.anim-character {
  /* font-size: 12rem;
  font-family: 'Kaiti', 'STKaiti', 'Kai', '楷体'; */
  box-sizing: border-box;
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
  display: none;
}

.fixed-close:hover {
  /* opacity: 1;
  transform: scale(1.05); */
}

.decomp-section {
  height: auto;
  margin-top: 1rem;
  padding: 1rem;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
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
  background-color: var(--freq-trad-bg, color-mix(in oklab, var(--fg) 3%, var(--bg) 100%));
  cursor: pointer;
  font-family: 'Kaiti', 'STKaiti', 'Kai', '楷体';
}

.decomp-char:hover {
  background-color: color-mix(in oklab, var(--fg) 85%, var(--bg) 50%) !important;
  color: var(--bg) !important;
}

.decomp-char.current-char {
  /* background-color: color-mix(in oklab, var(--primary-color) 30%, var(--bg) 70%);
  font-weight: bold; */
}

.component-char {
  font-size: 1.8rem;
  font-family: 'Kaiti', 'STKaiti', 'Kai', '楷体';
  margin-right: 0.5rem;
}

.component-label {
  font-size: 1.8rem;
  opacity: 0.36;
  position: relative;
  top: -.65rem;
}

.component-label-2 {
  font-size: 1.8rem;
  opacity: 0.36;
  position: relative;
  top: .6rem;
  left: -.2em;
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
  aspect-ratio: 1;
}

.wordlist-btn:hover {
  background-color: color-mix(in oklab, var(--fg) 8%, var(--bg) 50%);
}

.plus-icon {
  font-size: 1.2rem;
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
  min-width: 200px;
}

.wordlist-item {
  font-size: .9rem;
  padding: 0.5rem;
  cursor: pointer;
  background-color: color-mix(in oklab, var(--fg) 8%, var(--bg) 50%);
}

.wordlist-item:hover {
  background-color: var(--primary-color);
  color: var(--fg);
  font-weight: 500;
}

.create-list-item {
  border-top: 1px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.create-icon {
  font-weight: bold;
}

.no-lists {
  color: var(--text-secondary);
  font-size: 0.9rem;
  padding: 1em;
  width: 200px;
}

.register-link {
  color: var(--pinyin-color);
  text-decoration: none;
  font-size: 0.9rem;
}

.medium-label {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  margin-top: 0rem;
  color: var(--text-primary);
}

.present-in-section{
  margin-bottom: 1em;
}

.pinyin-meaning-group {
  height: auto;
  flex-direction: column;
  align-items: flex-start;
/* 
  border: var(--pinyin-meaning-group-border);
  border-radius: var(--pinyin-meaning-group-border-radius, 0); */
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
  background-color: transparent;
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
}

.concept-toggle.active {
  /* background-color: var(--primary-color); */
  background-color: color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  background-color: var(--orange);
  color: var(--orange-dim);
  color: var(--bg);
}

.concept-bookmark {
  font-size: 1.2rem;
}

.concept-label {
  font-size: .85rem;
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

.create-list-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: color-mix(in oklab, var(--bg) 10%, var(--bg) 80%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 430; /* Ensure modal appears above the card modal */
}

.create-list-modal-container {
  background: var(--bg-alt);
  padding: 2rem;
  width: 90%;
  max-width: 500px;
}

.create-list-form {
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.create-list-form input {
  padding: 0.5rem;
  border: 1px solid color-mix(in oklab, var(--fg) 20%, var(--bg) 50%);
  background: var(--bg);
  color: var(--fg);
  font-family: inherit;
}

.create-list-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  background: none;
}

.cancel-button,
.confirm-button {
  border: none;
  background: none;
}

.cancel-button:hover,
.confirm-button:hover {
  cursor: pointer;
}

.present-in-chars {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: .5em .5em .5em .5em;
  background-color: var(--freq-trad-bg, color-mix(in oklab, var(--fg) 3%, var(--bg) 100%));
}

.present-in-chars span {
  padding: 0.3rem 0.5rem;
  background-color: var(--freq-trad-bg, color-mix(in oklab, var(--fg) 3%, var(--bg) 100%));
  cursor: pointer;
}
.present-in-chars span:hover {
  background-color: color-mix(in oklab, var(--fg) 85%, var(--bg) 50%);
  color: var(--bg);
}

.present-in-char {
  /* font-family: "Noto Sans SC" !important;
  font-family: "Noto Serif SC" !important; */
  font-family: "Kaiti";
  font-size: 1.5em;
}


.more-chars {
	font-size: 1em;
	width: 1em;
	height: 1em;
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
	cursor: pointer;
	color: var(--fg);
	border: 1px solid color-mix(in oklab, var(--fg) 44%, var(--bg) 30%);
	border-radius: 0;
	font-weight: bold;
}

.more-chars:hover {
	background-color: color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
	transform: scale(1);
}

@media (max-width: 1024px) {
  .modal {
    width: 95vw;
    max-width: 95vw;
    height: 80vh;
    max-height: 80vh;
    padding: 1rem;
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
      top: 0;
      left: 0;
      transform: translate(0%, 0%);
      position: absolute;
      max-height: 100%;
      padding: 3rem 1rem 1rem 1rem;
      border: none;
    }
    
    .wordlist-dropdown {
      position: fixed;
      top: 3em;
      left: 1rem;
    }

    .main-word {
      font-size: 5rem;
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
    border: none;
    /* padding: 0.25rem .5rem; */
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

  .fixed-close {
    display: flex;
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
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    box-shadow: 0 4px 8px rgba(124, 98, 98, 0.2);
    opacity: 0.8;
    z-index: 30;
    line-height: 0;
    padding: 0;
  }

  .examples-view {
    padding: 0 0rem;
    box-sizing: border-box;
  }


}

/* X centering element */
.x-centered {
  display: flex;
  align-items: center;
  color: var(--fg);
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
