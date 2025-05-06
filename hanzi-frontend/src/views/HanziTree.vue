<template>
    <BasePage page_title="Hanzi Tree" />
    <div class="hanzi-tree-container">
        <div class="tree-container" ref="treeContainer"></div>
        <div class="char-input-container">
            <input
                v-model="inputChar"
                maxlength="1"
                class="char-input"
                @input="handleInputChange"
                placeholder="汉"
            />
        </div>

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
            <div v-if="selectedNodeData?.data?.nodeType === 'character'" class="menu-option decompose" @click="handleDecompose">
                <span class="icon"><font-awesome-icon :icon="['fas', 'magnifying-glass']" /></span>
                <span>Decompose</span>
            </div>
            <div v-if="selectedNodeData?.data?.nodeType === 'character'" class="menu-option containing" @click="handleShowContaining">
                <span class="icon"><font-awesome-icon :icon="['fas', 'sitemap']" /></span>
                <span>Show Chars Containing</span>
            </div>
            <div v-if="selectedNodeData?.data?.nodeType === 'character'" class="menu-option show-details" @click="handleShowCard">
                <span class="icon"><font-awesome-icon :icon="['fas', 'file']" /></span>
                <span>View Details</span>
            </div>
            <div v-if="isDirectChild" class="menu-option delete-node" @click="handleDeleteNode">
                <span class="icon"><font-awesome-icon :icon="['fas', 'trash']" /></span>
                <span>Delete Node</span>
            </div>
            <div v-if="hasChildren && selectedNodeData?.data?.nodeType === 'character'" class="menu-option delete-children" @click="handleDeleteChildren">
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

        const inputChar = ref('');

        const handleInputChange = async () => {
            const char = inputChar.value.trim().slice(0, 1); // Only allow one character
            if (!char) return;

            inputChar.value = char;
            currentCharacter.value = char;

            decomposedNodeIds.value.clear();
            containingNodeIds.value.clear();

            treeData.value = {
                character: char,
                id: 'root',
                nodeType: 'character',
                children: []
            };

            await Promise.all([
                store.dispatch('cardModal/preloadCardData', char),
                getCharDecompositionData(char)
            ]);

            updateTree();
            
            // Auto-decompose the root node after tree is rendered
            nextTick(() => {
                // Create a fake event for the decompose handler
                const fakeEvent = { preventDefault: () => {}, stopPropagation: () => {} };
                
                // Set the selected node to the root node
                selectedNodeData.value = {
                    data: treeData.value
                };
                
                // Call the decompose handler
                handleDecompose();
            });
        };
        
        // Methods for handling tree nodes
        const initializeTree = () => {
            
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

            // Add arrow marker definitions for main links (orange and blue)
            svg.value.append('defs').append('marker')
                .attr('id', 'arrow-main-orange')
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 15)
                .attr('refY', 0)
                .attr('markerWidth', 9)
                .attr('markerHeight', 9)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M0,-5L10,0L0,5')
                .attr('fill', '#e67e22'); // Orange for decomposition
            svg.value.append('defs').append('marker')
                .attr('id', 'arrow-main-blue')
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 15)
                .attr('refY', 0)
                .attr('markerWidth', 9)
                .attr('markerHeight', 9)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M0,-5L10,0L0,5')
                .attr('fill', '#3498db'); // Blue for containing
                
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
                    link.strength = 0.1; // Stronger link to maintain distance
                } else if (link.source.data.nodeType === 'character' && link.target.data.nodeType === 'containing') {
                    // Make containing nodes farther from parent character as well
                    link.distance = 100; // Farther distance for containing nodes
                    link.strength = 0.1; // Stronger link to maintain distance
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
                .force('charge', d3.forceManyBody().strength(-210))
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

            // Split visibleLinks into main (solid) and dashed
            const mainLinks = visibleLinks.filter(d => {
                // Main links: solid, not dashed
                return !((d.source.data.nodeType === 'decomposition' && d.target.data.nodeType === 'character') ||
                         (d.source.data.nodeType === 'containing' && d.target.data.nodeType === 'character'));
            });
            const dashedLinks = visibleLinks.filter(d => !mainLinks.includes(d));
                
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

            // Draw main links as arched paths with arrow
            const mainLinkElements = linkGroup.selectAll('path.main-link')
                .data(mainLinks)
                .join('path')
                .attr('class', 'main-link')
                .attr('fill', 'none')
                .attr('stroke', d => {
                    if (d.source.data.nodeType === 'character' && d.target.data.nodeType === 'decomposition' ||
                        d.source.data.nodeType === 'decomposition' && d.target.data.nodeType === 'character') {
                        return '#e67e22';
                    } else if (d.source.data.nodeType === 'containing' || d.target.data.nodeType === 'containing') {
                        return '#3498db';
                    }
                    return '#999';
                })
                .attr('stroke-width', 1)
                .attr('marker-end', d => {
                    if (d.source.data.nodeType === 'character' && d.target.data.nodeType === 'decomposition' ||
                        d.source.data.nodeType === 'decomposition' && d.target.data.nodeType === 'character') {
                        return 'url(#arrow-main-orange)';
                    } else if (d.source.data.nodeType === 'containing' || d.target.data.nodeType === 'containing') {
                        return 'url(#arrow-main-blue)';
                    }
                    return 'url(#arrow-main-orange)'; // fallback
                });

            // Add invisible hit areas for arched main links
            const mainLinkHitAreas = linkGroup.selectAll('path.main-link-hit-area')
                .data(mainLinks)
                .join('path')
                .attr('class', 'main-link-hit-area')
                .attr('fill', 'none')
                .attr('stroke', 'transparent')
                .attr('stroke-width', 18) // Large enough for easy interaction
                .style('pointer-events', 'stroke')
                .style('cursor', 'pointer') // Add pointer cursor
                .on('click', (event, d) => {
                    event.stopPropagation();
                    showNodeMenu(event, d.target); // Show menu for yellow/blue node
                });

            // Draw dashed links as lines
            const dashedLinkElements = linkGroup.selectAll('line.dashed-link')
                .data(dashedLinks)
                .join('line')
                .attr('class', 'dashed-link')
                .attr('stroke', d => {
                    if (d.source.data.nodeType === 'decomposition' || d.target.data.nodeType === 'decomposition') {
                        return '#e67e22';
                    } else if (d.source.data.nodeType === 'containing' || d.target.data.nodeType === 'containing') {
                        return '#3498db';
                    }
                    return '#999';
                })
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '5,5');
            
            // Update line hit areas during simulation tick
            const updateLineHitAreas = () => {
                // Update arched hit areas for main links
                mainLinkHitAreas.attr('d', d => {
                    const sx = d.source.x, sy = d.source.y;
                    const tx = d.target.x, ty = d.target.y;
                    const mx = (sx + tx) / 2;
                    const my = (sy + ty) / 2;
                    const dx = tx - sx, dy = ty - sy;
                    const norm = Math.sqrt(dx*dx + dy*dy) || 1;
                    const arch = 30;
                    const cx = mx - arch * (dy / norm);
                    const cy = my + arch * (dx / norm);
                    return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
                });
                // Update dashed links
                dashedLinkElements
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);
                nodeElements.attr('transform', d => `translate(${d.x},${d.y})`);
            };
            // Create nodes
            const nodeElements = nodeGroup.selectAll('g')
                .data(nodes)
                .join('g')
                .attr('class', 'node')
                .attr('id', d => `node-${d.data.id}`)
                .style('cursor', 'pointer') // Add pointer cursor on all nodes
                .call(drag(simulation.value));
                
            // Add shapes to nodes
            nodeElements.each(function(d) {
                const sel = d3.select(this);
                if (d.data.nodeType === 'decomposition' || d.data.nodeType === 'containing') {
                    // Circle for yellow/blue nodes
                    sel.append('circle')
                        .attr('r', getNodeRadius(d)*.8)
                        .attr('fill', getNodeColor(d.data.nodeType))
                        .attr('stroke', '#0000')
                        .attr('stroke-width', 2);
                } else {
                    // Rect for other nodes
                    sel.append('rect')
                        .attr('width', getNodeRadius(d)*1.4)
                        .attr('height', getNodeRadius(d)*1.4)
                        .attr('x', -getNodeRadius(d)*0.7)
                        .attr('y', -getNodeRadius(d)*0.7)
                        .attr('fill', getNodeColor(d.data.nodeType))
                        .attr('stroke', '#0000')
                        .attr('stroke-width', 2);
                }
            });
                
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
                // Update arched main links
                mainLinkElements.attr('d', d => {
                    // Quadratic Bezier: from source to target, with control point offset for arch
                    const sx = d.source.x, sy = d.source.y;
                    const tx = d.target.x, ty = d.target.y;
                    // Control point: midpoint offset perpendicular to line
                    const mx = (sx + tx) / 2;
                    const my = (sy + ty) / 2;
                    const dx = tx - sx, dy = ty - sy;
                    const norm = Math.sqrt(dx*dx + dy*dy) || 1;
                    // Arch amount (adjust as needed)
                    const arch = 30;
                    const cx = mx - arch * (dy / norm);
                    const cy = my + arch * (dx / norm);
                    return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
                });
                updateLineHitAreas();
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
                const scale = 1.8; // Slightly zoomed in for better visibility
                
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
            
            // Position menu properly relative to the click position
            // First, get the container's bounding rect
            const boundingRect = treeContainer.value.getBoundingClientRect();
            
            // Calculate appropriate menu size
            const menuWidth = 160; // Width of the menu in pixels
            const menuHeight = 250; // Approximate max height of the menu
            
            // Get coordinates relative to the SVG container
            // Use the node's x,y for D3 events, or clientX,clientY for DOM events
            let leftPos, topPos;
            
            if (event.sourceEvent || event.clientX === undefined) {
                // D3 drag or zoom event wraps the original event
                const sourceEvent = event.sourceEvent || event;
                leftPos = sourceEvent.clientX - boundingRect.left;
                topPos = sourceEvent.clientY - boundingRect.top;
            } else {
                // For clicks directly on nodes, we have the d3 node position
                // Convert the D3 coordinates to screen coordinates
                const transform = d3.zoomTransform(svg.value.node());
                leftPos = transform.applyX(d.x) + boundingRect.width/2;
                topPos = transform.applyY(d.y) + boundingRect.height/2;
            }
            
            // Constrain to container boundaries
            // Right edge check
            if (leftPos + menuWidth > boundingRect.width) {
                leftPos = leftPos - menuWidth;
            }
            
            // Bottom edge check
            if (topPos + menuHeight > boundingRect.height) {
                topPos = topPos - menuHeight;
            }
            
            // Ensure menu doesn't go off-screen to the left or top
            leftPos = Math.max(0, leftPos);
            topPos = Math.max(0, topPos);
            
            // Set menu position
            menuStyle.value = {
                top: `${topPos}px`,
                left: `${leftPos}px`
            };
            
            // Special handling for decomposition and containing nodes
            if (d.data.nodeType === 'decomposition' || d.data.nodeType === 'containing') {
                // Find parent node (the character being decomposed or showing containing)
                const parentNode = findParentNode(treeData.value, d.data.id);
                if (parentNode && parentNode.character) {
                    // Set character information
                    const parentChar = parentNode.character;
                    
                    // Get child nodes (components or containing characters)
                    const childChars = d.children?.map(child => child.data.character).filter(Boolean) || [];
                    const maxDisplayChars = 5; // Maximum number of characters to display
                    let childText = '';
                    
                    if (childChars.length > 0) {
                        childText = childChars.slice(0, maxDisplayChars).join(', ');
                        if (childChars.length > maxDisplayChars) {
                            childText += ` +${childChars.length - maxDisplayChars} more`;
                        }
                    }
                    
                    if (d.data.nodeType === 'decomposition') {
                        selectedCharPinyin.value = `${parentChar} decomposed into:`;
                        selectedCharEnglish.value = childText || 'No components';
                    } else { // containing
                        selectedCharPinyin.value = `${parentChar} contained in:`;
                        selectedCharEnglish.value = childText || 'No characters';
                    }
                } else {
                    selectedCharPinyin.value = d.data.nodeType === 'decomposition' ? 'Decomposition node' : 'Containing node';
                    selectedCharEnglish.value = '';
                }
                
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
            
            
            // Check if this node specifically has been decomposed
            if (decomposedNodeIds.value.has(nodeId)) {
                showMenu.value = false;
                return;
            }
            
            // Mark node as decomposed by ID rather than character
            decomposedNodeIds.value.add(nodeId);
            
            // Get decomposition data
            const decompData = await getCharDecompositionData(character);
            
            if (!decompData || !decompData[character] || !decompData[character].parts || 
                decompData[character].parts.length === 0) {
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
            addChildToNode(treeData.value, nodeId, decompNode);
            
            // Hide the menu
            showMenu.value = false;
            
            // Update the tree
            updateTree();
            
            // Center view on the new decomposition node after tree update
            centerViewOnNode(decompNodeId);
            
            // Preload data for all decomposition parts in a single batch
            if (parts && parts.length > 0) {
                
                // 1. Preload card data for each part
                const cardPromises = parts.map(part => {
                    return store.dispatch('cardModal/preloadCardData', part);
                });
                
                try {
                    // 2. First wait for all card data to finish loading
                    await Promise.all(cardPromises);
                    
                    // 3. Then fetch decomposition data for all parts in a single request
                    // AND their decomposition data in a single batch as well
                    await store.dispatch('cardModal/fetchDecompositionDataOnly', parts.join(''));
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
                showMenu.value = false;
                return;
            }
            
            // Mark node as showing containing by ID rather than character
            containingNodeIds.value.add(nodeId);
            
            // Get decomposition data
            const decompData = await getCharDecompositionData(character);
            
            if (!decompData || !decompData[character] || !decompData[character].present_in || 
                decompData[character].present_in.length === 0) {
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
            
            // If the node is the root, don't allow deletion
            if (nodeId === 'root') {
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
            nextTick(() => {
                initializeTree();
            });
        };
        
        // Function to get character decomposition data with cache optimization
        const getCharDecompositionData = async (character) => {  
            
            // Check if we already have decomposition data in the store
            const existingData = store.getters['cardModal/getDecompositionData'];
            
            // Check if we already have data for this character
            if (existingData && existingData[character]) {
                
                // If character has parts or present_in data, use the cached version
                if ((existingData[character].parts && existingData[character].parts.length > 0) || 
                    (existingData[character].present_in && existingData[character].present_in.length > 0)) {
                    return existingData;
                }
            }
            
            
            // Fetch decomposition data if not already available
            try {
                const data = await store.dispatch('cardModal/fetchDecompositionDataOnly', character);
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
            handleDeleteChildren,
            inputChar,
            handleInputChange
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
    z-index: 11;
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


.char-input-container {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 12;
    background: var(--bg, white);
    padding: 4px 8px;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.char-input {
    width: 2.5em;
    font-size: 20px;
    text-align: center;
    border: 1px solid #ccc;
    border-radius: 4px;
    outline: none;
    background: transparent;
    color: var(--fg, #333);
}

</style>