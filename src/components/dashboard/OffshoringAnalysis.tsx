import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AnalysisData } from '@/types/employee';
import { formatCurrency, formatPercent } from '@/lib/analysis';
import { Globe, TrendingDown, DollarSign } from 'lucide-react';

interface OffshoringAnalysisProps {
  data: AnalysisData;
}

const COLORS = {
  bestCost: 'hsl(var(--success))',
  highCost: 'hsl(var(--chart-1))',
};

export function OffshoringAnalysis({ data }: OffshoringAnalysisProps) {
  const [savingsRatio, setSavingsRatio] = useState(40);
  const { employees, roleFamilyStats, departmentStats } = data;

  const bestCostCount = employees.filter(e => e.countryTag === 'Best-cost').length;
  const highCostCount = employees.length - bestCostCount;
  const bestCostFLRR = employees.filter(e => e.countryTag === 'Best-cost').reduce((sum, e) => sum + e.flrr, 0);
  const highCostFLRR = employees.filter(e => e.countryTag === 'High-cost').reduce((sum, e) => sum + e.flrr, 0);

  const pieData = [
    { name: 'Best-cost', value: bestCostCount, flrr: bestCostFLRR },
    { name: 'High-cost', value: highCostCount, flrr: highCostFLRR },
  ];

  const roleOpportunities = roleFamilyStats
    .map(role => ({
      ...role,
      highCostFLRR: employees
        .filter(e => e.roleFamily === role.roleFamily && e.countryTag === 'High-cost')
        .reduce((sum, e) => sum + e.flrr, 0),
      potentialSavings: employees
        .filter(e => e.roleFamily === role.roleFamily && e.countryTag === 'High-cost')
        .reduce((sum, e) => sum + e.flrr, 0) * (savingsRatio / 100),
    }))
    .filter(r => r.highCostCount > 0)
    .sort((a, b) => b.potentialSavings - a.potentialSavings);

  const totalPotentialSavings = highCostFLRR * (savingsRatio / 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-success/10 border-success/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Best-Cost Locations</p>
                <p className="text-2xl font-bold">{bestCostCount}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(bestCostFLRR)} FLRR</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">High-Cost Locations</p>
                <p className="text-2xl font-bold">{highCostCount}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(highCostFLRR)} FLRR</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-aubergine text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8" />
              <div>
                <p className="text-sm opacity-80">Potential Savings</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPotentialSavings)}</p>
                <p className="text-sm opacity-80">at {savingsRatio}% cost reduction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Savings Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Savings Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Best-cost savings assumption</span>
              <span className="font-medium">{savingsRatio}%</span>
            </div>
            <Slider
              value={[savingsRatio]}
              onValueChange={(v) => setSavingsRatio(v[0])}
              min={20}
              max={60}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>20%</span>
              <span>60%</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50">
            <p className="text-sm text-muted-foreground mb-1">
              If all high-cost roles were moved to best-cost locations:
            </p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(totalPotentialSavings)}
            </p>
            <p className="text-sm text-muted-foreground">annual FLRR savings</p>
          </div>
        </CardContent>
      </Card>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Headcount Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill={COLORS.bestCost} />
                    <Cell fill={COLORS.highCost} />
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `${value} employees (${formatCurrency(props.payload.flrr)})`,
                      name
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <span className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.bestCost }} />
                Best-cost
              </span>
              <span className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.highCost }} />
                High-cost
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best-Cost Penetration by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="department" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="bestCostPercent" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunity by Role Family */}
      <Card>
        <CardHeader>
          <CardTitle>Offshoring Opportunity by Role Family</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Role Family</th>
                  <th className="text-right py-3 px-4 font-medium">Total HC</th>
                  <th className="text-right py-3 px-4 font-medium">High-Cost HC</th>
                  <th className="text-right py-3 px-4 font-medium">High-Cost FLRR</th>
                  <th className="text-right py-3 px-4 font-medium">Potential Savings</th>
                  <th className="text-right py-3 px-4 font-medium">Best-Cost %</th>
                </tr>
              </thead>
              <tbody>
                {roleOpportunities.map((role) => (
                  <tr key={role.roleFamily} className="border-b hover:bg-secondary/30">
                    <td className="py-3 px-4 font-medium">{role.roleFamily}</td>
                    <td className="py-3 px-4 text-right">{role.headcount}</td>
                    <td className="py-3 px-4 text-right">{role.highCostCount}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(role.highCostFLRR)}</td>
                    <td className="py-3 px-4 text-right font-medium text-primary">
                      {formatCurrency(role.potentialSavings)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={role.bestCostCount / role.headcount > 0.4 ? 'text-success' : 'text-muted-foreground'}>
                        {formatPercent((role.bestCostCount / role.headcount) * 100)}
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