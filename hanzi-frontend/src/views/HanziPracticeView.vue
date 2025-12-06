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
              v-for="(deck, key) in storeDecks" 
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
          <!--<div class="full-word">
            <span v-if="skipState" class="word-character current-character">
              {{ currentWord[currentQuizItem?.charIndex] }}
            </span>
          </div>-->
          <div class="pinyin-label" :class="{ 'active': showPinyin }">
            <span v-for="(word, idx) in displayCurrentPinyin.split(' ')" :key="idx" :class="{ 'dimmed': idx !== currentQuizItem?.charIndex }">
              {{ $toAccentedPinyin(word) }} <span v-if="idx < currentWord.length - 1"> </span>
            </span>
          </div>
          <div class="english-display">
            <span v-for="(part, idx) in displayEnglishParts" :key="idx" :class="{ 'dimmed': currentWord.length > 1 && idx !== currentQuizItem?.charIndex }">
              {{ part }} <span v-if="idx < displayEnglishParts.length - 1">/</span>
            </span>
          </div>
        </div>

        <div class="drawing-area" ref="drawingArea">
          <canvas id="plotter-canvas" ref="plotterCanvas"></canvas>
        </div>

        <div class="control-buttons">
          <div v-if="!skipState">
              <!-- <button :style="{ opacity: skipState ? 0 : 1 }" @click="showHelp" class="btn nav-help"> -->
                <button :class="{ greyed: skipState }" @click="showHelp" class="btn nav-help">
                Help
                </button>
              </div>
              <div v-else>
                <button :class="{ greyed: skipState }" @click="showHelp" class="btn nav-help">
                Help
                </button>
         </div>
          <div v-if="!skipState">
            <button @click="previousCharacter" class="btn nav-previous">
              Previous
            </button>
          </div>
          <div v-else>
            <button @click="previousCharacter" class="btn nav-previous">
              Previous
            </button>
         </div>
          <button id="action-btn" @click="contextAction" class="btn primary-action"
            :class="{ 'action-reveal': !skipState, 'action-next': skipState }">
            {{ actionText }}
          </button>
          <button @click="restartQuestion" class="btn nav-restart">
            Clear
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
    const urlParams = new URLSearchParams(window.location.search);
    const deckFromUrl = urlParams.get('wordlist');
    
    return {
      currentDeck: deckFromUrl || 'hsk1',
      isDropdownOpen: false,
      
      currentWord: '',
      currentCharacter: '',
      currentEnglish: [],
      currentPinyin: '',
      charIterator: 0,
      shuffledWords: [],
      
      strokeData: {
        medians: [],
        strokes: []
      },
      cachedStrokes: null, 
      strokeCache: {}, 
      charInfoCache: {},
      isLoading: true,
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
      themeObserver: null,
      
      // Quiz state
      quizOrder: [], // Flat list of { word, char, charIndex }
      currentQuizItem: null, // { word, char, charIndex }
    };
  },
  computed: {
    currentDeckName() {
      return this.storeDecks[this.currentDeck]?.name || 'Loading...';
    },
    storeDecks() {
      // Combine static and custom dictionary data
      const staticData = this.$store.getters.getDictionaryData || {};
      const customData = this.$store.getters.getCustomDictionaryData || {};
      return { ...staticData, ...customData };
    },
    actionIcon() {
      return this.skipState ? 'fa-forward-step' : 'fa-eye';
    },
    actionText() {
      return this.skipState ? 'Next' : 'Reveal';
    },
    navIcon() {
      return this.skipState ? 'fa-rotate' : 'fa-backward-step';
    },
    customDefCurrent() {
      try {
        const h = this.currentWord;
        const getter = this.$store.getters.getCustomDefinition;
        return h && getter ? getter(h) : null;
      } catch (e) { return null; }
    },
    displayCurrentPinyin() {
      const base = this.currentPinyin || '';
      const custom = this.customDefCurrent && this.customDefCurrent.pinyin ? this.customDefCurrent.pinyin : '';
      return (custom || base) || '';
    },
    displayEnglishParts() {
      const base = Array.isArray(this.currentEnglish) ? this.currentEnglish : [];
      const custom = this.customDefCurrent && this.customDefCurrent.english ? this.customDefCurrent.english : '';
      return (custom ? [custom] : base);
    }
  },
  watch: {
    storeDecks: {
      handler(newDecks) {
        // If we have deck data, initialize
        if (Object.keys(newDecks).length > 0 && this.currentWord === '') {
          // Check URL parameter first
          const urlParams = new URLSearchParams(window.location.search);
          const deck = urlParams.get('wordlist');
          if (deck && newDecks[deck]) {
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
        const colors = this.getThemeColors(document.documentElement.getAttribute('data-theme'));
        this.plotter.setColors(colors);
      }
    }
    ,
    currentWord(newVal) {
      if (this.$store.getters.isLoggedIn && newVal) {
        this.$store.dispatch('fetchCustomDefinition', newVal);
      }
    }

  },
  mounted() {
    // Check initial dark mode state
    this.isDarkMode = ['dark', 'theme2'].includes(document.documentElement.getAttribute('data-theme'));
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
    // Preload custom def for current word if available
    if (this.$store.getters.isLoggedIn && this.currentWord) {
      this.$store.dispatch('fetchCustomDefinition', this.currentWord);
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
    getThemeColors(theme) {
      if(theme === 'dark') {
        return ['#ffffffee', '#ffffff77', '#cdb3dfdd', '#151515'];
      }
      if(theme === 'light') {
        return ['#000000ee', '#00000077', '#cdb3dfdd', '#f3f3f3'];
      }
      if(theme === 'theme1') {
        return ['#000000ee', '#00000077', '#cdb3dfdd', '#f3f3f3'];
      }
      if(theme === 'theme2') {
        return ['#ffffffee', '#ffffff77', '#cdb3dfdd', '#151515'];
      }
    },
    
    initPlotter() {
      // Clean up existing plotter if any
      if (this.plotter) {
        this.plotter.destroyy();
        this.plotter = null;
      }
      
      const canvas = this.$refs.plotterCanvas;
      if (!canvas) return;

      canvas.width = 800;
      canvas.height = 800;
      
      // Initialize plotter with the canvas from the template
      this.plotter = new HanziPlotter({
        character: this.currentCharacter,
        dimension: 800,
        speed: 0.075,
        lineThickness: 8 * 800 / 200,
        gridThickness: 1,
        jitterAmp: 0,
        colors: this.getThemeColors(document.documentElement.getAttribute('data-theme')),
        showDiagonals: true,
        showGrid: false,
        clickAnimation: false,
        clearBackground: true,
        useMask: true,
        blendMode: 'normal',
        canvas: canvas,
        dontLoadIfMissing: true,
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
    
    initPlotterWithExistingData() {
      const canvas = this.$refs.plotterCanvas;
      if (!canvas) return;

      canvas.width = 800;
      canvas.height = 800;

      if (this.plotter) {
        // Reuse the existing plotter, just replace strokes
        this.plotter.replaceStrokes(
          this.currentCharacter,
          this.strokeData.medians,
          this.strokeData.strokes
        );
      } else {
        // Create a new plotter if one doesn't exist
        this.plotter = new HanziPlotter({
          character: '', // Use empty string to prevent auto-loading
          dimension: 800,
          speed: 0.075,
          lineThickness: 8 * 800 / 200,
          gridThickness: 1,
          jitterAmp: 0,
          colors: this.getThemeColors(document.documentElement.getAttribute('data-theme')),
          showDiagonals: true,
          showGrid: false,
          clickAnimation: false,
          clearBackground: true,
          useMask: true,
          blendMode: 'normal',
          canvas: canvas,
          dontLoadIfMissing: true,
        });
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
      // No-op, decks are always accessed via computed property
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
    
    flattenAndShuffleWords(words) {
      // words: array of strings (words)
      // Shuffle words, then flatten to [{word, char, charIndex}]
      const shuffled = this.shuffleArray(words);
      const flat = [];
      for (const word of shuffled) {
        for (let i = 0; i < word.length; i++) {
          flat.push({ word, char: word[i], charIndex: i });
        }
      }
      return flat;
    },
    
    shuffleArray(array) {
      const storeCache = this.$store.getters.getPracticeCharCache;
      const result = [...array];
      
      // Find if any character is already preloaded in the store
      // Only check for stroke data since we now get character info from dictionary
      const preloadedChar = result.find(char => storeCache.strokeData[char]);
      
      if (preloadedChar) {
        // If we have a preloaded character, make sure it's the first one
        const index = result.indexOf(preloadedChar);
        if (index > 0) {
          // Move preloaded character to the beginning
          result.splice(index, 1);
          result.unshift(preloadedChar);
        }
        // Skip shuffling the first character, only shuffle the rest
        const firstChar = result[0];
        const restChars = result.slice(1);
        
        for (let i = restChars.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [restChars[i], restChars[j]] = [restChars[j], restChars[i]];
        }
        
        return [firstChar, ...restChars];
      }
      
      // Regular shuffle if no preloaded characters
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
    
    loadNewWords() {
      // Get the current deck data
      const deckData = this.storeDecks[this.currentDeck];
      if (!deckData || !deckData.chars) {
        return;
      }
      console.log('Loading new words from deck:', this.currentDeck);
      let words;
      if (Array.isArray(deckData.chars)) {
        words = deckData.chars;
      } else {
        words = Object.keys(deckData.chars);
      }
      this.quizOrder = this.flattenAndShuffleWords(words);
      this.currentIndex = 0;
      this.skipState = 0;
      this.cachedStrokes = null;
      this.showWord();
    },
    
    async showWord() {
      this.showPinyin = false;
      if (this.currentIndex < this.quizOrder.length) {
        const quizItem = this.quizOrder[this.currentIndex];
        this.currentQuizItem = quizItem;
        this.currentWord = quizItem.word;
        this.currentCharacter = quizItem.char;
        
        // Reset practice state for this word
        this.wordTotalMistakeCount = 0;
        this.wordTotalStrokeCount = 0;
        this.skipState = 0;
        
        // First check if stroke data already exists in the store cache before showing loading state
        const storeCache = this.$store.getters.getPracticeCharCache;
        const hasStrokeDataInStore = storeCache.strokeData[this.currentCharacter];
        
        // Only show loading state if we need to fetch stroke data
        if (!hasStrokeDataInStore) {
          this.isLoading = true;
        } else {
          this.isLoading = false;
        }
        
        // Load character data (stroke data and get character info from dictionary)
        const { strokeData, infoData } = await this.preloadCharacterData(quizItem.char, quizItem.word);
        
        // Process stroke data
        if (strokeData) {
          this.strokeData = strokeData;
          
          // Initialize the plotter or reuse existing one
          if (this.$refs.plotterCanvas) {
            this.initPlotterWithExistingData();
          }
        }
        
        console.log("Stroke data and info data loaded for character:", quizItem.char, infoData);
        // Process character info data
        if (infoData) {
          // infoData.pinyin is array, infoData.english is array
          // Use the first pinyin/english for display
          this.currentPinyin = infoData.pinyin[0] || '';
          this.currentEnglish = infoData.english || [''];
          this.currentEnglish[0] = this.currentEnglish[0]
            .split('/')
            .slice(0, 5)
            .map(part => part.length > 40 ? part.slice(0, 40) + '...' : part).join(' / ');
        }
        
        // Set loading state to false after data is processed
        this.isLoading = false;
        
        // Preload next char's stroke data
        const nextIdx = (this.currentIndex + 1) % this.quizOrder.length;
        const nextQuizItem = this.quizOrder[nextIdx];
        if (nextQuizItem && nextQuizItem.char !== quizItem.char) {
          this.preloadCharacterData(nextQuizItem.char, nextQuizItem.word);
        }
      }
    },
    
    async preloadCharacterData(character, word) {
      try {
        // First check if stroke data already exists in the store cache
        const storeCache = this.$store.getters.getPracticeCharCache;
        const hasStrokeDataInStore = storeCache.strokeData[character];
        const hasInfoDataInStore = storeCache.infoData[character];
        // Get info for the full word, not just the char
        const dictData = this.storeDecks || {};
        let charInfo = null;
        for (const category in dictData) {
          const categoryData = dictData[category];
          if (categoryData && categoryData.chars) {
            const chars = categoryData.chars;
            if (Array.isArray(chars)) {
              // chars is array of objects with 'character' property (word)
              const found = chars.find(entry => entry.character === word);
              if (found) { charInfo = found; break; }
            } else if (typeof chars === 'object') {
              if (chars[word]) {  charInfo = chars[word]; break; }
            }
          }
        }
        // Cache char info if not already cached
        if (charInfo && !hasInfoDataInStore) {
          this.$store.commit('SET_PRACTICE_CHARACTER_INFO_DATA', { character, data: charInfo });
        }
        // If stroke data is already cached, use it
        const strokePromise = hasStrokeDataInStore 
          ? Promise.resolve(storeCache.strokeData[character])
          : this.strokeCache[character] 
            ? Promise.resolve(this.strokeCache[character])
            : fetch(`/api/getStrokes?character=${character}`).then(response => {
                if (!response.ok) {
                  console.error('Network response was not ok for character:', character);
                  return null;
                }
                return response.json();
              });
        // Get stroke data
        const strokeData = await strokePromise;
        // Store stroke data in component cache if it wasn't already there
        if (strokeData && !this.strokeCache[character]) {
          strokeData.character = character;
          this.strokeCache[character] = strokeData;
          // Also update store cache if needed
          if (!hasStrokeDataInStore) {
            this.$store.commit('SET_PRACTICE_CHARACTER_STROKE_DATA', { character, data: strokeData });
          }
        }
        return { 
          strokeData, 
          infoData: charInfo // Return character info from dictionary instead of separate API call
        };
      } catch (error) {
        console.error('Error preloading character data:', error);
        return { strokeData: null, infoData: null };
      }
    },
    
    setupQuizMode() {
      if (!this.plotter) return;
      
      // Set up event tracking for strokes
      this.plotter.quiz({
        onComplete: (data) => {
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
      // this.saveUserStrokeData(data);
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
      if (this.plotter && this.plotter.loadPromise && 
        this.plotter.loadPromise instanceof Promise && 
        this.plotter.loadPromise.isPending) {
        return;
    }
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
        if (this.currentIndex >= this.quizOrder.length) {
          this.currentIndex = 0; // Loop to first
        } else {
        }
        // Ensure all animations are stopped before showing next word
        if (this.plotter) {
          this.plotter.stopAnimation();
          this.plotter.demoMode = false;
          this.plotter.isQuizing = false;
          this.plotter.quizComplete = false;
          this.plotter.isAnimating = false;
          this.plotter.isAnimatingStroke = false;
          this.plotter.isAnimatingInterp = false;
          if (this.plotter.animationFrame) {
            cancelAnimationFrame(this.plotter.animationFrame);
            this.plotter.animationFrame = null;
          }
          if (this.plotter.strokeAnimationFrame) {
            cancelAnimationFrame(this.plotter.strokeAnimationFrame);
            this.plotter.strokeAnimationFrame = null;
          }
          if (this.plotter.interpAnimFrame) {
            cancelAnimationFrame(this.plotter.interpAnimFrame);
            this.plotter.interpAnimFrame = null;
          }
          if (this.plotter.demoAnimationFrame) {
            cancelAnimationFrame(this.plotter.demoAnimationFrame);
            this.plotter.demoAnimationFrame = null;
          }
        }
        this.showWord();
      }
    },
    
    previousCharacter() {
      // Only go back if not at the first element
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.showWord();
      } else {
      }
    },
    
    contextAction() {
      // This is the method for the primary "Show/Next" button
      if (this.skipState === 0 && this.plotter && this.plotter.demoMode) {
        // If in help mode animation (fade), cancel it first to prevent interference
        this.plotter.demoMode = false;
        if (this.plotter.demoAnimationFrame) {
          cancelAnimationFrame(this.plotter.demoAnimationFrame);
          this.plotter.demoAnimationFrame = null;
        }
        // Clear the canvas to prevent blitzing
        this.plotter.clearBg();
      }
      
      this.skipOrNext();
    },
    
    setupThemeObserver() {
      // Watch for theme attribute changes on document element
      this.themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-theme') {
            // Update isDarkMode flag when theme changes
            this.isDarkMode = ['dark', 'theme2'].includes(document.documentElement.getAttribute('data-theme'));
            
            // Update plotter with new theme colors if it exists
            if (this.plotter) {
              const colors = this.getThemeColors(document.documentElement.getAttribute('data-theme'));
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


<style>

:root {
  --plotter-bg: #dedede;
}

[data-theme="dark"] {
  --plotter-bg: #151515;
}

[data-theme="theme2"] {
  --plotter-bg: #141b16;
}

</style>

<style scoped>

#plotter-canvas {
}

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
  /* background-color: var(--card-bg);
  border: var(--card-border);
  box-shadow: var(--card-shadow); */
  box-sizing: border-box;
  /* padding: 1rem; */
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
  background-color: var(--bg);
  color: var(--fg);
  cursor: pointer;
  background-color: var(--bg);
  color: var(--fg);
  cursor: pointer;
  font-size: 1.5em;
  font-weight: bold;
  text-align: center;
  min-width: 200px;
  text-decoration: underline;
  font-family: var(--second-font);
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
  border: var(--thin-border-width) solid #0000;
  margin-top: 5px;
  z-index: 1;
  /* transition: max-height 0.3s, border 0.3s; */
}

#deck-options.show {
  max-height: 300px;
  overflow-y: auto;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 26%, var(--bg) 25%);
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

#plotter-canvas {
  width: 100%;
  height: 100%;
  box-shadow: var(--card-shadow);
  
  border: var(--card-border);
  border-radius: var(--modal-border-radius, 0);
  background-color: var(--plotter-bg);
  box-sizing: border-box;
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
  /* border-bottom: 2px solid var(--fg); */
}

.dim-character {
  opacity: 0.5;
}

.pinyin-label {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  min-height: 1.8rem;
  /* opacity: 0; */
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
  opacity: 0.6;
  margin-bottom: 1rem;
  min-height: 1.6rem;
}

.drawing-area {
  width: 100%;
  max-width: 50vh;
  aspect-ratio: 1;
  margin-bottom: 1.5rem;
  /* overflow: hidden; */
  position: relative;
}

.drawing-area.loading canvas {
  opacity: 0.5;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(0, 0, 0, 0.1);
  border-top: 5px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
  /* flex-wrap: wrap; */
}

.btn {
  padding: 0.5rem 1rem;
  background-color: var(--bg);
  color: var(--fg);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
  transition: background-color 0.2s, transform 0.1s, box-shadow 0.1s;
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
}

/* Enhanced responsive design for smaller screens */
@media (max-width: 784px) {
  .practice-container {
    padding: 1rem;
  }
  
  .practice-area {
    padding: 0em 1em;
  }
  
  .control-buttons {
    /* flex-direction: column; */
    gap: 0.5rem;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
    font-size: 1.25em;
  }
  
  .practice-view {
    padding: 0;
    margin-top: 1rem;
  }
  
  .practice-container {
    width: 100%;
    margin: 0;
    padding: 0;
    border: none;
    box-shadow: none;
  }
  
  .control-buttons {
    font-size: 0.5rem;
    box-sizing: border-box;
  }

  .full-word {
    font-size: 1.7rem;
  }
  
  .word-character {
    width: 2.5rem;
    height: 3rem;
  }
  
  .pinyin-label {
    font-size: 1em;
  }
  
  .english-display {
    font-size: 1em;
    margin-bottom: 0;
  }
  
  .word-display {
  }
  
  .drawing-area {
  }
  
  .progress-info {
    font-size: 0.8rem;
    width: 90%;
  }
}
</style>
