<template>
  <div v-if="modelValue" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <h3>Practice Sheet</h3>
      <div class="svg-modal-form">
        <div class="practice-input">
          <label for="rows-per-char">Rows per character</label>
          <select id="rows-per-char" v-model.number="rowsPerChar" style="margin-left: .5em;">
            <option v-for="n in [1,2,3,4,6,12]" :key="n" :value="n">{{ n }} row{{ n > 1 ? 's' : '' }}</option>
          </select>
        </div>

        <div class="practice-input">
          <label for="practice-chars">Characters</label>
          <textarea
            id="practice-chars"
            class="practice-chars-input"
            v-model="charInput"
            @input="filterChars"
            placeholder="Enter characters"
            autocomplete="off"
            rows="3"
          />
          <div class="input-hint">{{ filteredChars.length }}/100 characters</div>
        </div>
      </div>

      <div class="modal-buttons">
        <button @click="close" class="cancel-button">Cancel</button>
        <button @click="createPracticeSheet" class="confirm-button" :disabled="!canCreate">Create</button>
      </div>
    </div>
  </div>

  <div v-if="showPreview" class="modal-overlay" @click="showPreview = false">
    <div class="modal-content-svg" @click.stop>
      <h3>Practice Sheet Preview</h3>
      <div class="modal-svg-preview">
        <div class="modal-svg-content" v-html="practiceSheetSVG"></div>
      </div>
      <div class="svg-modal-buttons">
        <button @click="downloadPracticeSheetSVG" class="confirm-button" :disabled="!practiceSheetSVG">Download SVG</button>
        <button @click="downloadPracticeSheetPDF" class="confirm-button" :disabled="!practiceSheetStrokesData">Download PDF</button>
      </div>
      <div v-if="practiceSheetTotalPages > 1" class="modal-buttons pager">
        <button @click="updatePracticeSheetPage(currentPracticeSheetPage-1)" :disabled="currentPracticeSheetPage === 0">← Prev</button>
        <span style="margin:0 1rem;">Page {{ currentPracticeSheetPage+1 }} / {{ practiceSheetTotalPages }}</span>
        <button @click="updatePracticeSheetPage(currentPracticeSheetPage+1)" :disabled="currentPracticeSheetPage >= practiceSheetTotalPages-1">Next →</button>
      </div>
    </div>
  </div>
</template>

<script>
import { generatePracticeSheetSVG, generatePracticeSheetPDF } from '../lib/practiceSheetExport.js';

const onlyHanzi = (str) => Array.from(str || '')
  .filter(ch => /\p{Script=Han}/u.test(ch))
  .join('');

export default {
  name: 'PracticeSheetModal',
  props: {
    modelValue: { type: Boolean, default: false },
    initialChars: { type: String, default: '' },
    words: { type: Array, default: () => [] },
    sheetName: { type: String, default: 'practice_sheet' }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      charInput: this.initialChars || '',
      rowsPerChar: 1,
      practiceSheetSVG: '',
      practiceSheetStrokesData: null,
      practiceSheetDateStr: '',
      practiceSheetDateStrokesData: null,
      practiceSheetTotalPages: 1,
      currentPracticeSheetPage: 0,
      showPreview: false,
      charInfos: {}
    };
  },
  computed: {
    filteredChars() {
      const cleaned = onlyHanzi(this.charInput);
      const uniqueChars = Array.from(new Set(cleaned.split(''))).join('');
      return uniqueChars.slice(0, 100);
    },
    canCreate() {
      return this.filteredChars.length > 0 && this.filteredChars.length <= 100;
    },
    workingWords() {
      const chars = this.filteredChars.split('');
      const lookup = new Map();
      (Array.isArray(this.words) ? this.words : []).forEach(w => {
        if (w && w.character && w.character.length === 1) {
          lookup.set(w.character, w);
        }
      });
      return chars.map(ch => {
        const base = lookup.get(ch) || {};
        const info = this.charInfos[ch] || {};
        const rawList = Array.isArray(info.pinyin) && info.pinyin.length ? info.pinyin : (base.pinyin || ['']);
        const normalizedList = Array.isArray(rawList) ? rawList.filter(Boolean) : [rawList].filter(Boolean);
        const joined = normalizedList.join(' / ') || '';
        const englishList = base.english || [''];
        return { character: ch, pinyin: normalizedList.length ? normalizedList : [joined], english: englishList };
      });
    },
    sheetOption() {
      return this.rowsPerChar;
    }
  },
  watch: {
    initialChars(newVal) {
      this.charInput = newVal || '';
    },
    modelValue(val) {
      if (val) {
        this.ensureCharInfo();
        // Reset charInput from initialChars when modal opens
        this.charInput = this.initialChars || '';
      }
      if (val) {
        this.practiceSheetSVG = '';
        this.practiceSheetStrokesData = null;
        this.showPreview = false;
        this.currentPracticeSheetPage = 0;
      }
    }
  },
  methods: {
    async ensureCharInfo() {
      const chars = this.filteredChars;
      const missing = chars.split("").filter(ch => !this.charInfos[ch]);
      if (!missing.length) return;
      try {
        const res = await fetch("/api/get_characters_simple_info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characters: missing })
        });
        if (!res.ok) return;
        const data = await res.json();
        Object.assign(this.charInfos, data || {});
      } catch (e) { console.error("char info fetch failed", e); }
    },
    close() {
      this.$emit('update:modelValue', false);
    },
    filterChars() {
      const cleaned = onlyHanzi(this.charInput);
      // Remove duplicates by converting to a Set, then back to string
      const uniqueChars = Array.from(new Set(cleaned.split(''))).join('');
      this.charInput = uniqueChars.slice(0, 100);
    },
    async createPracticeSheet() {
      if (!this.canCreate) return;
      const chars = this.filteredChars;
      const charSet = new Set(chars.split(''));
      const uniqueChars = Array.from(charSet).join('');
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '年').replace(/\d+$/, (m) => m + '日');
      const dateCharSet = new Set((uniqueChars + dateStr).split(''));
      const dateChars = Array.from(dateCharSet).filter(c => /[\u4e00-\u9fa5年月日0-9]/.test(c)).join('');
      try {
        await this.ensureCharInfo();
        const response = await fetch(`/api/getStrokes/${uniqueChars}`);
        if (!response.ok) return;
        const strokesData = await response.json();
        let dateStrokesData = null;
        const dateResponse = await fetch(`/api/getStrokes/${dateChars}`);
        if (dateResponse.ok) {
          dateStrokesData = await dateResponse.json();
        }
        const { svg, totalPages } = generatePracticeSheetSVG(this.workingWords, strokesData, {
          selectedPracticeOption: this.sheetOption,
          windowHeight: 1123,
          page: 0,
          excludedChars: [],
          dateStr,
          dateStrokesData
        });
        this.practiceSheetSVG = svg;
        this.practiceSheetTotalPages = totalPages;
        this.currentPracticeSheetPage = 0;
        this.practiceSheetStrokesData = strokesData;
        this.practiceSheetDateStr = dateStr;
        this.practiceSheetDateStrokesData = dateStrokesData;
        this.showPreview = true;
      } catch (err) {
        console.error('Error fetching strokes:', err);
      }
    },
    updatePracticeSheetPage(page) {
      if (!this.practiceSheetStrokesData) return;
      const { svg } = generatePracticeSheetSVG(this.workingWords, this.practiceSheetStrokesData, {
        selectedPracticeOption: this.sheetOption,
        windowHeight: 1123,
        page,
        excludedChars: [],
        dateStr: this.practiceSheetDateStr,
        dateStrokesData: this.practiceSheetDateStrokesData
      });
      this.ensureCharInfo();
      this.practiceSheetSVG = svg;
      this.currentPracticeSheetPage = page;
    },
    downloadPracticeSheetSVG() {
      if (!this.practiceSheetSVG) return;
      const blob = new Blob([this.practiceSheetSVG], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.sheetName}_practice_sheet.svg`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    },
    async downloadPracticeSheetPDF() {
      if (!this.practiceSheetStrokesData) return;
      const blob = await generatePracticeSheetPDF(this.workingWords, this.practiceSheetStrokesData, {
        selectedPracticeOption: this.sheetOption,
        windowHeight: window.innerHeight * 0.8,
        noAccents: true,
        excludedChars: []
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.sheetName}_practice_sheet.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: color-mix(in srgb, var(--bg) 50%, rgba(0, 0, 0, 0.6) 40%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  max-width: min(1000px, 95vw);
  background-color: var(--bg);
  color: var(--fg);
  padding: 1.5rem;
  border-radius: var(--modal-border-radius, 8px);
  max-height: 90vh;
  overflow: auto;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 15%, var(--bg) 100%);
}
.modal-content-svg {
  max-width: min(1000px, 95vw);
  color: var(--fg);
  padding: 1.5rem;
  max-height: 90vh;
  overflow: auto;
}
.svg-modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.practice-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.practice-option {
  padding: 0.5rem 0.75rem;
  border: 1px solid color-mix(in oklab, var(--fg) 20%, var(--bg) 100%);
  border-radius: var(--border-radius, 4px);
  cursor: pointer;
  user-select: none;
}
.practice-option.selected {
  background: color-mix(in oklab, var(--fg) 12%, var(--bg) 100%);
}
.practice-input input,
.practice-input textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid color-mix(in oklab, var(--fg) 20%, var(--bg) 100%);
  border-radius: var(--border-radius, 4px);
  background: var(--bg);
  color: var(--fg);
  box-sizing: border-box;
  font-family: inherit;
  resize: vertical;
}
.input-hint {
  font-size: 0.85rem;
  opacity: 0.7;
}
.modal-buttons {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1rem;
}

.modal-buttons button {
}

.modal-svg-preview {
  background-color: var(--bg-dim);
  padding: 1rem;
  height: 70vh;
  aspect-ratio: 1/1.414;
  overflow: auto;
  border: 1px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 100%);
}
.modal-svg-content {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-svg-content svg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.svg-modal-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  margin-top: 1rem;
}

.practice-chars-input {
  letter-spacing: 0.25em;
}
.practice-chars-input::placeholder {
  letter-spacing: 0.0em;
}
</style>
