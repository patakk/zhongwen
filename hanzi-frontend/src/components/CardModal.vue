<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <button @click="closeModal" class="close-btn">×</button>
      
      <!-- Main word section -->
      <div class="main-word-section">
        <div class="character">{{ data.character }}</div>
        <div class="pinyin">{{ data.pinyin.join(', ') }}</div>
        <div class="english">{{ data.english.join('; ') }}</div>
      </div>

      <!-- Character breakdown section -->
      <div class="breakdown-section" v-if="data.chars_breakdown">
        <h3>Character Breakdown</h3>
        
        <!-- Tabs - Show only if there's more than one character -->
        <div class="tabs" v-if="Object.keys(data.chars_breakdown).length > 1">
          <button 
            v-for="(char, key) in data.chars_breakdown" 
            :key="key"
            :class="['tab-btn', { active: activeChar === key }]"
            @click="activeChar = key"
          >
            {{ key }}
          </button>
        </div>

        <!-- Tab content -->
        <div class="tab-content" v-if="activeCharData">
          <div class="char-details">
            
            <ExpandableExamples title="Example Words">
              <div class="example-words">
                <div 
                  v-for="(word, index) in activeCharData.example_words" 
                  :key="index" 
                  class="example-word"
                >
                  <slot name="example-word" :word="word" :index="index" :pinyin="activeCharData.pinyin[index]" :meaning="activeCharData.english[index]">
                    <span class="chinese">{{ word }}</span>
                    <span class="pinyin">{{ activeCharData.pinyin[index] }}</span>
                    <span class="meaning">{{ activeCharData.english[index] }}</span>
                  </slot>
                </div>
              </div>
            </ExpandableExamples>
            
            <div class="detail-group">
              <div><strong>Rank:</strong> {{ activeCharData.rank }}</div>
            </div>
            
            <div class="detail-group">
              <div><strong>Traditional:</strong> {{ activeCharData.traditional }}</div>
            </div>
            
            <div class="detail-group">
              <div><strong>Simplified:</strong> {{ activeCharData.simplified }}</div>
            </div>

            <div class="detail-group">
              <h4>Components</h4>
              <div class="components">
                <span v-for="comp in activeCharData.main_components" :key="comp">{{ comp }}</span>
              </div>
            </div>

            <div class="detail-group">
              <h4>Radicals</h4>
              <div class="radicals">
                <span v-for="(meaning, char) in activeCharData.radicals" :key="char" class="radical">
                  <span class="radical-char">{{ char }}</span>
                  <span class="radical-meaning">{{ meaning }}</span>
                </span>
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

export default {
  props: ['data'],
  components: {
    ExpandableExamples
  },
  name: 'CardModal',
  emits: ['close'],
  data() {
    return {
      activeChar: null,
      isExamplesExpanded: true
    }
  },
  computed: {
    activeCharData() {
      if (!this.data.chars_breakdown) return null;
      const chars = Object.keys(this.data.chars_breakdown);
      // If only one character or no active selection, show the first character
      const charToShow = this.activeChar || chars[0];
      return this.data.chars_breakdown[charToShow];
    }
  },
  mounted() {
    window.addEventListener('keydown', this.handleEscKey);
    // Set initial active character
    if (this.data.chars_breakdown) {
      this.activeChar = Object.keys(this.data.chars_breakdown)[0];
    }
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleEscKey);
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    handleEscKey(event) {
      if (event.key === 'Escape') {
        this.closeModal();
      }
    }
  }
};
</script>

<style scoped>
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
  z-index: 1000;
  cursor: default;
}

.modal {
  position: fixed;
  width: 50vw;
  min-width: 400px;
  max-width: 800px;
  height: 80vh;
  max-height: 80vh;
  border: 2px dashed var(--fg);
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  box-sizing: border-box;
  z-index: 1032;
  font-family: 'Noto Sans Mono', monospace;
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
  min-width: 0; /* Prevent flex item from overflowing */
}

.character {
  font-size: 6rem;
  margin-bottom: 0.5rem;
  line-height: 1;
  width: 100%;
  text-align: center;
}

.pinyin {
  font-size: 1.2rem;
}

.english {
  font-size: 1.2rem;
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
  margin-top: 1rem;
  margin-bottom: 1rem;
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border: 2px solid var(--fg);
  background: none;
  border-radius: 2px;
  cursor: pointer;
  color: var(--primary-primary);
  white-space: nowrap;
  opacity: .35;
  flex-shrink: 0; /* Prevent buttons from shrinking */
}

.tab-btn.active {
  border: 2px solid var(--fg);
  opacity: 1;
}

.char-details {
  display: grid;
  gap: 0.6rem;
  width: 100%;
  min-width: 0; /* Prevent grid from overflowing */
}

.detail-group {
  background: color-mix(in oklab, var(--fg) 3%, var(--bg) 50%);
  padding: 0.25rem .5rem;
  width: 100%;
  box-sizing: border-box;
  min-width: 0; /* Prevent flex item from overflowing */
}

.components, .radicals {
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
  font-weight: 600;
}

.example-words {
  display: grid;
  gap: 0rem;
  width: 100%;
  min-width: 0; /* Prevent grid from overflowing */
}

.example-word {
  display: grid;
  grid-template-columns: minmax(auto, max-content) minmax(auto, max-content) 1fr;
  gap: 1rem;
  align-items: center;
  padding: 0.15rem 0.5rem;
  width: 100%;
  box-sizing: border-box;
  min-width: 0; /* Prevent grid from overflowing */
  cursor: pointer;
}

.example-word:hover {
  background: color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
}

.example-word .chinese {
  justify-self: start;
  white-space: nowrap;
  font-size: 1rem;
  color: var(--text-secondary);
}

.example-word .pinyin {
  justify-self: start;
  white-space: nowrap;
  font-size: 0.9rem;
  opacity: 0.6;
}

.example-word .meaning {
  justify-self: start;
  text-align: left;
  font-size: 1rem;
  width: 100%;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
  min-width: 0; /* Allow text to wrap */
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
  
  .pinyin, .english {
    font-size: 1rem;
  }
}

@media screen and (min-width: 1200px) {
  .character {
    font-size: 8rem;
  }
}

h2, h3, h4 {
  margin: 0;
  color: var(--text-primary);
}
</style> 