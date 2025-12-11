import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Employee, AnalysisData } from '@/types/employee';
import { analyzeEmployeeData } from '@/lib/analysis';
import { ExecutiveSummary } from './ExecutiveSummary';
import { SpansLayersAnalysis } from './SpansLayersAnalysis';
import { OffshoringAnalysis } from './OffshoringAnalysis';
import { CompensationAnalysis } from './CompensationAnalysis';
import { TenureAnalysis } from './TenureAnalysis';
import { HeadcountBreakdown } from './HeadcountBreakdown';
import { OrgChart } from './OrgChart';
import { AutomationAnalysis } from './AutomationAnalysis';
import { 
  LayoutDashboard, 
  Layers, 
  Globe, 
  DollarSign, 
  Clock, 
  Users,
  Upload,
  Download,
  Network,
  Bot
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardProps {
  employees: Employee[];
  onReset: () => void;
}

export function Dashboard({ employees, onReset }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('summary');

  const analysisData: AnalysisData = useMemo(() => {
    return analyzeEmployeeData(employees);
  }, [employees]);

  const handleExport = () => {
    const exportData = {
      summary: analysisData.totals,
      quickWins: analysisData.quickWins,
      layerStats: analysisData.layerStats,
      functionStats: analysisData.functionStats,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `org-analysis-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Organizational Due Diligence
              </h1>
              <p className="text-sm text-muted-foreground">
                {analysisData.totals.headcount} employees analyzed
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="ghost" size="sm" onClick={onReset}>
                <Upload className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 mb-6">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden md:inline">Summary</span>
            </TabsTrigger>
            <TabsTrigger value="headcount" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden md:inline">Headcount</span>
            </TabsTrigger>
            <TabsTrigger value="orgchart" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              <span className="hidden md:inline">Org Chart</span>
            </TabsTrigger>
            <TabsTrigger value="spans" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span className="hidden md:inline">Spans & Layers</span>
            </TabsTrigger>
            <TabsTrigger value="tenure" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden md:inline">Tenure</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span className="hidden md:inline">Automation</span>
            </TabsTrigger>
            <TabsTrigger value="offshoring" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden md:inline">Offshoring</span>
            </TabsTrigger>
            <TabsTrigger value="compensation" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden md:inline">Compensation</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <ExecutiveSummary data={analysisData} />
          </TabsContent>

          <TabsContent value="orgchart">
            <OrgChart data={analysisData} />
          </TabsContent>

          <TabsContent value="spans">
            <SpansLayersAnalysis data={analysisData} />
          </TabsContent>

          <TabsContent value="offshoring">
            <OffshoringAnalysis data={analysisData} />
          </TabsContent>

          <TabsContent value="compensation">
            <CompensationAnalysis data={analysisData} />
          </TabsContent>

          <TabsContent value="tenure">
            <TenureAnalysis data={analysisData} />
          </TabsContent>

          <TabsContent value="automation">
            <AutomationAnalysis data={analysisData} />
          </TabsContent>

          <TabsContent value="headcount">
            <HeadcountBreakdown data={analysisData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
