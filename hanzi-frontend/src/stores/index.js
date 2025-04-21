import { createStore } from 'vuex'
import router from '../router';

// Create a sub-module for card modal state
const cardModalModule = {
  namespaced: true, // Ensure this is set to true to properly namespace the module
  state: {
    visible: false,
    loading: false,
    characterData: null,
    decompositionData: null,
    currentCharacter: null,
    preloadedData: {} // Add cache for preloaded data
  },
  mutations: {
    SHOW_CARD_MODAL(state, character) {
      state.visible = true;
      state.currentCharacter = character;
      state.loading = true;
    },
    HIDE_CARD_MODAL(state) {
      state.visible = false;
      state.currentCharacter = null;
    },
    SET_CARD_DATA(state, data) {
      state.characterData = data;
      state.loading = false;
    },
    SET_DECOMPOSITION_DATA(state, data) {
      state.decompositionData = data;
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    SET_PRELOADED_DATA(state, { character, data }) {
      state.preloadedData[character] = data;
    }
  },
  actions: {
    async showCardModal({ commit, dispatch, state }, character) {
      // Prevent redundant fetches if the modal is already showing this character
      if (state.visible && state.currentCharacter === character) {
        console.log('Modal already showing this character, skipping:', character);
        return;
      }
      
      commit('SHOW_CARD_MODAL', character);
      
      // Update URL with the word parameter
      router.replace({ 
        query: { 
          ...router.currentRoute.value.query, 
          word: character 
        }
      }).catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          console.error(err);
        }
      });
      
      // Check if we already have preloaded data
      if (state.preloadedData[character]) {
        console.log('Using preloaded data for:', character);
        commit('SET_CARD_DATA', state.preloadedData[character]);
        
        // Always trigger decomposition data fetch
        dispatch('fetchDecompositionDataOnly', character);
      } else {
        // If no preloaded data, fetch it normally
        await dispatch('fetchCardData', character);
      }
    },
    hideCardModal({ commit }) {
      commit('HIDE_CARD_MODAL');
      
      // Remove word parameter from URL
      const query = { ...router.currentRoute.value.query };
      delete query.word;
      
      router.replace({ query }).catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          console.error(err);
        }
      });
    },
    async fetchCardData({ commit, state, dispatch }, character) {
      commit('SET_LOADING', true);
      
      try {
        const response = await fetch(`/api/get_card_data?character=${character}`);
        const data = await response.json();
        
        if (data) {
          // First set the card data so the modal shows immediately
          commit('SET_CARD_DATA', data);
          
          // ALWAYS fetch decomposition data right after card data
          dispatch('fetchDecompositionDataOnly', character);
        }
      } catch (error) {
        console.error('Error fetching card data:', error);
        commit('SET_LOADING', false);
      }
    },
    async fetchDecompositionDataOnly({ commit, state }, character) {
      // Get only Han characters
      const hanCharacters = character.split('').filter(char => /\p{Script=Han}/u.test(char));
      
      if (hanCharacters.length === 0) {
        return;
      }
      
      // Don't refetch if we already have this character's decomposition data
      // and it's non-empty (i.e., this character has components)
      if (state.decompositionData) {
        const allCharsHaveData = hanCharacters.every(char => 
          state.decompositionData[char] && Object.keys(state.decompositionData[char]).length > 0
        );
        
        if (allCharsHaveData) {
          console.log('Using cached decomposition data for:', character);
          return;
        }
      }
      
      console.log('fetchDecompositionDataOnly called for:', character);
      
      try {
        // Send a single request for all Han characters in the word
        const url = '/api/get_char_decomp_info';
        const payload = { characters: hanCharacters }; // Send all characters at once
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        };

        console.log('Fetching decomposition data for characters:', hanCharacters.join(''));
        const response = await fetch(url, options);
        const data = await response.json();
        
        // Only update the store if we actually got data
        if (Object.keys(data).length > 0) {
          commit('SET_DECOMPOSITION_DATA', data);
        }
      } catch (error) {
        console.error('Error fetching decomposition data:', error);
      }
    },
    async preloadCardData({ commit, state, dispatch }, character) {
      // Don't preload if we already have the data
      if (state.preloadedData[character]) {
        return;
      }
      
      try {
        const response = await fetch(`/api/get_card_data?character=${character}`);
        const data = await response.json();
        
        if (data) {
          // Store in preloaded data cache
          commit('SET_PRELOADED_DATA', { character, data });
          
          // Don't preload decomposition data - we'll fetch it when needed
          // This helps prevent duplicate fetches
        }
      } catch (error) {
        console.error('Error preloading card data:', error);
      }
    },
    checkForWordParameter({ dispatch, state }) {
      // Get the current word parameter from the URL
      const word = router.currentRoute.value.query.word;
      
      // Only proceed if we have a word parameter and the modal is not already visible
      if (word && !state.visible) {
        console.log('Found word parameter in URL:', word);
        
        // Directly show the card modal with the word from URL
        dispatch('showCardModal', word);
      }
    }
  },
  getters: {
    isCardModalVisible: state => state.visible,
    isCardModalLoading: state => state.loading,
    getCardData: state => state.characterData,
    getDecompositionData: state => state.decompositionData,
    getCurrentCharacter: state => state.currentCharacter,
    getPreloadedData: state => character => state.preloadedData[character]
  }
};

const USER_STORAGE_KEY = 'userData';

const store = createStore({
  modules: {
    cardModal: cardModalModule
  },
  state: {
    staticDictionaryData: null,
    customDictionaryData: null,
    dictionaryData: null,
    authStatus: false,
    username: '',
    profile: {},
    customDecks: [],
    image: '',
  },
  mutations: {
    setDictionaryData(state, data) {
      state.dictionaryData = data;
      state.staticDictionaryData = data;
    },
    combineDictionaryData(state, data) {
      state.customDictionaryData = data;
      if (state.dictionaryData) {
        state.dictionaryData = { ...state.dictionaryData, ...state.customDictionaryData }
      } else {
        state.dictionaryData = data
      }
    },
    setUserData(state, payload) {
      state.authStatus  = Boolean(payload.authStatus)
      state.username    = payload.username    || ''
      // Create a profile object that includes google_id and profile_pic
      state.profile     = {
        ...(payload.profile || {}),
        google_id: payload.google_id || null,
        profile_pic: payload.profile_pic || null
      }
      state.customDecks = payload.custom_deck_names || []
      state.image       = payload.profile_pic || payload.image || ''
    },
    clearUserData(state) {
      state.authStatus  = false
      state.username    = ''
      state.profile     = {}
      state.customDecks = []
      state.customDictionaryData = null
      state.image       = ''
      state.dictionaryData = state.staticDictionaryData
    },
    addCustomDeck(state, deck) {
      state.customDecks.push(deck);
    },
    removeCustomDeck(state, deckName) {
      state.customDecks = state.customDecks.filter(deck => deck.name !== deckName);
      
      if (state.customDictionaryData) {
        // Create a new object without the removed wordlist
        const updated = { ...state.customDictionaryData };
        delete updated[deckName];
        
        state.customDictionaryData = updated;
        
        // Update the combined dictionary data
        if (state.dictionaryData) {
          state.dictionaryData = { ...state.staticDictionaryData, ...state.customDictionaryData };
        }
      }
    },
    renameCustomDeck(state, { oldName, newName }) {
      // Rename in customDecks array
      const deckIndex = state.customDecks.findIndex(deck => deck.name === oldName);
      if (deckIndex !== -1) {
        state.customDecks[deckIndex] = { ...state.customDecks[deckIndex], name: newName };
      }
      
      // Rename in customDictionaryData
      if (state.customDictionaryData && state.customDictionaryData[oldName]) {
        // Create a new object with the renamed key
        const updated = { ...state.customDictionaryData };
        updated[newName] = { ...updated[oldName] };
        delete updated[oldName];
        
        state.customDictionaryData = updated;
        
        // Update the combined dictionary data
        if (state.dictionaryData) {
          state.dictionaryData = { ...state.staticDictionaryData, ...state.customDictionaryData };
        }
      }
    },
    updateDictionaryData(state) {
      if (state.customDictionaryData && state.staticDictionaryData) {
        // Create a fresh copy of the combined data
        state.dictionaryData = { 
          ...JSON.parse(JSON.stringify(state.staticDictionaryData)), 
          ...JSON.parse(JSON.stringify(state.customDictionaryData)) 
        };
      }
    },
    UPDATE_WORDLIST_DESCRIPTION(state, { name, description }) {
      const deck = state.customDecks.find(deck => deck.name === name);
      if (deck) {
        deck.description = description;
      }
    },
  },
  actions: {
    async fetchDictionaryData({ commit }) {
      try {
        const response = await fetch('/api/get_static_cc')
        const data = await response.json()
        commit('setDictionaryData', data)
      } catch (error) {
        console.error("Error fetching dictionary data:", error)
      }
    },
    async fetchCustomDictionaryData({ commit }) {
      try {
        const response = await fetch('/api/get_custom_cc', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        const data = await response.json()
        commit('combineDictionaryData', data)
      } catch (error) {
        console.error("Error fetching dictionary data:", error)
      }
    },
    async fetchUserData({ commit, dispatch }) {
      try {
        const response = await fetch('/api/get_user_data')
        const userData = await response.json()
        console.log("Fetched user data:", userData)
        commit('setUserData', userData)
        dispatch('saveUserDataToStorage')
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    },
    removeWordFromCustomDeck({ state, commit }, { character, selectedWordlist }) {
      if (state.customDictionaryData && state.customDictionaryData[selectedWordlist]) {
        // Create a new object without the removed character
        const updatedChars = { ...state.customDictionaryData[selectedWordlist].chars };
        delete updatedChars[character];
        
        // Update the customDictionaryData
        const updatedDeck = {
          ...state.customDictionaryData[selectedWordlist],
          chars: updatedChars
        };
        
        // Update state
        state.customDictionaryData = {
          ...state.customDictionaryData,
          [selectedWordlist]: updatedDeck
        };
        
        // Update the combined dictionary data
        if (state.dictionaryData) {
          state.dictionaryData = { ...state.staticDictionaryData, ...state.customDictionaryData };
        }
      }
    },
    addWordToCustomDeck({ state, dispatch }, { word, setName, wordData }) {
      if (state.customDictionaryData && state.customDictionaryData[setName]) {
        // If wordlist exists, update it with the new word
        const updatedChars = { 
          ...state.customDictionaryData[setName].chars,
          [word]: wordData
        };
        
        // Update the customDictionaryData
        const updatedDeck = {
          ...state.customDictionaryData[setName],
          chars: updatedChars
        };
        
        // Update state
        state.customDictionaryData = {
          ...state.customDictionaryData,
          [setName]: updatedDeck
        };
        
        // Update the combined dictionary data
        if (state.dictionaryData) {
          state.dictionaryData = { ...state.staticDictionaryData, ...state.customDictionaryData };
        }
      } else {
        // If the wordlist doesn't exist in our local state, refresh the data
        dispatch('fetchCustomDictionaryData');
      }
    },
    loadUserDataFromStorage({ commit }) {
      const stored = localStorage.getItem(USER_STORAGE_KEY)
      if (stored) {
        try { commit('setUserData', JSON.parse(stored)) }
        catch { localStorage.removeItem(USER_STORAGE_KEY) }
      }
    },
    saveUserDataToStorage({ state }) {
      const toStore = {
        authStatus:  state.authStatus,
        username:    state.username,
        profile:     state.profile,
        customDecks: state.customDecks,
        image:       state.image
      }
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(toStore))
    },
    logout({ commit }) {
      commit('clearUserData')
      localStorage.removeItem(USER_STORAGE_KEY)
    },
    createWordlist({ commit, state }, { name }) {
      // Create empty deck structure
      const newDeck = {
        name,
        description: `Custom wordlist: ${name}`,
      };
      
      // Add to customDecks
      commit('addCustomDeck', newDeck);
      
      // Add to customDictionaryData
      if (state.customDictionaryData) {
        const newDictionaryEntry = {
          name,
          description: `Custom wordlist: ${name}`,
          chars: {}
        };
        
        // Update the customDictionaryData
        state.customDictionaryData = {
          ...state.customDictionaryData,
          [name]: newDictionaryEntry
        };
        
        // Force update to the combined dictionary data
        commit('updateDictionaryData');
      }
      
      // Update local storage
      this.dispatch('saveUserDataToStorage');
    },
    renameWordlist({ commit, state }, { oldName, newName }) {
      commit('renameCustomDeck', { oldName, newName });
      
      // Force update to ensure reactivity
      commit('updateDictionaryData');
      
      // Update local storage
      this.dispatch('saveUserDataToStorage');
    },
    removeWordlist({ commit, state }, { name }) {
      commit('removeCustomDeck', name);
      
      // Force update to ensure reactivity
      commit('updateDictionaryData');
      
      // Update local storage
      this.dispatch('saveUserDataToStorage');
    },
    updateWordlistDescription({ commit }, payload) {
      commit('UPDATE_WORDLIST_DESCRIPTION', payload);
    },
  },
  getters: {
    getCustomDictionaryData: (state) => state.customDictionaryData,
    getDictionaryData: (state) => state.dictionaryData,
    getAuthStatus:     (state) => state.authStatus,
    getUsername:       (state) => state.username,
    getProfile:        (state) => state.profile,
    getCustomDecks:    (state) => state.customDecks,
    getImage:          (state) => state.image || state.profile?.profile_pic || '',
    isLoggedIn:        (state) => !!state.authStatus && !!state.username
  }
})

export default store
