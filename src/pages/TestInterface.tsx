import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { LoginForm } from '@/components/test/LoginForm';
import { QuizInterface } from '@/components/test/QuizInterface';
import { TestCancelled } from '@/components/test/TestCancelled';
import { TestCompleted } from '@/components/test/TestCompleted';
import ClassificationGame from '@/components/test/ClassificationGame';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Quiz, TestSession, ClassificationGameResult } from '@/types';

export default function TestInterface() {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [testSession, setTestSession] = useLocalStorage<TestSession | null>('currentTestSession', null);
  const [view, setView] = useState<'login' | 'quiz' | 'classification' | 'completed' | 'cancelled'>('login');
  const [quizzes] = useLocalStorage<Quiz[]>('quizzes', []);

  // Initialize view based on current session
  useEffect(() => {
    if (!testSession) {
      setView('login');
      setCurrentQuiz(null);
      return;
    }

    // Find the quiz for this session
    const sessionQuiz = quizzes.find(q => q.id === testSession.quizId);
    if (!sessionQuiz && testSession.status === 'in_progress') {
      // Quiz was deleted, reset session
      setTestSession(null);
      setView('login');
      return;
    }

    setCurrentQuiz(sessionQuiz || null);

    // Set view based on session status
    if (testSession.status === 'cancelled') {
      setView('cancelled');
    } else if (testSession.status === 'completed') {
      setView('completed');
    } else if (testSession.status === 'classification_game') {
      setView('classification');
    } else if (testSession.status === 'in_progress') {
      setView('quiz');
    } else {
      setView('login');
    }
  }, [testSession, quizzes, setTestSession]);

  const handleLogin = (quiz: Quiz, session: TestSession) => {
    setCurrentQuiz(quiz);
    setTestSession(session);
    setView('quiz');
  };

  const handleQuizComplete = (completedSession: TestSession) => {
    setTestSession(completedSession);
    if (completedSession.status === 'classification_game') {
      setView('classification');
    } else {
      setView('completed');
    }
  };

  const handleQuizCancel = (cancelledSession: TestSession) => {
    setTestSession(cancelledSession);
    setView('cancelled');
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
    setView('completed');
  };

  const handleRestart = () => {
    setTestSession(null);
    setCurrentQuiz(null);
    setView('login');
  };

  // Create candidate object for completed view
  const candidate = testSession?.candidateInfo ? {
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

  return (
    <Layout title="Test RH Collaborateur">
      {view === 'login' && (
        <LoginForm onLogin={handleLogin} />
      )}

      {view === 'quiz' && currentQuiz && testSession && (
        <QuizInterface 
          quiz={currentQuiz}
          session={testSession}
          onComplete={handleQuizComplete}
          onCancel={handleQuizCancel}
        />
      )}

      {view === 'classification' && testSession && (
        <ClassificationGame 
          session={testSession}
          timePerQuestion={300}
          onComplete={handleClassificationComplete} 
        />
      )}

      {view === 'completed' && candidate && testSession && (
        <TestCompleted 
          candidate={candidate}
          session={testSession}
        />
      )}

      {view === 'cancelled' && (
        <TestCancelled />
      )}

      {/* Error state fallback */}
      {view === 'quiz' && (!currentQuiz || !testSession) && (
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-destructive">Erreur</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Une erreur s'est produite lors du chargement du test.
              </p>
              <Button onClick={handleRestart} variant="outline">
                Recommencer
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'completed' && (!candidate || !testSession) && (
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-destructive">Erreur</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Impossible d'afficher les résultats.
              </p>
              <Button onClick={handleRestart} variant="outline">
                Recommencer
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
}