<template>
  <div class="deck-selector" ref="dropdownRef">
    <!-- Trigger button (only in select mode) -->
    <div
      v-if="mode === 'select'"
      class="selected-deck"
      @click="toggleDropdown"
      :class="{ 'open': isOpen }"
    >
      {{ displayValue || placeholder }}
    </div>

    <!-- Dropdown options -->
    <div
      class="deck-options"
      :class="{ 'show': isOpenState, 'action-mode': mode === 'action' }"
      v-if="isOpenState"
    >
      <!-- Not logged in state (action mode only) -->
      <div v-if="mode === 'action' && !isLoggedIn" class="no-lists">
        Adding to custom wordlists is possible only upon
        <router-link to="/register" class="register-link">registration</router-link> or
        <router-link to="/login" class="register-link">login</router-link>.
      </div>

      <!-- No decks state -->
      <div v-else-if="normalizedDecks.length === 0" class="no-lists">
        {{ mode === 'action' ? 'No custom wordlists available' : 'No decks available' }}
      </div>

      <!-- Decks list with search -->
      <template v-else>
        <!-- Search input for desktop (show if not mobile and enough items) -->
        <div v-if="!isMobile && normalizedDecks.length > searchThreshold" class="search-container">
          <input
            ref="searchInput"
            type="text"
            v-model="searchQuery"
            class="search-input"
            placeholder="Type to filter..."
            @keydown.down.prevent="navigateDown"
            @keydown.up.prevent="navigateUp"
            @keydown.enter.prevent="selectHighlighted"
            @keydown.esc="closeDropdown"
          />
        </div>
        <div class="options-list" ref="optionsList">
          <div
            v-for="(deck, index) in filteredDecks"
            :key="deck.key"
            class="option"
            :class="{
              'selected': mode === 'select' && modelValue === deck.key,
              'highlighted': highlightedIndex === index
            }"
            @click.stop="selectDeck(deck)"
            @mouseenter="highlightedIndex = index"
          >
            {{ deck.name }}
          </div>
          <div v-if="filteredDecks.length === 0 && searchQuery" class="no-results">
            No matching {{ mode === 'action' ? 'lists' : 'decks' }}
          </div>
          <!-- Create new list option (action mode only) -->
          <div
            v-if="showCreateNew"
            class="option create-list-item"
            :class="{ 'highlighted': highlightedIndex === filteredDecks.length }"
            @click.stop="$emit('create-new')"
            @mouseenter="highlightedIndex = filteredDecks.length"
          >
            <span class="create-icon">+</span> Create New List
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeckSelector',
  props: {
    // For select mode: v-model binding
    modelValue: {
      type: String,
      default: ''
    },
    // Can be either an array [{name: 'foo'}, ...] or an object {key1: {name: 'foo'}, ...}
    decks: {
      type: [Array, Object],
      default: () => []
    },
    placeholder: {
      type: String,
      default: 'Select a wordlist'
    },
    // Mode: 'select' (has trigger, v-model) or 'action' (external trigger, emits select)
    mode: {
      type: String,
      default: 'select',
      validator: (val) => ['select', 'action'].includes(val)
    },
    // For action mode: external control of open state
    isOpen: {
      type: Boolean,
      default: false
    },
    // For action mode: auth state
    isLoggedIn: {
      type: Boolean,
      default: true
    },
    // Whether to show "Create New List" option
    showCreateNew: {
      type: Boolean,
      default: false
    },
    // Number of items before showing search (action mode uses 5, select mode uses 0)
    searchThreshold: {
      type: Number,
      default: 0
    }
  },
  emits: ['update:modelValue', 'change', 'select', 'create-new', 'close'],
  data() {
    return {
      internalIsOpen: false,
      searchQuery: '',
      highlightedIndex: 0,
      isMobile: false
    };
  },
  computed: {
    // Unified open state
    isOpenState() {
      return this.mode === 'select' ? this.internalIsOpen : this.isOpen;
    },
    // Normalize decks to array format with key property
    normalizedDecks() {
      if (Array.isArray(this.decks)) {
        // Array format: [{name: 'foo'}, ...] - use name as key
        return this.decks.map(deck => ({
          key: deck.name,
          name: deck.name,
          ...deck
        }));
      } else if (this.decks && typeof this.decks === 'object') {
        // Object format: {key1: {name: 'foo'}, ...}
        return Object.entries(this.decks).map(([key, deck]) => ({
          key,
          name: deck.name || key,
          ...deck
        }));
      }
      return [];
    },
    filteredDecks() {
      if (!this.searchQuery.trim()) {
        return this.normalizedDecks;
      }
      const query = this.searchQuery.toLowerCase();
      return this.normalizedDecks.filter(deck =>
        deck.name.toLowerCase().includes(query)
      );
    },
    // Display value: find the name for the current key (select mode)
    displayValue() {
      if (!this.modelValue) return '';
      const deck = this.normalizedDecks.find(d => d.key === this.modelValue);
      return deck ? deck.name : this.modelValue;
    },
    // Max index for keyboard navigation (includes "Create New" if shown)
    maxNavigationIndex() {
      return this.showCreateNew ? this.filteredDecks.length : this.filteredDecks.length - 1;
    }
  },
  watch: {
    isOpenState(newVal) {
      if (newVal) {
        this.searchQuery = '';
        this.highlightedIndex = 0;
        // Focus search input on desktop if we have enough items
        if (!this.isMobile && this.normalizedDecks.length > this.searchThreshold) {
          this.$nextTick(() => {
            this.$refs.searchInput?.focus();
          });
        }
        // Add outside click listener
        document.addEventListener('click', this.handleOutsideClick);
      } else {
        document.removeEventListener('click', this.handleOutsideClick);
      }
    },
    filteredDecks() {
      // Reset highlight when results change
      this.highlightedIndex = 0;
    }
  },
  mounted() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile);
    document.removeEventListener('click', this.handleOutsideClick);
  },
  methods: {
    checkMobile() {
      // Check both user agent and screen width
      const ua = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isSmallScreen = window.innerWidth <= 768;
      this.isMobile = isMobileUA || isSmallScreen;
    },
    toggleDropdown() {
      this.internalIsOpen = !this.internalIsOpen;
    },
    closeDropdown() {
      if (this.mode === 'select') {
        this.internalIsOpen = false;
      } else {
        this.$emit('close');
      }
    },
    selectDeck(deck) {
      if (this.mode === 'select') {
        this.$emit('update:modelValue', deck.key);
        this.$emit('change', deck.key);
      } else {
        this.$emit('select', deck.name);
      }
      this.closeDropdown();
    },
    handleOutsideClick(event) {
      if (this.$refs.dropdownRef && !this.$refs.dropdownRef.contains(event.target)) {
        this.closeDropdown();
      }
    },
    navigateDown() {
      if (this.highlightedIndex < this.maxNavigationIndex) {
        this.highlightedIndex++;
        this.scrollToHighlighted();
      }
    },
    navigateUp() {
      if (this.highlightedIndex > 0) {
        this.highlightedIndex--;
        this.scrollToHighlighted();
      }
    },
    selectHighlighted() {
      if (this.showCreateNew && this.highlightedIndex === this.filteredDecks.length) {
        // "Create New List" is selected
        this.$emit('create-new');
        this.closeDropdown();
      } else if (this.filteredDecks.length > 0 && this.highlightedIndex < this.filteredDecks.length) {
        this.selectDeck(this.filteredDecks[this.highlightedIndex]);
      }
    },
    scrollToHighlighted() {
      this.$nextTick(() => {
        const optionsList = this.$refs.optionsList;
        const highlighted = optionsList?.querySelector('.highlighted');
        if (highlighted && optionsList) {
          highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      });
    }
  }
};
</script>

<style scoped>
.deck-selector {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.selected-deck {
  padding: 10px 15px;
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 50%);
  color: var(--fg);
  cursor: pointer;
  font-weight: bold;
  text-align: center;
  min-width: 200px;
  width: 100%;
  box-sizing: border-box;
}

.selected-deck:hover {
  background-color: color-mix(in oklab, var(--fg) 8%, var(--bg) 75%);
}

.deck-options {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  min-width: 200px;
  max-width: 300px;
  max-height: 0;
  overflow: hidden;
  background-color: var(--bg);
  border: var(--thin-border-width) solid transparent;
  margin-top: 5px;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.deck-options.action-mode {
  left: 0;
  transform: none;
  top: 1em;
}

.deck-options.show {
  max-height: min(50vh, 400px);
  overflow: hidden;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 26%, var(--bg) 25%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.search-container {
  padding: 8px;
  border-bottom: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 15%, var(--bg) 50%);
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  padding: 8px 10px;
  border: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 20%, var(--bg) 50%);
  background: var(--bg);
  color: var(--fg);
  font-family: inherit;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: color-mix(in oklab, var(--fg) 40%, var(--bg) 50%);
}

.search-input::placeholder {
  color: color-mix(in oklab, var(--fg) 50%, var(--bg) 50%);
}

.options-list {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.option {
  padding: 10px 15px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.option:hover,
.option.highlighted {
  background-color: color-mix(in oklab, var(--fg) 6%, var(--bg) 75%);
}

.option.selected {
  background-color: var(--selected-bg);
}

.option.highlighted.selected {
  background-color: color-mix(in oklab, var(--selected-bg) 80%, var(--fg) 10%);
}

.no-lists {
  padding: 15px;
  color: var(--fg);
  font-size: 0.9em;
  text-align: center;
}

.no-lists .register-link {
  color: var(--link-color, #007bff);
  text-decoration: underline;
}

.no-results {
  padding: 10px 15px;
  color: color-mix(in oklab, var(--fg) 60%, var(--bg) 40%);
  font-style: italic;
  text-align: center;
}

.create-list-item {
  border-top: var(--thin-border-width) solid color-mix(in oklab, var(--fg) 10%, var(--bg) 50%);
  color: color-mix(in oklab, var(--fg) 80%, var(--bg) 20%);
}

.create-icon {
  font-weight: bold;
  margin-right: 5px;
}
</style>
