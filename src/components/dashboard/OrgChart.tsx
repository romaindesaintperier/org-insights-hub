import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnalysisData, OrgNode } from '@/types/employee';
import { formatCurrency } from '@/lib/analysis';
import { 
  ChevronDown, 
  ChevronRight, 
  Users, 
  MapPin, 
  Building2,
  Network,
  ZoomIn,
  ZoomOut,
  Home
} from 'lucide-react';

interface OrgChartProps {
  data: AnalysisData;
}

interface OrgNodeCardProps {
  node: OrgNode;
  isExpanded: boolean;
  onToggle: () => void;
  depth: number;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.0;
const ZOOM_SENSITIVITY = 0.001;

function countTotalReports(node: OrgNode): number {
  let count = node.children.length;
  for (const child of node.children) {
    count += countTotalReports(child);
  }
  return count;
}

function OrgNodeCard({ node, isExpanded, onToggle, depth }: OrgNodeCardProps) {
  const totalOrgSize = useMemo(() => countTotalReports(node), [node]);
  const hasChildren = node.children.length > 0;
  
  return (
    <div className="flex flex-col items-center">
      <Card 
        className={`
          w-64 cursor-pointer transition-all duration-200 hover:shadow-lg
          ${depth === 0 ? 'border-primary bg-primary/5' : 'bg-card'}
          ${hasChildren ? 'hover:border-primary/50' : ''}
        `}
        onClick={hasChildren ? onToggle : undefined}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              ID: {node.employeeId}
            </Badge>
            {hasChildren && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          
          <h4 className="font-semibold text-sm text-foreground mb-1 line-clamp-2">
            {node.title || 'No Title'}
          </h4>
          
          <p className="text-xs text-muted-foreground mb-3">
            {node.function || 'No Function'}
          </p>
          
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                FLRR
              </span>
              <span className="font-medium">{formatCurrency(node.flrr)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                Direct Reports
              </span>
              <span className="font-medium">{node.directReports}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Network className="h-3 w-3" />
                Total Org Size
              </span>
              <span className="font-medium">{totalOrgSize}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location
              </span>
              <span className="font-medium text-right truncate max-w-[100px]" title={node.location}>
                {node.location || 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Country</span>
              <span className="font-medium">{node.country || 'N/A'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface TreeBranchProps {
  nodes: OrgNode[];
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  depth: number;
}

function TreeBranch({ nodes, expandedNodes, onToggle, depth }: TreeBranchProps) {
  if (nodes.length === 0) return null;
  
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-4">
      {nodes.map((node) => {
        const isExpanded = expandedNodes.has(node.employeeId);
        
        return (
          <div key={node.employeeId} className="flex flex-col items-center">
            {/* Vertical connector from parent */}
            {depth > 0 && (
              <div className="w-px h-4 bg-border" />
            )}
            
            <OrgNodeCard
              node={node}
              isExpanded={isExpanded}
              onToggle={() => onToggle(node.employeeId)}
              depth={depth}
            />
            
            {/* Children */}
            {isExpanded && node.children.length > 0 && (
              <div className="relative mt-4">
                {/* Horizontal connector line */}
                {node.children.length > 1 && (
                  <div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border"
                    style={{ 
                      width: `calc(${(node.children.length - 1) * 272}px + 100%)`,
                      maxWidth: '100vw'
                    }}
                  />
                )}
                
                <TreeBranch
                  nodes={node.children}
                  expandedNodes={expandedNodes}
                  onToggle={onToggle}
                  depth={depth + 1}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OrgChart({ data }: OrgChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isAnimating, setIsAnimating] = useState(false);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    if (data.orgTree) {
      return new Set([data.orgTree.employeeId]);
    }
    return new Set();
  });

  const handleToggle = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = new Set<string>();
    
    function collectIds(node: OrgNode) {
      allIds.add(node.employeeId);
      node.children.forEach(collectIds);
    }
    
    if (data.orgTree) {
      collectIds(data.orgTree);
    }
    setExpandedNodes(allIds);
  }, [data.orgTree]);

  const collapseAll = useCallback(() => {
    if (data.orgTree) {
      setExpandedNodes(new Set([data.orgTree.employeeId]));
    } else {
      setExpandedNodes(new Set());
    }
  }, [data.orgTree]);

  // Scroll wheel zoom toward cursor position
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const delta = -e.deltaY * ZOOM_SENSITIVITY;
    const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, transform.scale * (1 + delta)));
    const scaleFactor = newScale / transform.scale;

    // Zoom toward cursor position
    const newX = cursorX - (cursorX - transform.x) * scaleFactor;
    const newY = cursorY - (cursorY - transform.y) * scaleFactor;

    setTransform({ x: newX, y: newY, scale: newScale });
  }, [transform]);

  // Click-and-drag panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsPanning(true);
    setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    }));
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Button zoom handlers with animation
  const handleZoomIn = useCallback(() => {
    setIsAnimating(true);
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const newScale = Math.min(MAX_ZOOM, transform.scale + 0.2);
    const scaleFactor = newScale / transform.scale;
    
    setTransform({
      x: centerX - (centerX - transform.x) * scaleFactor,
      y: centerY - (centerY - transform.y) * scaleFactor,
      scale: newScale,
    });
    
    setTimeout(() => setIsAnimating(false), 200);
  }, [transform]);

  const handleZoomOut = useCallback(() => {
    setIsAnimating(true);
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const newScale = Math.max(MIN_ZOOM, transform.scale - 0.2);
    const scaleFactor = newScale / transform.scale;
    
    setTransform({
      x: centerX - (centerX - transform.x) * scaleFactor,
      y: centerY - (centerY - transform.y) * scaleFactor,
      scale: newScale,
    });
    
    setTimeout(() => setIsAnimating(false), 200);
  }, [transform]);

  const handleResetZoom = useCallback(() => {
    setIsAnimating(true);
    // Center on CEO node - calculate offset to center it in the container
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      // Center the content with some padding from left (for the CEO node to be centered)
      const centerX = rect.width / 2 - 128; // 128 is half of node width (256/2)
      const centerY = 50; // Give some padding from top
      setTransform({ x: centerX, y: centerY, scale: 1 });
    } else {
      setTransform({ x: 0, y: 0, scale: 1 });
    }
    setTimeout(() => setIsAnimating(false), 200);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container || !container.matches(':hover')) return;

      const PAN_STEP = 50;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setTransform(prev => ({ ...prev, y: prev.y + PAN_STEP }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setTransform(prev => ({ ...prev, y: prev.y - PAN_STEP }));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setTransform(prev => ({ ...prev, x: prev.x + PAN_STEP }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setTransform(prev => ({ ...prev, x: prev.x - PAN_STEP }));
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleResetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);

  if (!data.orgTree) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Build Org Chart</h3>
          <p className="text-muted-foreground">
            The org chart requires Manager ID data to establish reporting relationships.
            Please ensure your data includes valid Manager IDs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                Interactive Organization Chart
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Scroll to zoom • Drag to pan • Click nodes to expand/collapse
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
              <div className="border-l pl-2 ml-2 flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Zoom Out (-)">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-12 text-center">
                  {Math.round(transform.scale * 100)}%
                </span>
                <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Zoom In (+)">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleResetZoom} title="Reset (0)">
                  <Home className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={containerRef}
            className="w-full overflow-hidden rounded-lg border bg-muted/20"
            style={{ 
              height: 'calc(100vh - 300px)',
              cursor: isPanning ? 'grabbing' : 'grab',
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div 
              ref={contentRef}
              className="min-w-max p-8"
              style={{ 
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                transformOrigin: '0 0',
                transition: isAnimating ? 'transform 0.2s ease-out' : 'none',
              }}
            >
              <TreeBranch
                nodes={[data.orgTree]}
                expandedNodes={expandedNodes}
                onToggle={handleToggle}
                depth={0}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}