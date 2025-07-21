import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { LoginForm } from '@/components/test/LoginForm';
import { QuizInterface } from '@/components/test/QuizInterface';
import { TestCancelled } from '@/components/test/TestCancelled';
import { TestCompleted } from '@/components/test/TestCompleted';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Employee, TestSession } from '@/types';

export default function TestInterface() {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [testSession, setTestSession] = useLocalStorage<TestSession | null>('currentTestSession', null);
  const [testStatus, setTestStatus] = useState<'login' | 'in_progress' | 'completed' | 'cancelled'>('login');

  useEffect(() => {
    if (testSession?.status === 'cancelled') {
      setTestStatus('cancelled');
    } else if (testSession?.status === 'completed') {
      setTestStatus('completed');
    } else if (testSession?.status === 'in_progress' && currentEmployee) {
      setTestStatus('in_progress');
    }
  }, [testSession, currentEmployee]);

  const handleLogin = (employee: Employee, session: TestSession) => {
    setCurrentEmployee(employee);
    setTestSession(session);
    setTestStatus('in_progress');
  };

  const handleTestComplete = (session: TestSession) => {
    setTestSession(session);
    setTestStatus('completed');
  };

  const handleTestCancelled = (session: TestSession) => {
    setTestSession(session);
    setTestStatus('cancelled');
  };

  return (
    <Layout title="Test RH Collaborateur">
      {testStatus === 'login' && (
        <LoginForm onLogin={handleLogin} />
      )}
      
      {testStatus === 'in_progress' && currentEmployee && testSession && (
        <QuizInterface 
          employee={currentEmployee}
          session={testSession}
          onComplete={handleTestComplete}
          onCancel={handleTestCancelled}
        />
      )}
      
      {testStatus === 'completed' && currentEmployee && testSession && (
        <TestCompleted 
          employee={currentEmployee}
          session={testSession}
        />
      )}
      
      {testStatus === 'cancelled' && (
        <TestCancelled />
      )}
    </Layout>
  );
}