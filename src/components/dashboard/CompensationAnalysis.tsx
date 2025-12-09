import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AnalysisData, Benchmarks } from '@/types/employee';
import { formatCurrency, formatPercent, defaultBenchmarks } from '@/lib/analysis';
import { AlertTriangle, TrendingUp, Users } from 'lucide-react';

interface CompensationAnalysisProps {
  data: AnalysisData;
  benchmarks?: Benchmarks;
}

interface CompDifference {
  title: string;
  function: string;
  employees: {
    id: string;
    flrr: number;
    baseSalary: number;
    bonus: number;
  }[];
  minComp: number;
  maxComp: number;
  avgComp: number;
  variance: number;
  variancePercent: number;
}

export function CompensationAnalysis({ data, benchmarks = defaultBenchmarks }: CompensationAnalysisProps) {
  const { employees, functionStats } = data;

  // Calculate variable compensation by function
  const chartData = useMemo(() => {
    return functionStats.map(func => {
      const funcEmps = employees.filter(e => e.function === func.function);
      const totalBase = funcEmps.reduce((sum, e) => sum + e.baseSalary, 0);
      const totalBonus = funcEmps.reduce((sum, e) => sum + e.bonus, 0);
      const totalComp = totalBase + totalBonus;
      const avgVariablePercent = totalComp > 0 ? (totalBonus / totalComp) * 100 : 0;
      
      const target = benchmarks.targetVariableByRole[func.function] || benchmarks.targetVariableByRole['default'];
      
      return {
        function: func.function,
        'Variable %': avgVariablePercent,
        'Target %': target,
        base: totalBase,
        bonus: totalBonus,
        headcount: func.headcount,
        gap: target - avgVariablePercent,
        isBelow: avgVariablePercent < target * 0.7,
      };
    }).sort((a, b) => b.gap - a.gap);
  }, [employees, functionStats, benchmarks]);

  // Find significant compensation differences for same job title
  const compDifferences = useMemo(() => {
    const titleMap = new Map<string, typeof employees>();
    
    employees.forEach(emp => {
      const key = emp.title;
      const existing = titleMap.get(key) || [];
      existing.push(emp);
      titleMap.set(key, existing);
    });

    const differences: CompDifference[] = [];

    titleMap.forEach((emps, title) => {
      if (emps.length < 2) return;
      
      const comps = emps.map(e => e.baseSalary + e.bonus);
      const minComp = Math.min(...comps);
      const maxComp = Math.max(...comps);
      const avgComp = comps.reduce((a, b) => a + b, 0) / comps.length;
      const variance = maxComp - minComp;
      const variancePercent = avgComp > 0 ? (variance / avgComp) * 100 : 0;

      // Flag if variance is > 30% of average
      if (variancePercent > 30 && variance > 10000) {
        differences.push({
          title,
          function: emps[0].function,
          employees: emps.map(e => ({
            id: e.employeeId,
            flrr: e.flrr,
            baseSalary: e.baseSalary,
            bonus: e.bonus,
          })),
          minComp,
          maxComp,
          avgComp,
          variance,
          variancePercent,
        });
      }
    });

    return differences.sort((a, b) => b.variancePercent - a.variancePercent).slice(0, 15);
  }, [employees]);

  const misalignedRoles = chartData.filter(r => r.isBelow);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Misaligned Incentives Alert */}
      {misalignedRoles.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Misaligned Incentive Structures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {misalignedRoles.map((role) => (
                <div key={role.function} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{role.function}</span>
                    <Badge variant="outline" className="text-warning border-warning">
                      {role.gap.toFixed(0)}pp gap
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Current: {formatPercent(role['Variable %'])} | Target: {formatPercent(role['Target %'])}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {role.headcount} employees
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variable Compensation by Function */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Variable Compensation by Function
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 50]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="function" width={100} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="Variable %" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isBelow ? 'hsl(var(--warning))' : 'hsl(var(--primary))'} 
                    />
                  ))}
                </Bar>
                <Bar dataKey="Target %" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Compensation Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compensation Breakdown by Function</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Function</TableHead>
                  <TableHead className="text-right">Headcount</TableHead>
                  <TableHead className="text-right">Total Base</TableHead>
                  <TableHead className="text-right">Total Bonus</TableHead>
                  <TableHead className="text-right">Total FLRR</TableHead>
                  <TableHead className="text-right">Variable %</TableHead>
                  <TableHead className="text-right">Target %</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((role) => (
                  <TableRow key={role.function}>
                    <TableCell className="font-medium">{role.function}</TableCell>
                    <TableCell className="text-right">{role.headcount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(role.base)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(role.bonus)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(functionStats.find(r => r.function === role.function)?.totalFLRR || 0)}</TableCell>
                    <TableCell className="text-right">{formatPercent(role['Variable %'])}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatPercent(role['Target %'])}</TableCell>
                    <TableCell className="text-right">
                      {role.isBelow ? (
                        <Badge variant="outline" className="text-warning border-warning">
                          Below target
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-success border-success">
                          On target
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Benchmark Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Variable Compensation Benchmarks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(benchmarks.targetVariableByRole)
              .filter(([key]) => key !== 'default')
              .map(([role, target]) => (
                <div key={role} className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">{role}</p>
                  <p className="text-lg font-semibold">{target}%</p>
                </div>
              ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            * Benchmarks represent industry-standard variable compensation percentages for each function
          </p>
        </CardContent>
      </Card>

      {/* Significant Compensation Differences */}
      {compDifferences.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-destructive" />
              Significant Compensation Differences by Job Title
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The following job titles show significant compensation variance (&gt;30%) among employees with the same title:
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Function</TableHead>
                    <TableHead className="text-right"># Employees</TableHead>
                    <TableHead className="text-right">Min Comp</TableHead>
                    <TableHead className="text-right">Max Comp</TableHead>
                    <TableHead className="text-right">Avg Comp</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-right">Variance %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compDifferences.map((diff) => (
                    <TableRow key={diff.title}>
                      <TableCell className="font-medium">{diff.title}</TableCell>
                      <TableCell>{diff.function}</TableCell>
                      <TableCell className="text-right">{diff.employees.length}</TableCell>
                      <TableCell className="text-right">{formatCurrency(diff.minComp)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(diff.maxComp)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(diff.avgComp)}</TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        {formatCurrency(diff.variance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-destructive border-destructive">
                          {formatPercent(diff.variancePercent)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
