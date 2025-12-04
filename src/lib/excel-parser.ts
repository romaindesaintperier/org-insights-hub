import { Employee } from '@/types/employee';
import * as XLSX from 'xlsx';

interface ColumnMapping {
  employeeId: string;
  name: string;
  managerId: string;
  department: string;
  title: string;
  location: string;
  hireDate: string;
  flrr: string;
  baseSalary: string;
  bonus: string;
  roleFamily: string;
  countryTag: string;
  costCenter: string;
}

const defaultMapping: ColumnMapping = {
  employeeId: 'Employee ID',
  name: 'Name',
  managerId: 'Manager ID',
  department: 'Department',
  title: 'Title',
  location: 'Location',
  hireDate: 'Hire Date',
  flrr: 'FLRR',
  baseSalary: 'Base Salary',
  bonus: 'Bonus',
  roleFamily: 'Role Family',
  countryTag: 'Country Tag',
  costCenter: 'Cost Center',
};

function findColumn(headers: string[], possibleNames: string[]): string | null {
  const lowerPossible = possibleNames.map(n => n.toLowerCase());
  const found = headers.find(h => lowerPossible.includes(h.toLowerCase()));
  return found || null;
}

function autoDetectColumns(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};

  const columnPatterns: Record<keyof ColumnMapping, string[]> = {
    employeeId: ['employee id', 'emp id', 'employee_id', 'empid', 'id', 'employee number'],
    name: ['name', 'employee name', 'full name', 'emp name'],
    managerId: ['manager id', 'manager_id', 'mgr id', 'reports to', 'supervisor id'],
    department: ['department', 'dept', 'division', 'org unit'],
    title: ['title', 'job title', 'position', 'role', 'level'],
    location: ['location', 'office', 'city', 'site', 'work location'],
    hireDate: ['hire date', 'start date', 'hire_date', 'date hired', 'join date'],
    flrr: ['flrr', 'fully loaded', 'total cost', 'labor cost', 'fully-loaded run-rate'],
    baseSalary: ['base salary', 'base', 'salary', 'base pay', 'annual salary'],
    bonus: ['bonus', 'variable', 'incentive', 'target bonus', 'variable pay'],
    roleFamily: ['role family', 'job family', 'function', 'job function', 'role_family'],
    countryTag: ['country tag', 'cost tag', 'location tag', 'best cost', 'high cost', 'country_tag'],
    costCenter: ['cost center', 'cost_center', 'cc', 'business unit'],
  };

  Object.entries(columnPatterns).forEach(([key, patterns]) => {
    const found = findColumn(headers, patterns);
    if (found) {
      mapping[key as keyof ColumnMapping] = found;
    }
  });

  return mapping;
}

export function parseExcelFile(file: File): Promise<{ employees: Employee[]; errors: string[]; warnings: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        if (jsonData.length < 2) {
          reject(new Error('File is empty or has no data rows'));
          return;
        }

        const headers = (jsonData[0] as string[]).map(h => String(h || '').trim());
        const detectedMapping = autoDetectColumns(headers);
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check required columns
        const requiredColumns: (keyof ColumnMapping)[] = ['employeeId', 'name', 'flrr', 'roleFamily', 'countryTag'];
        const missingRequired = requiredColumns.filter(col => !detectedMapping[col]);
        
        if (missingRequired.length > 0) {
          errors.push(`Missing required columns: ${missingRequired.join(', ')}`);
        }

        // Check optional columns
        const optionalColumns: (keyof ColumnMapping)[] = ['managerId', 'department', 'title', 'location', 'hireDate', 'baseSalary', 'bonus', 'costCenter'];
        const missingOptional = optionalColumns.filter(col => !detectedMapping[col]);
        
        if (missingOptional.length > 0) {
          warnings.push(`Optional columns not found (will use defaults): ${missingOptional.join(', ')}`);
        }

        const employees: Employee[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as (string | number | Date)[];
          if (!row || row.length === 0 || row.every(cell => !cell)) continue;

          const getValue = (key: keyof ColumnMapping): string | number | Date | null => {
            const colName = detectedMapping[key];
            if (!colName) return null;
            const colIndex = headers.indexOf(colName);
            return colIndex >= 0 ? row[colIndex] : null;
          };

          const employeeId = String(getValue('employeeId') || `EMP-${i}`);
          const flrrValue = getValue('flrr');
          const flrr = typeof flrrValue === 'number' ? flrrValue : parseFloat(String(flrrValue || '0').replace(/[$,]/g, ''));
          
          const baseValue = getValue('baseSalary');
          const baseSalary = typeof baseValue === 'number' ? baseValue : parseFloat(String(baseValue || '0').replace(/[$,]/g, ''));
          
          const bonusValue = getValue('bonus');
          const bonus = typeof bonusValue === 'number' ? bonusValue : parseFloat(String(bonusValue || '0').replace(/[$,]/g, ''));

          const countryTagRaw = String(getValue('countryTag') || 'High-cost');
          const countryTag: 'Best-cost' | 'High-cost' = 
            countryTagRaw.toLowerCase().includes('best') ? 'Best-cost' : 'High-cost';

          const hireDateValue = getValue('hireDate');
          let hireDate: string;
          if (hireDateValue instanceof Date) {
            hireDate = hireDateValue.toISOString().split('T')[0];
          } else if (hireDateValue) {
            const parsed = new Date(String(hireDateValue));
            hireDate = !isNaN(parsed.getTime()) ? parsed.toISOString().split('T')[0] : '2020-01-01';
          } else {
            hireDate = '2020-01-01';
          }

          employees.push({
            employeeId,
            name: String(getValue('name') || `Employee ${i}`),
            managerId: getValue('managerId') ? String(getValue('managerId')) : null,
            department: String(getValue('department') || 'Unknown'),
            title: String(getValue('title') || 'Unknown'),
            location: String(getValue('location') || 'Unknown'),
            hireDate,
            flrr: isNaN(flrr) ? 0 : flrr,
            baseSalary: isNaN(baseSalary) ? 0 : baseSalary,
            bonus: isNaN(bonus) ? 0 : bonus,
            roleFamily: String(getValue('roleFamily') || 'Other'),
            countryTag,
            costCenter: String(getValue('costCenter') || 'Unknown'),
          });
        }

        if (employees.length === 0) {
          errors.push('No valid employee records found');
        }

        resolve({ employees, errors, warnings });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

export { defaultMapping };
export type { ColumnMapping };