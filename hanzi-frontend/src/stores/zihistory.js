const MAX_HISTORY = 10;

export default {
  namespaced: true,
  state: {
    history: [],
    lastOpened: ''
  },
  mutations: {
    ADD(state, payload) {
      const character = typeof payload === 'string' ? payload : (payload && payload.character);
      const preserveOrder = !!(payload && payload.preserveOrder);
      if (!character) return;

      // Always record the last opened character
      state.lastOpened = character;

      const exists = state.history.includes(character);
      if (exists && preserveOrder) return;
      state.history = state.history.filter(c => c !== character);
      state.history.unshift(character);
      if (state.history.length > MAX_HISTORY) {
        state.history = state.history.slice(0, MAX_HISTORY);
      }
    }
  },
  actions: {
    addEntry({ commit }, payload) {
      commit('ADD', payload);
    }
  },
  getters: {
    getHistory: state => state.history,
    getLastOpened: state => state.lastOpened
  }
};
