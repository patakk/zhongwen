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
          <div v-if="categoryName === selectedCategory">
            <h2>{{ category.name || categoryName }}</h2>
            <div class="grid-container">
              <div
                v-for="(entry, charKey) in category.chars"
                :key="charKey"
                class="grid-item"
                @mouseover="startHoverTimer(entry.character)"
                @mouseleave="clearHoverTimer"
                @click="openPopup(entry.character)"
              >
                <div class="hanzi">{{ entry.character }}</div>
                <div class="pinyin">{{ entry.pinyin.join(', ') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Popup component to show the card data -->
      <PopupModal v-if="showPopup" :data="popupData" :word="word" @close="closePopup" />
    </div>
  </template>
  
  <script>
  import PopupModal from '../components/PopupModal.vue';
  
  export default {
    data() {
      return {
        selectedCategory: null,
        hoverTimer: null,
        popupData: {}, // Store the card data for each character
        loadingData: {}, // Track loading state for each character
        showPopup: false,
        word: "", // Full word for the popup
        characters: [] // To store the characters of the selected word
      };
    },
    computed: {
      dictionaryData() {
        return this.$store.getters.getDictionaryData;
      }
    },
    components: {
      PopupModal
    },
    methods: {
      startHoverTimer(character) {
        this.hoverTimer = setTimeout(() => {
          this.fetchCardData(character);
        }, 300);
      },
      clearHoverTimer() {
        clearTimeout(this.hoverTimer);
      },
  
      // Fetch data for the entire word
      async fetchCardData(word) {
        // Skip fetch if the character data already exists or is being fetched
        if (this.popupData[word] || this.loadingData[word]) {
          return;
        }
  
        // Mark as loading
        this.loadingData[word] = true;
  
        try {
          const response = await fetch(`http://127.0.0.1:5117/get_card_data?character=${word}`);
          const data = await response.json();
          console.log(data);
  
          // Check if we have the breakdown for each character
          if (data && data.chars_breakdown) {
            // Process the data, each character's breakdown should be in the result
            let keys = Object.keys(data.chars_breakdown);
            keys.forEach((character) => {
              let charData = data.chars_breakdown[character];
              this.popupData[charData.character] = charData;
            });
          }
        } catch (error) {
          console.error("Error fetching card data:", error);
        } finally {
          // Mark loading as complete for this character
          this.loadingData[word] = false;
        }
      },
  
      // Open the popup for the selected word
      async openPopup(character) {
        this.word = character; // The word that was clicked
        this.characters = character.split(''); // Split the word into characters
  
        // Clear data specific to the clicked word (not the entire popupData object)
        this.characters.forEach(c => {
          if (!this.popupData[c]) {
            this.popupData[c] = {}; // Initialize empty data for characters that are being fetched
          }
        });
  
        // Fetch data only for characters that have not been loaded yet
        const fetchPromises = this.characters.map(c => {
          if (!this.popupData[c] || Object.keys(this.popupData[c]).length === 0) {
            return this.fetchCardData(c);
          }
        });
  
        // Wait for all the fetches for the missing characters
        await Promise.all(fetchPromises);
          
        // Show the popup after fetching all data
        this.showPopup = true;
      },
  
      // Close the popup
      closePopup() {
        this.showPopup = false;
        this.characters = [];
        this.word = "";
      }
    }
  };
  </script>
  

  
  <style scoped>
  /* Grid layout */
  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
    padding: 16px;
  }
  
  .grid-item {
    background: #f0f0f0;
    padding: 12px;
    border-radius: 8px;
    text-align: center;
    position: relative;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .hanzi {
    font-size: 2em;
    font-weight: bold;
  }
  
  .pinyin {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    visibility: hidden;
    opacity: 0;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    transition: opacity 0.3s, visibility 0.3s;
    font-size: 0.9em;
  }
  
  .grid-item:hover .pinyin {
    visibility: visible;
    opacity: 1;
  }
  
  .grid-item:hover {
    background-color: #e0e0e0;
  }
  
  select {
    margin-bottom: 20px;
    padding: 5px;
    font-size: 1em;
  }
  </style>
  