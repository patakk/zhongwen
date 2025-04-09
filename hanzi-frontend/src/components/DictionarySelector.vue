<template>
    <div>
      <!-- Dropdown to select dictionary -->
      <select v-model="selectedDict" @change="handleDictChange">
        <option v-for="(category, key) in dictionaryData" :key="key" :value="key">
          {{ category.name || key }}
        </option>
      </select>
  
      <!-- Pass the selected dictionary to the DictionaryDisplay component -->
      <dictionary-display :dictionary="dictionaryData[selectedDict]" />
    </div>
  </template>
  
  <script>
  import DictionaryDisplay from './DictionaryDisplay.vue'; // Import the child component
  
  export default {
    components: {
      DictionaryDisplay // Register the child component
    },
    data() {
      return {
        selectedDict: 'hsk1' // Default selected dictionary
      };
    },
    computed: {
      // Access the dictionary data from the store
      dictionaryData() {
        return this.$store.getters.getDictionaryData;
      }
    },
    methods: {
      handleDictChange() {
        // You can add custom logic when the dictionary is changed
        console.log('Selected dictionary:', this.selectedDict);
      }
    }
  }
  </script>
  