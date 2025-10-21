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
    preloadedData: {}, // Add cache for preloaded data
    navList: [],
    navIndex: -1
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
    SET_NAV_CONTEXT(state, { list, current }) {
      state.navList = Array.isArray(list) ? list.slice() : [];
      state.navIndex = Array.isArray(list) ? Math.max(0, list.indexOf(current)) : -1;
    },
    CLEAR_NAV_CONTEXT(state) {
      state.navList = [];
      state.navIndex = -1;
    },
    SET_NAV_INDEX(state, index) {
      state.navIndex = index;
    },
    SET_CARD_DATA(state, data) {
      state.characterData = data;
      state.loading = false;
    },
    SET_DECOMPOSITION_DATA(state, data) {
      state.decompositionData = {
        ...(state.decompositionData || {}),
        ...data
      };
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    SET_PRELOADED_DATA(state, { character, data }) {
      state.preloadedData[character] = data;
    }
  },
  actions: {
    setNavContext({ commit }, { list, current }) {
      commit('SET_NAV_CONTEXT', { list, current });
    },
    navigateNext({ state, dispatch, commit }) {
      if (!state.visible || !state.navList || state.navList.length === 0) return;
      const len = state.navList.length;
      const curIdx = state.navIndex >= 0 ? state.navIndex : state.navList.indexOf(state.currentCharacter);
      const nextIdx = (curIdx + 1) % len;
      commit('SET_NAV_INDEX', nextIdx);
      const nextChar = state.navList[nextIdx];
      if (nextChar) dispatch('showCardModal', nextChar);
    },
    navigatePrev({ state, dispatch, commit }) {
      if (!state.visible || !state.navList || state.navList.length === 0) return;
      const len = state.navList.length;
      const curIdx = state.navIndex >= 0 ? state.navIndex : state.navList.indexOf(state.currentCharacter);
      const prevIdx = (curIdx - 1 + len) % len;
      commit('SET_NAV_INDEX', prevIdx);
      const prevChar = state.navList[prevIdx];
      if (prevChar) dispatch('showCardModal', prevChar);
    },
    async showCardModal({ commit, dispatch, state }, character) {
      if (state.visible && state.currentCharacter === character) {
        return;
      }
      // Only update URL with word parameter if we're not on the dedicated word page
      if (!router.currentRoute.value.path.startsWith('/word/')) {
        commit('SHOW_CARD_MODAL', character);
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
      }
      else{

        window.scrollTo({
          top: 0,
          left: 0,
        });

        router.replace({ 
          params: { 
            word: character 
          }
        }).catch(err => {
          if (err.name !== 'NavigationDuplicated') {
            console.error(err);
          }
        });
      }
      
      // Check if we already have preloaded data
      if (state.preloadedData[character]) {
        commit('SET_CARD_DATA', state.preloadedData[character]);
        
        // Extract decomposition data from the card data if available
        if (state.preloadedData[character].chars_breakdown) {
          const decompositionData = {};
          
          // Process each character in the breakdown
          Object.keys(state.preloadedData[character].chars_breakdown).forEach(char => {
            const charData = state.preloadedData[character].chars_breakdown[char];
            
            if (charData.recursive || charData.present_in) {
              decompositionData[char] = {
                recursive: charData.recursive || {},
                present_in: charData.present_in || []
              };
            }
          });
          
          // Only update if we have data
          if (Object.keys(decompositionData).length > 0) {
            commit('SET_DECOMPOSITION_DATA', decompositionData);
          }
        }
      } else {
        // If no preloaded data, fetch it normally
        await dispatch('fetchCardData', character);
      }
    },
    hideCardModal({ commit }) {
      commit('HIDE_CARD_MODAL');
      commit('CLEAR_NAV_CONTEXT');
      
      // Remove word parameter from URL
      const query = { ...router.currentRoute.value.query };
      delete query.word;
      
      router.replace({ query }).catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          console.error(err);
        }
      });
    },
    async fetchCardData({ commit, state }, character) {
      commit('SET_LOADING', true);
      
      try {
        const response = await fetch(`/api/get_card_data?character=${character}`);
        const data = await response.json();
        
        if (data) {
          // Set the card data
          commit('SET_CARD_DATA', data);
          
          // Extract decomposition data from the card data response
          if (data.chars_breakdown) {
            const decompositionData = {};
            
            // Process each character in the breakdown
            Object.keys(data.chars_breakdown).forEach(char => {
              const charData = data.chars_breakdown[char];
              
              if (charData.recursive || charData.present_in) {
                decompositionData[char] = {
                  recursive: charData.recursive || {},
                  present_in: charData.present_in || []
                };
              }
            });
            
            // Only update if we have data
            if (Object.keys(decompositionData).length > 0) {
              commit('SET_DECOMPOSITION_DATA', decompositionData);
            }
          }
          
          // No need to fetch decomposition data separately anymore
        }
      } catch (error) {
        console.error('Error fetching card data:', error);
        commit('SET_LOADING', false);
      }
    },
    async fetchDecompositionDataOnly({ commit, state, dispatch }, character) {
      // Get both Han characters AND CJK strokes
      const validCharacters = character.split('').filter(char => {
        // Include Han script characters
        if (/\p{Script=Han}/u.test(char)) return true;
        
        // Also include CJK strokes like "㇒"
        if (/[\u31C0-\u31EF]/.test(char)) return true;
        
        // Also explicitly include "㇒" in case the above doesn't catch it
        if (char === "㇒") return true;
        
        return false;
      });
      
      if (validCharacters.length === 0) {
        return Promise.resolve(null);
      }
      
      // Don't refetch if we already have this character's decomposition data
      // and it's non-empty (i.e., this character has parts)
      if (state.decompositionData) {
        const allCharsHaveData = validCharacters.every(char => 
          state.decompositionData[char] && 
          (
            (state.decompositionData[char].recursive && Object.keys(state.decompositionData[char].recursive).length > 0) ||
            (state.decompositionData[char].present_in && state.decompositionData[char].present_in.length > 0)
          )
        );
        
        if (allCharsHaveData) {
          return Promise.resolve(state.decompositionData);
        }
      }
      
      return new Promise(async (resolve, reject) => {
        try {
          // Send a single request for all Han characters in the word
          const url = '/api/get_char_decomp_info';
          const payload = { characters: validCharacters }; // Send all characters at once
          const options = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          };

          const response = await fetch(url, options);
          const data = await response.json();
          
          // Only update the store if we actually got data
          if (Object.keys(data).length > 0) {
            commit('SET_DECOMPOSITION_DATA', data);
          }
          
          resolve(data);
        } catch (error) {
          console.error('Error fetching decomposition data:', error);
          reject(error);
        }
      });
    },
    async preloadCardData({ commit, state }, character) {
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
          
          // Extract decomposition data from the card data response
          if (data.chars_breakdown) {
            const decompositionData = {};
            
            // Process each character in the breakdown
            Object.keys(data.chars_breakdown).forEach(char => {
              const charData = data.chars_breakdown[char];
              
              if (charData.recursive || charData.present_in) {
                decompositionData[char] = {
                  recursive: charData.recursive || {},
                  present_in: charData.present_in || []
                };
              }
            });
            
            // Only update if we have data
            if (Object.keys(decompositionData).length > 0) {
              commit('SET_DECOMPOSITION_DATA', decompositionData);
            }
          }
        }
      } catch (error) {
        console.error('Error preloading card data:', error);
      }
    },
    checkForWordParameter({ dispatch, state }) {
      // Get the current word parameter from the URL
      const word = router.currentRoute.value.query.word;
      
      // Get the current route path
      const currentPath = router.currentRoute.value.path;
      
      // Only proceed if we have a word parameter, the modal is not already visible, 
      // AND we're not already on the /word/ route
      if (word && !state.visible && !currentPath.startsWith('/word/')) {
        
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
    getPreloadedData: state => character => state.preloadedData[character],
    getNavList: state => state.navList,
    getNavIndex: state => state.navIndex
  }
};

// Create a module for bubble tooltip state
const bubbleTooltipModule = {
  namespaced: true,
  state: {
    visible: false,
    character: '',
    pinyin: '',
    english: '',
    position: { x: 0, y: 0 },
    fontFamily: 'Noto Sans SC'
  },
  mutations: {
    SHOW_BUBBLE(state, { character, pinyin, english, position, fontFamily }) {
      state.visible = true;
      state.character = character;
      state.pinyin = pinyin;
      state.english = english;
      state.position = position;
      state.fontFamily = fontFamily || 'Noto Sans SC';
    },
    HIDE_BUBBLE(state) {
      state.visible = false;
    }
  },
  actions: {
    showBubble({ commit }, data) {
      commit('SHOW_BUBBLE', data);
    },
    hideBubble({ commit }) {
      commit('HIDE_BUBBLE');
    }
  },
  getters: {
    isBubbleVisible: state => state.visible,
    getBubbleData: state => ({
      character: state.character,
      pinyin: state.pinyin,
      english: state.english,
      position: state.position,
      fontFamily: state.fontFamily
    })
  }
};

// Create a module for theme management
const themeModule = {
  namespaced: true,
  state: {
    currentTheme: 'theme1', // Default theme
  },
  mutations: {
    SET_THEME(state, theme) {
      state.currentTheme = theme;
      // Update DOM and localStorage
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    },
  },
  actions: {
    initTheme({ commit }) {
      // Check localStorage first
      let theme = localStorage.getItem('theme');
      
      // If no theme in localStorage, check system preference
      if (!theme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'theme1';
      }
      
      // Set the theme
      commit('SET_THEME', theme);
    },
    toggleTheme({ commit, state }) {
      // Toggle between pairs: light/dark or theme1/theme2
      let newTheme;
      
      if (state.currentTheme === 'light') {
        newTheme = 'dark';
      } else if (state.currentTheme === 'dark') {
        newTheme = 'light';
      } else if (state.currentTheme === 'theme1') {
        newTheme = 'theme2';
      } else if (state.currentTheme === 'theme2') {
        newTheme = 'theme1';
      }
      
      commit('SET_THEME', newTheme);
    },
    setTheme({ commit }, theme) {
      commit('SET_THEME', theme);
    },
    setThemeSystem({ commit, state }, system) {
      // 'default' = light/dark, 'custom' = theme1/theme2
      let newTheme;
      
      if (system === 'default') {
        // Switch to default light/dark system
        newTheme = ['light', 'dark'].includes(state.currentTheme) ? 
          state.currentTheme : 'light';
      } else {
        // Switch to custom theme1/theme2 system
        newTheme = ['theme1', 'theme2'].includes(state.currentTheme) ?
          state.currentTheme : 'theme1';
      }
      
      commit('SET_THEME', newTheme);
    }
  },
  getters: {
    getCurrentTheme: state => state.currentTheme,
    isDefaultThemeSystem: state => ['light', 'dark'].includes(state.currentTheme),
    getCurrentThemeName: state => {
      switch(state.currentTheme) {
        case 'light': return 'Light Mode';
        case 'dark': return 'Dark Mode';
        case 'theme1': return 'Theme1 (Light)';
        case 'theme2': return 'Theme2 (Dark)';
        default: return state.currentTheme;
      }
    }
  }
};

const USER_STORAGE_KEY = 'userData';

const store = createStore({
  modules: {
    cardModal: cardModalModule,
    bubbleTooltip: bubbleTooltipModule,
    theme: themeModule
  },
  state: {
    staticDictionaryData: null,
    customDictionaryData: null,
    dictionaryData: null,
    authStatus: false,
    username: '',
    profile: {}, // Object holding detailed user profile info
    customDecks: [],
    image: '',
    loading: false, // Add loading state for API requests
    dictionaryPromises: {
      static: null,
      custom: null
    }, // Track loading promises
    practiceCharacterCache: {
      strokeData: {},
      infoData: {}
    }, // Cache for practice characters
    simpleCharInfoCache: {}, // New cache for simple character information
    pendingSimpleCharRequests: null, // Track pending simple character requests
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
    SET_LOADING(state, isLoading) {
      state.loading = isLoading;
    },
    setUserData(state, payload) {
      state.authStatus  = Boolean(payload.authStatus);
      state.username    = payload.username || '';
      state.customDecks = payload.custom_deck_names || [];
      state.image       = payload.profile_pic || payload.image || '';

      // Set complete profile data
      state.profile = {
        google_id: payload.google_id || null,
        profile_pic: payload.profile_pic || null,
        email: payload.email || null,
        email_verified: payload.email_verified || false,
        has_password: payload.has_password || false // Add password status
      };

      // Log the profile state after update for debugging
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
    SET_PRACTICE_CHARACTER_STROKE_DATA(state, { character, data }) {
      state.practiceCharacterCache.strokeData[character] = data;
    },
    SET_PRACTICE_CHARACTER_INFO_DATA(state, { character, data }) {
      state.practiceCharacterCache.infoData[character] = data;
    },
    SET_SIMPLE_CHAR_INFO(state, data) {
      state.simpleCharInfoCache = {
        ...state.simpleCharInfoCache,
        ...data
      };
    }
  },
  actions: {
    async fetchDictionaryData({ commit, state }) {
      // If we already have a promise in progress, return it instead of creating a new one
      if (state.dictionaryPromises.static) {
        return state.dictionaryPromises.static;
      }

      // Create a new promise and store it
      const promise = (async () => {
        try {
          const response = await fetch('/api/get_static_cc')
          const data = await response.json()
          commit('setDictionaryData', data)
          return data;
        } catch (error) {
          console.error("Error fetching dictionary data:", error)
          throw error;
        } finally {
          // Clear the promise reference when done
          state.dictionaryPromises.static = null;
        }
      })();

      // Store the promise in state
      state.dictionaryPromises.static = promise;
      return promise;
    },
    async fetchCustomDictionaryData({ commit, state, dispatch, getters }) {
      // Don't make the request if user is not logged in
      if (!getters.isLoggedIn) {
        return Promise.resolve({});
      }

      // If we already have a promise in progress, return it instead of creating a new one
      if (state.dictionaryPromises.custom) {
        return state.dictionaryPromises.custom;
      }

      // Create a new promise and store it
      const promise = (async () => {
        try {
          const response = await fetch('/api/get_custom_cc', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          })
          
          // Check if response is not OK (e.g., 401)
          if (!response.ok) {
            const data = await response.json();
            
            // If we get 'authStatus: false' from server, the user's account likely no longer exists
            if (data.authStatus === false) {
              console.warn("Server indicates user no longer exists, logging out");
              dispatch('logout');
              return {};
            }
            
            throw new Error(data.error || `Server returned ${response.status}`);
          }
          
          const data = await response.json();
          // Debug: log order of characters per custom list as received
          try {
            Object.keys(data).forEach(wl => {
              const chars = data[wl]?.chars || {};
              console.log('[store] fetched chars order for', wl, Object.keys(chars));
            });
          } catch (e) {}
          for (const key in data) {
            if (!data[key].name) {
              data[key].name = key;
            }
          }
          commit('combineDictionaryData', data);
          return data;
        } catch (error) {
          console.error("Error fetching custom dictionary data:", error);
          
          // If the error message indicates user issues, logout
          if (error.message && (
              error.message.includes("User account no longer exists") ||
              error.message.includes("User data not found") ||
              error.message.includes("Authentication expired")
          )) {
            console.warn("User session no longer valid, logging out");
            dispatch('logout');
          }
          
          return {};
        } finally {
          // Clear the promise reference when done
          state.dictionaryPromises.custom = null;
        }
      })();

      // Store the promise in state
      state.dictionaryPromises.custom = promise;
      return promise;
    },
    async fetchUserData({ commit, state, dispatch }) {
      if (state.loading) return; // Prevent duplicate requests
      
      commit('SET_LOADING', true);
      try {
        // Add a timeout to prevent hanging when backend is down
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/get_user_data', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // Clear timeout if request completes
        
        // If backend returns non-200 status, handle it as an error
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        const userData = await response.json();
        
        // If we got a response but authStatus is false, log the user out
        if (!userData.authStatus) {
          console.warn("Server returned non-authenticated status, logging out");
          dispatch('logout');
          commit('SET_LOADING', false);
          return;
        }
        
        commit('setUserData', userData);
        
        // Save to localStorage for persistence
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      } catch (error) {
        console.error("Error fetching user data:", error);
        
        // If it's a timeout or network error, log out the user
        if (error.name === 'AbortError' || error.name === 'TypeError') {
          console.warn("Backend connectivity issue, logging out user");
          dispatch('logout');
        }
      } finally {
        commit('SET_LOADING', false);
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
        // Ensure profile in storage also reflects the structure used by components
        profile:     state.profile, 
        customDecks: state.customDecks,
        image:       state.image,
        // Add email/verified to top level if needed for direct access from storage?
        // For now, keep them within profile in storage as components access via profile getter
        // email: state.profile.email, 
        // email_verified: state.profile.email_verified
      }
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(toStore))
    },
    logout({ commit }) {
      commit('clearUserData');
      localStorage.removeItem(USER_STORAGE_KEY); // Clear storage on logout
      
      // Additional cleanup to ensure all user data is removed
      sessionStorage.clear(); // Clear any session storage data
      
      // Clear any custom deck data that might be lingering
      commit('combineDictionaryData', {}); 
      
      // Force a refresh of the view to ensure UI reflects logout state
      setTimeout(() => {
        if (router.currentRoute.value.meta.requiresAuth) {
          router.push('/');
        }
      }, 0);
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
    async preloadPracticeCharacterStrokes({ commit, state }, character) {
      // Skip preloading if we already have this character's stroke data cached
      if (state.practiceCharacterCache.strokeData[character]) {
        return state.practiceCharacterCache.strokeData[character];
      }
      
      try {
        // Create promise for the stroke API call
        const response = await fetch(`/api/getStrokes/${character}`);
        if (!response.ok) {
          console.error('Network response was not ok for character:', character);
          return null;
        }
        
        const strokeData = await response.json();
        
        // Store stroke data in cache
        if (strokeData) {
          strokeData.character = character;
          commit('SET_PRACTICE_CHARACTER_STROKE_DATA', { character, data: strokeData });
        }
        
        return strokeData;
      } catch (error) {
        console.error('Error preloading character stroke data:', error);
        return null;
      }
    },
    async fetchSimpleCharInfo({ commit, state }, characters) {
      // Skip if no characters provided
      if (!characters || characters.length === 0) {
        return {};
      }
      
      
      // Filter out characters we already have cached
      const uncachedChars = characters.filter(char => !state.simpleCharInfoCache[char]);
      
      // If all characters are cached, return from cache
      if (uncachedChars.length === 0) {
        return characters.reduce((result, char) => {
          result[char] = state.simpleCharInfoCache[char];
          return result;
        }, {});
      }
      
      
      // If we have a pending request, wait for it to complete
      if (state.pendingSimpleCharRequests) {
        await state.pendingSimpleCharRequests;
      }
      
      // Create new promise and store it
      const promise = (async () => {
        try {
          
          const query = `characters=${uncachedChars.map(c => encodeURIComponent(c)).join(';')}`;
          const response = await fetch(`/api/get_characters_simple_info?${query}`);

          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }

          const data = await response.json();

          
          // Add to cache
          commit('SET_SIMPLE_CHAR_INFO', data);
          
          // Return full requested data (cached + new)
          return characters.reduce((result, char) => {
            result[char] = state.simpleCharInfoCache[char] || data[char] || null;
            return result;
          }, {});
        } catch (error) {
          console.error('Error fetching simple character info:', error);
          return {};
        } finally {
          state.pendingSimpleCharRequests = null;
        }
      })();
      
      // Store the promise
      state.pendingSimpleCharRequests = promise;
      return promise;
    },
  },
  getters: {
    getCustomDictionaryData: (state) => state.customDictionaryData,
    getDictionaryData: (state) => state.dictionaryData,
    getAuthStatus:     (state) => state.authStatus,
    getUsername:       (state) => state.username,
    getProfile:        (state) => state.profile,
    getHasPassword:    (state) => state.profile?.has_password || false, // Add getter for password status
    getGoogleLinked:   (state) => !!state.profile?.google_id, // Add getter for google link status
    getCustomDecks:    (state) => state.customDecks,
    getImage:          (state) => state.image || state.profile?.profile_pic || '',
    getIsLoading:      (state) => state.loading,
    isDictionaryLoading: (state) => !!state.dictionaryPromises.static || !!state.dictionaryPromises.custom,
    getDictionaryPromises: (state) => ({
      static: state.dictionaryPromises.static,
      custom: state.dictionaryPromises.custom
    }),
    isLoggedIn:        (state) => !!state.authStatus && !!state.username,
    getPracticeCharCache: (state) => state.practiceCharacterCache,
    
    // Helper getter to find character data across all dictionaries
    getCharacterData: (state) => (character) => {
      if (!state.dictionaryData) return null;
      
      // Search for the character in all dictionaries
      for (const category in state.dictionaryData) {
        const dict = state.dictionaryData[category];
        if (dict?.chars && dict.chars[character]) {
          return dict.chars[character];
        }
      }
      return null;
    },
    getSimpleCharInfo: state => character => state.simpleCharInfoCache[character] || null,
    getMultipleSimpleCharInfo: state => characters => {
      if (!characters || characters.length === 0) return {};
      return characters.reduce((result, char) => {
        result[char] = state.simpleCharInfoCache[char] || null;
        return result;
      }, {});
    }
  }
})

export default store
