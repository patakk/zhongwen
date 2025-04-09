<template>
    <div class="grid-container">
      <h2>{{ dictionary.name || 'Dictionary' }}</h2>
      <div class="grid">
        <div 
          v-for="(entry, charKey) in dictionary.chars" 
          :key="charKey" 
          class="grid-item"
          @mouseover="showPinyin = charKey" 
          @mouseleave="showPinyin = null">
          
          <!-- Show Hanzi -->
          <span class="hanzi">{{ entry.character }}</span>
  
          <!-- Show Pinyin on hover -->
          <span v-if="showPinyin === charKey" class="pinyin">{{ entry.pinyin.join(', ') }}</span>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      dictionary: Object // The selected dictionary passed from the parent
    },
    data() {
      return {
        showPinyin: null // Track which character has its Pinyin displayed on hover
      };
    }
  }
  </script>
  
  <style scoped>
  .grid-container {
    margin: 20px;
  }
  
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr)); /* Responsive grid */
    gap: 10px;
  }
  
  .grid-item {
    position: relative;
    text-align: center;
    font-size: 1.5rem;
    cursor: pointer;
  }
  
  .hanzi {
    display: block;
  }
  
  .pinyin {
    display: block;
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    padding: 5px;
    border: 1px solid #ddd;
    visibility: hidden;
  }
  
  .grid-item:hover .pinyin {
    visibility: visible;
  }
  </style>
  