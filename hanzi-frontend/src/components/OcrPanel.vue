<template>
  <div class="ocr-panel">
    <div class="ocr-head">
      <div>
        <div class="ocr-title">Image OCR</div>
        <div v-if="!file" class="ocr-subtitle">Upload a screenshot to extract hanzi or mixed text.</div>
      </div>
      <div v-if="statusMessage" class="status-pill">{{ statusMessage }}</div>
    </div>

    <div class="input-row">
      <div
        class="drop-area"
        :class="{ 'is-active': isDragOver }"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="handleDrop"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="file-input"
          @change="handleFileChange"
        />
        <div class="drop-copy">
          <div class="drop-title" v-if="!file">Drop an image or click to choose</div>
          <div class="drop-hint" v-if="!file">PNG, JPG, screenshots. Nothing is uploaded to our servers.</div>
          <div v-if="fileName" class="file-chip">{{ fileName }}</div>
        </div>
        <div v-if="previewUrl" class="preview">
          <img :src="previewUrl" alt="Selected for OCR" />
        </div>
      </div>

      <div class="actions side-actions">
        <button
          type="button"
          class="btn-primary"
          @click="runOcr"
          :disabled="!file || isProcessing || !isReady"
        >
          <span v-if="isProcessing">Running OCR...</span>
          <span v-else-if="!isReady">Preparing OCR...</span>
          <span v-else>Run OCR</span>
        </button>
        <div
          v-if="progressValue > 0 || isProcessing"
          class="progress-vertical"
          :title="progressMessage"
        >
          <div class="progress-vertical-bar">
            <div class="progress-vertical-fill" :style="{ height: progressPercent + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="ocrText" class="result">
      <div class="result-header">
        <div>
          <div class="result-title">OCR result</div>
          <div class="result-subtitle">Review and refine before searching.</div>
        </div>
        <div class="result-actions">
          <button type="button" class="chip" @click="copyResult" :disabled="copySuccess">
            {{ copySuccess ? 'Copied' : 'Copy' }}
          </button>
          <button type="button" class="chip primary" @click="emitToSearch">
            Add to search
          </button>
        </div>
      </div>
      <div class="result-body">
        <textarea readonly :value="ocrText" style="box-sizing: border-box;"></textarea>
      </div>
    </div>
  </div>
</template>

<script>
let sharedTesseract = null;
export default {
  name: 'OcrPanel',
  emits: ['insert-text'],
  data() {
    return {
      file: null,
      fileName: '',
      previewUrl: '',
      isDragOver: false,
      isProcessing: false,
      isReady: false,
      progressValue: 0,
      statusMessage: 'Loading OCR engine...',
      progressMessage: '',
      error: '',
      ocrText: '',
      copySuccess: false,
      tesseract: null,
    };
  },
  computed: {
    progressPercent() {
      if (!this.progressValue) return 0;
      const pct = Math.round(this.progressValue * 100);
      return Math.min(100, Math.max(0, pct));
    },
  },
  async mounted() {
    await this.ensureLibLoaded();
  },
  beforeUnmount() {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  },
  methods: {
    handleFileChange(event) {
      const [file] = event.target.files || [];
      this.setFile(file);
    },
    handleDrop(event) {
      this.isDragOver = false;
      const [file] = event.dataTransfer?.files || [];
      this.setFile(file);
    },
    setFile(file) {
      if (!file) return;
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }
      this.file = file;
      this.fileName = file.name;
      this.previewUrl = URL.createObjectURL(file);
      this.error = '';
      this.ocrText = '';
      this.copySuccess = false;
      this.progressValue = 0;
      this.progressMessage = '';
    },
    async ensureLibLoaded() {
      if (sharedTesseract) {
        this.tesseract = sharedTesseract;
        this.isReady = true;
        this.statusMessage = '';
        return;
      }
      if (this.tesseract) return;
      this.isReady = false;
      this.statusMessage = 'Loading OCR engine...';
      try {
        const mod = await import('tesseract.js');
        this.tesseract = mod?.recognize ? mod : mod.default;
        if (!this.tesseract || !this.tesseract.recognize) {
          throw new Error('Tesseract recognize not available');
        }
        sharedTesseract = this.tesseract;
        this.isReady = true;
        this.statusMessage = 'Ready';
        setTimeout(() => {
          if (this.statusMessage === 'Ready') this.statusMessage = '';
        }, 800);
      } catch (e) {
        console.error('Failed to load tesseract', e);
        this.error = 'Unable to load OCR tools. Please retry.';
        this.statusMessage = '';
      }
    },
    handleProgress(message) {
      if (!message) return;
      if (message.progress !== undefined) {
        this.progressValue = message.progress;
      }
      if (message.status) {
        this.progressMessage = `${message.status} ${message.progress ? Math.round(message.progress * 100) + '%' : ''}`.trim();
      }
    },
    async runOcr() {
      if (!this.file) {
        this.error = 'Choose an image to start.';
        return;
      }
      await this.ensureLibLoaded();
      if (!this.tesseract) return;

      this.isProcessing = true;
      this.error = '';
      this.ocrText = '';
      this.progressValue = 0;
      this.progressMessage = 'Preparing...';

      try {
        const { data } = await this.tesseract.recognize(this.file, 'chi_sim', {
          logger: (m) => this.handleProgress(m),
        });
        this.ocrText = (data?.text || '').trim();
        this.progressValue = 1;
        this.progressMessage = 'Done';
      } catch (e) {
        console.error('OCR failed', e);
        this.error = 'OCR failed. Please try a clearer image or retry.';
      } finally {
        this.isProcessing = false;
      }
    },
    async copyResult() {
      if (!this.ocrText || !navigator?.clipboard) return;
      try {
        await navigator.clipboard.writeText(this.ocrText);
        this.copySuccess = true;
        setTimeout(() => { this.copySuccess = false; }, 1500);
      } catch (e) {
        console.error('Copy failed', e);
      }
    },
    emitToSearch() {
      if (!this.ocrText) return;
      this.$emit('insert-text', this.ocrText.trim());
    },
  },
};
</script>

<style scoped>
.ocr-panel {
  width: 100%;
  max-width: 900px;
  margin: 1.5rem auto;
  padding: 1.5rem;
  background: color-mix(in oklab, var(--bg) 92%, var(--fg) 6%);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 25%, var(--bg) 70%);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  box-sizing: border-box;
}

.input-row {
  width: 100%;
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.ocr-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  margin-bottom: 0.25rem;
  width: 100%;
}

.ocr-title {
  font-size: 1.1rem;
  font-weight: 700;
}

.ocr-subtitle {
  color: color-mix(in oklab, var(--fg) 60%, var(--bg));
  font-size: 0.95rem;
}

.status-pill {
  background: color-mix(in oklab, var(--fg) 12%, var(--bg) 80%);
  color: var(--fg);
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 25%, var(--bg) 60%);
  align-self: flex-start;
}

.drop-area {
  position: relative;
  border: 2px dashed color-mix(in oklab, var(--fg) 35%, var(--bg) 50%);
  background: color-mix(in oklab, var(--bg) 85%, var(--fg) 4%);
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.drop-area.is-active {
  border-color: color-mix(in oklab, var(--fg) 60%, var(--bg) 30%);
  background: color-mix(in oklab, var(--bg) 80%, var(--fg) 8%);
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.drop-copy {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.drop-title {
  font-weight: 700;
}

.drop-hint {
  font-size: 0.95rem;
  color: color-mix(in oklab, var(--fg) 55%, var(--bg));
}

.file-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.65rem;
  border-radius: 999px;
  background: color-mix(in oklab, var(--fg) 10%, var(--bg) 82%);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 70%);
  font-size: 0.9rem;
}

.preview {
  width: 100%;
  max-width: 320px;
  max-height: 70px;
  overflow: hidden;
  border-radius: 10px;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 70%);
  background: var(--bg);
}

.preview img {
  width: 100%;
  height: auto;
  max-height: 70px;
  object-fit: contain;
  display: block;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin: 0.35rem 0 0.35rem;
}

.side-actions {
  margin: 0;
  align-self: stretch;
  display: flex;
  align-items: center;
}

.side-actions .btn-primary {
  width: 100%;
  height: 100%;
  min-height: 48px;
}

.btn-primary,
.btn-secondary {
  border: none;
  padding: 0.7rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.btn-primary {
  background: color-mix(in oklab, var(--fg) 80%, var(--bg) 10%);
  color: var(--bg);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.12);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-secondary {
  background: color-mix(in oklab, var(--bg) 85%, var(--fg) 10%);
  color: var(--fg);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 70%);
}

.btn-primary:not(:disabled):hover,
.btn-secondary:not(:disabled):hover {
  transform: translateY(-1px);
}

.progress-vertical {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 0.5rem;
}

.progress-vertical-bar {
  width: 10px;
  height: 120px;
  border-radius: 8px;
  background: color-mix(in oklab, var(--bg) 85%, var(--fg) 6%);
  overflow: hidden;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 18%, var(--bg) 70%);
}

.progress-vertical-fill {
  width: 100%;
  background: color-mix(in oklab, var(--fg) 70%, var(--bg) 5%);
  transition: height 0.2s ease;
  height: 0%;
}

.error {
  color: #c0392b;
  background: color-mix(in oklab, #c0392b 10%, var(--bg) 85%);
  border: var(--thin-border-width) solid color-mix(in oklab, #c0392b 40%, var(--bg) 60%);
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.result {
  margin-top: 1rem;
  background: color-mix(in oklab, var(--bg) 90%, var(--fg) 6%);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 22%, var(--bg) 70%);
  border-radius: 12px;
  padding: 1rem;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.result-title {
  font-weight: 700;
}

.result-subtitle {
  color: color-mix(in oklab, var(--fg) 60%, var(--bg));
  font-size: 0.95rem;
}

.result-actions {
  display: flex;
  gap: 0.5rem;
}

.chip {
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 70%);
  background: color-mix(in oklab, var(--bg) 85%, var(--fg) 10%);
  border-radius: 999px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  font-weight: 600;
}

.chip.primary {
  background: color-mix(in oklab, var(--fg) 75%, var(--bg) 8%);
  color: var(--bg);
  border: none;
}

.result-body textarea {
  width: 100%;
  min-height: 140px;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 70%);
  border-radius: 10px;
  padding: 0.8rem;
  background: color-mix(in oklab, var(--bg) 92%, var(--fg) 4%);
  color: var(--fg);
  font-family: inherit;
  resize: vertical;
}

@media (max-width: 720px) {
  .input-row {
    flex-direction: column;
  }

  .side-actions {
    width: 100%;
  }

  .side-actions .btn-primary {
    width: 100%;
  }

  .drop-area {
    flex-direction: column;
    align-items: flex-start;
  }

  .preview {
    width: 100%;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .result-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .result-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
