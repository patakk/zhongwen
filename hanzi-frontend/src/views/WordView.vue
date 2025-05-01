<template>
  <BasePage page_title="Word" />
  <div class="word-page">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <div class="loading-text">Loading character data...</div>
    </div>
    <GlobalCardModal 
      v-else
      :page-mode="true" 
      :forced-character="$route.params.word"
    />
  </div>
</template>

<script>
import GlobalCardModal from '../components/GlobalCardModal.vue';
import BasePage from '../components/BasePage.vue';

export default {
  name: 'WordView',
  components: {
    GlobalCardModal,
    BasePage,
  },
  data() {
    return {
      loading: true
    };
  },
  computed: {
    isDictionaryLoading() {
      return this.$store.getters.isDictionaryLoading;
    },
    dictionaryPromises() {
      return this.$store.getters.getDictionaryPromises;
    }
  },
  async created() {
    // Make sure dictionary data is loaded before showing the card modal
    try {
      // Check if dictionary data is currently loading or not loaded yet
      if (this.isDictionaryLoading || !this.$store.getters.getDictionaryData) {
        
        // Collect all pending dictionary promises
        const promises = [];
        if (this.dictionaryPromises.static) {
          promises.push(this.dictionaryPromises.static);
        } else {
          // If no static dictionary promise exists, create one
          promises.push(this.$store.dispatch('fetchDictionaryData'));
        }
        
        if (this.dictionaryPromises.custom) {
          promises.push(this.dictionaryPromises.custom);
        } else {
          // If no custom dictionary promise exists, create one
          promises.push(this.$store.dispatch('fetchCustomDictionaryData'));
        }
        
        // Wait for all promises to resolve
        await Promise.all(promises);
      }
      
      // Now show the card modal with the character from the URL
      // We use the 'word' parameter from the router, as defined in the route pattern '/word/:word'
      await this.$store.dispatch('cardModal/showCardModal', this.$route.params.word);

      // scroll to the top of the page
      
      // Once data is loaded, hide the loading state
      this.loading = false;
    } catch (error) {
      console.error("Error loading data for WordView:", error);
      this.loading = false;
    }
  },
  beforeUnmount() {
    // Hide the modal when leaving this route
    this.$store.dispatch('cardModal/hideCardModal');
  }
}
</script>

<style scoped>
.word-page {
  width: 100%;
  min-height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid var(--bg-secondary);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-text {
  font-size: 1.2rem;
  color: var(--fg);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Override global styles for page mode */
:deep(.card-modal-overlay) {
  position: relative;
  background: transparent; 
  align-self: flex-start;
}

:deep(.modal) {
    position: relative;
    transform: none;
    left: 0;
    top: 0;
    
    width: 70%;
    width: 100%;
    height: 100%;
    max-height: 100%;
    box-sizing: border-box;

    border: none;
    box-shadow: none;
    background: none;
    /* position: relative;
    transform: none;
    left: auto;
    top: auto;
    width: 95%;
    max-width: 800px;
    height: auto;
    min-height: 600px;
    border: 1px solid var(--fg-dim);
    box-shadow: var(--card-shadow); */
}

:deep(.fixed-close) {
  display: none;
}

:deep(.global-modal-container) {
  position: relative;
  z-index: 20;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

:deep(canvas.anim-character) {
  max-height: 20vh;
}

:deep(.animated-hanzi) {
  max-height: 20vh;
  max-width: 20vh;
}

:deep(.freq-trad-anim) {
  flex-direction: column;
}

:deep(.radicals-group) {
  flex-direction: column;
    align-items: flex-start;
}


:deep(.detail-group) {
  flex-direction: column;
  align-items: flex-start;
  
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: auto;
  min-height: 6rem;
  box-sizing: border-box;
  font-size: 1rem;
  min-width: 0;
  border-bottom: 1px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 15%);
}

:deep(.main-word-section) {
  align-items: flex-start;
  text-align: left;
}

:deep(.main-word) {
  text-align: left;
}

</style>