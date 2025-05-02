<template>
    <BasePage page_title="Hanzi Tree" />
    <div class="hanzi-tree-container">
        <div v-if="isLoading" class="loading">Loading data for character: {{ currentWord }}</div>
        <div v-else class="tree-container" ref="treeContainer"></div>
    </div>
</template>
  
<script>
import BasePage from '../components/BasePage.vue';
import PreloadWrapper from '../components/PreloadWrapper.vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { ref, onMounted, watch, nextTick } from 'vue';
import * as d3 from 'd3';

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
        const treeContainer = ref(null);
        const treeData = ref(null);
        
        // Define styling configuration for nodes
        const nodeStyles = {
            rootNode: {
                fill: "#e67e22",       // Orange
                strokeColor: "#d35400", // Darker orange
                strokeWidth: 2,
                radius: 40,
                textColor: "#fff",
                fontSize: 36
            },
            componentNode: {
                fill: "#3498db",       // Blue
                strokeColor: "#2980b9", // Darker blue
                strokeWidth: 2,
                radius: 35,
                textColor: "#fff",
                fontSize: 30
            },
            subComponentNode: {
                fill: "#2ecc71",       // Green
                strokeColor: "#27ae60", // Darker green
                strokeWidth: 2,
                radius: 30,
                textColor: "#fff",
                fontSize: 24
            },
            link: {
                color: "#7f8c8d",
                opacity: 0.7,
                width: 2
            }
        };
        
        // Get the word from URL or use default
        const getWordFromUrl = () => {
            return route.query.word || '我';
        };

        // Convert decomposition data to hierarchical structure for D3
        const prepareTreeData = (word, decomp) => {
            // If no decomposition data, return just the character
            if (!decomp || !decomp[word]) {
                return { 
                    name: word, 
                    character: word
                };
            }
            
            // Create root node
            const rootNode = {
                name: word,
                character: word,
                children: []
            };
            
            // Add first level components
            const components = decomp[word];
            for (const component in components) {
                const componentNode = {
                    name: component,
                    character: component,
                    children: []
                };
                
                // Add second level components if they exist
                if (components[component] && Array.isArray(components[component])) {
                    components[component].forEach(subComponent => {
                        componentNode.children.push({
                            name: subComponent,
                            character: subComponent
                        });
                    });
                }
                
                rootNode.children.push(componentNode);
            }
            
            return rootNode;
        };

        // Create D3 force-directed graph
        const createForceDirectedGraph = async (data) => {
            // Add a slight delay to ensure the ref is mounted
            await new Promise(resolve => setTimeout(resolve, 50));
            
            if (!treeContainer.value) return;
            
            // Clear previous visualization if any
            d3.select(treeContainer.value).selectAll("*").remove();
            
            if (!data || !data.name) return;
            
            try {
                // Get container dimensions for responsive sizing
                const containerRect = treeContainer.value.getBoundingClientRect();
                const width = containerRect.width;
                const height = containerRect.height;
                
                // Compute the graph and start the force simulation
                const root = d3.hierarchy(data);
                
                const links = root.links();
                const nodes = root.descendants();
                
                const simulation = d3.forceSimulation(nodes)
                    .force("link", d3.forceLink(links).id(d => d.id).distance(150).strength(0.7))
                    .force("charge", d3.forceManyBody().strength(-1000))
                    .force("center", d3.forceCenter(width / 2, height / 2))
                    .force("x", d3.forceX(width / 2).strength(0.1))
                    .force("y", d3.forceY(height / 2).strength(0.1));
                
                // Create the container SVG
                const svg = d3.select(treeContainer.value)
                    .append("svg")
                    .attr("width", "100%")
                    .attr("height", "100%")
                    .attr("style", "display: block; margin: 0 auto;");
                
                // Helper function to determine node style based on depth
                const getNodeStyle = (depth) => {
                    if (depth === 0) return nodeStyles.rootNode;
                    if (depth === 1) return nodeStyles.componentNode;
                    return nodeStyles.subComponentNode;
                };
                
                // Append links
                const link = svg.append("g")
                    .attr("stroke", nodeStyles.link.color)
                    .attr("stroke-opacity", nodeStyles.link.opacity)
                    .attr("stroke-width", nodeStyles.link.width)
                    .selectAll("line")
                    .data(links)
                    .join("line");
                
                // Add drag behavior
                const drag = simulation => {
                    function dragstarted(event, d) {
                        if (!event.active) simulation.alphaTarget(0.3).restart();
                        d.fx = d.x;
                        d.fy = d.y;
                    }
                    
                    function dragged(event, d) {
                        d.fx = event.x;
                        d.fy = event.y;
                    }
                    
                    function dragended(event, d) {
                        if (!event.active) simulation.alphaTarget(0);
                        d.fx = null;
                        d.fy = null;
                    }
                    
                    return d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended);
                };
                
                // Append nodes with Chinese characters
                const nodeGroup = svg.append("g")
                    .selectAll("g")
                    .data(nodes)
                    .join("g")
                    .call(drag(simulation));
                
                // Add circles for the nodes with proper styling
                nodeGroup.append("circle")
                    .attr("fill", d => getNodeStyle(d.depth).fill)
                    .attr("stroke", d => getNodeStyle(d.depth).strokeColor)
                    .attr("stroke-width", d => getNodeStyle(d.depth).strokeWidth)
                    .attr("r", d => getNodeStyle(d.depth).radius);
                
                // Add text for the Chinese characters
                nodeGroup.append("text")
                    .attr("text-anchor", "middle")
                    .attr("dy", ".3em")
                    .attr("fill", d => getNodeStyle(d.depth).textColor)
                    .attr("font-size", d => `${getNodeStyle(d.depth).fontSize}px`)
                    .attr("font-family", "Noto Sans SC, sans-serif")
                    .text(d => d.data.character);
                
                // Update positions on each tick
                simulation.on("tick", () => {
                    link
                        .attr("x1", d => d.source.x)
                        .attr("y1", d => d.source.y)
                        .attr("x2", d => d.target.x)
                        .attr("y2", d => d.target.y);
                    
                    nodeGroup
                        .attr("transform", d => `translate(${d.x}, ${d.y})`);
                });
                
                // Add a timeout to allow the simulation to settle
                setTimeout(() => {
                    simulation.alpha(0.1).restart();
                }, 100);
            } catch (error) {
                console.error('Error creating D3 visualization:', error);
            }
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
                
                // Prepare data for visualization
                treeData.value = prepareTreeData(word, decompositionData.value);
                
            } catch (error) {
                console.error('Error fetching word data:', error);
                treeData.value = null;
            } finally {
                isLoading.value = false;
                
                // Wait for DOM to update before creating visualization
                setTimeout(async () => {
                    await nextTick();
                    createForceDirectedGraph(treeData.value);
                }, 200);
            }
        };

        onMounted(() => {
            const word = getWordFromUrl();
            fetchWordData(word);
            
            // Handle window resize
            window.addEventListener('resize', () => {
                if (!isLoading.value && decompositionData.value && treeData.value) {
                    createForceDirectedGraph(treeData.value);
                }
            });
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
            currentWord,
            treeContainer,
            treeData
        };
    }
}
</script>

<style scoped>
.hanzi-tree-container {
    width: 100%;
    height: calc(100vh - 60px); /* Adjust based on your BasePage height */
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    margin: 0;
}

.tree-container {
    width: 100%;
    height: 100%;
    background-color: white;
    margin: 0 auto;
    position: relative;
}

.loading {
    font-size: 24px;
    color: #666;
    text-align: center;
    width: 100%;
}
</style>