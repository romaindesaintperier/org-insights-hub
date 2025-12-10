import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { parseExcelFile, readFileHeaders, autoDetectColumns, ColumnMapping, fieldLabels } from '@/lib/excel-parser';
import { Employee } from '@/types/employee';
import { ColumnMappingModal } from './ColumnMappingModal';

interface FileUploadProps {
  onDataLoaded: (employees: Employee[]) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [detectedMapping, setDetectedMapping] = useState<ColumnMapping | null>(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setErrors(['Please upload an Excel file (.xlsx, .xls) or CSV file']);
      return;
    }

    setIsLoading(true);
    setErrors([]);
    setWarnings([]);
    setFileName(file.name);
    setCurrentFile(file);

    try {
      const headers = await readFileHeaders(file);
      setFileHeaders(headers);
      
      const mapping = autoDetectColumns(headers);
      setDetectedMapping(mapping);
      
      // Always show mapping modal to let user review/adjust
      setShowMappingModal(true);
      setIsLoading(false);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to parse file']);
      setIsLoading(false);
    }
  }, []);

  const handleConfirmMapping = useCallback(async (mapping: ColumnMapping) => {
    if (!currentFile) return;
    
    setShowMappingModal(false);
    setIsLoading(true);

    try {
      const { employees, errors: parseErrors, warnings: parseWarnings } = await parseExcelFile(currentFile, mapping);
      
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
  }, [currentFile, onDataLoaded]);

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

  const getMappingSummary = () => {
    if (!detectedMapping) return null;
    
    const mapped = (Object.keys(detectedMapping) as (keyof ColumnMapping)[]).filter(k => detectedMapping[k]);
    
    return { mapped };
  };

  const summary = getMappingSummary();

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
              className="flex flex-col items-center justify-center space-y-4 cursor-pointer relative"
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

        {fileName && !showMappingModal && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="w-4 h-4" />
            {fileName}
          </div>
        )}

        {fileName && summary && !showMappingModal && (
          <Card className="bg-secondary/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">Column Mapping Detected</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowMappingModal(true)}>
                  <Settings className="w-4 h-4 mr-1" />
                  Edit Mapping
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.mapped.map(field => (
                  <Badge key={field} variant="secondary" className="bg-success/20 text-success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {fieldLabels[field]}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
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
            <h3 className="font-medium mb-3 text-foreground">
              Upload a census file that only has 1 tab
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              The tool will automatically detect and map your columns. You can also manually adjust the mapping after uploading.
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Supported formats: .xlsx, .xls, .csv
            </p>
            <p className="text-sm text-muted-foreground">
              For any suggestions or questions, please reach out to{' '}
              <a href="mailto:rdsp@kkr.com" className="text-primary hover:underline">
                rdsp@kkr.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>

      {detectedMapping && (
        <ColumnMappingModal
          open={showMappingModal}
          onOpenChange={setShowMappingModal}
          headers={fileHeaders}
          mapping={detectedMapping}
          onConfirm={handleConfirmMapping}
        />
      )}
    </div>
  );
}
