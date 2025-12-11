import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { AnalysisData } from '@/types/employee';
import { formatCurrency, formatNumber } from '@/lib/analysis';
import { Bot, AlertTriangle, TrendingDown, Users, DollarSign } from 'lucide-react';

interface AutomationAnalysisProps {
  data: AnalysisData;
}

interface AutomationOpportunity {
  title: string;
  headcount: number;
  totalFLRR: number;
  opportunityLevel: 'high' | 'medium' | 'low';
  opportunityScore: number;
  rationale: string;
}

// Keywords and patterns that indicate higher automation risk
const highRiskPatterns = [
  { pattern: /data\s*entry/i, score: 95, rationale: 'Highly repetitive data input tasks' },
  { pattern: /clerk/i, score: 85, rationale: 'Administrative processing roles' },
  { pattern: /bookkeep/i, score: 90, rationale: 'Routine financial record-keeping' },
  { pattern: /payroll/i, score: 80, rationale: 'Standardized payroll processing' },
  { pattern: /accounts\s*(payable|receivable)/i, score: 85, rationale: 'Transaction processing tasks' },
  { pattern: /receptionist/i, score: 75, rationale: 'Scheduling and routing tasks' },
  { pattern: /transcription/i, score: 95, rationale: 'Audio-to-text conversion' },
  { pattern: /filing/i, score: 90, rationale: 'Document organization tasks' },
  { pattern: /scheduler/i, score: 70, rationale: 'Calendar and appointment management' },
  { pattern: /customer\s*service\s*rep/i, score: 65, rationale: 'Tier-1 support queries' },
  { pattern: /call\s*center/i, score: 70, rationale: 'Routine customer inquiries' },
  { pattern: /telemarket/i, score: 75, rationale: 'Scripted outbound calls' },
  { pattern: /proofreader/i, score: 80, rationale: 'Text review and correction' },
  { pattern: /invoice/i, score: 75, rationale: 'Invoice processing tasks' },
  { pattern: /processor/i, score: 70, rationale: 'Routine processing tasks' },
  { pattern: /typist/i, score: 90, rationale: 'Text input tasks' },
  { pattern: /secretary/i, score: 60, rationale: 'Administrative scheduling tasks' },
  { pattern: /administrative\s*assistant/i, score: 55, rationale: 'Routine admin tasks' },
  { pattern: /analyst.*junior|junior.*analyst/i, score: 50, rationale: 'Basic analytical tasks' },
  { pattern: /quality\s*assurance.*tester/i, score: 60, rationale: 'Routine testing procedures' },
  { pattern: /warehouse/i, score: 65, rationale: 'Inventory management tasks' },
  { pattern: /assembly/i, score: 70, rationale: 'Repetitive assembly tasks' },
  { pattern: /cashier/i, score: 85, rationale: 'Transaction processing' },
  { pattern: /order\s*(entry|processing)/i, score: 80, rationale: 'Order management tasks' },
];

const mediumRiskPatterns = [
  { pattern: /accountant/i, score: 45, rationale: 'Some accounting tasks automatable' },
  { pattern: /auditor/i, score: 40, rationale: 'Audit procedures becoming automated' },
  { pattern: /paralegal/i, score: 50, rationale: 'Document review automation' },
  { pattern: /research\s*assistant/i, score: 45, rationale: 'Information gathering tasks' },
  { pattern: /support\s*specialist/i, score: 50, rationale: 'Tiered support automation' },
  { pattern: /coordinator/i, score: 40, rationale: 'Scheduling and coordination tasks' },
  { pattern: /recruiter/i, score: 45, rationale: 'Resume screening automation' },
  { pattern: /loan\s*officer/i, score: 55, rationale: 'Credit decision automation' },
  { pattern: /underwriter/i, score: 50, rationale: 'Risk assessment automation' },
  { pattern: /technical\s*writer/i, score: 45, rationale: 'Documentation generation' },
  { pattern: /translator/i, score: 60, rationale: 'Language translation automation' },
  { pattern: /report/i, score: 40, rationale: 'Report generation tasks' },
];

const lowRiskPatterns = [
  { pattern: /director/i, score: 15, rationale: 'Strategic leadership role' },
  { pattern: /manager/i, score: 20, rationale: 'People management required' },
  { pattern: /vice\s*president|vp\b/i, score: 10, rationale: 'Executive decision-making' },
  { pattern: /chief/i, score: 5, rationale: 'C-suite strategic role' },
  { pattern: /president/i, score: 5, rationale: 'Executive leadership' },
  { pattern: /engineer/i, score: 25, rationale: 'Creative problem-solving required' },
  { pattern: /architect/i, score: 20, rationale: 'Complex design decisions' },
  { pattern: /scientist/i, score: 20, rationale: 'Research and innovation' },
  { pattern: /therapist/i, score: 15, rationale: 'Human empathy required' },
  { pattern: /nurse/i, score: 20, rationale: 'Patient care and judgment' },
  { pattern: /doctor|physician/i, score: 15, rationale: 'Complex medical decisions' },
  { pattern: /creative/i, score: 20, rationale: 'Creative thinking required' },
  { pattern: /designer/i, score: 25, rationale: 'Creative design work' },
  { pattern: /strategist/i, score: 15, rationale: 'Strategic planning' },
  { pattern: /consultant/i, score: 25, rationale: 'Client relationship and judgment' },
  { pattern: /sales.*senior|senior.*sales/i, score: 25, rationale: 'Complex relationship selling' },
];

function getAutomationRisk(title: string): { score: number; rationale: string } {
  const normalizedTitle = title.toLowerCase().trim();
  
  // Check high risk patterns first
  for (const { pattern, score, rationale } of highRiskPatterns) {
    if (pattern.test(normalizedTitle)) {
      return { score, rationale };
    }
  }
  
  // Check medium risk patterns
  for (const { pattern, score, rationale } of mediumRiskPatterns) {
    if (pattern.test(normalizedTitle)) {
      return { score, rationale };
    }
  }
  
  // Check low risk patterns
  for (const { pattern, score, rationale } of lowRiskPatterns) {
    if (pattern.test(normalizedTitle)) {
      return { score, rationale };
    }
  }
  
  // Default: moderate risk for unknown titles
  return { score: 35, rationale: 'Role requires further analysis' };
}

function getOpportunityLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

export function AutomationAnalysis({ data }: AutomationAnalysisProps) {
  const automationOpportunities = useMemo(() => {
    // Group employees by title
    const titleGroups = new Map<string, { headcount: number; totalFLRR: number }>();
    
    for (const employee of data.employees) {
      const title = employee.title || 'Unknown Title';
      const existing = titleGroups.get(title) || { headcount: 0, totalFLRR: 0 };
      titleGroups.set(title, {
        headcount: existing.headcount + 1,
        totalFLRR: existing.totalFLRR + (employee.flrr || 0),
      });
    }
    
    // Calculate opportunity for each title
    const opportunities: AutomationOpportunity[] = [];
    
    for (const [title, stats] of titleGroups) {
      const { score, rationale } = getAutomationRisk(title);
      opportunities.push({
        title,
        headcount: stats.headcount,
        totalFLRR: stats.totalFLRR,
        opportunityLevel: getOpportunityLevel(score),
        opportunityScore: score,
        rationale,
      });
    }
    
    // Sort by opportunity score descending
    return opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }, [data.employees]);

  const summaryStats = useMemo(() => {
    const high = automationOpportunities.filter(r => r.opportunityLevel === 'high');
    const medium = automationOpportunities.filter(r => r.opportunityLevel === 'medium');
    const low = automationOpportunities.filter(r => r.opportunityLevel === 'low');
    
    const highHeadcount = high.reduce((sum, r) => sum + r.headcount, 0);
    const highFLRR = high.reduce((sum, r) => sum + r.totalFLRR, 0);
    
    const mediumHeadcount = medium.reduce((sum, r) => sum + r.headcount, 0);
    const mediumFLRR = medium.reduce((sum, r) => sum + r.totalFLRR, 0);
    
    const lowHeadcount = low.reduce((sum, r) => sum + r.headcount, 0);
    const lowFLRR = low.reduce((sum, r) => sum + r.totalFLRR, 0);
    
    return {
      high: { count: highHeadcount, flrr: highFLRR, titles: high.length },
      medium: { count: mediumHeadcount, flrr: mediumFLRR, titles: medium.length },
      low: { count: lowHeadcount, flrr: lowFLRR, titles: low.length },
      totalHeadcount: data.totals.headcount,
      totalFLRR: data.totals.totalFLRR,
    };
  }, [automationOpportunities, data.totals]);

  const highOpportunityRoles = automationOpportunities.filter(r => r.opportunityLevel === 'high').slice(0, 15);
  const mediumOpportunityRoles = automationOpportunities.filter(r => r.opportunityLevel === 'medium').slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              High Automation Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {formatNumber(summaryStats.high.count)}
                </span>
                <span className="text-sm text-muted-foreground">
                  employees ({((summaryStats.high.count / summaryStats.totalHeadcount) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(summaryStats.high.flrr)} FLRR opportunity
              </div>
              <div className="text-xs text-muted-foreground">
                Across {summaryStats.high.titles} job titles
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-yellow-600" />
              Medium Automation Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-yellow-600">
                  {formatNumber(summaryStats.medium.count)}
                </span>
                <span className="text-sm text-muted-foreground">
                  employees ({((summaryStats.medium.count / summaryStats.totalHeadcount) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(summaryStats.medium.flrr)} FLRR potential
              </div>
              <div className="text-xs text-muted-foreground">
                Across {summaryStats.medium.titles} job titles
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              Low Automation Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {formatNumber(summaryStats.low.count)}
                </span>
                <span className="text-sm text-muted-foreground">
                  employees ({((summaryStats.low.count / summaryStats.totalHeadcount) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(summaryStats.low.flrr)} FLRR lower opportunity
              </div>
              <div className="text-xs text-muted-foreground">
                Across {summaryStats.low.titles} job titles
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Automation Impact Overview
          </CardTitle>
          <CardDescription>
            Estimated workforce exposure to AI and automation based on job title analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-primary font-medium">High Opportunity</span>
                <span>{((summaryStats.high.count / summaryStats.totalHeadcount) * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={(summaryStats.high.count / summaryStats.totalHeadcount) * 100} 
                className="h-2 bg-primary/20"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-yellow-600 font-medium">Medium Opportunity</span>
                <span>{((summaryStats.medium.count / summaryStats.totalHeadcount) * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={(summaryStats.medium.count / summaryStats.totalHeadcount) * 100} 
                className="h-2 bg-yellow-500/20"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-medium">Low Opportunity</span>
                <span>{((summaryStats.low.count / summaryStats.totalHeadcount) * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={(summaryStats.low.count / summaryStats.totalHeadcount) * 100} 
                className="h-2 bg-green-500/20"
              />
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-medium">Total FLRR Exposure</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">
                  {formatCurrency(summaryStats.high.flrr)}
                </div>
                <div className="text-xs text-muted-foreground">High Opportunity</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">
                  {formatCurrency(summaryStats.medium.flrr)}
                </div>
                <div className="text-xs text-muted-foreground">Medium Opportunity</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(summaryStats.low.flrr)}
                </div>
                <div className="text-xs text-muted-foreground">Low Opportunity</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High Opportunity Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            High Automation Opportunity Job Titles
          </CardTitle>
          <CardDescription>
            Roles with greatest potential for AI and automation transformation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead className="text-center">Opportunity Score</TableHead>
                <TableHead className="text-right">Headcount</TableHead>
                <TableHead className="text-right">Total FLRR</TableHead>
                <TableHead>Rationale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {highOpportunityRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No high-opportunity roles identified in this organization
                  </TableCell>
                </TableRow>
              ) : (
                highOpportunityRoles.map((role) => (
                  <TableRow key={role.title}>
                    <TableCell className="font-medium">{role.title}</TableCell>
                    <TableCell className="text-center">
                      <Badge>{role.opportunityScore}%</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(role.headcount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(role.totalFLRR)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {role.rationale}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Medium Opportunity Roles Table */}
      {mediumOpportunityRoles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-yellow-600" />
              Medium Automation Opportunity Job Titles
            </CardTitle>
            <CardDescription>
              Roles with partial automation potential - may require role evolution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead className="text-center">Opportunity Score</TableHead>
                  <TableHead className="text-right">Headcount</TableHead>
                  <TableHead className="text-right">Total FLRR</TableHead>
                  <TableHead>Rationale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mediumOpportunityRoles.map((role) => (
                  <TableRow key={role.title}>
                    <TableCell className="font-medium">{role.title}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">
                        {role.opportunityScore}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(role.headcount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(role.totalFLRR)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {role.rationale}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Methodology Note */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Methodology:</strong> Automation opportunity is estimated based on job title analysis 
            using industry research on AI and automation impact. Scores reflect the likelihood that 
            significant portions of the role's tasks could be automated within the next 2–3 years. 
            High-opportunity roles (60%+) contain predominantly routine, rule-based tasks. Medium-opportunity roles 
            (35-59%) have mixed task complexity. Low-opportunity roles (&lt;35%) require significant human 
            judgment, creativity, or interpersonal skills. This analysis should be validated with 
            detailed job descriptions and task-level assessment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
