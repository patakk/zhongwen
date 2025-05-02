<template>
    <BasePage page_title="Hanzi Tree" />
    <div class="content">
        <div v-if="isLoading">Loading data for character: {{ currentWord }}</div>
        <div v-else>Data loaded for character: {{ currentWord }}</div>
    </div>
</template>
  
<script>
import BasePage from '../components/BasePage.vue';
import PreloadWrapper from '../components/PreloadWrapper.vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { ref, onMounted, watch } from 'vue';

export default {
    components: {
        BasePage,
        PreloadWrapper,
    },
    setup() {
        const route = useRoute();
        const store = useStore();
        const isLoading = ref(true);
        const characterData = ref(null);
        const decompositionData = ref(null);
        const currentWord = ref('');

        // Get the word from URL or use default
        const getWordFromUrl = () => {
            return route.query.word || '我';
        };

        // Fetch all data for the word
        const fetchWordData = async (word) => {
            try {
                isLoading.value = true;
                currentWord.value = word;
                
                // Using the store's fetchCardData action
                await store.dispatch('cardModal/fetchCardData', word);
                
                // Get the character data
                characterData.value = store.getters['cardModal/getCardData'];
                
                // Properly await the decomposition data Promise
                const decompData = await store.dispatch('cardModal/fetchDecompositionDataOnly', word);
                decompositionData.value = decompData;
                
                // Log both data sets to console
                console.log('Character Data:', characterData.value);
                console.log('Decomposition Data:', decompositionData.value);
                
            } catch (error) {
                console.error('Error fetching word data:', error);
            } finally {
                isLoading.value = false;
            }
        };

        onMounted(() => {
            const word = getWordFromUrl();
            fetchWordData(word);
        });

        // Watch for route changes to update data when URL parameter changes
        watch(
            () => route.query.word,
            (newWord) => {
                if (newWord && newWord !== currentWord.value) {
                    fetchWordData(newWord);
                } else if (!newWord && currentWord.value !== '我') {
                    fetchWordData('我');
                }
            }
        );

        return {
            isLoading,
            characterData,
            decompositionData,
            currentWord
        };
    }
}
</script>

<style scoped>
.content {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}
</style>