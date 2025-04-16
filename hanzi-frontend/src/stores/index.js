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
    }
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
