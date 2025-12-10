import { Employee } from '@/types/employee';
import * as XLSX from 'xlsx';

export interface ColumnMapping {
  employeeId: string | null;
  managerId: string | null;
  function: string | null;
  title: string | null;
  location: string | null;
  country: string | null;
  hireDate: string | null;
  flrr: string | null;
  baseSalary: string | null;
  bonus: string | null;
  businessUnit: string | null;
}

export const fieldLabels: Record<keyof ColumnMapping, string> = {
  employeeId: 'Employee ID',
  managerId: 'Manager ID',
  function: 'Function',
  title: 'Title',
  location: 'Location',
  country: 'Country',
  hireDate: 'Hire Date',
  flrr: 'Fully Loaded Run-Rate (FLRR)',
  baseSalary: 'Base Salary',
  bonus: 'Variable Compensation',
  businessUnit: 'Business Unit',
};

// All fields are optional - tool will adapt based on available data
export const requiredFields: (keyof ColumnMapping)[] = [];
export const importantFields: (keyof ColumnMapping)[] = [];

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[_\-\s]+/g, ' ').trim();
}

function findColumn(headers: string[], possibleNames: string[]): string | null {
  const normalizedPatterns = possibleNames.map(normalizeHeader);
  
  // First try exact match
  const exactMatch = headers.find(h => normalizedPatterns.includes(normalizeHeader(h)));
  if (exactMatch) return exactMatch;
  
  // Then try partial match (header contains pattern or pattern contains header)
  for (const header of headers) {
    const normalizedHeader = normalizeHeader(header);
    for (const pattern of normalizedPatterns) {
      if (normalizedHeader.includes(pattern) || pattern.includes(normalizedHeader)) {
        return header;
      }
    }
  }
  
  return null;
}

const columnPatterns: Record<keyof ColumnMapping, string[]> = {
  employeeId: ['employee id', 'emp id', 'employee_id', 'empid', 'employeeid', 'ee id', 'worker id', 'personnel number', 'person id', 'id'],
  managerId: ['manager id', 'manager_id', 'mgr id', 'reports to', 'supervisor id', 'manager', 'mgrid', 'supervisor', 'reports to id', 'manager employee id'],
  function: ['function', 'department', 'dept', 'division', 'org unit', 'role family', 'job family', 'job function', 'functional area', 'cost center', 'team'],
  title: ['title', 'job title', 'position', 'role', 'level', 'job name', 'position title', 'job', 'grade'],
  location: ['location', 'office', 'city', 'site', 'work location', 'office location', 'work site', 'workplace'],
  country: ['country', 'country name', 'nation', 'country code', 'work country'],
  hireDate: ['hire date', 'start date', 'hire_date', 'date hired', 'join date', 'hiredate', 'original hire date', 'employment date', 'date of hire', 'start'],
  flrr: ['flrr', 'fully loaded', 'total cost', 'labor cost', 'fully-loaded run-rate', 'total comp', 'total compensation', 'annual cost', 'loaded cost', 'run rate'],
  baseSalary: ['base salary', 'base', 'salary', 'base pay', 'annual salary', 'base compensation', 'annual base'],
  bonus: ['bonus', 'variable', 'incentive', 'target bonus', 'variable pay', 'variable compensation', 'target incentive', 'stip', 'short term incentive'],
  businessUnit: ['business unit', 'business_unit', 'bu', 'segment', 'business segment', 'division', 'company', 'legal entity'],
};

export function autoDetectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    employeeId: null,
    managerId: null,
    function: null,
    title: null,
    location: null,
    country: null,
    hireDate: null,
    flrr: null,
    baseSalary: null,
    bonus: null,
    businessUnit: null,
  };

  Object.entries(columnPatterns).forEach(([key, patterns]) => {
    const found = findColumn(headers, patterns);
    if (found) {
      mapping[key as keyof ColumnMapping] = found;
    }
  });

  return mapping;
}

export function readFileHeaders(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        if (jsonData.length < 1) {
          reject(new Error('File is empty'));
          return;
        }

        const headers = (jsonData[0] as string[]).map(h => String(h || '').trim()).filter(h => h);
        resolve(headers);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

export function parseExcelFile(
  file: File, 
  customMapping?: ColumnMapping
): Promise<{ employees: Employee[]; errors: string[]; warnings: string[] }> {
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
        const mapping = customMapping || autoDetectColumns(headers);
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check important columns
        const missingImportant = importantFields.filter(col => !mapping[col]);
        if (missingImportant.length > 0) {
          warnings.push(`Missing columns (some analyses may be limited): ${missingImportant.map(f => fieldLabels[f]).join(', ')}`);
        }

        const employees: Employee[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as (string | number | Date)[];
          if (!row || row.length === 0 || row.every(cell => !cell)) continue;

          const getValue = (key: keyof ColumnMapping): string | number | Date | null => {
            const colName = mapping[key];
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
            managerId: getValue('managerId') ? String(getValue('managerId')) : null,
            function: String(getValue('function') || 'Unknown'),
            title: String(getValue('title') || 'Unknown'),
            location: String(getValue('location') || 'Unknown'),
            country: String(getValue('country') || 'Unknown'),
            hireDate,
            flrr: isNaN(flrr) ? 0 : flrr,
            baseSalary: isNaN(baseSalary) ? 0 : baseSalary,
            bonus: isNaN(bonus) ? 0 : bonus,
            businessUnit: String(getValue('businessUnit') || 'Unknown'),
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
