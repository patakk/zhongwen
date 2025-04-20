import { createStore } from 'vuex'

const USER_STORAGE_KEY = 'userData';

const store = createStore({
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
      state.profile     = payload.profile     || {}
      state.customDecks = payload.customDecks || []
      state.customDictionaryData = payload.customDictionaryData || []
      state.image       = payload.image       || ''
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
        created: new Date().toISOString(),
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
  },
  getters: {
    getCustomDictionaryData: (state) => state.customDictionaryData,
    getDictionaryData: (state) => state.dictionaryData,
    getAuthStatus:     (state) => state.authStatus,
    getUsername:       (state) => state.username,
    getProfile:        (state) => state.profile,
    getCustomDecks:    (state) => state.customDecks,
    getImage:          (state) => state.image,
    isLoggedIn:        (state) => !!state.authStatus && !!state.username
  }
})

export default store
