<template>
  <BasePage page_title="Tools" />
  <div class="container">
    <div class="tool-card">
      <div class="tool-header">
        <h3>Practice Sheet Generator</h3>
        <p>Create a practice sheet from given characters.</p>
      </div>
      <button class="tool-button" @click="showModal = true">Open</button>
    </div>
    <!--<div class="tool-card">
      <div class="tool-header">
        <h3>Stroke Viewer</h3>
        <p>Color strokes.</p>
      </div>
      <button class="tool-button" @click="showStrokeModal = true">Open</button>
    </div>-->
    <PracticeSheetModal
      v-model="showModal"
      :initial-chars="historyChars"
      :words="[]"
      sheet-name="practice_sheet"
    />
    <StrokeExplorer v-model="showStrokeModal" :initial-char="lastHistoryChar" />
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import BasePage from '../components/BasePage.vue';
import PracticeSheetModal from '../components/PracticeSheetModal.vue';
import StrokeExplorer from '../components/StrokeExplorer.vue';

export default {
  name: 'ToolsView',
  components: { BasePage, PracticeSheetModal, StrokeExplorer },
  setup() {
    const store = useStore();

    // Get history from store and join characters
    const historyChars = computed(() => {
      const history = store.getters['zihistory/getHistory'] || [];
      const joined = Array.from(history).join('');
      const unique = Array.from(new Set(joined)).join('');
      return unique;
    });

    // Get last opened character for stroke explorer
    const lastHistoryChar = computed(() => {
      return store.getters['zihistory/getLastOpened'] || '';
    });

    return {
      historyChars,
      lastHistoryChar
    };
  },
  data() {
    return {
      showModal: false,
      showStrokeModal: false,
    };
  },
};
</script>

<style scoped>


.tool-card {
  background: color-mix(in oklab, var(--fg) 4%, var(--bg) 100%);
  padding: 1rem;
}
.tool-header h3 {
  margin: 0 0 0.25rem 0;
}
.tool-header p {
  margin: 0 0 0.75rem 0;
  opacity: 0.8;
}
.tool-button {
  border: 1px solid color-mix(in oklab, var(--fg) 20%, var(--bg) 100%);
  background: color-mix(in oklab, var(--fg) 8%, var(--bg) 100%);
  color: var(--fg);
  padding: 0.6rem 1rem;
  border-radius: var(--border-radius, 4px);
  cursor: pointer;
}
</style>
