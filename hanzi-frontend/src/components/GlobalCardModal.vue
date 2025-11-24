<template>
  <div v-if="isVisible || pageMode" :class="['global-modal-container', { 'page-mode-container': pageMode }]">
    <div :class="['card-modal-overlay', { 'page-mode-overlay': pageMode }]" @click="closeModal">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <div>Loading...</div>
      </div>

      <div
        v-else
        :class="['modal', 'card-modal', { invert: swipeDimVisible }, { mleft: swipeHintDirection === 'left' }, { mright: swipeHintDirection === 'right' }]"
        @click.stop="handleModalClick"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      @click="historyOpen = false"
      >
        <!-- Swipe hint overlay (fades in/out quickly) -->
        <div class="swipe-hint" :class="{ visible: swipeHintVisible }">{{ swipeHintDirection === 'right' ? '→' : '←' }}</div>


        <div class="history-controls" v-if="modalHistory.length > 1">
          <div class="history-btn-wrap">
            <button v-if="showBackButton" @click.stop="loadPrevious" class="back-btn" ref="backButton">
              <span class="plus-icon"><</span>
            </button>
            <button class="history-btn" @click.stop="historyOpen = !historyOpen">
                <font-awesome-icon :icon="['fas', 'clock-rotate-left']" />
            </button>
          </div>
          <div v-if="historyOpen" class="history-menu">
            <button
              v-for="(entry, idx) in modalHistory"
              :key="idx"
              :class="['history-item', { active: idx === modalHistoryIndex }]"
              @click.stop="jumpToHistory(idx)"
            >
              <span class="history-idx">{{ idx + 1 }}.</span>
              <span class="history-entry">{{ entry }}</span>
            </button>
          </div>
        </div>

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
        <div
        class="main-word-section"
        :class="['main-word-section']"
        >
          <div
            :class="['main-word', { 'main-word-inverted': swipeDimVisible }, { mleft: swipeHintDirection === 'left' }, { mright: swipeHintDirection === 'right' }]"
            :style="mainWordFontStyle"
            @click.capture="cycleMainWordFont"
          >
            <div class="main-word-line">
              <span
                v-for="(char, index) in cardData.character.split('')"
                :key="index"
                :class="['main-word-char']"
                @click="setActiveChar(char)"
              >
                {{ char }}
              </span>

              <span v-if="showTraditionalLine" class="main-word-trad">
                <span class="trad-bracket">[</span>
                <span
                  v-for="(tchar, index) in traditionalChars"
                  :key="index"
                  :class="['main-word-char','trad-char']"
                  @click="setActiveChar(tchar)"
                >
                  {{ tchar }}
                </span>
                <span class="trad-bracket">]</span>
              </span>
            </div>
          </div>
          <!-- <div class="minor-character">{{ cardData.character }}</div> -->

          <div class="main-def-flex">
            <div class="main-def-text">
              <div class="main-pinyin">{{ $toAccentedPinyin(displayPinyin || '') }}</div>
              <div class="main-english">
                <div v-for="(item, index) in displayEnglish" :key="index" class="english-item">
                  <span class="english-idx">{{ index + 1 }}.</span>
                  <span class="english-text">
                    <template v-for="(tok, tIdx) in tokenizeHanziText(item)" :key="tIdx">
                      <span v-if="tok.isHanzi" class="hanzi-link" @click.stop="openCharAsWord(tok.text)">{{ tok.text }}</span>
                      <span v-else>{{ tok.text }}</span>
                    </template>
                  </span>
                </div>
              </div>
            </div>
            <div v-if="defCount > 1" class="def-nav">
              <button class="def-btn" @click="stepDefinition(-1)">‹</button>
              <span class="def-counter">{{ (mainDefIndex % defCount) + 1 }}/{{ defCount }}</span>
              <button class="def-btn" @click="stepDefinition(1)">›</button>
            </div>
          </div>
          <!--<div v-if="isLoggedIn" class="custom-edit-wrap">
            <button class="custom-edit-btn" @click.stop="openCustomEdit">
              <font-awesome-icon :icon="['fas','pen']" />
            </button>
          </div>-->

          <!-- Concept toggle buttons with dropdown functionality -->
          <div class="concepts-container">
            <!-- <div class="concept-toggle" @click="toggleConcepts('related')" :class="{ 'active': showRelatedConcepts }">
              <span class="concept-label">related concepts</span>
            </div>

            <div class="concept-toggle" @click="toggleConcepts('opposite')" :class="{ 'active': showOppositeConcepts }">
              <span class="concept-label">opposite concepts</span>
            </div>

            <div class="concept-toggle" @click="toggleExamples" :class="{ 'active': showExamples }">
              <span class="concept-label">examples</span>
            </div> -->
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
                <div class="concept-character" :style="{ fontFamily: 'var(--main-word-font)' }">{{ item.character }}</div>
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
                <div class="concept-character" :style="{ fontFamily: 'var(--main-word-font)' }">{{ item.character }}</div>
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
          <!-- <h3 class="char-breakdown" v-if="cardData.character && cardData.character.length > 1">Character Breakdown ↓</h3>
        -->
          <div class="tabs" v-if="validChars.length > 1" :style="{ fontFamily: tabFontFamily }">
            <button
              v-for="char in validChars"
              :key="char"
              :class="['tab-btn', { active: activeChar === char }]"
              :style="{ fontFamily: tabFontFamily }"
              @click="activeChar = char"
            >
              {{ char }}
              <span v-if="activeChar === char" class="tab-open-word" @click.stop="openCharAsWord(char)">
                <font-awesome-icon :icon="['fas','magnifying-glass']" />
              </span>
            </button>
          </div>

          <div class="tab-content" v-if="activeCharData">
            <div class="char-details">

              <div class="detail-toggle-row">
                <div
                  class="concept-toggle detail-toggle"
                  :class="{ active: activeDetailTab === 'dict', disabled: !hasDictSection }"
                  @click="setDetailTab('dict')"
                >def</div>
                <div
                  class="concept-toggle detail-toggle"
                  :class="{ active: activeDetailTab === 'examples', disabled: !hasExamples }"
                  @click="setDetailTab('examples')"
                >words</div>
                <div
                  class="concept-toggle detail-toggle"
                  :class="{ active: activeDetailTab === 'strokes', disabled: !hasStrokes }"
                  @click="setDetailTab('strokes')"
                >strokes</div>
                <div
                  class="concept-toggle detail-toggle"
                  :class="{ active: activeDetailTab === 'present', disabled: !hasPresentIn }"
                  @click="setDetailTab('present')"
                >comp</div>
                <div
                  class="concept-toggle detail-toggle"
                  :class="{ active: activeDetailTab === 'decomp', disabled: !hasDecomposition }"
                  @click="setDetailTab('decomp')"
                >decomp</div>
              </div>

              <div v-if="activeDetailTab === 'dict' && hasDictSection" class="freq-trad-anim">
                <span class="medium-label">Definition:</span>
                <div class="freq-trad">
                  <div class="detail-group pinyin-meaning-group">
                    <div class="pinyin-meaning-pairs">
                      <div v-for="(pinyin, index) in activeCharData.main_word_pinyin" :key="index" class="pinyin-meaning-pair">
                        <div class="pm-pinyin" :class="getToneClass(pinyin)"><span class="pinyinshadow">{{ $toAccentedPinyin(pinyin) }}</span></div>
                        <div class="pm-meaning">
                          <div v-for="(meaning, mIdx) in splitMeaning(activeCharData.main_word_english[index])" :key="mIdx">
                            <span class="english-idx">{{ mIdx + 1 }}.</span>
                            <span class="english-text">
                              <template v-for="(tok, tIdx) in tokenizeHanziText(meaning)" :key="tIdx">
                                <span v-if="tok.isHanzi" class="hanzi-link" @click.stop="openCharAsWord(tok.text)">{{ tok.text }}</span>
                                <span v-else>{{ tok.text }}</span>
                              </template>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div v-if="activeCharData.main_word_pinyin.length === 0" class="no-pinyin-meaning">
                        No definition data available
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
                </div>
              </div>

              <div v-if="activeDetailTab === 'strokes' && hasStrokes">
                <div class="medium-label">Strokes:</div>

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

              <div v-if="activeDetailTab === 'examples' && hasExamples" class="medium-label">Examples:</div>
              <ExpandableExamples
                v-if="activeDetailTab === 'examples' && hasExamples"
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

              <div v-if="activeDetailTab === 'present' && hasPresentIn" class="medium-label">{{ activeChar }} Present in:</div>
              <div v-if="activeDetailTab === 'present' && hasPresentIn" class="present-in-section">
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

              <div v-if="activeDetailTab === 'decomp' && hasDecomposition">
                  <div class="medium-label">Decomposition:</div>
                <div v-if="activeChar && decompositionData && decompositionData[activeChar] && decompositionData[activeChar].recursive && Object.keys(decompositionData[activeChar].recursive).length > 0">
                  <div class="decomp-section">
                    <RecursiveDecomposition :data="{ [activeChar]: decompositionData[activeChar].recursive }" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      <!-- Custom definition edit modal -->
      <div v-if="showCustomEditModal" class="custom-edit-overlay" @click.stop="cancelCustomEdit">
        <div class="custom-edit-modal" @click.stop>
          <input
            class="edit-input hanzi-input"
            type="text"
            v-model="editHanzi"
            disabled
            readonly
            @keydown.stop="onEditKeydown"
            placeholder="hanzi"
            autocomplete="off"
          />
          <input
            class="edit-input pinyin-input"
            type="text"
            v-model="editPinyin"
            @input="onPinyinInput"
            @keydown.stop="onEditKeydown"
            placeholder="pinyin"
            autocomplete="off"
          />
          <input
            class="edit-input english-input"
            type="text"
            v-model="editEnglish"
            @keydown.stop="onEditKeydown"
            placeholder="english"
            autocomplete="off"
          />
          <div v-if="editError" class="modal-error">{{ editError }}</div>
          <div class="modal-buttons">
            <button class="cancel-button" @click="cancelCustomEdit">Cancel</button>
            <button class="confirm-button" @click="saveCustomEdit">Save</button>
          </div>
        </div>
      </div>
    </div> <!-- end modal -->
  </div> <!-- end overlay -->

  <!-- Fixed position close button at bottom right - only show in modal mode -->
  <button v-if="!pageMode" @click="closeModal" class="close-btn fixed-close"><span class="x-centered">×</span></button>

  <ToastNotification
    v-model:visible="notificationVisible"
    :message="notificationMessage"
    :type="notificationType"
    position="bottom-right"
  />

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
      isTypingEffect: false, // Track if typing effect is in progress
      // Swipe detection state
      touchStartX: 0,
      touchStartY: 0,
      touchLastX: 0,
      touchLastY: 0,
      touchStartTime: 0,
      isSwiping: false,
      swipeHintVisible: false,
      swipeHintDirection: 'right',
      swipeHintTimer: null,
      // Dim animation for modal during swipe hint
      swipeDimVisible: false,
      swipeDimTimer: null,
      swipeDimDirection: 'right'
      ,
      // Custom edit modal state
      showCustomEditModal: false,
      editHanzi: '',
      editPinyin: '',
      editEnglish: '',
      editError: '',
      // Examples pagination state
      examplesPage: 1,
      examplesIsLast: false,
      examplesLoading: false,
      fetchedExamples: {},
      // Local font cycling state for main word
      fontOrder: ['kaiti', 'noto-sans', 'noto-serif'],
      fontCycleIndex: 0,
      activeDetailTab: 'dict',
      // Local history of viewed chars/words within an open modal
      modalHistory: [],
      modalHistoryIndex: -1,
      historyAction: 'reset',
      historyOpen: false,
      mainDefIndex: 0
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
      navIndex: 'cardModal/getNavIndex',
      displayOverrides: 'cardModal/getDisplayOverrides'
    }),
    currentFontKey() {
      try { return this.$store.getters['theme/getCurrentFont'] || 'noto-serif'; } catch(e) { return 'noto-serif'; }
    },
    mainWordFontStyle() {
      const families = {
        'kaiti': "'Kaiti','STKaiti','Kai','楷体',serif",
        'noto-sans': "'Noto Sans SC','Noto Sans CJK SC','Source Han Sans SC','PingFang SC','Microsoft YaHei','WenQuanYi Micro Hei',sans-serif",
        'noto-serif': "'Noto Serif SC','Noto Serif CJK SC','Source Han Serif SC','Songti SC','SimSun',serif",
      };
      const key = this.fontOrder[this.fontCycleIndex] || this.currentFontKey;
      const family = families[key] || families['noto-serif'];
      const scale = key === 'kaiti' ? '1.15' : '1';
      const len = (this.cardData && this.cardData.character) ? this.cardData.character.split('') .length : 1;
      const lenScale = len >= 3 ? '0.8' : '1';
      return { '--main-word-font': family, '--main-word-scale': scale, '--main-word-len-scale': lenScale };
    },
    defCount() {
      if (this.displayOverrides && this.displayOverrides.english) {
        const raw = this.displayOverrides.english;
        const count = Array.isArray(raw) ? raw.length || 1 : 1;
        this.mainDefIndex = this.mainDefIndex % count;
        return count;
      }
      if (this.customDef && this.customDef.english) {
        this.mainDefIndex = 0;
        return 1;
      }
      const base = (this.cardData && Array.isArray(this.cardData.english)) ? this.cardData.english.length : 0;
      const count = base > 0 ? base : 1;
      this.mainDefIndex = this.mainDefIndex % count;
      return count;
    },
    // Hanzi editing disabled globally per product decision
    canEditHanzi() { return false; },
    customDef() {
      if (!this.cardData || !this.cardData.character) return null;
      return this.$store.getters.getCustomDefinition(this.cardData.character);
    },
    displayPinyin() {
      const custom = this.customDef && this.customDef.pinyin ? this.customDef.pinyin : '';
      if (custom) return custom;
      const list = (this.cardData && Array.isArray(this.cardData.pinyin)) ? this.cardData.pinyin : [];
      if (!list.length) return '';
      const idx = this.mainDefIndex % list.length;
      return list[idx] || '';
    },
    displayEnglish() {
      const custom = this.customDef && this.customDef.english ? this.customDef.english : '';
      if (custom) return this.splitMeaning(custom);
      const list = (this.cardData && Array.isArray(this.cardData.english)) ? this.cardData.english : [];
      if (!list.length) return [];
      const idx = this.mainDefIndex % list.length;
      const val = list[idx] || '';
      return this.splitMeaning(val);
    },
    hasDictSection() {
      return !!this.activeCharData;
    },
    hasStrokes() {
      const s = this.activeCharData && this.activeCharData.strokes;
      return !!(s && s.medians && s.strokes);
    },
    hasExamples() {
      return !!(this.activeCharData && Array.isArray(this.activeCharData.example_words) && this.activeCharData.example_words.length);
    },
    tabFontFamily() {
      const fontVar = this.mainWordFontStyle && this.mainWordFontStyle['--main-word-font'];
      return fontVar || "'Noto Serif SC','Kaiti',serif";
    },
    hasPresentIn() {
      const dec = this.decompositionData && this.activeChar && this.decompositionData[this.activeChar];
      return !!(dec && dec.present_in && dec.present_in.length);
    },
    hasDecomposition() {
      const dec = this.decompositionData && this.activeChar && this.decompositionData[this.activeChar];
      return !!(dec && dec.recursive && Object.keys(dec.recursive).length);
    },
    traditionalChars() {
      const chars = this.cardData && this.cardData.character ? this.cardData.character.split('') : [];
      return chars.map(char => {
        const info = this.cardData && this.cardData.chars_breakdown ? this.cardData.chars_breakdown[char] : null;
        const trad = info && info.traditional;
        if (trad && trad !== char) return trad;
        return '-';
      });
    },
    showTraditionalLine() {
      if (!this.cardData || !this.cardData.character) return false;
      return this.traditionalChars.some(t => t && t !== '-');
    },
    showBackButton() {
      return this.modalHistoryIndex > 0;
    },
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
    isVisible(newVal, oldVal) {
      try {
        if (newVal) {
          // Modal opened: sync cycle index to current default
          const idx = this.fontOrder.indexOf(this.currentFontKey);
          this.fontCycleIndex = idx >= 0 ? idx : 0;
        } else {
          // Modal closed: reset cycle index to default
          const idx = this.fontOrder.indexOf(this.currentFontKey);
          this.fontCycleIndex = idx >= 0 ? idx : 0;
        }
      } catch (e) {}
    },
    // Ensure first open uses the initialized default font
    currentFontKey(newVal) {
      try {
        if (!this.isVisible) {
          const idx = this.fontOrder.indexOf(newVal);
          if (idx >= 0) this.fontCycleIndex = idx;
        }
      } catch (e) {}
    },
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
          this.activeDetailTab = 'dict';
          this.mainDefIndex = 0;

          try {
            const prefPin = this.displayOverrides && this.displayOverrides.preferredPinyin;
            const prefEng = this.displayOverrides && this.displayOverrides.preferredEnglish;
            const prefIdx = this.displayOverrides && Number.isInteger(this.displayOverrides.preferredIndex)
              ? this.displayOverrides.preferredIndex
              : null;
            if (prefPin || prefEng || prefIdx !== null) {
              const idx = this.findPreferredDefIndex(newData, prefPin, prefEng, prefIdx);
              if (idx >= 0) this.mainDefIndex = idx;
            }
          } catch (e) {}
          // Always keep definition order as provided; we only move the index

          if (this.historyAction === 'reset') {
            this.modalHistory = [newData.character];
            this.modalHistoryIndex = 0;
          } else if (this.historyAction === 'historyBack' || this.historyAction === 'jump') {
            const idx = this.modalHistoryIndex >= 0 ? this.modalHistoryIndex : this.modalHistory.length - 1;
            this.modalHistoryIndex = idx;
          } else {
            const upto = this.modalHistoryIndex >= 0 ? this.modalHistoryIndex + 1 : this.modalHistory.length;
            this.modalHistory = this.modalHistory.slice(0, upto);
            const last = this.modalHistory[this.modalHistory.length - 1];
            if (last !== newData.character) {
              this.modalHistory.push(newData.character);
            }
            this.modalHistoryIndex = this.modalHistory.length - 1;
          }
          this.historyAction = 'append';

          this.showRelatedConcepts = false;
          this.showOppositeConcepts = false;

          if (this.$refs.examplesComponent) {
            this.$refs.examplesComponent.resetExpandedState();
          }
        }
      }
    },

    displayOverrides: {
      handler(val) {
        if (!this.cardData) return;
        const prefPin = val && val.preferredPinyin;
        const prefEng = val && val.preferredEnglish;
        const prefIdx = (val && Number.isInteger(val.preferredIndex)) ? val.preferredIndex : null;
        const idx = this.findPreferredDefIndex(this.cardData, prefPin, prefEng, prefIdx);
        this.mainDefIndex = idx >= 0 ? idx : 0;
      }
    },
    currentCharacter: {
      handler(newChar) {
        if (newChar && this.validChars.includes(newChar)) {
          this.activeChar = newChar;
          this.mainDefIndex = 0;
          if (this.historyAction !== 'historyBack' && this.historyAction !== 'jump') {
            this.historyAction = 'append';
          }
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
      handler(newChar, oldChar) {
        if (newChar) {
          this.presentInChunkIndex = 0;
          this.mainDefIndex = 0;
          if (this.$refs.examplesComponent) {
            this.$refs.examplesComponent.resetExpandedState();
          }
          if (this.activeDetailTab === 'strokes' && !this.hasStrokes) {
            this.activeDetailTab = 'dict';
          } else if (this.activeDetailTab === 'examples' && !this.hasExamples) {
            this.activeDetailTab = 'dict';
          } else if (this.activeDetailTab === 'present' && !this.hasPresentIn) {
            this.activeDetailTab = 'dict';
          } else if (this.activeDetailTab === 'decomp' && !this.hasDecomposition) {
            this.activeDetailTab = 'dict';
          }
        }
      }
    }

  },
  mounted() {

    // If we're in page mode and have a forcedCharacter, show the modal with that character
    if (this.pageMode && this.forcedCharacter) {
      this.showCardModal(this.forcedCharacter);
    }

    window.addEventListener('keydown', this.handleEscKey);
    window.addEventListener('keydown', this.handleDebugKey); // Add the debug key handler
    window.addEventListener('keydown', this.handleArrowNav);
    document.addEventListener('click', this.handleOutsideClick);
    document.addEventListener('global-modal-closed', this.resetLocalHistory);
    // Fetch custom definition for current word if logged in
    if (this.isLoggedIn && this.cardData && this.cardData.character) {
      this.$store.dispatch('fetchCustomDefinition', this.cardData.character);
    }
    // Initialize font cycle index based on current default font
    const idx = this.fontOrder.indexOf(this.currentFontKey);
    this.fontCycleIndex = idx >= 0 ? idx : 0;
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleEscKey);
    window.removeEventListener('keydown', this.handleDebugKey); // Remove the debug key handler
    window.removeEventListener('keydown', this.handleArrowNav);
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('global-modal-closed', this.resetLocalHistory);

    if (this.isVisible) {
      document.body.classList.remove('modal-open');
    }
    // Ensure edit modal is closed and cleared when card modal unmounts
    this.showCustomEditModal = false;
    this.editHanzi = '';
    this.editPinyin = '';
    this.editEnglish = '';
    this.editError = '';
  },
  methods: {
    ...mapActions({
      hideCardModal: 'cardModal/hideCardModal',
      showCardModal: 'cardModal/showCardModal',
      fetchCardData: 'cardModal/fetchCardData'
      // Removed fetchDecompositionData to prevent direct calls
    }),
    resetLocalHistory() {
      this.modalHistory = [];
      this.modalHistoryIndex = -1;
      this.historyAction = 'reset';
      this.historyOpen = false;
    },
    openCharAsWord(char) {
      this.historyAction = 'append';
      this.historyOpen = false;
      this.updateModalContent(char);
    },
    jumpToHistory(idx) {
      if (idx < 0 || idx >= this.modalHistory.length) return;
      this.historyAction = 'jump';
      this.modalHistoryIndex = idx;
      this.historyOpen = false;
      this.showCardModal(this.modalHistory[idx]);
    },

    stripTones(val) {
      if (!val) return '';
      return String(val).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[0-9]/g, '').toLowerCase();
    },
    normalizeEng(val) {
      if (!val) return [];
      return String(val)
        .split('/')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
    },
    findPreferredDefIndex(cardData, prefPin, prefEng, prefIdx = null) {
      const pins = Array.isArray(cardData?.pinyin) ? cardData.pinyin : [];
      const engs = Array.isArray(cardData?.english) ? cardData.english : [];
      const maxLen = Math.max(pins.length, engs.length);

      if (Number.isInteger(prefIdx) && prefIdx >= 0 && prefIdx < maxLen) {
        return prefIdx;
      }

      const targetP = this.stripTones(prefPin);
      const targetEList = this.normalizeEng(prefEng);
      const targetE = targetEList[0] || '';
      let found = -1;
      for (let i = 0; i < maxLen; i++) {
        const pMatch = targetP && pins[i] && this.stripTones(pins[i]) === targetP;
        let eMatch = false;
        if (targetE) {
          const engTokens = this.normalizeEng(engs[i]);
          eMatch = engTokens.includes(targetE) || engTokens.some(t => targetE.includes(t));
        }
        if (pMatch || eMatch) { found = i; break; }
      }
      return found;
    },

    tokenizeHanziText(strVal) {
      if (!strVal) return [];
      const parts = String(strVal).split(/(\p{Script=Han}+)/u).filter(Boolean);
      return parts.map(p => ({ text: p, isHanzi: /\p{Script=Han}/u.test(p) }));
    },
    splitMeaning(val) {
      if (!val) return [];
      const combined = Array.isArray(val) ? val.join('/') : String(val);
      return combined.split('/')
        .map(s => s.trim())
        .filter(Boolean);
    },
    stepDefinition(delta) {
      if (this.defCount <= 1) return;
      const next = (this.mainDefIndex + delta + this.defCount) % this.defCount;
      this.mainDefIndex = next;
    },
    setDetailTab(tab) {
      const allowed = ['dict', 'strokes', 'examples', 'present', 'decomp'];
      if (!allowed.includes(tab)) return;
      if (tab === 'strokes' && !this.hasStrokes) return;
      if (tab === 'examples' && !this.hasExamples) return;
      if (tab === 'present' && !this.hasPresentIn) return;
      if (tab === 'decomp' && !this.hasDecomposition) return;
      this.activeDetailTab = tab;
    },
    pushModalHistory(char) {
      if (!char) return;
      const last = this.modalHistory[this.modalHistory.length - 1];
      if (last === char) return;
      // truncate any forward history when appending
      if (this.modalHistoryIndex >= 0 && this.modalHistoryIndex < this.modalHistory.length - 1) {
        this.modalHistory = this.modalHistory.slice(0, this.modalHistoryIndex + 1);
      }
      this.modalHistory.push(char);
      this.modalHistoryIndex = this.modalHistory.length - 1;
    },
    loadPrevious() {
      if (this.modalHistoryIndex > 0) {
        const prev = this.modalHistory[this.modalHistoryIndex - 1];
        this.historyAction = 'historyBack';
        this.modalHistoryIndex -= 1;
        if (prev) this.showCardModal(prev);
      }
    },
    resetLocalHistory() {
      this.modalHistory = [];
      this.modalHistoryIndex = -1;
      this.historyAction = 'reset';
      this.historyOpen = false;
    },
    cycleMainWordFont() {
      try {
        //this.fontCycleIndex = (this.fontCycleIndex + 1) % this.fontOrder.length;
      } catch (e) {}
    },
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
      // Reset font cycling index to default on close
      try {
        const idx = this.fontOrder.indexOf(this.currentFontKey);
        this.fontCycleIndex = idx >= 0 ? idx : 0;
      } catch (e) {}
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
    openCustomEdit() {
      try { console.log('[GlobalCardModal] openCustomEdit clicked'); } catch (e) {}
      if (!this.cardData || !this.cardData.character) return;
      const hanzi = this.cardData.character;
      // Prefill with custom def if exists, otherwise defaults (treat 'N/A' as empty)
      const baseP = (this.cardData.pinyin && this.cardData.pinyin[0] && this.cardData.pinyin[0] !== 'N/A') ? this.cardData.pinyin[0] : '';
      const baseE = (this.cardData.english && this.cardData.english[0] && this.cardData.english[0] !== 'N/A') ? this.cardData.english[0] : '';
      const custom = this.customDef || {};
      this.editHanzi = hanzi;
      this.editPinyin = (custom.pinyin != null ? custom.pinyin : baseP) || '';
      // Immediately normalize numbered tones to accented vowels on open
      // so the input shows accents without needing edits or save.
      this.editPinyin = this.normalizePinyinInput(this.editPinyin, { preserveSpaces: true });
      this.editEnglish = (custom.english != null ? custom.english : baseE) || '';
      this.showCustomEditModal = true;
      this.editError = '';
    },
    async saveCustomEdit() {
      try {
        if (!this.cardData || !this.cardData.character) return;
        const hanzi = this.cardData.character;
        const p = this.normalizePinyinInput((this.editPinyin || '').trim());
        const e = (this.editEnglish || '').trim();
        if (p === '' && e === '') {
          // both empty -> delete custom def for this hanzi
          await this.$store.dispatch('deleteCustomDefinition', { hanzi });
        } else {
          await this.$store.dispatch('setCustomDefinition', { hanzi, pinyin: p, english: e });
        }
        this.showCustomEditModal = false;
      } catch (err) {
        this.editError = 'Failed to save changes';
      }
    },
    cancelCustomEdit() {
      this.showCustomEditModal = false;
    },
    onPinyinInput() {
      // live-normalize numbered tones to accented vowels
      const val = this.editPinyin || '';
      // Preserve user-intended spacing while normalizing tokens
      this.editPinyin = this.normalizePinyinInput(val, { preserveSpaces: true });
    },
    onEditKeydown(e) {
      // Prevent arrow keys from navigating cards while editing
      if (e && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.stopPropagation();
      }
    },
    normalizePinyinInput(val, opts = {}) {
      try {
        if (!val) return '';
        const toneMap = {
          'a': ['ā','á','ǎ','à','a'],
          'e': ['ē','é','ě','è','e'],
          'i': ['ī','í','ǐ','ì','i'],
          'o': ['ō','ó','ǒ','ò','o'],
          'u': ['ū','ú','ǔ','ù','u'],
          'ü': ['ǖ','ǘ','ǚ','ǜ','ü']
        };

        const convertSyllable = (syllable) => {
          if (!syllable) return '';
          // allow 'v' or 'u:' as ü
          let base = syllable.replace(/u:/gi, (m)=> m[0]=== 'U' ? 'Ü' : 'ü').replace(/v/gi, (m)=> m=== 'V' ? 'Ü' : 'ü');
          // extract tone (last 1-5 digit)
          const toneMatch = base.match(/([1-5])(?!.*[1-5])/);
          const tone = toneMatch ? parseInt(toneMatch[1],10) : 5;
          base = base.replace(/[1-5]/g, '');
          if (tone===5) return base; // neutral, nothing to accent
          // choose vowel to accent
          const lower = base.toLowerCase();
          const pickIndex = () => {
            const pri = ['a','e','o'];
            for (const v of pri) {
              const idx = lower.indexOf(v);
              if (idx !== -1) return idx;
            }
            // handle iu/ui rule: accent second vowel
            if (lower.includes('iu')) return lower.indexOf('u');
            if (lower.includes('ui')) return lower.indexOf('i');
            // else mark first occurrence among i/u/ü
            for (let i=0;i<lower.length;i++) {
              if ('iuü'.includes(lower[i])) return i;
            }
            return -1;
          };
          const idx = pickIndex();
          if (idx === -1) return base; // nothing to accent
          const ch = base[idx];
          const lowerCh = ch.toLowerCase();
          const table = toneMap[lowerCh];
          if (!table) return base;
          const marked = table[tone-1];
          const finalChar = (ch === ch.toUpperCase()) ? marked.toUpperCase() : marked;
          return base.slice(0, idx) + finalChar + base.slice(idx+1);
        };

        if (opts.preserveSpaces) {
          // Split preserving whitespace tokens and rejoin 1:1
          return val.split(/(\s+)/).map(tok => (tok.trim() === '' ? tok : convertSyllable(tok))).join('');
        } else {
          // Normalize spacing to single spaces
          return val.split(/\s+/).map(convertSyllable).join(' ').trim();
        }
      } catch(e) {
        return val;
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
    // Touch swipe navigation for mobile
    onTouchStart(e) {
      if (!this.isVisible) return;
      const t = e.changedTouches ? e.changedTouches[0] : (e.touches ? e.touches[0] : null);
      if (!t) return;
      this.touchStartX = this.touchLastX = t.clientX;
      this.touchStartY = this.touchLastY = t.clientY;
      this.touchStartTime = Date.now();
      this.isSwiping = true;
    },
    onTouchMove(e) {
      if (!this.isSwiping) return;
      const t = e.changedTouches ? e.changedTouches[0] : (e.touches ? e.touches[0] : null);
      if (!t) return;
      this.touchLastX = t.clientX;
      this.touchLastY = t.clientY;
      const dx = this.touchLastX - this.touchStartX;
      const dy = this.touchLastY - this.touchStartY;
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal intent: prevent vertical scroll and show hint briefly
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        this.swipeHintVisible = true;
        this.swipeHintDirection = dx < 0 ? 'right' : 'left';
        if (this.swipeHintTimer) clearTimeout(this.swipeHintTimer);
        this.swipeHintTimer = setTimeout(() => {
          this.swipeHintVisible = false;
          this.swipeHintTimer = null;
        }, 250);
        // Also briefly show directional gradient to indicate swipe
        this.swipeDimVisible = true;
        this.swipeDimDirection = (dx < 0 ? 'right' : 'left');
        if (this.swipeDimTimer) clearTimeout(this.swipeDimTimer);
        this.swipeDimTimer = setTimeout(() => {
          this.swipeDimVisible = false;
          this.swipeDimTimer = null;
        }, 200);
      } else {
        this.swipeHintVisible = false;
        if (this.swipeHintTimer) {
          clearTimeout(this.swipeHintTimer);
          this.swipeHintTimer = null;
        }
        if (this.swipeDimTimer) {
          clearTimeout(this.swipeDimTimer);
          this.swipeDimTimer = null;
        }
        this.swipeDimVisible = false;
      }
    },
    onTouchEnd() {
      if (!this.isSwiping) return;
      this.isSwiping = false;
      const dx = this.touchLastX - this.touchStartX;
      const dy = this.touchLastY - this.touchStartY;
      const dt = Date.now() - this.touchStartTime;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      // Horizontal swipe threshold: >50px, faster than 800ms, and predominately horizontal
      if (absDx > 50 && absDx > absDy && dt < 800) {
        if (!this.navList || this.navList.length === 0) return;
        if (dx < 0) {
          // Swipe left -> next
          this.$store.dispatch('cardModal/navigateNext');
        } else {
          // Swipe right -> prev
          this.$store.dispatch('cardModal/navigatePrev');
        }
      }
      this.swipeHintVisible = false;
      if (this.swipeHintTimer) {
        clearTimeout(this.swipeHintTimer);
        this.swipeHintTimer = null;
      }
      if (this.swipeDimTimer) {
        clearTimeout(this.swipeDimTimer);
        this.swipeDimTimer = null;
      }
      this.swipeDimVisible = false;
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

        // In production, ensure store reflects server state to avoid stale overwrites
        // Fetch fresh custom dictionary data; if backend is slightly delayed, retry once
        const refresh = () => this.$store.dispatch('fetchCustomDictionaryData').catch(() => {});
        refresh();
        setTimeout(refresh, 350);
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


.custom-edit-overlay-inside {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--overlay-background);
  z-index: 500;
}
.custom-edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-background);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}


.custom-edit-modal {
  background: var(--bg);
  padding: 1rem 1.25rem;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}
.custom-edit-modal .edit-input {
  width: 100%;
  background: transparent;
  color: var(--fg);
  border: none;
  outline: none;
  padding: 0.75rem 0;
  font-size: 1rem;
}
.custom-edit-modal .pinyin-input { font-style: italic; }
.custom-edit-modal .english-input { font-style: normal; }
.custom-edit-modal .edit-input + .edit-input {
  border-top: 1px dashed color-mix(in oklab, var(--fg) 35%, var(--bg) 75%);
}



.modal {
  position: relative;
  position: fixed;
  height: 90vh;
  max-height: 90vh;
  aspect-ratio: .75;
  border: var(--modal-border-width) solid var(--fg);
  box-shadow: var(--card-shadow);
  background: var(--modal-bg);
  background-color: var(--modal-bg);
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
  touch-action: pan-y; /* allow vertical scroll by default; JS prevents during horizontal swipe */
  transition: background-color 150ms ease-in-out, filter 150ms ease-in-out;
}

/* (removed duplicate absolute overlay; using sticky version below) */

.modal::-webkit-scrollbar {
  width: 0;
  height: 0;
}


.main-def-flex {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

.main-def-text {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1 1 auto;
}

.main-pinyin {
  font-size: 1.3rem;
}

.def-nav {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.def-btn {
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 80%);
  background: color-mix(in oklab, var(--bg) 90%, var(--fg) 10%);
  color: var(--fg);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  min-width: 2rem;
  text-align: center;
}

.def-counter {
  font-size: 0.9rem;
  opacity: 0.75;
}

.main-def-flex {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

.main-def-text {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1 1 auto;
}

.main-pinyin {
  font-size: 1.3rem;
}

.def-nav {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.def-btn {
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 80%);
  background: color-mix(in oklab, var(--bg) 90%, var(--fg) 10%);
  color: var(--fg);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  min-width: 2rem;
  text-align: center;
}

.def-counter {
  font-size: 0.9rem;
  opacity: 0.75;
}

.english-idx { margin-right: 0.35rem; opacity: 0.8; }
.english-text { display: inline; }
.hanzi-link { color: var(--primary-primary); cursor: pointer; }
.hanzi-link:hover { text-decoration: underline; }
.main-word-section {
  margin-bottom: 0rem;
  display: flex;
  flex-direction: column;
  text-align: left;
  align-items: left;
  width: 100%;
}

.main-word {
  font-size: calc(5rem * var(--main-word-scale, 1) * var(--main-word-len-scale, 1));
  margin: 0.1em 0 0.2em 0;
  line-height: 1;
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.35em;
  flex-wrap: nowrap;
  overflow: hidden;
}

.main-word-line {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-word-trad {
  display: inline-flex;
  gap: 0.2rem;
  align-items: baseline;
  white-space: nowrap;
}

.trad-bracket {
  opacity: 0.7;
  font-size: 0.85em;
}

.trad-char {
  font-size: 0.85em;
  opacity: 0.75;
}

.main-word-char {
  font-family: var(--main-word-font, "Noto Serif SC", "Kaiti", sans-serif);
  font-weight: 400;
  display: inline-flex;
  width: 1em;
  height: 1.1em;
  line-height: 1em;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

.main-word-inverted {
  transition: filter 150ms ease-out opacity 150ms ease-out, transform 150ms ease-out;
  filter: invert(0);
}

.main-word-inverted.mleft {
}

.main-word-inverted.mright {
}




.minor-character {
  font-size: 2.5rem;
  font-family: 'Noto Sans SC';
}

.main-pinyin {
  font-size: 1.2rem;
  /*margin-top: 1em;*/
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


.custom-edit-wrap {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}
.custom-edit-btn {
  background: none;
  border: 1px solid color-mix(in oklab, var(--fg) 25%, var(--bg) 80%);
  color: var(--fg);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
}
.custom-edit-btn:hover {
  background: color-mix(in oklab, var(--fg) 10%, var(--bg) 85%);
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
  font-family: var(--main-word-font, "Noto Serif SC", "Kaiti", sans-serif);

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
  font-family: var(--main-word-font, "Noto Serif SC", "Kaiti", sans-serif);
}

.breakdown-section {
  border-top: 2px dashed color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  padding-top: 1.0rem;
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
  font-family: var(--main-word-font, "Noto Serif SC", "Kaiti", sans-serif);
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}


.custom-edit-wrap {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}
.custom-edit-btn {
  background: none;
  border: 1px solid color-mix(in oklab, var(--fg) 25%, var(--bg) 80%);
  color: var(--fg);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
}
.custom-edit-btn:hover {
  background: color-mix(in oklab, var(--fg) 10%, var(--bg) 85%);
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


.custom-edit-wrap {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}
.custom-edit-btn {
  background: none;
  border: 1px solid color-mix(in oklab, var(--fg) 25%, var(--bg) 80%);
  color: var(--fg);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
}
.custom-edit-btn:hover {
  background: color-mix(in oklab, var(--fg) 10%, var(--bg) 85%);
}

.swipe-hint {
  position: sticky;
  top: 5%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2.5rem;
  color: var(--fg);
  padding: 0.2rem 0.5rem;
  pointer-events: none;
  user-select: none;
  opacity: 0;
  transition: opacity 150ms ease-in-out;
  z-index: 6;
}

.swipe-hint.visible { opacity: 0.0; }

.modal.invert { filter: invert(0.14); }
[data-theme='dark'] .modal.invert,
[data-theme='theme2'] .modal.invert { filter: invert(0.06); }

/*.modal.invert.mleft { transform: translateX(2%) rotate(2deg);}
.modal.invert.mright { transform: translateX(-2%) rotate(-2deg);}*/


.history-controls {
  position: absolute;
  top: 1rem;
  left: 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  z-index: 6;
}

.history-btn-wrap {
  display: flex;
  gap: 0.3rem;
  align-items: flex-start;
}

.back-btn,
.history-btn {
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 15%, var(--bg) 75%);
  background: color-mix(in oklab, var(--bg) 90%, var(--fg) 10%);
  color: var(--fg);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 0.9rem;
}

.history-btn {
  font-size: 1.0rem;
  padding: 0.65rem 0.85rem;
}

.history-menu {
  position: absolute;
  top: 3.1rem;
  left: 0;
  background: var(--modal-bg);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 80%);
  padding: 0.25rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
  z-index: 7;
  max-width: 8rem;
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  border: none;
  background: color-mix(in oklab, var(--bg) 95%, var(--fg) 5%);
  color: var(--fg);
  text-align: left;
  padding: 0.25rem 0.5rem;
  width: 100%;
  cursor: pointer;
  font-family: var(--main-word-font, 'Noto Serif SC', 'Kaiti', serif);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
}

.history-idx {
  flex: 0 0 auto;
}

.history-entry {
  flex: 1 1 auto;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item.active {
  background: color-mix(in oklab, var(--fg) 10%, var(--bg) 90%);
}



.tabs {
  display: flex;
  gap: 0.5rem;
  margin-top: 0;
  margin-bottom: 1rem;
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-bottom: 1.5px solid color-mix(in oklab, var(--fg) 55%, var(--bg) 50%);
  border: none;
  position: relative;
  overflow: visible;
}

.tab-btn {
  position: relative;
  font-size: 1.5rem;
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-weight: 400;
  color: var(--primary-primary);
  white-space: nowrap;
  opacity: 0.35;
  border: 3.5px solid #0000;
  border: none;
  background: #0000;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  border-bottom: 3.5px solid #0000;
  border-bottom: none;
  transform: translate(0, 3.5px);
}

.tab-open-word {
  position: absolute;
  top: 0rem;
  font-size: 0.95rem;
  opacity: 0.75;
  cursor: pointer;
  color: var(--fg);
}

.tab-btn.active {
  background: color-mix(in srgb, var(--fg), var(--bg) 95%);
  opacity: .8;
  z-index: 2;
  transform: translate(0, 3.5px);
}

.char-details {
  display: grid;
  gap: 0.6rem;
  width: 100%;
  min-width: 0;
}

.detail-toggle-row {
  display: flex;
  gap: 0.35rem;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  font-size: 0.9rem;
  justify-content: space-between;
}

.detail-toggle {
  padding: 0.35rem 0.75rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.detail-toggle.disabled {
  opacity: 0.35;
  pointer-events: none;
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
  flex-direction: column;
}

.freq-trad {
  display: flex;
  flex-direction: column;
  flex: 2;
  background-color: color-mix(in oklab, var(--fg) 3%, var(--bg) 100%);
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
  justify-content: center;
  align-items: center;
  margin-left: auto;
  margin-right: auto;
  margin-top: 1em;
  line-height: 1;
  width: 45%;
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
  right: 1rem;
  z-index: 30;
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

.back-btn {
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  color: var(--fg);
  border: none;
  padding: 0.5rem 1rem;
  font-size: .9rem;
  cursor: pointer;
  aspect-ratio: 1;
}


.dropdown-content {
  position: absolute;
  top: 2.5rem;
  right: 0;
  background-color: var(--bg);
  border: 1px solid var(--fg);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 80%);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 200px;
}

.wordlist-item {
  font-size: .9rem;
  padding: 0.5rem;
  margin: 0.25rem;
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
  font-size: 1.0rem;
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
  align-items: flex-start;
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
  justify-content: left;
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
  font-family: var(--main-word-font, "Noto Serif SC", "Kaiti", serif);
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
  font-family: var(--main-word-font, "Noto Serif SC", "Kaiti", sans-serif);

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

.custom-edit-overlay .modal-content {
  background: var(--bg-alt);
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}
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
  color: var(--fg);
  background: none;
  opacity: 0.8;
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
  font-family: var(--main-word-font, "Noto Serif SC", "Kaiti", sans-serif);
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

    /*.modal.invert { filter: invert(0.24); }
    .modal.invert.mleft { transform: translate(-48%, -50%) rotate(2deg);}
    .modal.invert.mright { transform: translate(-52%, -50%) rotate(-2deg);}
    */
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

    /*.modal.invert { filter: invert(0.24); }
    .modal.invert.mleft { transform: translate(2%, 0%) rotate(2deg);}
    .modal.invert.mright { transform: translate(-2%, 0%) rotate(-2deg);}
    */

    .wordlist-dropdown {
      position: fixed;
      top: 3em;
      left: 1rem;
    }

    .main-word {
      /*margin-top: 3rem;*/
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