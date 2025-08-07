import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TestCancelled() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">Test Annulé</CardTitle>
          <CardDescription className="text-base">
            Votre test a été annulé pour suspicion de triche
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Raison de l'annulation :</h4>
            <p className="text-sm text-muted-foreground">
              Vous avez quitté l'interface du test à plusieurs reprises, ce qui constitue une violation 
              des règles du test. Pour maintenir l'intégrité de l'évaluation, votre session a été automatiquement annulée.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-blue-800">Que faire maintenant ?</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <p>1. Contactez votre responsable pour expliquer la situation</p>
              <p>2. Demandez une nouvelle session de test si nécessaire</p>
              <p>3. Assurez-vous de disposer d'un environnement calme pour le prochain test</p>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Pour toute question, contactez votre responsable à l'adresse :
            </p>
            <a 
              href="mailto:contact@cecca.fr"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <Mail className="h-4 w-4" />
              contact@cecca.fr
            </a>
            
            <div className="pt-4 space-x-4">
              <Button 
                onClick={() => {
                  // Clear the test session to allow new tests
                  localStorage.removeItem('currentTestSession');
                  // Reload the page to reset all state
                  window.location.href = '/test';
                }}
                className="bg-primary hover:bg-primary/90"
              >
                Recommencer un test
              </Button>
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}