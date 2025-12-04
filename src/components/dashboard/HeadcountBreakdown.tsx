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
  const { employees, departmentStats, roleFamilyStats } = data;

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

  // Cost center data
  const costCenterStats = Array.from(
    employees.reduce((map, emp) => {
      const cc = emp.costCenter;
      const existing = map.get(cc) || { costCenter: cc, headcount: 0, flrr: 0 };
      existing.headcount++;
      existing.flrr += emp.flrr;
      map.set(cc, existing);
      return map;
    }, new Map<string, { costCenter: string; headcount: number; flrr: number }>())
  ).map(([, v]) => v).sort((a, b) => b.headcount - a.headcount);

  // Treemap data for department breakdown
  const treemapData = departmentStats.map(d => ({
    name: d.department,
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
          <CardTitle>Department Overview</CardTitle>
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
      <Tabs defaultValue="department" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="department">Department</TabsTrigger>
          <TabsTrigger value="roleFamily">Role Family</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="costCenter">Cost Center</TabsTrigger>
        </TabsList>

        <TabsContent value="department" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      tickFormatter={(v) => metric === 'headcount' ? String(v) : formatCurrency(v)} 
                    />
                    <YAxis type="category" dataKey="department" width={120} tick={{ fontSize: 12 }} />
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

        <TabsContent value="roleFamily" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roleFamilyStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      tickFormatter={(v) => metric === 'headcount' ? String(v) : formatCurrency(v)} 
                    />
                    <YAxis type="category" dataKey="roleFamily" width={120} tick={{ fontSize: 12 }} />
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
                      fill="hsl(var(--chart-2))" 
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

        <TabsContent value="costCenter" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costCenterStats.slice(0, 15)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      tickFormatter={(v) => metric === 'headcount' ? String(v) : formatCurrency(v)} 
                    />
                    <YAxis type="category" dataKey="costCenter" width={120} tick={{ fontSize: 12 }} />
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
          <CardTitle>Department Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Department</th>
                  <th className="text-right py-3 px-4 font-medium">Headcount</th>
                  <th className="text-right py-3 px-4 font-medium">Total FLRR</th>
                  <th className="text-right py-3 px-4 font-medium">Avg FLRR</th>
                  <th className="text-right py-3 px-4 font-medium">Best-Cost %</th>
                </tr>
              </thead>
              <tbody>
                {departmentStats.map((dept) => (
                  <tr key={dept.department} className="border-b hover:bg-secondary/30">
                    <td className="py-3 px-4 font-medium">{dept.department}</td>
                    <td className="py-3 px-4 text-right">{formatNumber(dept.headcount)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(dept.totalFLRR)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(dept.avgFLRR)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={dept.bestCostPercent > 40 ? 'text-success' : 'text-muted-foreground'}>
                        {dept.bestCostPercent.toFixed(0)}%
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