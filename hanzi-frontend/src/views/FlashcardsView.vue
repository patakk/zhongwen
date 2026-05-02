<template>
  <BasePage page_title="Flashcards" />
  <div class="flashcards-view">
    <div id="flashcard_container">
      <div id="flashcard" ref="flashcard" @click="onCardClick">
        <div class="top-buttons" @click.stop>
          <DeckSelector
            v-model="currentDeck"
            :decks="decks"
            placeholder="Select a deck"
            @change="onDeckChange"
          />
          <div v-if="mode === 'fsrs' && queueState" class="queue-stats">
            <span class="qs-due" title="Due reviews">⏱ {{ queueState.due_count }}</span>
            <span class="qs-new" title="New cards available">✦ {{ queueState.new_available }}</span>
            <span class="qs-done" title="Reviewed today">✓ {{ queueState.reviews_done_today }}/{{ queueState.daily_review_limit }}</span>
          </div>
        </div>

        <div class="hanzi">
          <!-- Canvas is appended here programmatically -->
        </div>

        <div v-if="mode === 'fsrs' && showEmptyState" class="empty-state" @click.stop>
          <h3>{{ emptyStateTitle }}</h3>
          <p>{{ emptyStateMessage }}</p>
          <button
            v-if="canLearnNew"
            class="btn-learn-new"
            @click="learnNew"
            :disabled="loadingNext"
          >
            {{ loadingNext ? 'Loading…' : `Learn ${learnNewCount} new card${learnNewCount === 1 ? '' : 's'}` }}
          </button>
        </div>

        <template v-else>
          <div class="answer" :class="{ inactive: revealed }">
            <div class="answer-hanzi-text">{{ currentWordInfo.character }}</div>
            <div class="pinyin" style="opacity: 0;">{{ displaySinglePinyin }}</div>
            <div class="english" style="opacity: 0;">{{ displaySingleEnglish }}</div>
          </div>
          <div class="answer" :class="{ inactive: !revealed }">
            <div class="answer-hanzi-text">{{ currentWordInfo.character }}</div>
            <div class="pinyin">{{ displaySinglePinyin }}</div>
            <div class="english">{{ displaySingleEnglish }}</div>
            <div v-if="mode === 'fsrs' && revealed" class="rating-buttons" @click.stop>
              <button class="rating-btn rating-again" :disabled="loadingNext" @click="submitRating('again')">
                <span class="rating-label">Again</span>
                <span class="rating-key">1</span>
              </button>
              <button class="rating-btn rating-good" :disabled="loadingNext" @click="submitRating('good')">
                <span class="rating-label">Good</span>
                <span class="rating-key">2</span>
              </button>
              <button class="rating-btn rating-easy" :disabled="loadingNext" @click="submitRating('easy')">
                <span class="rating-label">Easy</span>
                <span class="rating-key">3</span>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import BasePage from '../components/layout/BasePage.vue';
import DeckSelector from '../components/forms/DeckSelector.vue';

export default {
  components: {
    BasePage,
    DeckSelector
  },
  data() {
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
      currentDeck: deckFromUrl || 'hsk1',
      animationFrameId: null,
      lineWidth: 6,
      lineType: 'round',
      isDarkMode: false,
      decks: {},

      // FSRS state (only used when authenticated)
      queueState: null,
      loadingNext: false,
      fsrsLoaded: false
    };
  },
  computed: {
    customDefCurrent() {
      try {
        const h = this.currentWordInfo && this.currentWordInfo.character;
        const getter = this.$store.getters.getCustomDefinition;
        return h && getter ? getter(h) : null;
      } catch (e) { return null; }
    },
    displaySinglePinyin() {
      try {
        const base = (this.currentWordInfo.pinyin && this.currentWordInfo.pinyin[0]) || '';
        const custom = this.customDefCurrent && this.customDefCurrent.pinyin ? this.customDefCurrent.pinyin : '';
        return this.$toAccentedPinyin((custom || base) || '');
      } catch (e) { return ''; }
    },
    displaySingleEnglish() {
      try {
        const base = (this.currentWordInfo.english && this.currentWordInfo.english[0]) || '';
        const custom = this.customDefCurrent && this.customDefCurrent.english ? this.customDefCurrent.english : '';
        const txt = (custom || base) || '';
        return txt.split('/')[0];
      } catch (e) { return ''; }
    },
    storeDecks() {
      const staticData = this.$store.getters.getDictionaryData || {};
      const customData = this.$store.getters.getCustomDictionaryData || {};
      return { ...staticData, ...customData };
    },
    isAuthenticated() {
      return !!this.$store.getters.getAuthStatus;
    },
    mode() {
      return this.isAuthenticated ? 'fsrs' : 'random';
    },
    showEmptyState() {
      return this.fsrsLoaded && this.queueState && !this.queueState.card;
    },
    canLearnNew() {
      const q = this.queueState;
      return !!(q && q.new_available > 0 && q.new_remaining > 0);
    },
    learnNewCount() {
      const q = this.queueState;
      if (!q) return 0;
      return Math.min(q.new_available, q.new_remaining);
    },
    emptyStateTitle() {
      const q = this.queueState;
      if (!q) return '';
      if (q.review_remaining <= 0 && q.due_count > 0) return 'Daily review limit reached';
      if (this.canLearnNew) return 'Reviews done!';
      return 'All caught up!';
    },
    emptyStateMessage() {
      const q = this.queueState;
      if (!q) return '';
      if (q.review_remaining <= 0 && q.due_count > 0) {
        return `${q.due_count} cards still due. Take a break and come back tomorrow.`;
      }
      if (this.canLearnNew) {
        return `${q.new_available} new card${q.new_available === 1 ? '' : 's'} available in this deck.`;
      }
      if (q.new_available > 0 && q.new_remaining <= 0) {
        return `Daily new-card limit reached (${q.daily_new_limit}). More tomorrow.`;
      }
      return 'No more cards in this deck right now.';
    }
  },
  watch: {
    storeDecks: {
      handler(newDecks) {
        this.decks = newDecks;

        if (Object.keys(this.decks).length > 0 && this.currentWord === '' && !this.fsrsLoaded) {
          const urlParams = new URLSearchParams(window.location.search);
          const deck = urlParams.get('wordlist');
          if (deck && this.decks[deck]) {
            this.currentDeck = deck;
          }
          this.startSession();
        }
      },
      deep: true
    },

    currentDeck(newDeck) {
      this.updateUrlParam('wordlist', newDeck);
    },

    isAuthenticated() {
      // Auth flipped mid-session — restart with the appropriate flow.
      this.resetSessionState();
      this.startSession();
    }
  },
  mounted() {
    this.setupCanvas();
    this.isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' || document.documentElement.getAttribute('data-theme') === 'theme2';
    this.setupThemeObserver();

    window.addEventListener('resize', this.handleResize);
    document.addEventListener('keydown', this.handleKeydown);

    this.decks = this.storeDecks;

    const urlParams = new URLSearchParams(window.location.search);
    const deck = urlParams.get('wordlist');
    if (deck && this.decks[deck]) {
      this.currentDeck = deck;
    } else {
      this.updateUrlParam('wordlist', this.currentDeck);
    }

    // Only start if decks are already loaded; otherwise the watcher handles it
    if (Object.keys(this.decks).length > 0) {
      this.startSession();
    }
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('keydown', this.handleKeydown);

    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  },
  methods: {
    setupCanvas() {
      const flashcardElement = this.$refs.flashcard;
      if (!flashcardElement) return;

      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        const hanziContainer = flashcardElement.querySelector('.hanzi');
        if (hanziContainer) {
          hanziContainer.appendChild(this.canvas);
        }
      }

      const maxWidth = flashcardElement.offsetWidth;
      const width = maxWidth * 0.5;
      this.canvas.width = width * 2;
      this.canvas.height = width / 2 * 2;
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = width / 2 + 'px';
      this.canvas.style.left = '0';
      this.canvas.className = 'plotter';

      this.lineWidth = width * 0.025;
    },
    setupThemeObserver() {
      this.themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-theme') {
            this.isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' || document.documentElement.getAttribute('data-theme') === 'theme2';
            this.redrawCurrentCard();
          }
        });
      });

      this.themeObserver.observe(document.documentElement, { attributes: true });
    },
    async getPinyinEnglishFor(word) {
      try {
        const charDataPromise = fetch(`/api/get_characters_simple_info?characters=${encodeURIComponent(word)}`)
          .then(response => response.json());

        const strokesPromises = [];
        for (const character of word) {
          if (!this.isHanzi(character)) continue;
          strokesPromises.push(this.loadStrokeData(character));
        }

        const results = await Promise.all([charDataPromise, ...strokesPromises]);
        const charInfo = {
          pinyin: results[0][word]?.pinyin || [],
          english: results[0][word]?.english || []
        };
        return [charInfo, ...results.slice(1)];
      } catch (error) {
        console.error('Error fetching character data:', error);
        return [{ pinyin: [], english: [] }, []];
      }
    },
    isHanzi(char) {
      return /[一-鿿]/.test(char);
    },
    async loadStrokeData(character) {
      try {
        const response = await fetch(`/api/getStrokes?character=${character}`);
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
      strokes.forEach(stroke => {
        stroke.forEach(point => {
          point.x = point[0];
          point.y = 1000 - point[1];
        });
      });

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      strokes.forEach(stroke => {
        stroke.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      });

      const offsetX = 0;
      const offsetY = (1000 - (maxY - minY)) / 2 - minY;

      strokes = strokes.map(stroke => stroke.map(point => ({
        x: (point.x + offsetX),
        y: (point.y + offsetY)
      })));

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
      if (line.length < 3) return line;

      const newLine = [line[0]];

      for (let i = 1; i < line.length - 1; i++) {
        const p1 = newLine[newLine.length - 1];
        const p2 = line[i];
        const p3 = line[i + 1];

        const d1 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const d2 = Math.hypot(p3.x - p2.x, p3.y - p2.y);

        if (d1 >= minLength || d2 >= minLength) {
          newLine.push(p2);
        }
      }

      newLine.push(line[line.length - 1]);
      return newLine;
    },
    calculatePolylineLength(line) {
      let totalLength = 0;
      const segmentLengths = [];
      for (let i = 0; i < line.length - 1; i++) {
        const p1 = line[i];
        const p2 = line[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
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
      pathData = pathData.replace(/([A-Za-z])/g, ' $1 ')
                 .replace(/\s+/g, ' ')
                 .trim();
      const commands = pathData.split(' ');
      let x = 0, y = 0;
      let startX = 0, startY = 0;

      let i = 0;
      while (i < commands.length) {
        const cmd = commands[i++];

        if (!cmd) continue;

        switch (cmd.toUpperCase()) {
          case 'M':
            startX = x = parseFloat(commands[i++]);
            startY = y = parseFloat(commands[i++]);
            x = x/1000*dimension + offX*dimension/1000;
            y = dimension - y/1000*dimension + offY*dimension/1000;
            maskRegion.moveTo(x, y);

            while (i < commands.length && !isNaN(parseFloat(commands[i]))) {
              x = parseFloat(commands[i++]);
              y = parseFloat(commands[i++]);
              x = x/1000*dimension + offX*dimension/1000;
              y = dimension - y/1000*dimension + offY*dimension/1000;
              maskRegion.lineTo(x, y);
            }
            break;

          case 'L':
            while (i < commands.length && !isNaN(parseFloat(commands[i]))) {
              x = parseFloat(commands[i++]);
              y = parseFloat(commands[i++]);
              x = x/1000*dimension + offX*dimension/1000;
              y = dimension - y/1000*dimension + offY*dimension/1000;
              maskRegion.lineTo(x, y);
            }
            break;

          case 'Q':
            while (i + 4 <= commands.length && !isNaN(parseFloat(commands[i]))) {
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

          case 'C':
            while (i + 6 <= commands.length && !isNaN(parseFloat(commands[i]))) {
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

          case 'Z':
            maskRegion.closePath();
            x = startX;
            y = startY;
            break;

          default:
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
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + DX, y + DY);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(x + DX, y);
      this.ctx.lineTo(x, y + DY);
      this.ctx.stroke();

      this.ctx.strokeStyle = this.isDarkMode ? `rgba(255,255,255,${copacity})` : `rgba(0,0,0,${copacity})`;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + DY / 2);
      this.ctx.lineTo(x + DX, y + DY / 2);
      this.ctx.stroke();

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

      if (numchars1 > 1) {
        charwidth1 = this.canvas.width / numchars1;
        charheight1 = this.canvas.width / numchars1;
      }
      if (numchars2 > 1) {
        charwidth2 = this.canvas.width / numchars2;
        charheight2 = this.canvas.width / numchars2;
      }

      if (numchars1 === numchars2) {
        for (let idx = 0; idx < numchars1; idx++) {
          let x0 = cx - (numchars1 * charwidth1) / 2 + idx * charwidth1;
          let y0 = cy - charheight1 / 2;
          this.cross(Math.round(x0), Math.round(y0), charwidth1, charheight1, 1);
        }
      } else {
        for (let idx = 0; idx < numchars1; idx++) {
          let x0 = cx - (numchars1 * charwidth1) / 2 + idx * charwidth1;
          let y0 = cy - charheight1 / 2;
          this.cross(Math.round(x0), Math.round(y0), charwidth1, charheight1, 1 - progress);
        }
        for (let idx = 0; idx < numchars2; idx++) {
          let x0 = cx - (numchars2 * charwidth2) / 2 + idx * charwidth2;
          let y0 = cy - charheight2 / 2;
          this.cross(Math.round(x0), Math.round(y0), charwidth2, charheight2, progress);
        }
      }
    },
    drawMasks() {
      if (!this.currentWordInfo.strokes || !this.currentWordInfo.strokes.length) return;

      const numchars = this.currentWordInfo.strokes.length;
      let charwidth = this.canvas.height;
      let charheight = this.canvas.height;

      if (numchars > 1) {
        charwidth = this.canvas.width / numchars;
        charheight = this.canvas.width / numchars;
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

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
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

        if (numchars1 > 1) {
          charwidth1 = this.canvas.width / numchars1;
          charheight1 = this.canvas.width / numchars1;
        }
        if (numchars2 > 1) {
          charwidth2 = this.canvas.width / numchars2;
          charheight2 = this.canvas.width / numchars2;
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
            this.lineWidth = Math.sqrt(charheight1) * (0.7 + 0.3 * saw * saw * saw) * 1.4;

            const lightness = this.isDarkMode
              ? 1 - 0.2 * saw
              : 0.15 * saw;

            this.ctx.lineWidth = this.lineWidth;
            this.ctx.strokeStyle = `rgba(${lightness * 255},${lightness * 255},${lightness * 255},1)`;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
          }
        }

        if (progress < 1 - 0.035 * 8) {
          this.animationFrameId = requestAnimationFrame(animateFrame);
        } else {
          this.animationFrameId = null;
          this.redrawCurrentCard();
        }
      };

      this.animationFrameId = requestAnimationFrame(animateFrame);
    },
    redrawCurrentCard() {
      const numchars = this.currentWordInfo.strokes.length;
      this.drawbg(0, numchars, numchars);
      this.drawMasks();
    },
    onCardClick() {
      if (this.mode === 'fsrs') {
        // In FSRS mode, click only reveals; rating buttons advance the queue.
        if (this.showEmptyState) return;
        if (!this.revealed && this.currentWord) {
          this.revealed = true;
          this.redrawCurrentCard();
        }
      } else {
        this.revealOrNewRandom();
      }
    },
    revealOrNewRandom() {
      if (this.revealed) {
        this.revealed = false;
        this.getRandomNewWord();
      } else {
        this.revealed = true;
        this.redrawCurrentCard();
      }
    },
    resetSessionState() {
      this.currentWord = '';
      this.nextWord = '';
      this.revealed = false;
      this.queueState = null;
      this.fsrsLoaded = false;
      this.loadingNext = false;
    },
    async startSession() {
      if (this.mode === 'fsrs') {
        await this.loadFsrsQueue();
      } else {
        await this.getRandomNewWord();
      }
    },
    async loadFsrsQueue() {
      try {
        const resp = await fetch(`/api/fsrs/queue?deck=${encodeURIComponent(this.currentDeck)}`, {
          credentials: 'same-origin'
        });
        if (!resp.ok) {
          this.queueState = null;
          this.fsrsLoaded = true;
          return;
        }
        const payload = await resp.json();
        this.queueState = payload;
        this.fsrsLoaded = true;
        if (payload.card) {
          await this.showWord(payload.card.word, /*animate=*/ this.currentWord !== '');
        } else {
          this.currentWord = '';
          this.currentWordInfo = { character: '', pinyin: [], english: [], strokes: [] };
          this.revealed = false;
          if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
      } catch (e) {
        console.error('Failed to load FSRS queue:', e);
        this.queueState = null;
        this.fsrsLoaded = true;
      }
    },
    async submitRating(rating) {
      if (this.loadingNext || !this.currentWord) return;
      this.loadingNext = true;
      try {
        const resp = await fetch('/api/fsrs/review', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: this.currentWord,
            rating,
            deck: this.currentDeck
          })
        });
        if (!resp.ok) {
          console.error('Review failed:', await resp.text());
          return;
        }
        const payload = await resp.json();
        this.queueState = payload;
        this.revealed = false;
        if (payload.card) {
          await this.showWord(payload.card.word, /*animate=*/ true);
        } else {
          this.currentWord = '';
          this.currentWordInfo = { character: '', pinyin: [], english: [], strokes: [] };
          if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
      } finally {
        this.loadingNext = false;
      }
    },
    async learnNew() {
      if (this.loadingNext) return;
      const count = this.learnNewCount;
      if (count <= 0) return;
      this.loadingNext = true;
      try {
        const resp = await fetch('/api/fsrs/learn-new', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deck: this.currentDeck, count })
        });
        if (!resp.ok) {
          console.error('learn-new failed:', await resp.text());
          return;
        }
        const payload = await resp.json();
        this.queueState = payload;
        if (payload.card) {
          await this.showWord(payload.card.word, /*animate=*/ false);
        }
      } finally {
        this.loadingNext = false;
      }
    },
    async showWord(word, animate) {
      const data = await this.getPinyinEnglishFor(word);
      const newInfo = {
        character: word,
        pinyin: data[0].pinyin,
        english: data[0].english,
        strokes: data.slice(1)
      };
      if (animate && this.currentWord && this.currentWordInfo.strokes && this.currentWordInfo.strokes.length) {
        this.prevWordInfo = this.cloneWordInfo(this.currentWordInfo);
        this.currentWordInfo = newInfo;
        this.currentWord = word;
        this.interpolateCards();
      } else {
        this.currentWordInfo = newInfo;
        this.currentWord = word;
        this.redrawCurrentCard();
      }
    },
    async getRandomNewWord() {
      const deckData = this.decks[this.currentDeck];
      if (!deckData || !deckData.chars) return;

      const chars = Array.isArray(deckData.chars)
        ? deckData.chars
        : Object.keys(deckData.chars);

      if (!chars.length) return;

      const getRandomChar = () => chars[Math.floor(Math.random() * chars.length)];

      if (this.currentWord === '') {
        this.currentWord = getRandomChar();
        const data = await this.getPinyinEnglishFor(this.currentWord);
        this.currentWordInfo.character = this.currentWord;
        this.currentWordInfo.pinyin = data[0].pinyin;
        this.currentWordInfo.english = data[0].english;
        this.currentWordInfo.strokes = data.slice(1);
        this.redrawCurrentCard();
      } else {
        this.currentWord = this.nextWord;
        this.prevWordInfo = this.cloneWordInfo(this.currentWordInfo);
        this.currentWordInfo = this.cloneWordInfo(this.nextWordInfo);
        this.interpolateCards();
      }

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
    onDeckChange(deckKey) {
      this.updateUrlParam('wordlist', deckKey);
      this.resetSessionState();
      this.startSession();
    },
    updateUrlParam(key, value) {
      const newUrl = new URL(window.location);
      newUrl.searchParams.set(key, value);
      history.pushState({}, '', newUrl);
    },
    handleResize() {
      this.setupCanvas();
      this.redrawCurrentCard();
    },
    handleKeydown(event) {
      if (this.mode === 'fsrs') {
        if (this.showEmptyState) return;
        if (!this.revealed) {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            if (this.currentWord) {
              this.revealed = true;
              this.redrawCurrentCard();
            }
          }
          return;
        }
        if (event.key === '1' || event.key === 'a') this.submitRating('again');
        else if (event.key === '2' || event.key === 'g' || event.key === ' ' || event.key === 'Enter') this.submitRating('good');
        else if (event.key === '3' || event.key === 'e') this.submitRating('easy');
      } else {
        if (event.key === 'a' || event.key === 'd' || event.key === ' ' || event.key === 'Enter' || event.key === 'r') {
          this.revealOrNewRandom();
        }
      }
    }
  }
};
</script>

<style>
:global(html), :global(body) {
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  overscroll-behavior: none;
}
</style>

<style scoped>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  touch-action: manipulation;
  -webkit-touch-callout: none;
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
  user-select: none;
  -webkit-user-select: none;
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
  height: 60vh;
  max-height: 800px;
  cursor: pointer;
  transform-style: preserve-3d;
  box-shadow: var(--card-shadow);
  background-color: var(--card-bg);
  border: var(--card-border);

  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  touch-action: manipulation;
}

.top-buttons {
  z-index: 10;
  box-sizing: border-box;
  padding: 1em;
  flex: 0.1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1em;
}

.queue-stats {
  display: flex;
  gap: 0.9em;
  font-size: 0.85em;
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
}

.queue-stats span {
  white-space: nowrap;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2em;
  z-index: 6;
}

.empty-state h3 {
  font-size: 1.6em;
  margin: 0 0 0.4em 0;
}

.empty-state p {
  margin: 0 0 1.2em 0;
  opacity: 0.7;
  max-width: 28em;
}

.btn-learn-new {
  padding: 0.8em 1.6em;
  font-size: 1em;
  background: var(--primary-color, #4a90e2);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-learn-new:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rating-buttons {
  display: flex;
  gap: 0.6em;
  margin-top: 1em;
  justify-content: center;
}

.rating-btn {
  flex: 1;
  max-width: 9em;
  padding: 0.7em 0.4em;
  border: 1px solid rgba(var(--answer-border-rgb), 0.35);
  background: rgba(var(--answer-bg-rgb), 0.08);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2em;
  font-size: 1em;
  color: inherit;
}

.rating-btn:hover:not(:disabled) {
  background: rgba(var(--answer-bg-rgb), 0.18);
}

.rating-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rating-btn .rating-label {
  font-weight: 600;
}

.rating-btn .rating-key {
  font-size: 0.75em;
  opacity: 0.55;
}

.rating-again {
  border-color: rgba(220, 80, 80, 0.55);
}

.rating-good {
  border-color: rgba(80, 170, 100, 0.55);
}

.rating-easy {
  border-color: rgba(80, 130, 220, 0.55);
}

.hanzi {
  top: 50px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 6em;
  z-index: 5;
  overflow: hidden;
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
  z-index: 4;
}

.answer.inactive {
  opacity: 0;
}

.answer-hanzi-text {
  font-family: var(--main-word-font, 'Noto Serif SC', 'Kaiti', serif);
  font-size: 2.2em;
  line-height: 1.1;
  margin-bottom: 0.25em;
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

  #flashcard {
    height: 50vh;
  }
}
</style>
