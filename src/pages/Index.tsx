import { useState } from 'react';
import { Employee } from '@/types/employee';
import { FileUpload } from '@/components/dashboard/FileUpload';
import { Dashboard } from '@/components/dashboard/Dashboard';

const Index = () => {
  const [employees, setEmployees] = useState<Employee[] | null>(null);

  const handleDataLoaded = (data: Employee[]) => {
    setEmployees(data);
  };

  const handleReset = () => {
    setEmployees(null);
  };

  if (!employees) {
    return <FileUpload onDataLoaded={handleDataLoaded} />;
  }

  return <Dashboard employees={employees} onReset={handleReset} />;
};

export default Index;