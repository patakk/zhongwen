<template>
    <BasePage page_title="My Words" />
    <div class="myspace-view" v-if="loggedIn">
      <div class="wordlist-container">
        <div class="wordlist-header">
          <!-- <h2>My Wordlists</h2> -->
  
          <div class="wordlist-selector">
            <div class="custom-dropdown">
              <div 
                id="selected-deck" 
                @click="isDropdownOpen = !isDropdownOpen"
              >
                {{ selectedWordlist || 'Select a wordlist' }}
              </div>
              <div 
                id="deck-options" 
                :class="{ 'show': isDropdownOpen }"
              >
                <div 
                  v-for="list in customDecks" 
                  :key="list.name" 
                  class="option"
                  :class="{ 'selected': selectedWordlist === list.name }"
                  @click="selectWordlist(list.name)"
                >
                  {{ list.name }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Add Wordlist Management Controls -->
        <div class="wordlist-management">
          <button @click="showCreateWordlistModal = true" class="action-button create-button">
            Create New Wordlist
          </button>
          
          <div v-if="selectedWordlist" class="wordlist-actions">
            <button @click="showRenameWordlistModal = true" class="action-button rename-button">
              Rename Wordlist
            </button>
            <button @click="confirmRemoveWordlist" class="action-button delete-button">
              Delete Wordlist
            </button>
          </div>
        </div>
  
        <div v-if="loading" class="loading">Loading wordlist...</div>
  
        <div v-else-if="!selectedWordlist" class="empty-list">
          <p>Please select a wordlist from the dropdown above.</p>
        </div>
  
        <div v-else>
          <!-- Show add-word-section even if wordlist is empty -->
          <div class="add-word-section">
            <input
              type="text"
              v-model="newWordInput"
              placeholder="Enter word(s) to add"
              class="add-word-input"
              @keyup.enter="addWordToList"
            />
            <button
              @click="addWordToList"
              class="nav-button add-word-button"
              :disabled="!selectedWordlist || !newWordInput.trim()"
            >
              Add Words
            </button>
          </div>

          <div v-if="words.length === 0" class="empty-list">
            <p>This wordlist is empty. Add words from the Search or Grid views.</p>
          </div>

          <div v-else>
            <!-- Info panel -->
            <div class="wordlist-info">
              <!-- Display Description -->
              <div class="description-section">
                <p>
                  <strong>Description:</strong>
                  <button @click="openEditDescriptionModal" class="edit-description-button" title="Edit Description">
                    <font-awesome-icon :icon="['fas', 'pencil']" />
                  </button>
                </p>
                <p class="description-text">{{ currentWordlistDescription || 'No description yet.' }}</p>
              </div>
              <p><strong>Created:</strong> {{ currentWordlistCreatedAt ? formatDate(currentWordlistCreatedAt) : 'N/A' }}</p>
              <p><strong>Number of Words:</strong> {{ words.length }}</p>
            </div>
  
            <!-- Navigation buttons -->
            <div class="nav-buttons">
              <router-link
                :to="{
                  path: '/flashcards',
                  query: { wordlist: selectedWordlist }
                }"
                class="nav-button router-button"
                title="Go to Flashcards"
              >
                flashcards
              </router-link>
              <router-link
                :to="{
                  path: '/explorer',
                  query: { wordlist: selectedWordlist }
                }"
                class="nav-button router-button"
                title="Go to Grid View"
              >
                explorer view
              </router-link>
              <button
                @click="downloadAnkiDeck"
                class="nav-button data-button"
                title="Download Anki Deck"
                :disabled="words.length === 0"
              >
              <font-awesome-icon :icon="['fas', 'download']" /> anki deck
              </button>
              <button
                @click="showPracticeSheetModal = true"
                class="nav-button data-button"
                title="Get Practice Sheet"
                :disabled="words.length === 0"
              >
                <font-awesome-icon :icon="['fas', 'pen']" /> practice sheet
              </button>
              <button
                @click="copyWordlistToClipboard"
                class="nav-button data-button"
                title="Copy Wordlist to Clipboard"
                :disabled="words.length === 0"
              >
                <font-awesome-icon :icon="['fas', 'clipboard']" /> copy words
              </button>
            </div>

            <!-- Word list -->
            <div class="word-list">
                <PreloadWrapper :character="word.character"
                    :navList="words.map(w => w.character)"
                    v-for="word in words"
                    :key="word.character"
                    class="word-item"
                    :title="word.english[0]"
                    :showBubbles="false"
                >
                    <div class="word-cell">
                        <div class="hanzipinyin">
                          <div class="word-hanzi">
                            {{ word.character }}
                          </div>
                            <div class="word-pinyin">
                                {{ $toAccentedPinyin(word.pinyin[0]) }}
                            </div>
                        </div>
                        <div class="word-english">{{ word.english[0] }}</div>
                        <button
                            class="remove-button"
                            @click.stop="removeWord(word.character)"
                            title="Remove from wordlist"
                            >
                            ✕
                        </button>
                    </div>
                </PreloadWrapper>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="myspace-view">
      <p>Redirecting to login page...</p>
    </div>

    <!-- Create Wordlist Modal -->
    <div v-if="showCreateWordlistModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <h3>Create New Wordlist</h3>
        <div class="modal-form">
          <label for="new-wordlist-name">Wordlist Name:</label>
          <input 
            id="new-wordlist-name" 
            v-model="newWordlistName" 
            placeholder="Enter wordlist name"
            @keyup.enter="createWordlist"
            @keyup.esc="closeCreateModal"
            ref="createModalInput"
            autocomplete="off"
          />
        </div>
        <div class="modal-buttons">
          <button @click="closeCreateModal" class="cancel-button">Cancel</button>
          <button @click="createWordlist" class="confirm-button">Create</button>
        </div>
      </div>
    </div>

    <!-- Rename Wordlist Modal -->
    <div v-if="showRenameWordlistModal" class="modal-overlay" @click="closeRenameModal">
      <div class="modal-content" @click.stop>
        <h3>Rename Wordlist</h3>
        <div class="modal-form">
          <label for="rename-wordlist">New Name:</label>
          <input 
            id="rename-wordlist" 
            v-model="newWordlistName" 
            placeholder="Enter new name"
            @keyup.enter="renameWordlist"
            @keyup.esc="closeRenameModal"
            ref="renameModalInput"
            autocomplete="off"
          />
        </div>
        <div class="modal-buttons">
          <button @click="closeRenameModal" class="cancel-button">Cancel</button>
          <button @click="renameWordlist" class="confirm-button">Rename</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirmModal" class="modal-overlay" @click="closeDeleteConfirmModal">
      <div class="modal-content" @click.stop>
        <h3>Confirm Deletion</h3>
        <div class="modal-message">
          <p>Are you sure you want to delete the wordlist "{{ selectedWordlist }}"?</p>
          <p>This action cannot be undone.</p>
        </div>
        <div class="modal-buttons">
          <button @click="closeDeleteConfirmModal" class="cancel-button">Cancel</button>
          <button @click="deleteWordlistConfirmed" class="confirm-button delete-confirm-button">Delete</button>
        </div>
      </div>
    </div>

    <!-- Edit Description Modal -->
    <div v-if="showEditDescriptionModal" class="modal-overlay" @click="closeEditDescriptionModal">
      <div class="modal-content" @click.stop>
        <h3>Edit Wordlist Description</h3>
        <div class="modal-form">
          <label for="edit-wordlist-description">Description:</label>
          <textarea
            id="edit-wordlist-description"
            v-model="newWordlistDescription"
            placeholder="Enter description (max 500 characters)"
            rows="4"
            maxlength="500"
            @keyup.esc="closeEditDescriptionModal"
            ref="editDescriptionInput"
          ></textarea>
        </div>
        <div class="modal-buttons">
          <button @click="closeEditDescriptionModal" class="cancel-button">Cancel</button>
          <button @click="saveWordlistDescription" class="confirm-button">Save</button>
        </div>
      </div>
    </div>

    <!-- Practice Sheet Modal -->
    <div v-if="showPracticeSheetModal" class="modal-overlay" @click="closePracticeSheetModal">
      <div class="modal-content" @click.stop>
        <h3>Get Practice Sheet</h3>
        <div class="svg-modal-form">
          <div class="practice-options">
            <div
              v-for="opt in practiceOptions"
              :key="opt.value"
              class="practice-option"
              :class="{ selected: selectedPracticeOption === opt.value, faded: selectedPracticeOption !== opt.value }"
              @click="selectedPracticeOption = opt.value"
            >
              {{ opt.label }}
            </div>
          </div>
          <div style="margin-top:1.5rem;">
            <label>Included Characters (click to exclude/include):</label>
            <div class="practice-char-list">
              <span
                v-for="char in getPracticeSheetUniqueChars()"
                :key="char"
                class="practice-char"
                :class="{ excluded: practiceSheetExcludedChars.has(char) }"
                @click="togglePracticeSheetChar(char)"
                :title="practiceSheetExcludedChars.has(char) ? 'Click to include' : 'Click to exclude'"
              >
                {{ char }}
              </span>
            </div>
            <div v-if="getPracticeSheetUniqueChars().length === 0" style="opacity:0.7; font-style:italic; margin-top:0.5rem;">No characters in this wordlist.</div>
            <!-- <button v-if="practiceSheetExcludedChars.size > 0" @click="resetPracticeSheetExcludedChars" class="reset-excluded-button">Reset Excluded</button> -->
          </div>
        </div>
        <div class="modal-buttons">
          <button @click="closePracticeSheetModal" class="cancel-button">Cancel</button>
          <button @click="createPracticeSheet" class="confirm-button">Create</button>
        </div>
      </div>
    </div>

    <!-- Practice Sheet SVG Preview Modal -->
    <div v-if="showPracticeSheetSVG" class="modal-overlay" @click="showPracticeSheetSVG = false">
      <div class="modal-content-svg" @click.stop>
        <h3>Practice Sheet Preview</h3>
        <div class="modal-svg-preview">
          <div class="modal-svg-content" v-html="practiceSheetSVG"></div>
        </div>
        <div class="svg-modal-buttons">
          <!-- <button @click="showPracticeSheetSVG = false" class="cancel-button">Close</button> -->
          <button @click="downloadPracticeSheetSVG" class="confirm-button">Download SVG</button>
          <button @click="downloadPracticeSheetPDF" class="confirm-button">Download PDF</button>
        </div>
        <div v-if="practiceSheetTotalPages > 1" class="modal-buttons" style="justify-content:center;">
          <button @click="updatePracticeSheetPage(currentPracticeSheetPage-1)" :disabled="currentPracticeSheetPage === 0">Previous Page</button>
          <span style="margin:0 1rem;">Page {{ currentPracticeSheetPage+1 }} / {{ practiceSheetTotalPages }}</span>
          <button @click="updatePracticeSheetPage(currentPracticeSheetPage+1)" :disabled="currentPracticeSheetPage >= practiceSheetTotalPages-1">Next Page</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import BasePage from '../components/BasePage.vue';
  import PreloadWrapper from '../components/PreloadWrapper.vue';
  import { generatePracticeSheetSVG, generatePracticeSheetPDF } from '../lib/practiceSheetExport.js';
  
  export default {
    name: 'MySpaceView',
    components: {
      BasePage,
      PreloadWrapper,
    },
    data() {
      return {
        selectedWordlist: '',
        words: [],
        loading: false,
        // For modals and wordlist management
        showCreateWordlistModal: false,
        showRenameWordlistModal: false,
        showDeleteConfirmModal: false,
        showEditDescriptionModal: false, // Added for description modal
        newWordlistName: '',
        newWordlistDescription: '', // Added for description editing
        isDropdownOpen: false, // Added for dropdown control
        newWordInput: '', // Added for adding words
        showPracticeSheetModal: false,
        selectedPracticeOption: 'option1',
        practiceOptions: [
          { value: 'one_row', label: 'One row per character' },
          { value: 'two_rows', label: 'Two rows per character (second row empty)' },
        ],
        practiceSheetSVG: '', // SVG string for preview/download
        showPracticeSheetSVG: false, // Show SVG preview modal
        practiceSheetStrokesData: null, // Store strokes data for PDF export
        currentPracticeSheetPage: 0, // Track current page for preview
        practiceSheetTotalPages: 1, // Track total pages for preview
        practiceSheetExcludedChars: new Set(), // Track excluded chars for practice sheet
      };
    },
    computed: {
      loggedIn() {
        return this.$store.getters.getAuthStatus;
      },
      customDecks() {
        return this.$store.getters.getCustomDecks; // Use the original getter
      },
      customDictionaryData() {
        return this.$store.getters.getCustomDictionaryData;
      },
      currentWordlistData() {
        if (!this.selectedWordlist || !this.customDecks) return null;
        return this.customDecks.find(deck => deck.name === this.selectedWordlist);
      },
      currentWordlistDescription() {
        return this.currentWordlistData?.description || '';
      },
      currentWordlistCreatedAt() {
        return this.currentWordlistData?.timestamp || null;
      },
    },
    watch: {
      selectedWordlist(newVal) {
        // Existing logic to load words remains (implicitly handled by @change on select)
        this.loadWordlistWords(); 
      },
      showCreateWordlistModal(newVal) {
        if (newVal) {
          this.newWordlistName = '';
          this.$nextTick(() => {
            this.$refs.createModalInput?.focus();
          });
        }
      },
      showRenameWordlistModal(newVal) {
        if (newVal) {
          this.newWordlistName = this.selectedWordlist;
          this.$nextTick(() => {
            this.$refs.renameModalInput?.focus();
          });
        }
      },
      showEditDescriptionModal(newVal) {
        if (newVal) {
          this.newWordlistDescription = this.currentWordlistDescription;
          this.$nextTick(() => {
            this.$refs.editDescriptionInput?.focus();
          });
        }
      },
      showPracticeSheetModal(newVal) {
        if (newVal) {
          this.selectedPracticeOption = 'one_row';
        }
      }
    },
    mounted() {
      // Check authentication status and redirect if not logged in
      if (!this.loggedIn) {
        this.$router.push('/login');
        return;
      }
      
      // Set up document click listener for dropdown
      document.addEventListener('click', this.handleOutsideClick);
      
      // Debug logging of wordlists
      
      // Make sure we have wordlist data by dispatching fetchUserData if needed
      if (this.customDecks && this.customDecks.length > 0) {
        this.selectedWordlist = this.customDecks[0].name;
        
        if (
          this.customDictionaryData &&
          this.customDictionaryData[this.selectedWordlist]
        ) {
          this.loadWordlistWords();
        } else {
          this.loading = true;
          this.$store
            .dispatch('fetchCustomDictionaryData')
            .then(() => {
              this.loading = false;
              this.loadWordlistWords();
            })
            .catch((err) => {
              console.error('Error loading custom dictionary data:', err);
              this.loading = false;
            });
        }
      }
    },
    methods: {
      formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
          const options = { year: 'numeric', month: 'long', day: 'numeric' };
          return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
          console.error("Error formatting date:", e);
          return dateString; // Fallback to original string
        }
      },
      loadWordlistWords() {
        try {
          if (
            this.customDictionaryData &&
            this.selectedWordlist &&
            this.customDictionaryData[this.selectedWordlist]
          ) {
            const listData = this.customDictionaryData[this.selectedWordlist];
            const charsData = listData.chars;
            // Debug: print the order of characters as seen in the frontend
            try {
              console.log('[MySpaceView] loadWordlistWords chars order for', this.selectedWordlist, Object.keys(charsData || {}));
            } catch (e) {}
  
            if (charsData) {
              const explicitOrder = Array.isArray(listData.order) ? listData.order : null;
              if (explicitOrder && explicitOrder.length > 0) {
                this.words = explicitOrder
                  .filter(c => !!charsData[c])
                  .map(c => ({ character: c, ...charsData[c] }));
              } else {
                this.words = Object.entries(charsData).map(([character, data]) => ({
                  character,
                  ...data,
                }));
              }
              try {
                console.log('[MySpaceView] words array order', this.words.map(w => w.character));
              } catch (e) {}
            } else {
              this.words = [];
            }
          } else {
            this.words = [];
          }
        } catch (error) {
          console.error('Error loading wordlist words:', error);
          this.words = [];
        }
      },
  
      removeWord(character) {
        if (!this.selectedWordlist) return;
  
        this.words = this.words.filter((word) => word.character !== character);
  
        this.$store.dispatch('removeWordFromCustomDeck', {
          character,
          selectedWordlist: this.selectedWordlist,
        });
  
        fetch('/api/remove_word_from_learning', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            character,
            set_name: this.selectedWordlist,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              console.error('Failed to remove word');
              this.loadWordlistWords();
            }
          })
          .catch((error) => {
            console.error('Error removing word:', error);
            this.loadWordlistWords();
          });
      },

      // New methods for wordlist management
      createWordlist() {
        if (!this.newWordlistName || this.newWordlistName.trim() === '') {
          alert('Please enter a valid wordlist name');
          return;
        }

        const name = this.newWordlistName.trim();
        
        // Optimistic update - add to store first
        this.$store.dispatch('createWordlist', { name });
        
        // Close modal and reset
        this.showCreateWordlistModal = false;
        this.newWordlistName = '';
        
        // Select the new wordlist
        this.selectedWordlist = name;
        
        // Explicitly reset the words array for the new wordlist
        this.words = [];
        
        // Send to backend
        fetch('./api/create_wordlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name }),
        })
        .catch((error) => {
          console.error('Error creating wordlist:', error);
          // If there's an error, refresh data to get the correct state
          this.$store.dispatch('fetchUserData')
            .then(() => this.$store.dispatch('fetchCustomDictionaryData'));
        });
      },
      
      renameWordlist() {
        if (!this.newWordlistName || this.newWordlistName.trim() === '') {
          alert('Please enter a valid wordlist name');
          return;
        }

        if (!this.selectedWordlist) {
          alert('Please select a wordlist first');
          return;
        }

        const oldName = this.selectedWordlist;
        const newName = this.newWordlistName.trim();
        
        if (oldName === newName) {
          this.showRenameWordlistModal = false;
          return;
        }
        
        // Optimistic update - update store first
        this.$store.dispatch('renameWordlist', { 
          oldName, 
          newName 
        });
        
        // Update selected wordlist
        this.selectedWordlist = newName;
        
        // Close modal and reset
        this.showRenameWordlistModal = false;
        this.newWordlistName = '';
        
        // Send to backend
        fetch("/api/rename_wordlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            name: oldName, 
            newname: newName 
          })
        })
        .catch((error) => {
          console.error('Error renaming wordlist:', error);
          // If there's an error, refresh data to get the correct state
          this.$store.dispatch('fetchUserData')
            .then(() => this.$store.dispatch('fetchCustomDictionaryData'));
        });
      },
      
      confirmRemoveWordlist() {
        if (!this.selectedWordlist) {
          alert('Please select a wordlist first');
          return;
        }
        
        this.showDeleteConfirmModal = true;
      },

      deleteWordlistConfirmed() {
        const wordlistToRemove = this.selectedWordlist;

        this.closeDeleteConfirmModal();

        // Optimistic update - remove from store first
        this.$store.dispatch('removeWordlist', { name: wordlistToRemove });

        // Update selection
        if (this.customDecks && this.customDecks.length > 0) {
          this.selectedWordlist = this.customDecks[0].name;
          this.loadWordlistWords();
        } else {
          this.selectedWordlist = '';
          this.words = [];
        }

        // Send to backend
        fetch("/api/remove_wordlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name: wordlistToRemove })
        })
        .catch((error) => {
          console.error('Error removing wordlist:', error);
          // If there's an error, refresh data to get the correct state
          this.$store.dispatch('fetchUserData')
            .then(() => this.$store.dispatch('fetchCustomDictionaryData'));
        });
      },

      // New methods for modal management
      closeCreateModal() {
        this.showCreateWordlistModal = false;
        this.newWordlistName = '';
      },
      
      closeRenameModal() {
        this.showRenameWordlistModal = false;
        this.newWordlistName = '';
      },

      closeDeleteConfirmModal() {
        this.showDeleteConfirmModal = false;
      },

      closePracticeSheetModal() {
        this.showPracticeSheetModal = false;
        this.resetPracticeSheetExcludedChars(); // Reset on close
      },

      // Methods for description editing
      openEditDescriptionModal() {
        if (!this.selectedWordlist) return;
        this.showEditDescriptionModal = true;
      },

      closeEditDescriptionModal() {
        this.showEditDescriptionModal = false;
        this.newWordlistDescription = ''; // Reset on close
      },

      saveWordlistDescription() {
        if (!this.selectedWordlist) return;

        const descriptionToSave = this.newWordlistDescription.trim();
        
        // Optimistic update in the store
        this.$store.dispatch('updateWordlistDescription', {
          name: this.selectedWordlist,
          description: descriptionToSave,
        });

        // Close modal
        this.closeEditDescriptionModal();

        // Send to backend
        fetch("/api/update_wordlist_description", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            name: this.selectedWordlist, 
            description: descriptionToSave 
          })
        })
        .then(response => {
          if (!response.ok) {
            console.error('Error updating description on backend');
            // Revert optimistic update or show error message
            // For simplicity, we might just refetch data
            this.$store.dispatch('fetchUserData'); 
          }
        })
        .catch((error) => {
          console.error('Error saving wordlist description:', error);
          // Revert or show error
          this.$store.dispatch('fetchUserData');
        });
      },

      // --- PRACTICE SHEET CHAR FILTERING ---
      getPracticeSheetUniqueChars() {
        // Return all unique characters in the current word list
        const uniqueChars = new Set();
        this.words.forEach(word => {
          [...word.character].forEach(char => uniqueChars.add(char));
        });
        return Array.from(uniqueChars);
      },
      togglePracticeSheetChar(char) {
        if (this.practiceSheetExcludedChars.has(char)) {
          this.practiceSheetExcludedChars.delete(char);
        } else {
          this.practiceSheetExcludedChars.add(char);
        }
        // Force reactivity
        this.practiceSheetExcludedChars = new Set(this.practiceSheetExcludedChars);
      },
      resetPracticeSheetExcludedChars() {
        this.practiceSheetExcludedChars = new Set();
      },

      async createPracticeSheet() {
        // Gather all unique characters from the wordlist, minus excluded
        const uniqueChars = new Set();
        this.words.forEach(word => {
          [...word.character].forEach(char => {
            if (!this.practiceSheetExcludedChars.has(char)) uniqueChars.add(char);
          });
        });
        const charList = Array.from(uniqueChars).join('');
        // --- Date in Chinese ---
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        // e.g. 2025年5月22日
        const dateStr = `${year}年${month}月${day}日`;
        const dateCharSet = new Set([...dateStr]);
        // Remove any ASCII digits, keep only Chinese chars and 年月日
        const dateChars = Array.from(dateCharSet).filter(c => /[\u4e00-\u9fa5年月日0-9]/.test(c)).join('');
        try {
          // Fetch main strokes
          const response = await fetch(`/api/getStrokes/${charList}`);
          if (!response.ok) {
            console.error('Network response was not ok for characters:', charList);
            return;
          }
          const strokesData = await response.json();
          // Fetch date strokes
          const dateResponse = await fetch(`/api/getStrokes/${dateChars}`);
          let dateStrokesData = null;
          if (dateResponse.ok) {
            dateStrokesData = await dateResponse.json();
          }
          // No need to filter words here, let the SVG generator handle exclusion
          const { svg, totalPages } = generatePracticeSheetSVG(this.words, strokesData, {
            selectedPracticeOption: this.selectedPracticeOption,
            windowHeight: 1123,
            page: 0,
            excludedChars: Array.from(this.practiceSheetExcludedChars),
            dateStr,
            dateStrokesData
          });
          this.practiceSheetSVG = svg;
          this.practiceSheetTotalPages = totalPages;
          this.currentPracticeSheetPage = 0;
          this.practiceSheetStrokesData = strokesData; // Save for PDF export
          this.practiceSheetDateStr = dateStr;
          this.practiceSheetDateStrokesData = dateStrokesData;
          this.showPracticeSheetSVG = true;
        } catch (err) {
          console.error('Error fetching strokes:', err);
        }
      },
      // Add a method to change the preview page
      updatePracticeSheetPage(page) {
        if (!this.practiceSheetStrokesData) return;
        const { svg } = generatePracticeSheetSVG(this.words, this.practiceSheetStrokesData, {
          selectedPracticeOption: this.selectedPracticeOption,
          windowHeight: 1123,
          page,
          excludedChars: Array.from(this.practiceSheetExcludedChars),
          dateStr: this.practiceSheetDateStr,
          dateStrokesData: this.practiceSheetDateStrokesData
        });
        this.practiceSheetSVG = svg;
        this.currentPracticeSheetPage = page;
      },

      downloadAnkiDeck() {
        if (!this.selectedWordlist || this.words.length === 0) {
          alert('This wordlist is empty. Please add words before downloading an Anki deck.');
          return;
        }
        
        // Create a temporary link to download the file
        const downloadLink = document.createElement('a');
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        
        // Send request with proper JSON Content-Type
        fetch('/api/get_anki_wordlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: this.selectedWordlist
          })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Error downloading Anki deck');
          }
          return response.blob();
        })
        .then(blob => {
          // Create a URL for the blob
          const url = window.URL.createObjectURL(blob);
          
          // Set up the download link
          downloadLink.href = url;
          downloadLink.download = `${this.selectedWordlist}_anki_deck.apkg`;
          
          // Trigger the download
          downloadLink.click();
          
          // Clean up
          window.URL.revokeObjectURL(url);
          document.body.removeChild(downloadLink);
          
        })
        .catch(error => {
          console.error('Error downloading Anki deck:', error);
          alert('Failed to download Anki deck. Please try again.');
        });
      },

      // New method for adding words
      addWordToList() {
        if (!this.selectedWordlist || !this.newWordInput.trim()) return;

        // Split by spaces, commas, and/or semicolons
        const wordsToAdd = this.newWordInput
          .split(/[\s,， ;]+/) // Split by one or more spaces, commas, or semicolons
          .map(word => word.trim())
          .filter(Boolean); // Remove empty strings
        
        if (wordsToAdd.length === 0) return;
        
        this.newWordInput = '';

        // Send to backend with the new API endpoint
        fetch('/api/add_word_learning_with_data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            words: wordsToAdd,
            set_name: this.selectedWordlist,
          }),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to add words');
          }
          return response.json();
        })
        .then(data => {
          console.log('Words added successfully:', data);
          
          // Update store in the exact typed order
          if (data.chars_info) {
            wordsToAdd
              .filter(ch => !!data.chars_info[ch])
              .forEach(character => {
                const info = data.chars_info[character] || {};
                this.$store.dispatch('addWordToCustomDeck', {
                  word: character,
                  setName: this.selectedWordlist,
                  wordData: {
                    pinyin: info.pinyin || [''],
                    english: info.english || [''],
                    character: character
                  }
                });
              });
          }
          
          // Refresh the display
          this.loadWordlistWords();
        })
        .catch(error => {
          console.error('Error adding words to wordlist:', error);
          // Refresh the word list in case of error
          this.loadWordlistWords();
        });
      },

      // New method for custom dropdown
      selectWordlist(name) {
        this.selectedWordlist = name;
        this.isDropdownOpen = false;
        this.loadWordlistWords();
      },
      
      // Method to handle clicks outside the dropdown
      handleOutsideClick(event) {
        if (!event.target.closest('.custom-dropdown')) {
          this.isDropdownOpen = false;
        }
      },

      // New method to copy wordlist to clipboard
      copyWordlistToClipboard() {
        if (!this.words || this.words.length === 0) return;
        const wordString = this.words.map(w => w.character).join(";");
        navigator.clipboard.writeText(wordString)
          .then(() => {
            alert('Wordlist copied to clipboard!');
          })
          .catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy wordlist.');
          });
      },

      downloadPracticeSheetSVG() {
        // Download the SVG as a file
        const blob = new Blob([this.practiceSheetSVG], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.selectedWordlist}_practice_sheet.svg`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      },

      async downloadPracticeSheetPDF() {
        if (!this.practiceSheetStrokesData) {
          alert('Strokes data not loaded. Please generate the practice sheet first.');
          return;
        }
        // Pass excludedChars for PDF export
        const blob = await generatePracticeSheetPDF(this.words, this.practiceSheetStrokesData, {
          selectedPracticeOption: this.selectedPracticeOption,
          windowHeight: window.innerHeight * .8,
          noAccents: true,
          excludedChars: Array.from(this.practiceSheetExcludedChars)
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.selectedWordlist}_practice_sheet.pdf`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      },
    },
  };
  </script>
  
  <style scoped>
* {
  font-family: var(--font-family) !important;
}

  .myspace-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    background: var(--bg);
    min-height: 100vh;
  }
  
  .wordlist-container {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    background: var(--bg-alt);
    box-shadow: 0 4px 12px color-mix(in oklab, var(--fg) 20%, var(--bg) 50%);
    box-shadow: var(--card-shadow);
    border: var(--thin-border-width) solid var(--fg);
    padding: 2rem;
    box-sizing: border-box;
  }

  
  /* Responsive styling for mobile */
  @media (max-width: 768px) {
    .myspace-view {
      padding: 0;
    }
    
    .wordlist-container {
      max-width: 100%;
      box-shadow: none;
      background: var(--bg);
      border: none;
      padding: 1rem;
    }
  }
  
  .wordlist-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
.wordlist-label{
  flex: 1;
}


  .wordlist-selector {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    gap: 0.5rem;
  }

  /* Custom dropdown styles to match FlashcardsView */
  .custom-dropdown {
    position: relative;
    width: 100%;
    user-select: none;
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }

  #selected-deck {
    padding: 10px 15px;
    background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
    color: var(--fg);
    cursor: pointer;
    font-weight: bold;
    text-align: center;
    min-width: 200px;
    width: 100%;
  }

  #selected-deck:hover {
    background-color: color-mix(in oklab, var(--fg) 8%, var(--bg) 75%);
  }

  #deck-options {
    position: absolute;
    top: 100%;
    width: 100%;
    max-width: 300px;
    max-height: 0;
    overflow: hidden;
    background-color: var(--bg);
    border: var(--thin-border-width) solid #0000;
    margin-top: 5px;
    z-index: 10;
    /* transition: max-height 0.3s, border 0.3s; */
  }

  #deck-options.show {
    max-height: 300px;
    overflow-y: auto;
    border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 26%, var(--bg) 25%);
  }


  .option {
    padding: 10px 15px;
    cursor: pointer;
    white-space: nowrap;
  }

  .option:hover {
    background-color: color-mix(in oklab, var(--fg) 6%, var(--bg) 75%);
  }

  .option.selected {
    background-color: var(--selected-bg);
  }

  select {
    padding: 0.5rem 0.75rem;
    border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 50%);
    background: var(--bg);
    color: var(--fg);
    box-sizing: border-box;
    font-family: inherit;
    /* border-radius: 6px; */
    cursor: pointer;
    width: 100%; /* Ensure select uses full width of container */
    -webkit-appearance: none; /* Remove default styling on iOS */
    -moz-appearance: none;
    appearance: none;
  }
  
  /* Additional responsive adjustments */
  @media (max-width: 768px) {
    .wordlist-header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .wordlist-selector {
      width: 100%;
    }
    
    #wordlist-select {
      width: 100%;
    }
    
    select {
      border-radius: 0; /* Ensure no rounding on mobile */
    }
    
    .wordlist-management {
      flex-direction: column;
    }
    
    .wordlist-actions {
      width: 100%;
    }
    
    .action-button {
      flex: 1;
    }
  }
  
  select:hover,
  select:focus {
    outline: none;
  }
  
  .loading,
  .empty-list {
    text-align: center;
    padding: 2rem;
    color: var(--fg);
    opacity: 0.7;
    font-style: italic;
  }
  
  .wordlist-info {
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
    color: var(--fg);
    line-height: 1.4;
    position: relative; /* Needed for absolute positioning of edit button */
  }
  
  .wordlist-info p {
    margin: 0.3rem 0;
  }

  .description-section {
    position: relative;
    padding-right: 30px; /* Space for the edit button */
    margin-bottom: 0.5rem;
  }

  .description-text {
    white-space: pre-wrap; /* Preserve line breaks */
    word-break: break-word;
    color: var(--fg);
    opacity: 0.85;
    margin-top: 0.2rem;
  }

  .edit-description-button {
    /* position: absolute;
    top: 0;
    right: 0; */
    background: none;
    border: none;
    color: var(--fg);
    opacity: 0.5;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0.2rem;
  }

  .edit-description-button:hover {
    opacity: 1;
  }
  
  .nav-buttons {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap; /* Allow wrapping on small screens */
    gap: 0.75rem 1rem; /* row-gap col-gap */
    margin-bottom: 1.5rem;
    width: 100%;
    box-sizing: border-box;
  }

  @media screen and (max-width: 768px) {
    .nav-buttons {
      justify-content: left;
    }
  }
  
  .nav-button {
    background: var(--bg);
    color: color-mix(in oklab, var(--fg) 100%, var(--bg) 50%);
    padding: 0.5rem 1.2rem;
    /* border-radius: 8px; */
    text-decoration: none;
    user-select: none;
    box-shadow: 0 2px 6px color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  }

  
  .data-button {
    outline: none;
    border: none;
    cursor: pointer;
  }
  
  .router-button {
    font-size: .85em;
  }
  
  .word-list {
    display: flex;
    flex-direction: column;
    gap: .5rem;
    overflow-y: auto;
  }
  
  .word-item {
    border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 22%, var(--bg) 12%);
    background: var(--bg);
    align-items: stretch;
    width: 100%;
    box-sizing: border-box;
    padding: .3rem;
  }

  
  .word-item:hover {
    background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  }
  
  .word-cell {
    width: 100%;
    display: flex;
    /* padding: .3rem; */
    cursor: pointer;
    user-select: none;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    position: relative;
  }
  
  .hanzipinyin {
    display: flex;
    flex-direction: column;
    width: 110px;
    min-width: 110px;
    margin-right: 1rem;
    user-select: text;
  }
  
  .word-hanzi {
    font-size: 1.7rem;
    font-family: Kaiti, serif;
    user-select: text;
  }
  
  .word-pinyin {
    font-size: .8em;
    font-style: italic;
    color: var(--fg);
    opacity: 0.6;
    user-select: text;
  }
  
  .word-english {
    font-size: .8em;
    flex: 1;
    display: flex;
    align-items: center;
    font-weight: 500;
    user-select: text;
  }
  
  .remove-button {
    background: transparent;
    border: none;
    color: var(--fg);
    /* flex: 1; */
    opacity: 0.35;
    padding: 0 1rem;
    font-size: 1rem;
    cursor: pointer;
    /* display: flex; */
    /* margin-left: auto; */
    /* align-items: center; */
    /* justify-content: center; */
    /* transition: opacity 0.2s, background-color 0.2s; */
    /* position: absolute; */
    right: 0;
    top: 0;
    bottom: 0;
    height: auto;
    box-sizing: border-box;
  }
  
  .remove-button:hover {
    opacity: 1;
    /* background-color: color-mix(in oklab, var(--fg) 15%, var(--bg) 50%); */
  }

  /* New styles for wordlist management */
  .wordlist-management {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }
  
  .wordlist-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-button {
    padding: 0.5rem 1rem;
    border: none;
    background: var(--bg);
    color: var(--fg);
    cursor: pointer;
    font-family: inherit;
    box-shadow: 0 2px 4px color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  }


  .create-button {
    background: color-mix(in oklab, var(--fg) 10%, var(--bg) 50%);
    color: var(--fg);
  }
  
  /* New styles for add word section */
  .add-word-section {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .add-word-input {
    flex: 1;
    padding: 0.5rem;
    border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 50%);
    background: var(--bg);
    color: var(--fg);
    font-family: inherit;
  }

  .add-word-button {
    padding: 0.5rem 1rem;
    border: none;
    background: var(--bg);
    color: var(--fg);
    cursor: pointer;
    font-family: inherit;
    box-shadow: 0 2px 4px color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  }

  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: color-mix(in oklab, var(--bg) 10%, var(--bg) 80%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 12;
  }
  
  .modal-content {
    background: var(--bg-alt);
    padding: 2rem;
    width: 90%;
    max-width: 600px;
  }
  
  .modal-form {
    margin: 1.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .modal-form input {
    padding: 1em;
	  border: var(--thin-border-width) solid var(--fg);
    background: var(--bg);
    color: var(--fg);
    font-family: inherit;
  }

  .modal-form {
    padding: 1em 2em;
	  /* border: var(--thin-border-width) solid var(--fg); */
    /* background: var(--bg); */
    color: var(--fg);
    font-family: inherit;
    resize: vertical; /* Allow vertical resizing */
    min-height: 80px;
  }
  
  
.svg-modal-form {
	  /* border: 2px dashed var(--fg); */
    background: var(--bg);
    color: var(--fg);
    border-radius: 0;
    font-family: inherit;
    resize: vertical; /* Allow vertical resizing */
    /* background: #0f0; */
    padding: 2em 2em;
}
  
[data-theme="theme2"] .svg-modal-form {
    border-radius: 1em !important;
}

  .modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .svg-modal-buttons {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .cancel-button, 
  .confirm-button {
    padding: 0.5rem 1rem;
    border: none;
    cursor: pointer;
  }
  
  .cancel-button {
    background: var(--bg);
    color: var(--fg);
  }
  
  .confirm-button {
    background: var(--bg);
    color: var(--fg);
  }

  .modal-message {
    margin: 1.5rem 0;
    color: var(--fg);
    line-height: 1.5;
  }

  .modal-message p {
      margin-bottom: .5rem;
  }

  .delete-confirm-button {
    background: var(--danger-color, #dc3545);
    color: var(--fg);
  }
  .delete-confirm-button:hover {
    background: color-mix(in oklab, var(--danger-color, #dc3545) 80%, black 20%);
  }

    .modal-content-svg{

      align-items: center;

      /* background: #0f0; */
      justify-content: center;

      box-sizing: border-box;
    }

   .modal-svg-preview {
      background-color: var(--bg-dim);
      padding: 1rem;
      /* background: #f00; */
      height: 70vh;
      aspect-ratio: 1/1.414;
  }


  .modal-svg-preview svg {
    width: 100%;
    height: auto;
    max-height: 90vh;
    height: 90vh;
    display: block;
    margin: 0 auto;
  }

  .practice-char-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding-top: 1em;
}
.practice-char {
  display: inline-block;
  font-size: 1.5rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 80%);
  color: var(--fg);
  cursor: pointer;
  /* transition: opacity 0.2s, background 0.2s; */
  user-select: none;
  border: 1px solid color-mix(in oklab, var(--fg) 10%, var(--bg) 80%);
}
.practice-char.excluded {
  opacity: 0.35;
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 90%);
  text-decoration: line-through;
}
.reset-excluded-button {
  margin-top: 0.5rem;
  background: var(--bg);
  color: var(--fg);
  border: 1px solid color-mix(in oklab, var(--fg) 20%, var(--bg) 50%);
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
}
.reset-excluded-button:hover {
  background: color-mix(in oklab, var(--fg) 8%, var(--bg) 80%);
  }

  .practice-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .practice-option {
    padding: 0.5rem 1rem;
    border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 50%);
    background: var(--bg);
    color: var(--fg);
    cursor: pointer;
    user-select: none;
    text-align: left;
  }

  .practice-option:hover {
    background: color-mix(in oklab, var(--fg) 8%, var(--bg) 75%);
  }

  .practice-option.selected {
    background: color-mix(in oklab, var(--fg) 12%, var(--bg) 70%);
    font-weight: bold;
  }

  .practice-option.faded {
    opacity: 0.6;
  }
  </style>
