import { 
  Employee, 
  OrgNode, 
  LayerStats, 
  SpanStats, 
  FunctionStats, 
  FunctionSpanStats,
  CountryStats,
  TenureBand, 
  QuickWin, 
  AnalysisData,
  Benchmarks 
} from '@/types/employee';

export const defaultBenchmarks: Benchmarks = {
  minSpan: 5,
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
  bestCostRatio: 0.4,
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

  function setLayers(node: OrgNode, layer: number) {
    node.layer = layer;
    node.children.forEach(child => setLayers(child, layer + 1));
  }

  // CEO is layer 0
  if (root) {
    setLayers(root, 0);
  }

  return root;
}

export function calculateLayerStats(employees: Employee[], orgTree: OrgNode | null): LayerStats[] {
  if (!orgTree) return [];

  const layerMap = new Map<number, Employee[]>();
  const now = new Date();

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
    .map(([layer, emps]) => {
      const tenures = emps.map(e => {
        const hireDate = new Date(e.hireDate);
        return (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      });
      const avgTenure = tenures.length > 0 ? tenures.reduce((a, b) => a + b, 0) / tenures.length : 0;

      return {
        layer,
        headcount: emps.length,
        totalFLRR: emps.reduce((sum, e) => sum + e.flrr, 0),
        avgFLRR: emps.reduce((sum, e) => sum + e.flrr, 0) / emps.length,
        managers: emps.filter(e => employees.some(emp => emp.managerId === e.employeeId)).length,
        ics: emps.filter(e => !employees.some(emp => emp.managerId === e.employeeId)).length,
        avgTenure,
      };
    })
    .sort((a, b) => a.layer - b.layer);
}

export function calculateSpanStats(employees: Employee[], orgTree: OrgNode | null): SpanStats[] {
  if (!orgTree) return [];

  const spans: SpanStats[] = [];

  function traverse(node: OrgNode) {
    if (node.children.length > 0) {
      spans.push({
        managerId: node.employeeId,
        managerName: node.title, // Using title since we removed name
        function: node.function,
        directReports: node.children.length,
        layer: node.layer,
      });
    }
    node.children.forEach(traverse);
  }

  traverse(orgTree);
  return spans;
}

export function calculateFunctionStats(employees: Employee[], countryTags: Map<string, 'Best-cost' | 'High-cost'>): FunctionStats[] {
  const funcMap = new Map<string, Employee[]>();

  employees.forEach(emp => {
    const existing = funcMap.get(emp.function) || [];
    existing.push(emp);
    funcMap.set(emp.function, existing);
  });

  return Array.from(funcMap.entries()).map(([func, emps]) => {
    const bestCostCount = emps.filter(e => countryTags.get(e.country) === 'Best-cost').length;
    return {
      function: func,
      headcount: emps.length,
      totalFLRR: emps.reduce((sum, e) => sum + e.flrr, 0),
      avgFLRR: emps.reduce((sum, e) => sum + e.flrr, 0) / emps.length,
      bestCostCount,
      highCostCount: emps.length - bestCostCount,
      bestCostPercent: (bestCostCount / emps.length) * 100,
    };
  });
}

export function calculateCountryStats(employees: Employee[]): CountryStats[] {
  const countryMap = new Map<string, Employee[]>();

  employees.forEach(emp => {
    const existing = countryMap.get(emp.country) || [];
    existing.push(emp);
    countryMap.set(emp.country, existing);
  });

  return Array.from(countryMap.entries())
    .map(([country, emps]) => ({
      country,
      headcount: emps.length,
      totalFLRR: emps.reduce((sum, e) => sum + e.flrr, 0),
      avgFLRR: emps.reduce((sum, e) => sum + e.flrr, 0) / emps.length,
      tag: 'Untagged' as const,
    }))
    .sort((a, b) => b.headcount - a.headcount);
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
  functionStats: FunctionStats[],
  benchmarks: Benchmarks = defaultBenchmarks
): QuickWin[] {
  const quickWins: QuickWin[] = [];

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
  functionStats.forEach(func => {
    const target = benchmarks.targetVariableByRole[func.function] || benchmarks.targetVariableByRole['default'];
    const totalBase = employees.filter(e => e.function === func.function).reduce((sum, e) => sum + e.baseSalary, 0);
    const totalBonus = employees.filter(e => e.function === func.function).reduce((sum, e) => sum + e.bonus, 0);
    const totalComp = totalBase + totalBonus;
    const avgVariable = totalComp > 0 ? (totalBonus / totalComp) * 100 : 0;
    
    if (avgVariable < target * 0.5) {
      quickWins.push({
        id: `comp-${func.function}`,
        title: `Low Variable Comp: ${func.function}`,
        description: `${func.function} roles average ${avgVariable.toFixed(0)}% variable compensation. Target is ${target}%.`,
        impact: func.function === 'Sales' ? 'high' : 'medium',
        category: 'compensation',
        metric: `${(target - avgVariable).toFixed(0)}pp gap`,
      });
    }
  });

  return quickWins.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });
}

export function calculateFunctionSpanStats(employees: Employee[], spanStats: SpanStats[], orgTree: OrgNode | null): FunctionSpanStats[] {
  if (!orgTree) return [];

  const funcMap = new Map<string, { managers: SpanStats[]; employees: Employee[]; maxLayer: number }>();

  employees.forEach(emp => {
    const existing = funcMap.get(emp.function) || { managers: [], employees: [], maxLayer: 0 };
    existing.employees.push(emp);
    funcMap.set(emp.function, existing);
  });

  spanStats.forEach(span => {
    const existing = funcMap.get(span.function);
    if (existing) {
      existing.managers.push(span);
      existing.maxLayer = Math.max(existing.maxLayer, span.layer);
    }
  });

  return Array.from(funcMap.entries()).map(([func, data]) => {
    const avgSpan = data.managers.length > 0
      ? data.managers.reduce((sum, m) => sum + m.directReports, 0) / data.managers.length
      : 0;
    
    return {
      function: func,
      avgSpan,
      layers: data.maxLayer + 1,
      managerCount: data.managers.length,
      totalEmployees: data.employees.length,
      managerPercent: data.employees.length > 0 ? (data.managers.length / data.employees.length) * 100 : 0,
    };
  }).sort((a, b) => b.totalEmployees - a.totalEmployees);
}

export function analyzeEmployeeData(employees: Employee[], benchmarks: Benchmarks = defaultBenchmarks): AnalysisData {
  const orgTree = buildOrgTree(employees);
  const layerStats = calculateLayerStats(employees, orgTree);
  const spanStats = calculateSpanStats(employees, orgTree);
  const countryStats = calculateCountryStats(employees);
  
  // Create default country tags (all untagged initially)
  const countryTags = new Map<string, 'Best-cost' | 'High-cost'>();
  
  const functionStats = calculateFunctionStats(employees, countryTags);
  const functionSpanStats = calculateFunctionSpanStats(employees, spanStats, orgTree);
  const tenureBands = calculateTenureBands(employees);
  const quickWins = generateQuickWins(employees, layerStats, spanStats, functionStats, benchmarks);

  const managers = spanStats.length;
  const ics = employees.length - managers;
  const bestCostCount = employees.filter(e => countryTags.get(e.country) === 'Best-cost').length;
  const totalBonus = employees.reduce((sum, e) => sum + e.bonus, 0);
  const totalBase = employees.reduce((sum, e) => sum + e.baseSalary, 0);
  
  const ceoDirectReports = orgTree ? orgTree.children.length : 0;

  return {
    employees,
    orgTree,
    layerStats,
    spanStats,
    functionStats,
    functionSpanStats,
    countryStats,
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
      totalManagers: managers,
      managerPercent: employees.length > 0 ? (managers / employees.length) * 100 : 0,
      ceoDirectReports,
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
