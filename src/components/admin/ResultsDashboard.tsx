import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Filter } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Employee, TestSession } from '@/types';

export function ResultsDashboard() {
  const [employees] = useLocalStorage<Employee[]>('employees', []);
  const [testSessions] = useLocalStorage<TestSession[]>('testSessions', []);
  const [filterManager, setFilterManager] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');

  const managers = useMemo(() => {
    const managerSet = new Set(employees.map(emp => emp.manager).filter(Boolean));
    return Array.from(managerSet);
  }, [employees]);

  const departments = useMemo(() => {
    const deptSet = new Set(employees.map(emp => emp.department).filter(Boolean));
    return Array.from(deptSet);
  }, [employees]);

  const filteredResults = useMemo(() => {
    let filtered = testSessions.map(session => {
      const employee = employees.find(emp => emp.id === session.employeeId);
      return { session, employee };
    }).filter(result => result.employee);

    if (filterManager) {
      filtered = filtered.filter(result => result.employee?.manager === filterManager);
    }
    if (filterDepartment) {
      filtered = filtered.filter(result => result.employee?.department === filterDepartment);
    }
    if (filterEmployee) {
      filtered = filtered.filter(result => 
        result.employee?.firstName.toLowerCase().includes(filterEmployee.toLowerCase()) ||
        result.employee?.lastName.toLowerCase().includes(filterEmployee.toLowerCase())
      );
    }

    return filtered;
  }, [testSessions, employees, filterManager, filterDepartment, filterEmployee]);

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
    const total = testSessions.length;
    const completed = testSessions.filter(s => s.status === 'completed').length;
    const inProgress = testSessions.filter(s => s.status === 'in_progress').length;
    const cancelled = testSessions.filter(s => s.status === 'cancelled').length;
    const avgScore = testSessions
      .filter(s => s.status === 'completed' && s.score !== undefined)
      .reduce((acc, s) => acc + (s.score || 0), 0) / completed || 0;

    return { total, completed, inProgress, cancelled, avgScore };
  }, [testSessions]);

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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filter-manager">Manager</Label>
              <Select value={filterManager} onValueChange={setFilterManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les managers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les managers</SelectItem>
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
                  <SelectItem value="">Tous les pôles</SelectItem>
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
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Résultats des Tests ({filteredResults.length})
          </CardTitle>
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
                    <th className="text-left p-2">Manager</th>
                    <th className="text-left p-2">Pôle</th>
                    <th className="text-left p-2">Niveau</th>
                    <th className="text-left p-2">Statut</th>
                    <th className="text-left p-2">Score</th>
                    <th className="text-left p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map(({ session, employee }) => (
                    <tr key={session.id} className="border-b">
                      <td className="p-2">
                        {employee?.firstName} {employee?.lastName}
                      </td>
                      <td className="p-2">{employee?.manager || '-'}</td>
                      <td className="p-2">{employee?.department || '-'}</td>
                      <td className="p-2">{employee?.level}</td>
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