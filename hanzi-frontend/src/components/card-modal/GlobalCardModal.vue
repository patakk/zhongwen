<template>
  <div v-if="isVisible || pageMode" :class="['global-modal-container', { 'page-mode-container': pageMode }]" @click="closeModal">
    <!--<div :class="['card-modal-overlay', { 'page-mode-overlay': pageMode }]" @click="closeModal">-->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <div class="spinner-label">Loading...</div>
      </div>

      <div
        v-if="isLoading"
        class="modal"
      ></div>

      <div
        v-else
        :class="['modal', 'card-modal', { invert: swipeDimVisible }, { mleft: swipeHintDirection === 'left' }, { mright: swipeHintDirection === 'right' }]"
        @click.stop="handleModalClick"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >

        <!-- Add to wordlist dropdown button - now shown to all users -->
        <button @click="closeModal" class="close-btn-tl">
          <span class="x-centered">×</span>
        </button>
        <button @click.stop="toggleWordlistDropdown" class="wordlist-btn" ref="dropdownButton">
          <span class="x-centered">+</span>
        </button>
        <div class="wordlist-dropdown" @click.stop>
          <DeckSelector
            mode="action"
            :is-open="showWordlistDropdown"
            :is-logged-in="isLoggedIn"
            :decks="customWordlists"
            :show-create-new="true"
            :search-threshold="5"
            @select="addWordToList"
            @create-new="showCreateListModal = true; showWordlistDropdown = false"
            @close="showWordlistDropdown = false"
          />
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
                v-if="cardData.character.length > 1"
                v-for="(char, index) in cardData.character.split('')"
                @click="setActiveChar(char)"
              >

                  <PreloadWrapper
                        :character="char"
                        :showBubbles="false"
                        class="hanzi-link main-word-char"
                        v-html="colorizeHanzi(char, getDisplaySyllable(index))"
                      >
                </PreloadWrapper>
              </span>

              <span
                v-else
                v-for="(char, index) in cardData.character.split('')"
                :class="['main-word-char main-word-char-single']"
                @click="setActiveChar(char)"
              >
                  <span
                    class="main-word-char"
                    v-html="colorizeHanzi(char, getDisplaySyllable(index))"
                  ></span>
              </span>

              <span v-if="showTraditionalLine" class="main-word-trad">
                <span class="trad-bracket">[</span>

                <span
                  v-for="(tchar, index) in traditionalChars"
                >
                  <PreloadWrapper
                      v-if="tchar !== '-'"
                        :character="tchar"
                        :showBubbles="false"
                        class="hanzi-link trad-char"
                      >
                    <span
                      class="hanzi-link trad-char"
                      v-html="colorizeHanzi(tchar, getDisplaySyllable(index))"
                    ></span>
                </PreloadWrapper>
                  <span v-else class="trad-char main-word-char" style="opacity: 0.35;">-</span>
                </span>
                <span class="trad-bracket">]</span>
              </span>
            </div>
          </div>
          <!-- <div class="minor-character">{{ cardData.character }}</div> -->

          <div class="main-def-flex">
            <div class="main-def-text">
              <div class="main-pinyin-row">
                <div class="main-pinyin" v-html="colorizePinyin($toAccentedPinyin(displayPinyin || ''))"></div>
                <button
                  class="audio-btn"
                  :disabled="!!audioBusy['main'] || !cardData.character || !displayPinyin"
                  @click.stop="playAudio"
                  :aria-busy="!!audioBusy['main']"
                  title="Play pronunciation"
                >
                  <font-awesome-icon :icon="faVolumeHigh" />
                </button>
              </div>
              <div class="main-english-row">
                <div class="main-english">
                  <div v-for="(item, index) in displayEnglish" :key="index" class="english-item">
                    <span class="english-idx">{{ index + 1 }}.</span>
                    <span class="english-text">
                      <template v-for="(tok, tIdx) in tokenizeHanziText(item)" :key="tIdx">
                        <span v-if="tok.isHanzi" class="hanzi-link" @click.stop="openCharAsWord(tok.text)">{{ tok.text }}</span>
                        <span v-else>{{ $toAccentedPinyin(tok.text) }}</span>
                      </template>
                    </span>
                  </div>
                </div>
                <div class="custom-edit-wrap">
                  <button class="custom-edit-btn" @click.stop="openCustomEdit" title="Edit pinyin & english">
                    <font-awesome-icon :icon="faPencil" />
                  </button>
                </div>
              </div>
            </div>
            <div v-if="defCount > 1" class="def-nav">
              <button class="def-btn" @click="stepDefinition(-1)">‹</button>
              <span class="def-counter">{{ (mainDefIndex % defCount) + 1 }}/{{ defCount }}</span>
              <button class="def-btn" @click="stepDefinition(1)">›</button>
            </div>
          </div>
      

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
                <div class="concept-character" :style="{ fontFamily: ['var(--main-word-font)', 'Noto Sans SC'] }">{{ item.character }}</div>
                <div class="concept-pinyin">{{ item.pinyin && item.pinyin.length > 0 ? $toAccentedPinyin(item.pinyin[0]) : '' }}</div>
                <div class="concept-english">{{ $toAccentedPinyin(item.english && item.english.length > 0 ? item.english[0].split('/')[0] : '') }}</div>
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
                <div class="concept-character" :style="{ fontFamily: ['var(--main-word-font)', 'Noto Sans SC'] }">{{ item.character }}</div>
                <div class="concept-pinyin">{{ item.pinyin && item.pinyin.length > 0 ? $toAccentedPinyin(item.pinyin[0]) : '' }}</div>
                <div class="concept-english">{{ $toAccentedPinyin(item.english && item.english.length > 0 ? item.english[0].split('/')[0] : '') }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Character breakdown section -->
        <div class="breakdown-section" v-if="cardData.chars_breakdown">

          <!-- Multi-char: examples + strokes tabs -->
          <template v-if="cardData.character.length > 1">
            <div class="tab-content">
              <div class="char-details">
                <div class="detail-toggle-row">
                  <div
                    class="concept-toggle detail-toggle"
                    :class="{ active: multiCharTab === 'examples', disabled: !hasTatoebaExamples }"
                    @click="multiCharTab = 'examples'"
                  >examples</div>
                  <div
                    class="concept-toggle detail-toggle"
                    :class="{ active: multiCharTab === 'strokes', disabled: !hasMultiCharStrokes }"
                    @click="multiCharTab = 'strokes'"
                  >strokes</div>
                </div>

                <div v-if="multiCharTab === 'examples' && hasTatoebaExamples">
                  <div class="examples-list" style="margin-top:0.5em">
                    <div v-for="(ex, idx) in formattedExamples" :key="idx" class="example-sentence">
                      <div class="ex-chinese">{{ ex.hanzi }}</div>
                      <div class="ex-pinyin">{{ $toAccentedPinyin(ex.pinyin).charAt(0).toUpperCase() + $toAccentedPinyin(ex.pinyin).slice(1) }}</div>
                      <div class="ex-english">{{ ex.english }}</div>
                    </div>
                  </div>
                  <div class="examples-nav" v-if="!(examplesIsLast && examplesPage === 1)">
                    <div class="concept-toggle examples-nav-btn" :class="{ disabled: examplesLoading || examplesPage === 1 }" @click="examplesPage === 1 || examplesLoading ? null : prevExamples()">← Prev</div>
                    <div class="examples-page-indicator">Page {{ examplesPage }}</div>
                    <div class="concept-toggle examples-nav-btn" :class="{ disabled: examplesLoading || examplesIsLast }" @click="examplesIsLast || examplesLoading ? null : nextExamples()">Next →</div>
                  </div>
                </div>

                <div v-if="multiCharTab === 'strokes'" class="strokes-section">
                  <div class="medium-label">Strokes ({{ validChars[multiCharStrokeIndex] }})</div>
                  <div v-if="multiCharStrokeData && multiCharStrokeData.strokes" class="hanzi-anim-wrap">
                    <button class="stroke-char-btn stroke-char-left" :disabled="multiCharStrokeIndex === 0" @click="multiCharStrokeIndex--">«</button>
                    <div class="hanzi-anim">
                      <AnimatedHanzi
                        ref="hanziAnim"
                        :character="multiCharStrokeData.character"
                        :strokes="multiCharStrokeData.strokes"
                        :animatable="true"
                        :drawThin="false"
                        :animSpeed="0.1"
                        @step-change="onStepChange"
                      />
                    </div>
                    <button class="stroke-char-btn stroke-char-right" :disabled="multiCharStrokeIndex >= validChars.length - 1" @click="multiCharStrokeIndex++">»</button>
                    <div class="hanzi-anim-controls">
                      <div class="anim-btn" @click="playStrokeAnimation">Play</div>
                      <div class="anim-btn" @click="stepStroke">></div>
                      <div class="stroke-counter">{{ strokeCounter }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Single-char: detail tabs -->
          <template v-else>
            <div class="tab-content" v-if="activeCharData">
              <div class="char-details">

                <div class="detail-toggle-row">
                  <div
                    class="concept-toggle detail-toggle"
                    :class="{ active: activeDetailTab === 'tatoeba', disabled: !hasTatoebaExamples }"
                    @click="setDetailTab('tatoeba')"
                  >examples</div>
                  <div
                    class="concept-toggle detail-toggle"
                    :class="{ active: activeDetailTab === 'strokes', disabled: !hasStrokes }"
                    @click="setDetailTab('strokes')"
                  >strokes</div>
                  <div
                    class="concept-toggle detail-toggle"
                    :class="{ active: activeDetailTab === 'examples', disabled: !hasExamples }"
                    @click="setDetailTab('examples')"
                  >words</div>
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
                  <div
                    class="concept-toggle detail-toggle"
                    :class="{ active: activeDetailTab === 'extra', disabled: !hasExtraInfo }"
                    @click="setDetailTab('extra')"
                  >extra</div>
                </div>

                <!-- Tatoeba examples tab -->
                <div v-if="activeDetailTab === 'tatoeba' && hasTatoebaExamples">
                  <div class="examples-list" style="margin-top:0.5em">
                    <div v-for="(ex, idx) in formattedExamples" :key="idx" class="example-sentence">
                      <div class="ex-chinese">{{ ex.hanzi }}</div>
                      <div class="ex-pinyin">{{ $toAccentedPinyin(ex.pinyin).charAt(0).toUpperCase() + $toAccentedPinyin(ex.pinyin).slice(1) }}</div>
                      <div class="ex-english">{{ ex.english }}</div>
                    </div>
                  </div>
                  <div class="examples-nav" v-if="!(examplesIsLast && examplesPage === 1)">
                    <div class="concept-toggle examples-nav-btn" :class="{ disabled: examplesLoading || examplesPage === 1 }" @click="examplesPage === 1 || examplesLoading ? null : prevExamples()">← Prev</div>
                    <div class="examples-page-indicator">Page {{ examplesPage }}</div>
                    <div class="concept-toggle examples-nav-btn" :class="{ disabled: examplesLoading || examplesIsLast }" @click="examplesIsLast || examplesLoading ? null : nextExamples()">Next →</div>
                  </div>
                </div>

                <div v-if="activeDetailTab === 'strokes' && hasStrokes" class="strokes-section">
                  <div class="medium-label">Strokes:</div>
                  <div class="hanzi-anim-wrap">
                    <div class="hanzi-anim">
                      <AnimatedHanzi
                        ref="hanziAnim"
                        :character="activeCharData.character"
                        :strokes="activeCharData.strokes"
                        :animatable="true"
                        :drawThin="false"
                        :animSpeed="0.1"
                        @step-change="onStepChange"
                      />
                    </div>
                    <div class="hanzi-anim-controls">
                      <div class="anim-btn" @click="playStrokeAnimation">Play</div>
                      <div class="anim-btn" @click="stepStroke">></div>
                      <div class="stroke-counter">{{ strokeCounter }}</div>
                    </div>
                  </div>
                </div>

                <div v-if="activeDetailTab === 'examples' && hasExamples" class="medium-label">Words containing {{ activeChar }}:</div>
                <ExpandableExamples
                  v-if="activeDetailTab === 'examples' && hasExamples"
                  :itemCount="activeCharData.example_words.length"
                  :thresholdForExpand="3"
                  ref="examplesComponent">
                  <template v-slot:afew="slotProps">
                    <div class="example-words first-words" :class="{ 'collapsed-words': !slotProps.isExpanded }">
                      <ClickableRow
                        v-for="(word, index) in activeCharData.example_words.slice(0, 3)"
                        :key="index"
                        :word="word"
                        :class="{ therest: !slotProps.isExpanded }"
                      >
                        <template #default>
                          <div class="example-chinese-pinyin">
                            <span class="word-hanzi" v-html="colorizeHanzi(word, $toAccentedPinyin(activeCharData.pinyin[index]))"></span>
                            <span class="word-pinyin" v-html="colorizePinyin($toAccentedPinyin(activeCharData.pinyin[index]))"></span>
                          </div>
                          <div class="word-english-list">
                            <span v-for="(m, mIdx) in splitMeaning(activeCharData.english[index])" :key="mIdx" class="word-english-item">{{ mIdx + 1 }}. {{ m }}</span>
                          </div>
                        </template>
                      </ClickableRow>
                    </div>
                  </template>
                  <template v-slot:therest="slotProps">
                    <div class="example-words rest-words">
                      <ClickableRow v-for="(word, index) in activeCharData.example_words.slice(3)" :key="index + 3" :word="word" class="therest">
                        <template #default>
                          <div class="example-chinese-pinyin">
                            <span class="word-hanzi" v-html="colorizeHanzi(word, $toAccentedPinyin(activeCharData.pinyin[index + 3]))"></span>
                            <span class="word-pinyin" v-html="colorizePinyin($toAccentedPinyin(activeCharData.pinyin[index + 3]))"></span>
                          </div>
                          <div class="word-english-list">
                            <span v-for="(m, mIdx) in splitMeaning(activeCharData.english[index + 3])" :key="mIdx" class="word-english-item">{{ mIdx + 1 }}. {{ m }}</span>
                          </div>
                        </template>
                      </ClickableRow>
                    </div>
                  </template>
                </ExpandableExamples>

                <div v-if="activeDetailTab === 'present' && hasPresentIn" class="medium-label">{{ activeChar }} Present in:</div>
                <div v-if="activeDetailTab === 'present' && hasPresentIn" class="present-in-section">
                  <div class="present-in-chars" style="display: flex; flex-wrap: wrap;">
                    <PreloadWrapper v-for="char in limitedPresentInChars" :key="char" :character="char" :showBubbles="false" class="present-in-char hanzi-link">{{ char }}</PreloadWrapper>
                    <span v-if="hasMorePresentInChars" class="more-chars" @click="loadMorePresentInChars" :class="{ 'loading': isLoadingMoreChars }">+</span>
                  </div>
                </div>

                <div v-if="activeDetailTab === 'decomp' && hasDecomposition">
                  <div class="medium-label">Decomposition:</div>
                </div>
                <div v-if="activeDetailTab === 'decomp' && hasDecomposition">
                  <div v-if="activeChar && decompositionData && decompositionData[activeChar] && decompositionData[activeChar].recursive && Object.keys(decompositionData[activeChar].recursive).length > 0">
                    <div class="decomp-section">
                      <RecursiveDecomposition :data="{ [activeChar]: decompositionData[activeChar].recursive }" />
                    </div>
                  </div>
                </div>

                <div v-if="activeDetailTab === 'extra' && hasExtraInfo" class="extra-info-section">
                  <div class="medium-label">Extra:</div>
                </div>
                <div v-if="activeDetailTab === 'extra' && hasExtraInfo" class="extra-info-section">
                  <div class="extra-info-details">
                    <div v-if="activeCharData.radical" class="extra-info-item"><span class="basic-label">Radical:</span> {{ activeCharData.radical }}</div>
                    <div v-if="activeCharData.rank" class="extra-info-item"><span class="basic-label">Frequency Rank:</span> {{ activeCharData.rank }}</div>
                    <div v-if="activeCharData.similars && !(typeof activeCharData.similars === 'object' && Object.keys(activeCharData.similars).length === 0)" class="extra-info-item">
                      <span class="basic-label">Similars:</span>
                      <span class="similars-list"><span v-for="(simChar, sIdx) in similarsChars" :key="sIdx" class="hanzi-link similar-link" @click.stop="openCharAsWord(simChar)">{{ simChar }}</span></span>
                    </div>
                    <div v-if="activeCharData.grade_level" class="extra-info-item"><span class="basic-label">Grade Level:</span> {{ activeCharData.grade_level }}</div>
                    <div class="extra-info-item">
                      <span class="basic-label">Alternate fonts:</span>
                      <div class="extra-fonts"><div v-for="font in alternateFontOptions" :key="font.key" class="extra-font-item" :class="font.className">{{ font.char }}</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

      <!-- Custom definition edit modal -->
      <div v-if="showCustomEditModal" class="custom-edit-overlay" @mousedown.self="cancelCustomEdit">
        <div class="custom-edit-modal" @click.stop>
          <div class="edit-hanzi-label">{{ editHanzi }}</div>
          <div
            v-for="(_, i) in editEnglishList"
            :key="i"
            class="edit-pronunciation-row"
          >
            <div v-if="editPinyinList[i]" class="edit-pinyin-label">{{ $toAccentedPinyin(editPinyinList[i]) }}</div>
            <input
              class="edit-input english-input"
              type="text"
              v-model="editEnglishList[i]"
              @keydown.stop="onEditKeydown"
              :placeholder="editEnglishList.length > 1 ? `english (${i + 1})` : 'english'"
              autocomplete="off"
            />
          </div>
          <div v-if="editError" class="modal-error">{{ editError }}</div>
          <div class="modal-buttons">
            <button class="cancel-button" @click="cancelCustomEdit">Cancel</button>
            <button class="confirm-button" @click="saveCustomEdit">Save</button>
          </div>
        </div>
      </div>
   <!--  </div> end modal -->
  </div> <!-- end overlay -->

  <!-- Fixed position close button at bottom right - only show in modal mode -->
  <button @click="closeModal" class="close-btn fixed-close"><span class="x-centered">×</span></button>

  <ToastNotification
    v-model:visible="notificationVisible"
    :message="notificationMessage"
    :type="notificationType"
    position="bottom-right"
  />

  <!-- Add Create New List modal -->
  <div v-if="showCreateListModal" class="create-list-modal-overlay" @mousedown.self="closeCreateListModal">
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
import { defineAsyncComponent } from 'vue';
import ExpandableExamples from './ExpandableExamples.vue'
import ClickableRow from './ClickableRow.vue'
import ToastNotification from '../shared/ToastNotification.vue'
import RecursiveDecomposition from './RecursiveDecomposition.vue'
import PreloadWrapper from '../shared/PreloadWrapper.vue'
import DeckSelector from '../forms/DeckSelector.vue'
import { mapGetters, mapActions } from 'vuex'
import { colorizeHanzi as toneColorizeHanzi, colorizePinyin as toneColorizePinyin } from '../../lib/toneColorizer'
import { faVolumeHigh, faPencil } from '@/icons'



export default {
    setup() {
    return {
      faVolumeHigh,
      faPencil
    }
  },
  components: {
    ExpandableExamples,
    ClickableRow,
    AnimatedHanzi: defineAsyncComponent(() => import('./AnimatedHanzi.vue')),
    ToastNotification,
    RecursiveDecomposition,
    PreloadWrapper,
    DeckSelector
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
      editPinyinList: [],
      editEnglishList: [],
      editError: '',
      // Examples pagination state
      examplesPage: 1,
      examplesIsLast: false,
      examplesLoading: false,
      fetchedExamples: {},
      // Local font cycling state for main word
      fontOrder: ['kaiti', 'noto-sans', 'noto-serif'],
      fontCycleIndex: 0,
      activeDetailTab: 'strokes',
      multiCharTab: 'examples',
      multiCharStrokeIndex: 0,
      mainDefIndex: 0,
      strokeCounter: '0/0',
      audioBusy: {}
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
    toneColorEnabled() {
      try { return this.$store.getters['theme/isToneColorEnabled'] !== false; } catch (e) { return true; }
    },
    toneColorScheme() {
      try { return this.$store.getters['theme/getToneColorScheme'] || 'default'; } catch (e) { return 'default'; }
    },
    currentFontKey() {
      try { return this.$store.getters['theme/getCurrentFont'] || 'noto-serif'; } catch(e) { return 'noto-serif'; }
    },
    alternateFontOptions() {
      const displayChar = this.activeChar || (this.cardData && this.cardData.character) || ''
      const options = [
        { key: 'kaiti', className: 'font-kaiti' },
        { key: 'noto-sans', className: 'font-noto-sans' },
        { key: 'noto-serif', className: 'font-noto-serif' },
        { key: 'fusion-pixel', className: 'font-fusion-pixel' },
      ];
      const current = this.currentFontKey || 'noto-serif';
      return options
        .filter(o => o.key !== current)
        .map(o => ({ ...o, char: displayChar || ' ' }));
    },
    mainWordFontStyle() {
      const families = {
        'kaiti': "'Kaiti','STKaiti','Kai','楷体',serif",
        'noto-sans': "'Noto Sans SC','Noto Sans CJK SC','Source Han Sans SC','PingFang SC','Microsoft YaHei','WenQuanYi Micro Hei',sans-serif",
        'noto-serif': "'Noto Serif SC','Noto Serif CJK SC','Source Han Serif SC','Songti SC','SimSun',serif",
        'fusion-pixel': "'Fusion Pixel S', 'Fusion Pixel T'"
      };
      const key = this.currentFontKey;
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
        const parts = this.customDef.english.split('\x1F');
        const count = parts.length || 1;
        this.mainDefIndex = this.mainDefIndex % count;
        return count;
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
      let ppp = this.cardData.pinyin;
      if (Array.isArray(ppp)) {
        if (ppp.length === 1 && ppp[0] === "N/A" && this.cardData.character.length === 1) {
          ppp = this.cardData.chars_breakdown[this.cardData.character].pinyin;
        }
      }
      const custom = this.customDef && this.customDef.pinyin ? this.customDef.pinyin : '';
      if (custom) return custom;
      const list = (Array.isArray(ppp)) ? ppp : [];
      if (!list.length) return '';
      const idx = this.mainDefIndex % list.length;

      return list[idx] || '';
    },
    displayEnglish() {

      let ppp = this.cardData.english;
      if (Array.isArray(ppp)) {
        if (ppp.length === 1 && ppp[0] === "N/A" && this.cardData.character.length === 1) {
          ppp = this.cardData.chars_breakdown[this.cardData.character].english;
        }
      }
      const custom = this.customDef && this.customDef.english ? this.customDef.english : '';
      if (custom) {
        const parts = custom.split('\x1F');
        const idx = this.mainDefIndex % parts.length;
        const val = parts[idx];
        if (val) return this.splitMeaning(val);
      }
      const list = (this.cardData && Array.isArray(ppp)) ? ppp : [];
      if (!list.length) return [];
      const idx = this.mainDefIndex % list.length;
      const val = list[idx] || '';
      return this.splitMeaning(val);
    },
    hasDictSection() {
      return !!this.activeCharData;
    },
    hasTatoebaExamples() {
      if (!this.cardData) return false;
      const pList = this.cardData.pinyin || [];
      // Multi-pronunciation: check fetched data for current page
      if (pList.length > 1 && this.fetchedExamples[1]) {
        return this.fetchedExamples[1].length > 0;
      }
      return !!(Array.isArray(this.cardData.examples) && this.cardData.examples.length);
    },
    hasStrokes() {
      const s = this.activeCharData && this.activeCharData.strokes;
      return !!(s && s.medians && s.strokes);
    },
    hasMultiCharStrokes() {
      const s = this.firstCharData && this.firstCharData.strokes;
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
    hasExtraInfo() {
      const info = this.activeCharData;
      if (!info) return false;
      return !!(info.similars || info.radical || info.stroke_count || info.frequency_rank || info.grade_level || info.rank);
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
    validChars() {
      if (!this.cardData || !this.cardData.character) return [];
      return Array.from(new Set(this.cardData.character.split('').filter(char => /\p{Script=Han}/u.test(char))));
    },
    similarsChars() {
      const s = this.activeCharData.similars;
      if(!s) return [];
      const sa = Array.from(s);
      return sa;
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
      const pageData = this.fetchedExamples[this.examplesPage];
      const hasFetched = this.fetchedExamples[1] !== undefined;
      const useCardDefault = this.examplesPage === 1 && !hasFetched;
      const examples = Array.isArray(pageData)
        ? pageData
        : (useCardDefault && Array.isArray(this.cardData.examples) ? this.cardData.examples : []);
      try {
        return examples.map((ex) => {
          // DeepSeek format: { hanzi, pinyin, english }
          if (typeof ex.hanzi === 'string') {
            return { hanzi: ex.hanzi, pinyin: ex.pinyin || '', english: ex.english || '' };
          }
          // Old Tatoeba format: { cmn, pinyin, eng }
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
    firstCharData() {
      if (!this.cardData || !this.cardData.chars_breakdown || !this.validChars[0]) return null;
      return this.cardData.chars_breakdown[this.validChars[0]] || null;
    },
    multiCharStrokeData() {
      const idx = this.multiCharStrokeIndex;
      if (!this.cardData || !this.cardData.chars_breakdown || !this.validChars[idx]) return null;
      return this.cardData.chars_breakdown[this.validChars[idx]] || null;
    },
    mainPinyinMeaningPairs() {
      const data = this.activeCharData;
      if (!data) return [];
      const pList = Array.isArray(data.main_word_pinyin) ? data.main_word_pinyin : [];
      const eList = Array.isArray(data.main_word_english) ? data.main_word_english : [];
      const seen = new Set();
      const pairs = [];
      const duplicates = [];
      pList.forEach((p, idx) => {
        const eng = eList[idx] || '';
        const key = `${p}||${eng}`;
        if (seen.has(key)) {
          duplicates.push({ pinyin: p, english: eng, index: idx });
          return;
        }
        seen.add(key);
        pairs.push({ pinyin: p, english: eng });
      });
      return pairs;
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
          this.activeDetailTab = this.hasTatoebaExamples ? 'tatoeba' : 'strokes';
          this.multiCharStrokeIndex = 0;
          this.examplesPage = 1;
          this.examplesIsLast = !!newData.is_last;
          this.fetchedExamples = {};

          const overrides = this.displayOverrides;
          if (overrides) {
            const prefIdx = Number.isInteger(overrides.preferredIndex) ? overrides.preferredIndex : null;
            const idx = this.findPreferredDefIndex(newData, overrides.preferredPinyin, overrides.preferredEnglish, prefIdx);
            if (idx >= 0) this.mainDefIndex = idx;
          }

          if (this.$refs.examplesComponent) {
            this.$refs.examplesComponent.resetExpandedState();
          }
        }
      }
    },

    displayOverrides: {
      immediate: true,
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
          this.showCustomEditModal = false;
          if (this.isLoggedIn) {
            this.$store.dispatch('fetchCustomDefinition', newChar);
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
            this.activeDetailTab = this.hasTatoebaExamples ? 'tatoeba' : 'examples';
          } else if (this.activeDetailTab === 'tatoeba' && !this.hasTatoebaExamples) {
            this.activeDetailTab = 'strokes';
          } else if (this.activeDetailTab === 'examples' && !this.hasExamples) {
            this.activeDetailTab = this.hasTatoebaExamples ? 'tatoeba' : 'strokes';
          } else if (this.activeDetailTab === 'present' && !this.hasPresentIn) {
            this.activeDetailTab = this.hasTatoebaExamples ? 'tatoeba' : 'strokes';
          } else if (this.activeDetailTab === 'decomp' && !this.hasDecomposition) {
            this.activeDetailTab = this.hasTatoebaExamples ? 'tatoeba' : 'strokes';
          }
        }
      }
    },
    mainDefIndex() {
      const pList = this.cardData && this.cardData.pinyin;
      if (pList && pList.length > 1) {
        this.examplesPage = 1;
        this.examplesIsLast = false;
        this.fetchedExamples = {};
        this.loadExamplesPage(1);
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

    if (this.isVisible) {
      document.body.classList.remove('modal-open');
    }
    // Ensure edit modal is closed and cleared when card modal unmounts
    this.showCustomEditModal = false;
    this.editHanzi = '';
    this.editPinyinList = [];
    this.editEnglishList = [];
    this.editError = '';
  },
  methods: {
    ...mapActions({
      hideCardModal: 'cardModal/hideCardModal',
      showCardModal: 'cardModal/showCardModal',
      fetchCardData: 'cardModal/fetchCardData'
      // Removed fetchDecompositionData to prevent direct calls
    }),
    colorizeHanzi(hanzi, pinyin) {
      return toneColorizeHanzi(hanzi, pinyin, { enabled: this.toneColorEnabled, palette: this.toneColorScheme });
    },
    colorizePinyin(pinyin) {
      return toneColorizePinyin(pinyin, { enabled: this.toneColorEnabled, palette: this.toneColorScheme });
    },
    colorizePinyinForce(pinyin) {
      return toneColorizePinyin(pinyin, { enabled: true, palette: this.toneColorScheme });
    },
    async playAudio() {
      const word = (this.cardData && this.cardData.character) || '';
      if (!word) return;
      // Single characters always use the syllable library (matched to the current reading).
      if (word.length === 1) {
        const syl = this.normalizeSyllable(this.displayPinyin || '');
        if (syl) {
          await this.fetchAudio({ syllable: syl }, 'main');
          return;
        }
      }
      // Multi-character word: backend tries the word library first, falls back to
      // concatenating per-syllable clips using `pinyin` for words not in the library.
      const pinyin = (this.displayPinyin || '').trim();
      const params = pinyin ? { word, pinyin } : { word };
      await this.fetchAudio(params, 'main');
    },
    async playSinglePinyin(pinyin) {
      // Per-pinyin pair buttons always play the syllable audio for that specific reading.
      const syl = this.normalizeSyllable(pinyin);
      if (!syl) return;
      await this.fetchAudio({ syllable: syl }, pinyin);
    },
    normalizeSyllable(pinyin) {
      let s = (pinyin || '').trim().toLowerCase();
      if (!s) return '';
      s = s.split(/\s+/)[0] || '';
      return s.replace(/u:/g, 'v').replace(/ü/g, 'v');
    },
    async fetchAudio(params, key) {
      const busyKey = key || 'audio';
      if (this.audioBusy[busyKey]) return;
      this.audioBusy = { ...this.audioBusy, [busyKey]: true };
      const urlParams = new URLSearchParams();
      for (const [k, v] of Object.entries(params || {})) {
        if (v) urlParams.set(k, v);
      }
      try {
        const res = await fetch(`/api/get_audio?${urlParams.toString()}`);
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 0) {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            const cleanup = () => URL.revokeObjectURL(url);
            audio.addEventListener('ended', cleanup, { once: true });
            audio.addEventListener('pause', cleanup, { once: true });
            await audio.play().catch(() => cleanup());
          }
        }
      } catch (e) {
        console.error('Audio playback failed', e);
      } finally {
        const { [busyKey]: _remove, ...rest } = this.audioBusy || {};
        this.audioBusy = rest;
      }
    },
    getDisplaySyllable(idx) {
      const accented = this.$toAccentedPinyin(this.displayPinyin || '').trim();
      if (!accented) return '';
      const syllables = accented.split(/\s+/).filter(Boolean);
      if (!syllables.length) return '';
      if (idx < syllables.length) return syllables[idx];
      return syllables[syllables.length - 1];
    },

    onStepChange(payload) {
      const total = (payload && payload.total) ? payload.total : 0;
      const current = (payload && payload.current) ? payload.current : 0;
      this.strokeCounter = total ? `${(current-1+total)%total+1}/${total}` : '0/0';
    },

    playStrokeAnimation() {
      const ref = this.$refs.hanziAnim;
      if (ref && ref.playAnimation) ref.playAnimation();
    },
    stepStroke() {
      const ref = this.$refs.hanziAnim;
      if (ref && ref.stepStroke) ref.stepStroke();
    },
   
    openCharAsWord(char) {
      this.updateModalContent(char);
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
    findPreferredDefIndex(cardData, _prefPin, prefEng, prefIdx = null) {
      const pins = Array.isArray(cardData?.pinyin) ? cardData.pinyin : [];
      const engs = Array.isArray(cardData?.english) ? cardData.english : [];
      const maxLen = Math.max(pins.length, engs.length);

      const targetEList = this.normalizeEng(prefEng);
      const targetE = targetEList[0] || '';

      // Match by english definition only
      for (let i = 0; i < maxLen; i++) {
        const engTokens = this.normalizeEng(engs[i]);
        if (targetE && (engTokens.includes(targetE) || engTokens.some(t => targetE.includes(t)))) {
          return i;
        }
      }

      // Fall back to explicit index
      if (Number.isInteger(prefIdx) && prefIdx >= 0 && prefIdx < maxLen) {
        return prefIdx;
      }

      return 0;
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
      const allowed = ['tatoeba', 'strokes', 'examples', 'present', 'decomp', 'extra'];
      if (!allowed.includes(tab)) return;
      if (tab === 'strokes' && !this.hasStrokes) return;
      if (tab === 'examples' && !this.hasExamples) return;
      if (tab === 'tatoeba' && !this.hasTatoebaExamples) return;
      if (tab === 'present' && !this.hasPresentIn) return;
      if (tab === 'decomp' && !this.hasDecomposition) return;
      if (tab === 'extra' && !this.hasExtraInfo) return;
      this.activeDetailTab = tab;
    },
    cycleMainWordFont() {
      try {
        //this.fontCycleIndex = (this.fontCycleIndex + 1) % this.fontOrder.length;
      } catch (e) {}
    },
    logExamples() {
      try {
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
      this.showCustomEditModal = false;
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
      if (!this.cardData || !this.cardData.character) return;
      const hanzi = this.cardData.character;
      const pinyins = Array.isArray(this.cardData.pinyin) ? this.cardData.pinyin.filter(p => p && p !== 'N/A') : [];
      const n = Math.max(pinyins.length, 1);

      const custom = this.customDef || {};
      const customEnglishList = custom.english ? custom.english.split('\x1F') : [];

      this.editHanzi = hanzi;
      this.editPinyinList = pinyins;
      this.editEnglishList = Array.from({ length: n }, (_, i) => customEnglishList[i] ?? '');
      this.showCustomEditModal = true;
      this.editError = '';
    },
    async saveCustomEdit() {
      try {
        if (!this.cardData || !this.cardData.character) return;
        const hanzi = this.cardData.character;
        const values = this.editEnglishList.map(e => (e || '').trim());
        if (values.every(e => !e)) {
          await this.$store.dispatch('deleteCustomDefinition', { hanzi });
        } else {
          await this.$store.dispatch('setCustomDefinition', { hanzi, pinyin: '', english: values.join('\x1F') });
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
      // Reset stroke counter/steps when switching words
      this.strokeCounter = '0/0';
      if (this.$refs.hanziAnim && this.$refs.hanziAnim.resetStep) {
        this.$refs.hanziAnim.resetStep();
      }
      if (this.isVisible && this.cardData && this.cardData.character === word) {
        if (this.validChars.includes(word) && this.activeChar !== word) {
          this.activeChar = word;
        }
        return;
      }
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
    closeCreateListModal() {
      this.showCreateListModal = false;
      this.newListName = '';
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
      // Close dropdown if click is outside the dropdown button
      if (this.showWordlistDropdown) {
        const dropdownButton = this.$refs.dropdownButton;
        if (!dropdownButton || !dropdownButton.contains(event.target)) {
          this.showWordlistDropdown = false;
        }
      }
    },
    handleModalClick(event) {
      // Close dropdown if clicking on modal but not on dropdown button
      const dropdownButton = this.$refs.dropdownButton;
      if (this.showWordlistDropdown && dropdownButton && !dropdownButton.contains(event.target)) {
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
      } else if (type === 'opposite') {
        this.showOppositeConcepts = !this.showOppositeConcepts;
        this.showRelatedConcepts = false;
      }
    },
    async loadExamplesPage(page) {
      if (!this.cardData || !this.cardData.character) return;
      this.examplesLoading = true;
      try {
        const pList = this.cardData.pinyin || [];
        const body = { character: this.cardData.character, page: page - 1 };
        if (pList.length > 1) {
          const idx = this.mainDefIndex % pList.length;
          body.pinyin = pList[idx] || '';
        }
        const res = await fetch('/api/get_examples_page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Failed to load examples page');
        const data = await res.json();
        const examples = Array.isArray(data.examples) ? data.examples : [];
        this.examplesPage = page;
        this.examplesIsLast = Boolean(data.is_last);
        this.fetchedExamples = { ...this.fetchedExamples, [page]: examples };
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
  background-color: #00f0;
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
}

.extra-info-details {
  /*background-color: var(--freq-trad-bg, color-mix(in oklab, var(--fg) 3%, var(--bg) 100%));*/
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 80%);
  padding: 1em;

  corner-shape: var(--superellipse-4);
  border-radius: var(--superellipse-radius);
}

.extra-info-item {
  padding: 0.5rem 1rem;

}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 1.2em;
  color: #666;
  z-index: 30;
}

.spinner {
  width: 40px;
  height: 40px;
  margin-bottom: 12px;
  border: 4px solid #ccc;
  border-top-color: #333;
  border-radius: 50%;
  z-index: 30;
  animation: spin 0.8s linear infinite;
}

.spinner-label {
  z-index: 30;
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
.edit-hanzi-label {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}
.edit-pronunciation-row {
  display: flex;
  flex-direction: column;
  border-top: 1px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 100%);
  padding-top: 0.5rem;
  margin-top: 0.25rem;
}
.edit-pinyin-label {
  font-size: 0.85rem;
  opacity: 0.5;
  font-style: italic;
  margin-bottom: 0.15rem;
}
.custom-edit-modal .edit-input {
  width: 100%;
  background: transparent;
  color: var(--fg);
  border: none;
  outline: none;
  padding: 0.5rem 0;
  font-size: 1rem;
}
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
  border: 2px solid color-mix(in oklab, var(--fg) 20%, var(--bg) 20%);


  border: 1px solid color-mix(in oklab, var(--fg) 9%, transparent 50%);
  box-shadow: inset -0.0px 1.0px 0 var(--highlight), 0 0 55px var(--card-shadow-color);

  corner-shape: var(--superellipse-4);
  border-radius: var(--superellipse-radius, 100px);
}

@media (max-width: 600px) {
  .modal {
    box-shadow: none;
  }
}

/* (removed duplicate absolute overlay; using sticky version below) */

.modal::-webkit-scrollbar {
  width: 0;
  height: 0;
}


.main-def-flex {
  position: relative;
  width: 100%;
}

.main-def-text {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
}

.main-pinyin {
  font-size: 1.3rem;
}

.def-nav {
  position: absolute;
  top: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.def-btn {
  background: color-mix(in oklab, var(--bg) 90%, var(--fg) 10%);
  color: var(--fg);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: .7rem;
  width: 2rem;
  height: 1rem;
  text-align: center;
  line-height: 0;
}

.def-counter {
  font-size: 0.9rem;
  opacity: 0.75;
}

.english-idx { margin-right: 0.35rem; opacity: 0.8; }
.english-text { display: inline; }
.hanzi-link { 
  padding: .25rem 0.25rem;
  color: var(--fg); cursor: pointer;
  font-weight: var(--hanzi-weight) !important;

}
.hanzi-link:hover { text-decoration: underline; }
.hanzi-link.main-word-char:hover { text-decoration: none; opacity: 0.69; }


.hanzi-link.trad-char:hover { text-decoration: none; opacity: 0.69; }



.similars-list .similar-link {
  font-family: var(--main-word-font, 'Noto Serif SC', 'Kaiti', sans-serif);
  font-size: 1.5em;
}
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
  margin: 0.78em 0 0.2em 0;
  line-height: 1;
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.35em;
  flex-wrap: wrap;
}

.main-word-line {
  display: inline-flex;
  align-items: baseline;
  gap: 0.0rem;
  flex-wrap: wrap;
}

.main-pinyin-row {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.pm-pinyin-row {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.audio-btn {
  background: none;
  border: none;
  color: var(--fg);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.1rem;
  margin-right: 0.2rem;
  box-shadow: none;
}

.audio-btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.pinyin-audio-btn {
  background: none;
  border: none;
  color: var(--fg);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.05rem;
}

.pinyin-audio-btn[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.main-word-trad {
  display: inline-flex;
  gap: 0.2rem;
  align-items: baseline;
  padding-left: .25em;
  white-space: nowrap;
  flex-shrink: 0;
}

.trad-bracket {
  opacity: 0.5;
  font-size: 0.75em;
  font-weight: var(--hanzi-weight) !important;
}

.trad-char {
  font-size: .75em;
  font-family: var(--main-word-font, "Noto Serif SC", "Kaiti", sans-serif);
  opacity: 1;
  font-weight: var(--hanzi-weight) !important;
}

.main-word-char {
  font-family: var(--main-word-font, "Noto Serif SC", "Kaiti", sans-serif);
  font-weight: var(--hanzi-weight) !important;

}
.main-word-char-single {
  padding: 0.25rem;
  box-sizing: border-box;
}

.main-word-inverted {
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

.main-english-row {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 0.5em;
}

.main-english {
  font-size: 1rem;
  box-sizing: border-box;
  overflow-wrap: break-word;
  flex: 1;
  margin-top: 1em;

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
  /*background-color: var(--freq-trad-bg, color-mix(in oklab, var(--fg) 3%, var(--bg) 100%));*/
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  
  corner-shape: var(--superellipse-4);
  border-radius: 0px 0px var(--superellipse-radius) var(--superellipse-radius);
}


.rest-words:first-child {
    border-top: none;
    border-top: none;
    border-top-left-radius: 0!important;
    border-top-right-radius: 0!important;
    padding-top: 0;
}


.first-words {
  border-bottom: none;
  corner-shape: var(--superellipse-4);
  border-radius: var(--superellipse-radius) var(--superellipse-radius) 0px 0px;
}
.first-words.collapsed-words {
  border-bottom: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  border-radius: var(--superellipse-radius);
}


.example-word-content {
  display: flex;
  box-sizing: border-box;
  gap: .5rem;
  align-items: left;
  flex-direction: column;
  padding: 0.5rem 0.5rem;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  border-bottom: 2px dashed color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  font-size: 0.8em;
}

.example-word-content.therest:last-child {
  border-bottom: none;
}

.example-word-content:hover {
  background-color: color-mix(in oklab, var(--fg) 2%, var(--bg) 50%) !important;
}

.example-chinese-pinyin {
  min-width: 20%;
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
  font-style: italic;
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

.word-english-list {
  display: flex;
  flex-direction: column;
  gap: 0.15em;
  min-width: 0;
  flex: 1;
}

.word-english-item {
  font-size: 0.85rem;
  opacity: 0.6;
  padding-left: 1em;
  line-height: 1.3;
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

@media screen and (max-width: 784px) {
  .examples-nav {
    padding: 0.5em 0 3em 0;
  }
}

.examples-nav-btn {
  padding: .5em;

  border: 1px solid color-mix(in oklab, var(--fg) 5%, transparent 50%);
  box-shadow: inset 0 1.0px 0 var(--highlight);
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



.tabs {
  display: flex;
  gap: 0.5rem;
  margin-top: 0;
  margin-bottom: 1rem;
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-bottom: var(--thin-border-width) solid var(--fg-dim);
  position: relative;
  overflow: visible;
}

.tab-btn {
  position: relative;
  font-size: 2rem;
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
  font-family: inherit;
  color: var(--fg);
  white-space: nowrap;
  opacity: 0.35;
  border: 3.5px solid #0000;
  border: none;
  background: #0000;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  border-bottom: none;
  border-bottom: 3.5px solid #0000;
  transform: translate(0, 3.5px);
  font-weight: var(--hanzi-weight) !important;
}



.tab-btn {
	border: var(--thin-border-width) solid #0000 !important;
	border-bottom: var(--thin-border-width) solid #0000 !important;
	transform: translate(0, var(--thin-border-width));

  corner-shape: var(--superellipse-4);
  border-radius: var(--superellipse-radius) var(--superellipse-radius) 0px 0px;
}


.tab-btn.active {
	border: var(--thin-border-width) solid var(--fg-dim) !important;
	transform: translate(0, calc(var(--thin-border-width) + 0.2px)) !important;
	border-bottom: var(--thin-border-width) solid #0000 !important;
  background: color-mix(in srgb, var(--fg), var(--bg) 100%);
  font-size: 3.5rem;
  opacity: 1;
  z-index: 2;
  transform: translate(0, var(--thin-border-width));
  cursor: default;
}

.tab-open-word {
  position: absolute;
  top: 0.0rem;
  right: 0.2rem;
  font-size: 0.8rem;
  opacity: 0.75;
  cursor: pointer;
  color: var(--fg);
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
  font-size: 1rem;
  justify-content: space-between;
}

.detail-toggle {
  padding: 0.25rem 0.5rem;
  white-space: nowrap;
  flex-shrink: 0;

  border: 1px solid color-mix(in oklab, var(--fg) 5%, transparent 50%);
  box-shadow: inset 0 1px 0 var(--highlight);
}

.detail-toggle.active {
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
  height: 100%;
  justify-self: flex-start;
  align-items: center;

  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  /* justify-content: space-around; */
  box-sizing: border-box;

  corner-shape: var(--superellipse-3);
  border-radius: var(--superellipse-radius, 100px);
}

.hanzi-anim-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 1em;
  padding-top: 3em;
  flex: 1;

  corner-shape: var(--superellipse-4);
  border-radius: var(--superellipse-radius, 100px);
}

.hanzi-anim {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: auto;
  margin-right: auto;
  margin-top: 1em;
  margin-bottom: 1em;
  line-height: 1;
  width: 45%;
  box-sizing: border-box;
}

.anim-character {
  /* font-size: 12rem;
  font-family: 'Kaiti', 'STKaiti', 'Kai', '楷体'; */
  box-sizing: border-box;
}


.stroke-char-btn {
  background: none;
  border: 1px solid color-mix(in oklab, var(--fg) 18%, var(--bg) 100%);
  color: var(--fg);
  padding: 0.2em 0.5em;
  cursor: pointer;
  font-family: inherit;
  font-size: 1.1em;
}

.stroke-char-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.stroke-char-left {
  position: absolute;
  top: 1em;
  left: 1em;
  z-index: 2;
}

.stroke-char-right {
  position: absolute;
  top: 1em;
  right: 1em;
  z-index: 2;
}

.hanzi-anim-controls {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.anim-btn {
  border: 1px solid color-mix(in oklab, var(--fg) 5%, transparent 50%);
  box-shadow: inset 0 1.0px 0 var(--highlight);

  background: color-mix(in oklab, var(--fg) 6%, var(--bg) 100%);
  color: var(--fg);
  padding: 0.45rem 0.75rem;
  
  corner-shape: var(--superellipse-2-5);
  border-radius: var(--superellipse-radius, 100px);

  cursor: pointer;
  font-family: inherit;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
.anim-btn:hover {
  background: color-mix(in oklab, var(--fg) 12%, var(--bg) 100%);
}

.stroke-counter {
  border: 1px solid color-mix(in oklab, var(--fg) 25%, var(--bg) 90%);
  background: color-mix(in oklab, var(--fg) 6%, var(--bg) 100%);
  color: var(--fg);
  padding: 0.45rem 0.75rem;
  border-radius: var(--border-radius, 4px);
  cursor: default;
  font-family: inherit;
  width: 3em;
  text-align: center;

  corner-shape: var(--superellipse-2-5);
  border-radius: var(--superellipse-radius, 100px);
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
}

.basic-label {
  font-size: 1em;
  opacity: 0.5;
}

.char-breakdown {
  font-size: 1.25rem;
  margin: 0;
  opacity: .75;
  margin-bottom: .5em;
  text-decoration: dotted;
}

.close-btn {

  corner-shape: round !important;
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
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);

  corner-shape: var(--superellipse-4);
  border-radius: var(--superellipse-radius, 100px);
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
  position: absolute;
  top: 0;
  left: 3.5rem;
  z-index: 30;
}

.wordlist-btn {
  position: absolute;
  top: 0;
  left: 0;
  font-size: 2rem;
  aspect-ratio: 1;
  padding: 1rem;
  margin: 0;
  background: none;
  border: none;
  color: var(--fg);
  cursor: pointer;


  border: none;
  box-shadow: none;
}

.wordlist-btn:hover {
}

.close-btn-tl{
  position: absolute;
  top: 0;
  right: 0;
  font-size: 1.7rem;
  aspect-ratio: 1;
  padding: 1rem;
  margin: 0;
  background: none;
  border: none;
  color: var(--fg);
  cursor: pointer;
  z-index: 25;

  border: none;
  box-shadow: none;
}


.plus-icon {
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
  left: 0;
  background-color: var(--bg);
  border: 1px solid var(--fg);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 80%);
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
  font-size: .8rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);

  corner-shape: var(--superellipse-2-5);
  border-radius: var(--superellipse-radius, 100px);
}

.concept-toggle.active {
  /* background-color: var(--primary-color); */
  background-color: color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  background-color: var(--orange);
  color: var(--bg);

  
  border: 1px solid color-mix(in oklab, var(--fg) 15%, transparent 30%);
  box-shadow: inset 0 1.0px 0 var(--highlight);
  
}

[data-theme="dark"] .concept-toggle.active {
  color: var(--fg);
}

[data-theme="theme1"] .concept-toggle.active {
  color: var(--bg);
}

[data-theme="theme2"] .concept-toggle.active {
  color: var(--fg);
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
  color: var(--fg);
}

.create-list-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  background: none;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-button,
.confirm-button {
  color: var(--fg);
  background-color: var(--bg);
  opacity: 0.8;
}

.cancel-button:hover,
.confirm-button:hover {
  cursor: pointer;
  background-color: color-mix(in oklab, var(--fg) 10%, var(--bg) 85%);
}

.present-in-chars {
  display: flex;
  flex-wrap: wrap;
  gap: 0.0rem;
  padding: .5em .5em .5em .5em;
  /*background-color: var(--freq-trad-bg, color-mix(in oklab, var(--fg) 3%, var(--bg) 100%));*/
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);

  corner-shape: var(--superellipse-3);
  border-radius: var(--superellipse-radius, 100px);
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
  font-family: var(--main-word-font, "Noto Serif SC", "Kaiti", sans-serif) !important;
}

.radical-char {
  font-size: 1.5em;
  font-family: var(--main-word-font, "Noto Serif SC", "Kaiti", sans-serif) !important;
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
    /*width: 95vw;
    max-width: 95vw;
    height: 80vh;
    max-height: 80vh;
    padding: 1rem;*/
  }

  .wordlist-dropdown {
      position: absolute;
      top: 0;
      left: 3.5rem;
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
      max-height: 100%;
      padding: 3rem 1rem 1rem 1rem;
      border: none;
    }

    .close-btn-tl, .wordlist-btn {
      top: 1.2em;
    }

    .close-btn-tl {
      display: none;
    }

    .wordlist-dropdown {
      position: absolute;
      top: 0;
      left: 3.5rem;
    }

    .main-word {
      /*margin-top: 3rem;*/
    }

    .main-pinyin,
.main-english-row {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 0.5em;
}

.main-english {
  font-size: 1rem;
  box-sizing: border-box;
  overflow-wrap: break-word;
  flex: 1;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
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
    bottom: 0rem;
    right: 0rem;
    background: none;
    width: 3.5rem;
    height: 3.5rem;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
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

.x-centered {
  display: flex;
  align-items: center;
  color: var(--fg);
  justify-content: center;
  width: 100%;
  height: 100%;
  margin-bottom: 3px;
}

.word-pinyin {
  opacity: 1.0;
  opacity: 0.8;
}
</style>

<style>


body.modal-open {
  overflow: hidden;
}

.extra-fonts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  align-items: center;
  justify-items: center;
  margin: 0.75rem 0 1rem;
}
.extra-font-item {
  font-size: 2.75rem;
  line-height: 1.1;
  text-align: center;
  width: 100%;
  padding: 0.5rem 0;
  border: 1px solid color-mix(in oklab, var(--fg) 8%, var(--bg) 100%);
  border-radius: var(--pinyin-meaning-group-border-radius, 0);
  background: color-mix(in oklab, var(--fg) 3%, var(--bg) 100%);
}
.font-kaiti { font-family: 'Kaiti', 'KaiTi', serif; }
.font-noto-sans { font-family: 'Noto Sans SC', 'Noto Sans', sans-serif; }
.font-noto-serif { font-family: 'Noto Serif SC', 'Noto Serif', serif; }
.font-fusion-pixel { font-family: 'Fusion Pixel S', 'Fusion Pixel T'; }
</style>
