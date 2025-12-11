import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Employee } from '@/types/employee';
import { MapPin } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/analysis';

interface LocationMapProps {
  employees: Employee[];
}

interface LocationRow {
  country: string;
  location: string;
  headcount: number;
  percentOfTotal: number;
  avgFLRR: number;
}

export function LocationMap({ employees }: LocationMapProps) {
  const locationData = useMemo(() => {
    // Group by country and location
    const locationMap = new Map<string, { headcount: number; totalFLRR: number }>();
    
    employees.forEach(emp => {
      const key = `${emp.country || 'Unknown'}||${emp.location || 'Unknown'}`;
      const existing = locationMap.get(key) || { headcount: 0, totalFLRR: 0 };
      existing.headcount++;
      existing.totalFLRR += emp.flrr || 0;
      locationMap.set(key, existing);
    });
    
    const totalHeadcount = employees.length;
    
    const rows: LocationRow[] = Array.from(locationMap.entries())
      .map(([key, data]) => {
        const [country, location] = key.split('||');
        return {
          country,
          location,
          headcount: data.headcount,
          percentOfTotal: totalHeadcount > 0 ? (data.headcount / totalHeadcount) * 100 : 0,
          avgFLRR: data.headcount > 0 ? data.totalFLRR / data.headcount : 0,
        };
      })
      .sort((a, b) => {
        // Sort by country first, then by headcount within country
        if (a.country !== b.country) {
          return a.country.localeCompare(b.country);
        }
        return b.headcount - a.headcount;
      });
    
    return rows;
  }, [employees]);

  // Group rows by country for visual grouping
  const groupedByCountry = useMemo(() => {
    const groups: { country: string; rows: LocationRow[] }[] = [];
    let currentCountry = '';
    let currentGroup: LocationRow[] = [];
    
    locationData.forEach(row => {
      if (row.country !== currentCountry) {
        if (currentGroup.length > 0) {
          groups.push({ country: currentCountry, rows: currentGroup });
        }
        currentCountry = row.country;
        currentGroup = [row];
      } else {
        currentGroup.push(row);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push({ country: currentCountry, rows: currentGroup });
    }
    
    return groups;
  }, [locationData]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Employee Distribution by Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        {locationData.length > 0 ? (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right"># Employees</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                  <TableHead className="text-right">Avg FLRR/Employee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedByCountry.map((group, groupIndex) => (
                  group.rows.map((row, rowIndex) => (
                    <TableRow key={`${row.country}-${row.location}`} className={groupIndex % 2 === 0 ? 'bg-secondary/20' : ''}>
                      <TableCell className="font-medium">
                        {rowIndex === 0 ? row.country : ''}
                      </TableCell>
                      <TableCell>{row.location}</TableCell>
                      <TableCell className="text-right">{row.headcount}</TableCell>
                      <TableCell className="text-right">{formatPercent(row.percentOfTotal)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.avgFLRR)}</TableCell>
                    </TableRow>
                  ))
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <p>No location data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
