import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Network,
  Info,
} from "lucide-react";
import {
  GraphNode,
  GraphLink,
  calculateConnectionStrength,
  detectClusters,
  findHubIdeas,
} from "@/utils/graphAlgorithms";

interface IdeasGraphProps {
  ideas: any[];
  onNodeClick?: (idea: any) => void;
  highlightedIdeaId?: string;
}

interface VisualNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  domain: string;
  tags: string[];
  description: string;
  feasibility: number;
  impact: number;
  stage: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface VisualLink extends d3.SimulationLinkDatum<VisualNode> {
  source: string | VisualNode;
  target: string | VisualNode;
  strength: number;
  type: 'tag' | 'category' | 'stage' | 'semantic' | 'swot' | 'risk';
  types: string[];
}

export function IdeasGraph({ ideas, onNodeClick, highlightedIdeaId }: IdeasGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<VisualNode[]>([]);
  const [links, setLinks] = useState<VisualLink[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDomain, setFilterDomain] = useState("all");
  const [selectedNode, setSelectedNode] = useState<VisualNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Process ideas into graph nodes and links
  useEffect(() => {
    if (!ideas || ideas.length === 0) return;

    const graphNodes: VisualNode[] = ideas.map((idea) => ({
      id: idea.id,
      label: idea.title,
      domain: idea.domain || 'personal',
      tags: idea.tags || [],
      description: idea.description || '',
      feasibility: idea.feasibility_score || 5,
      impact: idea.impact_score || 5,
      stage: idea.stage || 'idea',
    }));

    const graphLinks: VisualLink[] = [];

    // Calculate connections between all pairs of nodes
    for (let i = 0; i < graphNodes.length; i++) {
      for (let j = i + 1; j < graphNodes.length; j++) {
        const { strength, types } = calculateConnectionStrength(graphNodes[i], graphNodes[j]);
        
        if (strength > 0.2) {
          graphLinks.push({
            source: graphNodes[i].id,
            target: graphNodes[j].id,
            strength,
            type: (types[0] || 'tag') as any,
            types,
          });
        }
      }
    }

    setNodes(graphNodes);
    setLinks(graphLinks);
  }, [ideas]);

  // D3 force simulation
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom behavior
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    // Create force simulation
    const simulation = d3
      .forceSimulation<VisualNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<VisualNode, VisualLink>(links)
          .id((d) => d.id)
          .distance((d) => 150 / (d.strength + 0.1))
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    // Filter nodes and links
    const filteredNodes = nodes.filter(
      (node) =>
        (filterDomain === "all" || node.domain === filterDomain) &&
        (searchTerm === "" || node.label.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = links.filter(
      (link) => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
      }
    );

    // Create links
    const link = g
      .append("g")
      .selectAll("line")
      .data(filteredLinks)
      .enter()
      .append("line")
      .attr("stroke", (d) => {
        if (d.types.includes('semantic')) return '#8b5cf6';
        if (d.types.includes('tag')) return '#3b82f6';
        return '#94a3b8';
      })
      .attr("stroke-opacity", (d) => 0.3 + d.strength * 0.5)
      .attr("stroke-width", (d) => 1 + d.strength * 3);

    // Create nodes
    const node = g
      .append("g")
      .selectAll("g")
      .data(filteredNodes)
      .enter()
      .append("g")
      .call(
        d3
          .drag<SVGGElement, VisualNode>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Node circles
    node
      .append("circle")
      .attr("r", (d) => 15 + d.feasibility * 2)
      .attr("fill", (d) => getDomainColor(d.domain))
      .attr("stroke", (d) => (d.id === highlightedIdeaId ? "#fbbf24" : "#fff"))
      .attr("stroke-width", (d) => (d.id === highlightedIdeaId ? 3 : 2))
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
        if (onNodeClick) {
          const idea = ideas.find((i) => i.id === d.id);
          if (idea) onNodeClick(idea);
        }
      })
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("r", 20 + d.feasibility * 2);
      })
      .on("mouseleave", function (event, d) {
        d3.select(this).attr("r", 15 + d.feasibility * 2);
      });

    // Node labels
    node
      .append("text")
      .text((d) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => 25 + d.feasibility * 2)
      .attr("font-size", "10px")
      .attr("fill", "currentColor")
      .style("pointer-events", "none");

    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as VisualNode).x || 0)
        .attr("y1", (d) => (d.source as VisualNode).y || 0)
        .attr("x2", (d) => (d.target as VisualNode).x || 0)
        .attr("y2", (d) => (d.target as VisualNode).y || 0);

      node.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    function dragstarted(event: any, d: VisualNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: VisualNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: VisualNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, links, searchTerm, filterDomain, highlightedIdeaId, onNodeClick, ideas]);

  const getDomainColor = (domain: string) => {
    const colors: Record<string, string> = {
      personal: '#3b82f6', // Blue
      professional: '#10b981', // Green
      organizational: '#f59e0b', // Orange
    };
    return colors[domain] || '#6b7280';
  };

  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.7);
    }
  };

  const handleReset = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity
      );
    }
    setSearchTerm("");
    setFilterDomain("all");
    setSelectedNode(null);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Calculate statistics
  const graphLinks: GraphLink[] = links.map(link => ({
    source: typeof link.source === 'string' ? link.source : link.source.id,
    target: typeof link.target === 'string' ? link.target : link.target.id,
    strength: link.strength,
    type: link.type,
  }));
  
  const clusters = detectClusters(nodes, graphLinks);
  const hubIdeas = findHubIdeas(nodes, graphLinks, 3);

  return (
    <div ref={containerRef} className="relative">
      <Card className={isFullscreen ? "h-screen" : "h-[700px]"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              <CardTitle>گراف ارتباط ایده‌ها</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در ایده‌ها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={filterDomain} onValueChange={setFilterDomain}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="فیلتر حوزه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه حوزه‌ها</SelectItem>
                <SelectItem value="personal">شخصی</SelectItem>
                <SelectItem value="professional">حرفه‌ای</SelectItem>
                <SelectItem value="organizational">سازمانی</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative h-[500px]">
            <svg ref={svgRef} className="w-full h-full bg-muted/20" />

            {/* Legend */}
            <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                راهنما
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                  <span>شخصی</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                  <span>حرفه‌ای</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                  <span>سازمانی</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">تعداد نودها:</span>
                  <Badge variant="secondary">{nodes.length}</Badge>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">تعداد ارتباطات:</span>
                  <Badge variant="secondary">{links.length}</Badge>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">دسته‌بندی‌ها:</span>
                  <Badge variant="secondary">{clusters.length}</Badge>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">زوم:</span>
                  <Badge variant="secondary">{Math.round(zoom * 100)}%</Badge>
                </div>
              </div>

              {selectedNode && (
                <div className="mt-4 pt-4 border-t">
                  <div className="font-medium text-sm mb-2">انتخاب شده:</div>
                  <div className="text-xs text-muted-foreground">{selectedNode.label}</div>
                </div>
              )}
            </div>

            {/* Hub Ideas */}
            {hubIdeas.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm p-4 rounded-lg border shadow-lg max-w-xs">
                <div className="text-sm font-medium mb-2">ایده‌های کلیدی:</div>
                <div className="space-y-1 text-xs">
                  {hubIdeas.map((hub) => (
                    <div key={hub.id} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getDomainColor(hub.domain) }}
                      />
                      <span className="truncate">{hub.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
