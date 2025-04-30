<template>
  <BasePage page_title="Handwritten Character Search" />
  <div class="drawing-view">
    <div class="drawing-container">
      <canvas 
        ref="drawingCanvas" 
        class="drawing-canvas"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="stopDrawing"
      ></canvas>
      <div class="drawing-controls">
        <button @click="clearCanvas" class="control-button clear-button">Clear</button>
        <button @click="undoStroke" class="control-button undo-button">Undo</button>
      </div>
    </div>
    <div v-if="isLoading" class="loading-indicator">
      searching...
    </div>
    <div v-else class="results-container">
      <PreloadWrapper
        v-for="(result, index) in results"
        :key="index"
        :character="result.character"
        class="result-wrapper"
      >
        <div class="result-cell">
          <div class="rhanzi">{{ result.character }}</div>
        </div>
      </PreloadWrapper>
    </div>
  </div>
</template>

<script>
import BasePage from '../components/BasePage.vue';
import PreloadWrapper from '../components/PreloadWrapper.vue';

export default {
  components: {
    BasePage,
    PreloadWrapper,
  },
  data() {
    return {
      canvas: null,
      ctx: null,
      isDrawing: false,
      lastX: 0,
      lastY: 0,
      results: [],
      isLoading: false,
      hanzilookupReady: false,
      scriptLoaded: false,
      isDarkMode: false,
      // Track strokes for undo functionality
      strokes: [],
      currentStroke: []
    };
  },
  mounted() {
    this.initCanvas();
    this.loadHanziLookupScript();
    this.setupThemeObserver();
    this.isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    this.drawCanvasBg();
  },
  methods: {
    setupThemeObserver() {
      // Watch for theme attribute changes on document element
      this.themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-theme') {
            // Update isDarkMode flag when theme changes
            this.isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
            console.log('Theme changed, isDarkMode:', this.isDarkMode);
            
            // Update stroke style based on theme
            this.updateStrokeStyle();
            // Redraw canvas with new theme
            this.redrawCanvas();
          }
        });
      });
      
      // Start observing
      this.themeObserver.observe(document.documentElement, { attributes: true });
    },
    
    updateStrokeStyle() {
      if (this.ctx) {
        this.ctx.strokeStyle = this.isDarkMode ? '#fff' : '#000';
      }
    },
    
    loadHanziLookupScript() {
      // Dynamically load the HanziLookup script
      const script = document.createElement('script');
      script.src = '/lib/hanzilookup/hanzilookup.min.js';
      script.async = true;
      script.onload = () => {
        console.log('HanziLookup script loaded');
        this.scriptLoaded = true;
        this.initHanziLookup();
      };
      script.onerror = () => {
        console.error('Failed to load HanziLookup script');
      };
      document.head.appendChild(script);
    },
    
    initHanziLookup() {
      // Initialize HanziLookup with data files
      if (window.HanziLookup) {
        // Define a counter for tracking loaded files
        let loadedFiles = 0;
        
        const fileLoaded = (success) => {
          if (success) {
            loadedFiles++;
            // Mark as ready when both files are loaded
            if (loadedFiles === 2) {
              this.hanzilookupReady = true;
              console.log('HanziLookup initialized successfully');
            }
          } else {
            console.error('Failed to load HanziLookup data file');
          }
        };
        
        // Initialize with both data files
        window.HanziLookup.init("mmah", "/lib/hanzilookup/mmah.json", fileLoaded);
        window.HanziLookup.init("orig", "/lib/hanzilookup/orig.json", fileLoaded);
      } else {
        console.error('HanziLookup library not found');
      }
    },
    
    initCanvas() {
      this.canvas = this.$refs.drawingCanvas;
      this.ctx = this.canvas.getContext('2d');
      
      this.resizeCanvas();
      window.addEventListener('resize', this.resizeCanvas);
      
      this.ctx.lineJoin = 'round';
      this.ctx.lineCap = 'round';
      this.ctx.lineWidth = 8;
      this.isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
      this.ctx.strokeStyle = this.isDarkMode ? '#fff' : '#000';

    },
    
    resizeCanvas() {
      const container = this.canvas.parentElement;
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientWidth; // Square canvas
    },
    
    startDrawing(e) {
      this.isDrawing = true;
      const x = e.offsetX || e.clientX - this.canvas.offsetLeft;
      const y = e.offsetY || e.clientY - this.canvas.offsetTop;
      
      [this.lastX, this.lastY] = [x, y];
      
      // Start a new stroke
      this.currentStroke = [{x, y}];
    },
    
    draw(e) {
      if (!this.isDrawing) return;
      
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      
      const x = e.offsetX || e.clientX - this.canvas.offsetLeft;
      const y = e.offsetY || e.clientY - this.canvas.offsetTop;
      
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      
      [this.lastX, this.lastY] = [x, y];
      
      // Add point to current stroke
      this.currentStroke.push({x, y});
    },
    
    stopDrawing() {
      if (this.isDrawing) {
        this.isDrawing = false;
        
        // Save completed stroke if it has points
        if (this.currentStroke.length > 0) {
          this.strokes.push([...this.currentStroke]);
          this.currentStroke = [];
          
          // Automatically search after each stroke
          this.searchByDrawing();
        }
      }
    },
    
    handleTouchStart(e) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      this.isDrawing = true;
      [this.lastX, this.lastY] = [x, y];
      
      // Start a new stroke
      this.currentStroke = [{x, y}];
    },
    
    handleTouchMove(e) {
      e.preventDefault();
      if (!this.isDrawing) return;
      
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      
      [this.lastX, this.lastY] = [x, y];
      
      // Add point to current stroke
      this.currentStroke.push({x, y});
    },

    drawCanvasBg(){
      this.ctx.save();
      this.ctx.strokeStyle = this.isDarkMode ? '#fff5' : '#0005';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(this.canvas.width, this.canvas.height);
      this.ctx.moveTo(this.canvas.width, 0);
      this.ctx.lineTo(0, this.canvas.height);
      this.ctx.stroke();
      this.ctx.closePath();
      this.ctx.restore();
    },
    
    clearCanvas() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawCanvasBg();

      this.strokes = [];
      this.currentStroke = [];
      this.results = [];
    },
    
    undoStroke() {
      if (this.strokes.length > 0) {
        // Remove the last stroke
        this.strokes.pop();
        
        // Redraw the canvas with remaining strokes
        this.redrawCanvas();
        
        // Update search results based on current drawing
        if (this.strokes.length > 0) {
          this.searchByDrawing();
        } else {
          this.results = [];
        }
      }
    },
    
    redrawCanvas() {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawCanvasBg();
      // Update stroke style before redrawing
      this.updateStrokeStyle();
      
      // Redraw all strokes
      for (const stroke of this.strokes) {
        if (stroke.length < 2) continue;
        
        this.ctx.beginPath();
        this.ctx.moveTo(stroke[0].x, stroke[0].y);
        
        for (let i = 1; i < stroke.length; i++) {
          this.ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        
        this.ctx.stroke();
      }
    },
    
    convertStrokesToHanziLookupFormat() {
      // HanziLookup expects strokes as arrays of [x, y] coordinates
      return this.strokes.map(stroke => 
        stroke.map(point => [point.x, point.y])
      );
    },
    
    searchByDrawing() {
      this.isLoading = true;
      
      if (this.hanzilookupReady && window.HanziLookup) {
        // Convert strokes to HanziLookup format
        const hanzilookupStrokes = this.convertStrokesToHanziLookupFormat();
        
        try {
          // Create analyzed character from strokes
          const analyzedChar = new window.HanziLookup.AnalyzedCharacter(hanzilookupStrokes);
          
          // Look up with MMAH data first (usually better results)
          const matcherMMAH = new window.HanziLookup.Matcher("mmah");
          matcherMMAH.match(analyzedChar, 8, (matches) => {
            // If we have results from MMAH, use those
            if (matches && matches.length > 0) {
              this.processHanziLookupResults(matches);
            } else {
              // Fallback to original data
              const matcherOrig = new window.HanziLookup.Matcher("orig");
              matcherOrig.match(analyzedChar, 8, (matchesOrig) => {
                this.processHanziLookupResults(matchesOrig);
              });
            }
          });
        } catch (error) {
          console.error('Error in HanziLookup processing:', error);
          this.showNoResults();
        }
      } else {
        this.isLoading = true;
        setTimeout(() => {
          if (!this.hanzilookupReady) {
            this.showNoResults();
          }
        }, 2000);
      }
    },
    
    processHanziLookupResults(matches) {
      if (matches && matches.length > 0) {
        // Format results to match our expected structure
        this.results = matches.map(match => ({
          character: match.character
        }));
      } else {
        this.showNoResults();
      }
      this.isLoading = false;
    },
    
    showNoResults() {
      // Show an empty result set when no matches are found
      this.results = [];
      this.isLoading = false;
    }
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.resizeCanvas);
    
    // Clean up theme observer
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
    
    // Clean up HanziLookup when component is unmounted
    if (window.HanziLookup && window.HanziLookup._data) {
      // Only attempt to delete data if it exists
      if (window.HanziLookup._data.mmah) {
        delete window.HanziLookup._data.mmah;
      }
      if (window.HanziLookup._data.orig) {
        delete window.HanziLookup._data.orig;
      }
    }
  }
};
</script>

<style scoped>
.drawing-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}

.drawing-container {
  width: 100%;
  max-width: 400px;
  margin-bottom: 2rem;
}

.drawing-canvas {
  width: 100%;
  background-color: var(--bg);
  border: var(--card-border);
  box-shadow: var(--card-shadow);
  cursor: crosshair;
  touch-action: none; /* Prevents browser handling of touch events */
}

.drawing-controls {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  gap: 1rem;
}

.control-button {
  flex: 1;
  padding: 0.8rem 1.2rem;
  font-size: 1rem;
  background-color: var(--card-bg);
  color: var(--fg);
  border: var(--card-border);
  cursor: pointer;
  transition: background-color 0.2s;
}

.control-button:hover {
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
}

.loading-indicator {
  margin-top: 2rem;
  font-size: 1.5rem;
  color: var(--fg);
  opacity: 0.8;
}

.results-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
  justify-content: center;
  max-width: 600px;
  margin-top: 1rem;
}

.result-wrapper {
  flex: 0 0 auto;
  width: auto;
}

.result-cell {
  border: var(--card-border);
  box-shadow: var(--card-shadow);
  padding: 1rem;
  font-family: inherit;
  text-align: center;
  background: var(--card-bg);
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  min-width: 80px;
  height: 80px;
}

.result-cell:hover {
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  cursor: pointer;
}

.rhanzi {
  font-size: 2rem;
  font-family: Kaiti, 'Noto Sans SC', sans-serif;
}

@media (max-width: 600px) {
  .drawing-view {
    padding: 1rem;
  }
  
  .results-container {
    justify-content: center;
  }
  
  .result-cell {
    min-width: 70px;
    height: 70px;
  }
  
  .rhanzi {
    font-size: 1.8rem;
  }
}
</style>