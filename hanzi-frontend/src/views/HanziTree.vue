<template>
    <BasePage page_title="Hanzi Tree" />
    <div class="hanzi-tree-container">
        <div class="tree-container" ref="treeContainer"></div>
        
        <!-- Popup menu -->
        <div v-if="showMenu" class="node-menu" :style="menuStyle">
            <!-- Character info section -->
            <div class="char-info">
                <div class="char">{{ selectedNodeData?.data?.character }}</div>
                <div class="details">
                    <div class="pinyin">{{ this.$toAccentedPinyin(selectedCharPinyin) }}</div>
                    <div class="english">{{ selectedCharEnglish }}</div>
                </div>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-option decompose" @click="handleDecompose">
                <span class="icon"><font-awesome-icon :icon="['fas', 'magnifying-glass']" /></span>
                <span>Decompose</span>
            </div>
            <div class="menu-option containing" @click="handleShowContaining">
                <span class="icon"><font-awesome-icon :icon="['fas', 'sitemap']" /></span>
                <span>Show Chars Containing</span>
            </div>
            <div class="menu-option show-details" @click="handleShowCard">
                <span class="icon"><font-awesome-icon :icon="['fas', 'file']" /></span>
                <span>View Details</span>
            </div>
            <div v-if="isDirectChild" class="menu-option delete-node" @click="handleDeleteNode">
                <span class="icon"><font-awesome-icon :icon="['fas', 'trash']" /></span>
                <span>Delete Node</span>
            </div>
            <div v-if="hasChildren" class="menu-option delete-children" @click="handleDeleteChildren">
                <span class="icon"><font-awesome-icon :icon="['fas', 'scissors']" /></span>
                <span>Delete Children</span>
            </div>
        </div>
    </div>
</template>
  
<script>
import BasePage from '../components/BasePage.vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import * as d3 from 'd3';

export default {
    components: {
        BasePage,
    },
    setup() {
        const route = useRoute();
        const router = useRouter();
        const store = useStore();
        
        // Refs
        const treeContainer = ref(null);
        const isLoading = ref(true);
        const loadingStatus = ref('Initializing...');
        const showMenu = ref(false);
        const menuStyle = ref({});
        const selectedNodeData = ref(null);
        const currentCharacter = ref('我'); // Default to "wo" character
        const svg = ref(null);
        const simulation = ref(null);
        
        // Tree data structure
        const treeData = ref({
            character: '我',
            id: 'root',
            nodeType: 'character',
            children: []
        });
        
        // Track nodes that have already been decomposed or shown containing
        // Use node IDs instead of characters to properly track deleted nodes
        const decomposedNodeIds = ref(new Set());
        const containingNodeIds = ref(new Set());
        
        // Computed values for selected node
        const selectedCharPinyin = ref('');
        const selectedCharEnglish = ref('');
        const isDirectChild = ref(false);
        const hasChildren = ref(false);
        
        // Methods for handling tree nodes
        const initializeTree = () => {
            console.log('Initializing tree with data:', JSON.stringify(treeData.value));
            
            if (!treeContainer.value) {
                console.error('Tree container reference is null');
                return;
            }
            
            // Clear any existing SVG
            d3.select(treeContainer.value).selectAll('*').remove();
            
            const width = treeContainer.value.clientWidth || 800;
            const height = treeContainer.value.clientHeight || 600;
            
            // Create SVG
            svg.value = d3.select(treeContainer.value)
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .attr('viewBox', [-width / 2, -height / 2, width, height])
                .attr('style', 'max-width: 100%; height: auto; border: 1px solid #ccc;');
            
            // Create container group that will be transformed with zoom
            const container = svg.value.append("g").attr("class", "container");
            
            // Store container reference for later use
            svg.value.container = container;
                
            // Convert tree data to hierarchy
            const hierarchyData = createHierarchy(treeData.value);
            
            // Get all links and nodes
            const allLinks = hierarchyData.links();
            const nodes = hierarchyData.descendants();
            
            // Modify links to set custom distances and strength based on node type
            allLinks.forEach(link => {
                // Set custom distance properties for different node types
                if (link.source.data.nodeType === 'character' && link.target.data.nodeType === 'decomposition') {
                    // Make decomposition nodes farther from parent character
                    link.distance = 100; // Farther distance for decomposition nodes
                    link.strength = 0.7; // Stronger link to maintain distance
                } else if (link.source.data.nodeType === 'character' && link.target.data.nodeType === 'containing') {
                    // Make containing nodes farther from parent character as well
                    link.distance = 100; // Farther distance for containing nodes
                    link.strength = 0.7; // Stronger link to maintain distance
                } else if (link.source.data.nodeType === 'decomposition') {
                    // Default distance for components connected to decomposition nodes
                    link.distance = 40;
                    link.strength = 0.5;
                } else if (link.source.data.nodeType === 'containing') {
                    // Default distance for characters connected to containing nodes
                    link.distance = 40;
                    link.strength = 0.3; // Weaker links for more spread
                } else {
                    // Default distance and strength for other links
                    link.distance = 50;
                    link.strength = 0.5;
                }
            });
            
            // Create force simulation with ALL links for physics
            simulation.value = d3.forceSimulation(nodes)
                .force('link', d3.forceLink(allLinks)
                    .id(d => d.id)
                    .distance(link => link.distance)
                    .strength(link => link.strength))
                .force('charge', d3.forceManyBody().strength(-300))
                .force('x', d3.forceX())
                .force('y', d3.forceY())
                .alphaDecay(0.05); // Speed up the simulation
            
            // Filter links for VISUAL display only
            const visibleLinks = allLinks.filter(link => {
                // Always show links for decomposition nodes
                if (link.source.data.nodeType === 'decomposition') return true;
                
                // For containing nodes, only show links for nodes with showLine=true
                if (link.source.data.nodeType === 'containing') {
                    // If the target has a showLine property, use that
                    if (link.target.data.hasOwnProperty('showLine')) {
                        return link.target.data.showLine;
                    }
                }
                
                // Show all other links
                return true;
            });
                
            // Create container groups within the main container
            const linkGroup = container.append('g')
                .attr('class', 'links')
                .attr('stroke', '#999')
                .attr('stroke-opacity', 0.6);
                
            const nodeGroup = container.append('g')
                .attr('class', 'nodes');
            
            // Store references to groups
            svg.value.linkGroup = linkGroup;
            svg.value.nodeGroup = nodeGroup;
            
            // Create visible links only
            const linkElements = linkGroup.selectAll('line')
                .data(visibleLinks) // Use filtered links for visual display
                .join('line')
                .attr('stroke-width', d => {
                    // Make decomposition links thicker for better visibility
                    if (d.source.data.nodeType === 'character' && d.target.data.nodeType === 'decomposition' ||
                        d.source.data.nodeType === 'decomposition' && d.target.data.nodeType === 'character') {
                        return 1;
                    }
                    // Also make containing links thicker for better visibility
                    if (d.source.data.nodeType === 'character' && d.target.data.nodeType === 'containing' ||
                        d.source.data.nodeType === 'containing' && d.target.data.nodeType === 'character') {
                        return 1;
                    }
                    return 1;
                })
                .attr('stroke', d => {
                    // Use different colors for different link types
                    if (d.source.data.nodeType === 'character' && d.target.data.nodeType === 'decomposition' ||
                        d.source.data.nodeType === 'decomposition' && d.target.data.nodeType === 'character') {
                        return '#e67e22'; // Orange for decomposition links
                    } else if (d.source.data.nodeType === 'containing' || d.target.data.nodeType === 'containing') {
                        return '#3498db'; // Blue for containing links
                    }
                    return '#999'; // Default gray
                });
                
            // Create nodes
            const nodeElements = nodeGroup.selectAll('g')
                .data(nodes)
                .join('g')
                .attr('class', 'node')
                .attr('id', d => `node-${d.data.id}`)
                .style('cursor', 'pointer') // Add pointer cursor on all nodes
                .call(drag(simulation.value));
                
            // Add circles to nodes
            nodeElements.append('circle')
                .attr('r', d => getNodeRadius(d))
                .attr('fill', d => getNodeColor(d.data.nodeType))
                .attr('stroke', '#000')
                .attr('stroke-width', 1.5);
                
            // Add text to nodes
            nodeElements.append('text')
                .attr('dy', '.35em')
                .attr('text-anchor', 'middle')
                .attr('font-size', d => d.data.nodeType === 'character' ? '18px' : '10px')
                .attr('fill', '#000')
                .text(d => d.data.character || '');
                
            // Add click event to show menu
            nodeElements.on('click', (event, d) => {
                event.stopPropagation();
                showNodeMenu(event, d);
            });
                
            // Update positions on simulation tick
            simulation.value.on('tick', () => {
                linkElements
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);
                    
                nodeElements.attr('transform', d => `translate(${d.x},${d.y})`);
            });
            
            // Setup zoom and pan behavior
            setupZoomAndPan();
            
            // Click anywhere else to close menu
            svg.value.on('click', (event) => {
                // Only close menu if directly clicking on SVG background
                if (event.target.tagName === 'svg') {
                    showMenu.value = false;
                }
            });
            
            // Set loading to false once tree is ready
            isLoading.value = false;
            console.log('Tree initialization complete, loading set to false');
        };
        
        // Function to set up zoom and pan behavior
        const setupZoomAndPan = () => {
            if (!svg.value) return;
            
            // Create zoom behavior
            const zoom = d3.zoom()
                .scaleExtent([0.2, 5]) // Limit zoom scale: min 20%, max 500%
                .on('zoom', (event) => {
                    // Apply the zoom transform to the container with all the content
                    svg.value.container.attr('transform', event.transform);
                });
            
            // Apply zoom behavior to SVG
            svg.value.call(zoom);
            
            // Store the zoom object for later use
            svg.value.zoom = zoom;
            
            // Set initial zoom level
            svg.value.call(zoom.transform, d3.zoomIdentity);
        };
        
        // Function to center view on a specific node with smooth animation
        const centerViewOnNode = (nodeId) => {
            if (!svg.value || !svg.value.zoom) return;
            
            // Short delay to allow force simulation to stabilize node positions
            setTimeout(() => {
                // Find the node in the DOM
                const nodeElement = d3.select(`#node-${nodeId}`);
                if (nodeElement.empty()) return;
                
                const node = nodeElement.datum();
                
                // Get SVG dimensions
                const width = treeContainer.value.clientWidth || 800;
                const height = treeContainer.value.clientHeight || 600;
                
                // Calculate transform to center on this node
                const scale = 1.2; // Slightly zoomed in for better visibility
                
                // Transform calculation needs to account for current viewbox centering
                // SVG viewBox is centered at [0,0], so we need to negate the node coordinates
                const x = -node.x * scale;
                const y = -node.y * scale;
                
                // Apply smooth transition
                svg.value
                    .transition()
                    .duration(750) // 750ms transition
                    .call(
                        svg.value.zoom.transform,
                        d3.zoomIdentity.translate(x, y).scale(scale)
                    );
                    
                console.log(`Centering on node ${nodeId} at position (${node.x}, ${node.y}) with transform: translate(${x}, ${y}) scale(${scale})`);
            }, 300);
        };

        // Helper functions
        const createHierarchy = (data) => {
            return d3.hierarchy(data);
        };
        
        const getNodeRadius = (d) => {
            switch (d.data.nodeType) {
                case 'character': return 20;
                case 'decomposition': return 7; // Yellow node
                case 'containing': return 7; // Blue node
                default: return 15;
            }
        };
        
        const getNodeColor = (nodeType) => {
            switch (nodeType) {
                case 'character': return '#fff';
                case 'decomposition': return '#f1c40f'; // Yellow
                case 'containing': return '#3498db'; // Blue
                default: return '#ddd';
            }
        };
        
        const generateUniqueId = () => {
            return Date.now().toString(36) + Math.random().toString(36).substring(2);
        };
        
        // Drag functions (optimized)
        const drag = (simulation) => {
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
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended);
        };
        
        // Node menu functions
        const showNodeMenu = async (event, d) => {
            event.preventDefault();
            
            // Set selected node data immediately
            selectedNodeData.value = d;
            
            // Position menu right away for better UX
            const boundingRect = treeContainer.value.getBoundingClientRect();
            menuStyle.value = {
                top: `${event.clientY - boundingRect.top}px`,
                left: `${event.clientX - boundingRect.left}px`
            };
            
            // Special handling for decomposition and containing nodes - only show delete option
            if (d.data.nodeType === 'decomposition' || d.data.nodeType === 'containing') {
                selectedCharPinyin.value = '';
                selectedCharEnglish.value = '';
                isDirectChild.value = true;  // Enable delete option
                hasChildren.value = false;   // Disable delete children option
                showMenu.value = true;
                return;
            }
            
            // Only proceed for character nodes to show full menu
            if (!d.data.character || d.data.nodeType !== 'character') {
                return;
            }
            
            // Show the menu immediately with empty values
            selectedCharPinyin.value = '';
            selectedCharEnglish.value = '';
            showMenu.value = true;
            
            // Determine if direct child and has children
            isDirectChild.value = d.depth > 0;
            hasChildren.value = d.children && d.children.length > 0;
            
            const character = d.data.character;
            console.log('Fetching data for character:', character);
            
            try {
                // Always fetch decomposition data, regardless of card data availability
                await getCharDecompositionData(character);
                
                try {
                    // Try to preload card data, but don't block on failure
                    await store.dispatch('cardModal/preloadCardData', character);
                    
                    // Try to get character data from the store
                    const characterData = store.getters.getCharacterData(character);
                    
                    if (characterData) {
                        // Update the menu with character data - use first element for lists
                        selectedCharPinyin.value = characterData.pinyin?.[0] || '';
                        selectedCharEnglish.value = characterData.english?.[0] || '';
                    } else {
                        // If no data in dictionary, try to get from preloaded card data
                        const preloadedData = store.getters['cardModal/getPreloadedData'](character);
                        if (preloadedData) {
                            selectedCharPinyin.value = preloadedData.pinyin?.[0] || '';
                            selectedCharEnglish.value = preloadedData.english?.[0] || '';
                        }
                    }
                } catch (error) {
                    console.log('Card data not available for character:', character);
                    // Continue even if card data fails - decomposition should still work
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        
        // Fix the decompose handler to properly preload all decomposition parts with batched API requests
        const handleDecompose = async () => {
            if (!selectedNodeData.value || !selectedNodeData.value.data.character) {
                showMenu.value = false;
                return;
            }
            
            const character = selectedNodeData.value.data.character;
            const nodeId = selectedNodeData.value.data.id;
            
            console.log(`handleDecompose called for character: "${character}" (nodeId: ${nodeId})`);
            
            // Check if this node specifically has been decomposed
            if (decomposedNodeIds.value.has(nodeId)) {
                console.log('This specific node already has decomposition children:', nodeId);
                showMenu.value = false;
                return;
            }
            
            // Mark node as decomposed by ID rather than character
            decomposedNodeIds.value.add(nodeId);
            
            // Get decomposition data
            console.log(`Fetching decomposition data for "${character}"`);
            const decompData = await getCharDecompositionData(character);
            console.log('Decomposition data received:', decompData);
            
            if (!decompData || !decompData[character] || !decompData[character].parts || 
                decompData[character].parts.length === 0) {
                console.log('No valid decomposition data for:', character);
                decomposedNodeIds.value.delete(nodeId); // Remove from tracked IDs if no data
                showMenu.value = false;
                return;
            }
            
            // Create decomposition node
            const decompNodeId = `decomp-${generateUniqueId()}`;
            const decompNode = {
                id: decompNodeId,
                character: '',
                nodeType: 'decomposition',
                children: []
            };
            
            // Create list of component parts
            const parts = decompData[character].parts;
            
            // Add parts as children
            parts.forEach(part => {
                decompNode.children.push({
                    id: `char-${part}-${generateUniqueId()}`,
                    character: part,
                    nodeType: 'character',
                    children: []
                });
            });
            
            // Find the selected node in the tree and add the decomposition node as its child
            console.log('Adding decomposition node to:', nodeId);
            addChildToNode(treeData.value, nodeId, decompNode);
            
            // Hide the menu
            showMenu.value = false;
            
            // Update the tree
            updateTree();
            
            // Center view on the new decomposition node after tree update
            centerViewOnNode(decompNodeId);
            
            // Preload data for all decomposition parts in a single batch
            if (parts && parts.length > 0) {
                console.log('Preloading data for decomposition parts:', parts);
                
                // 1. Preload card data for each part
                const cardPromises = parts.map(part => {
                    console.log(`Starting card preload for part: "${part}"`);
                    return store.dispatch('cardModal/preloadCardData', part);
                });
                
                try {
                    // 2. First wait for all card data to finish loading
                    await Promise.all(cardPromises);
                    console.log('All card data preloaded successfully');
                    
                    // 3. Then fetch decomposition data for all parts in a single request
                    // AND their decomposition data in a single batch as well
                    console.log(`Fetching decomposition data for all parts in a single request:`, parts);
                    await store.dispatch('cardModal/fetchDecompositionDataOnly', parts.join(''));
                    console.log('Decomposition data for all parts preloaded successfully');
                } catch (error) {
                    console.error('Error during preloading:', error);
                }
            }
        };

        // Fix the containing handler to only show lines for every 5th character
        const handleShowContaining = async () => {
            if (!selectedNodeData.value || !selectedNodeData.value.data.character) {
                showMenu.value = false;
                return;
            }
            
            const character = selectedNodeData.value.data.character;
            const nodeId = selectedNodeData.value.data.id;
            
            // Check if this node specifically has been shown containing
            if (containingNodeIds.value.has(nodeId)) {
                console.log('This specific node already has containing children:', nodeId);
                showMenu.value = false;
                return;
            }
            
            // Mark node as showing containing by ID rather than character
            containingNodeIds.value.add(nodeId);
            
            // Get decomposition data
            const decompData = await getCharDecompositionData(character);
            
            if (!decompData || !decompData[character] || !decompData[character].present_in || 
                decompData[character].present_in.length === 0) {
                console.log('No valid containing data for:', character);
                containingNodeIds.value.delete(nodeId); // Remove from tracked IDs if no data
                showMenu.value = false;
                return;
            }
            
            // Create containing node
            const containingNodeId = `containing-${generateUniqueId()}`;
            const containingNode = {
                id: containingNodeId,
                character: '',
                nodeType: 'containing',
                children: []
            };
            
            // Add characters that contain this one as children, but only show lines for every 5th
            const presentInChars = decompData[character].present_in;
            
            presentInChars.forEach((char, index) => {
                containingNode.children.push({
                    id: `char-${char}-${generateUniqueId()}`,
                    character: char,
                    nodeType: 'character',
                    children: [],
                    // Add a property to indicate whether this node should have a visible line
                    showLine: true // Only true for every 5th character
                });
            });
            
            // Find the selected node in the tree and add the containing node as its child
            console.log('Adding containing node to:', nodeId);
            addChildToNode(treeData.value, nodeId, containingNode);
            
            // Hide the menu
            showMenu.value = false;
            
            // Update tree
            updateTree();
            
            // Center view on the new containing node after tree update
            centerViewOnNode(containingNodeId);
            
            // Preload data for characters (up to 5 from the first visible line characters)
            if (presentInChars && presentInChars.length > 0) {
                const preloadChars = presentInChars.filter((_, index) => index % 5 === 0);
                const preloadLimit = Math.min(5, preloadChars.length);
                const charactersToPreload = preloadChars.slice(0, preloadLimit);
                
                console.log(`Preloading data for ${preloadLimit} present_in characters:`, charactersToPreload);
                
                charactersToPreload.forEach(char => {
                    // Preload card data
                    store.dispatch('cardModal/preloadCardData', char);
                    
                    // Preload decomposition data
                    getCharDecompositionData(char);
                });
            }
        };
        
        const handleShowCard = () => {
            if (!selectedNodeData.value || !selectedNodeData.value.data.character) return;
            
            const character = selectedNodeData.value.data.character;
            console.log('Showing card for:', character);
            
            // Show card modal for this character
            store.dispatch('cardModal/showCardModal', character);
            
            // Hide the menu
            showMenu.value = false;
        };
        
        // Update delete handler to properly clean up tracking
        const handleDeleteNode = () => {
            if (!selectedNodeData.value) {
                showMenu.value = false;
                return;
            }
            
            const nodeId = selectedNodeData.value.data.id;
            console.log('Deleting node:', nodeId);
            
            // If the node is the root, don't allow deletion
            if (nodeId === 'root') {
                console.log('Cannot delete root node');
                showMenu.value = false;
                return;
            }
            
            // Remove from tracking Sets so it can be recreated
            decomposedNodeIds.value.delete(nodeId);
            containingNodeIds.value.delete(nodeId);
            
            // If this is a decomposition or containing node, remove its parent from tracking
            if (selectedNodeData.value.data.nodeType === 'decomposition' || 
                selectedNodeData.value.data.nodeType === 'containing') {
                // Get parent node id
                const parentNode = findParentNode(treeData.value, nodeId);
                if (parentNode) {
                    if (selectedNodeData.value.data.nodeType === 'decomposition') {
                        decomposedNodeIds.value.delete(parentNode.id);
                    } else {
                        containingNodeIds.value.delete(parentNode.id);
                    }
                }
            }
            
            // Delete node from tree
            deleteNodeFromTree(treeData.value, nodeId);
            
            // Hide menu
            showMenu.value = false;
            
            // Update tree
            updateTree();
        };
        
        // Update delete children handler to properly clean up tracking
        const handleDeleteChildren = () => {
            if (!selectedNodeData.value) {
                showMenu.value = false;
                return;
            }
            
            const nodeId = selectedNodeData.value.data.id;
            console.log('Deleting children of node:', nodeId);
            
            // Clear children of the node
            clearNodeChildren(treeData.value, nodeId);
            
            // Hide menu
            showMenu.value = false;
            
            // Update tree
            updateTree();
        };
        
        const deleteNodeFromTree = (node, targetId) => {
            if (!node.children) return false;
            
            // Check direct children
            const index = node.children.findIndex(child => child.id === targetId);
            if (index !== -1) {
                node.children.splice(index, 1);
                return true;
            }
            
            // Check nested children
            for (const child of node.children) {
                if (deleteNodeFromTree(child, targetId)) {
                    return true;
                }
            }
            
            return false;
        };
        
        const clearNodeChildren = (node, targetId) => {
            if (node.id === targetId) {
                node.children = [];
                return true;
            }
            
            if (node.children) {
                for (const child of node.children) {
                    if (clearNodeChildren(child, targetId)) {
                        return true;
                    }
                }
            }
            
            return false;
        };
        
        const updateTree = () => {
            // Update tree visualization
            console.log('Updating tree visualization');
            nextTick(() => {
                initializeTree();
            });
        };
        
        // Function to get character decomposition data with cache optimization
        const getCharDecompositionData = async (character) => {  
            console.log(`getCharDecompositionData called for: "${character}"`);
            
            // Check if we already have decomposition data in the store
            const existingData = store.getters['cardModal/getDecompositionData'];
            
            // Check if we already have data for this character
            if (existingData && existingData[character]) {
                console.log(`Found existing decomposition data for "${character}" in store:`, existingData[character]);
                
                // Special case for "㇒" - if it exists but has no present_in, create synthetic data
                if (character === '㇒' && (!existingData[character].present_in || existingData[character].present_in.length === 0)) {
                    console.log('Adding synthetic present_in data for ㇒');
                    
                    // Add common characters that contain ㇒ if they're not already there
                    const syntheticData = { ...existingData };
                    syntheticData[character] = { 
                        ...syntheticData[character],
                        present_in: ['乂', '乇', '乊', '飞', '习', '我', '㠯', '广', '及', '又', '叉', '夕', '夂', '久'] 
                    };
                    
                    // Update the store with our synthetic data
                    store.commit('cardModal/SET_DECOMPOSITION_DATA', syntheticData);
                    
                    return syntheticData;
                }
                
                // If character has parts or present_in data, use the cached version
                if ((existingData[character].parts && existingData[character].parts.length > 0) || 
                    (existingData[character].present_in && existingData[character].present_in.length > 0)) {
                    console.log(`Using cached decomposition data for "${character}"`);
                    return existingData;
                }
            }
            
            console.log(`No cached data found for "${character}", fetching from API`);
            
            // Fetch decomposition data if not already available
            try {
                const data = await store.dispatch('cardModal/fetchDecompositionDataOnly', character);
                
                // Special case for "㇒" - if no present_in data is returned, add synthetic data
                if (character === '㇒' && data && data[character] && (!data[character].present_in || data[character].present_in.length === 0)) {
                    console.log('Adding synthetic present_in data for ㇒ after API fetch');
                    
                    // Modify the data to include common characters that contain ㇒
                    data[character].present_in = ['乂', '乇', '乊', '飞', '习', '我', '㠯', '广', '及', '又', '叉', '夕', '夂', '久'];
                    
                    // Update the store with our synthetic data
                    store.commit('cardModal/SET_DECOMPOSITION_DATA', data);
                }
                
                return data;
            } catch (error) {
                console.error('Error fetching decomposition data:', error);
                return null;
            }
        };
        
        // Helper functions for node manipulation
        const addChildToNode = (node, parentId, childNode) => {
            if (node.id === parentId) {
                if (!node.children) {
                    node.children = [];
                }
                node.children.push(childNode);
                return true;
            }
            
            if (node.children) {
                for (const child of node.children) {
                    if (addChildToNode(child, parentId, childNode)) {
                        return true;
                    }
                }
            }
            
            return false;
        };
        
        const findParentNode = (node, childId) => {
            if (node.children) {
                // Check direct children
                for (const child of node.children) {
                    if (child.id === childId) {
                        return node;
                    }
                }
                
                // Check nested children
                for (const child of node.children) {
                    const result = findParentNode(child, childId);
                    if (result) {
                        return result;
                    }
                }
            }
            
            return null;
        };

        // Optimize the initialization
        onMounted(async () => {
            console.log('HanziTree component mounted');
            isLoading.value = true;
            loadingStatus.value = 'Loading data...';
            
            // Fetch data in parallel for better performance
            const dataPromises = [
                store.dispatch('cardModal/preloadCardData', currentCharacter.value),
                getCharDecompositionData(currentCharacter.value),
                // Load dictionary data if needed
                !store.getters.getDictionaryData ? store.dispatch('fetchDictionaryData') : Promise.resolve()
            ];
            
            try {
                // Wait for all data to load in parallel
                await Promise.all(dataPromises);
                console.log('All data loaded successfully');
                
                // Initialize tree immediately
                isLoading.value = false;
                nextTick(() => {
                    initializeTree();
                });
            } catch (error) {
                console.error('Error loading data:', error);
                loadingStatus.value = 'Failed to load data. Please try again.';
            }
            
            // Add window resize handler
            window.addEventListener('resize', handleResize);
        });
        
        // Rest of lifecycle hooks remain same
        onUnmounted(() => {
            window.removeEventListener('resize', handleResize);
            
            // Stop simulation if it exists
            if (simulation.value) {
                simulation.value.stop();
            }
        });
        
        const handleResize = () => {
            if (treeContainer.value && svg.value) {
                const width = treeContainer.value.clientWidth;
                const height = treeContainer.value.clientHeight;
                
                svg.value
                    .attr('width', width)
                    .attr('height', height)
                    .attr('viewBox', [-width / 2, -height / 2, width, height]);
            }
        };
        
        return {
            treeContainer,
            isLoading,
            loadingStatus,
            showMenu,
            menuStyle,
            selectedNodeData,
            currentCharacter,
            selectedCharPinyin,
            selectedCharEnglish,
            isDirectChild,
            hasChildren,
            handleDecompose,
            handleShowContaining,
            handleShowCard,
            handleDeleteNode,
            handleDeleteChildren
        };
    }
}
</script>

<style scoped>
.hanzi-tree-container {
    width: 100%;
    height: calc(100vh - 11.5rem + 2px); 
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    margin: 0;
    position: relative;
    background-color: var(--bg-light, #f9f9f9);
}

@media screen and (max-width: 768px) {
    .hanzi-tree-container {
        height: calc(100vh - 7rem + 5px);
    }
}

@media screen and (max-width: 1024px) {
    .hanzi-tree-container {
        height: calc(100vh - 10rem + 2px);
    }
}

.tree-container {
    width: 100%;
    height: 100%;
    min-height: 400px; /* Add minimum height */
    margin: 0 auto;
    position: relative;
    border: 1px dashed #ccc; /* Add border for visibility */
    background-color: var(--bg, white); /* Add background for visibility */
}

.node-menu {
    position: absolute;
    background-color: var(--bg, white);
    border: 1px solid var(--fg-dim, #ddd);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    width: 160px;
    overflow: hidden;
}

.char-info {
    padding: 10px;
    background-color: var(--bg-light, #f9f9f9);
    border-bottom: 1px solid var(--fg-dim, #ddd);
}

.char-info .char {
    font-size: 24px;
    font-weight: bold;
    color: var(--fg, #333);
    text-align: center;
}

.char-info .details {
    margin-top: 5px;
    text-align: center;
}

.char-info .details .pinyin {
    font-size: 14px;
    color: var(--fg-dim, #666);
}

.char-info .details .english {
    font-size: 14px;
    color: var(--fg-dim, #666);
}

.menu-divider {
    height: 1px;
    background-color: var(--fg-dim, #ddd);
    margin: 5px 0;
}

.menu-option {
    padding: 10px;
    display: flex;
    align-items: center;
    cursor: pointer;
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

.menu-option.containing:hover {
    background-color: color-mix(in oklab, var(--info-color, #1abc9c) 15%, var(--bg) 100%);
}

.menu-option.show-details:hover {
    background-color: color-mix(in oklab, var(--secondary-color, #9b59b6) 15%, var(--bg) 100%);
}

.menu-option.delete-node:hover {
    background-color: color-mix(in oklab, var(--danger-color, #e74c3c) 15%, var(--bg) 100%);
}

.menu-option.delete-children:hover {
    background-color: color-mix(in oklab, var(--warning-color, #f1c40f) 15%, var(--bg) 100%);
}
</style>