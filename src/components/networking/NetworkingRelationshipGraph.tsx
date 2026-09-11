import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NetworkingContact } from "@/services/networkingService";
import {
  NetworkNode,
  NetworkLink,
  contactsToNodes,
  calculateLinks,
  getNodeRadius,
  getLinkColor,
  categoryColors,
  statusBorderColors,
  categoryLabels,
  calculateGraphStats,
} from "./networkingGraphUtils";
import {
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  X,
  Users,
  Link as LinkIcon,
  Star,
} from "lucide-react";
import * as d3 from "d3";

interface NetworkingRelationshipGraphProps {
  contacts: NetworkingContact[];
  onContactSelect?: (contact: NetworkingContact) => void;
}

export function NetworkingRelationshipGraph({
  contacts,
  onContactSelect,
}: NetworkingRelationshipGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkLink> | null>(null);

  const nodes = contactsToNodes(contacts);
  const links = calculateLinks(nodes);
  const stats = calculateGraphStats(nodes, links);

  // Filter nodes based on search and category
  const filteredNodes = nodes.filter((node) => {
    const matchesSearch =
      searchQuery === "" ||
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (node.title && node.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (node.organization && node.organization.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" || node.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredLinks = links.filter(
    (link) =>
      filteredNodeIds.has(typeof link.source === "string" ? link.source : link.source.id) &&
      filteredNodeIds.has(typeof link.target === "string" ? link.target : link.target.id)
  );

  const initializeGraph = useCallback(() => {
    if (!svgRef.current || !containerRef.current || filteredNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = isFullscreen ? window.innerHeight - 200 : 400;

    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setTransform(event.transform);
      });

    svg.call(zoom);

    // Create arrow marker for links
    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#9ca3af");

    // Create the simulation
    const simulation = d3.forceSimulation<NetworkNode>(filteredNodes)
      .force("link", d3.forceLink<NetworkNode, NetworkLink>(filteredLinks)
        .id((d) => d.id)
        .distance((d) => 100 - (d.strength * 30))
        .strength((d) => d.strength))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: NetworkNode) => getNodeRadius(d.strength) + 10));

    simulationRef.current = simulation;

    // Create links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
      .attr("stroke", (d) => getLinkColor(d.type))
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => 1 + d.strength * 2);

    // Create node groups
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(filteredNodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add circle to nodes
    node.append("circle")
      .attr("r", (d) => getNodeRadius(d.strength))
      .attr("fill", (d) => categoryColors[d.category] || categoryColors.other)
      .attr("stroke", (d) => statusBorderColors[d.status] || statusBorderColors.active)
      .attr("stroke-width", 3)
      .attr("opacity", 0.9);

    // Add labels to nodes
    node.append("text")
      .text((d) => d.name.split(" ")[0])
      .attr("text-anchor", "middle")
      .attr("dy", (d) => getNodeRadius(d.strength) + 14)
      .attr("font-size", "10px")
      .attr("fill", "currentColor")
      .attr("class", "text-foreground");

    // Add tooltips and click handlers
    node.on("click", (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
      const contact = contacts.find((c) => c.id === d.id);
      if (contact && onContactSelect) {
        onContactSelect(contact);
      }
    });

    // Tooltip on hover
    node.append("title")
      .text((d) => `${d.name}\n${d.title || ""}\n${categoryLabels[d.category] || d.category}\nقدرت رابطه: ${d.strength}/5`);

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as NetworkNode).x || 0)
        .attr("y1", (d) => (d.source as NetworkNode).y || 0)
        .attr("x2", (d) => (d.target as NetworkNode).x || 0)
        .attr("y2", (d) => (d.target as NetworkNode).y || 0);

      node.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Clear selection on svg click
    svg.on("click", () => setSelectedNode(null));

  }, [filteredNodes, filteredLinks, contacts, onContactSelect, isFullscreen]);

  useEffect(() => {
    initializeGraph();
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [initializeGraph]);

  const handleZoomIn = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
        1.3
      );
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
        0.7
      );
    }
  };

  const handleReset = () => {
    if (svgRef.current && containerRef.current) {
      const width = containerRef.current.clientWidth;
      const height = isFullscreen ? window.innerHeight - 200 : 400;
      d3.select(svgRef.current).transition().call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(1).translate(-width / 2, -height / 2)
      );
    }
    setSelectedNode(null);
    initializeGraph();
  };

  const uniqueCategories = [...new Set(nodes.map((n) => n.category))];

  if (contacts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            مخاطبی برای نمایش گراف وجود ندارد
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isFullscreen ? "fixed inset-4 z-50 overflow-hidden" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5" />
            نمای شبکه ارتباطات
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجوی مخاطب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="همه دسته‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه دسته‌ها</SelectItem>
              {uniqueCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: categoryColors[cat] }}
                    />
                    {categoryLabels[cat] || cat}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Graph Container */}
        <div
          ref={containerRef}
          className="relative border rounded-lg bg-muted/20 overflow-hidden"
          style={{ height: isFullscreen ? "calc(100vh - 300px)" : "400px" }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className="cursor-grab active:cursor-grabbing"
          />
        </div>

        {/* Stats and Legend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stats */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              آمار گراف
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">نودها:</div>
              <div className="font-medium">{stats.totalNodes}</div>
              <div className="text-muted-foreground">اتصالات:</div>
              <div className="font-medium">{stats.totalLinks}</div>
              <div className="text-muted-foreground">میانگین اتصال:</div>
              <div className="font-medium">{stats.avgConnections}</div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <h4 className="font-medium text-sm">راهنمای دسته‌بندی</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryLabels).slice(0, 6).map(([key, label]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: categoryColors[key], color: categoryColors[key] }}
                >
                  <span
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: categoryColors[key] }}
                  />
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Hub Nodes */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Star className="h-4 w-4" />
              مخاطبین کلیدی
            </h4>
            <div className="space-y-1">
              {stats.hubNodes.map(({ node, connections }) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate">{node.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    <LinkIcon className="h-3 w-3 mr-1" />
                    {connections}
                  </Badge>
                </div>
              ))}
              {stats.hubNodes.length === 0 && (
                <p className="text-xs text-muted-foreground">اتصالی وجود ندارد</p>
              )}
            </div>
          </div>
        </div>

        {/* Selected Node Info */}
        {selectedNode && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{selectedNode.name}</h4>
                {selectedNode.title && (
                  <p className="text-sm text-muted-foreground">{selectedNode.title}</p>
                )}
                {selectedNode.organization && (
                  <p className="text-sm text-muted-foreground">{selectedNode.organization}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge style={{ backgroundColor: categoryColors[selectedNode.category] }}>
                  {categoryLabels[selectedNode.category] || selectedNode.category}
                </Badge>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < selectedNode.strength
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {selectedNode.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedNode.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Link Type Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground justify-center">
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-green-500" />
            سازمان مشترک
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-purple-500" />
            رویداد مشترک
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-blue-500" />
            تگ مشترک
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-gray-400" />
            دسته‌بندی یکسان
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
