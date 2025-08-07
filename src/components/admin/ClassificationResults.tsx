import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Target, Download, Filter, Clock, Users } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { TestSession, Quiz } from '@/types';

const CLASSIFICATION_TERMS = [
  { id: '1', term: 'Capital', correctCategory: 'bilan-passif' },
  { id: '2', term: 'Créances clients', correctCategory: 'bilan-actif' },
  { id: '3', term: 'Découvert bancaire', correctCategory: 'bilan-passif' },
  { id: '4', term: 'Matériel informatique', correctCategory: 'bilan-actif' },
  { id: '5', term: 'Chiffre d\'affaires', correctCategory: 'resultat-produits' },
  { id: '6', term: 'Salaires', correctCategory: 'resultat-charges' },
  { id: '7', term: 'Fournisseurs', correctCategory: 'bilan-passif' },
  { id: '8', term: 'Stock de marchandises', correctCategory: 'bilan-actif' },
  { id: '9', term: 'Charges sociales', correctCategory: 'resultat-charges' },
  { id: '10', term: 'Produits financiers', correctCategory: 'resultat-produits' },
  { id: '11', term: 'Emprunts bancaires', correctCategory: 'bilan-passif' },
  { id: '12', term: 'Banque', correctCategory: 'bilan-actif' }
];

const CATEGORIES = {
  'bilan-actif': 'Actif',
  'bilan-passif': 'Passif',
  'resultat-produits': 'Produits',
  'resultat-charges': 'Charges'
};

export function ClassificationResults() {
  const [quizzes] = useLocalStorage<Quiz[]>('quizzes', []);
  const [testSessions] = useLocalStorage<TestSession[]>('testSessions', []);
  const [filterQuiz, setFilterQuiz] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('');
  const { toast } = useToast();

  // Filter sessions that completed classification game
  const classificationSessions = useMemo(() => {
    return testSessions
      .filter(session => 
        session.status === 'completed' && 
        session.classificationScore !== undefined &&
        session.candidateInfo
      )
      .map(session => {
        const quiz = quizzes.find(q => q.id === session.quizId);
        return { session, quiz };
      })
      .filter(result => result.quiz);
  }, [testSessions, quizzes]);

  const filteredResults = useMemo(() => {
    let filtered = classificationSessions;

    if (filterQuiz && filterQuiz !== 'all') {
      filtered = filtered.filter(result => result.quiz?.id === filterQuiz);
    }
    if (filterEmployee) {
      filtered = filtered.filter(result => 
        result.session.candidateInfo &&
        (result.session.candidateInfo.firstName.toLowerCase().includes(filterEmployee.toLowerCase()) ||
         result.session.candidateInfo.lastName.toLowerCase().includes(filterEmployee.toLowerCase()))
      );
    }

    return filtered;
  }, [classificationSessions, filterQuiz, filterEmployee]);

  const stats = useMemo(() => {
    const total = filteredResults.length;
    const avgClassificationScore = filteredResults.reduce((acc, r) => acc + (r.session.classificationScore || 0), 0) / total || 0;
    const avgQuizScore = filteredResults.reduce((acc, r) => acc + (r.session.score || 0), 0) / total || 0;
    const above70 = filteredResults.filter(r => (r.session.classificationScore || 0) >= 70).length;
    const above80 = filteredResults.filter(r => (r.session.classificationScore || 0) >= 80).length;

    return { total, avgClassificationScore, avgQuizScore, above70, above80 };
  }, [filteredResults]);

  // Chart data for classification vs quiz scores
  const scoreComparisonData = useMemo(() => {
    return filteredResults.map(result => ({
      candidat: `${result.session.candidateInfo?.firstName} ${result.session.candidateInfo?.lastName}`,
      quiz_score: result.session.score || 0,
      classification_score: result.session.classificationScore || 0,
      department: result.session.candidateInfo?.department || 'N/A'
    }));
  }, [filteredResults]);

  // Performance distribution
  const performanceData = useMemo(() => {
    const ranges = [
      { name: '90-100%', min: 90, max: 100, color: '#22c55e' },
      { name: '80-89%', min: 80, max: 89, color: '#3b82f6' },
      { name: '70-79%', min: 70, max: 79, color: '#f59e0b' },
      { name: '60-69%', min: 60, max: 69, color: '#ef4444' },
      { name: '<60%', min: 0, max: 59, color: '#991b1b' }
    ];

    return ranges.map(range => {
      const count = filteredResults.filter(r => {
        const score = r.session.classificationScore || 0;
        return score >= range.min && score <= range.max;
      }).length;

      return {
        name: range.name,
        value: count,
        color: range.color
      };
    }).filter(range => range.value > 0);
  }, [filteredResults]);

  const exportClassificationCSV = () => {
    const headers = [
      'Candidat', 'Email', 'Questionnaire', 'Manager', 'Pôle', 
      'Score Quiz (%)', 'Score Classification (%)', 'Date Completion'
    ];
    
    const csvData = filteredResults.map(({ session, quiz }) => [
      `${session.candidateInfo?.firstName || ''} ${session.candidateInfo?.lastName || ''}`,
      session.candidateInfo?.email || '',
      quiz?.name || '-',
      session.candidateInfo?.manager || '-',
      session.candidateInfo?.department || '-',
      session.score !== undefined ? session.score.toString() : '-',
      session.classificationScore !== undefined ? session.classificationScore.toString() : '-',
      session.completedAt ? new Date(session.completedAt).toLocaleDateString('fr-FR') : '-'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `resultats-classification-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Export réussi",
      description: `${filteredResults.length} résultats de classification exportés.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Score Moyen Classification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.avgClassificationScore.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Score Moyen Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.avgQuizScore.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Réussite ≥70%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.total > 0 ? Math.round((stats.above70 / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">{stats.above70}/{stats.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Distribution des Performances
            </CardTitle>
            <CardDescription>Répartition des scores de classification</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Comparaison Quiz vs Classification
            </CardTitle>
            <CardDescription>Scores individuels par participant</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="candidat" 
                  angle={-45}
                  textAnchor="end" 
                  height={80}
                  fontSize={10}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="quiz_score" fill="#3b82f6" name="Score Quiz" />
                <Bar dataKey="classification_score" fill="#10b981" name="Score Classification" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="filter-quiz">Questionnaire</Label>
              <Select value={filterQuiz} onValueChange={setFilterQuiz}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les questionnaires" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les questionnaires</SelectItem>
                  {quizzes.filter(quiz => quiz.hasClassificationGame).map(quiz => (
                    <SelectItem key={quiz.id} value={quiz.id}>{quiz.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-employee">Collaborateur</Label>
              <Input
                id="filter-employee"
                placeholder="Rechercher un collaborateur..."
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Résultats Détaillés Classification ({filteredResults.length})
            </CardTitle>
            <Button onClick={exportClassificationCSV} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exporter CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun résultat de classification trouvé</p>
              <p className="text-sm">Les participants doivent compléter le jeu de classification pour apparaître ici.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Collaborateur</th>
                    <th className="text-left p-2">Questionnaire</th>
                    <th className="text-left p-2">Manager</th>
                    <th className="text-left p-2">Pôle</th>
                    <th className="text-left p-2">Score Quiz</th>
                    <th className="text-left p-2">Score Classification</th>
                    <th className="text-left p-2">Performance</th>
                    <th className="text-left p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map(({ session, quiz }) => {
                    const classificationScore = session.classificationScore || 0;
                    const quizScore = session.score || 0;
                    const getPerformanceBadge = (score: number) => {
                      if (score >= 90) return <Badge className="bg-green-500">Excellent</Badge>;
                      if (score >= 80) return <Badge className="bg-blue-500">Bien</Badge>;
                      if (score >= 70) return <Badge className="bg-yellow-500">Moyen</Badge>;
                      return <Badge variant="destructive">Insuffisant</Badge>;
                    };

                    return (
                      <tr key={session.id} className="border-b">
                        <td className="p-2">
                          {session.candidateInfo ? 
                            `${session.candidateInfo.firstName} ${session.candidateInfo.lastName}` : 
                            'N/A'
                          }
                        </td>
                        <td className="p-2">{quiz?.name || '-'}</td>
                        <td className="p-2">{session.candidateInfo?.manager || '-'}</td>
                        <td className="p-2">{session.candidateInfo?.department || '-'}</td>
                        <td className="p-2 font-mono">{quizScore}%</td>
                        <td className="p-2 font-mono font-semibold">{classificationScore}%</td>
                        <td className="p-2">{getPerformanceBadge(classificationScore)}</td>
                        <td className="p-2">
                          {session.completedAt ? new Date(session.completedAt).toLocaleDateString('fr-FR') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}