import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, GripVertical, Timer, Clock } from 'lucide-react';
import { ClassificationTerm, ClassificationGameResult, TestSession } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface ClassificationGameProps {
  session: TestSession;
  timePerQuestion?: number; // Timer for the classification game
  onComplete: (result: ClassificationGameResult) => void;
}

const CLASSIFICATION_TERMS: ClassificationTerm[] = [
  { id: '1', term: 'Capital', correctCategory: 'bilan-passif' },
  { id: '2', term: 'Créances clients', correctCategory: 'bilan-actif' },
  { id: '3', term: 'Découvert bancaire', correctCategory: 'bilan-passif' },
  { id: '4', term: 'Matériel informatique', correctCategory: 'bilan-actif' },
  { id: '5', term: 'Chiffre d\'affaires', correctCategory: 'resultat-produits' },
  { id: '6', term: 'Salaires', correctCategory: 'resultat-charges' },
  { id: '7', term: 'Fournisseurs', correctCategory: 'bilan-passif' },
  { id: '8', term: 'Stock de marchandises', correctCategory: 'bilan-actif' },
  { id: '9', term: 'Charges sociales', correctCategory: 'resultat-charges' },
  { id: '10', term: 'Produits financiers', correctCategory: 'resultat-produits' },
  { id: '11', term: 'Emprunts bancaires', correctCategory: 'bilan-passif' },
  { id: '12', term: 'Banque', correctCategory: 'bilan-actif' }
];

const CATEGORIES = {
  'bilan-actif': 'Actif',
  'bilan-passif': 'Passif',
  'resultat-produits': 'Produits',
  'resultat-charges': 'Charges'
};

export default function ClassificationGame({ session, timePerQuestion = 300, onComplete }: ClassificationGameProps) {
  const [testSessions, setTestSessions] = useLocalStorage<TestSession[]>('testSessions', []);
  const [playerAnswers, setPlayerAnswers] = useState<{ [termId: string]: string }>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [gameStartTime] = useState(Date.now());
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const { toast } = useToast();

  // Anti-cheat tracking for classification game
  const logCheatingAttempt = useCallback((type: 'tab_switch' | 'window_blur' | 'focus_lost' | 'right_click' | 'dev_tools', metadata?: any) => {
    const attempt = {
      type,
      timestamp: new Date(),
      warning: true,
      metadata: { ...metadata, gamePhase: 'classification', timeLeft }
    };

    const updatedSession = {
      ...session,
      cheatingAttempts: [...session.cheatingAttempts, attempt],
    };

    setTestSessions(sessions => 
      sessions.map(s => s.id === session.id ? updatedSession : s)
    );
  }, [session, setTestSessions, timeLeft]);

  const unclassifiedTerms = CLASSIFICATION_TERMS.filter(term => !playerAnswers[term.id]);
  const activeItem = activeId ? CLASSIFICATION_TERMS.find(term => term.id === activeId) : null;

  // Timer logic for classification game
  useEffect(() => {
    if (!isValidated && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!isValidated && timeLeft === 0) {
      // Auto-validate when time expires
      handleValidate(true);
    }
  }, [timeLeft, isValidated]);

  // Redirect countdown after validation
  useEffect(() => {
    if (redirectCountdown !== null && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (redirectCountdown === 0) {
      // Calculate final score and complete
      const correctAnswers = CLASSIFICATION_TERMS.filter(
        term => playerAnswers[term.id] === term.correctCategory
      ).length;
      const score = Math.round((correctAnswers / CLASSIFICATION_TERMS.length) * 100);
      const completionTime = Math.round((Date.now() - gameStartTime) / 1000);

      const result: ClassificationGameResult = {
        terms: CLASSIFICATION_TERMS,
        playerAnswers,
        score,
        completedAt: new Date()
      };

      // Update session with classification score
      const updatedSession = {
        ...session,
        classificationScore: score,
        completionTime: (session.completionTime || 0) + completionTime
      };

      setTestSessions(sessions => 
        sessions.map(s => s.id === session.id ? updatedSession : s)
      );

      onComplete(result);
    }
  }, [redirectCountdown, playerAnswers, gameStartTime, session, setTestSessions, onComplete]);

  // Anti-cheat event handlers
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      logCheatingAttempt('tab_switch');
    }
  }, [logCheatingAttempt]);

  const handleWindowBlur = useCallback(() => {
    logCheatingAttempt('window_blur');
  }, [logCheatingAttempt]);

  const handleFocusLost = useCallback(() => {
    logCheatingAttempt('focus_lost');
  }, [logCheatingAttempt]);

  // Anti-cheat system setup
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleFocusLost);

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logCheatingAttempt('right_click', { target: (e.target as Element)?.tagName });
    };
    document.addEventListener('contextmenu', handleContextMenu);

    const handleKeyDown = (e: KeyboardEvent) => {
      const isDeveloperTool = 
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.metaKey && e.altKey && e.key === 'I') ||
        (e.metaKey && e.altKey && e.key === 'C');

      if (isDeveloperTool) {
        e.preventDefault();
        logCheatingAttempt('dev_tools', { 
          key: e.key,
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          meta: e.metaKey
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
  }, [handleVisibilityChange, handleWindowBlur, handleFocusLost, logCheatingAttempt]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const termId = active.id as string;
      const category = over.id as string;
      
      setPlayerAnswers(prev => ({
        ...prev,
        [termId]: category
      }));
    }
  };

  const getTermsInCategory = (category: string) => {
    return CLASSIFICATION_TERMS.filter(term => playerAnswers[term.id] === category);
  };

  const handleValidate = (autoValidate = false) => {
    const allTermsClassified = CLASSIFICATION_TERMS.every(term => playerAnswers[term.id]);
    
    if (!autoValidate && !allTermsClassified) {
      toast({
        title: "Classification incomplète",
        description: "Veuillez classer tous les termes avant de valider.",
        variant: "destructive"
      });
      return;
    }

    setIsValidated(true);
    setShowResults(true);

    // Calculate score
    const correctAnswers = CLASSIFICATION_TERMS.filter(
      term => playerAnswers[term.id] === term.correctCategory
    ).length;
    const score = Math.round((correctAnswers / CLASSIFICATION_TERMS.length) * 100);

    toast({
      title: "Jeu de classification terminé",
      description: `Score: ${score}% (${correctAnswers}/${CLASSIFICATION_TERMS.length})`,
      variant: score >= 70 ? "default" : "destructive"
    });

    // Start 10-second countdown before redirect
    setRedirectCountdown(10);
  };

  const isTermCorrect = (term: ClassificationTerm) => {
    return playerAnswers[term.id] === term.correctCategory;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 30) return 'text-destructive';
    if (timeLeft <= 60) return 'text-warning';
    return 'text-primary';
  };

  const TermCard = ({ term }: { term: ClassificationTerm }) => (
    <Card className={`p-2 cursor-grab ${showResults ? (isTermCorrect(term) ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}>
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{term.term}</span>
        {showResults && (
          isTermCorrect(term) ? 
            <CheckCircle className="h-4 w-4 text-green-600 ml-auto" /> :
            <XCircle className="h-4 w-4 text-red-600 ml-auto" />
        )}
      </div>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold text-foreground mb-2">Jeu de Classification Comptable</h2>
          <p className="text-muted-foreground">
            Glissez-déposez chaque terme comptable dans la bonne catégorie
          </p>
        </div>
        {!isValidated && (
          <div className={`flex items-center gap-2 font-mono text-lg font-semibold ${getTimerColor()}`}>
            <Timer className="h-5 w-5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Unclassified Terms */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Termes à classer</CardTitle>
              <Badge variant="outline">{unclassifiedTerms.length} restants</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {unclassifiedTerms.map(term => (
                <div
                  key={term.id}
                  draggable
                  onDragStart={() => setActiveId(term.id)}
                >
                  <TermCard term={term} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Classification Tables */}
          <div className="md:col-span-2 space-y-4">
            {/* Bilan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bilan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Actif */}
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 min-h-32"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (activeId) {
                        setPlayerAnswers(prev => ({
                          ...prev,
                          [activeId]: 'bilan-actif'
                        }));
                        setActiveId(null);
                      }
                    }}
                  >
                    <h4 className="font-semibold text-center mb-3">Actif</h4>
                    <div className="space-y-2">
                      {getTermsInCategory('bilan-actif').map(term => (
                        <TermCard key={term.id} term={term} />
                      ))}
                    </div>
                  </div>

                  {/* Passif */}
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 min-h-32"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (activeId) {
                        setPlayerAnswers(prev => ({
                          ...prev,
                          [activeId]: 'bilan-passif'
                        }));
                        setActiveId(null);
                      }
                    }}
                  >
                    <h4 className="font-semibold text-center mb-3">Passif</h4>
                    <div className="space-y-2">
                      {getTermsInCategory('bilan-passif').map(term => (
                        <TermCard key={term.id} term={term} />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compte de Résultat */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compte de Résultat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Produits */}
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 min-h-32"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (activeId) {
                        setPlayerAnswers(prev => ({
                          ...prev,
                          [activeId]: 'resultat-produits'
                        }));
                        setActiveId(null);
                      }
                    }}
                  >
                    <h4 className="font-semibold text-center mb-3">Produits</h4>
                    <div className="space-y-2">
                      {getTermsInCategory('resultat-produits').map(term => (
                        <TermCard key={term.id} term={term} />
                      ))}
                    </div>
                  </div>

                  {/* Charges */}
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 min-h-32"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (activeId) {
                        setPlayerAnswers(prev => ({
                          ...prev,
                          [activeId]: 'resultat-charges'
                        }));
                        setActiveId(null);
                      }
                    }}
                  >
                    <h4 className="font-semibold text-center mb-3">Charges</h4>
                    <div className="space-y-2">
                      {getTermsInCategory('resultat-charges').map(term => (
                        <TermCard key={term.id} term={term} />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DragOverlay>
          {activeItem ? <TermCard term={activeItem} /> : null}
        </DragOverlay>
      </DndContext>

      <div className="text-center">
        <Button 
          onClick={() => handleValidate()}
          disabled={isValidated || unclassifiedTerms.length > 0}
          size="lg"
        >
          {isValidated ? "Classification validée" : "Valider la classification"}
        </Button>
        {showResults && redirectCountdown !== null && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Redirection automatique dans {redirectCountdown} seconde{redirectCountdown !== 1 ? 's' : ''}...
            </p>
            <div className={`flex items-center justify-center gap-2 font-mono text-lg font-semibold text-primary`}>
              <Clock className="h-5 w-5" />
              <span>{redirectCountdown}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}