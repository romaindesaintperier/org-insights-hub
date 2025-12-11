import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AnalysisData, Benchmarks } from '@/types/employee';
import { formatCurrency, formatPercent } from '@/lib/analysis';
import { defaultBenchmarks } from '@/lib/analysis';
import { AlertTriangle, CheckCircle, Users, Layers, User } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SpansLayersAnalysisProps {
  data: AnalysisData;
  benchmarks?: Benchmarks;
}

export function SpansLayersAnalysis({ data, benchmarks = defaultBenchmarks }: SpansLayersAnalysisProps) {
  const { layerStats, spanStats, functionSpanStats, totals } = data;

  // Span distribution data
  const spanDistribution = [
    { range: '1', count: spanStats.filter(s => s.directReports === 1).length },
    { range: '2-4', count: spanStats.filter(s => s.directReports >= 2 && s.directReports <= 4).length },
    { range: '5-7', count: spanStats.filter(s => s.directReports >= 5 && s.directReports <= 7).length },
    { range: '8-10', count: spanStats.filter(s => s.directReports >= 8 && s.directReports <= 10).length },
    { range: '11+', count: spanStats.filter(s => s.directReports >= 11).length },
  ];

  const getSpanColor = (range: string) => {
    if (range === '1') return 'hsl(var(--destructive))';
    if (range === '2-4') return 'hsl(var(--warning))';
    if (range === '5-7' || range === '8-10') return 'hsl(var(--success))';
    return 'hsl(var(--chart-3))';
  };

  const outliers = {
    singleReport: spanStats.filter(s => s.directReports === 1),
    narrow: spanStats.filter(s => s.directReports > 1 && s.directReports < benchmarks.minSpan),
    wide: spanStats.filter(s => s.directReports > benchmarks.maxSpan),
  };

  // Org-wide average span
  const orgAvgSpan = totals.avgSpan;
  const orgAvgLayers = layerStats.length > 0 ? Math.max(...layerStats.map(l => l.layer)) + 1 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Managers</p>
                <p className="text-2xl font-semibold">{totals.totalManagers}</p>
                <p className="text-xs text-muted-foreground">{formatPercent(totals.managerPercent)} of total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <User className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CEO Direct Reports</p>
                <p className="text-2xl font-semibold">{totals.ceoDirectReports}</p>
                <p className="text-xs text-muted-foreground">Layer 1 headcount</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Layers className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Org Layers</p>
                <p className="text-2xl font-semibold">{orgAvgLayers}</p>
                <p className="text-xs text-muted-foreground">CEO = Layer 0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Span of Control</p>
                <p className="text-2xl font-semibold">{orgAvgSpan.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Target: {benchmarks.minSpan}-{benchmarks.maxSpan}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layer Analysis - 3 charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FLRR by Layer */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">FLRR by Layer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={layerStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} fontSize={11} />
                  <YAxis type="category" dataKey="layer" tickFormatter={(v) => `L${v}`} fontSize={11} width={30} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Layer ${label}`}
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
          </CardContent>
        </Card>

        {/* Headcount by Layer */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Headcount by Layer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={layerStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" fontSize={11} />
                  <YAxis type="category" dataKey="layer" tickFormatter={(v) => `L${v}`} fontSize={11} width={30} />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Employees']}
                    labelFormatter={(label) => `Layer ${label}`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="headcount" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Avg Tenure by Layer */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Avg Tenure by Layer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={layerStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" unit=" yrs" fontSize={11} />
                  <YAxis type="category" dataKey="layer" tickFormatter={(v) => `L${v}`} fontSize={11} width={30} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)} years`, 'Avg Tenure']}
                    labelFormatter={(label) => `Layer ${label}`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="avgTenure" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layer Stats Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Layer Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {layerStats.map((layer) => (
              <div key={layer.layer} className="p-3 rounded-lg bg-secondary/50">
                <p className="text-sm font-medium text-primary">Layer {layer.layer}</p>
                <p className="text-lg font-semibold">{layer.headcount}</p>
                <p className="text-xs text-muted-foreground">
                  {layer.managers} mgrs / {layer.ics} ICs
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Span of Control Distribution & Benchmark */}
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
                  {orgAvgLayers} / {benchmarks.maxLayers}
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
                Average span: {totals.avgSpan.toFixed(1)}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Issues Identified</h4>
              {outliers.singleReport.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    {outliers.singleReport.length} single-report managers
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1 ml-6">
                    {outliers.singleReport.slice(0, 10).map((mgr) => (
                      <span key={mgr.managerId} className="text-xs bg-destructive/10 px-2 py-1 rounded">
                        {mgr.managerId}
                      </span>
                    ))}
                    {outliers.singleReport.length > 10 && (
                      <span className="text-xs text-muted-foreground">+{outliers.singleReport.length - 10} more</span>
                    )}
                  </div>
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

      {/* Streamlining Opportunities */}
      <Card className="gradient-aubergine text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-primary-foreground">Streamlining Opportunities by Function</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm opacity-80 mb-4">
            Functions with narrow spans, high manager percentages, or deep layer structures offer the most opportunity for organizational streamlining:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {functionSpanStats
              .map(func => ({
                ...func,
                score: (func.avgSpan < benchmarks.minSpan ? (benchmarks.minSpan - func.avgSpan) * 10 : 0) +
                       (func.managerPercent > 20 ? func.managerPercent - 20 : 0) +
                       (func.layers > 4 ? (func.layers - 4) * 5 : 0)
              }))
              .filter(f => f.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 3)
              .map((func, i) => (
                <div key={func.function} className="p-4 rounded-lg bg-white/10">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">{func.function}</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">#{i + 1}</span>
                  </div>
                  <p className="text-sm opacity-80">Span: {func.avgSpan.toFixed(1)} | Mgr%: {func.managerPercent.toFixed(0)}% | Layers: {func.layers}</p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Function Spans & Layers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Span of Control by Function</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Function</TableHead>
                <TableHead className="text-right">Employees</TableHead>
                <TableHead className="text-right">Managers</TableHead>
                <TableHead className="text-right">Manager %</TableHead>
                <TableHead className="text-right">Avg Span</TableHead>
                <TableHead className="text-right">Layers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {functionSpanStats.map((func) => (
                <TableRow key={func.function}>
                  <TableCell className="font-medium">{func.function}</TableCell>
                  <TableCell className="text-right">{func.totalEmployees}</TableCell>
                  <TableCell className="text-right">{func.managerCount}</TableCell>
                  <TableCell className="text-right">{formatPercent(func.managerPercent)}</TableCell>
                  <TableCell className="text-right">
                    <span className={func.avgSpan < benchmarks.minSpan ? 'text-warning' : func.avgSpan > benchmarks.maxSpan ? 'text-destructive' : 'text-success'}>
                      {func.avgSpan.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{func.layers}</TableCell>
                </TableRow>
              ))}
              {/* Org Average Row */}
              <TableRow className="bg-secondary/30 font-medium">
                <TableCell>Organization Average</TableCell>
                <TableCell className="text-right">{totals.headcount}</TableCell>
                <TableCell className="text-right">{totals.totalManagers}</TableCell>
                <TableCell className="text-right">{formatPercent(totals.managerPercent)}</TableCell>
                <TableCell className="text-right">{orgAvgSpan.toFixed(1)}</TableCell>
                <TableCell className="text-right">{orgAvgLayers}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                  <p className="text-sm text-muted-foreground">{mgr.function}</p>
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
