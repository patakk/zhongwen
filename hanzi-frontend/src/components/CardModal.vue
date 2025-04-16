<template>
  <div class="modal-overlay" v-if="visible" @click="closeModal">
    
    <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <div>Loading...</div>
      </div>
    <div v-else class="modal card-modal" @click.stop>
      <button @click="closeModal" class="close-btn">×</button>

      <!-- ✅ Loading State -->

      <!-- ✅ Actual Modal Content -->
        <!-- Main word section -->
        <div class="main-word-section">
          <div class="main-character">{{ data.character }}</div>
          <div class="minor-character">{{ data.character }}</div>
          <div class="main-pinyin">{{ $toAccentedPinyin(data.pinyin.join(', ')) }}</div>
          <div class="main-english">{{ data.english.join(', ') }}</div>
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
                  <div class="detail-group">
                    <div>Frequency rank: {{ activeCharData.rank }}</div>
                  </div>
                  <div class="detail-group">
                    <div>Pinyin: {{ $toAccentedPinyin(activeCharData.pinyin[0]) }}</div>
                  </div>

                  <div v-if="activeChar !== activeCharData.traditional" class="detail-group">
                    <div>
                      Traditional:
                      <span
                        class="trad-simple hoverable"
                        @mouseenter="startHoverTimer(activeCharData.traditional)"
                        @mouseleave="clearHoverTimer"
                        @click="updateModalContent(activeCharData.traditional)"
                      >
                        {{ activeCharData.traditional }}
                      </span>
                    </div>
                  </div>

                  <div v-if="activeChar !== activeCharData.simplified" class="detail-group">
                    <div>
                      Simplified: 
                      <span
                        class="trad-simple hoverable"
                        @mouseenter="startHoverTimer(activeCharData.simplified)"
                        @mouseleave="clearHoverTimer"
                        @click="updateModalContent(activeCharData.simplified)"
                      >{{ activeCharData.simplified }}</span>
                    </div>
                  </div>

                  <div class="detail-group">
                    Radicals:
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
                  <div class="anim-character">{{ activeCharData.character }}</div>
                </div>
              </div>

              <ExpandableExamples title="Meanings" ref="examplesSection">
                <template v-slot:afew="slotProps">
                  <div class="example-words">
                    <ClickableRow
                      v-for="(word, index) in activeCharData.example_words.slice(0, 5)"
                      :key="index"
                      :word="word"
                      :class="{ therest: !slotProps.isExpanded }"
                      @example-clicked="collapseExamples"
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
                      @example-clicked="collapseExamples"
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

              <div class="detail-group">
                <h4>Components</h4>
                <div class="components">
                  <span v-for="comp in activeCharData.main_components" :key="comp">
                    {{ comp }}
                  </span>
                </div>
              </div>
            </div>
          </div>
      </div>
      <!-- End of v-else -->
    </div>
  </div>
</template>

<script>
import ExpandableExamples from './ExpandableExamples.vue'
import ClickableRow from './ClickableRow.vue'

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
    }
  },
  inject: ['updatePopupData', 'preloadCardDataForWord'],
  components: {
    ExpandableExamples,
    ClickableRow
  },
  name: 'CardModal',
  emits: ['close'],
  data() {
    return {
      activeChar: null,
      hoverTimer: null,
      hoverWord: null
    }
  },
  computed: {
    validChars() {
      if (!this.data || !this.data.character) return []
      return this.data.character.split('').filter(char => /\p{Script=Han}/u.test(char))
    },
    activeCharData() {
      if (!this.data || !this.data.chars_breakdown) return null
      const charToShow = this.activeChar || this.validChars[0]
      return this.data.chars_breakdown[charToShow]
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
    }
  },
  mounted() {
    window.addEventListener('keydown', this.handleEscKey)
    if (this.visible) {
      document.body.classList.add('modal-open')
    }
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleEscKey)
    document.body.classList.remove('modal-open')
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },
    handleEscKey(event) {
      if (event.key === 'Escape') {
        this.closeModal()
      }
    },
    startHoverTimer(word) {
      this.clearHoverTimer()
      this.hoverWord = word
      this.hoverTimer = setTimeout(() => {
        this.preloadData()
      }, 300)
    },
    clearHoverTimer() {
      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer)
        this.hoverTimer = null
      }
      this.hoverWord = null
    },
    async preloadData() {
      if (this.hoverWord) {
        await this.preloadCardDataForWord(this.hoverWord)
      }
    },
    updateModalContent(word) {
      this.clearHoverTimer()
      this.updatePopupData(word)
    },
    collapseExamples() {
      this.$refs.examplesSection.collapse()
    }
  }
}
</script>

<style scoped>
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

.modal::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.main-word-section {
  text-align: center;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.main-character {
  font-size: 11rem;
  margin: .1em 0 .2em 0;
  line-height: 1;
  width: 100%;
  text-align: center;
  font-family: 'Kaiti';
}

.minor-character {
  font-size: 2.5rem;
  font-family: 'Noto Sans SC';
}

.main-character:hover {
  font-size: 11rem;
  font-family: 'Noto Serif SC';
}

.main-pinyin {
  font-size: 1.2rem;
}

.main-english {
  font-size: 1rem;
  box-sizing: border-box;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  width: 100%;
}

.example-words {
  display: grid;
  gap: 0rem;
  width: 100%;
  min-width: 0;
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
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
  background: color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
}

.example-chinese-pinyin {
  min-width: 20%;
  width: 20%;
  overflow: hidden;
  white-space: nowrap;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  border-right: 2px dashed color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
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
  max-width: 100%;
  transition: color 0.2s ease;
  color: var(--text-primary);
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

.breakdown-section {
  border-top: 1px solid var(--fg);
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
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border: 2px solid color-mix(in oklab, var(--fg) 25%, var(--bg) 50%);
  cursor: pointer;
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
  padding: 0.25rem 0.5rem;
  width: 100%;
  box-sizing: border-box;
  font-size: 1rem;
  min-width: 0; /* Prevent flex item from overflowing */
  border-bottom: 1px solid var(--fg);
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
  flex: 3;
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
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  width: 100%;
}

.radical {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--fg);
  transition: all 0.2s ease;
  flex-shrink: 0; /* Prevent radicals from shrinking */
}

.radical:hover {
  border-color: var(--fg);
  background: color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
}

.radical-char {
}

.char-breakdown {
  font-size: 1.25rem;
  font-weight: normal;
  margin: 0;
  opacity: .5;
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
