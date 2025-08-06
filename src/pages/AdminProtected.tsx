import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuizManager } from '@/components/admin/QuizManager';
import { QuizTemplateManager } from '@/components/admin/QuizTemplateManager';
import { CandidatesManager } from '@/components/admin/CandidatesManager';
import { ResultsDashboard } from '@/components/admin/ResultsDashboard';
import { SessionLogs } from '@/components/admin/SessionLogs';
import { Shield, User, Home } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function AdminProtected() {
  const navigate = useNavigate();
  const { role } = useParams<{ role: string }>();
  
  const isAdministrator = role === 'administrator';
  const isManager = role === 'manager';

  if (!isAdministrator && !isManager) {
    navigate('/admin/role-selection');
    return null;
  }

  return (
    <Layout title={`Administration - ${isAdministrator ? 'Administrateur' : 'Manager'}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="rounded-xl"
            >
              <Home className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
            
            <div className="flex items-center gap-2">
              {isAdministrator ? (
                <Shield className="h-5 w-5 text-primary" />
              ) : (
                <User className="h-5 w-5 text-secondary-foreground" />
              )}
              <span className="text-sm font-medium">Rôle:</span>
              <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-xl">
                {isAdministrator ? 'Administrateur' : 'Manager'}
              </span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {isAdministrator 
              ? 'Accès complet à toutes les fonctionnalités'
              : 'Accès limité aux résultats de votre équipe'
            }
          </div>
        </div>

        {isManager ? (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Interface Manager
              </CardTitle>
              <CardDescription>
                Consultez les résultats des tests de votre équipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsDashboard isManagerView={true} />
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="models" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="models">Modèles</TabsTrigger>
              <TabsTrigger value="quizzes">Questionnaires</TabsTrigger>
              <TabsTrigger value="candidates">Candidats</TabsTrigger>
              <TabsTrigger value="results">Résultats</TabsTrigger>
              <TabsTrigger value="logs">Journal</TabsTrigger>
            </TabsList>
            
            <TabsContent value="models" className="mt-6">
              <QuizTemplateManager />
            </TabsContent>
            
            <TabsContent value="quizzes" className="mt-6">
              <QuizManager />
            </TabsContent>
            
            <TabsContent value="candidates" className="mt-6">
              <CandidatesManager />
            </TabsContent>
            
            <TabsContent value="results" className="mt-6">
              <ResultsDashboard isManagerView={false} />
            </TabsContent>
            
            <TabsContent value="logs" className="mt-6">
              <SessionLogs />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}