import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AnalysisData } from '@/types/employee';
import { formatCurrency } from '@/lib/analysis';
import { Clock, AlertTriangle, Users } from 'lucide-react';

interface TenureAnalysisProps {
  data: AnalysisData;
}

const TENURE_COLORS = [
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
  'hsl(var(--chart-2))',
  'hsl(var(--success))',
];

export function TenureAnalysis({ data }: TenureAnalysisProps) {
  const { employees, tenureBands, departmentStats } = data;
  const now = new Date();

  // Calculate tenure for each employee
  const employeesWithTenure = employees.map(emp => {
    const hireDate = new Date(emp.hireDate);
    const years = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return { ...emp, tenureYears: years };
  });

  // Flight risk: <1 year tenure
  const flightRisk = employeesWithTenure
    .filter(e => e.tenureYears < 1)
    .sort((a, b) => b.flrr - a.flrr);

  // Institutional knowledge concentration: >5 years
  const knowledgeConcentration = employeesWithTenure
    .filter(e => e.tenureYears >= 5)
    .sort((a, b) => b.tenureYears - a.tenureYears);

  // Tenure by department
  const tenureByDept = departmentStats.map(dept => {
    const deptEmployees = employeesWithTenure.filter(e => e.department === dept.department);
    const avgTenure = deptEmployees.reduce((sum, e) => sum + e.tenureYears, 0) / deptEmployees.length;
    const newHires = deptEmployees.filter(e => e.tenureYears < 1).length;
    const veterans = deptEmployees.filter(e => e.tenureYears >= 5).length;
    return {
      department: dept.department,
      avgTenure,
      headcount: dept.headcount,
      newHires,
      veterans,
      newHirePercent: (newHires / dept.headcount) * 100,
    };
  }).sort((a, b) => b.newHirePercent - a.newHirePercent);

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
                <p className="text-2xl font-bold">
                  {(employeesWithTenure.reduce((sum, e) => sum + e.tenureYears, 0) / employees.length).toFixed(1)} years
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={flightRisk.length > employees.length * 0.2 ? 'border-destructive/50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-8 h-8 ${flightRisk.length > employees.length * 0.2 ? 'text-destructive' : 'text-warning'}`} />
              <div>
                <p className="text-sm text-muted-foreground">Flight Risk (&lt;1yr)</p>
                <p className="text-2xl font-bold">{flightRisk.length}</p>
                <p className="text-sm text-muted-foreground">
                  {((flightRisk.length / employees.length) * 100).toFixed(0)}% of workforce
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={knowledgeConcentration.length > employees.length * 0.3 ? 'border-warning/50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Veterans (5+ yrs)</p>
                <p className="text-2xl font-bold">{knowledgeConcentration.length}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(knowledgeConcentration.reduce((sum, e) => sum + e.flrr, 0))} FLRR
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

      {/* Tenure by Department */}
      <Card>
        <CardHeader>
          <CardTitle>New Hire Concentration by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenureByDept.slice(0, 10)} layout="vertical">
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
                <Bar dataKey="newHirePercent" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Flight Risk Details */}
      {flightRisk.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Flight Risk Employees (&lt;1 year tenure)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
              {flightRisk.slice(0, 15).map((emp) => (
                <div key={emp.employeeId} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{emp.name}</span>
                    <Badge variant="outline" className="text-warning border-warning text-xs">
                      {emp.tenureYears.toFixed(1)} yrs
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{emp.title}</p>
                  <p className="text-sm text-muted-foreground">{emp.department}</p>
                  <p className="text-sm font-medium text-primary mt-1">{formatCurrency(emp.flrr)}</p>
                </div>
              ))}
              {flightRisk.length > 15 && (
                <div className="p-3 rounded-lg border bg-secondary/50 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">+{flightRisk.length - 15} more</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Knowledge Concentration */}
      {knowledgeConcentration.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-success" />
              Institutional Knowledge (5+ years tenure)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
              {knowledgeConcentration.slice(0, 15).map((emp) => (
                <div key={emp.employeeId} className="p-3 rounded-lg border bg-success/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{emp.name}</span>
                    <Badge variant="outline" className="text-success border-success text-xs">
                      {emp.tenureYears.toFixed(1)} yrs
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{emp.title}</p>
                  <p className="text-sm text-muted-foreground">{emp.department}</p>
                </div>
              ))}
              {knowledgeConcentration.length > 15 && (
                <div className="p-3 rounded-lg border bg-secondary/50 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">+{knowledgeConcentration.length - 15} more</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}