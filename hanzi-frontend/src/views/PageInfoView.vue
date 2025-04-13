<template>
  <div class="page-info">
    <h1>Chinese Language Learning</h1>
    
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
            <span class="pinyin">nǐ hǎo</span>
            <span class="meaning">Hello</span>
          </div>
          <div class="word-item">
            <PreloadWrapper character="谢谢">
              <span class="chinese-word">谢谢</span>
            </PreloadWrapper>
            <span class="pinyin">xièxie</span>
            <span class="meaning">Thank you</span>
          </div>
          <div class="word-item">
            <PreloadWrapper character="再见">
              <span class="chinese-word">再见</span>
            </PreloadWrapper>
            <span class="pinyin">zàijiàn</span>
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
import PreloadWrapper from '../components/PreloadWrapper.vue'

export default {
  name: 'PageInfoView',
  components: {
    PreloadWrapper
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
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 2rem;
}

h2 {
  color: var(--text-primary);
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
  color: var(--text-primary);
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.chinese-word:hover {
  color: var(--accent);
}

.pinyin {
  color: var(--text-secondary);
  font-size: 0.9em;
  margin-bottom: 0.25rem;
}

.meaning {
  color: var(--text-primary);
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
</style>
