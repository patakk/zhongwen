<template>
    <div class="popup">
      <div class="popup-header">
        <h2>{{ word }}</h2>
      </div>
      <div class="tabs">
        <ul>
          <li
            v-for="(character, index) in characters"
            :key="index"
            :class="{ active: activeTab === index }"
            @click="setActiveTab(index)"
          >
            {{ character }}
          </li>
        </ul>
        <div class="tab-content">
          <div v-for="(character, index) in characters" :key="index" v-show="activeTab === index">
            <!-- Access the character-specific data directly from chars_breakdown -->
            <div v-if="data && data.chars_breakdown && data.chars_breakdown[character]">
              <div v-for="(value, key) in data.chars_breakdown[character]" :key="key">
                <strong>{{ key }}:</strong> {{ formatValue(value) }}
              </div>
            </div>
            <!-- Handle the case where character data is still loading -->
            <div v-else>
              <p>Loading data...</p>
            </div>
          </div>
        </div>
      </div>
      <button @click="close">Close</button>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      data: Object,
      word: String
    },
    data() {
      return {
        activeTab: 0,
        characters: []
      };
    },
    created() {
        console.log('PopupModal received data:', this.data);
        this.characters = this.word.split('');
    },
    methods: {
      setActiveTab(index) {
        this.activeTab = index;
      },
      close() {
        this.$emit('close');
      },
      // Helper method to format array values nicely
      formatValue(value) {
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value;
      }
    }
  };
  </script>
  

  <style scoped>
  .popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .popup-header {
    text-align: center;
    margin-bottom: 20px;
  }
  
  .tabs {
    display: flex;
    justify-content: space-around;
    margin-bottom: 20px;
  }
  
  .tabs ul {
    display: flex;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .tabs li {
    cursor: pointer;
    padding: 10px;
    background: #f0f0f0;
    border-radius: 4px;
    margin-right: 8px;
  }
  
  .tabs li.active {
    background: #e0e0e0;
  }
  
  .tab-content {
    margin-top: 10px;
  }
  
  button {
    display: block;
    margin: 20px auto;
    padding: 10px 20px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    background: #0056b3;
  }
  </style>
  