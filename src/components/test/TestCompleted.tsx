import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Award, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Employee, TestSession } from '@/types';

interface TestCompletedProps {
  employee: Employee;
  session: TestSession;
}

export function TestCompleted({ employee, session }: TestCompletedProps) {
  const navigate = useNavigate();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return 'Excellent résultat !';
    if (score >= 60) return 'Bon résultat !';
    return 'Résultat à améliorer.';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Test Terminé !</CardTitle>
          <CardDescription>
            Félicitations {employee.firstName}, vous avez terminé votre test RH
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-primary">Votre Score</span>
            </div>
            <div className={`text-6xl font-bold ${getScoreColor(session.score || 0)}`}>
              {session.score}%
            </div>
            <p className={`text-lg font-medium ${getScoreColor(session.score || 0)}`}>
              {getScoreMessage(session.score || 0)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Temps de completion</p>
              <p className="text-lg font-semibold">
                {session.startedAt && session.completedAt 
                  ? Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000 / 60)
                  : 0} min
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Date de completion</p>
              <p className="text-lg font-semibold">
                {session.completedAt 
                  ? new Date(session.completedAt).toLocaleDateString('fr-FR')
                  : 'Aujourd\'hui'}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-blue-800">Informations importantes :</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Vos résultats ont été automatiquement transmis à votre responsable</li>
              <li>• Une notification a été envoyée au service RH</li>
              <li>• Vous recevrez un retour détaillé sous 48h</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-yellow-800">Prochaines étapes :</h4>
            <ul className="space-y-1 text-sm text-yellow-700">
              <li>• Attendez le retour de votre manager</li>
              <li>• Préparez-vous pour l'entretien de suivi si nécessaire</li>
              <li>• Consultez les ressources de formation recommandées</li>
            </ul>
          </div>

          <div className="text-center">
            <Button 
              onClick={() => navigate('/')}
              className="bg-primary hover:bg-primary/90"
            >
              <Home className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Session ID: {session.id.substring(0, 8)}... • 
              Employé: {employee.firstName} {employee.lastName} ({employee.level})
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}