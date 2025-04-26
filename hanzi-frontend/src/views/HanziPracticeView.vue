<template>
  <BasePage page_title="Strokes Practice" />
  <div class="practice-view">
    <div class="practice-container">
      <div class="deck-selector">
        <div class="custom-dropdown">
          <div 
            id="selected-deck" 
            @click="toggleDeckOptions"
          >
            {{ currentDeckName }}
          </div>
          <div 
            id="deck-options" 
            :class="{ 'show': isDropdownOpen }"
          >
            <div 
              v-for="(deck, key) in decks" 
              :key="key" 
              class="option"
              :class="{ 'selected': currentDeck === key }"
              @click="selectDeck(key)"
            >
              {{ deck.name }}
            </div>
          </div>
        </div>
      </div>

      <div class="practice-area">
        <div class="word-display">
          <div class="full-word">
            <span 
              v-for="(char, index) in currentWord" 
              :key="index" 
              class="word-character"
              :class="{ 'current-character': index === charIterator % currentWord.length, 'dim-character': index !== charIterator % currentWord.length }"
            >
              <span v-if="!skipState">{{ index !== charIterator % currentWord.length ? char : '' }}</span>
              <span v-if="skipState">{{ char }}</span>
            </span>
          </div>
          
          <div class="pinyin-label" :class="{ 'active': showPinyin }">
            <span v-for="(word, index) in currentPinyin.split(' ')" :key="index" :class="{ 'dimmed': currentWord.split('')[index] !== currentWord[charIterator % currentWord.length] }">
              {{ $toAccentedPinyin(word) }}
            </span>
          </div>
          
          <div class="english-display">
            {{ currentEnglish[0] || '' }}
          </div>
        </div>

        <div class="drawing-area" ref="drawingArea">
          <!-- Canvas will be inserted here by HanziPlotter -->
        </div>

        <div class="control-buttons">
          <button id="nav-btn" @click="previousCharacter" class="btn nav-previous">
            <i class="fa-solid fa-backward-step"></i> Previous
          </button>
          <button id="help-btn" v-if="!skipState" @click="showHelp" class="btn">
            <i class="fa-solid fa-lightbulb"></i> Help
          </button>
          <button id="action-btn" @click="contextAction" class="btn primary-action"
            :class="{ 'action-reveal': !skipState, 'action-next': skipState }">
            <i class="fa-solid" :class="actionIcon"></i> {{ actionText }}
          </button>
          <button id="clear-btn" @click="restartQuestion" class="btn">
            <i class="fa-solid fa-eraser"></i> Clear
          </button>
        </div>

        <div class="progress-info">
          <div>Streak: {{ streakCount }}</div>
          <div v-if="totalAnswered > 0">
            Accuracy: {{ ((totalCorrect / totalAnswered) * 100).toFixed(1) }}%
          </div>
          <div v-if="totalStrokeCount > 0">
            Stroke Accuracy: {{ (((totalStrokeCount - totalMistakeCount) / totalStrokeCount) * 100).toFixed(1) }}%
          </div>
        </div>
      </div>
    </div>

    <div id="confetti-container"></div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import BasePage from '../components/BasePage.vue';
import HanziPlotter from '../lib/plotter';

export default defineComponent({
  name: 'HanziPracticeView',
  components: {
    BasePage
  },
  data() {
    // Get URL parameter first before setting default
    const urlParams = new URLSearchParams(window.location.search);
    const deckFromUrl = urlParams.get('wordlist');
    
    return {
      // Deck management
      currentDeck: deckFromUrl || 'hsk1', // Use URL param if available, otherwise default
      decks: {},
      isDropdownOpen: false,
      
      // Character management
      currentWord: '',
      currentCharacter: '',
      currentEnglish: [],
      currentPinyin: '',
      charIterator: 0,
      shuffledWords: [],
      
      // Stroke data
      strokeData: {
        medians: [],
        strokes: []
      },
      cachedStrokes: null,
      
      // Practice state
      skipState: 0,
      showPinyin: false,
      totalAnswered: 0,
      totalCorrect: 0,
      totalStrokeCount: 0,
      totalMistakeCount: 0,
      wordTotalStrokeCount: 0,
      wordTotalMistakeCount: 0,
      streakCount: 0,
      streakIncrement: 20,
      streakCheckpoint: 20,
      currentIndex: 0,
      
      // HanziPlotter instance
      plotter: null,
      
      // Theme state
      isDarkMode: false,
      themeObserver: null
    };
  },
  computed: {
    currentDeckName() {
      return this.decks[this.currentDeck]?.name || 'Loading...';
    },
    storeDecks() {
      // Combine static and custom dictionary data
      const staticData = this.$store.getters.getDictionaryData || {};
      const customData = this.$store.getters.getCustomDictionaryData || {};
      return { ...staticData, ...customData };
    },
    isDarkMode() {
      return document.documentElement.getAttribute('data-theme') === 'dark';
    },
    actionIcon() {
      return this.skipState ? 'fa-forward-step' : 'fa-eye';
    },
    actionText() {
      return this.skipState ? 'Next' : 'Show';
    },
    navIcon() {
      return this.skipState ? 'fa-rotate' : 'fa-backward-step';
    }
  },
  watch: {
    storeDecks: {
      handler(newDecks) {
        this.decks = newDecks;
        
        // If we have deck data, initialize
        if (Object.keys(this.decks).length > 0 && this.currentWord === '') {
          // Check URL parameter first
          const urlParams = new URLSearchParams(window.location.search);
          const deck = urlParams.get('wordlist');
          if (deck && this.decks[deck]) {
            this.currentDeck = deck;
          }
          this.loadNewWords();
        }
      },
      deep: true
    },
    currentDeck(newDeck) {
      this.updateUrlParam('wordlist', newDeck);
    },
    isDarkMode() {
      if (this.plotter) {
        // Update plotter colors when theme changes
        const colors = this.getThemeColors(this.isDarkMode);
        this.plotter.setColors(colors);
      }
    }
  },
  mounted() {
    // Check initial dark mode state
    this.isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Set up theme change observer
    this.setupThemeObserver();
    
    // Load decks from store
    this.loadDecksFromStore();
    
    // Set deck from URL parameters if available
    const urlParams = new URLSearchParams(window.location.search);
    const deck = urlParams.get('wordlist');
    if (deck && this.storeDecks[deck]) {
      this.currentDeck = deck;
    } else {
      this.updateUrlParam('wordlist', this.currentDeck);
    }
    
    // Set up event handlers
    document.addEventListener('click', this.handleOutsideClick);
    document.addEventListener('keydown', this.handleKeydown);
    
    // Initialize if decks are available
    if (Object.keys(this.storeDecks).length > 0) {
      this.loadNewWords();
    }
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('keydown', this.handleKeydown);
    
    // Clean up plotter instance
    if (this.plotter) {
      this.plotter.destroyy();
      this.plotter = null;
    }
  },
  methods: {
    getThemeColors(isDark) {
      return isDark 
        ? ['#ffffffee', '#ffffffee', '#cdb3dfdd', '#cdb3df'] 
        : ['#000000ee', '#000000aa', '#cdb3dfdd', '#cdb3df'];
    },
    
    initPlotter() {
      // Clean up existing plotter if any
      if (this.plotter) {
        this.plotter.destroyy();
        this.plotter = null;
      }
      
      const drawingArea = this.$refs.drawingArea;
      if (!drawingArea) return;
      
      // Clear any previous content
      drawingArea.innerHTML = '';
      
      // Create canvas element
      const canvas = document.createElement('canvas');
      const size = 800; // Standard size for the plotter
      canvas.width = size;
      canvas.height = size;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      drawingArea.appendChild(canvas);
      
      // Initialize plotter
      this.plotter = new HanziPlotter({
        character: this.currentCharacter,
        dimension: size,
        speed: 0.075,
        lineThickness: 8 * size / 200,
        jitterAmp: 0,
        colors: this.getThemeColors(this.isDarkMode),
        showDiagonals: true,
        clickAnimation: false,
        showGrid: true,
        useMask: true,
        blendMode: 'normal',
        canvas: canvas
      });
      
      // If we have stroke data, replace it in the plotter
      if (this.strokeData && this.strokeData.medians && this.strokeData.strokes) {
        this.plotter.replaceStrokes(
          this.currentCharacter, 
          this.strokeData.medians, 
          this.strokeData.strokes
        );
      }
      
      // Set up quiz mode
      this.setupQuizMode();
    },
    
    loadDecksFromStore() {
      this.decks = this.storeDecks;
    },
    
    toggleDeckOptions() {
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    
    handleOutsideClick(event) {
      if (!event.target.closest('.custom-dropdown')) {
        this.isDropdownOpen = false;
      }
    },
    
    handleKeydown(event) {
      if (event.key === 'h') {
        this.showHelp();
      } else if (event.key === 'r') {
        this.restartQuestion();
      } else if (event.key === 's') {
        this.skipOrNext();
      } else if (event.key === 'p') {
        this.previousCharacter();
      }
    },
    
    selectDeck(deckKey) {
      this.currentDeck = deckKey;
      this.isDropdownOpen = false;
      this.resetPractice();
      this.loadNewWords();
    },
    
    updateUrlParam(key, value) {
      const newUrl = new URL(window.location);
      newUrl.searchParams.set(key, value);
      history.pushState({}, '', newUrl);
    },
    
    resetPractice() {
      this.currentIndex = 0;
      this.totalCorrect = 0;
      this.totalAnswered = 0;
      this.wordTotalMistakeCount = 0;
      this.totalStrokeCount = 0;
      this.totalMistakeCount = 0;
      this.skipState = 0;
      this.streakCount = 0;
      this.streakCheckpoint = this.streakIncrement;
      this.charIterator = 0;
      this.shuffledWords = [];
    },
    
    shuffleArray(array) {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
    
    loadNewWords() {
      // Get the current deck data
      const deckData = this.decks[this.currentDeck];
      if (!deckData || !deckData.chars) {
        console.error('No deck data found for:', this.currentDeck);
        return;
      }
      
      // Extract character data from the deck
      let chars;
      if (Array.isArray(deckData.chars)) {
        chars = deckData.chars;
      } else {
        chars = Object.keys(deckData.chars);
      }
      
      // Shuffle the characters array
      this.shuffledWords = this.shuffleArray(chars);
      
      // Reset state
      this.skipState = 0;
      this.cachedStrokes = null;
      this.currentIndex = 0;
      
      // Show the first word
      this.showWord();
    },
    
    async loadStrokeData(character, onLoad=null) {
      try {
        // If we already have the character's stroke data cached, reuse it
        if (this.cachedStrokes && this.cachedStrokes.character === character) {
          if (onLoad) onLoad();
          return;
        }
        
        const response = await fetch(`/api/getStrokes/${character}`);
        if (!response.ok) {
          console.error('Network response was not ok for character:', character);  
          return;
        }
        
        const data = await response.json();
        this.cachedStrokes = data;
        this.cachedStrokes.character = character;
        
        if (onLoad) {
          onLoad();
        }
      } catch (error) {
        console.error('Error loading character data:', error);
      }
    },
    
    async showWord() {
      this.showPinyin = false;
      
      if (this.currentIndex < this.shuffledWords.length) {
        // Get the current word
        const currentWord = this.shuffledWords[this.currentIndex];
        
        // Set current word 
        this.currentWord = currentWord;
        
        // Get character position in word
        this.currentCharacter = currentWord[this.charIterator % currentWord.length];
        
        // Fetch character info (English, pinyin)
        await this.fetchCharacterInfo(this.currentWord);
        
        // Reset practice state for this word
        this.wordTotalMistakeCount = 0;
        this.wordTotalStrokeCount = 0;
        this.skipState = 0;
        
        // Load stroke data for current character
        await this.loadStrokeData(this.currentCharacter, () => {
          this.strokeData = this.cachedStrokes;
          this.initPlotter();
        });
        
        // Preload next character's stroke data
        const nextIdx = (this.currentIndex + 1) % this.shuffledWords.length;
        const nextWord = this.shuffledWords[nextIdx];
        const nextChar = nextWord[this.charIterator % nextWord.length];
        if (nextChar !== this.currentCharacter) {
          this.loadStrokeData(nextChar);
        }
      }
    },
    
    async fetchCharacterInfo(character) {
      try {
        const response = await fetch(`/api/get_simple_char_data?character=${encodeURIComponent(character)}`);
        const data = await response.json();
        this.currentPinyin = data.pinyin[0] || '';
        this.currentEnglish = data.english || [''];
        // for currentEnglish[0] do a split with "/" and if truncacte if there are mroe than 5 parts
        // also truncate parts that are longer than 20 characters
        this.currentEnglish[0] = this.currentEnglish[0]
          .split('/')
          .slice(0, 5)
          .map(part => part.length > 40 ? part.slice(0, 40) + '...' : part).join(' / ');
        
      } catch (error) {
        console.error('Error fetching character info:', error);
        this.currentPinyin = '';
        this.currentEnglish = [''];
      }
    },
    
    setupQuizMode() {
      if (!this.plotter) return;
      
      // Set up event tracking for strokes
      this.plotter.quiz({
        onComplete: (data) => {
          console.log('Quiz completed successfully!');
          this.handleQuizComplete(data);
        }
      });
      
      // Listen for stroke counting events
      this.wordTotalStrokeCount = this.strokeData.medians.length;
      this.totalStrokeCount += this.wordTotalStrokeCount;
    },
    
    handleQuizComplete(data) {
      // Handle correct answer
      this.totalCorrect++;
      this.totalAnswered++;
      this.skipState = 1;
      this.showPinyin = true;
      this.streakCount++;
      
      // Show confetti if streak milestone reached
      if (this.streakCount >= this.streakCheckpoint) {
        this.triggerConfetti(this.streakCount);
        this.streakCheckpoint += this.streakIncrement;
      }
      
      // Save user stroke data
      this.saveUserStrokeData(data);
    },
    
    handleMistake() {
      this.wordTotalMistakeCount++;
      this.totalMistakeCount++;
      this.streakCount = 0;
      this.streakCheckpoint = this.streakIncrement;
    },
    
    saveUserStrokeData(data) {
      // Normalize the stroke data
      const normalizedStrokes = data.strokes.map(stroke => {
        return stroke.map(point => ({
          x: point.x / 800, // Normalize to 0-1 range
          y: point.y / 800
        }));
      }).filter(stroke => stroke.length > 1);
      
      // Send the data to the server
      fetch('/api/save_stroke_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character: data.character,
          strokes: normalizedStrokes,
        }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        console.log('Stroke data saved successfully');
      })
      .catch(error => {
        console.error('There was a problem saving the data:', error);
      });
    },
    
    showHelp() {
      if (this.plotter) {
        this.plotter.helpMode();
      }
    },
    
    restartQuestion() {
      // Reset state for current question
      this.skipState = 0;
      this.showPinyin = false;
      
      // Restart the quiz in the plotter
      if (this.plotter) {
        this.plotter.stopAnimation();
        this.plotter.restartQuiz();
      }
    },
    
    skipOrNext() {
      if (this.skipState === 0) {
        // Currently in draw mode - perform "Show" action
        // Show the answer (give up)
        this.skipState = 1;
        this.showPinyin = true;
        this.totalAnswered++;
        
        if (this.plotter) {
          this.plotter.quizComplete = true;
          this.plotter.giveUp();
        }
        
        // Reset streak when skipping
        this.streakCount = 0;
        this.streakCheckpoint = this.streakIncrement;
      } else {
        // Currently in answer mode - perform "Next" action
        // Go to next character
        this.skipState = 0;
        this.currentIndex++;
        
        if (this.currentIndex >= this.shuffledWords.length) {
          // Wrap around to the beginning and increment the character iterator
          this.currentIndex = 0;
          this.charIterator++;
        }
        
        this.showWord();
      }
    },
    
    previousCharacter() {
        this.currentIndex--;
        
        if (this.currentIndex < 0) {
            this.currentIndex = this.shuffledWords.length - 1;
            if (this.charIterator > 0) {
            this.charIterator--;
            }
        }
        this.showWord();
    },
    
    contextAction() {
      // This is the method for the primary "Show/Next" button
      this.skipOrNext();
    },
    
    setupThemeObserver() {
      // Watch for theme attribute changes on document element
      this.themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-theme') {
            // Update isDarkMode flag when theme changes
            this.isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
            console.log('Theme changed, isDarkMode:', this.isDarkMode);
            
            // Update plotter with new theme colors if it exists
            if (this.plotter) {
              const colors = this.getThemeColors(this.isDarkMode);
              this.plotter.setColors(colors);
              
              // Instead of completely redrawing, just update the colors without showing the full character
              if (this.plotter.isQuizing && !this.plotter.quizComplete) {
                this.plotter.clearBg(); // Force redraw the background
                this.plotter.drawUserStrokes(); // Only redraw user strokes, not the full character
              } else {
                // If not in quiz mode or quiz is complete, we can safely redraw everything
                this.plotter.clearBg();
                this.plotter.draw();
              }
            }
          }
        });
      });
      
      // Start observing theme changes on document element
      this.themeObserver.observe(document.documentElement, { attributes: true });
    },
    
    triggerConfetti(count) {
      // Create and display a congratulatory message
      const container = document.getElementById('confetti-container');
      container.innerHTML = '';
      
      // Add congratulatory message
      const message = document.createElement('div');
      message.className = 'congrats';
      message.textContent = `Streak: ${count}! Great job!`;
      container.appendChild(message);
      
      // Create confetti pieces
      const colors = ['#ff4405', '#4CAF50', '#2196F3', '#FFEB3B', '#9C27B0', '#FF9800'];
      const confettiCount = Math.min(100, count * 5);
      
      for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Random confetti properties
        const size = Math.random() * 10 + 5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 3 + 2;
        const delay = Math.random() * 1.5;
        
        // Apply styles
        Object.assign(confetti.style, {
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          left: `${left}vw`,
          animationDuration: `${animationDuration}s`,
          animationDelay: `${delay}s`
        });
        
        container.appendChild(confetti);
      }
      
      // Remove confetti elements after animation completes
      setTimeout(() => {
        container.innerHTML = '';
      }, 6000);
    },
  }
});
</script>

<style scoped>
.practice-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 2em;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  box-sizing: border-box;
}

.practice-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--card-bg);
  border: var(--card-border);
  box-shadow: var(--card-shadow);
  box-sizing: border-box;
  padding: 1rem;
}

.deck-selector {
  margin-bottom: 1rem;
}

.custom-dropdown {
  position: relative;
  width: 100%;
  user-select: none;
  display: flex;
  justify-content: center;
}

#selected-deck {
  background-color: var(--btn-bg);
  color: var(--btn-fg);
  cursor: pointer;
  font-size: 1.5em;
  font-weight: bold;
  text-align: center;
  min-width: 200px;
  text-decoration: underline;
}

#selected-deck:hover {
  background-color: color-mix(in oklab, var(--fg) 6%, var(--bg) 75%);
}

#deck-options {
  position: absolute;
  top: 100%;
  width: 100%;
  max-width: 300px;
  max-height: 0;
  overflow: hidden;
  background-color: var(--bg);
  border: 2px solid #0000;
  margin-top: 5px;
  z-index: 1;
  transition: max-height 0.3s, border 0.3s;
}

#deck-options.show {
  max-height: 300px;
  overflow-y: auto;
  border: 2px solid color-mix(in oklab, var(--fg) 26%, var(--bg) 25%);
}

.option {
  padding: 10px 15px;
  cursor: pointer;
}

.option:hover {
  background-color: color-mix(in oklab, var(--fg) 6%, var(--bg) 75%);
}

.option.selected {
  background-color: var(--selected-bg);
}

.practice-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.word-display {
  margin-bottom: 1.5rem;
  text-align: center;
}

.full-word {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: center;
  min-height: 3.5rem;
}

.word-character {
  position: relative;
  width: 3rem;
  height: 3.5rem;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.current-character {
  /* border-bottom: 2px solid var(--accent-color); */
  border-bottom: 2px solid var(--fg);
}

.dim-character {
  opacity: 0.5;
}

.pinyin-label {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  min-height: 1.8rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.pinyin-label.active {
  opacity: 1;
}

.pinyin-label span.dimmed {
  opacity: 0.5;
}

.english-display {
  font-size: 1.1rem;
  color: var(--fg);
  margin-bottom: 1rem;
  min-height: 1.6rem;
}

.drawing-area {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1;
  margin-bottom: 1.5rem;
  border: 1px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 85%);
  border-radius: 5px;
  overflow: hidden;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  background-color: var(--btn-bg);
  color: var(--btn-fg);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
  transition: background-color 0.2s, transform 0.1s;
}

.btn:hover {
  /* background-color: var(--btn-hover-bg);
  transform: translateY(-1px); */
}

.btn:active {
  transform: translateY(1px);
}

/* Primary action button styles */
.primary-action {
  min-width: 100px;
  justify-content: center;
}

.action-reveal {
  /* background-color: var(--accent-color); */
    opacity: .9;
  color: var(--fg);
}

.action-reveal:hover {
    opacity: 1;
}

.action-next {
  /* background-color: #4caf81;
  background-color: var(--accent-color); */
  color: var(--fg);
    opacity: .9;
}

.action-next:hover {
    opacity: 1;
}

/* Navigation button styles */
.nav-previous {
  /* background-color: #adadad;
  background-color: var(--warning-color); */
    opacity: .9;
  color: var(--fg);
}

.nav-previous:hover {
    opacity: 1;
}

.nav-reset {
    opacity: .9;
  /* background-color: var(--danger-color); */
  color: var(--fg);
}

.nav-reset:hover {
    opacity: 1;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid color-mix(in oklab, var(--fg) 10%, var(--bg) 90%);
  font-size: 0.9rem;
  color: var(--fg);
}

#confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
  overflow: hidden;
}

.confetti {
  position: absolute;
  top: -10vh;
  animation: fall linear forwards;
}

.congrats {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 95%);
  padding: 1rem 2rem;
  border-radius: 10px;
  font-size: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  animation: pop 0.5s ease;
  z-index: 1001;
}

@keyframes fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

@keyframes pop {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

@media (max-width: 600px) {
  .practice-container {
    padding: 1rem;
  }
  
  .control-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}

/* Enhanced responsive design for smaller screens */
@media (max-width: 784px) {
  .practice-view {
    padding: 10px;
    margin-top: 1rem;
  }
  
  .practice-container {
    width: 90vw;
    border: none;
    box-shadow: none;
  }
  
  .full-word {
    font-size: 1.7rem;
  }
  
  .word-character {
    width: 2.5rem;
    height: 3rem;
  }
  
  .pinyin-label {
    font-size: 1rem;
  }
  
  .english-display {
    font-size: 0.9rem;
  }
  
  .drawing-area {
    max-width: none;
    width: 90%;
  }
  
  .progress-info {
    font-size: 0.8rem;
  }
}
</style>