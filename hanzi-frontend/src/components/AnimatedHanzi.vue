<template>
  <div class="animated-hanzi" v-if="hasStrokeData">
    <canvas ref="hanziCanvas" class="anim-character"></canvas>
  </div>
</template>

<script>
import HanziPlotter from '../lib/plotter';
import { defineComponent, ref, onMounted, onBeforeUnmount, nextTick, watch, computed } from 'vue';

export default defineComponent({
  name: 'AnimatedHanzi',
  emits: ['step-change'],
  props: {
    character: {
      type: String,
      required: true
    },
    strokes: {
      type: Object,
      default: () => ({})
    },
    animatable: {
      type: Boolean,
      default: true
    },
    drawThin: {
      type: Boolean,
      default: false
    },
    animSpeed: {
      type: Number,
      default: 0.07
    },
  },
  setup(props, { expose, emit }) {
    const hanziCanvas = ref(null);
    const plotter = ref(null);
    const observer = ref(null);
    const currentTheme = ref(document.documentElement.getAttribute('data-theme') || 'light');
    const isQuizMode = ref(false);
    const stepIndex = ref(0);

    // Computed property to check if stroke data is available
    const hasStrokeData = computed(() => {
      return props.strokes && 
             props.strokes.medians && 
             props.strokes.strokes && 
             Array.isArray(props.strokes.medians) && 
             props.strokes.medians.length > 0 &&
             Array.isArray(props.strokes.strokes) && 
             props.strokes.strokes.length > 0;
    });

    const emitStep = (override = null) => {
      const total = (plotter.value && plotter.value.strokes && plotter.value.strokes.length) || 0;
      const currentRaw = override && override.current !== undefined ? override.current : stepIndex.value;
      const current = (!total || currentRaw <= 0) ? 0 : Math.min(currentRaw, total);
      emit('step-change', { current, total });
    };


    const renderStep = () => {
      if (!plotter.value) return;
      plotter.value.clearBg();
      const total = (plotter.value.strokes && plotter.value.strokes.length) || 0;
      const current = (!total || stepIndex.value <= 0) ? 0 : Math.min(stepIndex.value, total);
      emitStep();
      if (!total || stepIndex.value <= 0) {
        return;
      }
      const idx = Math.min(stepIndex.value - 1, total - 1);
      const ctx = plotter.value.ctx;
      ctx.save();
      ctx.lineCap = plotter.value.lineType;
      ctx.lineJoin = plotter.value.lineType;
      ctx.globalCompositeOperation = plotter.value.blendMode;
      ctx.strokeStyle = plotter.value.colors[0];
      ctx.lineWidth = plotter.value.useMask
        ? plotter.value.lineThickness * 6
        : plotter.value.lineThickness * 1.24;
      // Draw faint full character as guidance, then the active stroke
      plotter.value.draw({ progress: 1, clearbg: false, alpha: 0.35 });
      plotter.value.drawPartial(plotter.value.strokes, idx, 1);
      ctx.restore();
    };

    const getThemeColors = () => {
      let theme = localStorage.getItem('theme') || 'light';
      let themeColors;
      if(theme === 'dark') {
        themeColors = ['#e5ddeddd', '#e2cdec88', '#e5dded', '#151515'];
      }
      if(theme === 'light') {
        themeColors = ['#151511dd', '#eaa', '#151511', '#f3f3f3'];
      }
      if(theme === 'theme1') {
        themeColors = ['#151511dd', '#eaa', '#151511', '#f3f3f3'];
      }
      if(theme === 'theme2') {
        themeColors = ['#e5ddeddd', '#e2cdec88', '#e5dded', '#151515'];
      }
      return themeColors;
    };

    const updateTheme = () => {
      if (!plotter.value) return;

      const isDarkMode = ['dark', 'theme2'].includes(currentTheme.value);
      const colors = getThemeColors();
      
      plotter.value.isDarkMode = isDarkMode;
      plotter.value.setColors(colors);
      plotter.value.setGridThickness(currentTheme.value === 'theme1' || currentTheme.value === 'theme2' ? 3 : 1);

      // Preserve current step view when theme changes
      if ((plotter.value.strokes && plotter.value.strokes.length) && stepIndex.value > 0) {
        renderStep();
      } else {
        plotter.value.clearBg();
        plotter.value.draw({ progress: 1, clearbg: false });
        emitStep({ current: 0, total: (plotter.value.strokes && plotter.value.strokes.length) || 0 });
      }
    };

    const initPlotter = async () => {
      await nextTick();

      const canvas = hanziCanvas.value;
      if (!canvas) {
        console.error("Canvas element not found.");
        return;
      }

      canvas.width = 800;
      canvas.height = 800;

      if (plotter.value) {
        plotter.value.destroyy();
        plotter.value = null;
      } 

      const isDarkMode = ['dark', 'theme2'].includes(currentTheme.value);
      
      if (!hasStrokeData.value) {
        console.error("No stroke data provided for character:", props.character);
        return;
      }
      
      let gridThickness = currentTheme.value === 'theme1' || currentTheme.value === 'theme2' ? 3 : 1;
      let medians = props.strokes.medians || [];
      let masks = props.strokes.strokes || [];
      plotter.value = new HanziPlotter({
        strokes: medians,
        masks: masks,
        character: props.character,
        canvas: canvas,
        dimension: canvas.width,
        speed: props.animSpeed,
        lineThickness: props.drawThin ? 1 : 8 * canvas.width / 200,
        gridThickness: gridThickness,
        colors: getThemeColors(),
        showDiagonals: true,
        showGrid: false,
        useMask: true,
        blendMode: 'normal',
      });
      plotter.value.onStrokeProgress = (cur, total) => emitStep({ current: cur, total });
      
      plotter.value.isDarkMode = isDarkMode;

      await plotter.value.loadPromise;
      
      plotter.value.draw({ progress: 1, clearbg: true });
      stepIndex.value = 0;
      emitStep({ current: 0, total: (plotter.value.strokes && plotter.value.strokes.length) || 0 });
    };

    // Handle click animation
    const stepStroke = () => {
      if (!plotter.value) return;
      const total = (plotter.value.strokes && plotter.value.strokes.length) || 0;
      if (!total) return;
      // Stop any ongoing animation and reset flags
      plotter.value.stopAnimation();
      // Advance with wraparound
      stepIndex.value = (stepIndex.value % total) + 1;
      renderStep();
    };

    const resetStep = () => {
      stepIndex.value = 0;
      emitStep({ current: 0 });
    };

    const animateCharacter = () => {
      if (plotter.value) {
        // If in quiz mode, cancel the quiz and restart animation
        if (isQuizMode.value) {
          // Reset quiz mode
          isQuizMode.value = false;
          plotter.value.isQuizing = false;
          plotter.value.quizComplete = false;
          
        }
        
        // Always stop animation first to ensure clean state
        plotter.value.stopAnimation();

        // Cancel any existing animations explicitly
        if (plotter.value.animationFrame) {
          cancelAnimationFrame(plotter.value.animationFrame);
          plotter.value.animationFrame = null;
        }
        if (plotter.value.strokeAnimationFrame) {
          cancelAnimationFrame(plotter.value.strokeAnimationFrame);
          plotter.value.strokeAnimationFrame = null;
        }
        if (plotter.value.interpAnimFrame) {
          cancelAnimationFrame(plotter.value.interpAnimFrame);
          plotter.value.interpAnimFrame = null;
        }
        if (plotter.value.demoAnimationFrame) {
          cancelAnimationFrame(plotter.value.demoAnimationFrame);
          plotter.value.demoAnimationFrame = null;
        }
        
        // Reset animation state
        plotter.value.isAnimating = false;
        plotter.value.isAnimatingStroke = false;
        plotter.value.isAnimatingInterp = false;

        // Clear the canvas before starting new animation to prevent any visual artifacts
        plotter.value.clearBg();

        // Start new animation after ensuring everything is reset
        setTimeout(() => {
          stepIndex.value = 0;
          emitStep({ current: 0 });
          if (typeof plotter.value?.onStrokeProgress === 'function') {
            try { plotter.value.onStrokeProgress(0, (plotter.value.strokes && plotter.value.strokes.length) || 0); } catch (e) {}
          }
          plotter.value.startAnimation();
        }, 10);
      }
    };
    
    // Begin quiz mode (called when clear button is clicked)
    const beginQuizMode = () => {
      if (!plotter.value) return;
      
      // If quiz is already complete, restart the quiz
      if (isQuizMode.value && plotter.value.quizComplete) {
        // Reset the quiz but keep the drawn strokes visible
        plotter.value.userStrokes = [];
        plotter.value.currentStroke = null;
        plotter.value.isQuizing = true;
        plotter.value.quizComplete = false;
        plotter.value.clearBg();
        plotter.value.drawUserStrokes(true);
        return;
      }
      
      // Set quiz mode flag
      isQuizMode.value = true;
      
      // Stop any ongoing animation
      plotter.value.stopAnimation();
      
      // Cancel any existing animations explicitly
      if (plotter.value.animationFrame) {
        cancelAnimationFrame(plotter.value.animationFrame);
        plotter.value.animationFrame = null;
      }
      if (plotter.value.strokeAnimationFrame) {
        cancelAnimationFrame(plotter.value.strokeAnimationFrame);
        plotter.value.strokeAnimationFrame = null;
      }
      if (plotter.value.interpAnimFrame) {
        cancelAnimationFrame(plotter.value.interpAnimFrame);
        plotter.value.interpAnimFrame = null;
      }
      
      // Reset animation state
      plotter.value.isAnimating = false;
      plotter.value.isAnimatingStroke = false;
      plotter.value.isAnimatingInterp = false;
      
      // Start quiz mode
      plotter.value.quiz({
        onComplete: (data) => {
          // Handle quiz completion
          plotter.value.quizComplete = true;
          isQuizMode.value = true;
        }
      });
    };

    const setupThemeObserver = () => {
      observer.value = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-theme') {
            const newTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme.value !== newTheme) {
              currentTheme.value = newTheme;
              updateTheme();
            }
          }
        });
      });
      
      observer.value.observe(document.documentElement, { 
        attributes: true, 
        attributeFilter: ['data-theme'] 
      });
    };

    const isMobileDevice = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };

    onMounted(() => {
      initPlotter();
      setupThemeObserver();
    });

    onBeforeUnmount(() => {
      observer.value?.disconnect();
      
      if (plotter.value) {
        if (props.animatable && hanziCanvas.value) {
          hanziCanvas.value.removeEventListener('click', animateCharacter);
          hanziCanvas.value.removeEventListener('touchstart', animateCharacter);
        }
        plotter.value.destroyy();
      }
    });

    watch(() => props.character, async () => {
      if (plotter.value) {
        if (props.animatable && hanziCanvas.value) {
          hanziCanvas.value.removeEventListener('click', animateCharacter);
          hanziCanvas.value.removeEventListener('touchstart', animateCharacter);
        }
        plotter.value.destroyy();
      }
      
      isQuizMode.value = false;
      stepIndex.value = 0;
      emitStep();
      
      initPlotter();
    });
    
    watch(() => props.strokes, () => {
      if (plotter.value && props.strokes && props.strokes.medians) {
        isQuizMode.value = false;
        stepIndex.value = 0;
        emitStep();
        
        initPlotter();
      }
    }, { deep: true });

    expose({ 
      plotter: () => plotter.value,
      hasStrokeData,
      playAnimation: animateCharacter,
      stepStroke,
      resetStep
    });

    return {
      hanziCanvas,
      animateCharacter,
      beginQuizMode,
      stepStroke,
      resetStep,
      plotter,
      hasStrokeData
    };
  }
});
</script>

<style scoped>
.animated-hanzi {
  display: flex;
  justify-content: center;
  align-items: center;
  align-self: flex-start;
  line-height: 1;
  width: 100%;
  aspect-ratio: 1;
  border: var(--thin-border-width) solid var(--animated-hanzi-border-color);
  border-radius: var(--pinyin-meaning-group-border-radius, 0);
  position: relative;
}

.anim-character {
  width: 100%;
  aspect-ratio: 1;
  align-self: flex-start;
  
  border-radius: var(--pinyin-meaning-group-border-radius, 0);
}

</style>