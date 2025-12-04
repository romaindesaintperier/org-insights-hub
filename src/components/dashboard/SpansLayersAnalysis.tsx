import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AnalysisData, Benchmarks } from '@/types/employee';
import { formatCurrency } from '@/lib/analysis';
import { defaultBenchmarks } from '@/lib/analysis';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface SpansLayersAnalysisProps {
  data: AnalysisData;
  benchmarks?: Benchmarks;
}

export function SpansLayersAnalysis({ data, benchmarks = defaultBenchmarks }: SpansLayersAnalysisProps) {
  const { layerStats, spanStats } = data;

  // Span distribution data
  const spanDistribution = [
    { range: '1', count: spanStats.filter(s => s.directReports === 1).length },
    { range: '2-3', count: spanStats.filter(s => s.directReports >= 2 && s.directReports <= 3).length },
    { range: '4-6', count: spanStats.filter(s => s.directReports >= 4 && s.directReports <= 6).length },
    { range: '7-10', count: spanStats.filter(s => s.directReports >= 7 && s.directReports <= 10).length },
    { range: '11+', count: spanStats.filter(s => s.directReports >= 11).length },
  ];

  const getSpanColor = (range: string) => {
    if (range === '1') return 'hsl(var(--destructive))';
    if (range === '2-3') return 'hsl(var(--warning))';
    if (range === '4-6' || range === '7-10') return 'hsl(var(--success))';
    return 'hsl(var(--chart-3))';
  };

  const outliers = {
    singleReport: spanStats.filter(s => s.directReports === 1),
    narrow: spanStats.filter(s => s.directReports > 1 && s.directReports < benchmarks.minSpan),
    wide: spanStats.filter(s => s.directReports > benchmarks.maxSpan),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Layer Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>FLRR by Organizational Layer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={layerStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                <YAxis type="category" dataKey="layer" tickFormatter={(v) => `Layer ${v}`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="totalFLRR" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {layerStats.map((layer) => (
              <div key={layer.layer} className="p-3 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Layer {layer.layer}</p>
                <p className="text-lg font-semibold">{layer.headcount} employees</p>
                <p className="text-sm text-muted-foreground">
                  {layer.managers} mgrs / {layer.ics} ICs
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Span of Control Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Span of Control Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spanDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {spanDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getSpanColor(entry.range)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-success" />
                Optimal ({benchmarks.minSpan}-{benchmarks.maxSpan})
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-warning" />
                Narrow
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                Single report
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Benchmark Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Benchmark Comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Max Layers</span>
                <Badge variant={layerStats.length <= benchmarks.maxLayers ? 'default' : 'destructive'}>
                  {layerStats.length <= benchmarks.maxLayers ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 mr-1" />
                  )}
                  {layerStats.length} / {benchmarks.maxLayers}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {layerStats.length <= benchmarks.maxLayers 
                  ? 'Within best practice range' 
                  : `${layerStats.length - benchmarks.maxLayers} excess layers`}
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Optimal Span Range</span>
                <span className="text-muted-foreground">{benchmarks.minSpan}-{benchmarks.maxSpan}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Average span: {data.totals.avgSpan.toFixed(1)}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Issues Identified</h4>
              {outliers.singleReport.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  {outliers.singleReport.length} single-report managers
                </div>
              )}
              {outliers.narrow.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-warning">
                  <AlertTriangle className="w-4 h-4" />
                  {outliers.narrow.length} managers below min span
                </div>
              )}
              {outliers.wide.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="w-4 h-4" />
                  {outliers.wide.length} managers above max span
                </div>
              )}
              {outliers.singleReport.length === 0 && outliers.narrow.length === 0 && outliers.wide.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle className="w-4 h-4" />
                  All spans within acceptable range
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Single Report Managers List */}
      {outliers.singleReport.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Single-Report Managers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {outliers.singleReport.slice(0, 12).map((mgr) => (
                <div key={mgr.managerId} className="p-3 rounded-lg border bg-destructive/5">
                  <p className="font-medium">{mgr.managerName}</p>
                  <p className="text-sm text-muted-foreground">{mgr.department}</p>
                  <p className="text-xs text-muted-foreground">Layer {mgr.layer}</p>
                </div>
              ))}
              {outliers.singleReport.length > 12 && (
                <div className="p-3 rounded-lg border bg-secondary/50 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    +{outliers.singleReport.length - 12} more
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}