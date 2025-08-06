import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ClipboardCheck, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/src/assets/logo-cecca.png" alt="CECCA" className="h-8" />
            <div className="border-l border-primary-foreground/20 pl-4">
              <h1 className="text-xl font-semibold">Interface Collaborateur - Tests RH</h1>
            </div>
          </div>
          <Button
            onClick={() => navigate('/admin/role-selection')}
            variant="secondary"
            size="sm"
            className="rounded-xl"
          >
            <Settings className="mr-2 h-4 w-4" />
            Administration
          </Button>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Passez votre test RH CECCA
          </h2>
          <p className="text-lg text-muted-foreground">
            Saisissez vos codes d'accès pour commencer le test
          </p>
        </div>

        <Card className="max-w-2xl mx-auto hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/test')}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
              <ClipboardCheck className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Commencer le Test</CardTitle>
            <CardDescription>
              Utilisez vos codes questionnaire et candidat pour accéder au test
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <Button 
              onClick={() => navigate('/test')} 
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-3 rounded-2xl"
              size="lg"
            >
              Accéder au Test
            </Button>
          </CardContent>
        </Card>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas reçu vos codes d'accès ? Contactez votre manager ou le service RH.
          </p>
        </div>
      </main>
    </div>
  );
}