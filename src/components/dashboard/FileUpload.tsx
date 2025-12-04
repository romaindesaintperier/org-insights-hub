import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseExcelFile } from '@/lib/excel-parser';
import { Employee } from '@/types/employee';

interface FileUploadProps {
  onDataLoaded: (employees: Employee[]) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setErrors(['Please upload an Excel file (.xlsx, .xls) or CSV file']);
      return;
    }

    setIsLoading(true);
    setErrors([]);
    setWarnings([]);
    setFileName(file.name);

    try {
      const { employees, errors: parseErrors, warnings: parseWarnings } = await parseExcelFile(file);
      
      setErrors(parseErrors);
      setWarnings(parseWarnings);

      if (parseErrors.length === 0 && employees.length > 0) {
        onDataLoaded(employees);
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to parse file']);
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-2xl space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-semibold text-foreground tracking-tight">
            Organizational Due Diligence
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload your employee data to begin analysis
          </p>
        </div>

        <Card 
          className={`border-2 border-dashed transition-all duration-200 ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
        >
          <CardContent className="p-12">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className="flex flex-col items-center justify-center space-y-4 cursor-pointer"
            >
              <div className={`p-4 rounded-full transition-colors ${
                isDragging ? 'bg-primary/20' : 'bg-secondary'
              }`}>
                {isLoading ? (
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-12 h-12 text-primary" />
                )}
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground">
                  {isLoading ? 'Processing...' : 'Drop your Excel file here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse
                </p>
              </div>

              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading}
              />

              <Button variant="outline" disabled={isLoading} className="pointer-events-none">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Select File
              </Button>
            </div>
          </CardContent>
        </Card>

        {fileName && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="w-4 h-4" />
            {fileName}
          </div>
        )}

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {warnings.length > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-warning" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {warnings.map((warning, i) => (
                  <li key={i} className="text-muted-foreground">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-secondary/50">
          <CardContent className="p-6">
            <h3 className="font-medium mb-3 text-foreground">Expected Columns:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">• Employee ID *</span>
              <span className="font-medium text-foreground">• Name *</span>
              <span className="font-medium text-foreground">• FLRR *</span>
              <span className="font-medium text-foreground">• Role Family *</span>
              <span className="font-medium text-foreground">• Country Tag *</span>
              <span>• Manager ID</span>
              <span>• Department</span>
              <span>• Title</span>
              <span>• Location</span>
              <span>• Hire Date</span>
              <span>• Base Salary</span>
              <span>• Bonus</span>
              <span>• Cost Center</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">* Required columns</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}