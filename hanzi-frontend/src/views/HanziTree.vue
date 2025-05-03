<template>
    <BasePage page_title="Hanzi Tree" />
    <div class="hanzi-tree-container">
        <div v-if="isLoading" class="loading">Loading data for character: {{ currentCharacter }}</div>
        <div v-else class="tree-container" ref="treeContainer"></div>
        
        <!-- Popup menu -->
        <div v-if="showMenu" class="node-menu" :style="menuStyle">
            <div class="menu-option decompose" @click="handleDecompose">
                <span class="icon">🔍</span>
                <span>Decompose</span>
            </div>
            <div class="menu-option show-details" @click="handleShowCard">
                <span class="icon">📄</span>
                <span>View Details</span>
            </div>
            <div v-if="isDirectChild" class="menu-option delete-node" @click="handleDeleteNode">
                <span class="icon">🗑️</span>
                <span>Delete Node</span>
            </div>
        </div>
    </div>
</template>
  
<script>
import BasePage from '../components/BasePage.vue';
import PreloadWrapper from '../components/PreloadWrapper.vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import * as d3 from 'd3';

export default {
    components: {
        BasePage,
        PreloadWrapper,
    },
    setup() {
        const route = useRoute();
        const router = useRouter();
        const store = useStore();
        const isLoading = ref(true);
        const characterData = ref(null);
        const decompositionData = ref(null);
        const currentCharacter = ref('');
        const treeContainer = ref(null);
        const treeData = ref(null);
        
        // Menu state
        const showMenu = ref(false);
        const menuStyle = ref({
            left: '0px',
            top: '0px'
        });
        const selectedNodeData = ref(null);
        const isDirectChild = ref(false);
        
        // Define styling configuration for nodes with theme support
        const nodeStyles = ref({
            rootNode: {
                fill: "#e67e22",       // Orange
                strokeColor: "#f11", // Darker orange
                strokeWidth: 2,
                radius: 30,
                textColor: "#fff",
                fontSize: 26
            },
            componentNode: {
                fill: "#3498db",       // Blue
                strokeColor: "#2980b9", // Darker blue
                strokeWidth: 2,
                radius: 24,
                textColor: "#fff",
                fontSize: 26
            },
            subComponentNode: {
                fill: "#2ecc71",       // Green
                strokeColor: "#27ae60", // Darker green
                strokeWidth: 2,
                radius: 20,
                textColor: "#fff",
                fontSize: 26
            },
            link: {
                color: "#7f8c8d",
                opacity: 0.7,
                width: 2
            }
        });
        
        // Theme management
        const currentTheme = ref(localStorage.getItem('theme') || 'light');
        const themeObserver = ref(null);
        
        // Update node styles based on current theme
        const updateNodeStylesForTheme = (themeName) => {
            // Default theme colors
            const themeColors = {
                theme1: {
                    rootNode_: {
                        fill: "#f54",       // Orange
                        strokeColor: "#000", // Darker orange
                        textColor: "#fff"
                    },
                    rootNode: {
                        fill: "#f54",       // Orange
                        fill: "#6f4",       // Green
                        strokeColor: "#000", // Darker orange
                        textColor: "#fff",
                        textColor: "#000",
                        strokeWidth: 2,
                        radius: 26,
                        fontSize: 26
                    },
                    componentNode: {
                        fill: "#27f",       // Blue
                        strokeColor: "#000", // Darker blue
                        textColor: "#fff"
                    },
                    subComponentNode: {
                        fill: "#6f4",       // Green
                        strokeColor: "#000", // Darker green
                        textColor: "#000"
                    },
                    link: {
                        color: "#7f8c8d"
                    }
                },
                dark: {
                    rootNode: {
                        fill: "#f39c12",       // Brighter orange for dark mode
                        strokeColor: "#e67e22", // Orange stroke
                        textColor: "#fff"
                    },
                    componentNode: {
                        fill: "#2980b9",       // Darker blue for dark mode
                        strokeColor: "#3498db", // Blue stroke
                        textColor: "#fff"
                    },
                    subComponentNode: {
                        fill: "#27ae60",       // Darker green for dark mode
                        strokeColor: "#2ecc71", // Green stroke
                        textColor: "#fff"
                    },
                    link: {
                        color: "#95a5a6"       // Lighter gray for dark mode
                    }
                },
                light: {
                    rootNode: {
                        fill: "#d35400",       // Deep orange for theme1
                        strokeColor: "#e67e22", 
                        textColor: "#fff"
                    },
                    componentNode: {
                        fill: "#2c3e50",       // Dark blue/gray for theme1
                        strokeColor: "#34495e", 
                        textColor: "#fff"
                    },
                    subComponentNode: {
                        fill: "#16a085",       // Teal for theme1
                        strokeColor: "#1abc9c",
                        textColor: "#fff"
                    },
                    link: {
                        color: "#bdc3c7"
                    }
                },
                theme2: {
                    rootNode: {
                        fill: "#8e44ad",       // Purple for theme2
                        strokeColor: "#9b59b6", 
                        textColor: "#fff"
                    },
                    componentNode: {
                        fill: "#c0392b",       // Red for theme2
                        strokeColor: "#e74c3c", 
                        textColor: "#fff"
                    },
                    subComponentNode: {
                        fill: "#2980b9",       // Blue for theme2
                        strokeColor: "#3498db",
                        textColor: "#fff"
                    },
                    link: {
                        color: "#95a5a6"
                    }
                }
            };
            
            // Get the theme colors or use light theme as fallback
            const colors = themeColors[themeName] || themeColors.light;
            
            // Update node styles with the theme-specific colors
            nodeStyles.value = {
                rootNode: {
                    ...nodeStyles.value.rootNode,
                    ...colors.rootNode
                },
                componentNode: {
                    ...nodeStyles.value.componentNode,
                    ...colors.componentNode
                },
                subComponentNode: {
                    ...nodeStyles.value.subComponentNode,
                    ...colors.subComponentNode
                },
                link: {
                    ...nodeStyles.value.link,
                    ...colors.link
                }
            };
        };
        
        // Hide menu when clicking outside
        const handleDocumentClick = (e) => {
            // Check if the click is outside the menu
            const menuElement = document.querySelector('.node-menu');
            if (menuElement && !menuElement.contains(e.target) && 
                !e.target.closest('circle') && !e.target.closest('text')) {
                showMenu.value = false;
            }
        };
        
        // Get the character from URL or use default
        const getCharacterFromUrl = () => {
            return route.query.character || '我';
        };

        // Handle menu options
        const handleDecompose = async () => {
            if (!selectedNodeData.value) return;
            
            const character = selectedNodeData.value.data.character;
            
            try {
                // Show loading state while fetching data
                isLoading.value = true;
                
                // Fetch decomposition data for the selected character
                const decompData = await store.dispatch('cardModal/fetchDecompositionDataOnly', character);
                
                if (!decompData || !decompData[character]) {
                    console.warn(`No decomposition data found for ${character}`);
                    showMenu.value = false;
                    isLoading.value = false;
                    return;
                }
                
                console.log(`Got decomposition data for ${character}:`, decompData[character]);
                
                // Create a deep clone of the current tree data to prevent direct modification
                let updatedTreeData = JSON.parse(JSON.stringify(treeData.value));
                
                // Helper function to find if a character exists anywhere in the tree
                const findNodeInTree = (node, targetChar) => {
                    if (node.character === targetChar) {
                        return node;
                    }
                    
                    if (node.children) {
                        for (const child of node.children) {
                            const found = findNodeInTree(child, targetChar);
                            if (found) return found;
                        }
                    }
                    
                    return null;
                };
                
                // Find the node in the existing tree that corresponds to our selected node
                const findAndUpdateNode = (node, targetChar, newDecompData) => {
                    // If we found our target character
                    if (node.character === targetChar) {
                        // Initialize children array if it doesn't exist
                        if (!node.children) {
                            node.children = [];
                        }
                        
                        // Mark this node as explicitly decomposed
                        node.isDecomposed = true;
                        
                        // Get components for this character from decomposition data
                        const components = newDecompData[targetChar];
                        if (!components) return false;
                        
                        console.log(`Adding components for ${targetChar}:`, Object.keys(components));
                        
                        let addedNewNodes = false;
                        
                        // First, create a set of all characters already in the tree for faster lookup
                        const existingCharsInTree = new Set();
                        const collectExistingChars = (treeNode) => {
                            existingCharsInTree.add(treeNode.character);
                            if (treeNode.children) {
                                treeNode.children.forEach(child => collectExistingChars(child));
                            }
                        };
                        collectExistingChars(updatedTreeData);
                        
                        // For each component in the decomposition data
                        Object.keys(components).forEach(component => {
                            // Skip if component is the same as target (avoid loops)
                            if (component === targetChar) return;
                            
                            // Check if this component already exists as a direct child of this node
                            const existingChildIndex = node.children.findIndex(child => 
                                child.character === component
                            );
                            
                            // Skip if it's already a child OR if it exists anywhere else in the tree
                            if (existingChildIndex === -1 && !existingCharsInTree.has(component)) {
                                // If component doesn't exist anywhere, create it and add it as a child
                                const componentNode = {
                                    name: component,
                                    character: component,
                                    children: []
                                };
                                
                                // Add any sub-components if they exist
                                if (components[component] && Array.isArray(components[component])) {
                                    const filteredSubcomps = components[component].filter(
                                        subComp => subComp !== targetChar && subComp !== component
                                    );
                                    
                                    filteredSubcomps.forEach(subComp => {
                                        // Only add subcomponent if it doesn't exist elsewhere in the tree
                                        if (!existingCharsInTree.has(subComp)) {
                                            componentNode.children.push({
                                                name: subComp,
                                                character: subComp
                                            });
                                            existingCharsInTree.add(subComp); // Add to set to skip in future iterations
                                        }
                                    });
                                }
                                
                                node.children.push(componentNode);
                                addedNewNodes = true;
                                existingCharsInTree.add(component); // Add to set to skip in future iterations
                            }
                        });
                        
                        return addedNewNodes; // Return whether we added any new nodes
                    }
                    
                    // Recursively search children
                    if (node.children && node.children.length > 0) {
                        for (let i = 0; i < node.children.length; i++) {
                            if (findAndUpdateNode(node.children[i], targetChar, newDecompData)) {
                                return true; // Target found and updated in this branch
                            }
                        }
                    }
                    
                    return false; // Target not found in this branch
                };

                // Start the recursive search from the tree root
                const nodesAdded = findAndUpdateNode(updatedTreeData, character, decompData);
                
                console.log(`Nodes added for ${character}: ${nodesAdded}`);
                
                // Update the tree data with the modified version
                treeData.value = updatedTreeData;
                
                // Redraw the tree with the new data
                await nextTick();
                createForceDirectedGraph(treeData.value);
                
            } catch (error) {
                console.error('Error decomposing character:', error);
            } finally {
                isLoading.value = false;
                showMenu.value = false;
            }
        };
        
        // Handle showing card details
        const handleShowCard = () => {
            if (!selectedNodeData.value) return;
            
            const character = selectedNodeData.value.data.character;
            
            // Show card modal for this character
            store.dispatch('cardModal/showCardModal', character);
            
            // Hide the menu
            showMenu.value = false;
        };

        // Handle deleting a node
        const handleDeleteNode = () => {
            if (!selectedNodeData.value || !treeData.value) return;

            const characterToRemove = selectedNodeData.value.data.character;
            
            // Don't allow deleting the root node
            if (characterToRemove === treeData.value.character) {
                showMenu.value = false;
                return;
            }
            
            // Find the parent of the node to remove and remove it from the parent's children
            const removeNodeFromParent = (node, targetChar) => {
                if (!node.children) return false;
                
                // Check if any direct child matches the character to remove
                const childIndex = node.children.findIndex(child => child.character === targetChar);
                
                if (childIndex !== -1) {
                    // Found the child, remove it
                    node.children.splice(childIndex, 1);
                    return true;
                }
                
                // If not found in direct children, recursively search deeper
                for (let i = 0; i < node.children.length; i++) {
                    if (removeNodeFromParent(node.children[i], targetChar)) {
                        return true;
                    }
                }
                
                return false;
            };
            
            // Start the removal process from the root
            removeNodeFromParent(treeData.value, characterToRemove);
            
            // Redraw the tree with the updated data
            nextTick(() => {
                createForceDirectedGraph(treeData.value);
            });

            // Hide the menu
            showMenu.value = false;
        };

        // Preload card data for a character
        const preloadCardData = async (character) => {
            try {
                await store.dispatch('cardModal/fetchCardData', character);
            } catch (error) {
                console.error('Error preloading card data:', error);
            }
        };

        // Convert decomposition data to hierarchical structure for D3
        const prepareTreeData = (character, decomp, previousData = null) => {
            // If no decomposition data, return just the character
            if (!decomp || !decomp[character]) {
                return { 
                    name: character, 
                    character: character
                };
            }
            
            // Create root node
            const rootNode = {
                name: character,
                character: character,
                children: []
            };
            
            // Add first level components
            const components = decomp[character];
            for (const component in components) {
                // Check if this component has a subtree from previous data
                let componentNode = {
                    name: component,
                    character: component,
                    children: []
                };
                
                // If we have previous data and are re-using a component, try to find it
                if (previousData && previousData.children) {
                    const foundComponent = previousData.children.find(child => 
                        child.character === component
                    );
                    
                    if (foundComponent) {
                        // Re-use the existing subtree
                        componentNode = JSON.parse(JSON.stringify(foundComponent));
                    }
                }
                
                // If no children were found in previous data, add components normally
                if (componentNode.children.length === 0 && components[component] && 
                    Array.isArray(components[component])) {
                    // Filter out the parent character to prevent circular references
                    const filteredComponents = components[component].filter(subComponent => 
                        subComponent !== character
                    );
                    
                    filteredComponents.forEach(subComponent => {
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
                    .force("link", d3.forceLink(links).id(d => d.id).distance(0).strength(0.5))
                    .force("charge", d3.forceManyBody().strength(-666))
                    .force("center", d3.forceCenter(width / 2, height / 2))
                    .force("x", d3.forceX(width / 2).strength(0.1))
                    .force("y", d3.forceY(height / 2).strength(0.1));
                
                // Create the container SVG
                const svg = d3.select(treeContainer.value)
                    .append("svg")
                    .attr("width", "100%")
                    .attr("height", "100%")
                    .attr("style", "display: block; margin: 0 auto; background: transparent;");
                
                // Helper function to determine node style based on depth and decomposition status
                const getNodeStyle = (d) => {
                    // Original root node always gets rootNode style
                    if (d.depth === 0) return nodeStyles.value.rootNode;
                    
                    // Nodes explicitly decomposed by the user also get rootNode style
                    if (d.data.isDecomposed) return nodeStyles.value.rootNode;
                    
                    // All parent nodes (nodes with children) should get componentNode style
                    // This ensures decomposition characters use componentNode style
                    if (d.children && d.children.length > 0) return nodeStyles.value.componentNode;
                    
                    // All other nodes get subComponentNode style (leaf nodes)
                    return nodeStyles.value.subComponentNode;
                };
                
                // Append links
                const link = svg.append("g")
                    .attr("stroke", nodeStyles.value.link.color)
                    .attr("stroke-opacity", nodeStyles.value.link.opacity)
                    .attr("stroke-width", nodeStyles.value.link.width)
                    .selectAll("line")
                    .data(links)
                    .join("line");
                
                // Add drag behavior
                const drag = simulation => {
                    function dragstarted(event, d) {
                        // Hide menu when starting to drag
                        showMenu.value = false;
                        
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
                    .attr("data-character", d => d.data.character)
                    .call(drag(simulation));
                
                // Add circles for the nodes with proper styling
                nodeGroup.append("rect")
                    .attr("fill", d => getNodeStyle(d).fill)
                    .attr("stroke", d => getNodeStyle(d).strokeColor)
                    .attr("stroke-width", d => getNodeStyle(d).strokeWidth)
                    .attr("r", d => getNodeStyle(d).radius)
                    .attr("rx", d => getNodeStyle(d).radius/3)
                    .attr("ry", d => getNodeStyle(d).radius/3)
                    .attr("width", d => getNodeStyle(d).radius*2*.9)
                    .attr("height", d => getNodeStyle(d).radius*2*.9)
                    .attr("transform", d => `translate(${-getNodeStyle(d).radius*.9}, ${-getNodeStyle(d).radius*.9})`)
                    .on("click", (event, d) => {
                        // Prevent propagation to document
                        event.stopPropagation();
                        
                        // First and foremost - preload BOTH card data AND decomposition data IMMEDIATELY
                        if (d.data.character) {
                            // Preload card data
                            store.dispatch('cardModal/preloadCardData', d.data.character);
                            // Also preload decomposition data
                            store.dispatch('cardModal/fetchDecompositionDataOnly', d.data.character);
                        }
                        
                        // Don't show menu for current root character
                        if (d.data.character === currentCharacter.value) return;
                        
                        // Store node data for menu actions
                        selectedNodeData.value = d;
                        
                        // Show delete option for any node that's a component (not the original root)
                        // This allows deleting any decomposition character except the main root
                        isDirectChild.value = d.depth > 0;
                        
                        // Position menu near the clicked node
                        const nodeBounds = event.target.getBoundingClientRect();
                        const containerBounds = treeContainer.value.getBoundingClientRect();
                        
                        menuStyle.value = {
                            left: `${nodeBounds.left - containerBounds.left + nodeBounds.width}px`,
                            top: `${nodeBounds.top - containerBounds.top}px`
                        };
                        
                        // Show menu
                        showMenu.value = true;
                    });
                
                // Add text for the Chinese characters
                nodeGroup.append("text")
                    .attr("text-anchor", "middle")
                    .attr("dy", ".3em")
                    .attr("fill", d => getNodeStyle(d).textColor)
                    .attr("font-size", d => `${getNodeStyle(d).fontSize}px`)
                    .attr("font-family", "Noto Sans SC, sans-serif")
                    .text(d => d.data.character)
                    .on("click", (event, d) => {
                        // Prevent propagation to document
                        event.stopPropagation();
                        
                        // First and foremost - preload BOTH card data AND decomposition data IMMEDIATELY
                        if (d.data.character) {
                            // Preload card data
                            store.dispatch('cardModal/preloadCardData', d.data.character);
                            // Also preload decomposition data
                            store.dispatch('cardModal/fetchDecompositionDataOnly', d.data.character);
                        }
                        
                        // Don't show menu for current root character
                        if (d.data.character === currentCharacter.value) return;
                        
                        // Store node data for menu actions
                        selectedNodeData.value = d;
                        
                        // Show delete option for any node that's a component (not the original root)
                        // This allows deleting any decomposition character except the main root
                        isDirectChild.value = d.depth > 0;
                        
                        // Position menu near the clicked node
                        const nodeBounds = event.target.getBoundingClientRect();
                        const containerBounds = treeContainer.value.getBoundingClientRect();
                        
                        menuStyle.value = {
                            left: `${nodeBounds.left - containerBounds.left + nodeBounds.width/2}px`,
                            top: `${nodeBounds.top - containerBounds.top}px`
                        };
                        
                        // Show menu
                        showMenu.value = true;
                    });
                
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

        // Fetch all data for the character
        const fetchCharacterData = async (character) => {
            try {
                isLoading.value = true;
                currentCharacter.value = character;
                
                // Using the store's fetchCardData action
                await store.dispatch('cardModal/fetchCardData', character);
                
                // Get the character data
                characterData.value = store.getters['cardModal/getCardData'];
                
                // Properly await the decomposition data Promise
                const decompData = await store.dispatch('cardModal/fetchDecompositionDataOnly', character);
                decompositionData.value = decompData;
                
                // Prepare data for visualization
                treeData.value = prepareTreeData(character, decompositionData.value);
                
            } catch (error) {
                console.error('Error fetching character data:', error);
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
            const character = getCharacterFromUrl();
            fetchCharacterData(character);
            
            // Apply theme colors
            updateNodeStylesForTheme(currentTheme.value);
            
            // Set up theme observer
            themeObserver.value = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'data-theme') {
                        const newTheme = document.documentElement.getAttribute('data-theme');
                        if (currentTheme.value !== newTheme) {
                            currentTheme.value = newTheme;
                            localStorage.setItem('theme', newTheme);
                            updateNodeStylesForTheme(newTheme);
                            
                            // Redraw the graph with updated theme styling
                            if (!isLoading.value && decompositionData.value && treeData.value) {
                                createForceDirectedGraph(treeData.value);
                            }
                        }
                    }
                });
            });
            
            themeObserver.value.observe(document.documentElement, { 
                attributes: true, 
                attributeFilter: ['data-theme'] 
            });
            
            // Add document click listener for hiding menu
            document.addEventListener('click', handleDocumentClick);
            
            // Handle window resize
            // let resizeTimeout;
            // const handleResize = () => {
            //     clearTimeout(resizeTimeout);
            //     resizeTimeout = setTimeout(() => {
            //         if (!isLoading.value && decompositionData.value && treeData.value) {
            //             createForceDirectedGraph(treeData.value);
            //         }
            //         // Hide menu on resize
            //         showMenu.value = false;
            //     }, 100);
            // };
            // window.addEventListener('resize', handleResize);
        });

        // Watch for route changes to update data when URL parameter changes
        watch(
            () => route.query.character,
            (newCharacter) => {
                if (newCharacter && newCharacter !== currentCharacter.value) {
                    fetchCharacterData(newCharacter);
                } else if (!newCharacter && currentCharacter.value !== '我') {
                    fetchCharacterData('我');
                }
            }
        );
        
        // Clean up when component is unmounted
        onUnmounted(() => {
            document.removeEventListener('click', handleDocumentClick);
            // window.removeEventListener('resize', handleResize);
            
            // Disconnect theme observer
            if (themeObserver.value) {
                themeObserver.value.disconnect();
                themeObserver.value = null;
            }
        });

        return {
            isLoading,
            characterData,
            decompositionData,
            currentCharacter,
            treeContainer,
            treeData,
            showMenu,
            menuStyle,
            handleDecompose,
            handleShowCard,
            handleDeleteNode
        };
    }
}
</script>

<style scoped>

#app {
}

.hanzi-tree-container {
    width: 100%;
    height: calc(100vh - 11.5rem + 2px); /* Adjust based on your BasePage height */
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    margin: 0;
    position: relative;
}

@media screen and (max-width: 768px) {
    .hanzi-tree-container {
        height: calc(100vh - 7rem + 5px); /* Adjust for smaller screens */
    }
}

@media screen and (max-width: 1024px) {
    .hanzi-tree-container {
        height: calc(100vh - 10rem + 2px); /* Adjust for smaller screens */
    }
}

.tree-container {
    width: 100%;
    height: 100%;
    margin: 0 auto;
    position: relative;
}

.loading {
    font-size: 24px;
    color: #666;
    text-align: center;
    width: 100%;
}

.node-menu {
    position: absolute;
    background-color: var(--bg, white);
    border: 1px solid var(--fg-dim, #ddd);
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    width: 160px;
    overflow: hidden;
    transition: all 0.2s ease;
}

.menu-option {
    padding: 10px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.2s ease;
    color: var(--fg, #333);
}

.menu-option:hover {
    background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 100%);
}

.menu-option .icon {
    margin-right: 8px;
    font-size: 18px;
}

.menu-option.decompose:hover {
    background-color: color-mix(in oklab, var(--primary-color, #3498db) 15%, var(--bg) 100%);
}

.menu-option.show-details:hover {
    background-color: color-mix(in oklab, var(--secondary-color, #9b59b6) 15%, var(--bg) 100%);
}

.menu-option.delete-node:hover {
    background-color: color-mix(in oklab, var(--danger-color, #e74c3c) 15%, var(--bg) 100%);
}
</style>