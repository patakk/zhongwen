<template>
  <BasePage page_title="Hanzi" />
  <div class="search-view">
    <form @submit.prevent="doSearch" class="search-form">
      <input
        v-model="query"
        type="text"
        placeholder="enter search term"
        class="search-input"
        @input="handleInput"
      />
      <button type="button" class="stroke-toggle" @click="toggleStrokePad" :aria-pressed="showStrokePad" title="Draw search">
        <font-awesome-icon :icon="['fas','pen-fancy']" />
      </button>
      <!-- Search button kept but hidden by default -->
      <button type="submit" class="search-button" style="display: none;">Search</button>
    </form>
    <div v-if="isSearching" class="loading-indicator">
      searching...
    </div>

    <div v-if="showStrokePad" class="stroke-draw-wrap">
      <div class="stroke-controls">
        <span class="stroke-label">Draw character</span>
        <div class="stroke-buttons">
          <button type="button" @click="undoStroke" :disabled="strokes.length === 0">Undo</button>
          <button type="button" @click="clearCanvas" :disabled="strokes.length === 0">Clear</button>
        </div>
      </div>
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
        <span class="stroke-label">tap to add:</span>
        <div class="stroke-result-list">
          <button
            v-for="(res, idx) in strokeResults"
            :key="idx"
            type="button"
            class="stroke-result-btn"
            @click="appendCharFromStroke(res.character)"
          >
            {{ res.character }}
          </button>
        </div>
      </div>
    </div>
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
          >
            <div class="result-cell">
              <div class="result-number">{{ entry.displayIdx + 1 }}</div>
              <div class="hanzipinyin">
                <div class="rhanzi">{{ entry.item.hanzi }}</div>
                <div class="rpinyin" v-html="highlightMatch($toAccentedPinyin(entry.item.pinyin))"></div>
              </div>
              <div class="renglish" v-html="highlightMatch($toAccentedPinyin(entry.item.english))"></div>
            </div>
          </PreloadWrapper>
        </div>
      </div>
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
import BasePage from '../components/BasePage.vue';
import PreloadWrapper from '../components/PreloadWrapper.vue';

export default {
  components: {
    BasePage,
    PreloadWrapper,
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
      const raw = Array.isArray(this.results) ? this.results : [];
      const annotated = raw.map((item, idx) => ({ item, originalIdx: idx }));
      const query = this.latestQuery || this.query || '';
      const onlyHanzi = this.isHanziOnly(query);
      const hanziChars = this.extractHanzi(query);
      const effectiveQuery = hanziChars.join('');

      if (!annotated.length) return [];

      if (!onlyHanzi || !hanziChars.length) {
        const tokens = (query || '').trim().split(/\s+/).filter(Boolean);
        const norm = (s) => (s || '')
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/\d/g, '')
          .replace(/\*/g, '')
          .toLowerCase();
        const queryNorm = norm(query);
        const joinedNorm = queryNorm.replace(/\s+/g, '');

        const groups = [];
        const used = new Set();

        // Exact matches explicitly flagged by backend (e.g., mixed hanzi+pinyin inference)
        const backendExact = annotated.filter(entry => entry.item?.is_pinyin_exact);
        backendExact.forEach(e => used.add(e.originalIdx));
        if (backendExact.length) {
          groups.push({ key: 'pinyin-exact', label: query.trim(), collapsible: true, items: backendExact });
        }

        // Full-query matches first when multiple tokens
        if (tokens.length > 1 && backendExact.length === 0) {
          const exactItems = annotated.filter(entry => {
            const p = norm(entry.item?.pinyin || '');
            return p.includes(queryNorm) || p.replace(/\s+/g, '').includes(joinedNorm);
          });
          exactItems.forEach(e => used.add(e.originalIdx));
          if (exactItems.length) {
            groups.push({ key: 'pinyin-exact', label: query.trim(), collapsible: true, items: exactItems });
          }
        }

        // Token-ordered groups (preserve query order)
        let tokenGroupsAdded = false;
        if (tokens.length) {
          tokens.forEach((tok, idx) => {
            const hanziTok = this.extractHanzi(tok).join('');
            if (hanziTok) {
              const tokItems = annotated.filter(entry => {
                if (used.has(entry.originalIdx)) return false;
                const h = entry.item?.hanzi || '';
                return h.includes(hanziTok);
              });
              tokItems.forEach(e => used.add(e.originalIdx));
              if (tokItems.length) {
                groups.push({ key: `hanzi-${idx}-${hanziTok}`, label: hanziTok, collapsible: true, items: tokItems });
                tokenGroupsAdded = true;
              }
              return;
            }
            const tnorm = norm(tok);
            let tokItems = annotated.filter(entry => {
              if (used.has(entry.originalIdx)) return false;
              const p = norm(entry.item?.pinyin || '');
              return p.includes(tnorm);
            });
            tokItems.forEach(e => used.add(e.originalIdx));
            if (tokItems.length) {
              groups.push({ key: `pinyin-${idx}-${tok}`, label: tok, collapsible: true, items: tokItems });
              tokenGroupsAdded = true;
              return;
            }
            // Fallback: group by English definition match
            const engItems = annotated.filter(entry => {
              if (used.has(entry.originalIdx)) return false;
              const def = (entry.item?.english || '').toString().toLowerCase();
              return def.includes(tnorm);
            });
            engItems.forEach(e => used.add(e.originalIdx));
            if (engItems.length) {
              groups.push({ key: `english-${idx}-${tok}`, label: tok, collapsible: true, items: engItems });
              tokenGroupsAdded = true;
            }
          });
        }

        // Any remaining
        const extras = annotated.filter(e => !used.has(e.originalIdx));
        if (extras.length) {
          groups.push({ key: 'pinyin-other', label: (query || '').trim() || 'Other', collapsible: true, items: extras });
        }

        // Numbering
        let displayIdx = 0;
        groups.forEach(g => g.items.forEach(e => { e.displayIdx = displayIdx++; }));
        return groups.filter(g => g.items && g.items.length);
      }

      const charOrder = [];
      for (const ch of hanziChars) {
        if (ch && !charOrder.includes(ch)) charOrder.push(ch);
      }
      const tokens = (this.latestQuery || this.query || '').split(/\s+/).map(t => this.extractHanzi(t).join('')).filter(Boolean);

      const groups = [];
      const used = new Set();

      const exactItems = annotated.filter(entry => entry.item && entry.item.hanzi === effectiveQuery);
      exactItems.forEach(entry => used.add(entry.originalIdx));

      // Token-level exact groups if query had spaces
      if (tokens.length > 1) {
        tokens.forEach((tok, idx) => {
          const tokItems = annotated.filter(entry => !used.has(entry.originalIdx) && entry.item && entry.item.hanzi === tok);
          tokItems.forEach(entry => used.add(entry.originalIdx));
          if (tokItems.length) {
            groups.push({ key: `token-${idx}-${tok}`, label: tok, collapsible: false, items: tokItems });
          }
        });
      }

      const perChar = {};
      const extras = [];
      for (const entry of annotated) {
        if (used.has(entry.originalIdx)) continue;
        const hanzi = (entry.item && entry.item.hanzi) || '';
        let bucket = null;
        for (const ch of charOrder) {
          if (hanzi.includes(ch)) { bucket = ch; break; }
        }
        if (bucket) {
          if (!perChar[bucket]) perChar[bucket] = [];
          perChar[bucket].push(entry);
        } else {
          extras.push(entry);
        }
      }

      if (charOrder.length === 1) {
        const ch = charOrder[0];
        const combined = [];
        const seenIdx = new Set();
        exactItems.forEach(e => { if (!seenIdx.has(e.originalIdx)) { combined.push(e); seenIdx.add(e.originalIdx); } });
        (perChar[ch] || []).forEach(e => { if (!seenIdx.has(e.originalIdx)) { combined.push(e); seenIdx.add(e.originalIdx); } });
        (extras || []).forEach(e => { if (!seenIdx.has(e.originalIdx)) { combined.push(e); seenIdx.add(e.originalIdx); } });
        if (combined.length) {
          groups.push({ key: `char-${ch}`, label: ch, collapsible: false, items: combined, anchor: ch });
        }
      } else {
        if (exactItems.length) {
          groups.push({ key: `exact-${effectiveQuery}`, label: `${effectiveQuery}`, collapsible: true, items: exactItems });
        }
        for (const ch of charOrder) {
          const items = perChar[ch];
          if (items && items.length) {
            groups.push({ key: `char-${ch}`, label: ch, collapsible: true, items, anchor: ch });
          }
        }
        if (extras.length) {
          groups.push({ key: 'other', label: 'Other matches', collapsible: true, items: extras });
        }
      }

      // Drop any empty groups before numbering
      const nonEmpty = groups.filter(g => Array.isArray(g.items) && g.items.length);
      if (!nonEmpty.length) return [];


      const orderVal = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
      };

      const sortWithinHanzi = (items, anchorChar = null) => {
        const buckets = new Map();
        items.forEach((entry, idx) => {
          const h = entry?.item?.hanzi;
          if (!h) return;
          if (!buckets.has(h)) buckets.set(h, []);
          buckets.get(h).push({ entry, idx });
        });
        const startsWithAnchor = (hanzi) => {
          if (!anchorChar) return 1;
          return hanzi && hanzi.startsWith(anchorChar) ? 0 : 1;
        };
        for (const list of buckets.values()) {
          if (list.length <= 1) continue;
          const positions = list.map(x => x.idx).sort((a, b) => a - b);
          const sorted = list.slice().sort((a, b) => {
            const sa = startsWithAnchor(a.entry?.item?.hanzi);
            const sb = startsWithAnchor(b.entry?.item?.hanzi);
            if (sa !== sb) return sa - sb;
            const va = orderVal(a.entry?.item?.order);
            const vb = orderVal(b.entry?.item?.order);
            if (va !== vb) return va - vb;
            return a.idx - b.idx;
          }).map(x => x.entry);
          sorted.forEach((entry, i) => { if (entry?.item) entry.item._prefDefIndex = i; });
          positions.forEach((pos, i) => { items[pos] = sorted[i]; });
        }
        return items;
      };

      const sortGroupItems = (items, anchorChar = null) => {
        const startsWithAnchor = (hanzi) => {
          if (!anchorChar) return 1;
          return hanzi && hanzi.startsWith(anchorChar) ? 0 : 1;
        };
        const charPos = (hanzi) => {
          if (!anchorChar || !hanzi) return Number.MAX_SAFE_INTEGER;
          const idx = hanzi.indexOf(anchorChar);
          return idx >= 0 ? idx : Number.MAX_SAFE_INTEGER;
        };
        return items.slice().sort((a, b) => {
          const ha = a?.item?.hanzi || '';
          const hb = b?.item?.hanzi || '';
          const sa = startsWithAnchor(ha);
          const sb = startsWithAnchor(hb);
          if (sa !== sb) return sa - sb;
          const pa = charPos(ha);
          const pb = charPos(hb);
          if (pa !== pb) return pa - pb;
          const va = orderVal(a?.item?.order);
          const vb = orderVal(b?.item?.order);
          if (va !== vb) return va - vb;
          return (a.originalIdx ?? 0) - (b.originalIdx ?? 0);
        });
      };

      groups.forEach(g => {
        const anchor = g.anchor || null;
        g.items = sortWithinHanzi(g.items.slice(), anchor);
        g.items = sortGroupItems(g.items, anchor);
      });

      let displayIdx = 0;
      groups.forEach(g => {
        g.items.forEach(e => { e.displayIdx = displayIdx++; });
      });

      return groups;
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
            this.results = data.results;
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
    
    async doSearch() {
      this.isLoading = true;
      this.updateUrlQuery();
      try {
        const res = await fetch('/api/search_results', {
          method: 'POST',
          headers: {
        'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: this.latestQuery }),
        });
        const data = await res.json();
        const rawResults = data.results || [];
        const onlyHanzi = this.isHanziOnly(this.latestQuery);
        const cleanQuery = this.extractHanzi(this.latestQuery).join('');
        let ordered = rawResults;
        if (onlyHanzi && cleanQuery) {
          ordered = this.reorderHanziResults(rawResults, cleanQuery);
        }
        this.results = ordered;
        this.resetGroupCollapse();
        this.$nextTick(() => this.ensureNavContextForUrlWord());
      } catch (error) {
        console.error("Error during search:", error);
      } finally {
        this.isLoading = false;
        this.isSearching = false;
      }
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
    
    // New methods for scroll to top functionality
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
    
    handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      this.showScrollTop = scrollTop > 200;
    },
    toggleStrokePad() {
      this.showStrokePad = !this.showStrokePad;
      this.$nextTick(() => {
        if (this.showStrokePad) {
          this.initStrokeCanvas();
          this.loadHanziLookupScript();
          this.refreshStrokeColors();
        }
      });
    },
    setupThemeObserver() {
      try {
        this.themeObserver = new MutationObserver(() => {
          this.refreshStrokeColors();
        });
        this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      } catch (e) {}
    },
    refreshStrokeColors() {
      if (!this.showStrokePad || !this.strokeCanvasCtx) return;
      this.clearCanvas(false);
      this.redrawStrokes();
    },
    initStrokeCanvas() {
      const canvas = this.$refs.strokeCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const size = Math.min(340, window.innerWidth - 40);
      this.strokeCanvasSize = size;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      canvas.width = size;
      canvas.height = size;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = size / 25;
      const dark = document.documentElement.getAttribute('data-theme');
      const isDark = dark === 'dark' || dark === 'theme2';
      ctx.strokeStyle = isDark ? '#fff' : '#000';
      this.strokeCanvasCtx = ctx;
      this.clearCanvas();
      window.addEventListener('resize', this.resizeCanvas);
    },
    resizeCanvas() {
      if (!this.showStrokePad) return;
      const canvas = this.$refs.strokeCanvas;
      if (!canvas) return;
      const data = canvas.toDataURL();
      const size = Math.min(340, window.innerWidth - 40);
      this.strokeCanvasSize = size;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = size / 25;
      const theme = document.documentElement.getAttribute('data-theme');
      ctx.strokeStyle = (theme === 'dark' || theme === 'theme2') ? '#fff' : '#000';
      this.strokeCanvasCtx = ctx;
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);
      };
      img.src = data;
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
    },
    appendCharFromStroke(char) {
      this.query += char;
      this.latestQuery = this.query;
      this.clearCanvas();
      this.doSearch();
      this.showStrokePad = false;
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
  padding: 2rem;
  flex-wrap: wrap;
}

.search-form {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  max-width: 600px;
  margin: 0 auto 2rem auto;
  flex-wrap: wrap; /* Add this line to make input and button wrap on narrow screens */
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
}

.group-header {
  display: flex;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 25%, var(--bg) 60%);
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
  padding: .5rem;
  font-family: inherit;
  text-align: left;
  background: var(--bg);
  width: 100%;
  display: flex;
  box-sizing: border-box;
  position: relative; /* Added for absolute positioning of number indicator */
}

.result-cell:first-child {
  border-top: none;
}

.result-cell:hover {
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  cursor: pointer;
}

.result-number {
  position: absolute;
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
  z-index: 5;
}

.hanzipinyin {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  flex: 2;
}

.rhanzi {
  font-size: 2rem;
  padding-right: 2rem;
  font-family: var(--main-word-font, 'Noto Serif SC', 'Kaiti', serif);
}

.rpinyin {
  font-style: italic;
  color: var(--fg);
  opacity: 0.6;
}

.renglish {
  color: var(--fg);
  flex: 12;
  margin-right: 1em;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

@media (max-width: 600px) {
  .result-cell {
    flex-direction: column;
    align-items: flex-start;
  }
  .search-view {
    padding: 1rem;
  }
}


.stroke-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0.6rem;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 80%);
  background: color-mix(in oklab, var(--bg) 90%, var(--fg) 10%);
  color: var(--fg);
  cursor: pointer;
}

.stroke-draw-wrap {
  width: 100%;
  max-width: 600px;
  margin: 0.5rem auto 1rem auto;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 25%, var(--bg) 80%);
  padding: 0.75rem;
  background: color-mix(in oklab, var(--bg) 95%, var(--fg) 5%);
}

.stroke-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}

.stroke-label { font-size: 0.95rem; opacity: 0.7; }

.stroke-buttons button {
  margin-left: 0.35rem;
  padding: 0.35rem 0.6rem;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 25%, var(--bg) 70%);
  background: var(--bg);
  color: var(--fg);
  cursor: pointer;
}

.stroke-canvas {
  width: 100%;
  background: color-mix(in oklab, var(--bg) 97%, var(--fg) 3%);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 80%);
  touch-action: none;
  display: block;
}

.stroke-results {
  margin-top: 0.35rem;
}

.stroke-result-list {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.stroke-result-btn {
  padding: 0.35rem 0.55rem;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 25%, var(--bg) 70%);
  background: color-mix(in oklab, var(--bg) 90%, var(--fg) 10%);
  color: var(--fg);
  cursor: pointer;
  font-family: var(--main-word-font, 'Noto Serif SC', 'Kaiti', serif);
  font-size: 1.2rem;
}

.stroke-result-btn:hover {
  background: color-mix(in oklab, var(--bg) 80%, var(--fg) 20%);
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
  z-index: 20;
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
