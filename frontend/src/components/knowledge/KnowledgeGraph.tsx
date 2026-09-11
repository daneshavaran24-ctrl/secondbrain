import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Network, 
  Search, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { KnowledgeItem } from '@/types';


interface GraphNode {
  id: string;
  title: string;
  category: string;
  group: number;
  size: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
  type: 'semantic' | 'tag' | 'category';
}

interface KnowledgeGraphProps {
  knowledge?: KnowledgeItem[];
  onNodeSelect?: (item: KnowledgeItem) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  knowledge = [],
  onNodeSelect
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (knowledge.length === 0) return;
    
    // Create nodes from knowledge items
    const graphNodes: GraphNode[] = knowledge.map((item, index) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      group: getCategoryGroup(item.category),
      size: calculateNodeSize(item)
    }));

    // Create links based on relationships
    const graphLinks: GraphLink[] = [];
    
    // Add tag-based connections
    knowledge.forEach((item1, i) => {
      knowledge.slice(i + 1).forEach(item2 => {
        const commonTags = item1.tags.filter(tag => item2.tags.includes(tag));
        if (commonTags.length > 0) {
          graphLinks.push({
            source: item1.id,
            target: item2.id,
            value: commonTags.length,
            type: 'tag'
          });
        }
      });
    });

    // Add category-based connections
    knowledge.forEach((item1, i) => {
      knowledge.slice(i + 1).forEach(item2 => {
        if (item1.category === item2.category && !graphLinks.find(
          link => (link.source === item1.id && link.target === item2.id) ||
                  (link.source === item2.id && link.target === item1.id)
        )) {
          graphLinks.push({
            source: item1.id,
            target: item2.id,
            value: 1,
            type: 'category'
          });
        }
      });
    });

    // Add semantic connections based on embeddings (simplified)
    knowledge.forEach((item1, i) => {
      knowledge.slice(i + 1).forEach(item2 => {
        if (item1.embedding && item2.embedding) {
          const similarity = cosineSimilarity(item1.embedding, item2.embedding);
          if (similarity > 0.7 && !graphLinks.find(
            link => (link.source === item1.id && link.target === item2.id) ||
                    (link.source === item2.id && link.target === item1.id)
          )) {
            graphLinks.push({
              source: item1.id,
              target: item2.id,
              value: similarity,
              type: 'semantic'
            });
          }
        }
      });
    });

    setNodes(graphNodes);
    setLinks(graphLinks);
  }, [knowledge]);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = isFullscreen ? window.innerWidth - 100 : 800;
    const height = isFullscreen ? window.innerHeight - 200 : 600;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    const container = svg.append("g");

    // Filter nodes and links based on search and category
    const filteredNodes = nodes.filter(node => {
      const matchesSearch = searchTerm === '' || 
        node.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || 
        node.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(link => 
      filteredNodeIds.has(typeof link.source === 'string' ? link.source : link.source.id) &&
      filteredNodeIds.has(typeof link.target === 'string' ? link.target : link.target.id)
    );

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(filteredNodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(filteredLinks)
        .id(d => d.id)
        .distance(d => 100 / d.value))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => d.size + 5));

    // Create arrow markers for directed edges
    const defs = container.append("defs");
    defs.append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    // Create links
    const link = container.append("g")
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
      .attr("stroke", d => getLinkColor(d.type))
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.value) * 2)
      .attr("marker-end", "url(#arrowhead)");

    // Create nodes
    const node = container.append("g")
      .selectAll("circle")
      .data(filteredNodes)
      .join("circle")
      .attr("r", (d: any) => d.size)
      .attr("fill", (d: any) => getCategoryColor(d.category))
      .attr("stroke", (d: any) => d.id === selectedNode ? "#000" : "#fff")
      .attr("stroke-width", (d: any) => d.id === selectedNode ? 3 : 1.5)
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      )
      .on("click", (event, d) => {
        setSelectedNode(d.id);
        const item = knowledge.find(k => k.id === d.id);
        if (item) onNodeSelect?.(item);
      })
      .on("mouseover", function(event, d: any) {
        d3.select(this).attr("r", d.size * 1.5);
        
        // Show tooltip
        const tooltip = container.append("g")
          .attr("class", "tooltip")
          .attr("transform", `translate(${d.x! + d.size + 10},${d.y! - 10})`);
        
        const rect = tooltip.append("rect")
          .attr("rx", 4)
          .attr("ry", 4)
          .attr("fill", "rgba(0,0,0,0.8)")
          .attr("stroke", "#ccc");
        
        const text = tooltip.append("text")
          .attr("fill", "white")
          .attr("font-size", "12px")
          .attr("x", 8)
          .attr("y", 16)
          .text(d.title);
        
        const bbox = text.node()!.getBBox();
        rect.attr("width", bbox.width + 16)
            .attr("height", bbox.height + 8);
      })
      .on("mouseout", function(event, d: any) {
        d3.select(this).attr("r", d.size);
        container.selectAll(".tooltip").remove();
      });

    // Add labels
    const labels = container.append("g")
      .selectAll("text")
      .data(filteredNodes)
      .join("text")
      .text((d: any) => d.title.length > 15 ? d.title.substring(0, 15) + "..." : d.title)
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("dy", -5)
      .attr("fill", "#333");

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);

      node
        .attr("cx", (d: any) => d.x!)
        .attr("cy", (d: any) => d.y!);

      labels
        .attr("x", (d: any) => d.x!)
        .attr("y", (d: any) => d.y!);
    });

    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Add zoom controls
    const controls = svg.append("g")
      .attr("class", "controls")
      .attr("transform", "translate(10, 10)");

    const zoomInButton = controls.append("g")
      .attr("class", "zoom-control")
      .on("click", () => {
        svg.transition().call(zoom.scaleBy, 1.5);
      });

    zoomInButton.append("rect")
      .attr("width", 30)
      .attr("height", 30)
      .attr("fill", "rgba(255,255,255,0.8)")
      .attr("stroke", "#ccc")
      .attr("rx", 4);

    zoomInButton.append("text")
      .attr("x", 15)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .text("+");

    const zoomOutButton = controls.append("g")
      .attr("class", "zoom-control")
      .attr("transform", "translate(0, 35)")
      .on("click", () => {
        svg.transition().call(zoom.scaleBy, 0.7);
      });

    zoomOutButton.append("rect")
      .attr("width", 30)
      .attr("height", 30)
      .attr("fill", "rgba(255,255,255,0.8)")
      .attr("stroke", "#ccc")
      .attr("rx", 4);

    zoomOutButton.append("text")
      .attr("x", 15)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .text("-");

  }, [nodes, links, selectedNode, searchTerm, filterCategory, isFullscreen]);

  const getCategoryGroup = (category: string): number => {
    const groups = { 'Projects': 1, 'Areas': 2, 'Resources': 3, 'Archives': 4 };
    return groups[category as keyof typeof groups] || 0;
  };

  const calculateNodeSize = (item: KnowledgeItem): number => {
    let size = 8;
    size += item.tags.length * 2;
    size += item.related_items?.length || 0;
    return Math.min(Math.max(size, 8), 25);
  };

  const getCategoryColor = (category: string): string => {
    const colors = {
      'Projects': '#ff6b6b',
      'Areas': '#4ecdc4',
      'Resources': '#45b7d1',
      'Archives': '#96ceb4'
    };
    return colors[category as keyof typeof colors] || '#ddd';
  };

  const getLinkColor = (type: string): string => {
    const colors = {
      'semantic': '#ff6b6b',
      'tag': '#4ecdc4',
      'category': '#45b7d1'
    };
    return colors[type as keyof typeof colors] || '#999';
  };

  const cosineSimilarity = (a: number[], b: number[]): number => {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  };

  const resetGraph = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setSelectedNode(null);
  };

  return (
    <Card className={cn(
      "card-spacious border-2 border-border/50 shadow-medical",
      isFullscreen ? "fixed inset-4 z-50" : ""
    )}>
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-3 text-large-readable text-primary">
            <Network className="w-6 h-6" />
            گراف دانش
          </span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="btn-professional"
            >
              <Maximize2 className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={resetGraph}
              className="btn-professional"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Controls */}
        <div className="flex flex-wrap gap-6 mb-6">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-primary" />
            <Input
              placeholder="جستجو در گراف دانش..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-readable w-64"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-primary" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-readable w-48 bg-background"
            >
              <option value="all">همه دسته‌ها</option>
              <option value="Projects">پروژه‌ها</option>
              <option value="Areas">حوزه‌ها</option>
              <option value="Resources">منابع</option>
              <option value="Archives">آرشیو</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-6 mb-6 p-4 bg-muted/20 rounded-lg border border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#ff6b6b] shadow-sm"></div>
            <span className="text-readable font-medium">پروژه‌ها</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#4ecdc4] shadow-sm"></div>
            <span className="text-readable font-medium">حوزه‌ها</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#45b7d1] shadow-sm"></div>
            <span className="text-readable font-medium">منابع</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#96ceb4] shadow-sm"></div>
            <span className="text-readable font-medium">آرشیو</span>
          </div>
        </div>

        {/* Graph */}
        <div className="border-2 border-border/30 rounded-xl overflow-hidden shadow-inner">
          <svg
            ref={svgRef}
            className="w-full bg-gradient-to-br from-background to-muted/20"
            style={{ maxHeight: isFullscreen ? '80vh' : '600px' }}
          />
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center mt-6 p-4 bg-muted/20 rounded-lg">
          <span className="text-readable font-medium text-foreground">{nodes.length} گره</span>
          <span className="text-readable font-medium text-foreground">{links.length} ارتباط</span>
          {selectedNode && (
            <Badge variant="outline" className="text-sm px-3 py-1 border-primary/30 text-primary">
              گره انتخاب شده: {nodes.find(n => n.id === selectedNode)?.title}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};