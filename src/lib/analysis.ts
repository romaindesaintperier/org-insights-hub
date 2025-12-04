import { 
  Employee, 
  OrgNode, 
  LayerStats, 
  SpanStats, 
  DepartmentStats, 
  RoleFamilyStats, 
  TenureBand, 
  QuickWin, 
  AnalysisData,
  Benchmarks 
} from '@/types/employee';

export const defaultBenchmarks: Benchmarks = {
  minSpan: 4,
  maxSpan: 10,
  maxLayers: 6,
  targetVariableByRole: {
    'Sales': 40,
    'Executive': 30,
    'Engineering': 15,
    'Operations': 10,
    'Support': 10,
    'Finance': 15,
    'Marketing': 20,
    'HR': 10,
    'default': 15,
  },
  bestCostRatio: 0.4, // 40% cost savings for best-cost locations
};

export function buildOrgTree(employees: Employee[]): OrgNode | null {
  const employeeMap = new Map<string, OrgNode>();
  
  employees.forEach(emp => {
    employeeMap.set(emp.employeeId, {
      ...emp,
      children: [],
      layer: 0,
      directReports: 0,
    });
  });

  let root: OrgNode | null = null;

  employeeMap.forEach(node => {
    if (!node.managerId || !employeeMap.has(node.managerId)) {
      root = node;
    } else {
      const manager = employeeMap.get(node.managerId);
      if (manager) {
        manager.children.push(node);
        manager.directReports++;
      }
    }
  });

  // Calculate layers
  function setLayers(node: OrgNode, layer: number) {
    node.layer = layer;
    node.children.forEach(child => setLayers(child, layer + 1));
  }

  if (root) {
    setLayers(root, 1);
  }

  return root;
}

export function calculateLayerStats(employees: Employee[], orgTree: OrgNode | null): LayerStats[] {
  if (!orgTree) return [];

  const layerMap = new Map<number, Employee[]>();

  function traverse(node: OrgNode) {
    const emp = employees.find(e => e.employeeId === node.employeeId);
    if (emp) {
      const existing = layerMap.get(node.layer) || [];
      existing.push(emp);
      layerMap.set(node.layer, existing);
    }
    node.children.forEach(traverse);
  }

  traverse(orgTree);

  return Array.from(layerMap.entries())
    .map(([layer, emps]) => ({
      layer,
      headcount: emps.length,
      totalFLRR: emps.reduce((sum, e) => sum + e.flrr, 0),
      avgFLRR: emps.reduce((sum, e) => sum + e.flrr, 0) / emps.length,
      managers: emps.filter(e => employees.some(emp => emp.managerId === e.employeeId)).length,
      ics: emps.filter(e => !employees.some(emp => emp.managerId === e.employeeId)).length,
    }))
    .sort((a, b) => a.layer - b.layer);
}

export function calculateSpanStats(employees: Employee[], orgTree: OrgNode | null): SpanStats[] {
  if (!orgTree) return [];

  const spans: SpanStats[] = [];

  function traverse(node: OrgNode) {
    if (node.children.length > 0) {
      spans.push({
        managerId: node.employeeId,
        managerName: node.name,
        department: node.department,
        directReports: node.children.length,
        layer: node.layer,
      });
    }
    node.children.forEach(traverse);
  }

  traverse(orgTree);
  return spans;
}

export function calculateDepartmentStats(employees: Employee[]): DepartmentStats[] {
  const deptMap = new Map<string, Employee[]>();

  employees.forEach(emp => {
    const existing = deptMap.get(emp.department) || [];
    existing.push(emp);
    deptMap.set(emp.department, existing);
  });

  return Array.from(deptMap.entries()).map(([department, emps]) => {
    const bestCostCount = emps.filter(e => e.countryTag === 'Best-cost').length;
    return {
      department,
      headcount: emps.length,
      totalFLRR: emps.reduce((sum, e) => sum + e.flrr, 0),
      avgFLRR: emps.reduce((sum, e) => sum + e.flrr, 0) / emps.length,
      bestCostCount,
      highCostCount: emps.length - bestCostCount,
      bestCostPercent: (bestCostCount / emps.length) * 100,
    };
  });
}

export function calculateRoleFamilyStats(employees: Employee[]): RoleFamilyStats[] {
  const roleMap = new Map<string, Employee[]>();

  employees.forEach(emp => {
    const existing = roleMap.get(emp.roleFamily) || [];
    existing.push(emp);
    roleMap.set(emp.roleFamily, existing);
  });

  return Array.from(roleMap.entries()).map(([roleFamily, emps]) => {
    const totalBase = emps.reduce((sum, e) => sum + e.baseSalary, 0);
    const totalBonus = emps.reduce((sum, e) => sum + e.bonus, 0);
    const totalComp = totalBase + totalBonus;
    const avgVariablePercent = totalComp > 0 ? (totalBonus / totalComp) * 100 : 0;
    const bestCostCount = emps.filter(e => e.countryTag === 'Best-cost').length;

    return {
      roleFamily,
      headcount: emps.length,
      totalFLRR: emps.reduce((sum, e) => sum + e.flrr, 0),
      totalBase,
      totalBonus,
      avgVariablePercent,
      bestCostCount,
      highCostCount: emps.length - bestCostCount,
    };
  });
}

export function calculateTenureBands(employees: Employee[]): TenureBand[] {
  const now = new Date();
  const bands = [
    { band: '0-1 years', min: 0, max: 1 },
    { band: '1-3 years', min: 1, max: 3 },
    { band: '3-5 years', min: 3, max: 5 },
    { band: '5+ years', min: 5, max: 100 },
  ];

  return bands.map(({ band, min, max }) => {
    const emps = employees.filter(emp => {
      const hireDate = new Date(emp.hireDate);
      const years = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return years >= min && years < max;
    });

    return {
      band,
      min,
      max,
      headcount: emps.length,
      totalFLRR: emps.reduce((sum, e) => sum + e.flrr, 0),
    };
  });
}

export function generateQuickWins(
  employees: Employee[],
  layerStats: LayerStats[],
  spanStats: SpanStats[],
  roleFamilyStats: RoleFamilyStats[],
  benchmarks: Benchmarks = defaultBenchmarks
): QuickWin[] {
  const quickWins: QuickWin[] = [];

  // Check offshoring opportunity
  const highCostEmps = employees.filter(e => e.countryTag === 'High-cost');
  const highCostPercent = (highCostEmps.length / employees.length) * 100;
  const highCostFLRR = highCostEmps.reduce((sum, e) => sum + e.flrr, 0);
  
  if (highCostPercent > 50) {
    const potentialSavings = highCostFLRR * benchmarks.bestCostRatio;
    quickWins.push({
      id: 'offshoring-1',
      title: 'High-Cost Location Concentration',
      description: `${highCostPercent.toFixed(0)}% of headcount (${highCostEmps.length} employees) is in high-cost locations. Potential FLRR savings of $${(potentialSavings / 1000000).toFixed(1)}M if shifted to best-cost.`,
      impact: 'high',
      category: 'offshoring',
      metric: `$${(potentialSavings / 1000000).toFixed(1)}M potential savings`,
    });
  }

  // Check for single-report managers
  const singleReportManagers = spanStats.filter(s => s.directReports === 1);
  if (singleReportManagers.length > 0) {
    quickWins.push({
      id: 'spans-1',
      title: 'Single-Report Managers',
      description: `${singleReportManagers.length} managers have only 1 direct report. Consider consolidating layers.`,
      impact: singleReportManagers.length > 5 ? 'high' : 'medium',
      category: 'spans',
      metric: `${singleReportManagers.length} managers`,
    });
  }

  // Check for narrow spans
  const narrowSpans = spanStats.filter(s => s.directReports < benchmarks.minSpan && s.directReports > 1);
  if (narrowSpans.length > 3) {
    quickWins.push({
      id: 'spans-2',
      title: 'Narrow Spans of Control',
      description: `${narrowSpans.length} managers have fewer than ${benchmarks.minSpan} direct reports. Industry benchmark is ${benchmarks.minSpan}-${benchmarks.maxSpan}.`,
      impact: 'medium',
      category: 'spans',
      metric: `${narrowSpans.length} managers below benchmark`,
    });
  }

  // Check excessive layers
  const maxLayer = Math.max(...layerStats.map(l => l.layer));
  if (maxLayer > benchmarks.maxLayers) {
    quickWins.push({
      id: 'structure-1',
      title: 'Excessive Organizational Layers',
      description: `Organization has ${maxLayer} layers. Best practice is ${benchmarks.maxLayers} or fewer.`,
      impact: 'high',
      category: 'structure',
      metric: `${maxLayer - benchmarks.maxLayers} excess layers`,
    });
  }

  // Check variable compensation alignment
  roleFamilyStats.forEach(role => {
    const target = benchmarks.targetVariableByRole[role.roleFamily] || benchmarks.targetVariableByRole['default'];
    if (role.avgVariablePercent < target * 0.5) {
      quickWins.push({
        id: `comp-${role.roleFamily}`,
        title: `Low Variable Comp: ${role.roleFamily}`,
        description: `${role.roleFamily} roles average ${role.avgVariablePercent.toFixed(0)}% variable compensation. Target is ${target}%.`,
        impact: role.roleFamily === 'Sales' ? 'high' : 'medium',
        category: 'compensation',
        metric: `${(target - role.avgVariablePercent).toFixed(0)}pp gap`,
      });
    }
  });

  return quickWins.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });
}

export function analyzeEmployeeData(employees: Employee[], benchmarks: Benchmarks = defaultBenchmarks): AnalysisData {
  const orgTree = buildOrgTree(employees);
  const layerStats = calculateLayerStats(employees, orgTree);
  const spanStats = calculateSpanStats(employees, orgTree);
  const departmentStats = calculateDepartmentStats(employees);
  const roleFamilyStats = calculateRoleFamilyStats(employees);
  const tenureBands = calculateTenureBands(employees);
  const quickWins = generateQuickWins(employees, layerStats, spanStats, roleFamilyStats, benchmarks);

  const managers = spanStats.length;
  const ics = employees.length - managers;
  const bestCostCount = employees.filter(e => e.countryTag === 'Best-cost').length;
  const totalBonus = employees.reduce((sum, e) => sum + e.bonus, 0);
  const totalBase = employees.reduce((sum, e) => sum + e.baseSalary, 0);

  return {
    employees,
    orgTree,
    layerStats,
    spanStats,
    departmentStats,
    roleFamilyStats,
    tenureBands,
    quickWins,
    totals: {
      headcount: employees.length,
      totalFLRR: employees.reduce((sum, e) => sum + e.flrr, 0),
      avgFLRR: employees.reduce((sum, e) => sum + e.flrr, 0) / employees.length,
      layers: layerStats.length,
      avgSpan: spanStats.length > 0 
        ? spanStats.reduce((sum, s) => sum + s.directReports, 0) / spanStats.length 
        : 0,
      bestCostPercent: (bestCostCount / employees.length) * 100,
      avgVariablePercent: (totalBase + totalBonus) > 0 
        ? (totalBonus / (totalBase + totalBonus)) * 100 
        : 0,
      managerToICRatio: ics > 0 ? managers / ics : 0,
    },
  };
}

export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}