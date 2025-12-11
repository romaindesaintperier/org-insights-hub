import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Initially expand the root node
    if (data.orgTree) {
      return new Set([data.orgTree.employeeId]);
    }
    return new Set();
  });
  
  const [zoomLevel, setZoomLevel] = useState(1);

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

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

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
                Click on any box with direct reports to expand/collapse the hierarchy
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
                <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleResetZoom}>
                  <Home className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full" style={{ height: 'calc(100vh - 300px)' }}>
            <div 
              className="min-w-max p-8 transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
            >
              <TreeBranch
                nodes={[data.orgTree]}
                expandedNodes={expandedNodes}
                onToggle={handleToggle}
                depth={0}
              />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
