import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { ColumnMapping, fieldLabels, requiredFields, importantFields } from '@/lib/excel-parser';

interface ColumnMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headers: string[];
  mapping: ColumnMapping;
  onConfirm: (mapping: ColumnMapping) => void;
}

const UNMAPPED = '__unmapped__';

export function ColumnMappingModal({
  open,
  onOpenChange,
  headers,
  mapping,
  onConfirm,
}: ColumnMappingModalProps) {
  const [currentMapping, setCurrentMapping] = useState<ColumnMapping>(mapping);

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setCurrentMapping(prev => ({
      ...prev,
      [field]: value === UNMAPPED ? null : value,
    }));
  };

  const missingRequired = requiredFields.filter(f => !currentMapping[f]);
  const missingImportant = importantFields.filter(f => !currentMapping[f]);
  const canConfirm = missingRequired.length === 0;

  const getFieldStatus = (field: keyof ColumnMapping) => {
    if (currentMapping[field]) return 'mapped';
    if (requiredFields.includes(field)) return 'required';
    if (importantFields.includes(field)) return 'important';
    return 'optional';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Column Mapping</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Summary */}
          <div className="flex flex-wrap gap-2">
            {missingRequired.length === 0 ? (
              <Badge variant="default" className="bg-success text-success-foreground">
                <CheckCircle className="w-3 h-3 mr-1" />
                All required columns mapped
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                {missingRequired.length} required column{missingRequired.length > 1 ? 's' : ''} missing
              </Badge>
            )}
            {missingImportant.length > 0 && (
              <Badge variant="secondary" className="bg-warning/20 text-warning">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {missingImportant.length} important column{missingImportant.length > 1 ? 's' : ''} unmapped
              </Badge>
            )}
          </div>

          {/* Mapping Fields */}
          <div className="grid gap-3">
            {(Object.keys(fieldLabels) as (keyof ColumnMapping)[]).map(field => {
              const status = getFieldStatus(field);
              return (
                <div key={field} className="flex items-center gap-3">
                  <div className="w-40 flex items-center gap-2">
                    <span className="text-sm font-medium">{fieldLabels[field]}</span>
                    {status === 'required' && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0">Required</Badge>
                    )}
                    {status === 'important' && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-warning/20 text-warning">Important</Badge>
                    )}
                  </div>
                  <Select
                    value={currentMapping[field] || UNMAPPED}
                    onValueChange={(v) => handleMappingChange(field, v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNMAPPED}>
                        <span className="text-muted-foreground">-- Not mapped --</span>
                      </SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentMapping[field] && (
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Missing Required Warning */}
          {missingRequired.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">
                Missing required mappings: {missingRequired.map(f => fieldLabels[f]).join(', ')}
              </p>
            </div>
          )}

          {/* Missing Important Warning */}
          {missingImportant.length > 0 && missingRequired.length === 0 && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-sm text-warning font-medium">
                Manager ID is not mapped. Spans & Layers analysis requires this field to map organizational hierarchy.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(currentMapping)} disabled={!canConfirm}>
            Confirm & Analyze
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
