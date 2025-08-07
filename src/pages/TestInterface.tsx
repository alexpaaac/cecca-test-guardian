
import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { LoginForm } from '@/components/test/LoginForm';
import { QuizInterface } from '@/components/test/QuizInterface';
import { TestCancelled } from '@/components/test/TestCancelled';
import { TestCompleted } from '@/components/test/TestCompleted';
import ClassificationGame from '@/components/test/ClassificationGame';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Quiz, TestSession, ClassificationGameResult } from '@/types';

export default function TestInterface() {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [testSession, setTestSession] = useLocalStorage<TestSession | null>('currentTestSession', null);
  const [testStatus, setTestStatus] = useState<'login' | 'in_progress' | 'completed' | 'cancelled' | 'classification_game'>('login');
  const [quizzes] = useLocalStorage<Quiz[]>('quizzes', []);

  useEffect(() => {
    if (!testSession) {
      setTestStatus('login');
      setCurrentQuiz(null);
      return;
    }

    // Try to find the quiz for this session
    const sessionQuiz = quizzes.find(q => q.id === testSession.quizId);
    if (sessionQuiz) {
      setCurrentQuiz(sessionQuiz);
    }

    // Set status based on session status
    switch (testSession.status) {
      case 'cancelled':
        setTestStatus('cancelled');
        break;
      case 'completed':
        setTestStatus('completed');
        break;
      case 'classification_game':
        setTestStatus('classification_game');
        break;
      case 'in_progress':
        if (sessionQuiz) {
          setTestStatus('in_progress');
        } else {
          // Quiz not found, reset session
          setTestSession(null);
          setTestStatus('login');
        }
        break;
      default:
        setTestStatus('login');
    }
  }, [testSession, quizzes, setTestSession]);

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
    
    const completedSession = {
      ...testSession,
      status: 'completed' as const,
      classificationScore: result.score,
      completedAt: new Date(),
    };

    setTestSession(completedSession);
    setTestStatus('completed');
  };

  const handleTestCancelled = (session: TestSession) => {
    setTestSession(session);
    setTestStatus('cancelled');
  };

  // Create a mock candidate object for compatibility with existing components
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

  const handleStartNewTest = () => {
    setTestSession(null);
    setCurrentQuiz(null);
    setTestStatus('login');
  };

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
      
      {testStatus === 'classification_game' && (
        <ClassificationGame onComplete={handleClassificationComplete} />
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
      
      {/* Fallback for error states */}
      {!['login', 'in_progress', 'classification_game', 'completed', 'cancelled'].includes(testStatus) && (
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Une erreur s'est produite. Veuillez recommencer.
              </p>
              <Button onClick={handleStartNewTest}>
                Recommencer
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
}
