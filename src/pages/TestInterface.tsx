
import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { LoginForm } from '@/components/test/LoginForm';
import { QuizInterface } from '@/components/test/QuizInterface';
import { TestCancelled } from '@/components/test/TestCancelled';
import { TestCompleted } from '@/components/test/TestCompleted';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Quiz, TestSession } from '@/types';

export default function TestInterface() {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [testSession, setTestSession] = useLocalStorage<TestSession | null>('currentTestSession', null);
  const [testStatus, setTestStatus] = useState<'login' | 'in_progress' | 'completed' | 'cancelled'>('login');

  useEffect(() => {
    if (testSession?.status === 'cancelled') {
      setTestStatus('cancelled');
    } else if (testSession?.status === 'completed') {
      setTestStatus('completed');
    } else if (testSession?.status === 'in_progress' && currentQuiz) {
      setTestStatus('in_progress');
    }
  }, [testSession, currentQuiz]);

  const handleLogin = (quiz: Quiz, session: TestSession) => {
    setCurrentQuiz(quiz);
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

  // Create a mock employee object for compatibility with existing components
  const mockEmployee = testSession ? {
    id: 'temp-id',
    firstName: testSession.employeeInfo.firstName,
    lastName: testSession.employeeInfo.lastName,
    email: testSession.employeeInfo.email,
    manager: testSession.employeeInfo.manager,
    department: testSession.employeeInfo.department,
    level: testSession.employeeInfo.level,
    accessCode: 'temp-code',
    createdAt: new Date(),
  } : null;

  return (
    <Layout title="Test RH Collaborateur">
      {testStatus === 'login' && (
        <LoginForm onLogin={handleLogin} />
      )}
      
      {testStatus === 'in_progress' && currentQuiz && testSession && (
        <QuizInterface 
          quiz={currentQuiz}
          session={testSession}
          onComplete={handleTestComplete}
          onCancel={handleTestCancelled}
        />
      )}
      
      {testStatus === 'completed' && mockEmployee && testSession && (
        <TestCompleted 
          employee={mockEmployee}
          session={testSession}
        />
      )}
      
      {testStatus === 'cancelled' && (
        <TestCancelled />
      )}
    </Layout>
  );
}
