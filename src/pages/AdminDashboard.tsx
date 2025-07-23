
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuestionsManager } from '@/components/admin/QuestionsManager';
import { QuizManager } from '@/components/admin/QuizManager';
import { QuizTemplateManager } from '@/components/admin/QuizTemplateManager';
import { CandidatesManager } from '@/components/admin/CandidatesManager';
import { ResultsDashboard } from '@/components/admin/ResultsDashboard';
import { SessionLogs } from '@/components/admin/SessionLogs';

export default function AdminDashboard() {
  return (
    <Layout title="Administration - Tests RH">
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
          <ResultsDashboard />
        </TabsContent>
        
        <TabsContent value="logs" className="mt-6">
          <SessionLogs />
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
