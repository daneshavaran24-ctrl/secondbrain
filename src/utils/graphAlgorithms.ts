// Graph algorithms for Ideas Knowledge Graph

export interface GraphNode {
  id: string;
  label: string;
  domain: string;
  tags: string[];
  description: string;
  feasibility: number;
  impact: number;
  stage: string;
}

export interface GraphLink {
  source: string;
  target: string;
  strength: number;
  type: 'tag' | 'category' | 'stage' | 'semantic' | 'swot' | 'risk';
}

export interface Cluster {
  id: string;
  nodes: string[];
  centroid: string;
  strength: number;
}

/**
 * Calculate cosine similarity between two texts
 */
export function cosineSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const allWords = [...new Set([...words1, ...words2])];
  const vector1 = allWords.map(w => words1.filter(word => word === w).length);
  const vector2 = allWords.map(w => words2.filter(word => word === w).length);
  
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Calculate semantic similarity between two ideas
 */
export function calculateSemanticSimilarity(node1: GraphNode, node2: GraphNode): number {
  const text1 = `${node1.label} ${node1.description}`;
  const text2 = `${node2.label} ${node2.description}`;
  return cosineSimilarity(text1, text2);
}

/**
 * Calculate connection strength between two nodes
 */
export function calculateConnectionStrength(
  node1: GraphNode, 
  node2: GraphNode
): { strength: number; types: string[] } {
  let strength = 0;
  const types: string[] = [];
  
  // Tag-based connection
  const commonTags = node1.tags.filter(tag => node2.tags.includes(tag));
  if (commonTags.length > 0) {
    strength += commonTags.length * 0.3;
    types.push('tag');
  }
  
  // Category-based connection
  if (node1.domain === node2.domain) {
    strength += 0.2;
    types.push('category');
  }
  
  // Stage-based connection
  if (node1.stage === node2.stage) {
    strength += 0.15;
    types.push('stage');
  }
  
  // Semantic similarity
  const semanticSim = calculateSemanticSimilarity(node1, node2);
  if (semanticSim > 0.3) {
    strength += semanticSim * 0.35;
    types.push('semantic');
  }
  
  return { strength: Math.min(strength, 1), types };
}

/**
 * Detect clusters using simple community detection
 */
export function detectClusters(nodes: GraphNode[], links: GraphLink[]): Cluster[] {
  const clusters: Cluster[] = [];
  const visited = new Set<string>();
  
  // Build adjacency list
  const adjacencyList = new Map<string, Set<string>>();
  nodes.forEach(node => adjacencyList.set(node.id, new Set()));
  
  links.forEach(link => {
    if (link.strength > 0.3) {
      adjacencyList.get(link.source)?.add(link.target);
      adjacencyList.get(link.target)?.add(link.source);
    }
  });
  
  // DFS to find connected components
  function dfs(nodeId: string, cluster: string[]): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    cluster.push(nodeId);
    
    adjacencyList.get(nodeId)?.forEach(neighborId => {
      dfs(neighborId, cluster);
    });
  }
  
  // Find clusters
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const cluster: string[] = [];
      dfs(node.id, cluster);
      
      if (cluster.length > 1) {
        // Find centroid (node with highest connectivity)
        const centroid = cluster.reduce((best, nodeId) => {
          const connectivity = adjacencyList.get(nodeId)?.size || 0;
          const bestConnectivity = adjacencyList.get(best)?.size || 0;
          return connectivity > bestConnectivity ? nodeId : best;
        });
        
        clusters.push({
          id: `cluster-${clusters.length}`,
          nodes: cluster,
          centroid,
          strength: cluster.length / nodes.length
        });
      }
    }
  });
  
  return clusters;
}

/**
 * Find hub ideas (ideas with most connections)
 */
export function findHubIdeas(nodes: GraphNode[], links: GraphLink[], topN = 5): GraphNode[] {
  const connectionCounts = new Map<string, number>();
  
  // Count connections for each node
  nodes.forEach(node => connectionCounts.set(node.id, 0));
  
  links.forEach(link => {
    if (link.strength > 0.3) {
      connectionCounts.set(link.source, (connectionCounts.get(link.source) || 0) + 1);
      connectionCounts.set(link.target, (connectionCounts.get(link.target) || 0) + 1);
    }
  });
  
  // Sort by connection count
  return nodes
    .map(node => ({ node, count: connectionCounts.get(node.id) || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map(item => item.node);
}

/**
 * Suggest related ideas based on connections
 */
export function suggestRelatedIdeas(
  ideaId: string, 
  nodes: GraphNode[], 
  links: GraphLink[],
  limit = 5
): GraphNode[] {
  const relatedLinks = links
    .filter(link => link.source === ideaId || link.target === ideaId)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit);
  
  const relatedNodeIds = relatedLinks.map(link => 
    link.source === ideaId ? link.target : link.source
  );
  
  return nodes.filter(node => relatedNodeIds.includes(node.id));
}

/**
 * Calculate PageRank for nodes
 */
export function calculatePageRank(
  nodes: GraphNode[], 
  links: GraphLink[], 
  dampingFactor = 0.85,
  maxIterations = 100
): Map<string, number> {
  const pageRank = new Map<string, number>();
  const initialRank = 1 / nodes.length;
  
  // Initialize PageRank
  nodes.forEach(node => pageRank.set(node.id, initialRank));
  
  // Build adjacency list
  const outgoingLinks = new Map<string, string[]>();
  nodes.forEach(node => outgoingLinks.set(node.id, []));
  
  links.forEach(link => {
    if (link.strength > 0.3) {
      outgoingLinks.get(link.source)?.push(link.target);
    }
  });
  
  // Iterate PageRank calculation
  for (let i = 0; i < maxIterations; i++) {
    const newPageRank = new Map<string, number>();
    
    nodes.forEach(node => {
      let rank = (1 - dampingFactor) / nodes.length;
      
      // Sum contributions from incoming links
      nodes.forEach(otherNode => {
        const outLinks = outgoingLinks.get(otherNode.id) || [];
        if (outLinks.includes(node.id)) {
          const otherRank = pageRank.get(otherNode.id) || initialRank;
          rank += dampingFactor * (otherRank / outLinks.length);
        }
      });
      
      newPageRank.set(node.id, rank);
    });
    
    // Update PageRank
    newPageRank.forEach((rank, nodeId) => pageRank.set(nodeId, rank));
  }
  
  return pageRank;
}
