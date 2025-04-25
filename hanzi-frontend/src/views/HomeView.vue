<template>
  <BasePage page_title="Hanzi" /> 
  <div class="page-info">
    <div class="infoTitle">Chinese Language Learning</div>
    
    <form @submit.prevent="goToSearch" class="search-form">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="search for words or characters..."
        class="search-input"
      />
      <button type="submit" class="search-button">search</button>
    </form>
    
    <div class="content">
      <section class="intro-section">
        <h2>Introduction</h2>
        <p>
          Welcome to our Chinese language learning platform! Here you can explore characters like 
          <PreloadWrapper character="汉">
            <span class="chinese-word">汉</span>
          </PreloadWrapper>
          (hàn, Chinese) and 
          <PreloadWrapper character="语">
            <span class="chinese-word">语</span>
          </PreloadWrapper>
          (yǔ, language) which together form 
          <PreloadWrapper character="汉语">
            <span class="chinese-word">汉语</span>
          </PreloadWrapper>
          (hànyǔ, Chinese language).
        </p>
      </section>

      <section class="example-section">
        <h2>Common Words</h2> 
        <div class="word-grid">
          <div class="word-item">
            <PreloadWrapper character="你好">
              <span class="chinese-word">你好</span>
            </PreloadWrapper>
            <span class="mpinyin">nǐ hǎo</span>
            <span class="meaning">Hello</span>
          </div>
          <div class="word-item">
            <PreloadWrapper character="谢谢">
              <span class="chinese-word">谢谢</span>
            </PreloadWrapper>
            <span class="mpinyin">xièxie</span>
            <span class="meaning">Thank you</span>
          </div>
          <div class="word-item">
            <PreloadWrapper character="再见">
              <span class="chinese-word">再见</span>
            </PreloadWrapper>
            <span class="mpinyin">zàijiàn</span>
            <span class="meaning">Goodbye</span>
          </div>
        </div>
      </section>

      <section class="usage-section">
        <h2>Example Sentences</h2>
        <div class="sentence">
          <p>
            <PreloadWrapper character="我">
              <span class="chinese-word">我</span>
            </PreloadWrapper>
            <PreloadWrapper character="喜欢">
              <span class="chinese-word">喜欢</span>
            </PreloadWrapper>
            <PreloadWrapper character="学习">
              <span class="chinese-word">学习</span>
            </PreloadWrapper>
            <PreloadWrapper character="中文">
              <span class="chinese-word">中文</span>
            </PreloadWrapper>
            。
          </p>
          <p class="translation">I like studying Chinese.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import PreloadWrapper from '../components/PreloadWrapper.vue';
import BasePage from '../components/BasePage.vue';

export default {
  name: 'PageInfoView',
  components: {
    PreloadWrapper,
    BasePage
  },
  data() {
    return {
      searchQuery: ''
    };
  },
  methods: {
    goToSearch() {
      // Start the search request immediately
      const searchPromise = fetch('/api/search_results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: this.searchQuery }),
      });
      
      // Store the search promise in a global variable that SearchView can access
      window.pendingSearchPromise = searchPromise;
      
      // Navigate to the search page with the query parameter
      this.$router.push({ name: 'SearchPage', query: { q: this.searchQuery } });
    }
  }
}
</script>

<style scoped>
.page-info {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.content {
  margin-top: 2rem;
  line-height: 1.6;
}

section {
  margin-bottom: 3rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 1em;
  box-shadow: var(--card-shadow);
  border: var(--card-border);
}

.infoTitle {
  color: var(--fg);
  text-align: center;
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 2rem;
}

h2 {
  color: var(--fg);
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.word-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.word-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--bg);
  border-radius: 8px;
}

.word-item:hover {
}

.chinese-word {
  font-size: 1.5em;
  color: var(--fg);
  cursor: pointer;
  margin-bottom: 0.5rem;
  background-color: none;
  padding: .125em 0.25em;
}

.chinese-word:hover {
  box-shadow: var(--card-shadow);
  border: var(--card-border);
}

.pinyin {
  color: var(--fg);
  font-size: 0.9em;
  margin-bottom: 0.25rem;
}

.meaning {
  color: var(--fg);
  font-size: 0.9em;
}

.sentence {
  background: var(--bg);
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.sentence p {
  font-size: 1.2em;
  margin-bottom: 0.5rem;
}

.translation {
  color: var(--text-secondary);
  font-style: italic;
}

.search-form {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  max-width: 600px;
  margin: 0 auto 2rem auto;
  flex-wrap: wrap; /* Add this to make the form wrap on narrow screens */
}

input.search-input {
  flex: 1;
  min-width: 200px; /* This ensures the input doesn't get too narrow before wrapping */
}
</style>
