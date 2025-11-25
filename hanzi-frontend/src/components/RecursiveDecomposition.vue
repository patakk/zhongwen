<template>
  <div ref="svgContainer" class="d3-tree-container">
    <svg :width="width" :height="height" style="background:transparent; width:100%; height:auto; display:block;">
      <g :transform="`translate(${margin.left},${margin.top})`">
        <!-- Render links -->
        <g>
          <path v-for="(link, i) in links" :key="i"
                :d="`M${link.source.x},${link.source.y+nodeRadius} C${link.source.x},${(link.source.y+link.target.y)/2} ${link.target.x},${(link.source.y+link.target.y)/2} ${link.target.x},${link.target.y-nodeRadius}`"
                :stroke="styleParams.linkStroke" :stroke-width="styleParams.linkStrokeWidth" fill="none" />
        </g>
        <!-- Render nodes -->
        <g>
          <g v-for="(node, i) in nodes" :key="i" :transform="`translate(${node.x},${node.y})`">
            <!-- Make foreignObject wider to accommodate horizontal layout -->
            <foreignObject :width="nodeSize + 70" :height="nodeSize" x="-20" y="-20">
              <PreloadWrapper :character="node.data.name">
                <div class="node-container">
                  <span class="d3-tree-char" :style="{ color: node.depth === 0 ? styleParams.rootColor : node.depth === 1 ? styleParams.firstChildColor : styleParams.nodeColor }">{{ node.data.name }}</span>
                  <span v-if="charInfoCache[node.data.name] && getFirstPinyin(charInfoCache[node.data.name])" class="d3-tree-pinyin">
                    {{ getFirstPinyin(charInfoCache[node.data.name]) }}
                  </span>
                </div>
              </PreloadWrapper>
            </foreignObject>
          </g>
        </g>
      </g>
    </svg>
  </div>
</template>

<script>
import * as d3 from 'd3';
import PreloadWrapper from './PreloadWrapper.vue';
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

function convertRecursiveToD3Tree(data) {
  // data: { root: { child1: {...}, child2: {...} } }
  const rootKey = Object.keys(data)[0];
  function buildNode(key, obj) {
    return {
      name: key,
      children: Object.entries(obj).map(([k, v]) => buildNode(k, v))
    };
  }
  return buildNode(rootKey, data[rootKey]);
}

const themeStyles = {
  light: {
    linkStroke: '#8885',
    linkStrokeWidth: 1.5,
    linkCurve: true,
    rootColor: '#666',
    firstChildColor: '#111',
    nodeColor: '#999',
  },
  dark: {
    linkStroke: '#eee3',
    linkStrokeWidth: 1.5,
    linkCurve: true,
    rootColor: '#777',
    firstChildColor: '#fff',
    nodeColor: '#555',
  },
  theme1: {
    linkStroke: '#b48f3c88',
    linkStrokeWidth: 2,
    linkCurve: true,
    rootColor: '#666',
    firstChildColor: '#111',
    nodeColor: '#999',
  },
  theme2: {
    linkStroke: '#bbbbff22',
    linkStrokeWidth: 2,
    linkCurve: false,
    rootColor: '#777',
    firstChildColor: '#fff',
    nodeColor: '#555',
  }
};

export default {
  name: 'RecursiveDecomposition',
  props: { 
    data: { type: Object, required: true },
    maxDepth: { type: Number, default: Infinity }
  },
  components: { PreloadWrapper },
  setup() {
    const store = useStore();
    const currentTheme = computed(() => store.getters['theme/getCurrentTheme']);
    const styleParams = computed(() => themeStyles[currentTheme.value] || themeStyles.theme1);
    const charInfoCache = ref({});
    const isLoadingCharInfo = ref(false);

    return { currentTheme, styleParams, charInfoCache, isLoadingCharInfo };
  },
  data() {
    return {
      width: 400,
      height: 100,
      margin: { top: 30, right: 30, bottom: 30, left: 30 },
      nodeSize: 48,
      nodeRadius: 24,
      nodes: [],
      links: [],
      lastFetchedData: null // Track last data to prevent redundant fetches
    };
  },
  watch: {
    data: {
      handler(newData) { 
        this.renderTree();
        
        // Prevent redundant fetches for the same data
        if (JSON.stringify(newData) !== JSON.stringify(this.lastFetchedData)) {
          this.lastFetchedData = JSON.parse(JSON.stringify(newData));
          this.fetchCharInfo();
        }
      },
      immediate: true,
      deep: true
    }
  },
  mounted() {
    this.renderTree();
    this.fetchCharInfo();
  },
  methods: {
    renderTree() {
      if (!this.data || Object.keys(this.data).length === 0) return;
      const treeData = convertRecursiveToD3Tree(this.data);
      const svgWidth = this.$refs.svgContainer?.offsetWidth || 400;
      // Calculate tree depth based on maxDepth, not full tree
      const treeDepth = Math.min(this.maxDepth, d3.hierarchy(treeData).height || 1);
      const svgHeight = 100 * (Math.max(treeDepth,2));
      let bottomv = 30;
    //   if (treeDepth == 1) {
    //     bottomv = -150;
    //   }
      this.width = svgWidth;
      this.height = svgHeight;
      const root = d3.hierarchy(treeData);
      const treeLayout = d3.tree().size([
        svgWidth - this.margin.left - this.margin.right,
        svgHeight - this.margin.top - bottomv
      ]);
      treeLayout(root);
      // Only include nodes/links up to maxDepth
      const nodes = root.descendants().filter(d => d.depth <= this.maxDepth);
      this.nodes = nodes;
      this.links = root.links().filter(l => l.source.depth < this.maxDepth && l.target.depth <= this.maxDepth);
    },
    async fetchCharInfo() {
      // Prevent concurrent or redundant calls
      if (this.isLoadingCharInfo || !this.nodes || this.nodes.length === 0) return;
      
      this.isLoadingCharInfo = true;
      
      // Get all characters at once
      const characters = this.nodes.map(node => node.data.name);
      
      // Get Vuex store instance
      const store = this.$store || useStore();
      
      try {
        // Make a single API request for all characters
        const result = await store.dispatch('fetchSimpleCharInfo', characters);
        this.charInfoCache = result;
      } catch (error) {
        console.error('Error fetching character info for decomposition:', error);
      } finally {
        this.isLoadingCharInfo = false;
      }
    },
    getFirstPinyin(charInfo) {
      if (!charInfo || !charInfo.pinyin || charInfo.pinyin.length === 0) return '';
      return charInfo.pinyin[0] === "N/A" ? "" : this.$toAccentedPinyin(charInfo.pinyin[0]); // Use global property to convert to accented pinyin
    }
  }
};
</script>

<style scoped>
.d3-tree-container {
  width: 100%;
  background: transparent;
  overflow-x: auto;
  overflow-y: visible;
}
.node-container {
  display: flex;
  flex-direction: row; /* Change to row for horizontal layout */
  align-items: center; /* Center items vertically */
  justify-content: flex-start; /* Start from left */
  overflow: visible;
  height: 48px; /* Match character height */
  width: 90px; /* Give enough width for character + pinyin */
}
.d3-tree-char {
  font-size: 1.85em;
  font-family: 'Kaiti', 'STKaiti', 'Kai', '楷体';
  font-family: var(--main-word-font, "Noto Serif SC", "Kaiti", sans-serif);
  cursor: pointer;
  display: block;
  text-align: center;
  width: 48px;
  height: 48px;
  line-height: 48px;
  background: transparent;
}

.d3-tree-pinyin {
  font-size: 0.8em;
  color: var(--fg);
  opacity: 0.6;
  margin-left: -.25em; /* Add margin between character and pinyin */
  display: block;
  text-align: left;
  line-height: 1.2;
  height: auto;
  overflow: visible;
  white-space: nowrap;
}
</style>
