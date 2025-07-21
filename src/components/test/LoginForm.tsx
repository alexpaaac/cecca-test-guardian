import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Employee, TestSession } from '@/types';

interface LoginFormProps {
  onLogin: (employee: Employee, session: TestSession) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [employees] = useLocalStorage<Employee[]>('employees', []);
  const [testSessions, setTestSessions] = useLocalStorage<TestSession[]>('testSessions', []);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
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

    const employee = employees.find(emp => emp.accessCode === accessCode.toUpperCase());
    
    if (!employee) {
      toast({
        title: "Code invalide",
        description: "Le code d'accès saisi n'est pas valide.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Check if employee already has a session
    const existingSession = testSessions.find(session => session.employeeId === employee.id);
    
    if (existingSession) {
      if (existingSession.status === 'completed') {
        toast({
          title: "Test déjà terminé",
          description: "Vous avez déjà terminé ce test.",
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
      onLogin(employee, existingSession);
    } else {
      // Create new session
      const newSession: TestSession = {
        id: crypto.randomUUID(),
        employeeId: employee.id,
        status: 'in_progress',
        startedAt: new Date(),
        answers: [],
        cheatingAttempts: [],
      };
      
      setTestSessions([...testSessions, newSession]);
      onLogin(employee, newSession);
    }

    toast({
      title: "Connexion réussie",
      description: `Bienvenue ${employee.firstName} ${employee.lastName}`,
    });
    
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Connexion au Test RH</CardTitle>
          <CardDescription>
            Saisissez votre code d'accès unique pour démarrer le test
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                "Connexion..."
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Se connecter
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