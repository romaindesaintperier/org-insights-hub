import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { AnalysisData } from '@/types/employee';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/analysis';
import { Clock, Users, TrendingUp, ArrowUp } from 'lucide-react';

interface TenureAnalysisProps {
  data: AnalysisData;
}

const TENURE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--success))',
];

// Generate distinct colors for functions
const FUNCTION_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--accent))',
];

export function TenureAnalysis({ data }: TenureAnalysisProps) {
  const { employees, tenureBands, functionStats } = data;
  const now = new Date();

  // Calculate tenure for each employee
  const employeesWithTenure = useMemo(() => {
    return employees.map(emp => {
      const hireDate = new Date(emp.hireDate);
      const years = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return { ...emp, tenureYears: years };
    });
  }, [employees, now]);

  // Recent joiners (< 1 year tenure)
  const recentJoiners = useMemo(() => {
    return employeesWithTenure
      .filter(e => e.tenureYears < 1)
      .sort((a, b) => b.flrr - a.flrr);
  }, [employeesWithTenure]);

  // Average tenure by function
  const tenureByFunction = useMemo(() => {
    return functionStats.map(func => {
      const funcEmps = employeesWithTenure.filter(e => e.function === func.function);
      const avgTenure = funcEmps.reduce((sum, e) => sum + e.tenureYears, 0) / funcEmps.length;
      return {
        function: func.function,
        avgTenure,
        headcount: func.headcount,
      };
    }).sort((a, b) => b.avgTenure - a.avgTenure);
  }, [employeesWithTenure, functionStats]);

  // Hiring by quarter (last 20 quarters)
  const hiringByQuarter = useMemo(() => {
    const quarters: { quarter: string; date: Date; hires: Record<string, number>; total: number }[] = [];
    const today = new Date();
    
    // Generate last 20 quarters
    for (let i = 19; i >= 0; i--) {
      const quarterDate = new Date(today);
      quarterDate.setMonth(today.getMonth() - (i * 3));
      const year = quarterDate.getFullYear();
      const q = Math.floor(quarterDate.getMonth() / 3) + 1;
      quarters.push({
        quarter: `Q${q} ${year}`,
        date: new Date(year, (q - 1) * 3, 1),
        hires: {},
        total: 0,
      });
    }

    // Get unique functions for coloring
    const functions = [...new Set(employees.map(e => e.function))];

    // Count hires per quarter per function
    employees.forEach(emp => {
      const hireDate = new Date(emp.hireDate);
      
      quarters.forEach(q => {
        const quarterEnd = new Date(q.date);
        quarterEnd.setMonth(quarterEnd.getMonth() + 3);
        
        if (hireDate >= q.date && hireDate < quarterEnd) {
          q.hires[emp.function] = (q.hires[emp.function] || 0) + 1;
          q.total++;
        }
      });
    });

    // Convert to chart format
    return {
      data: quarters.map(q => ({
        quarter: q.quarter,
        ...q.hires,
        total: q.total,
      })),
      functions,
    };
  }, [employees]);

  // New hire concentration by function (past year)
  const newHireConcentration = useMemo(() => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const newHires = employees.filter(emp => new Date(emp.hireDate) >= oneYearAgo);
    const totalNewHires = newHires.length;
    
    const byFunction = functionStats.map(func => {
      const funcNewHires = newHires.filter(e => e.function === func.function).length;
      return {
        function: func.function,
        newHires: funcNewHires,
        percentOfNewHires: totalNewHires > 0 ? (funcNewHires / totalNewHires) * 100 : 0,
      };
    }).sort((a, b) => b.newHires - a.newHires);
    
    return { byFunction, totalNewHires };
  }, [employees, functionStats]);

  // Highest growing functions (new hires / total employees in function)
  const fastestGrowingFunctions = useMemo(() => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    return functionStats.map(func => {
      const funcEmps = employees.filter(e => e.function === func.function);
      const funcNewHires = funcEmps.filter(e => new Date(e.hireDate) >= oneYearAgo).length;
      const growthRate = funcEmps.length > 0 ? (funcNewHires / funcEmps.length) * 100 : 0;
      
      return {
        function: func.function,
        totalEmployees: funcEmps.length,
        newHires: funcNewHires,
        growthRate,
      };
    }).sort((a, b) => b.growthRate - a.growthRate);
  }, [employees, functionStats]);

  const avgTenure = employeesWithTenure.reduce((sum, e) => sum + e.tenureYears, 0) / employees.length;
  const veterans = employeesWithTenure.filter(e => e.tenureYears >= 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Tenure</p>
                <p className="text-2xl font-bold">{avgTenure.toFixed(1)} years</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-chart-2" />
              <div>
                <p className="text-sm text-muted-foreground">Recent Joiners (&lt;1yr)</p>
                <p className="text-2xl font-bold">{recentJoiners.length}</p>
                <p className="text-sm text-muted-foreground">
                  {((recentJoiners.length / employees.length) * 100).toFixed(0)}% of workforce
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Veterans (5+ yrs)</p>
                <p className="text-2xl font-bold">{veterans.length}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(veterans.reduce((sum, e) => sum + e.flrr, 0))} FLRR
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenure Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tenure Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tenureBands}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="band" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'headcount' ? value : formatCurrency(value),
                      name === 'headcount' ? 'Employees' : 'Total FLRR'
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="headcount" radius={[4, 4, 0, 0]}>
                    {tenureBands.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TENURE_COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {tenureBands.map((band, index) => (
                <span key={band.band} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TENURE_COLORS[index] }} />
                  {band.band}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FLRR by Tenure Band</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tenureBands}
                    dataKey="totalFLRR"
                    nameKey="band"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {tenureBands.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TENURE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Average Tenure by Function */}
      <Card>
        <CardHeader>
          <CardTitle>Average Tenure by Function</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenureByFunction} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" unit=" yrs" />
                <YAxis 
                  type="category" 
                  dataKey="function" 
                  width={120} 
                  tick={{ fontSize: 11 }} 
                  interval={0}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)} years`, 'Avg Tenure']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="avgTenure" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Hiring Trend by Quarter */}
      <Card>
        <CardHeader>
          <CardTitle>Hiring Trend (Last 20 Quarters)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hiringByQuarter.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="quarter" 
                  tick={{ fontSize: 10 }} 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                {hiringByQuarter.functions.map((func, index) => (
                  <Bar 
                    key={func} 
                    dataKey={func} 
                    stackId="a" 
                    fill={FUNCTION_COLORS[index % FUNCTION_COLORS.length]} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* New Hire Concentration by Function */}
      <Card>
        <CardHeader>
          <CardTitle>New Hire Concentration by Function (Past Year)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Total new hires in past year: <strong>{newHireConcentration.totalNewHires}</strong>
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Function</TableHead>
                <TableHead className="text-right"># New Hires</TableHead>
                <TableHead className="text-right">% of Total New Hires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {newHireConcentration.byFunction.filter(f => f.newHires > 0).map((func) => (
                <TableRow key={func.function}>
                  <TableCell className="font-medium">{func.function}</TableCell>
                  <TableCell className="text-right">{formatNumber(func.newHires)}</TableCell>
                  <TableCell className="text-right">{formatPercent(func.percentOfNewHires)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Fastest Growing Functions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUp className="w-5 h-5 text-success" />
            Fastest Growing Functions (Past Year)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fastestGrowingFunctions.slice(0, 9).map((func, index) => (
              <div key={func.function} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{func.function}</span>
                  <Badge variant={index < 3 ? 'default' : 'secondary'} className={index < 3 ? 'bg-success' : ''}>
                    +{func.growthRate.toFixed(0)}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {func.newHires} new hires out of {func.totalEmployees} total
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Joiners List */}
      {recentJoiners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-chart-2" />
              Recent Joiners (&lt;1 year tenure)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
              {recentJoiners.slice(0, 15).map((emp) => (
                <div key={emp.employeeId} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{emp.title}</span>
                    <Badge variant="outline" className="text-chart-2 border-chart-2 text-xs">
                      {emp.tenureYears.toFixed(1)} yrs
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{emp.function}</p>
                  <p className="text-sm font-medium text-primary mt-1">{formatCurrency(emp.flrr)}</p>
                </div>
              ))}
              {recentJoiners.length > 15 && (
                <div className="p-3 rounded-lg border bg-secondary/50 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">+{recentJoiners.length - 15} more</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
