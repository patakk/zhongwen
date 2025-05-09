<template>
  <BasePage page_title="Flashcards" />
  <div class="flashcards-view">
    <div id="flashcard_container">
      <div id="flashcard" ref="flashcard" @click="revealOrNew">
        <div class="top-buttons">
          <div class="custom-dropdown" @click.stop>
            <div 
              id="selected-deck" 
              @click.stop="isSubmenuOpen = !isSubmenuOpen"
            >
              {{ currentDeckName }}
            </div>
            <div 
              id="deck-options" 
              :class="{ 'show': isSubmenuOpen }"
            >
              <div 
                v-for="(deck, key) in decks" 
                :key="key" 
                class="option"
                :class="{ 'selected': currentDeck === key }"
                @click.stop="changeDeck(key)"
              >
                {{ deck.name }}
              </div>
            </div>
          </div>
        </div>
        <div class="hanzi">
          <!-- Canvas will be appended here programmatically -->
        </div>
        <div class="answer" :class="{ inactive: !revealed }">
          <div class="pinyin">{{ singlePinyin }}</div>
          <div class="english">{{ singleEnglish.split("/")[0] }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BasePage from '../components/BasePage.vue';

export default {
  components: {
    BasePage
  },
  data() {
    // Get URL parameter first before setting default
    const urlParams = new URLSearchParams(window.location.search);
    const deckFromUrl = urlParams.get('wordlist');
    
    return {
      canvas: null,
      ctx: null,
      revealed: false,
      currentWord: '',
      nextWord: '',
      currentWordInfo: {
        character: '',
        pinyin: [],
        english: [],
        strokes: []
      },
      nextWordInfo: {
        character: '',
        pinyin: [],
        english: [],
        strokes: []
      },
      prevWordInfo: {
        character: '',
        pinyin: [],
        english: [],
        strokes: []
      },
      currentIndexInDeck: 0,
      currentDeck: deckFromUrl || 'hsk1', // Use URL param if available, otherwise default
      currentFont: 'Noto Sans',
      isSubmenuOpen: false,
      lineWidth: 6,
      lineType: 'round',
      isDarkMode: false,
      decks: {} // Will be populated from store
    };
  },
  computed: {
    currentDeckName() {
      return this.decks[this.currentDeck]?.name || '';
    },
    singlePinyin() {
      return this.$toAccentedPinyin(this.currentWordInfo.pinyin[0]) || '';
    },
    singleEnglish() {
      return this.$toAccentedPinyin(this.currentWordInfo.english[0]) || '';
    },
    // Get decks from store
    storeDecks() {
      // Combine static and custom dictionary data
      const staticData = this.$store.getters.getDictionaryData || {};
      const customData = this.$store.getters.getCustomDictionaryData || {};

      // Return combined dictionary data
      return { ...staticData, ...customData };
    }
  },
  watch: {
    // Watch for changes in storeDecks
    storeDecks: {
      handler(newDecks) {
        this.decks = newDecks;
        
        // If we didn't have deck data before, initialize now
        if (Object.keys(this.decks).length > 0 && this.currentWord === '') {
          // Check URL parameter first
          const urlParams = new URLSearchParams(window.location.search);
          const deck = urlParams.get('wordlist');
          if (deck && this.decks[deck]) {
            this.currentDeck = deck;
          }
          
          this.shuffleDeck();
          this.getNewWord();
        }
      },
      deep: true
    },
    
    // Watch for deck changes to update URL
    currentDeck(newDeck) {
      this.updateUrlParam('wordlist', newDeck);
    }
  },
  mounted() {
    // Initialize
    this.setupCanvas();
    this.isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' || document.documentElement.getAttribute('data-theme') === 'theme2';
    
    // Set up theme change observer
    this.setupThemeObserver();
    
    // Set up event handlers
    document.addEventListener('click', this.handleOutsideClick);
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('keydown', this.handleKeydown);
    
    // Set up watcher for deck data
    this.loadDecksFromStore();
    
    // Set deck from URL parameters if available
    const urlParams = new URLSearchParams(window.location.search);
    const deck = urlParams.get('wordlist');
    if (deck && this.decks[deck]) {
      this.currentDeck = deck;
    } else {
      this.updateUrlParam('wordlist', this.currentDeck);
    }
    
    // Get the first word after decks are loaded
    if (Object.keys(this.decks).length > 0) {
      this.shuffleDeck();
      this.getNewWord();
    }
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    loadDecksFromStore() {
      // Get dictionary data from store
      this.decks = this.storeDecks;
      
      // If decks are empty but store has data, populate them
      if (Object.keys(this.decks).length === 0 && Object.keys(this.storeDecks).length > 0) {
        this.decks = this.storeDecks;
      }
    },
    async loadDecks() {
      // This legacy method now just calls loadDecksFromStore
      this.loadDecksFromStore();
    },
    setupCanvas() {
      const flashcardElement = this.$refs.flashcard;
      if (!flashcardElement) return;
      
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Append canvas to hanzi div
        const hanziContainer = flashcardElement.querySelector('.hanzi');
        if (hanziContainer) {
          hanziContainer.appendChild(this.canvas);
        }
      }
      
      let maxWidth = flashcardElement.offsetWidth;
      let width = maxWidth * .8;
      // Set canvas size
      this.canvas.width = width * 2;
      this.canvas.height = width / 2 * 2;
      this.canvas.style.width = "100%";
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = width / 2 + 'px';
      // this.canvas.style.backgroundColor = '#100';
      this.canvas.style.left = '0';
      this.canvas.className = "plotter";
      
      // Set line width based on canvas size
      this.lineWidth = width * 0.025;
    },
    setupThemeObserver() {
      // Watch for theme attribute changes on document element
      this.themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-theme') {
            // Update isDarkMode flag when theme changes
            this.isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' || document.documentElement.getAttribute('data-theme') === 'theme2';
            
            // Redraw with new theme colors
            this.redrawCurrentCard();
          }
        });
      });
      
      // Start observing
      this.themeObserver.observe(document.documentElement, { attributes: true });
    },
    async getPinyinEnglishFor(word) {
      try {
      const charDataPromise = fetch(`/api/get_characters_simple_info?characters=${encodeURIComponent(word)}`).then(response => response.json());
        
      const strokesPromises = [];
      for (const character of word) {
        if (!this.isHanzi(character)) continue;
        strokesPromises.push(this.loadStrokeData(character));
      }
        
        const results = await Promise.all([charDataPromise, ...strokesPromises]);
        return results; 
      } catch (error) {
        console.error('Error fetching character data:', error);
        return [{ pinyin: [], english: [] }, []];
      }
    },
    isHanzi(char){
      return /[\u4E00-\u9FFF]/.test(char);
    },
    async loadStrokesAll(word) {
      const promises = [];
      for (const character of word) {
        // skip if not hanzi char
        if (!this.isHanzi(character)) continue;
        promises.push(this.loadStrokeData(character));
      }
      return Promise.all(promises);
    },
    async loadStrokeData(character) {
      try {
        const response = await fetch(`/api/getStrokes/${character}`);
        if (!response.ok) {
          return {
            strokes: { fstrokes: [], offsetX: 0, offsetY: 0 },
            masks: [],
            character: character
          };
        }
        
        const data = await response.json();
        return {
          strokes: this.processStrokes(data.medians),
          masks: data.strokes,
          character: character,
        };
      } catch (error) {
        console.error('Error loading character data:', error);
        throw error;
      }
    },
    processStrokes(strokes) {
      // Convert stroke data to correct format
      strokes.forEach(stroke => {
        stroke.forEach(point => {
          point.x = point[0];
          point.y = 1000 - point[1];
        });
      });

      // Find bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      strokes.forEach(stroke => {
        stroke.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      });
      
      // Center strokes
      // const offsetX = (1000 - (maxX - minX)) / 2 - minX;
      const offsetX = 0;
      const offsetY = (1000 - (maxY - minY)) / 2 - minY;
      
      strokes = strokes.map(stroke => stroke.map(point => ({
        x: (point.x + offsetX),
        y: (point.y + offsetY)
      })));

      // Process strokes for display
      const fstrokes = this.fixStrokes(strokes);
      return { fstrokes, offsetX, offsetY };
    },
    fixStrokes(strokes) {
      return strokes.map(stroke => {
        stroke = this.removeShortSegments(stroke, 30);
        stroke = this.subdivideCurve(stroke, 4);
        stroke = this.smoothCurve(stroke, 0.5); 
        stroke.forEach(point => {
          point.x = point.x / 1000;
          point.y = point.y / 1000;
        });
        return stroke;
      });
    },
    subdivideCurve(points, subdivisions) {
      if (points.length < 2) return points;
      
      const result = [];
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        
        result.push(p0);
        
        for (let j = 1; j < subdivisions; j++) {
          const t = j / subdivisions;
          result.push({
            x: p0.x + (p1.x - p0.x) * t,
            y: p0.y + (p1.y - p0.y) * t
          });
        }
      }
      
      result.push(points[points.length - 1]);
      return result;
    },
    smoothCurve(points, factor) {
      if (points.length < 3) return points;
      
      const smoothed = [points[0]];
      
      for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        
        smoothed.push({
          x: curr.x * (1 - factor) + (prev.x + next.x) / 2 * factor,
          y: curr.y * (1 - factor) + (prev.y + next.y) / 2 * factor
        });
      }
      
      smoothed.push(points[points.length - 1]);
      return smoothed;
    },
    removeShortSegments(line, minLength = 5) {
      if (line.length < 3) return line; // Keep lines with 2 or fewer points unchanged

      const newLine = [line[0]]; // Always keep the first point

      for (let i = 1; i < line.length - 1; i++) {
        const p1 = newLine[newLine.length - 1];
        const p2 = line[i];
        const p3 = line[i + 1];

        const d1 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const d2 = Math.hypot(p3.x - p2.x, p3.y - p2.y);

        // Keep the point if either adjacent segment is long enough
        if (d1 >= minLength || d2 >= minLength) {
          newLine.push(p2);
        }
      }

      newLine.push(line[line.length - 1]); // Always keep the last point
      return newLine;
    },
    calculatePolylineLength(line) {
      let totalLength = 0;
      let segmentLengths = [];
      for (let i = 0; i < line.length - 1; i++) {
        let p1 = line[i];
        let p2 = line[i + 1];
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        totalLength += distance;
        segmentLengths.push(distance);
      }
      return { totalLength, segmentLengths };
    },
    getPointAtPercentage(line, percentage) {
      const polylen = this.calculatePolylineLength(line);
      const totalLength = polylen.totalLength;
      const segmentLengths = polylen.segmentLengths;

      const targetLength = totalLength * percentage;
      let accumulatedLength = 0;
      for (let i = 0; i < segmentLengths.length; i++) {
        accumulatedLength += segmentLengths[i];
        if (accumulatedLength >= targetLength) {
          const p1 = line[i];
          const p2 = line[i + 1];
          const remainingLength = targetLength - (accumulatedLength - segmentLengths[i]);
          const t = remainingLength / segmentLengths[i];
          return {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
          };
        }
      }
      return line[line.length - 1];
    },
    resamplePolyline(line, numPoints) {
      const resampledLine = [];
      for (let i = 0; i < numPoints; i++) {
        const percentage = i / (numPoints - 1);
        const point = this.getPointAtPercentage(line, percentage);
        resampledLine.push(point);
      }
      return resampledLine;
    },
    drawMask(maskRegion, pathData, offX = 0, offY = 0, dimension = 800) {
      // Normalize the path data for consistent spacing
      pathData = pathData.replace(/([A-Za-z])/g, ' $1 ')
                 .replace(/\s+/g, ' ')
                 .trim();
      const commands = pathData.split(' ');
      let x = 0, y = 0;   // Current position
      let startX = 0, startY = 0;  // Start position for 'z' command
      
      let i = 0;
      while (i < commands.length) {
        const cmd = commands[i++];
        
        // Skip empty elements
        if (!cmd) continue;
        
        switch (cmd.toUpperCase()) {
          case 'M': // moveto
            startX = x = parseFloat(commands[i++]);
            startY = y = parseFloat(commands[i++]);
            x = x/1000*dimension + offX*dimension/1000;
            y = dimension - y/1000*dimension + offY*dimension/1000;
            maskRegion.moveTo(x, y);
            
            // In SVG, after a moveto, subsequent coordinate pairs are treated as implicit lineto commands
            while (i < commands.length && !isNaN(parseFloat(commands[i]))) {
              x = parseFloat(commands[i++]);
              y = parseFloat(commands[i++]);
              x = x/1000*dimension + offX*dimension/1000;
              y = dimension - y/1000*dimension + offY*dimension/1000;
              maskRegion.lineTo(x, y);
            }
            break;
            
          case 'L': // lineto
            while (i < commands.length && !isNaN(parseFloat(commands[i]))) {
              x = parseFloat(commands[i++]);
              y = parseFloat(commands[i++]);
              x = x/1000*dimension + offX*dimension/1000;
              y = dimension - y/1000*dimension + offY*dimension/1000;
              maskRegion.lineTo(x, y);
            }
            break;
            
          case 'Q': // quadratic curve
            while (i + 3 < commands.length && !isNaN(parseFloat(commands[i]))) {
              const cx = parseFloat(commands[i++]);
              const cy = parseFloat(commands[i++]);
              x = parseFloat(commands[i++]);
              y = parseFloat(commands[i++]);
              const scaledCx = cx/1000*dimension + offX*dimension/1000;
              const scaledCy = dimension - cy/1000*dimension + offY*dimension/1000;
              const scaledX = x/1000*dimension + offX*dimension/1000;
              const scaledY = dimension - y/1000*dimension + offY*dimension/1000;
              maskRegion.quadraticCurveTo(scaledCx, scaledCy, scaledX, scaledY);
            }
            break;
            
          case 'C': // cubic curve
            while (i + 5 < commands.length && !isNaN(parseFloat(commands[i]))) {
              const cx1 = parseFloat(commands[i++]);
              const cy1 = parseFloat(commands[i++]);
              const cx2 = parseFloat(commands[i++]);
              const cy2 = parseFloat(commands[i++]);
              x = parseFloat(commands[i++]);
              y = parseFloat(commands[i++]);
              const scaledCx1 = cx1/1000*dimension + offX*dimension/1000;
              const scaledCy1 = dimension - cy1/1000*dimension + offY*dimension/1000;
              const scaledCx2 = cx2/1000*dimension + offX*dimension/1000;
              const scaledCy2 = dimension - cy2/1000*dimension + offY*dimension/1000;
              const scaledX = x/1000*dimension + offX*dimension/1000;
              const scaledY = dimension - y/1000*dimension + offY*dimension/1000;
              maskRegion.bezierCurveTo(scaledCx1, scaledCy1, scaledCx2, scaledCy2, scaledX, scaledY);
            }
            break;
            
          case 'Z': // closepath
            maskRegion.closePath();
            x = startX;
            y = startY;
            break;
            
          default:
            // Log an error for unrecognized commands
            console.warn(`Unrecognized SVG path command: ${cmd}`);
            break;
        }
      }
    },
    cross(x, y, DX, DY, opacity = 1) {
      const ropacity = opacity * 0.5;
      const dopacity = opacity * 0.75;
      const copacity = opacity * 0.35;
      
      this.ctx.strokeStyle = this.isDarkMode ? `rgba(255,255,255,${ropacity})` : `rgba(0,0,0,${ropacity})`;
      this.ctx.strokeRect(x + 1, y + 1, DX - 1, DY - 1);

      this.ctx.strokeStyle = this.isDarkMode ? `rgba(255,255,255,${dopacity})` : `rgba(44,0,0,${dopacity})`;
      // diagonal1
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + DX, y + DY);
      this.ctx.stroke();
      // diagonal2
      this.ctx.beginPath();
      this.ctx.moveTo(x + DX, y);
      this.ctx.lineTo(x, y + DY);
      this.ctx.stroke();
      
      this.ctx.strokeStyle = this.isDarkMode ? `rgba(255,255,255,${copacity})` : `rgba(0,0,0,${copacity})`;
      // middle1
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + DY / 2);
      this.ctx.lineTo(x + DX, y + DY / 2);
      this.ctx.stroke();
      // middle2
      this.ctx.beginPath();
      this.ctx.moveTo(x + DX / 2, y);
      this.ctx.lineTo(x + DX / 2, y + DY);
      this.ctx.stroke();
    },
    drawbg(progress, numchars1, numchars2) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.strokeStyle = this.isDarkMode ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.16)';
      this.ctx.lineWidth = 1;

      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;
      
      let charwidth1 = this.canvas.height;
      let charheight1 = this.canvas.height;
      
      let charwidth2 = this.canvas.height;
      let charheight2 = this.canvas.height;

      if(numchars1 > 1){
        charwidth1 = this.canvas.width/numchars1;
        charheight1 = this.canvas.width/numchars1;
      }
      if(numchars2 > 1){
        charwidth2 = this.canvas.width/numchars2;
        charheight2 = this.canvas.width/numchars2;
      }

      const opa = 1;
      if (numchars1 === numchars2) {
        for (let idx = 0; idx < numchars1; idx++) {
          let x0 = cx - (numchars1 * charwidth1) / 2 + idx * charwidth1;
          let y0 = cy - charheight1 / 2;
          x0 = Math.round(x0);
          y0 = Math.round(y0);
          this.cross(x0, y0, charwidth1, charheight1, opa);
        }
      } else {
        for (let idx = 0; idx < numchars1; idx++) {
          let x0 = cx - (numchars1 * charwidth1) / 2 + idx * charwidth1;
          let y0 = cy - charheight1 / 2;
          x0 = Math.round(x0);
          y0 = Math.round(y0);
          let opacity = 1 - progress;
          opacity *= opa;
          this.cross(x0, y0, charwidth1, charheight1, opacity);
        }
        for (let idx = 0; idx < numchars2; idx++) {
          let x0 = cx - (numchars2 * charwidth2) / 2 + idx * charwidth2;
          let y0 = cy - charheight2 / 2;
          x0 = Math.round(x0);
          y0 = Math.round(y0);
          let opacity = progress;
          opacity *= opa;
          this.cross(x0, y0, charwidth2, charheight2, opacity);
        }
      }

      this.ctx.fillStyle = this.isDarkMode ? '#2a2a2a' : 'white';
    },
    drawStrokes() {
      if (!this.currentWordInfo.strokes || !this.currentWordInfo.strokes.length) return;
      
      const numchars = this.currentWordInfo.strokes.length;
      this.drawbg(0, numchars, numchars);
      
      let charwidth = this.canvas.height;
      let charheight = this.canvas.height;
      
      if(numchars > 1){
        charwidth = this.canvas.width/numchars;
        charheight = this.canvas.width/numchars;
      }
      
      this.currentWordInfo.strokes.forEach((charstrokes, idx) => {
        const cx = this.canvas.width / 2 - (numchars * charwidth) / 2 + idx * charwidth;
        const cy = this.canvas.height / 2 - charheight / 2;
        
        charstrokes.strokes.fstrokes.forEach(stroke => {
          const x0 = cx + stroke[0].x * charwidth;
          const y0 = cy + stroke[0].y * charheight;
          this.ctx.moveTo(x0, y0);
          this.ctx.beginPath();
          
          for (let i = 1; i < stroke.length; i++) {
            const x = cx + stroke[i].x * charwidth;
            const y = cy + stroke[i].y * charheight;
            this.ctx.lineTo(x, y);
          }
          
          this.ctx.lineWidth = this.lineWidth*4;
          this.ctx.strokeStyle = this.isDarkMode ? 'white' : 'black';
          this.ctx.lineCap = this.lineType;
          this.ctx.lineJoin = this.lineType;
          this.ctx.stroke();
        });
      });
    },
    drawMasks() {
      if (!this.currentWordInfo.strokes || !this.currentWordInfo.strokes.length) return;
      
      const numchars = this.currentWordInfo.strokes.length;
      let charwidth = this.canvas.height;
      let charheight = this.canvas.height;
      
      if(numchars > 1){
        charwidth = this.canvas.width/numchars;
        charheight = this.canvas.width/numchars;
      }
      
      this.currentWordInfo.strokes.forEach((charstrokes, idx) => {
        const cx = this.canvas.width / 2 - (numchars * charwidth) / 2 + idx * charwidth;
        const cy = this.canvas.height / 2 - charheight / 2;
        
        charstrokes.masks.forEach(mask => {
          const maskregion = new Path2D();
          this.drawMask(
            maskregion, 
            mask, 
            cx / charheight * 1000 + charstrokes.strokes.offsetX, 
            cy / charheight * 1000 + charstrokes.strokes.offsetY, 
            charheight
          );
          
          this.ctx.fillStyle = this.isDarkMode ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)';
          this.ctx.fill(maskregion);
        });
      });
    },
    power(p, g) {
      if (p < 0.5)
        return 0.5 * Math.pow(2 * p, g);
      else
        return 1 - 0.5 * Math.pow(2 * (1 - p), g);
    },
    interpolateCards() {
      if (!this.prevWordInfo.strokes || !this.currentWordInfo.strokes) {
        this.redrawCurrentCard();
        return;
      }
    
      let progress = 0;
      const animateFrame = () => {
        progress += 0.04;
        if (progress >= 1) {
          progress = 1;
        }

        const usedprogress = this.power(progress, 2.5) * 1.3;

        const numchars1 = this.prevWordInfo.strokes.length;
        const numchars2 = this.currentWordInfo.strokes.length;

        this.drawbg(progress, numchars1, numchars2);

        const numchars = Math.max(numchars1, numchars2);

        let charwidth1 = this.canvas.height;
        let charheight1 = this.canvas.height;
        
        let charwidth2 = this.canvas.height;
        let charheight2 = this.canvas.height;

        
        if(numchars1 > 1){
          charwidth1 = this.canvas.width/numchars1;
          charheight1 = this.canvas.width/numchars1;
        }
        if(numchars2 > 1){
          charwidth2 = this.canvas.width/numchars2;
          charheight2 = this.canvas.width/numchars2;
        }


        for (let idx = 0; idx < numchars; idx++) {
          const cx1 = this.canvas.width / 2 - (numchars1 * charwidth1) / 2 + Math.min(idx, numchars1 - 1) * charwidth1;
          const cy1 = this.canvas.height / 2 - charheight1 / 2;
          const cx2 = this.canvas.width / 2 - (numchars2 * charwidth2) / 2 + Math.min(idx, numchars2 - 1) * charwidth2;
          const cy2 = this.canvas.height / 2 - charheight2 / 2;

          const charstrokes1 = this.prevWordInfo.strokes[Math.min(idx, numchars1 - 1)].strokes.fstrokes;
          const charstrokes2 = this.currentWordInfo.strokes[Math.min(idx, numchars2 - 1)].strokes.fstrokes;
          const numcharstrokes = Math.max(charstrokes1.length, charstrokes2.length);

          for (let charstrokeidx = 0; charstrokeidx < numcharstrokes; charstrokeidx++) {
            const stroke1 = charstrokes1[charstrokeidx % charstrokes1.length];
            const stroke2 = charstrokes2[charstrokeidx % charstrokes2.length];
            const resampledStroke1 = this.resamplePolyline(stroke1, stroke2.length);
            
            const x0 = cx1 + resampledStroke1[0].x * charwidth1 + (cx2 + stroke2[0].x * charwidth2 - resampledStroke1[0].x * charwidth1 - cx1) * usedprogress;
            const y0 = cy1 + resampledStroke1[0].y * charheight1 + (cy2 + stroke2[0].y * charheight2 - resampledStroke1[0].y * charheight1 - cy1) * usedprogress;
            
            this.ctx.moveTo(x0, y0);
            this.ctx.beginPath();
            
            for (let i = 1; i < resampledStroke1.length; i++) {
              const popo = this.power(i / resampledStroke1.length, 2.5) * 0.3;
              const x = cx1 + resampledStroke1[i].x * charwidth1 + (cx2 + stroke2[i].x * charwidth2 - resampledStroke1[i].x * charwidth1 - cx1) * Math.min(1, Math.max(0, usedprogress - popo));
              const y = cy1 + resampledStroke1[i].y * charheight1 + (cy2 + stroke2[i].y * charheight2 - resampledStroke1[i].y * charheight1 - cy1) * Math.min(1, Math.max(0, usedprogress - popo));
              this.ctx.lineTo(x, y);
            }

            const saw = (1 - 2 * Math.abs(0.5 - progress));
            this.lineWidth = Math.sqrt(charheight1)* (0.7 + 0.3 * saw * saw * saw) * 1.4;

            let lightness = this.isDarkMode ? 1 : 0;

            if (this.isDarkMode)
              lightness = lightness - 0.2 * (saw);
            else
              lightness = lightness + 0.15 * (saw);

            this.ctx.lineWidth = this.lineWidth;
            this.ctx.strokeStyle = `rgba(${lightness * 255},${lightness * 255},${lightness * 255},1)`;
            this.ctx.lineCap = 'mitter';
            this.ctx.lineJoin = 'mitter';
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
          }
        }

        if (progress < 1 - 0.035 * 8) {
          requestAnimationFrame(animateFrame);
        } else {
          this.redrawCurrentCard();
        }
      };
      
      animateFrame();
    },
    redrawCurrentCard() {
      // this.handleFont();
      const numchars = this.currentWordInfo.strokes.length;
      this.drawbg(0, numchars, numchars);
      // this.drawStrokes();
      this.drawMasks();
    },
    handleFont() {
      const hanziElement = this.$refs.flashcard.querySelector('.hanzi');
      if (hanziElement && hanziElement.style.fontFamily !== this.currentFont) {
        hanziElement.style.fontFamily = `"${this.currentFont}"`;
        hanziElement.style.fontSize = this.currentFont.includes('Kai') ? '5em' : '6em';
      }
    },
    revealOrNew() {
      if (this.revealed) {
        this.getNewWord();
        this.revealed = false;
      } else {
        this.revealed = true;
        this.redrawCurrentCard();
      }
    },
    async getNewWord() {
      const deckData = this.decks[this.currentDeck];
      if (!deckData || !deckData.chars) return;
      
      // Convert chars object to array (if it's not already an array)
      let chars = Array.isArray(deckData.chars) 
        ? deckData.chars 
        : Object.keys(deckData.chars);
      
      if (!chars.length) return;

      // Select a random character from the deck
      const getRandomChar = () => {
        const randomIndex = Math.floor(Math.random() * chars.length);
        return chars[randomIndex];
      };

      if (this.currentWord === '') {
        // Get the first word (random)
        this.currentWord = getRandomChar();
        
        const data = await this.getPinyinEnglishFor(this.currentWord);
        this.currentWordInfo.character = this.currentWord;
        this.currentWordInfo.pinyin = data[0].pinyin;
        this.currentWordInfo.english = data[0].english;
        this.currentWordInfo.strokes = data.slice(1);
        this.redrawCurrentCard();
      } else {
        // Get the next word
        this.currentWord = this.nextWord;
        this.prevWordInfo = this.cloneWordInfo(this.currentWordInfo);
        this.currentWordInfo = this.cloneWordInfo(this.nextWordInfo);
        this.revealed = false;
        this.interpolateCards();
      }

      // Select next word randomly, ensuring it's not the same as current word
      this.nextWord = getRandomChar();
      while (this.nextWord === this.currentWord && chars.length > 1) {
        this.nextWord = getRandomChar();
      }

      const nextData = await this.getPinyinEnglishFor(this.nextWord);
      this.nextWordInfo.character = this.nextWord;
      this.nextWordInfo.pinyin = nextData[0].pinyin;
      this.nextWordInfo.english = nextData[0].english;
      this.nextWordInfo.strokes = nextData.slice(1);
    },
    cloneWordInfo(wordInfo) {
      return {
        character: wordInfo.character,
        pinyin: [...(wordInfo.pinyin || [])],
        english: [...(wordInfo.english || [])],
        strokes: [...(wordInfo.strokes || [])]
      };
    },
    shuffleDeck() {
      const deck = this.decks[this.currentDeck];
      if (!deck || !deck.chars) return;
      
      // Check if chars is an array or an object
      if (Array.isArray(deck.chars)) {
        // If it's an array, shuffle directly
        const array = [...deck.chars];
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        this.decks[this.currentDeck].chars = array;
      } else {
        // If it's an object, shuffle the keys and create a shuffled object
        const keys = Object.keys(deck.chars);
        for (let i = keys.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [keys[i], keys[j]] = [keys[j], keys[i]];
        }
        
        // Store shuffled keys for indexing
        this.decks[this.currentDeck]._shuffledKeys = keys;
      }
    },
    changeDeck(deckKey) {
      this.currentDeck = deckKey;
      this.isSubmenuOpen = false;
      this.currentIndexInDeck = 0;
      this.shuffleDeck();
      this.updateUrlParam('wordlist', deckKey);
      this.currentWord = '';
      this.getNewWord();
    },
    updateUrlParam(key, value) {
      const newUrl = new URL(window.location);
      newUrl.searchParams.set(key, value);
      history.pushState({}, '', newUrl);
    },
    handleOutsideClick(event) {
      if (!event.target.closest('#deckMenu')) {
        this.isSubmenuOpen = false;
      }
    },
    handleResize() {
      this.setupCanvas();
      this.redrawCurrentCard();
    },
    handleKeydown(event) {
      if (event.key === 'a' || event.key === 'd' || event.key === ' ' || event.key === 'Enter' || event.key === 'r') {
        this.revealOrNew();
      }
    },
    isMobileOrTablet() {
      const ua = navigator.userAgent || navigator.vendor || window.opera;
      return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0, 4));
    }
  }
};
</script>

<style>
/* Apply these styles globally to prevent zooming anywhere on the page */
:global(html), :global(body) {
  touch-action: manipulation; /* Prevents double-tap zoom */
  -webkit-touch-callout: none; /* iOS Safari */
  user-select: none; /* Standard syntax */
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  overscroll-behavior: none; /* Prevent pull-to-refresh */
}

#app {
}
</style>

<style scoped>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  touch-action: manipulation; /* Prevents double-tap zoom */
  -webkit-touch-callout: none; /* Disables callout on iOS */
}

.flashcards-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2em;
  box-sizing: border-box;
  margin: 0 auto;
  position: relative;
  user-select: none; /* Prevents text selection */
  -webkit-user-select: none; /* For Safari */
}

#flashcard_container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  perspective: 1000px;
}

#flashcard {
  position: relative;
  width: 100%;
  height: 100vh;
  max-height: 800px;
  cursor: pointer;
  transform-style: preserve-3d;
  box-shadow: var(--card-shadow);
  background-color: var(--card-bg);
  border: var(--card-border);
  border-radius: var(--modal-border-radius, 0);
  overflow: hidden;
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  touch-action: manipulation; /* Prevents double-tap zoom on the flashcard */
}

.top-buttons {
  z-index: 10;
  box-sizing: border-box;
  padding: 1em;
  flex: 0.1;
}

.custom-dropdown {
  position: relative;
  width: 100%;
  user-select: none;
  display: flex;
  justify-content: center;
}

#selected-deck {
  padding: 10px 15px;
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  color: var(--fg);
  cursor: pointer;
  font-weight: bold;
  text-align: center;
  min-width: 200px;
}

#selected-deck:hover {
  background-color: color-mix(in oklab, var(--fg) 8%, var(--bg) 75%);
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
  white-space: nowrap;
}

.option:hover {
  background-color: color-mix(in oklab, var(--fg) 6%, var(--bg) 75%);
}

.option.selected {
  background-color: var(--selected-bg);
}

.hanzi {
  top: 50px; /* Position right below the top buttons */
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 6em;
  z-index: 5;
}

.answer {
  position: absolute;
  font-size: 1em;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 2em 1em;
  text-align: center;
  background-color: rgba(var(--answer-bg-rgb), 0.05);
  border-top: 1px solid rgba(var(--answer-border-rgb), 0.2);
  /* transition: opacity 0.3s; */
  z-index: 4;
}

.answer.inactive {
  opacity: 0;
}

.pinyin {
  font-size: 1.5em;
  margin-bottom: 10px;
}

.english {
  font-size: 1.2em;
  opacity: .6;
}

canvas.plotter {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}


@media (max-width: 784px) {
  #flashcard_container {
    width: 100%;
    margin: 0 auto;
    perspective: 1000px;
  }

  .answer {
    position: absolute;
    font-size: .76em;
  }

  .flashcards-view {
    margin-top: 1em;
    padding: 1em;
  }

  #selected-deck {
    padding: 5px 11px;
    font-size: 0.8em;
    background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
    color: var(--fg);
    cursor: pointer;
    font-weight: bold;
    text-align: center;
    margin-bottom: 1em;
    min-width: 200px;
  }
  
  #flashcard {
    height: 50vh;
  }
}

</style>