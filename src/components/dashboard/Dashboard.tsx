import { useState, useMemo, useRef, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Employee, AnalysisData } from '@/types/employee';
import { analyzeEmployeeData } from '@/lib/analysis';
import { exportDashboardToPDF } from '@/lib/pdf-export';
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
  Bot,
  FileText,
  FileJson,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardProps {
  employees: Employee[];
  onReset: () => void;
}

export function Dashboard({ employees, onReset }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ progress: 0, message: '' });

  // Refs for each tab content
  const tabRefs = useRef<Map<string, HTMLElement | null>>(new Map());

  const analysisData: AnalysisData = useMemo(() => {
    return analyzeEmployeeData(employees);
  }, [employees]);

  const setTabRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    tabRefs.current.set(id, el);
  }, []);

  const handleExportJSON = () => {
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
    toast.success('JSON exported successfully');
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportProgress({ progress: 0, message: 'Preparing export...' });

    try {
      // Temporarily show all tabs for capture
      const originalTab = activeTab;
      
      // Create a container for all tabs
      const captureContainer = document.createElement('div');
      captureContainer.style.position = 'absolute';
      captureContainer.style.left = '-9999px';
      captureContainer.style.top = '0';
      captureContainer.style.width = '1200px';
      captureContainer.style.background = '#ffffff';
      document.body.appendChild(captureContainer);

      // Render each tab into the container
      const tabConfigs = [
        { id: 'summary', title: 'Executive Summary' },
        { id: 'headcount', title: 'Headcount Breakdown' },
        { id: 'spans', title: 'Spans & Layers Analysis' },
        { id: 'tenure', title: 'Tenure Analysis' },
        { id: 'automation', title: 'Automation Analysis' },
        { id: 'offshoring', title: 'Offshoring Analysis' },
        { id: 'compensation', title: 'Compensation Analysis' },
      ];

      // Switch to each tab and capture
      for (const tab of tabConfigs) {
        setActiveTab(tab.id);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for render
      }

      // Restore original tab
      setActiveTab(originalTab);
      
      // Clean up temp container
      document.body.removeChild(captureContainer);

      await exportDashboardToPDF(
        tabRefs.current,
        (progress, message) => setExportProgress({ progress, message })
      );

      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress({ progress: 0, message: '' });
    }
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isExporting}>
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {exportProgress.message || 'Exporting...'}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export to PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportJSON}>
                    <FileJson className="w-4 h-4 mr-2" />
                    Export to JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            <div ref={setTabRef('summary')}>
              <ExecutiveSummary data={analysisData} />
            </div>
          </TabsContent>

          <TabsContent value="orgchart">
            <OrgChart data={analysisData} />
          </TabsContent>

          <TabsContent value="spans">
            <div ref={setTabRef('spans')}>
              <SpansLayersAnalysis data={analysisData} />
            </div>
          </TabsContent>

          <TabsContent value="offshoring">
            <div ref={setTabRef('offshoring')}>
              <OffshoringAnalysis data={analysisData} />
            </div>
          </TabsContent>

          <TabsContent value="compensation">
            <div ref={setTabRef('compensation')}>
              <CompensationAnalysis data={analysisData} />
            </div>
          </TabsContent>

          <TabsContent value="tenure">
            <div ref={setTabRef('tenure')}>
              <TenureAnalysis data={analysisData} />
            </div>
          </TabsContent>

          <TabsContent value="automation">
            <div ref={setTabRef('automation')}>
              <AutomationAnalysis data={analysisData} />
            </div>
          </TabsContent>

          <TabsContent value="headcount">
            <div ref={setTabRef('headcount')}>
              <HeadcountBreakdown data={analysisData} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}