<template>
  <div>
    <h1>Dictionary Data</h1>

    <label for="dictionary-select">Choose a Dictionary:</label>
    <select v-model="selectedCategory" id="dictionary-select">
      <option v-for="(category, categoryName) in dictionaryData" :key="categoryName" :value="categoryName">
        {{ category.name || categoryName }}
      </option>
    </select>

    <div v-if="selectedCategory">
      <div v-for="(category, categoryName) in dictionaryData" :key="categoryName">
        <div v-if="categoryName === selectedCategory" class="dictionary-category">
          <h2>{{ category.name || categoryName }}</h2>
          <div class="grid-container">
            <PreloadWrapper :character="entry.character" v-for="(entry, charKey) in category.chars" :key="charKey">
              <div class="grid-item">
                <div class="hanzi">{{ entry.character }}</div>
                <div class="pinyin">{{ entry.pinyin.join(', ') }}</div>
              </div>
            </PreloadWrapper>
          </div>
        </div>
      </div>
    </div>

    <!-- Fallback message if no category is selected -->
    <div v-else>
      <p>Please select a dictionary to view the characters.</p>
    </div>
  </div>
</template>

<script>
import PreloadWrapper from '../components/PreloadWrapper.vue';

export default {
  data() {
    return {
      selectedCategory: null
    };
  },
  components: {
    PreloadWrapper
  },
  computed: {
    dictionaryData() {
      return this.$store.getters.getDictionaryData;
    }
  }
};
</script>

<style scoped>
/* Grid layout */
.dictionary-category {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
  padding: 16px;
  width: 100%;
  max-width: 1200px;
}

.grid-item {
  background: color-mix(in oklab, var(--fg) 10%, var(--bg) 50%);
  padding: 12px;
  border-radius: 1px;
  text-align: center;
  position: relative;
  cursor: pointer;
}

.hanzi {
  font-size: 1.5em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--primary-text);
}

.pinyin {
  position: absolute;
  font-size: 1em;
  left: 50%;
  top: 50%;
  transform: translateX(-50%) translateY(-50%);
  background: color-mix(in oklab, var(--fg) 0%, var(--bg) 100%);
  visibility: hidden;
  vertical-align: center;
  opacity: 0;
  padding: .25em .5em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--primary-text);
  z-index: 1;
}

.grid-item:hover .pinyin {
  visibility: visible;
  opacity: 1;
}

.grid-item:hover .hanzi {
  visibility: hidden;
  opacity: 0;
}

select {
  margin-bottom: 20px;
  padding: 5px;
  font-size: 1em;
}
</style>

