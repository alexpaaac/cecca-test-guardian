
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Clock, Timer } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Quiz, TestSession, Question } from '@/types';

interface QuizInterfaceProps {
  quiz: Quiz;
  session: TestSession;
  onComplete: (session: TestSession) => void;
  onCancel: (session: TestSession) => void;
}

export function QuizInterface({ quiz, session, onComplete, onCancel }: QuizInterfaceProps) {
  const [allQuestions] = useLocalStorage<Question[]>('questions', []);
  const [testSessions, setTestSessions] = useLocalStorage<TestSession[]>('testSessions', []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(session.answers || []);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasWarning, setHasWarning] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { toast } = useToast();

  // Get questions for this quiz
  const questions = allQuestions.filter(q => quiz.questions.includes(q.id));
  
  // Initialize timer with question's timePerQuestion from template configuration
  const getCurrentQuestionTime = () => {
    const currentQ = questions[currentQuestionIndex];
    // Use the question's individual timePerQuestion configured in the template
    return currentQ?.timePerQuestion || 60;
  };
  
  const [timeLeft, setTimeLeft] = useState(() => getCurrentQuestionTime());
  const [totalTestTime, setTotalTestTime] = useState(0);
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Timer for individual questions
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        setTotalTestTime(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto-advance when time expires
      handleNext(true);
    }
  }, [timeLeft]);

  // Reset timer when question changes - use question-specific time
  useEffect(() => {
    setTimeLeft(getCurrentQuestionTime());
  }, [currentQuestionIndex, questions]);

  // Enhanced anti-cheat system
  const logCheatingAttempt = useCallback((type: 'tab_switch' | 'window_blur' | 'focus_lost' | 'right_click' | 'dev_tools', metadata?: any) => {
    const attempt = {
      type,
      timestamp: new Date(),
      warning: type === 'tab_switch' ? !hasWarning : true,
      metadata
    };

    const updatedSession = {
      ...session,
      cheatingAttempts: [...session.cheatingAttempts, attempt],
    };

    setTestSessions(sessions => 
      sessions.map(s => s.id === session.id ? updatedSession : s)
    );

    return updatedSession;
  }, [session, setTestSessions, hasWarning]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      const updatedSession = logCheatingAttempt('tab_switch', { 
        questionIndex: currentQuestionIndex,
        timeLeft 
      });

      if (!hasWarning) {
        setHasWarning(true);
        setShowWarning(true);
        
        toast({
          title: "⚠️ Avertissement",
          description: "Vous avez quitté l'interface. Nouvelle sortie = annulation du test.",
          variant: "destructive",
        });
      } else {
        // Second tab switch offense - cancel test
        const cancelledSession = {
          ...updatedSession,
          status: 'cancelled' as const,
          completedAt: new Date(),
          completionTime: totalTestTime,
        };
        
        setTestSessions(sessions => 
          sessions.map(s => s.id === session.id ? cancelledSession : s)
        );
        
        onCancel(cancelledSession);
      }
    }
  }, [logCheatingAttempt, hasWarning, currentQuestionIndex, timeLeft, toast, onCancel, totalTestTime, setTestSessions]);

  const handleWindowBlur = useCallback(() => {
    logCheatingAttempt('window_blur', { 
      questionIndex: currentQuestionIndex,
      timeLeft 
    });
  }, [logCheatingAttempt, currentQuestionIndex, timeLeft]);

  const handleFocusLost = useCallback(() => {
    logCheatingAttempt('focus_lost', { 
      questionIndex: currentQuestionIndex,
      timeLeft 
    });
  }, [logCheatingAttempt, currentQuestionIndex, timeLeft]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleFocusLost);

    // Enhanced anti-cheat: prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logCheatingAttempt('right_click', { 
        questionIndex: currentQuestionIndex,
        target: (e.target as Element)?.tagName 
      });
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // Enhanced anti-cheat: prevent dev tools shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isDeveloperTool = 
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.metaKey && e.altKey && e.key === 'I') || // Mac Safari
        (e.metaKey && e.altKey && e.key === 'C'); // Mac Chrome

      if (isDeveloperTool) {
        e.preventDefault();
        logCheatingAttempt('dev_tools', { 
          key: e.key,
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          meta: e.metaKey,
          questionIndex: currentQuestionIndex 
        });
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleFocusLost);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleVisibilityChange, handleWindowBlur, handleFocusLost, logCheatingAttempt, currentQuestionIndex]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = (autoAdvance = false) => {
    if (!autoAdvance && selectedAnswer === null) {
      toast({
        title: "Réponse requise",
        description: "Veuillez sélectionner une réponse avant de continuer.",
        variant: "destructive",
      });
      return;
    }

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer ?? -1; // -1 for no answer
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

    const score = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;

    // Check if classification game is enabled
    if (quiz.hasClassificationGame) {
      const classificationSession = {
        ...session,
        status: 'classification_game' as const,
        answers: finalAnswers,
        score,
        completedAt: new Date(),
        completionTime: totalTestTime,
      };

      setTestSessions(sessions => 
        sessions.map(s => s.id === session.id ? classificationSession : s)
      );

      // Send webhook notification for quiz completion before classification game
      await sendWebhookNotification(finalAnswers, score);

      onComplete(classificationSession);
      return;
    }

    const completedSession = {
      ...session,
      status: 'completed' as const,
      answers: finalAnswers,
      score,
      completedAt: new Date(),
      completionTime: totalTestTime,
    };

    setTestSessions(sessions => 
      sessions.map(s => s.id === session.id ? completedSession : s)
    );

    // Send webhook notification
    await sendWebhookNotification(finalAnswers, score);

    onComplete(completedSession);
  };

  const sendWebhookNotification = async (finalAnswers: number[], score: number) => {
    try {
      const corrections = finalAnswers.map((answer, index) => 
        questions[index] ? answer === questions[index].correctAnswer : false
      );

      const webhookData = {
        prenom: session.candidateInfo.firstName,
        nom: session.candidateInfo.lastName,
        email: session.candidateInfo.email,
        manager: session.candidateInfo.manager,
        pole: session.candidateInfo.department,
        niveau: session.candidateInfo.level,
        role: session.candidateInfo.role,
        questionnaire: quiz.name,
        reponses: finalAnswers,
        corrections: corrections,
        score: score,
        duree: totalTestTime,
      };

      await fetch('https://alexpaac.app.n8n.cloud/webhook/10ce7334-f210-4720-b45b-e53f9bc7b400', {
        method: 'GET',
        mode: 'no-cors',
      });
    } catch (error) {
      console.error('Failed to send webhook:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 10) return 'text-destructive';
    if (timeLeft <= 30) return 'text-warning';
    return 'text-primary';
  };

  if (questions.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Aucune question disponible pour ce questionnaire.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {showWarning && (
        <Alert className="border-warning bg-warning/10 rounded-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            ⚠️ AVERTISSEMENT : Vous avez quitté l'interface du test. 
            Si vous quittez à nouveau, votre test sera automatiquement annulé.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-primary">{quiz.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {session.candidateInfo.firstName} {session.candidateInfo.lastName} - 
            Niveau {session.candidateInfo.level} - {session.candidateInfo.role}
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Question {currentQuestionIndex + 1} sur {questions.length}
            </span>
          </div>
          <div className={`flex items-center gap-2 font-mono text-lg font-semibold ${getTimerColor()}`}>
            <Timer className="h-5 w-5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      <Progress value={progress} className="w-full h-2" />

      <Card className="rounded-2xl shadow-lg border-2">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl text-primary">
                Question {currentQuestionIndex + 1}
              </CardTitle>
              <CardDescription className="text-base mt-2 text-foreground">
                {currentQuestion?.question}
              </CardDescription>
            </div>
            <div className={`px-4 py-2 rounded-xl border-2 ${getTimerColor()} border-current`}>
              <div className="text-center">
                <div className="text-xs opacity-75">Temps restant</div>
                <div className="font-mono font-bold text-lg">{formatTime(timeLeft)}</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={selectedAnswer?.toString()} 
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
            className="space-y-3"
          >
            {currentQuestion?.choices.map((choice, index) => (
              <div 
                key={index} 
                className="flex items-center space-x-3 p-4 border-2 rounded-2xl hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={index.toString()} id={`choice-${index}`} className="mt-0.5" />
                <Label htmlFor={`choice-${index}`} className="flex-1 cursor-pointer text-base leading-relaxed">
                  {choice}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {timeLeft <= 10 && "⏰ Temps bientôt écoulé !"}
            </div>
            <Button 
              onClick={() => handleNext()}
              className="bg-primary hover:bg-primary/90 rounded-2xl px-8 py-3 text-base font-medium"
              disabled={selectedAnswer === null}
            >
              {isLastQuestion ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
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
