import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Quiz, TestSession, Candidate } from '@/types';

interface LoginFormProps {
  onLogin: (quiz: Quiz, session: TestSession) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [quizCode, setQuizCode] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quizzes] = useLocalStorage<Quiz[]>('quizzes', []);
  const [candidates] = useLocalStorage<Candidate[]>('candidates', []);
  const [testSessions, setTestSessions] = useLocalStorage<TestSession[]>('testSessions', []);
  const { toast } = useToast();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quizCode || !employeeCode) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir les deux codes d'accès.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const quiz = quizzes.find(q => q.accessCode === quizCode.toUpperCase() && q.status === 'active');
    const candidate = candidates.find(c => c.accessCode === employeeCode.toUpperCase());
    
    if (!quiz) {
      toast({
        title: "Code questionnaire invalide",
        description: "Le code questionnaire saisi n'est pas valide ou le questionnaire n'est pas actif.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!candidate) {
      toast({
        title: "Code candidat invalide",
        description: "Le code candidat saisi n'est pas valide.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Check if candidate already has a session for this quiz
    const existingSession = testSessions.find(session => 
      session.quizId === quiz.id && 
      session.candidateInfo.email === candidate.email
    );
    
    if (existingSession) {
      if (existingSession.status === 'completed') {
        toast({
          title: "Test déjà terminé",
          description: "Vous avez déjà terminé ce questionnaire.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      } else if (existingSession.status === 'cancelled') {
        toast({
          title: "Test annulé",
          description: "Votre test a été annulé pour suspicion de triche. Contactez votre responsable.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Continue existing session
      onLogin(quiz, existingSession);
    } else {
      // Create new session
      const newSession: TestSession = {
        id: crypto.randomUUID(),
        quizId: quiz.id,
        candidateInfo: {
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          manager: candidate.manager,
          department: candidate.department,
          level: candidate.level,
          role: candidate.role,
        },
        status: 'in_progress',
        startedAt: new Date(),
        answers: [],
        cheatingAttempts: [],
      };
      
      setTestSessions([...testSessions, newSession]);
      onLogin(quiz, newSession);
    }

    toast({
      title: "Connexion réussie",
      description: `Bienvenue ${candidate.firstName} ${candidate.lastName}`,
    });
    
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Connexion au Test RH</CardTitle>
          <CardDescription>
            Saisissez vos codes d'accès pour démarrer le test
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <Label htmlFor="quizCode">Code Questionnaire</Label>
              <Input
                id="quizCode"
                type="text"
                placeholder="Code du questionnaire"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value)}
                className="text-center font-mono text-lg"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="candidateCode">Code Candidat</Label>
              <Input
                id="candidateCode"
                type="text"
                placeholder="Votre code candidat"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                className="text-center font-mono text-lg"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              disabled={isLoading}
            >
              {isLoading ? (
                "Connexion..."
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Démarrer le test
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Instructions importantes :</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Ne quittez pas cette page pendant le test</li>
              <li>• Première sortie = avertissement</li>
              <li>• Deuxième sortie = annulation du test</li>
              <li>• Aucune navigation arrière possible</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}