import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { MindmapData, MindmapNode, MindmapEdge } from './AIMindmapDrawer';

interface MindMapProps {
  data: MindmapData;
}

interface NodePosition {
  x: number;
  y: number;
}

interface VisualNode extends MindmapNode {
  position: NodePosition;
  isExpanded: boolean;
  children: string[];
  parent?: string;
}

export const MindMap: React.FC<MindMapProps> = ({ data }) => {
  const [nodes, setNodes] = useState<VisualNode[]>([]);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Group colors
  const groupColors: Record<string, string> = {
    'main': 'hsl(var(--primary))',
    'concepts': 'hsl(var(--tech-cyan))',
    'details': 'hsl(var(--health-green))',
    'actions': 'hsl(var(--knowledge-amber))',
    'quotes': 'hsl(var(--meeting-purple))',
    'themes': 'hsl(var(--innovation-violet))',
    'default': 'hsl(var(--muted-foreground))'
  };

  // Initialize nodes with positions and hierarchy
  useEffect(() => {
    if (!data.nodes || data.nodes.length === 0) return;

    // Build hierarchy
    const nodeMap = new Map<string, VisualNode>();
    const childrenMap = new Map<string, string[]>();

    // Initialize nodes
    data.nodes.forEach(node => {
      nodeMap.set(node.id, {
        ...node,
        position: { x: 0, y: 0 },
        isExpanded: node.level <= 1, // Auto-expand first two levels
        children: []
      });
      childrenMap.set(node.id, []);
    });

    // Build parent-child relationships
    data.edges.forEach(edge => {
      const children = childrenMap.get(edge.from) || [];
      children.push(edge.to);
      childrenMap.set(edge.from, children);

      const childNode = nodeMap.get(edge.to);
      if (childNode) {
        childNode.parent = edge.from;
      }
    });

    // Set children
    nodeMap.forEach((node, nodeId) => {
      node.children = childrenMap.get(nodeId) || [];
    });

    // Calculate positions
    const rootNode = data.nodes.find(n => n.level === 0);
    if (rootNode) {
      calculateNodePositions(nodeMap, rootNode.id, 400, 200, childrenMap);
    }

    setNodes(Array.from(nodeMap.values()));
  }, [data]);

  // Calculate node positions using a radial layout
  const calculateNodePositions = (
    nodeMap: Map<string, VisualNode>,
    nodeId: string,
    x: number,
    y: number,
    childrenMap: Map<string, string[]>,
    angle: number = 0,
    radius: number = 150
  ) => {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    node.position = { x, y };

    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) return;

    const angleStep = (Math.PI * 2) / Math.max(children.length, 4);
    const childRadius = radius * (1 + node.level * 0.3);

    children.forEach((childId, index) => {
      const childAngle = angle + (index - (children.length - 1) / 2) * angleStep;
      const childX = x + Math.cos(childAngle) * childRadius;
      const childY = y + Math.sin(childAngle) * childRadius;

      calculateNodePositions(nodeMap, childId, childX, childY, childrenMap, childAngle, radius * 0.8);
    });
  };

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId
        ? { ...node, isExpanded: !node.isExpanded }
        : node
    ));
  };

  // Get visible nodes (considering expanded state)
  const getVisibleNodes = (): VisualNode[] => {
    const visible: VisualNode[] = [];
    const visited = new Set<string>();

    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      visible.push(node);

      if (node.isExpanded) {
        node.children.forEach(childId => traverse(childId));
      }
    };

    // Start from root nodes (level 0)
    nodes.filter(n => n.level === 0).forEach(root => traverse(root.id));
    
    return visible;
  };

  // Get visible edges
  const getVisibleEdges = (): MindmapEdge[] => {
    const visibleNodeIds = new Set(getVisibleNodes().map(n => n.id));
    return data.edges.filter(edge =>
      visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to)
    );
  };

  // Handle zoom
  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.3, Math.min(2, prev + delta)));
  };

  // Handle drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Get node color
  const getNodeColor = (node: VisualNode): string => {
    return groupColors[node.group || 'default'] || groupColors.default;
  };

  const visibleNodes = getVisibleNodes();
  const visibleEdges = getVisibleEdges();

  return (
    <div className="w-full h-96 border rounded-lg bg-background relative overflow-hidden">
      {/* Controls */}
      <div className="absolute top-2 left-2 z-10 flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleZoom(0.1)}
        >
          <ZoomIn className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleZoom(-0.1)}
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={resetView}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-2 right-2 z-10 flex flex-wrap gap-1 max-w-48">
        {Object.entries(groupColors).map(([group, color]) => {
          const hasNodes = visibleNodes.some(n => (n.group || 'default') === group);
          if (!hasNodes || group === 'default') return null;
          
          return (
            <Badge key={group} variant="outline" className="text-xs">
              <div
                className="w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: color }}
              />
              {group}
            </Badge>
          );
        })}
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${offset.x}, ${offset.y}) scale(${zoom})`}>
          {/* Edges */}
          <g>
            {visibleEdges.map((edge, index) => {
              const fromNode = visibleNodes.find(n => n.id === edge.from);
              const toNode = visibleNodes.find(n => n.id === edge.to);
              
              if (!fromNode || !toNode) return null;
              
              return (
                <line
                  key={`${edge.from}-${edge.to}-${index}`}
                  x1={fromNode.position.x}
                  y1={fromNode.position.y}
                  x2={toNode.position.x}
                  y2={toNode.position.y}
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  opacity="0.6"
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {visibleNodes.map(node => (
              <g key={node.id}>
                {/* Node Circle */}
                <circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r={Math.max(20, Math.min(40, node.label.length * 1.5 + 10))}
                  fill={getNodeColor(node)}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => toggleNode(node.id)}
                />

                {/* Node Label */}
                <text
                  x={node.position.x}
                  y={node.position.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none text-xs font-medium"
                  fill="white"
                >
                  {node.label.length > 15 ? `${node.label.substring(0, 12)}...` : node.label}
                </text>

                {/* Expand/Collapse Icon */}
                {node.children.length > 0 && (
                  <g
                    className="cursor-pointer"
                    onClick={() => toggleNode(node.id)}
                  >
                    <circle
                      cx={node.position.x + 25}
                      cy={node.position.y - 25}
                      r="8"
                      fill="white"
                      stroke={getNodeColor(node)}
                      strokeWidth="1"
                    />
                    {node.isExpanded ? (
                      <ChevronDown
                        x={node.position.x + 21}
                        y={node.position.y - 29}
                        width="8"
                        height="8"
                        className="pointer-events-none"
                      />
                    ) : (
                      <ChevronRight
                        x={node.position.x + 21}
                        y={node.position.y - 29}
                        width="8"
                        height="8"
                        className="pointer-events-none"
                      />
                    )}
                  </g>
                )}
              </g>
            ))}
          </g>
        </g>
      </svg>

      {/* Instructions */}
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
        کلیک برای باز/بسته کردن • درگ کردن برای حرکت
      </div>

      {/* Stats */}
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
        {visibleNodes.length} از {data.nodes.length} گره نمایش داده شده
      </div>
    </div>
  );
};