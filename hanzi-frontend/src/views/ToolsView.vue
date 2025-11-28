<template>
  <BasePage page_title="Tools" />
  <div class="tools-page">
    <div class="tool-card">
      <div class="tool-header">
        <h3>Practice Sheet Generator</h3>
        <p>Create a practice sheet from any characters.</p>
      </div>
      <button class="tool-button" @click="showModal = true">Open Generator</button>
    </div>
    <PracticeSheetModal
      v-model="showModal"
      :initial-chars="''"
      :words="[]"
      sheet-name="practice_sheet"
    />
  </div>
</template>

<script>
import BasePage from '../components/BasePage.vue';
import PracticeSheetModal from '../components/PracticeSheetModal.vue';

export default {
  name: 'ToolsView',
  components: { BasePage, PracticeSheetModal },
  data() {
    return {
      showModal: false,
    };
  },
};
</script>

<style scoped>
.tools-page {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.tool-card {
  border: 1px solid color-mix(in oklab, var(--fg) 15%, var(--bg) 100%);
  background: color-mix(in oklab, var(--fg) 4%, var(--bg) 100%);
  border-radius: var(--border-radius, 6px);
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
