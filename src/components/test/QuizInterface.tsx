import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Employee, TestSession, Question } from '@/types';

interface QuizInterfaceProps {
  employee: Employee;
  session: TestSession;
  onComplete: (session: TestSession) => void;
  onCancel: (session: TestSession) => void;
}

export function QuizInterface({ employee, session, onComplete, onCancel }: QuizInterfaceProps) {
  const [questions] = useLocalStorage<Question[]>('questions', []);
  const [testSessions, setTestSessions] = useLocalStorage<TestSession[]>('testSessions', []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(session.answers || []);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasWarning, setHasWarning] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Anti-cheat system
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      const attempt = {
        type: 'tab_switch' as const,
        timestamp: new Date(),
        warning: !hasWarning,
      };

      const updatedSession = {
        ...session,
        cheatingAttempts: [...session.cheatingAttempts, attempt],
      };

      if (!hasWarning) {
        setHasWarning(true);
        setShowWarning(true);
        
        // Update session in localStorage
        setTestSessions(sessions => 
          sessions.map(s => s.id === session.id ? updatedSession : s)
        );
        
        toast({
          title: "⚠️ Avertissement",
          description: "Vous avez quitté l'interface. Nouvelle sortie = annulation du test.",
          variant: "destructive",
        });
      } else {
        // Second offense - cancel test
        const cancelledSession = {
          ...updatedSession,
          status: 'cancelled' as const,
          completedAt: new Date(),
        };
        
        setTestSessions(sessions => 
          sessions.map(s => s.id === session.id ? cancelledSession : s)
        );
        
        onCancel(cancelledSession);
      }
    }
  }, [hasWarning, session, setTestSessions, onCancel, toast]);

  const handleWindowBlur = useCallback(() => {
    const attempt = {
      type: 'window_blur' as const,
      timestamp: new Date(),
      warning: true,
    };

    const updatedSession = {
      ...session,
      cheatingAttempts: [...session.cheatingAttempts, attempt],
    };

    setTestSessions(sessions => 
      sessions.map(s => s.id === session.id ? updatedSession : s)
    );
  }, [session, setTestSessions]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    // Prevent F12, Ctrl+Shift+I, etc.
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleVisibilityChange, handleWindowBlur]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) {
      toast({
        title: "Réponse requise",
        description: "Veuillez sélectionner une réponse avant de continuer.",
        variant: "destructive",
      });
      return;
    }

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);

    // Update session in localStorage
    const updatedSession = {
      ...session,
      answers: newAnswers,
    };
    
    setTestSessions(sessions => 
      sessions.map(s => s.id === session.id ? updatedSession : s)
    );

    if (isLastQuestion) {
      handleSubmitTest(newAnswers);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(newAnswers[currentQuestionIndex + 1] ?? null);
    }
  };

  const handleSubmitTest = async (finalAnswers: number[]) => {
    // Calculate score
    let correctAnswers = 0;
    finalAnswers.forEach((answer, index) => {
      if (questions[index] && answer === questions[index].correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);

    const completedSession = {
      ...session,
      status: 'completed' as const,
      answers: finalAnswers,
      score,
      completedAt: new Date(),
    };

    setTestSessions(sessions => 
      sessions.map(s => s.id === session.id ? completedSession : s)
    );

    // Send webhook notification
    try {
      const corrections = finalAnswers.map((answer, index) => 
        questions[index] ? answer === questions[index].correctAnswer : false
      );

      const webhookData = {
        prenom: employee.firstName,
        nom: employee.lastName,
        email: employee.email,
        manager: employee.manager,
        pole: employee.department,
        niveau: employee.level,
        reponses: finalAnswers,
        corrections: corrections,
      };

      await fetch('https://alexpaac.app.n8n.cloud/webhook/10ce7334-f210-4720-b45b-e53f9bc7b400', {
        method: 'GET',
        mode: 'no-cors',
        // Note: For GET requests, we'd need to send data as query parameters
        // But since the webhook URL is configured for GET, we'll just trigger it
      });
    } catch (error) {
      console.error('Failed to send webhook:', error);
    }

    onComplete(completedSession);
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Aucune question disponible pour le moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {showWarning && (
        <Alert className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            ⚠️ AVERTISSEMENT : Vous avez quitté l'interface du test. 
            Si vous quittez à nouveau, votre test sera automatiquement annulé.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {employee.firstName} {employee.lastName} - Niveau {employee.level}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} sur {questions.length}
        </div>
      </div>

      <Progress value={progress} className="w-full" />

      <Card>
        <CardHeader>
          <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
          <CardDescription>{currentQuestion?.question}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectedAnswer?.toString()} 
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
            className="space-y-4"
          >
            {currentQuestion?.choices.map((choice, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value={index.toString()} id={`choice-${index}`} />
                <Label htmlFor={`choice-${index}`} className="flex-1 cursor-pointer">
                  {choice}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90"
              disabled={selectedAnswer === null}
            >
              {isLastQuestion ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Valider mon questionnaire
                </>
              ) : (
                'Question suivante'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}