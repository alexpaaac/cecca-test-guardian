import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Eye } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Candidate, TestSession } from '@/types';

export function SessionLogs() {
  const [candidates] = useLocalStorage<Candidate[]>('candidates', []);
  const [testSessions] = useLocalStorage<TestSession[]>('testSessions', []);

  const suspiciousActivities = useMemo(() => {
    const activities: Array<{
      sessionId: string;
      candidate: Candidate | undefined;
      activity: string;
      timestamp: Date;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    testSessions.forEach(session => {
      const candidate = candidates.find(emp => emp.email === session.candidateInfo?.email);
      
      session.cheatingAttempts.forEach(attempt => {
        activities.push({
          sessionId: session.id,
          candidate,
          activity: attempt.type === 'tab_switch' ? 
            (attempt.warning ? 'Changement d\'onglet (1er avertissement)' : 'Changement d\'onglet (test annulé)') :
            'Perte de focus de la fenêtre',
          timestamp: attempt.timestamp,
          severity: attempt.warning ? 'medium' : 'high',
        });
      });

      // Check for unusually long or short test durations
      if (session.startedAt && session.completedAt) {
        const duration = (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000 / 60;
        if (duration < 5) {
          activities.push({
            sessionId: session.id,
            candidate,
            activity: `Test terminé trop rapidement (${duration.toFixed(1)} min)`,
            timestamp: session.completedAt,
            severity: 'medium',
          });
        } else if (duration > 60) {
          activities.push({
            sessionId: session.id,
            candidate,
            activity: `Test très long (${duration.toFixed(1)} min)`,
            timestamp: session.completedAt,
            severity: 'low',
          });
        }
      }
    });

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [testSessions, candidates]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">Critique</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500">Attention</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Eye className="h-4 w-4 text-blue-500" />;
    }
  };

  const stats = useMemo(() => {
    const total = suspiciousActivities.length;
    const high = suspiciousActivities.filter(a => a.severity === 'high').length;
    const medium = suspiciousActivities.filter(a => a.severity === 'medium').length;
    const cancelledTests = testSessions.filter(s => s.status === 'cancelled').length;

    return { total, high, medium, cancelledTests };
  }, [suspiciousActivities, testSessions]);

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.high}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.medium}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tests Annulés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.cancelledTests}</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Journal d'Activité Suspecte
          </CardTitle>
          <CardDescription>
            Surveillance des comportements suspects pendant les tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suspiciousActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune activité suspecte détectée
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {suspiciousActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-1">
                    {getSeverityIcon(activity.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {activity.candidate?.firstName} {activity.candidate?.lastName}
                      </span>
                      {getSeverityBadge(activity.severity)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {activity.activity}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {new Date(activity.timestamp).toLocaleString('fr-FR')}
                      </span>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        Session: {activity.sessionId.substring(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}