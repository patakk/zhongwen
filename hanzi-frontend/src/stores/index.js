import { createStore } from 'vuex';

const store = createStore({
  state: {
    // Store your dictionary data here
    dictionaryData: null
  },
  mutations: {
    // Mutation to update the dictionary data
    setDictionaryData(state, data) {
      state.dictionaryData = data;
    }
  },
  actions: {
    // Action to fetch dictionary data from Flask backend
    async fetchDictionaryData({ commit }) {
      try {
        const response = await fetch('http://127.0.0.1:5117/get_static_cc'); // Adjust endpoint as per your Flask setup
        const data = await response.json();
        commit('setDictionaryData', data);
      } catch (error) {
        console.error("Error fetching dictionary data:", error);
      }
    }
  },
  getters: {
    // Getter to access the dictionary data
    getDictionaryData: (state) => state.dictionaryData
  }
});

export default store;
