import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { AnalysisData, Benchmarks } from '@/types/employee';
import { formatCurrency, formatPercent, defaultBenchmarks } from '@/lib/analysis';
import { AlertTriangle, TrendingUp } from 'lucide-react';

interface CompensationAnalysisProps {
  data: AnalysisData;
  benchmarks?: Benchmarks;
}

export function CompensationAnalysis({ data, benchmarks = defaultBenchmarks }: CompensationAnalysisProps) {
  const { roleFamilyStats } = data;

  const chartData = roleFamilyStats.map(role => {
    const target = benchmarks.targetVariableByRole[role.roleFamily] || benchmarks.targetVariableByRole['default'];
    return {
      roleFamily: role.roleFamily,
      'Variable %': role.avgVariablePercent,
      'Target %': target,
      base: role.totalBase,
      bonus: role.totalBonus,
      headcount: role.headcount,
      gap: target - role.avgVariablePercent,
      isBelow: role.avgVariablePercent < target * 0.7,
    };
  }).sort((a, b) => b.gap - a.gap);

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
                <div key={role.roleFamily} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{role.roleFamily}</span>
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

      {/* Variable Compensation by Role Family */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Variable Compensation by Role Family
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 50]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="roleFamily" width={100} tick={{ fontSize: 12 }} />
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
          <CardTitle>Compensation Breakdown by Role Family</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Role Family</th>
                  <th className="text-right py-3 px-4 font-medium">Headcount</th>
                  <th className="text-right py-3 px-4 font-medium">Total Base</th>
                  <th className="text-right py-3 px-4 font-medium">Total Bonus</th>
                  <th className="text-right py-3 px-4 font-medium">Total FLRR</th>
                  <th className="text-right py-3 px-4 font-medium">Variable %</th>
                  <th className="text-right py-3 px-4 font-medium">Target %</th>
                  <th className="text-right py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((role) => (
                  <tr key={role.roleFamily} className="border-b hover:bg-secondary/30">
                    <td className="py-3 px-4 font-medium">{role.roleFamily}</td>
                    <td className="py-3 px-4 text-right">{role.headcount}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(role.base)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(role.bonus)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(roleFamilyStats.find(r => r.roleFamily === role.roleFamily)?.totalFLRR || 0)}</td>
                    <td className="py-3 px-4 text-right">{formatPercent(role['Variable %'])}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{formatPercent(role['Target %'])}</td>
                    <td className="py-3 px-4 text-right">
                      {role.isBelow ? (
                        <Badge variant="outline" className="text-warning border-warning">
                          Below target
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-success border-success">
                          On target
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            * Benchmarks represent industry-standard variable compensation percentages for each role family
          </p>
        </CardContent>
      </Card>
    </div>
  );
}