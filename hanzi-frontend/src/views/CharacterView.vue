<template>
  <div class="character-page">
    <GlobalCardModal 
      :page-mode="true" 
      :forced-character="$route.params.character"
    />
  </div>
</template>

<script>
import GlobalCardModal from '../components/GlobalCardModal.vue';

export default {
  name: 'CharacterView',
  components: {
    GlobalCardModal
  },
  mounted() {
    // Force the card modal to be visible and load the character from the URL
    this.$store.dispatch('cardModal/showCardModal', this.$route.params.character);
  },
  beforeUnmount() {
    // Hide the modal when leaving this route
    this.$store.dispatch('cardModal/hideCardModal');
  }
}
</script>

<style scoped>
.character-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

/* Override global styles for page mode */
:deep(.card-modal-overlay) {
  position: relative;
  background: transparent; 
}

:deep(.modal) {
  position: relative;
  transform: none;
  left: auto;
  top: auto;
  width: 95%;
  max-width: 800px;
  height: auto;
  min-height: 600px;
  border: 1px solid var(--fg-dim);
}

:deep(.fixed-close) {
  display: none; /* Hide the fixed close button */
}
</style>