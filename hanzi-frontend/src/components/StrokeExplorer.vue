<template>
  <div v-if="modelValue" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <h3>Stroke Viewer</h3>
      <div class="canvas-wrap">
        <canvas ref="canvas" :width="canvasSize" :height="canvasSize"></canvas>
      </div>
      <div class="input-row">
        <input
          v-model="charInput"
          maxlength="10"
          placeholder="Enter Hanzi (max 10)"
          @keyup.enter="loadStrokes"
        />
        <button @click="loadStrokes" :disabled="!charInput.trim()">Draw</button>
      </div>
      <div class="navigation-row" v-if="allCharsData && charsList.length > 1">
        <button @click="navigateChar(-1)" :disabled="currentCharIndex === 0">←</button>
        <span class="char-indicator">{{ currentCharIndex + 1 }} / {{ charsList.length }}</span>
        <button @click="navigateChar(1)" :disabled="currentCharIndex === charsList.length - 1">→</button>
      </div>
      <div class="modal-buttons">
        <button class="cancel-button" @click="close">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
import { noise } from '../lib/perlin.js';

export default {
  name: 'StrokeExplorer',
  props: {
    modelValue: { type: Boolean, default: false },
    initialChar: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      canvasSize: 500,
      charInput: '',
      strokesData: null,
      allCharsData: null,
      charsList: [],
      currentCharIndex: 0,
      gl: null,
      glProgram: null,
      quadBuffers: null,
      themeObserver: null
    };
  },
  mounted() {
    // Set up theme observer to redraw canvas when theme changes
    this.themeObserver = new MutationObserver(() => {
      if (this.strokesData) {
        this.drawStrokes();
      }
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  },
  beforeUnmount() {
    // Clean up theme observer
    if (this.themeObserver) {
      this.themeObserver.disconnect();
      this.themeObserver = null;
    }
  },
  watch: {
    initialChar(newVal) {
      if (this.modelValue) {
        this.charInput = newVal || '';
        // Auto-draw when initialChar changes while modal is open
        if (newVal) {
          this.$nextTick(() => {
            this.loadStrokes();
          });
        }
      }
    },
    modelValue(val) {
      if (!val) {
        this.strokesData = null;
        this.allCharsData = null;
        this.charsList = [];
        this.currentCharIndex = 0;
        this.charInput = '';
        this.clearCanvas();
      } else {
        // Reset WebGL context when modal opens
        this.gl = null;
        this.glProgram = null;
        this.quadBuffers = null;
        // Set charInput from initialChar prop
        this.charInput = this.initialChar || '';
        // Auto-draw if initialChar exists
        if (this.initialChar) {
          this.$nextTick(() => {
            this.loadStrokes();
          });
        }
      }
    }
  },
  methods: {
    resampleStroke(stroke, step = 25) {
      if (!Array.isArray(stroke) || stroke.length < 2) return stroke || [];
      const res = [stroke[0]];
      let carry = 0;
      for (let i = 1; i < stroke.length; i++) {
        const [x0, y0] = stroke[i - 1];
        const [x1, y1] = stroke[i];
        const dx = x1 - x0;
        const dy = y1 - y0;
        const segLen = Math.hypot(dx, dy);
        if (segLen <= 0) continue;
        let distAlong = step - carry;
        while (distAlong <= segLen) {
          const ratio = distAlong / segLen;
          res.push([x0 + dx * ratio, y0 + dy * ratio]);
          distAlong += step;
        }
        carry = segLen - (distAlong - step);
        if (carry < 0) carry = 0;
      }
      const last = stroke[stroke.length - 1];
      const tail = res[res.length - 1];
      if (tail[0] !== last[0] || tail[1] !== last[1]) res.push(last);
      return res;
    },
    smoothStroke(stroke, iterations = 2) {
      let smoothed = stroke.map(pt => [...pt]);
      const n = smoothed.length;
      const w = Math.min(1, Math.max(1, Math.floor(n / 4)));
      if (w === 0 || n < 3) return stroke;

      const count = 2 * w + 1;
      const invCount = 1 / count;

      for (let iter = 0; iter < iterations; iter++) {
        const current = smoothed.map(pt => [...pt]);

        for (let i = w; i < n - w; i++) {
          let x = 0, y = 0;
          for (let j = -w; j <= w; j++) {
            const p = current[i + j];
            x += p[0];
            y += p[1];
          }
          smoothed[i][0] = x * invCount;
          smoothed[i][1] = y * invCount;
        }

        // restore endpoints every iteration
        smoothed[0] = [...stroke[0]];
        smoothed[n - 1] = [...stroke[n - 1]];
      }

      return smoothed;
    },
    getThemeColors() {
      const cs = getComputedStyle(document.documentElement);
      const normal = (cs.getPropertyValue('--fg') || '#111').trim() || '#111';
      const radical = (cs.getPropertyValue('--danger-color') || cs.getPropertyValue('--secondary-color') || '#d43c3c').trim() || '#d43c3c';
      return { normal, radical };
    },
    close() {
      this.$emit('update:modelValue', false);
    },
    clearCanvas() {
      if (this.gl) {
        // Clear using WebGL if context exists
        this.gl.clearColor(0, 0, 0, 1.);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      } else {
        // Fallback to 2D context
        const ctx = this.$refs.canvas?.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);

        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        if (['dark', 'theme2'].includes(theme)) {
        } else {
        }
      }
    },
    async loadStrokes() {
      const input = (this.charInput || '').trim();
      if (!input) return;

      // Limit to 10 characters
      const chars = Array.from(input).slice(0, 10);

      // If the characters changed, reset to index 0, otherwise keep current index
      const charsChanged = JSON.stringify(this.charsList) !== JSON.stringify(chars);
      if (charsChanged) {
        this.currentCharIndex = 0;
      }

      this.charsList = chars;

      try {
        const charsString = chars.join('');
        const response = await fetch(`/api/getStrokes/${encodeURIComponent(charsString)}`);
        if (!response.ok) return;
        const data = await response.json();

        // Store all characters data
        if (chars.length === 1) {
          // Single character: data is the character's data directly
          this.allCharsData = { [chars[0]]: data };
        } else {
          // Multiple characters: data is a dict mapping each char to its data
          this.allCharsData = data;
        }

        // Set current character's data (preserve current index if valid)
        const currentChar = chars[this.currentCharIndex] || chars[0];
        this.strokesData = this.allCharsData[currentChar];
        this.drawStrokes();
      } catch (e) {
        console.error('Failed to fetch strokes', e);
      }
    },
    navigateChar(direction) {
      const newIndex = this.currentCharIndex + direction;
      if (newIndex < 0 || newIndex >= this.charsList.length) return;

      this.currentCharIndex = newIndex;
      const currentChar = this.charsList[newIndex];
      this.strokesData = this.allCharsData[currentChar];
      this.drawStrokes();
    },
    getFatStroke(stroke) {
      let leftpoints = [];
      let rightpoints = [];
      const len = stroke.length;
      let thickness = 28;
      if (len < 2) return;
      for (let i = 0; i < len - 1; i++) {
        const [x0, y0] = stroke[i];
        const [x1, y1] = stroke[i + 1];
        const dx = x1 - x0;
        const dy = y1 - y0;
        const dist = Math.hypot(dx, dy);
        if (dist === 0) continue;
        const ux = dx / dist;
        const uy = dy / dist;
        const px = -uy;
        const py = ux;
        let offset = thickness;
        let p = 0.6;
        if(len < 8){
          p = 0.2 + 0.4*len/8;
        }
        if(len <= 114){
          
          offset = thickness*p + (1-p)*thickness*(i/(len-2));
        }
        leftpoints.push([x0 + px * offset, y0 + py * offset]);
        rightpoints.push([x0 - px * offset, y0 - py * offset]);
        if (i === len - 2) {
          leftpoints.push([x1 + px * offset, y1 + py * offset]);
          rightpoints.push([x1 - px * offset, y1 - py * offset]);
        }
      }
      rightpoints.reverse();
      const fullPath = leftpoints.concat(rightpoints);
      return fullPath;
    },
    renderFilledStroke(ctx, stroke, isradical){
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      const isDark = ['dark', 'theme2'].includes(theme);
      // Use HSL and add slight random brightness
      const baseLight = isDark ? 85 : 15;
      const randomLight = baseLight + Math.floor(Math.random() * 10 - 5); // ±5%
      const normal = isDark
        ? `hsl(0, 0%, ${randomLight}%)`
        : `hsl(0, 0%, ${randomLight}%)`;
      // Add slight randomization to radical color brightness
      const radicalLight = isDark ? 70 : 50;
      const randomRadicalLight = radicalLight + Math.floor(Math.random() * 10 - 5); // ±5%
      const radicalColor = isDark
        ? `hsl(0, 100%, ${randomRadicalLight}%)`
        : `hsl(0, 70%, ${randomRadicalLight}%)`;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      stroke.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = isradical ? radicalColor : normal;
      ctx.lineWidth = isradical ? 2 : 2;
      ctx.fill();
    },
    renderStroke(ctx, stroke, thickness=14, color="#f00", cap='butt'){
      ctx.lineCap = cap;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      stroke.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.stroke();
    },
    async loadShaderFile(path) {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to load shader: ${path}`);
        }
        return await response.text();
      } catch (e) {
        console.error('Error loading shader file:', e);
        return null;
      }
    },
    async initWebGL() {
      if (this.gl) return; // Already initialized

      const canvas = this.$refs.canvas;
      this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!this.gl) {
        console.error('WebGL not supported');
        return;
      }

      // Load shader sources from files
      const vertexShaderSource = await this.loadShaderFile('/src/assets/shaders/stroke.vert');
      const fragmentShaderSource = await this.loadShaderFile('/src/assets/shaders/stroke.frag');

      if (!vertexShaderSource || !fragmentShaderSource) {
        console.error('Failed to load shader files');
        return;
      }

      // Compile shaders
      const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
      this.gl.shaderSource(vertexShader, vertexShaderSource);
      this.gl.compileShader(vertexShader);

      if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
        console.error('Vertex shader compile error:', this.gl.getShaderInfoLog(vertexShader));
        return;
      }

      const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
      this.gl.shaderSource(fragmentShader, fragmentShaderSource);
      this.gl.compileShader(fragmentShader);

      if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
        console.error('Fragment shader compile error:', this.gl.getShaderInfoLog(fragmentShader));
        return;
      }

      // Create program
      this.glProgram = this.gl.createProgram();
      this.gl.attachShader(this.glProgram, vertexShader);
      this.gl.attachShader(this.glProgram, fragmentShader);
      this.gl.linkProgram(this.glProgram);

      if (!this.gl.getProgramParameter(this.glProgram, this.gl.LINK_STATUS)) {
        console.error('Program link error:', this.gl.getProgramInfoLog(this.glProgram));
        return;
      }

      // Get attribute and uniform locations
      this.glProgram.locations = {
        a_offset: this.gl.getAttribLocation(this.glProgram, 'a_offset'),
        a_uv: this.gl.getAttribLocation(this.glProgram, 'a_uv'),
        u_resolution: this.gl.getUniformLocation(this.glProgram, 'u_resolution'),
        u_position: this.gl.getUniformLocation(this.glProgram, 'u_position'),
        u_angle: this.gl.getUniformLocation(this.glProgram, 'u_angle'),
        u_size: this.gl.getUniformLocation(this.glProgram, 'u_size'),
        u_vertexIndex: this.gl.getUniformLocation(this.glProgram, 'u_vertexIndex'),
        u_strokeIndex: this.gl.getUniformLocation(this.glProgram, 'u_strokeIndex'),
        u_randomSeed: this.gl.getUniformLocation(this.glProgram, 'u_randomSeed'),
        u_isRadical: this.gl.getUniformLocation(this.glProgram, 'u_isRadical'),
        u_normalColor: this.gl.getUniformLocation(this.glProgram, 'u_normalColor'),
        u_radicalColor: this.gl.getUniformLocation(this.glProgram, 'u_radicalColor')
      };

      // Create reusable quad buffers
      const quadOffsets = new Float32Array([
        -1, -1,  // bottom-left
        1, -1,   // bottom-right
        -1, 1,   // top-left
        1, 1     // top-right
      ]);

      const quadUVs = new Float32Array([
        0, 0,  // bottom-left
        1, 0,  // bottom-right
        0, 1,  // top-left
        1, 1   // top-right
      ]);

      const quadIndices = new Uint16Array([
        0, 1, 2,  // first triangle
        1, 3, 2   // second triangle
      ]);

      this.quadBuffers = {
        offset: this.gl.createBuffer(),
        uv: this.gl.createBuffer(),
        index: this.gl.createBuffer()
      };

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffers.offset);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, quadOffsets, this.gl.STATIC_DRAW);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffers.uv);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, quadUVs, this.gl.STATIC_DRAW);

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.quadBuffers.index);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, quadIndices, this.gl.STATIC_DRAW);
    },
    calculateVertexSizes(stroke) {
      const len = stroke.length;
      let thickness = 24;
      const sizes = [];
      for (let i = 0; i < len; i++) {
        let offset = thickness;
        let p = 0.6;

        if (len < 5) {
          p = 0.1+0.2 * len / 5;
        }

        if (len <= 114) {
          if (i === len - 1) {
            // For last vertex, use the same calculation as second-to-last
            offset = thickness * p + (1 - p) * thickness * ((len - 2) / (len - 2));
          } else {
            offset = thickness * p + (1 - p) * thickness * (i / (len - 2));
          }
        }

        sizes.push(offset);
      }

      return sizes;
    },
    calculateStrokeAngles(stroke) {
      const angles = [];
      const len = stroke.length;

      for (let i = 0; i < len; i++) {
        let angle;

        if (i === 0) {
          // First vertex: use angle of first segment
          const [x0, y0] = stroke[0];
          const [x1, y1] = stroke[1];
          angle = Math.atan2(y1 - y0, x1 - x0);
        } else if (i === len - 1) {
          // Last vertex: use angle of last segment
          const [x0, y0] = stroke[len - 2];
          const [x1, y1] = stroke[len - 1];
          angle = Math.atan2(y1 - y0, x1 - x0);
        } else {
          // Middle vertices: average of surrounding segments
          const [x0, y0] = stroke[i - 1];
          const [x1, y1] = stroke[i];
          const [x2, y2] = stroke[i + 1];

          const angle1 = Math.atan2(y1 - y0, x1 - x0);
          const angle2 = Math.atan2(y2 - y1, x2 - x1);

          // Average angles (handle wrapping)
          let diff = angle2 - angle1;
          if (diff > Math.PI) diff -= 2 * Math.PI;
          if (diff < -Math.PI) diff += 2 * Math.PI;
          angle = angle1 + diff / 2;
        }

        angles.push(angle);
      }

      return angles;
    },
    convertHSL2RGB(h, s, l){
      let r, g, b;

      if (s === 0) {
        r = g = b = l; // achromatic
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }

      return [r, g, b];
    },
    convertRGB2HSL(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0; // achromatic
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return [h, s, l];
    },
    async drawGLStrokes(){
      if (!this.strokesData || !this.strokesData.medians) return;

      await this.initWebGL();
      if (!this.gl || !this.glProgram) return;

      const size = this.canvasSize;
      const scale = size / 1000*0.9;
      const center = size / 2;
      const radicals = new Set(this.strokesData.radStrokes || []);

      const resampled = this.strokesData.medians.map(s => this.resampleStroke(s, 20));
      const smoothed = resampled.map(s => this.smoothStroke(s, 2));
      const smoothedr = smoothed.map(s => this.resampleStroke(s, 6));

      const transformedStrokes = smoothedr.map(stroke => stroke.map(([x, y]) => {
        const sx = (x - 500) * scale + center;
        const sy = (500 - (y + 100)) * scale + center;
        return [sx, sy];
      }));

      const processed = transformedStrokes;

      // Clear canvas
      this.gl.clearColor(0, 0, 0, 1.);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.enable(this.gl.BLEND);
      // Use premultiplied alpha blending to avoid additive appearance
      this.gl.blendFuncSeparate(
        this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA,
        this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA
      );

      // Use program
      this.gl.useProgram(this.glProgram);

      // Set resolution uniform
      this.gl.uniform2f(this.glProgram.locations.u_resolution, size, size);

      // Get theme colors
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      const isDark = ['dark', 'theme2'].includes(theme);
      let nh = Math.random(); // normal hue
      let rh = Math.random(); // radical hue
      let normalColor = isDark ? this.convertHSL2RGB(nh, 0.6, 0.79) : this.convertHSL2RGB(nh, 0.6, 0.79);
      let radicalColor = isDark ? this.convertHSL2RGB(rh, 0.6, 0.79) : this.convertHSL2RGB(rh, 0.6, 0.79);
      normalColor = isDark ? this.convertHSL2RGB(nh, 0.6, 0.79) : this.convertHSL2RGB(nh, 0.6, 0.79);
      radicalColor = isDark ? this.convertHSL2RGB(rh, 0.6, 0.79) : this.convertHSL2RGB(rh, 0.6, 0.79);

      this.gl.uniform3fv(this.glProgram.locations.u_normalColor, normalColor);
      this.gl.uniform3fv(this.glProgram.locations.u_radicalColor, radicalColor);

      // Bind quad buffers once
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffers.offset);
      this.gl.enableVertexAttribArray(this.glProgram.locations.a_offset);
      this.gl.vertexAttribPointer(this.glProgram.locations.a_offset, 2, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffers.uv);
      this.gl.enableVertexAttribArray(this.glProgram.locations.a_uv);
      this.gl.vertexAttribPointer(this.glProgram.locations.a_uv, 2, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.quadBuffers.index);

      // Draw each quad individually
      processed.forEach((stroke, strokeIdx) => {
        if (!Array.isArray(stroke) || stroke.length < 2) return;

        const angles = this.calculateStrokeAngles(stroke);
        const sizes = this.calculateVertexSizes(stroke);
        const isRadical = radicals.has(strokeIdx);
        const randomSeed = Math.random();

        // Set per-stroke uniforms
        this.gl.uniform1f(this.glProgram.locations.u_strokeIndex, strokeIdx);
        this.gl.uniform1f(this.glProgram.locations.u_randomSeed, randomSeed);
        this.gl.uniform1i(this.glProgram.locations.u_isRadical, isRadical ? 1 : 0);

        // Draw each vertex as a quad
        stroke.forEach((point, vertexIdx) => {
          const [x, y] = point;
          const angle = angles[vertexIdx];
          const size = sizes[vertexIdx];

          // Set per-vertex uniforms
          this.gl.uniform2f(this.glProgram.locations.u_position, x, y);
          this.gl.uniform1f(this.glProgram.locations.u_angle, angle);
          this.gl.uniform1f(this.glProgram.locations.u_size, size);
          this.gl.uniform1f(this.glProgram.locations.u_vertexIndex, vertexIdx);

          // Draw the quad
          this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
        });
      });
    },
    getColor(isradical, light=null){
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      const isDark = ['dark', 'theme2'].includes(theme);
      const normal = isDark ? '#f83' : '#0fa';
      let randomLight = 70 + Math.floor(Math.random() * 10 - 5); // ±5%
      if(light !== null){
        randomLight += light*100;
      }
      let normalHue = Math.random();
      let radicalHue = Math.random();
      normalHue = Math.random() < -.5 ? 0.63 : normalHue;
      radicalHue = Math.random() < -.5 ? 0.63 : radicalHue*0.1;
      let radicalLight = randomLight + Math.floor(Math.random() * 10 - 5); // ±5%
      let normalLight = randomLight + Math.floor(Math.random() * 10 - 5); // ±5%
      if(isDark){
        radicalLight /= 2;
        normalLight /= 2;
      }
      const radicalColor = `hsl(${radicalHue * 360}, 95%, ${radicalLight}%)`;
      const normalColor = `hsl(${normalHue * 360}, 70%, ${normalLight}%)`;
      const color = isradical ? radicalColor : normalColor;
      return color;
    },
    drawStrokes(){
      this.clearCanvas();
      this.clearCanvas();
      if (!this.strokesData || !this.strokesData.medians) return;
      const ctx = this.$refs.canvas.getContext('2d');
      const size = this.canvasSize;
      const scale = size / 1000*0.99;
      const center = size / 2;
      const radicals = new Set(this.strokesData.radStrokes || []);

      const resampled = this.strokesData.medians.map(s => this.resampleStroke(s, 20));
      const smoothed = resampled.map(s => this.smoothStroke(s, 2));

      const transformedStrokes = smoothed.map(stroke => stroke.map(([x, y]) => {
        const sx = (x - 500) * scale + center;
        const sy = (500 - (y + 100)) * scale + center;
        return [sx, sy];
      }));

      const processed = transformedStrokes;

      ctx.globalCompositeOperation = 'multiply';

      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      const isDark = ['dark', 'theme2'].includes(theme);
      const overallthickness = Math.random() * 67 + 8;
      let lightness = 0.05;
      if(isDark){
        ctx.globalCompositeOperation = 'screen';
        lightness = -0.3;
      }
      const globalSeed = Math.random() * 100000;

      let noised = processed.map((stroke, idx) =>
        stroke.map(([x, y], i) => {
          // Use Perlin noise for smooth variation
          // Scale coordinates and use different offsets for x and y
          let seed = globalSeed + idx * 13.37;
          const noiseScale = 0.0014;
          const noiseScale2 = 0.007;
          const noiseAmp = 10+80*noise(x*0.000, y*0.000, globalSeed+155.1);
          const noiseAmp2 = 50;
          const noiseX = (noise(x * noiseScale, y * noiseScale, globalSeed+13.41) * 2 - 1) * noiseAmp;
          const noiseY = (noise(x * noiseScale + 100, y * noiseScale + 100, globalSeed+183.3) * 2 - 1) * noiseAmp;
          const noiseX2 = (noise(x * noiseScale2, y * noiseScale2, globalSeed+33.41) * 2 - 1) * noiseAmp2;
          const noiseY2 = (noise(x * noiseScale2 + 100, y * noiseScale2 + 100, globalSeed+22.3) * 2 - 1) * noiseAmp2;
          const randX = x + noiseX;
          const randY = y + noiseY;
          return [randX, randY];
        })
      );

      noised.forEach((stroke, idx) => {
        if (!Array.isArray(stroke) || stroke.length < 2) return;

        let fatStroke = this.getFatStroke(stroke);
        const fatStrokeS = this.smoothStroke(fatStroke, 2);
        // shift points in array by half leenght of array
        const shifted = [];
        //shifted
        const halfLen = Math.floor(fatStrokeS.length / 4);
        for (let i = 0; i < fatStrokeS.length; i++) {
          shifted.push(fatStrokeS[(i + halfLen) % fatStrokeS.length]);
        }
        const fatStrokeShiftedS = this.smoothStroke(shifted, 2);
        const unshifted = [];
        for (let i = 0; i < fatStrokeShiftedS.length; i++) {
          unshifted.push(fatStrokeShiftedS[(i - halfLen + fatStrokeShiftedS.length) % fatStrokeShiftedS.length]);
        }
        //this.renderFilledStroke(ctx, unshifted, radicals.has(idx));

        this.renderStroke(ctx, stroke, Math.random() * 8 + 10, this.getColor(radicals.has(idx), lightness, Math.random()<.5 ? 'round' : 'butt'));

        ctx.save();
        ctx.filter = 'blur(3px)';
        let seed = Math.random() * 10000;
        for(let k= 0; k < 3; k++){
          seed = Math.random() * 10000;
          let randomizedStroke = stroke.map(([x, y], i) => {
            // Use Perlin noise for smooth variation
            // Scale coordinates and use different offsets for x and y
            const noiseScale = 0.01;
            const noiseAmp = 10;
            const noiseX = (noise(x * noiseScale, y * noiseScale, idx + seed) * 2 - 1) * noiseAmp;
            const noiseY = (noise(x * noiseScale + 100, y * noiseScale + 100, idx + seed) * 2 - 1) * noiseAmp;
            const randX = x + noiseX;
            const randY = y + noiseY;
            return [randX, randY];
          });
          this.renderStroke(ctx, randomizedStroke, Math.random() * 20 + 10, this.getColor(radicals.has(idx), lightness), Math.random()<.5? 'round' : 'butt');
        }

        ctx.restore();

        for(let k= 0; k < 2; k++){
          seed = Math.random() * 33.81;
          let randomizedStroke = stroke.map(([x, y], i) => {
            // Use Perlin noise for smooth variation
            // Scale coordinates and use different offsets for x and y
            const noiseScale = 0.003;
            const noiseAmp = 30;
            const noiseX = (noise(x * noiseScale, y * noiseScale, idx + seed) * 2 - 1) * noiseAmp;
            const noiseY = (noise(x * noiseScale + 100, y * noiseScale + 100, idx + seed) * 2 - 1) * noiseAmp;
            const randX = x + noiseX;
            const randY = y + noiseY;
            return [randX, randY];
          });

          this.renderStroke(ctx, randomizedStroke, Math.random() * overallthickness + 1, this.getColor(radicals.has(idx), lightness+0.12), Math.random()<.5? 'round' : 'butt');

        }

        let NN = Math.floor(Math.random()*10)+2;
        if(Math.random() < 1.3){
          //NN *= 40;
        }
          //NN = 340;

        for(let k= 0; k < NN; k++){
          seed = Math.random() * 10000 + globalSeed;
          let randomizedStroke = stroke.map(([x, y], i) => {
            // Use Perlin noise for smooth variation
            // Scale coordinates and use different offsets for x and y
            const noiseScale = 0.0007;
            const noiseScale2 = 0.007;
            const noiseAmp = 10+80*noise(x*0.000, y*0.000, idx+seed+155.1);
            const noiseAmp2 = 50;
            const noiseX = (noise(x * noiseScale, y * noiseScale, idx + seed+13.41) * 2 - 1) * noiseAmp;
            const noiseY = (noise(x * noiseScale + 100, y * noiseScale + 100, idx + seed+183.3) * 2 - 1) * noiseAmp;
            const noiseX2 = (noise(x * noiseScale2, y * noiseScale2, idx + seed+33.41) * 2 - 1) * noiseAmp2;
            const noiseY2 = (noise(x * noiseScale2 + 100, y * noiseScale2 + 100, idx + seed+22.3) * 2 - 1) * noiseAmp2;
            const randX = x + noiseX + noiseX2;
            const randY = y + noiseY + noiseY2;
            return [randX, randY];
          });

          this.renderStroke(ctx, randomizedStroke, Math.random() * 1 + 0.2, this.getColor(radicals.has(idx), 0.25));

        }
        stroke.forEach(([x, y]) => {
          ctx.beginPath();
          //ctx.arc(x, y, 4, 0, 2 * Math.PI);radi
          ctx.fillStyle = '#d43c3c';
          ctx.fill();
        });
      });
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--bg) 50%, rgba(0, 0, 0, 0.6) 40%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.modal-content {
  background: var(--bg);
  color: var(--fg);
  padding: 1.25rem;
  border-radius: var(--modal-border-radius, 8px);
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 15%, var(--bg) 100%);
  height: 90vh;
  aspect-ratio: 0.75;
  box-sizing: border-box;
}
.canvas-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 1px solid color-mix(in oklab, var(--fg) 20%, var(--bg) 100%);
  background: color-mix(in oklab, var(--bg) 90%, var(--fg) 4%);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
}
canvas {
  width: 100%;
  height: 100%;
}
.input-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.input-row input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid color-mix(in oklab, var(--fg) 20%, var(--bg) 100%);
  border-radius: var(--border-radius, 4px);
  background: var(--bg);
  color: var(--fg);
}
.input-row button {
  padding: 0.5rem 0.75rem;
  border: 1px solid color-mix(in oklab, var(--fg) 20%, var(--bg) 100%);
  background: color-mix(in oklab, var(--fg) 8%, var(--bg) 100%);
  color: var(--fg);
  border-radius: var(--border-radius, 4px);
  cursor: pointer;
}
.hint {
  opacity: 0.75;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}
.navigation-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}
.navigation-row button {
  padding: 0.5rem 0.75rem;
  border: 1px solid color-mix(in oklab, var(--fg) 20%, var(--bg) 100%);
  background: color-mix(in oklab, var(--fg) 8%, var(--bg) 100%);
  color: var(--fg);
  border-radius: var(--border-radius, 4px);
  cursor: pointer;
}
.navigation-row button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.char-indicator {
  font-weight: 600;
  min-width: 4rem;
  text-align: center;
}
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 600px) {
  .modal-content {
    width: 95vw;
    height: auto;
    max-height: 90vh;
  }
}
</style>
