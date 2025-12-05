export interface Employee {
  employeeId: string;
  name: string;
  managerId: string | null;
  department: string;
  title: string;
  location: string;
  hireDate: string;
  flrr: number;
  baseSalary: number;
  bonus: number;
  roleFamily: string;
  countryTag: 'Best-cost' | 'High-cost';
  costCenter: string;
}

export interface OrgNode extends Employee {
  children: OrgNode[];
  layer: number;
  directReports: number;
}

export interface LayerStats {
  layer: number;
  headcount: number;
  totalFLRR: number;
  avgFLRR: number;
  managers: number;
  ics: number;
  avgTenure: number;
}

export interface DepartmentSpanStats {
  department: string;
  avgSpan: number;
  layers: number;
  managerCount: number;
  totalEmployees: number;
  managerPercent: number;
}

export interface SpanStats {
  managerId: string;
  managerName: string;
  department: string;
  directReports: number;
  layer: number;
}

export interface DepartmentStats {
  department: string;
  headcount: number;
  totalFLRR: number;
  avgFLRR: number;
  bestCostCount: number;
  highCostCount: number;
  bestCostPercent: number;
}

export interface RoleFamilyStats {
  roleFamily: string;
  headcount: number;
  totalFLRR: number;
  totalBase: number;
  totalBonus: number;
  avgVariablePercent: number;
  bestCostCount: number;
  highCostCount: number;
}

export interface TenureBand {
  band: string;
  min: number;
  max: number;
  headcount: number;
  totalFLRR: number;
}

export interface QuickWin {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'offshoring' | 'spans' | 'compensation' | 'structure';
  metric?: string;
}

export interface Benchmarks {
  minSpan: number;
  maxSpan: number;
  maxLayers: number;
  targetVariableByRole: Record<string, number>;
  bestCostRatio: number;
}

export interface AnalysisData {
  employees: Employee[];
  orgTree: OrgNode | null;
  layerStats: LayerStats[];
  spanStats: SpanStats[];
  departmentStats: DepartmentStats[];
  departmentSpanStats: DepartmentSpanStats[];
  roleFamilyStats: RoleFamilyStats[];
  tenureBands: TenureBand[];
  quickWins: QuickWin[];
  totals: {
    headcount: number;
    totalFLRR: number;
    avgFLRR: number;
    layers: number;
    avgSpan: number;
    bestCostPercent: number;
    avgVariablePercent: number;
    managerToICRatio: number;
    totalManagers: number;
    managerPercent: number;
    ceoDirectReports: number;
  };
}