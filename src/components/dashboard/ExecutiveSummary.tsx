import { Users, DollarSign, Layers, Target, Globe, TrendingUp } from 'lucide-react';
import { AnalysisData } from '@/types/employee';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/analysis';
import { MetricCard } from './MetricCard';
import { QuickWinsPanel } from './QuickWinsPanel';
import { FunctionSummaryTable } from './FunctionSummaryTable';
import { LocationMap } from './LocationMap';

interface ExecutiveSummaryProps {
  data: AnalysisData;
}

export function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  const { totals, quickWins, functionStats, employees } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Headcount"
          value={formatNumber(totals.headcount)}
          icon={Users}
          variant="primary"
        />
        <MetricCard
          title="Total FLRR"
          value={formatCurrency(totals.totalFLRR)}
          subtitle={`Avg: ${formatCurrency(totals.avgFLRR)}/employee`}
          icon={DollarSign}
        />
        <MetricCard
          title="Org Layers"
          value={String(totals.layers)}
          subtitle={`Avg span: ${totals.avgSpan.toFixed(1)}`}
          icon={Layers}
        />
        <MetricCard
          title="Manager:IC Ratio"
          value={`1:${(1 / totals.managerToICRatio).toFixed(1)}`}
          icon={Target}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Best-Cost Footprint"
          value={formatPercent(totals.bestCostPercent)}
          subtitle={`${Math.round(totals.headcount * totals.bestCostPercent / 100)} employees`}
          icon={Globe}
          variant={totals.bestCostPercent > 40 ? 'accent' : 'default'}
        />
        <MetricCard
          title="Avg Variable Comp"
          value={formatPercent(totals.avgVariablePercent)}
          subtitle="of total compensation"
          icon={TrendingUp}
        />
        <MetricCard
          title="Value Creation Opps"
          value={String(quickWins.length)}
          subtitle={`${quickWins.filter(q => q.impact === 'high').length} high impact`}
          variant={quickWins.filter(q => q.impact === 'high').length > 0 ? 'accent' : 'default'}
        />
      </div>

      <QuickWinsPanel quickWins={quickWins} />

      {/* Function Summary Table */}
      <FunctionSummaryTable 
        functionStats={functionStats}
        totalHeadcount={totals.headcount}
        totalFLRR={totals.totalFLRR}
      />

      {/* Location Map */}
      <LocationMap employees={employees} />
    </div>
  );
}
