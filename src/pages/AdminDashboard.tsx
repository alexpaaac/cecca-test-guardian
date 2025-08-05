
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestionsManager } from '@/components/admin/QuestionsManager';
import { QuizManager } from '@/components/admin/QuizManager';
import { QuizTemplateManager } from '@/components/admin/QuizTemplateManager';
import { CandidatesManager } from '@/components/admin/CandidatesManager';
import { ResultsDashboard } from '@/components/admin/ResultsDashboard';
import { SessionLogs } from '@/components/admin/SessionLogs';
import { Shield, User, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type AdminRole = 'Administrator' | 'Manager';

export default function AdminDashboard() {
  const [adminRole, setAdminRole] = useState<AdminRole>('Administrator');
  const navigate = useNavigate();

  const getAvailableTabs = (role: AdminRole) => {
    if (role === 'Administrator') {
      return ['questions', 'templates', 'quizzes', 'candidates', 'results', 'logs'];
    } else {
      return ['results']; // Manager can only view results
    }
  };

  const availableTabs = getAvailableTabs(adminRole);

  return (
    <Layout title="Administration - Tests RH">
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
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Rôle:</span>
              <Select value={adminRole} onValueChange={(value: AdminRole) => setAdminRole(value)}>
                <SelectTrigger className="w-48 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrator">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Administrateur
                    </div>
                  </SelectItem>
                  <SelectItem value="Manager">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Manager
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {adminRole === 'Administrator' 
              ? 'Accès complet à toutes les fonctionnalités'
              : 'Accès limité aux résultats de votre équipe'
            }
          </div>
        </div>

        {adminRole === 'Manager' ? (
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
          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="templates">Modèles</TabsTrigger>
              <TabsTrigger value="quizzes">Questionnaires</TabsTrigger>
              <TabsTrigger value="candidates">Candidats</TabsTrigger>
              <TabsTrigger value="results">Résultats</TabsTrigger>
              <TabsTrigger value="logs">Journal</TabsTrigger>
            </TabsList>
            
            <TabsContent value="questions" className="mt-6">
              <QuestionsManager />
            </TabsContent>
            
            <TabsContent value="templates" className="mt-6">
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
