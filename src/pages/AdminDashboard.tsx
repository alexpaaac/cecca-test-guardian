
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuestionsManager } from '@/components/admin/QuestionsManager';
import { QuizManager } from '@/components/admin/QuizManager';
import { EmployeesManager } from '@/components/admin/EmployeesManager';
import { ResultsDashboard } from '@/components/admin/ResultsDashboard';
import { SessionLogs } from '@/components/admin/SessionLogs';

export default function AdminDashboard() {
  return (
    <Layout title="Administration - Tests RH">
      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="quizzes">Questionnaires</TabsTrigger>
          <TabsTrigger value="employees">Collaborateurs</TabsTrigger>
          <TabsTrigger value="results">Résultats</TabsTrigger>
          <TabsTrigger value="logs">Journal</TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions" className="mt-6">
          <QuestionsManager />
        </TabsContent>
        
        <TabsContent value="quizzes" className="mt-6">
          <QuizManager />
        </TabsContent>
        
        <TabsContent value="employees" className="mt-6">
          <EmployeesManager />
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
