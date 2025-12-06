<template>
  <BasePage page_title="Hanzi" />
  <div class="search-view">
    <form @submit.prevent="doSearch" class="search-form">
      <div class="search-input-wrapper">
        <input
          v-model="query"
          type="text"
          placeholder="enter search term"
          class="search-input"
          @input="handleInput"
        />
        <button
          v-if="query"
          type="button"
          class="clear-btn"
          @click="clearSearch"
          title="Clear search"
        >
          ×
        </button>
      </div>
      <div class="search-actions">
        <button type="button" class="stroke-toggle" @click="toggleStrokePad" :aria-pressed="showStrokePad" title="Draw search">
          <font-awesome-icon :icon="['fas','pen-fancy']" />
        </button>
        <button type="button" class="ocr-toggle" @click="toggleOcrPanel" :aria-pressed="showOcrPanel" title="Image OCR search">
          <font-awesome-icon :icon="['fas','camera']" />
        </button>
        <!-- Search button kept but hidden by default -->
        <button type="submit" class="search-button" style="display: none;">Search</button>
      </div>
    </form>

    <div v-if="showStrokePad" class="stroke-draw-wrap">
      <div class="stroke-controls">
        <span class="stroke-label">Draw character</span>
        <div class="stroke-buttons">
          <button type="button" @click="undoStroke" :disabled="strokes.length === 0">Undo</button>
          <button type="button" @click="clearCanvas" :disabled="strokes.length === 0">Clear</button>
        </div>
      </div>
      <div class="stroke-content" ref="strokeContent">
        <canvas
          ref="strokeCanvas"
          class="stroke-canvas"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
          @touchstart.prevent="handleTouchStart"
          @touchmove.prevent="handleTouchMove"
          @touchend.prevent="stopDrawing"
        ></canvas>
        <div class="stroke-results" v-if="strokeResults.length">
          <span class="stroke-label">Candidate chars:</span>
          <div class="stroke-result-list">
            <PreloadWrapper
              v-for="(res, idx) in strokeResults"
              :key="idx"
              :character="res.character"
              :navList="strokeNavList"
              :navIndex="idx"
              :showBubbles="false"
              class="stroke-result-btn"
            >
              <span class="stroke-result-text">{{ res.character }}</span>
            </PreloadWrapper>
          </div>
        </div>
      </div>
    </div>
    <OcrPanel v-if="showOcrPanel" class="ocr-panel-wrap" @insert-text="handleOcrInsert" />
    <div v-if="!isLoading && groupedResults.length" class="results">
      <div
        v-for="group in groupedResults"
        :key="group.key"
        class="result-group"
      >
        <div
          v-if="group.label"
          class="group-header"
          :class="{ clickable: group.collapsible }"
          @click="group.collapsible && toggleGroup(group.key)"
        >
          <div class="group-title">{{ group.label }}</div>
          <div v-if="group.collapsible" class="group-toggle">
            {{ isGroupCollapsed(group.key) ? '↓' : '↑' }}
          </div>
        </div>
        <div v-show="!group.collapsible || !isGroupCollapsed(group.key)" class="group-body">
          <PreloadWrapper
            v-for="entry in group.items"
            :key="entry.originalIdx"
            :character="entry.item.hanzi"
            :navList="navCharList"
            :navMetaList="navMetaList"
            :navIndex="entry.displayIdx"
            :cardOverrides="resultOverrides(entry.item)"
            :showBubbles="false"
            :class="'word-item'"
          >
              <div class="word-hanzipinyin">
                <div class="word-hanzi" v-html="colorizeHanzi(entry.item.hanzi, $toAccentedPinyin(entry.item.pinyin))"></div>
                <div class="word-pinyin" v-html="colorizePinyin($toAccentedPinyin(entry.item.pinyin))"></div>
              </div>
              <div class="word-english" v-html="highlightMatch($toAccentedPinyin(entry.item.english))"></div>
              <div class="result-number">{{ entry.displayIdx + 1 }}</div>
          </PreloadWrapper>
        </div>
      </div>
    </div>
    
    <div v-if="isSearching" class="loading-indicator">
      searching...
    </div>
    <!-- Scroll to top button -->
    <button 
      v-if="showScrollTop" 
      @click="scrollToTop" 
      class="scroll-to-top-button"
      aria-label="Scroll to top"
    >
      ↑
    </button>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import BasePage from '../components/BasePage.vue';
import PreloadWrapper from '../components/PreloadWrapper.vue';
import { colorizeHanzi as toneColorizeHanzi, colorizePinyin as toneColorizePinyin } from '../lib/toneColorizer';

export default {
  components: {
    BasePage,
    PreloadWrapper,
    OcrPanel: defineAsyncComponent(() => import('../components/OcrPanel.vue')),
  },
  computed: {
    // Navigation list matches current search results order
    navCharList() {
      return this.displayedItems.map(r => r.hanzi);
    },
    navMetaList() {
      return this.displayedItems.map(r => this.resultOverrides(r));
    },
    displayedItems() {
      return this.groupedResults.flatMap(g => g.items.map(e => e.item));
    },
    groupedResults() {
      const groups = Array.isArray(this.results) ? this.results : [];
      return groups;
    },
    toneColorEnabled() {
      try { return this.$store.getters['theme/isToneColorEnabled'] !== false; } catch (e) { return true; }
    },
    toneColorScheme() {
      try { return this.$store.getters['theme/getToneColorScheme'] || 'default'; } catch (e) { return 'default'; }
    },
    strokeNavList() {
      return this.strokeResults.map(r => r.character);
    }
  },
  data() {
    return {
      query: '',
      results: [],
      isLoading: false,
      isSearching: false,
      showScrollTop: false,
      searchTimeout: null,
      latestQuery: '', // Track the latest query to ensure no inputs are lost
      // Stroke search state
      showStrokePad: false,
      // OCR
      showOcrPanel: false,
      strokes: [],
      currentStroke: [],
      isDrawing: false,
      lastX: 0,
      lastY: 0,
      strokeResults: [],
      hanzilookupReady: false,
      strokeCanvasCtx: null,
      strokeCanvasSize: 0,
      themeObserver: null,
      groupCollapsed: {},
      isDarkTheme: false,
      _resizePending: null,
    };
  },
  created() {
    // Check if there's a query parameter in the URL
    const queryParam = this.$route.query.q;
    if (queryParam) {
      this.query = queryParam;
      
      // Check if we have a pending search promise from PageInfoView
      if (window.pendingSearchPromise) {
        this.isLoading = true;
        // Use the existing promise
        window.pendingSearchPromise
          .then(res => res.json())
          .then(data => {
            const rawResults = data.results || data.groups || [];
            this.results = this.filterResults(rawResults);
            this.resetGroupCollapse();
            this.isLoading = false;
          })
          .catch(error => {
            console.error("Error processing search results:", error);
            this.isLoading = false;
            // Fallback to a new search if the pending one fails
            this.doSearch();
          })
          .finally(() => {
            // Clear the pending promise
            window.pendingSearchPromise = null;
          });
      } else {
        // If no pending promise exists, perform the search now
        this.debouncedSearch();
      }
    }
  },
  mounted() {
    // Add event listener for scroll
    window.addEventListener('scroll', this.handleScroll);
    // Initial check for scroll position
    this.handleScroll();
    // If opened with ?word=, ensure nav context once results are available
    this.$nextTick(() => this.ensureNavContextForUrlWord());
    // Observe theme changes to refresh stroke colors
    this.setupThemeObserver();
  },
  beforeUnmount() {
    // Remove scroll event listener when component is unmounted
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.resizeCanvas);
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
    // Clear any pending timeouts
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  },
  methods: {

    resetGroupCollapse() {
      this.groupCollapsed = {};
    },
    isGroupCollapsed(key) {
      return !!this.groupCollapsed[key];
    },
    toggleGroup(key) {
      const next = !this.isGroupCollapsed(key);
      this.groupCollapsed = { ...this.groupCollapsed, [key]: next };
    },

    clearSearch() {
      this.query = '';
      this.results = [];
      this.groupedResults = [];
      this.updateUrlQuery();
    },

    updateUrlQuery() {
      const q = this.query || '';
      const query = { ...this.$route.query };
      if (q) query.q = q; else delete query.q;
      this.$router.replace({ query }).catch(() => {});
    },

    extractHanzi(str) {
      if (!str) return [];
      return Array.from(str).filter(ch => /\p{Script=Han}/u.test(ch));
    },
    isHanziOnly(str) {
      if (!str) return false;
      const chars = Array.from(str);
      const hanzi = chars.filter(ch => /\p{Script=Han}/u.test(ch));
      const nonAllowed = chars.filter(ch => !/\p{Script=Han}/u.test(ch) && /\S/.test(ch));
      return hanzi.length > 0 && nonAllowed.length === 0;
    },
    reorderHanziResults(results, query) {
      if (!Array.isArray(results)) return results;

      // Preserve the character order from the query so singles appear in that sequence
      const charOrder = [];
      for (const ch of Array.from(query)) {
        if (!charOrder.includes(ch)) charOrder.push(ch);
      }

      const exact = [];
      const singleMap = new Map();
      const rest = [];
      const isExact = r => r && r.hanzi === query;
      const isSingleOfQuery = r => r && r.hanzi && r.hanzi.length === 1 && charOrder.includes(r.hanzi);

      for (const r of results) {
        if (isExact(r)) {
          exact.push(r);
        } else if (isSingleOfQuery(r) && !singleMap.has(r.hanzi)) {
          singleMap.set(r.hanzi, r);
        } else {
          rest.push(r);
        }
      }

      const singles = charOrder.map(ch => singleMap.get(ch)).filter(Boolean);
      return [...exact, ...singles, ...rest];
    },
    resultOverrides(result) {
      if (!result) return null;
      const english = Array.isArray(result.english) ? result.english : (result.english || '');
      const prefIdx = Number.isFinite(result?._prefDefIndex) ? result._prefDefIndex : null;
      const orderNum = Number(result?.order);
      const order = Number.isFinite(orderNum) ? orderNum : null;
      return {
        preferredPinyin: result.pinyin,
        preferredEnglish: english,
        preferredIndex: prefIdx !== null ? prefIdx : order,
      };
    },
    ensureNavContextForUrlWord() {
      try {
        const word = this.$route.query.word || this.$store.getters['cardModal/getCurrentCharacter'];
        if (!word) return;
        const list = this.navCharList || [];
        if (!list.length) return;

        // Only seed nav context if it is currently empty; avoid overwriting an active index
        const storeList = this.$store.getters['cardModal/getNavList'] || [];
        if (Array.isArray(storeList) && storeList.length) return;

        if (list.includes(word)) {
          const index = list.indexOf(word);
          this.$store.dispatch('cardModal/setNavContext', { list, current: word, index, metaList: this.navMetaList });
        }
      } catch (e) {}
    },


    handleInput() {
      // Store the latest query value
      this.latestQuery = this.query;
      this.updateUrlQuery();
      
      // Clear any existing timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      const qlen = (this.query || '').trim().length;
      // Only trigger search if query has 1 or more characters
      if (qlen >= 1) {
        this.isLoading = true;
        this.searchTimeout = setTimeout(() => {
          this.isSearching = true;
          this.query = this.latestQuery;
          this.doSearch();
        }, 366);
      } else {
        // Clear results and loading state if query is too short
        this.results = [];
        this.resetGroupCollapse();
        this.isLoading = false;
        this.isSearching = false;
      }
    },
    
    debouncedSearch() {
      // Helper method to handle initial search with debounce logic
      if ((this.query || '').trim().length >= 1) {
        // Store the query as latestQuery to maintain consistency
        this.latestQuery = this.query;
        this.doSearch();
      }
    },
    
    async doSearch(queryOverride = null) {
      const searchQuery = ((queryOverride ?? this.latestQuery ?? this.query) || '').trim();
      if (!searchQuery) {
        this.isSearching = false;
        return;
      }
      // Keep latestQuery aligned with the actual query being searched
      this.latestQuery = searchQuery;
      // Only sync URL when the visible input drives the search
      if (!queryOverride) {
        this.updateUrlQuery();
      }
      this.isLoading = true;
      try {
        /*const res = await fetch('/api/search_results', {
          method: 'POST',
          headers: {
        'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: searchQuery }),
        });*/
        const res = await fetch(`/api/search_results?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        const rawResults = data.results || data.groups || [];
        this.results = this.filterResults(rawResults);
        this.resetGroupCollapse();
        this.$nextTick(() => this.ensureNavContextForUrlWord());
      } catch (error) {
        console.error("Error during search:", error);
      } finally {
        this.isLoading = false;
        this.isSearching = false;
      }
    },
    filterResults(results) {
      // Filter out multi-character results without definition and pinyin
      return results.map(group => {
        if (!group.items || !Array.isArray(group.items)) return group;

        const filteredItems = group.items.filter(entry => {
          if (!entry) return false;

          const item = entry.item;
          if (!item) return false;

          const hanzi = item.hanzi || '';
          const pinyin = (item.pinyin || '').trim();
          const english = (item.english || '').trim();

          // Count actual Chinese characters (not just string length)
          const chineseChars = Array.from(hanzi).filter(ch => /\p{Script=Han}/u.test(ch));

          // If it's a single Chinese character, keep it
          if (chineseChars.length <= 1) return true;

          // If it has more than 1 character, only keep if it has meaningful pinyin OR english
          // Check for empty, null, undefined, "-", "---", "N/A", etc.
          const isPlaceholder = (str) => !str || str === '-' || str === '--' || str === '---' || str === 'N/A';
          const hasPinyin = !isPlaceholder(pinyin);
          const hasEnglish = !isPlaceholder(english);

          return hasPinyin || hasEnglish;
        });

        return { ...group, items: filteredItems };
      }).filter(group => group.items && group.items.length > 0);
    },
    highlightMatch(text) {
      if (!this.query) return text;

      if (!text) return text;
      const stripAccents = (s) =>
        s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

      const plainText = stripAccents(text);
      const plainQuery = stripAccents(this.query);

      if (!plainQuery) return text;

      const indices = [];
      let i = 0;
      while (i < plainText.length) {
        const foundAt = plainText.indexOf(plainQuery, i);
        if (foundAt === -1) break;
        indices.push([foundAt, foundAt + plainQuery.length]);
        i = foundAt + plainQuery.length;
      }

      if (!indices.length) return text;

      // Apply highlights to original text using <mark> tag
      let result = '';
      let last = 0;
      for (const [start, end] of indices) {
        result += text.slice(last, start);
        // result += '<mark>' + text.slice(start, end) + '</mark>';
        result += text.slice(start, end);
        last = end;
      }
      result += text.slice(last);

      return result;
    },
    colorizePinyin(pinyin) {
      return toneColorizePinyin(pinyin, { enabled: this.toneColorEnabled, palette: this.toneColorScheme });
    },
    colorizeHanzi(hanzi, pinyin) {
      return toneColorizeHanzi(hanzi, pinyin, { enabled: this.toneColorEnabled, palette: this.toneColorScheme });
    },
    // New methods for scroll to top functionality
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
    
    handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      this.showScrollTop = scrollTop > 200;
    },
    toggleStrokePad() {
      const next = !this.showStrokePad;
      // If opening stroke pad, ensure OCR panel is closed
      if (next) {
        this.showOcrPanel = false;
      }
      this.showStrokePad = next;
      this.$nextTick(() => {
        if (this.showStrokePad) {
          this.initStrokeCanvas();
          this.loadHanziLookupScript();
          this.refreshStrokeColors();
        }
      });
    },
    toggleOcrPanel() {
      const next = !this.showOcrPanel;
      // If opening OCR, close stroke pad
      if (next) {
        this.showStrokePad = false;
      }
      this.showOcrPanel = next;
    },
    handleOcrInsert(text) {
      const cleaned = this.cleanHanText(text);
      if (!cleaned) return;
      const tokens = this.uniqueTokens(cleaned);
      if (!tokens.length) return;
      const combined = tokens.join(' ');
      this.isSearching = true;
      this.doSearch(combined);
    },
    cleanHanText(text) {
      if (!text) return '';
      return String(text)
        .replace(/[^\p{Script=Han}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    },
    uniqueTokens(text) {
      const parts = String(text || '')
        .split(/\s+/)
        .map(t => t.trim())
        .filter(Boolean);
      return Array.from(new Set(parts));
    },
    setupThemeObserver() {
      try {
        this.themeObserver = new MutationObserver(() => {
          this.updateThemeFromDom();
          this.refreshStrokeColors();
        });
        this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        this.updateThemeFromDom();
      } catch (e) {}
    },
    updateThemeFromDom() {
      const dark = document.documentElement.getAttribute('data-theme');
      const isDark = dark === 'dark' || dark === 'theme2';
      this.isDarkTheme = isDark;
    },
    refreshStrokeColors() {
      if (!this.showStrokePad || !this.strokeCanvasCtx) return;
      this.clearCanvas(false);
      this.redrawStrokes();
    },
    getStrokeCanvasSize() {
      const container = this.$refs.strokeContent;
      const containerWidth = container?.getBoundingClientRect ? container.getBoundingClientRect().width : window.innerWidth;
      return Math.min(380, Math.max(220, containerWidth - 24));
    },
    initStrokeCanvas() {
      const canvas = this.$refs.strokeCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const size = this.getStrokeCanvasSize();
      this.strokeCanvasSize = size;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      canvas.width = size;
      canvas.height = size;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(3, size / 25);
      const dark = document.documentElement.getAttribute('data-theme');
      const isDark = dark === 'dark' || dark === 'theme2';
      ctx.strokeStyle = isDark ? '#fff' : '#000';
      this.strokeCanvasCtx = ctx;
      this.clearCanvas();
      window.addEventListener('resize', this.resizeCanvas, { passive: true });
    },
    resizeCanvas() {
      if (!this.showStrokePad) return;
      if (this._resizePending) return;
      this._resizePending = requestAnimationFrame(() => {
        this._resizePending = null;
        const canvas = this.$refs.strokeCanvas;
        if (!canvas) return;
        const currentSize = this.strokeCanvasSize || canvas.width || 0;
        const size = this.getStrokeCanvasSize();
        if (!size || size === currentSize) return;
        const data = canvas.toDataURL();
        this.strokeCanvasSize = size;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(3, size / 25);
        const theme = document.documentElement.getAttribute('data-theme');
        ctx.strokeStyle = (theme === 'dark' || theme === 'theme2') ? '#fff' : '#000';
        this.strokeCanvasCtx = ctx;
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, size, size);
        };
        img.src = data;
      });
    },
    startDrawing(e) {
      if (!this.strokeCanvasCtx) return;
      this.isDrawing = true;
      const rect = this.$refs.strokeCanvas.getBoundingClientRect();
      const x = (e.offsetX !== undefined ? e.offsetX : e.clientX - rect.left);
      const y = (e.offsetY !== undefined ? e.offsetY : e.clientY - rect.top);
      this.lastX = x; this.lastY = y;
      this.currentStroke = [{ x, y }];
    },
    draw(e) {
      if (!this.isDrawing || !this.strokeCanvasCtx) return;
      const rect = this.$refs.strokeCanvas.getBoundingClientRect();
      const x = (e.offsetX !== undefined ? e.offsetX : e.clientX - rect.left);
      const y = (e.offsetY !== undefined ? e.offsetY : e.clientY - rect.top);
      const ctx = this.strokeCanvasCtx;
      ctx.beginPath();
      ctx.moveTo(this.lastX, this.lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      this.lastX = x; this.lastY = y;
      this.currentStroke.push({ x, y });
    },
    stopDrawing() {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      if (this.currentStroke.length > 0) {
        this.strokes.push(this.currentStroke.slice());
        this.currentStroke = [];
        this.searchByDrawing();
      }
    },
    handleTouchStart(e) {
      const touch = e.touches[0];
      const rect = this.$refs.strokeCanvas.getBoundingClientRect();
      this.startDrawing({
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
      });
    },
    handleTouchMove(e) {
      if (!this.isDrawing) return;
      const touch = e.touches[0];
      const rect = this.$refs.strokeCanvas.getBoundingClientRect();
      this.draw({
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
      });
    },
    clearCanvas(reset = true) {
      if (!this.strokeCanvasCtx || !this.$refs.strokeCanvas) return;
      const canvas = this.$refs.strokeCanvas;
      const size = this.strokeCanvasSize || canvas.width;
      const ctx = this.strokeCanvasCtx;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // light grid in CSS units
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      const step = size / 4;
      ctx.beginPath();
      ctx.moveTo(step, 0); ctx.lineTo(step, size);
      ctx.moveTo(step*2, 0); ctx.lineTo(step*2, size);
      ctx.moveTo(step*3, 0); ctx.lineTo(step*3, size);
      ctx.moveTo(0, step); ctx.lineTo(size, step);
      ctx.moveTo(0, step*2); ctx.lineTo(size, step*2);
      ctx.moveTo(0, step*3); ctx.lineTo(size, step*3);
      ctx.stroke();
      ctx.lineWidth = size / 25;
      const theme = document.documentElement.getAttribute('data-theme');
      ctx.strokeStyle = (theme === 'dark' || theme === 'theme2') ? '#fff' : '#000';
      if (reset) {
        this.strokes = [];
        this.currentStroke = [];
        this.strokeResults = [];
      }
    },
    redrawStrokes() {
      if (!this.strokeCanvasCtx) return;
      const ctx = this.strokeCanvasCtx;
      const theme = document.documentElement.getAttribute('data-theme');
      ctx.strokeStyle = (theme === 'dark' || theme === 'theme2') ? '#fff' : '#000';
      for (const stroke of this.strokes) {
        if (stroke.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
      }
    },
    undoStroke() {
      if (this.strokes.length === 0 || !this.strokeCanvasCtx) return;
      this.strokes.pop();
      this.clearCanvas(false);
      this.redrawStrokes();
      if (this.strokes.length) {
        this.searchByDrawing();
      } else {
        this.strokeResults = [];
      }
    },
    convertStrokesForLookup() {
      return this.strokes.map(stroke => stroke.map(pt => [pt.x, pt.y]));
    },
    searchByDrawing() {
      if (!this.hanzilookupReady || !window.HanziLookup || this.strokes.length === 0) return;
      const hStrokes = this.convertStrokesForLookup();
      try {
        const analyzed = new window.HanziLookup.AnalyzedCharacter(hStrokes);
        const matcher = new window.HanziLookup.Matcher('mmah');
        matcher.match(analyzed, 8, matches => {
          if (matches && matches.length) {
            this.strokeResults = matches.map(m => ({ character: m.character }));
            const tokens = this.uniqueTokens(matches.map(m => m.character).join(' '));
            if (tokens.length) {
              const searchQuery = tokens.join(' ');
              this.isSearching = true;
              this.doSearch(searchQuery);
            }
          }
        });
      } catch (e) {
        console.error('Stroke search error', e);
      }
    },
    loadHanziLookupScript() {
      if (this.hanzilookupReady || this._loadingLookup) return;
      this._loadingLookup = true;
      const script = document.createElement('script');
      script.src = 'https://assets.hanzi.abcrgb.xyz/hanzilookup/hanzilookup.min.js';
      script.async = true;
      script.onload = () => {
        const readyCheck = () => {
          try {
            let loaded = 0;
            const done = () => { loaded++; if (loaded === 2) { this.hanzilookupReady = true; this._loadingLookup = false; } };
            window.HanziLookup.init('mmah', 'https://assets.hanzi.abcrgb.xyz/hanzilookup/mmah.json', (ok)=> ok&&done());
            window.HanziLookup.init('orig', 'https://assets.hanzi.abcrgb.xyz/hanzilookup/orig.json', (ok)=> ok&&done());
          } catch (e) { this._loadingLookup = false; }
        };
        readyCheck();
      };
      script.onerror = () => { this._loadingLookup = false; };
      document.head.appendChild(script);
    }
  },
  watch: {
    results() {
      this.$nextTick(() => this.ensureNavContextForUrlWord());
    },
    '$route.query.word'() {
      this.ensureNavContextForUrlWord();
    }
  },
};
</script>

<style scoped>
.search-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0rem 2rem 2rem 2rem;
  flex-wrap: wrap;
  box-sizing: border-box;
}

.search-form {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 600px;
  margin: 2em auto;
  box-sizing: border-box;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.search-input {
  flex: 1;
  height: 2.2rem;
  padding: 0 1.75rem 0 0.65rem;
  font-size: 0.95rem;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 80%);
  color: var(--fg);
  line-height: 1.2;
  box-sizing: border-box;
}

.clear-btn {
  position: absolute;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  border: none;
  background: color-mix(in oklab, var(--fg) 15%, var(--bg) 80%);
  color: var(--fg);
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  transition: background 0.2s ease;
}

.clear-btn:hover {
  background: color-mix(in oklab, var(--fg) 25%, var(--bg) 70%);
}

.search-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: nowrap;
  flex-shrink: 0;
  align-items: stretch;
}

@media (orientation: portrait) {
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }

  .search-actions {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
  }
}

.loading-indicator {
  margin-top: 2rem;
  font-size: 1.5rem;
  color: var(--fg);
  opacity: 0.8;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  justify-content: center;
  align-items: stretch;
  max-width: 1500px;
}

.result-group {
  overflow: hidden;
  background: color-mix(in oklab, var(--bg) 90%, var(--fg) 5%);
  box-sizing: border-box;
}

.group-header {
  display: flex;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 10%, var(--bg) 15%);
  border-bottom: none;
  border-radius: 1px;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: color-mix(in oklab, var(--bg) 80%, var(--fg) 8%);
}

.group-header.clickable {
  cursor: pointer;
}

.group-title {
  letter-spacing: 0.01em;
}

.group-toggle {
  color: var(--fg);
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  user-select: none;
  font-weight: 700;
}

.group-body {
  display: flex;
  flex-direction: column;
}

.result-cell {
  border:var(--thin-border-width) solid color-mix(in oklab, var(--fg) 35%, var(--bg) 50%);
  padding: .15rem .5rem;
  font-family: inherit;
  text-align: left;
  background: var(--bg);
  width: 100%;
  display: flex;
  box-sizing: border-box;
  position: relative;
  font-size: .9em;

}

.result-cell:first-child {
  border-top: none;
}
.result-cell:last-child {
  border-top: none;
}

.result-cell:hover {
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  cursor: pointer;
}

.result-number {
  top: .25em;
  right: .25em;
  font-size: 0.9rem;
  color: var(--fg);
  opacity: 0.5;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hanzipinyin {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  flex: 2;
  padding-right: auto;

}


@media (max-width: 1024px) {
  .result-cell {
    flex-direction: column;
    align-items: flex-start;
  }
  .search-view {
  }

  .hanzipinyin {
  }
}



.stroke-toggle,
.ocr-toggle {
  align-items: center;
  justify-content: center;
  padding: 0 0.65rem;
  height: 2.2rem;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 80%);
  background: color-mix(in oklab, var(--bg) 90%, var(--fg) 5%);
  color: color-mix(in srgb, var(--fg) 35%, var(--bg) 85%);
  cursor: pointer;
}

.stroke-toggle[aria-pressed="true"],
.ocr-toggle[aria-pressed="true"] {
  border-color: color-mix(in oklab, var(--fg) 32%, var(--bg) 60%);
  color: var(--fg);
}

.ocr-panel-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
}

.ocr-loading {
  width: 100%;
  max-width: 900px;
  margin: 1rem auto;
  padding: 1rem;
  text-align: center;
  border-radius: 12px;
  background: color-mix(in oklab, var(--bg) 92%, var(--fg) 6%);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 22%, var(--bg) 70%);
  color: var(--fg);
}

.stroke-draw-wrap {
  width: 100%;
  max-width: 960px;
  margin: 0.35em auto 2em auto;
  padding: 1rem 1.25rem;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 22%, var(--bg) 78%);
  background: color-mix(in oklab, var(--bg) 94%, var(--fg) 6%);
  box-shadow: 0 10px 28px color-mix(in oklab, var(--fg) 6%, var(--bg) 92%);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-sizing: border-box;
}

.stroke-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  box-sizing: border-box;
}

.stroke-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stroke-content {
  display: grid;
  grid-template-columns: minmax(220px, 340px) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
  width: 100%;
}

.stroke-label { font-size: 0.95rem; opacity: 0.75; }

.stroke-buttons button {
  padding: 0.35rem 0.75rem;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 25%, var(--bg) 70%);
  background: color-mix(in oklab, var(--bg) 92%, var(--fg) 8%);
  color: var(--fg);
  cursor: pointer;
}

.stroke-canvas {
  flex-shrink: 0;
  width: 100%;
  max-width: 360px;
  aspect-ratio: 1 / 1;
  background: color-mix(in oklab, var(--bg) 97%, var(--fg) 3%);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 80%);
  touch-action: none;
  display: block;
  box-sizing: border-box;
}


@media (max-width: 768px) {
  .stroke-content {
    grid-template-columns: 1fr;
  }

  .stroke-canvas {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
  }

  .stroke-results {
    width: 100%;
  }
  
  .stroke-controls {
    align-items: flex-start;
  }
  .stroke-buttons {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  .stroke-draw-wrap {
    padding: 0.85rem 1rem;
  }
  .stroke-result-list {
    grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
  }
}


.clipboard-icon {
  position: absolute;
  top: 2px;
  right: 6px;
  font-size: 0.75rem;
  opacity: 0.65;
  pointer-events: none;
}

/* Scroll to top button styles */

.scroll-to-top-button {
  position: fixed;
  bottom: 1em;
  right: 1em;
  background: color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 25%, var(--bg) 100%);
  cursor: pointer;
  font-family: inherit;
  color: var(--fg);
  font-size: 1.1em;
  padding: 1em;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s, transform 0.3s;
}

.scroll-to-top-button:hover {
  background: color-mix(in oklab, var(--bg) 85%, var(--fg) 30%);
  transform: translateY(-3px);
  color: var(--fg);
}
</style>
