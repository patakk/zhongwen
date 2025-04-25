<template>
  <div class="animated-hanzi">
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
    }
  },
  setup(props, { expose }) {
    const hanziCanvas = ref(null);
    const plotter = ref(null);
    const observer = ref(null);
    const currentTheme = ref(document.documentElement.getAttribute('data-theme') || 'light');

    // Get colors based on theme
    const getThemeColors = (isDark) => isDark ? ["#e5ddeddd", "#e2cdec88", "#e5dded"] : ["#151511dd", "#eaa", "#151511"];
    //const getThemeColors = (isDark) => isDark ? ["#eee", "#eee", "#eee"] : ["#333", "#333", "#333"];

    // Update plotter with new theme
    const updateTheme = () => {
      if (!plotter.value) return;
      
      const isDarkMode = currentTheme.value === 'dark';
      const colors = getThemeColors(isDarkMode);
      
      // Update plotter properties
      plotter.value.isDarkMode = isDarkMode;
      plotter.value.setColors(colors);
      
      // Redraw
      plotter.value.clearBg();
      plotter.value.draw({ progress: 1, clearbg: false });
    };

    // Initialize plotter
    const initPlotter = async () => {
      await nextTick();

      const canvas = hanziCanvas.value;
      if (!canvas) {
        console.error("Canvas element not found.");
        return;
      }

      // Set canvas dimensions
      canvas.width = 800;
      canvas.height = 800;

      // Clean up previous plotter
      if (plotter.value) {
        plotter.value.destroyy();
        plotter.value = null;
      } 

      const isDarkMode = currentTheme.value === 'dark';
      
      if (!props.strokes || !props.strokes.medians || !props.strokes.strokes) {
        console.error("No stroke data provided for character:", props.character);
        return;
      }
      
      console.log("Creating plotter for:", props.character, "with strokes:", props.strokes.medians?.length);
      
      // Create new plotter
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
        colors: getThemeColors(isDarkMode),
        showDiagonals: true,
        showGrid: true,
        useMask: true,
        blendMode: 'normal',
      });
      
      // Set dark mode
      plotter.value.isDarkMode = isDarkMode;

      // Wait for data to load
      await plotter.value.loadPromise;
      
      // Draw character
      plotter.value.draw({ progress: 1, clearbg: true });

      // Add animation click handler if needed
      if (props.animatable) {
        canvas.addEventListener('click', animateCharacter);
      }
    };

    // Handle click animation
    const animateCharacter = () => {
      if (plotter.value?.isAnimating) {
        // Stop the current animation before starting a new one
        plotter.value.stopAnimation();
        // Small delay to ensure cleanup is complete
        setTimeout(() => {
          plotter.value.startAnimation();
        }, 50);
      } else {
        plotter.value?.startAnimation();
      }
    };

    // Setup theme observer
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

    // Lifecycle hooks
    onMounted(() => {
      initPlotter();
      setupThemeObserver();
    });

    onBeforeUnmount(() => {
      observer.value?.disconnect();
      
      if (plotter.value) {
        if (props.animatable && hanziCanvas.value) {
          hanziCanvas.value.removeEventListener('click', animateCharacter);
        }
        plotter.value.destroyy();
      }
    });

    // Watch for character changes
    watch(() => props.character, async () => {
      console.log("Character changed to:", props.character);
      if (plotter.value) {
        if (props.animatable && hanziCanvas.value) {
          hanziCanvas.value.removeEventListener('click', animateCharacter);
        }
        plotter.value.destroyy();
      }
      
      initPlotter();
    });
    
    // Watch for stroke data changes
    watch(() => props.strokes, () => {
      console.log("Stroke data updated for", props.character);
      if (plotter.value && props.strokes && props.strokes.medians) {
        initPlotter();
      }
    }, { deep: true });

    // Expose the plotter to the parent component
    expose({ plotter: () => plotter.value });

    return {
      hanziCanvas,
      animateCharacter,
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
  line-height: 1;
  width: 100%;
  height: 100%;
}

.anim-character {
  width: 100%;
  aspect-ratio: 1;
  cursor: pointer;
  align-self: flex-start;
}
</style>