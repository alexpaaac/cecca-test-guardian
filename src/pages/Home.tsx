import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <Layout title="Plateforme de Test RH">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Bienvenue sur la plateforme de test RH CECCA
          </h2>
          <p className="text-lg text-muted-foreground">
            Choisissez votre interface pour accéder aux fonctionnalités
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Interface Administration</CardTitle>
              <CardDescription>
                Gérez les questions, collaborateurs et consultez les résultats
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/admin')} className="bg-primary hover:bg-primary/90">
                Accéder à l'Administration
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/test')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-accent/10 rounded-full w-fit">
                <ClipboardCheck className="h-8 w-8 text-accent-foreground" />
              </div>
              <CardTitle className="text-xl">Interface Collaborateur</CardTitle>
              <CardDescription>
                Passez votre test avec votre code d'accès unique
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/test')} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Passer le Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}