import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Treemap } from 'recharts';
import { AnalysisData } from '@/types/employee';
import { formatCurrency, formatNumber } from '@/lib/analysis';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Users, DollarSign } from 'lucide-react';

interface HeadcountBreakdownProps {
  data: AnalysisData;
}

export function HeadcountBreakdown({ data }: HeadcountBreakdownProps) {
  const [metric, setMetric] = useState<'headcount' | 'flrr'>('headcount');
  const { employees, functionStats } = data;

  // Location data
  const locationStats = Array.from(
    employees.reduce((map, emp) => {
      const loc = emp.location;
      const existing = map.get(loc) || { location: loc, headcount: 0, flrr: 0 };
      existing.headcount++;
      existing.flrr += emp.flrr;
      map.set(loc, existing);
      return map;
    }, new Map<string, { location: string; headcount: number; flrr: number }>())
  ).map(([, v]) => v).sort((a, b) => b.headcount - a.headcount);

  // Business unit data
  const businessUnitStats = Array.from(
    employees.reduce((map, emp) => {
      const bu = emp.businessUnit || 'Unknown';
      const existing = map.get(bu) || { businessUnit: bu, headcount: 0, flrr: 0 };
      existing.headcount++;
      existing.flrr += emp.flrr;
      map.set(bu, existing);
      return map;
    }, new Map<string, { businessUnit: string; headcount: number; flrr: number }>())
  ).map(([, v]) => v).sort((a, b) => b.headcount - a.headcount);

  // Treemap data for function breakdown
  const treemapData = functionStats.map(d => ({
    name: d.function,
    size: metric === 'headcount' ? d.headcount : d.totalFLRR,
    headcount: d.headcount,
    flrr: d.totalFLRR,
  }));

  const CustomTreemapContent = (props: any) => {
    const { x, y, width, height, name, headcount, flrr } = props;
    if (width < 50 || height < 30) return null;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="hsl(var(--primary))"
          stroke="hsl(var(--background))"
          strokeWidth={2}
          rx={4}
        />
        <text
          x={x + width / 2}
          y={y + height / 2 - 8}
          textAnchor="middle"
          fill="hsl(var(--primary-foreground))"
          fontSize={width > 100 ? 12 : 10}
          fontWeight={500}
        >
          {name}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 8}
          textAnchor="middle"
          fill="hsl(var(--primary-foreground))"
          fontSize={10}
          opacity={0.8}
        >
          {metric === 'headcount' ? `${headcount}` : formatCurrency(flrr)}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric Toggle */}
      <div className="flex justify-end">
        <ToggleGroup type="single" value={metric} onValueChange={(v) => v && setMetric(v as 'headcount' | 'flrr')}>
          <ToggleGroupItem value="headcount" aria-label="Headcount view">
            <Users className="w-4 h-4 mr-2" />
            Headcount
          </ToggleGroupItem>
          <ToggleGroupItem value="flrr" aria-label="FLRR view">
            <DollarSign className="w-4 h-4 mr-2" />
            FLRR
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Treemap Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Function Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={4 / 3}
                content={<CustomTreemapContent />}
              />
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdowns */}
      <Tabs defaultValue="function" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="function">Function</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="businessUnit">Business Unit</TabsTrigger>
        </TabsList>

        <TabsContent value="function" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={functionStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      tickFormatter={(v) => metric === 'headcount' ? String(v) : formatCurrency(v)} 
                    />
                    <YAxis type="category" dataKey="function" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number) => metric === 'headcount' ? formatNumber(value) : formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar 
                      dataKey={metric === 'headcount' ? 'headcount' : 'totalFLRR'} 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationStats.slice(0, 15)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      tickFormatter={(v) => metric === 'headcount' ? String(v) : formatCurrency(v)} 
                    />
                    <YAxis type="category" dataKey="location" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number) => metric === 'headcount' ? formatNumber(value) : formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar 
                      dataKey={metric} 
                      fill="hsl(var(--chart-3))" 
                      radius={[0, 4, 4, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="businessUnit" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={businessUnitStats.slice(0, 15)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      tickFormatter={(v) => metric === 'headcount' ? String(v) : formatCurrency(v)} 
                    />
                    <YAxis type="category" dataKey="businessUnit" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number) => metric === 'headcount' ? formatNumber(value) : formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar 
                      dataKey={metric} 
                      fill="hsl(var(--chart-4))" 
                      radius={[0, 4, 4, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Function Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Function</th>
                  <th className="text-right py-3 px-4 font-medium">Headcount</th>
                  <th className="text-right py-3 px-4 font-medium">Total FLRR</th>
                  <th className="text-right py-3 px-4 font-medium">Avg FLRR</th>
                  <th className="text-right py-3 px-4 font-medium">Best-Cost %</th>
                </tr>
              </thead>
              <tbody>
                {functionStats.map((func) => (
                  <tr key={func.function} className="border-b hover:bg-secondary/30">
                    <td className="py-3 px-4 font-medium">{func.function}</td>
                    <td className="py-3 px-4 text-right">{formatNumber(func.headcount)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(func.totalFLRR)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(func.avgFLRR)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={func.bestCostPercent > 40 ? 'text-success' : 'text-muted-foreground'}>
                        {func.bestCostPercent.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
