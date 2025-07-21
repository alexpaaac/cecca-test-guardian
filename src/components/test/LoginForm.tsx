
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Quiz, TestSession } from '@/types';

interface LoginFormProps {
  onLogin: (quiz: Quiz, session: TestSession) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quizzes] = useLocalStorage<Quiz[]>('quizzes', []);
  const [testSessions, setTestSessions] = useLocalStorage<TestSession[]>('testSessions', []);
  const [employeeInfo, setEmployeeInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    manager: '',
    department: '',
    level: 'C1' as 'C1' | 'C2' | 'C3',
  });
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const { toast } = useToast();

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessCode) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir votre code d'accès.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const quiz = quizzes.find(q => q.accessCode === accessCode.toUpperCase() && q.status === 'active');
    
    if (!quiz) {
      toast({
        title: "Code invalide",
        description: "Le code d'accès saisi n'est pas valide ou le questionnaire n'est pas actif.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setSelectedQuiz(quiz);
    setShowEmployeeForm(true);
    setIsLoading(false);
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedQuiz) return;

    // Validate employee info
    if (!employeeInfo.firstName.trim() || !employeeInfo.lastName.trim() || !employeeInfo.email.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Check if employee already has a session for this quiz
    const existingSession = testSessions.find(session => 
      session.quizId === selectedQuiz.id && 
      session.employeeInfo.email === employeeInfo.email
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
      onLogin(selectedQuiz, existingSession);
    } else {
      // Create new session
      const newSession: TestSession = {
        id: crypto.randomUUID(),
        quizId: selectedQuiz.id,
        employeeInfo,
        status: 'in_progress',
        startedAt: new Date(),
        answers: [],
        cheatingAttempts: [],
      };
      
      setTestSessions([...testSessions, newSession]);
      onLogin(selectedQuiz, newSession);
    }

    toast({
      title: "Connexion réussie",
      description: `Bienvenue ${employeeInfo.firstName} ${employeeInfo.lastName}`,
    });
    
    setIsLoading(false);
  };

  const handleBack = () => {
    setShowEmployeeForm(false);
    setSelectedQuiz(null);
    setEmployeeInfo({
      firstName: '',
      lastName: '',
      email: '',
      manager: '',
      department: '',
      level: 'C1',
    });
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {showEmployeeForm ? 'Informations Collaborateur' : 'Connexion au Test RH'}
          </CardTitle>
          <CardDescription>
            {showEmployeeForm 
              ? `Questionnaire : ${selectedQuiz?.name}` 
              : 'Saisissez votre code d\'accès unique pour démarrer le test'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showEmployeeForm ? (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <Label htmlFor="accessCode">Code d'accès</Label>
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="Saisissez votre code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="text-center font-mono text-lg"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={isLoading}
              >
                {isLoading ? (
                  "Vérification..."
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Continuer
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={employeeInfo.firstName}
                    onChange={(e) => setEmployeeInfo({ ...employeeInfo, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={employeeInfo.lastName}
                    onChange={(e) => setEmployeeInfo({ ...employeeInfo, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={employeeInfo.email}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, email: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="manager">Manager</Label>
                <Input
                  id="manager"
                  value={employeeInfo.manager}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, manager: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="department">Pôle</Label>
                <Input
                  id="department"
                  value={employeeInfo.department}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, department: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="level">Niveau</Label>
                <select
                  id="level"
                  value={employeeInfo.level}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, level: e.target.value as 'C1' | 'C2' | 'C3' })}
                  className="w-full p-2 border rounded"
                >
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                  <option value="C3">C3</option>
                </select>
              </div>
              
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                  Retour
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Connexion..." : "Démarrer le test"}
                </Button>
              </div>
            </form>
          )}
          
          {!showEmployeeForm && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Instructions importantes :</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ne quittez pas cette page pendant le test</li>
                <li>• Première sortie = avertissement</li>
                <li>• Deuxième sortie = annulation du test</li>
                <li>• Aucune navigation arrière possible</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
