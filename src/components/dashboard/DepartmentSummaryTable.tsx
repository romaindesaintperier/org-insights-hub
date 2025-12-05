import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DepartmentStats } from '@/types/employee';
import { formatCurrency, formatPercent } from '@/lib/analysis';
import { Building2 } from 'lucide-react';

interface DepartmentSummaryTableProps {
  departmentStats: DepartmentStats[];
  totalHeadcount: number;
  totalFLRR: number;
}

export function DepartmentSummaryTable({ departmentStats, totalHeadcount, totalFLRR }: DepartmentSummaryTableProps) {
  const sortedDepts = [...departmentStats].sort((a, b) => b.headcount - a.headcount);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Department Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead className="text-right"># Employees</TableHead>
              <TableHead className="text-right">% of Total</TableHead>
              <TableHead className="text-right">FLRR</TableHead>
              <TableHead className="text-right">% of FLRR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDepts.map((dept) => (
              <TableRow key={dept.department}>
                <TableCell className="font-medium">{dept.department}</TableCell>
                <TableCell className="text-right">{dept.headcount}</TableCell>
                <TableCell className="text-right">
                  {formatPercent((dept.headcount / totalHeadcount) * 100)}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(dept.totalFLRR)}</TableCell>
                <TableCell className="text-right">
                  {formatPercent((dept.totalFLRR / totalFLRR) * 100)}
                </TableCell>
              </TableRow>
            ))}
            {/* Total Row */}
            <TableRow className="bg-secondary/30 font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{totalHeadcount}</TableCell>
              <TableCell className="text-right">100%</TableCell>
              <TableCell className="text-right">{formatCurrency(totalFLRR)}</TableCell>
              <TableCell className="text-right">100%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
