
import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { LoginForm } from '@/components/test/LoginForm';
import { QuizInterface } from '@/components/test/QuizInterface';
import { TestCancelled } from '@/components/test/TestCancelled';
import { TestCompleted } from '@/components/test/TestCompleted';
import ClassificationGame from '@/components/test/ClassificationGame';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Quiz, TestSession, ClassificationGameResult } from '@/types';

export default function TestInterface() {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [testSession, setTestSession] = useLocalStorage<TestSession | null>('currentTestSession', null);
  const [testStatus, setTestStatus] = useState<'login' | 'in_progress' | 'completed' | 'cancelled' | 'classification_game'>('login');

  // Debug logs
  console.log('TestInterface - testSession:', testSession);
  console.log('TestInterface - testStatus:', testStatus);
  console.log('TestInterface - currentQuiz:', currentQuiz);

  useEffect(() => {
    if (!testSession) {
      console.log('Setting testStatus to login - no testSession');
      setTestStatus('login');
    } else if (testSession?.status === 'cancelled') {
      console.log('Setting testStatus to cancelled');
      setTestStatus('cancelled');
    } else if (testSession?.status === 'completed') {
      console.log('Setting testStatus to completed');
      setTestStatus('completed');
    } else if (testSession?.status === 'classification_game') {
      console.log('Setting testStatus to classification_game');
      setTestStatus('classification_game');
    } else if (testSession?.status === 'in_progress' && currentQuiz) {
      console.log('Setting testStatus to in_progress');
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
    if (session.status === 'classification_game') {
      setTestStatus('classification_game');
    } else {
      setTestStatus('completed');
    }
  };

  const handleClassificationComplete = (result: ClassificationGameResult) => {
    if (!testSession) return;
    
    const [testSessions, setTestSessions] = useLocalStorage<TestSession[]>('testSessions', []);
    
    const completedSession = {
      ...testSession,
      status: 'completed' as const,
      classificationScore: result.score,
      completedAt: new Date(),
    };

    setTestSession(completedSession);
    setTestSessions(sessions => 
      sessions.map(s => s.id === testSession.id ? completedSession : s)
    );
    setTestStatus('completed');
  };

  const handleTestCancelled = (session: TestSession) => {
    setTestSession(session);
    setTestStatus('cancelled');
  };

  // Create a mock employee object for compatibility with existing components
  const mockCandidate = testSession?.candidateInfo ? {
    id: 'temp-id',
    firstName: testSession.candidateInfo.firstName || 'Candidat',
    lastName: testSession.candidateInfo.lastName || 'Test',
    email: testSession.candidateInfo.email || 'test@example.com',
    manager: testSession.candidateInfo.manager || 'Manager',
    managerEmail: testSession.candidateInfo.email || 'manager@example.com',
    department: testSession.candidateInfo.department || 'Département',
    level: testSession.candidateInfo.level || 'C1',
    role: testSession.candidateInfo.role || 'Collaborateur',
    accessCode: 'temp-code',
    createdAt: new Date(),
  } : null;

  console.log('TestInterface render - testStatus:', testStatus);

  return (
    <Layout title="Test RH Collaborateur">
      {testStatus === 'login' && (
        <>
          {console.log('Rendering LoginForm')}
          <LoginForm onLogin={handleLogin} />
        </>
      )}
      
      {testStatus === 'in_progress' && currentQuiz && testSession && (
        <>
          {console.log('Rendering QuizInterface')}
          <QuizInterface 
            quiz={currentQuiz}
            session={testSession}
            onComplete={handleTestComplete}
            onCancel={handleTestCancelled}
          />
        </>
      )}
      
      {testStatus === 'classification_game' && (
        <>
          {console.log('Rendering ClassificationGame')}
          <ClassificationGame onComplete={handleClassificationComplete} />
        </>
      )}
      
      {testStatus === 'completed' && mockCandidate && testSession && (
        <>
          {console.log('Rendering TestCompleted')}
          <TestCompleted 
            candidate={mockCandidate}
            session={testSession}
          />
        </>
      )}
      
      {testStatus === 'cancelled' && (
        <>
          {console.log('Rendering TestCancelled')}
          <TestCancelled />
        </>
      )}
    </Layout>
  );
}
