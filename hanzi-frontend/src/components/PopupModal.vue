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
                  @mouseenter="$emit('character-hover', word)"
                  @mouseleave="$emit('character-hover', null)"
                >
                  <span class="chinese" @click="$emit('character-click', word)">{{ word }}</span>
                  <span class="pinyin">{{ activeCharData.pinyin[index] }}</span>
                  <span class="meaning">{{ activeCharData.english[index] }}</span>
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
  name: 'PopupModal',
  emits: ['close', 'character-hover', 'character-click'],
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
    },
    clearHover() {
      this.$emit('character-hover', null);
    },
    toggleExamples() {
      this.isExamplesExpanded = !this.isExamplesExpanded;
    }
  }
};
</script>
<style scoped>
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
}

.modal {
  position: relative;
  width: 34%;
  height: 90vh;
  max-height: 90vh;
  border: 2px dashed var(--primary-color);
  background: var(--page-background);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  box-sizing: border-box;
  z-index: 1032;
  font-family: var(--font-family);
  font-weight: 400;
  overflow-y: hidden;
  overflow-y: visible;
  overflow: visible;
  -ms-overflow-style: none;
  overflow-x: hidden;
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
}

.character {
  font-size: 7em;
  margin-bottom: 0.5rem;
  line-height: 1;
}


.breakdown-section {
  border-top: 1px solid var(--primary-color);
  padding-top: 1.5rem;
  width: 100%;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  width: 100%;
  overflow-x: auto;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: 2px solid var(--primary-color);
  background: none;
  cursor: pointer;
  color: var(--primary-primary);
  white-space: nowrap;
  opacity: .5;
}

.tab-btn.active {
  opacity: 1;
}

.char-details {
  display: grid;
  gap: 1.5rem;
  width: 100%;
}

.detail-group {
  background: var(--bg-secondary);
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
}

.components, .radicals {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.radical {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--primary-color);
  transition: all 0.2s ease;
}

.radical:hover {
  border-color: var(--primary-color);
  background: var(--bg-primary);
}

.radical-char {
  font-weight: 600;
}

.example-words {
  display: grid;
  gap: 0.75rem;
  width: 100%;
  border: 2px dashed var(--secondary-color);
  padding: 1rem;
  box-sizing: border-box;
  margin: 0; 
}

.example-word {
  display: grid;
  grid-template-columns: minmax(auto, max-content) minmax(auto, max-content) 1fr; /* Change this */
  gap: 1rem;
  align-items: center;
  padding: 0.5rem;
  transition: background-color 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.example-word:hover {
  background: var(--bg-secondary);
}

.example-word .chinese {
  justify-self: start;
  white-space: nowrap;
  font-size: 1em;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
cursor: pointer;
}

.example-word .pinyin {
  justify-self: start;
  white-space: nowrap;
  opacity: 0.6;
}

.example-word .meaning {
  justify-self: start;
  text-align: left;
  font-size: 1em;
  width: 100%;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
}


.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: transform 0.2s ease;
}

.close-btn:hover {
  transform: scale(1.1);
}

@media screen and (max-width: 768px) {
  .modal {
    width: 90%;
    max-height: 85vh;
    padding: 1rem;
  }
  
  .character {
    font-size: 5em;
  }
  
  .example-word {
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
  }
  
  .example-word .meaning {
    grid-column: 1 / -1;
  }
}

h2, h3, h4 {
  margin: 0;
  color: var(--text-primary);
}
</style>
