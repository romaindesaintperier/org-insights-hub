import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FunctionStats } from '@/types/employee';
import { formatCurrency, formatPercent } from '@/lib/analysis';
import { Building2 } from 'lucide-react';

interface FunctionSummaryTableProps {
  functionStats: FunctionStats[];
  totalHeadcount: number;
  totalFLRR: number;
}

export function FunctionSummaryTable({ functionStats, totalHeadcount, totalFLRR }: FunctionSummaryTableProps) {
  const sortedFunctions = [...functionStats].sort((a, b) => b.headcount - a.headcount);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Function Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Function</TableHead>
              <TableHead className="text-right"># Employees</TableHead>
              <TableHead className="text-right">% of Total</TableHead>
              <TableHead className="text-right">FLRR</TableHead>
              <TableHead className="text-right">% of FLRR</TableHead>
              <TableHead className="text-right">Avg FLRR/Employee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFunctions.map((func) => (
              <TableRow key={func.function}>
                <TableCell className="font-medium">{func.function}</TableCell>
                <TableCell className="text-right">{func.headcount}</TableCell>
                <TableCell className="text-right">
                  {formatPercent((func.headcount / totalHeadcount) * 100)}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(func.totalFLRR)}</TableCell>
                <TableCell className="text-right">
                  {formatPercent((func.totalFLRR / totalFLRR) * 100)}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(func.avgFLRR)}</TableCell>
              </TableRow>
            ))}
            {/* Total Row */}
            <TableRow className="bg-secondary/30 font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{totalHeadcount}</TableCell>
              <TableCell className="text-right">100%</TableCell>
              <TableCell className="text-right">{formatCurrency(totalFLRR)}</TableCell>
              <TableCell className="text-right">100%</TableCell>
              <TableCell className="text-right">{formatCurrency(totalFLRR / totalHeadcount)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
