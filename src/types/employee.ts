export interface Employee {
  employeeId: string;
  managerId: string | null;
  function: string;
  title: string;
  location: string;
  country: string;
  hireDate: string;
  flrr: number;
  baseSalary: number;
  bonus: number;
  businessUnit: string;
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

export interface FunctionSpanStats {
  function: string;
  avgSpan: number;
  layers: number;
  managerCount: number;
  totalEmployees: number;
  managerPercent: number;
}

export interface SpanStats {
  managerId: string;
  managerName: string;
  function: string;
  directReports: number;
  layer: number;
}

export interface FunctionStats {
  function: string;
  headcount: number;
  totalFLRR: number;
  avgFLRR: number;
  bestCostCount: number;
  highCostCount: number;
  bestCostPercent: number;
}

export interface CountryStats {
  country: string;
  headcount: number;
  totalFLRR: number;
  avgFLRR: number;
  tag: 'Best-cost' | 'High-cost' | 'Untagged';
}

export interface FunctionOffshoringStats {
  function: string;
  totalHeadcount: number;
  bccHeadcount: number;
  hccHeadcount: number;
  bccPercent: number;
  hccPercent: number;
  avgFLRR: number;
  bccFLRR: number;
  hccFLRR: number;
  offshoringPotential: number; // User input: percentage
  potentialSavings: number; // Calculated
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
  functionStats: FunctionStats[];
  functionSpanStats: FunctionSpanStats[];
  countryStats: CountryStats[];
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
