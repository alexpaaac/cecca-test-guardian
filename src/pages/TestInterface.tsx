
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
    if (!testSession) {
      setTestStatus('login');
    } else if (testSession?.status === 'cancelled') {
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
  const mockCandidate = testSession ? {
    id: 'temp-id',
    firstName: testSession.candidateInfo.firstName,
    lastName: testSession.candidateInfo.lastName,
    email: testSession.candidateInfo.email,
    manager: testSession.candidateInfo.manager,
    managerEmail: testSession.candidateInfo.email,
    department: testSession.candidateInfo.department,
    level: testSession.candidateInfo.level,
    role: testSession.candidateInfo.role,
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
      
      {testStatus === 'completed' && mockCandidate && testSession && (
        <TestCompleted 
          candidate={mockCandidate}
          session={testSession}
        />
      )}
      
      {testStatus === 'cancelled' && (
        <TestCancelled />
      )}
    </Layout>
  );
}
