<template>
  <div class="animated-hanzi">
    <div class="redraw-button" @click="animateCharacter"><font-awesome-icon :icon="['fas', 'arrow-rotate-right']" class="redraw-icon" /></div>
    <div class="clear-button" @click="beginQuizMode"><font-awesome-icon :icon="['fas', 'pen-fancy']"   class="clear-icon" /></div>
    <canvas ref="hanziCanvas" class="anim-character"></canvas>
  </div>
</template>

<script>
import HanziPlotter from '../lib/plotter';
import { defineComponent, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';

export default defineComponent({
  name: 'AnimatedHanzi',
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
  setup(props, { expose }) {
    const hanziCanvas = ref(null);
    const plotter = ref(null);
    const observer = ref(null);
    const currentTheme = ref(document.documentElement.getAttribute('data-theme') || 'light');
    const isQuizMode = ref(false);

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
        themeColors = ['#000000ee', '#00000077', '#cdb3dfdd', '#f3f3f3'];
      }
      return themeColors;
    };

    const updateTheme = () => {
      if (!plotter.value) return;

      const isDarkMode = currentTheme.value === 'dark';
      const colors = getThemeColors();
      
      plotter.value.isDarkMode = isDarkMode;
      plotter.value.setColors(colors);
      plotter.value.setGridThickness(currentTheme.value === 'theme1' || currentTheme.value === 'theme2' ? 3 : 1);
      
      plotter.value.clearBg();
      plotter.value.draw({ progress: 1, clearbg: false });
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

      const isDarkMode = currentTheme.value === 'dark';
      
      if (!props.strokes || !props.strokes.medians || !props.strokes.strokes) {
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
      
      plotter.value.isDarkMode = isDarkMode;

      await plotter.value.loadPromise;
      
      plotter.value.draw({ progress: 1, clearbg: true });
    };

    // Handle click animation
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
      
      initPlotter();
    });
    
    watch(() => props.strokes, () => {
      if (plotter.value && props.strokes && props.strokes.medians) {
        isQuizMode.value = false;
        
        initPlotter();
      }
    }, { deep: true });

    expose({ plotter: () => plotter.value });

    return {
      hanziCanvas,
      animateCharacter,
      beginQuizMode,
      plotter
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

.redraw-button {
  position: absolute;
  top: .5em;
  right: .5em;
  background: var(--bg);
  border-radius: 50%;
  padding: .5rem;
  cursor: pointer;
  z-index: 10;
  border: 2px solid var(--fg);
}

.redraw-icon {
}

.clear-button {
  position: absolute;
  top: .5em;
  left: .5em;
  background: var(--bg);
  border-radius: 50%;
  padding: .5rem;
  cursor: pointer;
  z-index: 10;
  border: 2px solid var(--fg);
}

.clear-icon {
}
</style>