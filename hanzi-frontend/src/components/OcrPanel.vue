<template>
  <div class="ocr-panel">
      

    <div class="input-row">
      <div
        class="drop-area"
        :class="{ 'is-active': isDragOver }"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="handleDrop"
        @click="openFilePicker"
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
        <div class="drop-actions">
          <button
            v-if="file"
            type="button"
            class="crop-btn"
            @click.stop="openCropper"
          >
            Crop image
          </button>
          <button
            type="button"
            class="btn-primary run-btn"
            :class="{ processing: isProcessing }"
            @click.stop="runOcr"
            :disabled="!file || isProcessing || !isReady"
            :style="runButtonStyle"
          >
            <span v-if="isProcessing">Running OCR...</span>
            <span v-else-if="!isReady">Preparing OCR...</span>
            <span v-else>Run OCR</span>
          </button>
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
        <textarea v-model="ocrText" style="box-sizing: border-box;"></textarea>
      </div>
    </div>
  </div>

    <div v-if="showCropper" class="crop-modal">
      <div class="crop-dialog">
        <div class="crop-header">
          <div>
            <div class="crop-title">Crop image</div>
            <div class="crop-subtitle">Drag to select the area to OCR.</div>
          </div>
          <button type="button" class="chip" @click="closeCropper">Cancel</button>
        </div>
        <div
          class="crop-stage"
          ref="cropStage"
          @pointerdown.prevent="startCrop"
          @pointermove.prevent="onCropMove"
          @pointerup.prevent="endCrop"
          @pointerleave.prevent="endCrop"
        >
          <img ref="cropImg" :src="previewUrl" alt="Crop" @load="initCropSelection" />
          <div
            v-if="cropSelection"
            class="crop-rect"
            :style="cropStyle"
          ></div>
        </div>
        <div class="crop-actions">
          <button type="button" class="btn-secondary" @click="closeCropper">Back</button>
          <button type="button" class="btn-primary" @click="applyCrop" :disabled="!cropSelection || isProcessing">
            Apply crop
          </button>
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
      // crop state
      showCropper: false,
      cropSelection: null,
      cropSelecting: false,
      cropImageDims: { displayWidth: 0, displayHeight: 0, offsetX: 0, offsetY: 0 },
    };
  },
  computed: {
    progressPercent() {
      if (!this.progressValue) return 0;
      const pct = Math.round(this.progressValue * 100);
      return Math.min(100, Math.max(0, pct));
    },
    cropStyle() {
      if (!this.cropSelection) return {};
      const { x, y, w, h } = this.normalizedSelection();
      const { offsetX = 0, offsetY = 0 } = this.cropImageDims || {};
      return {
        left: `${offsetX + x}px`,
        top: `${offsetY + y}px`,
        width: `${w}px`,
        height: `${h}px`,
      };
    },
    runButtonStyle() {
      const pct = this.progressPercent || 0;
      const fill = 'color-mix(in oklab, var(--fg) 80%, var(--bg) 15%)';
      const base = 'color-mix(in oklab, var(--fg) 70%, var(--bg) 25%)';
      return {
        backgroundImage: `linear-gradient(90deg, ${fill} ${pct}%, ${base} ${pct}%)`,
      };
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
    openFilePicker() {
      if (!this.$refs.fileInput) return;
      this.$refs.fileInput.click();
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
      this.showCropper = false;
    },
    openCropper() {
      if (!this.previewUrl) return;
      this.showCropper = true;
      this.$nextTick(() => this.initCropSelection());
    },
    closeCropper() {
      this.showCropper = false;
      this.cropSelecting = false;
    },
    initCropSelection() {
      const img = this.$refs.cropImg;
      if (!img) return;
      const rect = img.getBoundingClientRect();
      const { width, height } = rect;
      const stage = this.$refs.cropStage;
      const stageRect = stage ? stage.getBoundingClientRect() : rect;
      let padX = 0; let padY = 0;
      if (stage) {
        const cs = getComputedStyle(stage);
        const borderX = parseFloat(cs.borderLeftWidth || '0');
        const borderY = parseFloat(cs.borderTopWidth || '0');
        padX = parseFloat(cs.paddingLeft || '0') + borderX;
        padY = parseFloat(cs.paddingTop || '0') + borderY;
      }
      const offsetX = rect.left - stageRect.left - padX;
      const offsetY = rect.top - stageRect.top - padY;
      this.cropImageDims = { displayWidth: width, displayHeight: height, offsetX, offsetY };
      const size = Math.min(width, height) * 0.7;
      const x = Math.max(0, (width - size) / 2);
      const y = Math.max(0, (height - size) / 2);
      this.cropSelection = { x, y, w: size, h: size };
      this.$nextTick(() => { this.cropSelection = this.normalizedSelection(); });
    },
    pointerPos(evt) {
      const stage = this.$refs.cropStage;
      if (!stage) return null;
      const rect = stage.getBoundingClientRect();
      const cs = getComputedStyle(stage);
      const padX = parseFloat(cs.paddingLeft || '0') + parseFloat(cs.borderLeftWidth || '0') + 2;
      const padY = parseFloat(cs.paddingTop || '0') + parseFloat(cs.borderTopWidth || '0') + 2;
      const clientX = evt.clientX ?? (evt.touches && evt.touches[0]?.clientX);
      const clientY = evt.clientY ?? (evt.touches && evt.touches[0]?.clientY);
      if (clientX === undefined || clientY === undefined) return null;
      return { x: clientX - rect.left - padX, y: clientY - rect.top - padY };
    },
    startCrop(evt) {
      const pos = this.pointerPos(evt);
      if (!pos) return;
      const { offsetX = 0, offsetY = 0, displayWidth, displayHeight } = this.cropImageDims || {};
      const x = Math.max(0, Math.min(pos.x - offsetX, displayWidth));
      const y = Math.max(0, Math.min(pos.y - offsetY, displayHeight));
      this.cropSelecting = true;
      this.cropSelection = { x, y, w: 0, h: 0 };
    },
    onCropMove(evt) {
      if (!this.cropSelecting || !this.cropSelection) return;
      const pos = this.pointerPos(evt);
      if (!pos) return;
      const { offsetX = 0, offsetY = 0, displayWidth, displayHeight } = this.cropImageDims || {};
      const x = Math.max(0, Math.min(pos.x - offsetX, displayWidth));
      const y = Math.max(0, Math.min(pos.y - offsetY, displayHeight));
      this.cropSelection = { ...this.cropSelection, w: x - this.cropSelection.x, h: y - this.cropSelection.y };
    },
    endCrop() {
      if (!this.cropSelecting) return;
      this.cropSelecting = false;
      this.cropSelection = this.normalizedSelection();
    },
    clampToImage(pos) {
      const { displayWidth = 0, displayHeight = 0 } = this.cropImageDims || {};
      return {
        x: Math.max(0, Math.min(pos.x, displayWidth)),
        y: Math.max(0, Math.min(pos.y, displayHeight)),
      };
    },
    normalizedSelection() {
      if (!this.cropSelection) return null;
      let { x, y, w, h } = this.cropSelection;
      if (w < 0) { x += w; w = Math.abs(w); }
      if (h < 0) { y += h; h = Math.abs(h); }
      const maxW = this.cropImageDims.displayWidth || w;
      const maxH = this.cropImageDims.displayHeight || h;
      x = Math.max(0, Math.min(x, maxW));
      y = Math.max(0, Math.min(y, maxH));
      w = Math.min(w, maxW - x);
      h = Math.min(h, maxH - y);
      return { x, y, w, h };
    },
    async applyCrop() {
      const img = this.$refs.cropImg;
      if (!img || !this.cropSelection) return;
      const sel = this.normalizedSelection();
      if (!sel || !sel.w || !sel.h) { this.closeCropper(); return; }
      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;
      const rect = img.getBoundingClientRect();
      const scaleX = naturalW / rect.width;
      const scaleY = naturalH / rect.height;
      const sx = sel.x * scaleX;
      const sy = sel.y * scaleY;
      const sw = sel.w * scaleX;
      const sh = sel.h * scaleY;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sw));
      canvas.height = Math.max(1, Math.round(sh));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        if (!blob) { this.closeCropper(); return; }
        const file = new File([blob], this.fileName || 'ocr-crop.png', { type: blob.type });
        this.setFile(file);
        this.closeCropper();
      }, this.file?.type || 'image/png');
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
  flex-direction: row;
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
  min-height: 200px;
}

.drop-area.is-active {
  border-color: color-mix(in oklab, var(--fg) 60%, var(--bg) 30%);
  background: color-mix(in oklab, var(--bg) 80%, var(--fg) 8%);
}

.file-input {
  display: none;
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

.crop-btn {
  margin-top: 0.25rem;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 70%);
  background: color-mix(in oklab, var(--bg) 90%, var(--fg) 8%);
  cursor: pointer;
  color: var(--fg);
}

.crop-btn:hover {
  background: color-mix(in oklab, var(--bg) 85%, var(--fg) 12%);
}

.drop-actions {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: auto;
  gap: 0.5rem;
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

.run-btn {
  align-self: flex-end;
  min-width: 140px;
  min-height: 48px;
  background-size: 100% 100%;
}

.run-btn.processing {
  box-shadow: none;
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
  color: var(--fg);
  border-radius: .5rem;
}

.chip.primary {
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


.crop-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
}

.crop-dialog {
  background: var(--bg);
  color: var(--fg);
  width: min(900px, 95vw);
  max-height: 90vh;
  overflow: hidden;
  border-radius: 12px;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 70%);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-sizing: border-box;
}

.crop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.crop-title {
  font-weight: 700;
}

.crop-subtitle {
  color: color-mix(in oklab, var(--fg) 60%, var(--bg));
  font-size: 0.95rem;
}

.crop-stage {
  position: relative;
  background: color-mix(in oklab, var(--bg) 92%, var(--fg) 6%);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 70%);
  border-radius: 10px;
  overflow: hidden;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crop-stage img {
  max-width: 100%;
  max-height: 60vh;
  user-select: none;
  pointer-events: none;
}

.crop-rect {
  position: absolute;
  border: 2px solid color-mix(in oklab, var(--fg) 80%, var(--bg));
  background: rgba(0, 0, 0, 0.15);
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.25);
  pointer-events: none;
}

.crop-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 720px) {
  .input-row {
    flex-direction: column;
  }
  

  .drop-area {
    flex-direction: column;
    align-items: flex-start;
  }

  .preview {
    width: 100%;
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


  .ocr-panel {
    flex-direction: column;
  }
}
</style>
