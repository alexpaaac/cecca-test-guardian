import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Filter, Download, TrendingUp, PieChart } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts';
import type { Quiz, TestSession } from '@/types';

interface ResultsDashboardProps {
  isManagerView?: boolean;
}

export function ResultsDashboard({ isManagerView = false }: ResultsDashboardProps) {
  const [quizzes] = useLocalStorage<Quiz[]>('quizzes', []);
  const [testSessions] = useLocalStorage<TestSession[]>('testSessions', []);
  const [filterQuiz, setFilterQuiz] = useState('all');
  const [filterManager, setFilterManager] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('');
  const { toast } = useToast();

  const managers = useMemo(() => {
    const managerSet = new Set(testSessions.map(session => session.candidateInfo.manager).filter(Boolean));
    return Array.from(managerSet);
  }, [testSessions]);

  const departments = useMemo(() => {
    const deptSet = new Set(testSessions.map(session => session.candidateInfo.department).filter(Boolean));
    return Array.from(deptSet);
  }, [testSessions]);

  const filteredResults = useMemo(() => {
    let filtered = testSessions.map(session => {
      const quiz = quizzes.find(q => q.id === session.quizId);
      return { session, quiz };
    }).filter(result => result.quiz);

    if (filterQuiz && filterQuiz !== 'all') {
      filtered = filtered.filter(result => result.quiz?.id === filterQuiz);
    }
    if (filterManager && filterManager !== 'all') {
      filtered = filtered.filter(result => result.session.candidateInfo.manager === filterManager);
    }
    if (filterDepartment && filterDepartment !== 'all') {
      filtered = filtered.filter(result => result.session.candidateInfo.department === filterDepartment);
    }
    if (filterEmployee) {
      filtered = filtered.filter(result => 
        result.session.candidateInfo.firstName.toLowerCase().includes(filterEmployee.toLowerCase()) ||
        result.session.candidateInfo.lastName.toLowerCase().includes(filterEmployee.toLowerCase())
      );
    }

    return filtered;
  }, [testSessions, quizzes, filterQuiz, filterManager, filterDepartment, filterEmployee]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Terminé</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">En cours</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">Non commencé</Badge>;
    }
  };

  const stats = useMemo(() => {
    const total = filteredResults.length;
    const completed = filteredResults.filter(r => r.session.status === 'completed').length;
    const inProgress = filteredResults.filter(r => r.session.status === 'in_progress').length;
    const cancelled = filteredResults.filter(r => r.session.status === 'cancelled').length;
    const avgScore = filteredResults
      .filter(r => r.session.status === 'completed' && r.session.score !== undefined)
      .reduce((acc, r) => acc + (r.session.score || 0), 0) / completed || 0;

    return { total, completed, inProgress, cancelled, avgScore };
  }, [filteredResults]);

  // Chart data
  const chartData = useMemo(() => {
    // Scores by department
    const scoresByDept = departments.map(dept => {
      const deptSessions = filteredResults.filter(r => 
        r.session.candidateInfo.department === dept && 
        r.session.status === 'completed'
      );
      const avgScore = deptSessions.reduce((acc, r) => acc + (r.session.score || 0), 0) / deptSessions.length || 0;
      return {
        department: dept,
        score: Math.round(avgScore * 100) / 100,
        count: deptSessions.length
      };
    });

    // Scores by manager
    const scoresByManager = managers.map(manager => {
      const managerSessions = filteredResults.filter(r => 
        r.session.candidateInfo.manager === manager && 
        r.session.status === 'completed'
      );
      const avgScore = managerSessions.reduce((acc, r) => acc + (r.session.score || 0), 0) / managerSessions.length || 0;
      return {
        manager: manager,
        score: Math.round(avgScore * 100) / 100,
        count: managerSessions.length
      };
    });

    // Status distribution
    const statusData = [
      { name: 'Terminé', value: stats.completed, color: '#22c55e' },
      { name: 'En cours', value: stats.inProgress, color: '#3b82f6' },
      { name: 'Annulé', value: stats.cancelled, color: '#ef4444' }
    ];

    return { scoresByDept, scoresByManager, statusData };
  }, [filteredResults, departments, managers, stats]);

  const exportToCSV = () => {
    const headers = ['Candidat', 'Email', 'Questionnaire', 'Manager', 'Pôle', 'Niveau', 'Statut', 'Score', 'Date Début', 'Date Fin'];
    const csvData = filteredResults.map(({ session, quiz }) => [
      `${session.candidateInfo.firstName} ${session.candidateInfo.lastName}`,
      session.candidateInfo.email,
      quiz?.name || '-',
      session.candidateInfo.manager || '-',
      session.candidateInfo.department || '-',
      session.candidateInfo.level,
      session.status,
      session.score !== undefined ? `${session.score}%` : '-',
      session.startedAt ? new Date(session.startedAt).toLocaleDateString('fr-FR') : '-',
      session.completedAt ? new Date(session.completedAt).toLocaleDateString('fr-FR') : '-'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `resultats-tests-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Export réussi",
      description: `${filteredResults.length} résultats exportés en CSV.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.avgScore.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scores by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Scores par Pôle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.scoresByDept}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Répartition des Statuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={chartData.statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {chartData.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Scores by Manager */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Scores par Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.scoresByManager}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="manager" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#10b981" />
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="filter-quiz">Questionnaire</Label>
              <Select value={filterQuiz} onValueChange={setFilterQuiz}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les questionnaires" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les questionnaires</SelectItem>
                  {quizzes.map(quiz => (
                    <SelectItem key={quiz.id} value={quiz.id}>{quiz.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-manager">Manager</Label>
              <Select value={filterManager} onValueChange={setFilterManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les managers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les managers</SelectItem>
                  {managers.map(manager => (
                    <SelectItem key={manager} value={manager}>{manager}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-department">Pôle</Label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les pôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pôles</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
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

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Résultats des Tests ({filteredResults.length})
            </CardTitle>
            <Button onClick={exportToCSV} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exporter CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun résultat trouvé
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
                    <th className="text-left p-2">Niveau</th>
                    <th className="text-left p-2">Statut</th>
                    <th className="text-left p-2">Score</th>
                    <th className="text-left p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map(({ session, quiz }) => (
                    <tr key={session.id} className="border-b">
                      <td className="p-2">
                        {session.candidateInfo.firstName} {session.candidateInfo.lastName}
                      </td>
                      <td className="p-2">{quiz?.name || '-'}</td>
                      <td className="p-2">{session.candidateInfo.manager || '-'}</td>
                      <td className="p-2">{session.candidateInfo.department || '-'}</td>
                      <td className="p-2">{session.candidateInfo.level}</td>
                      <td className="p-2">{getStatusBadge(session.status)}</td>
                      <td className="p-2">
                        {session.score !== undefined ? `${session.score}%` : '-'}
                      </td>
                      <td className="p-2">
                        {session.startedAt ? new Date(session.startedAt).toLocaleDateString('fr-FR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}