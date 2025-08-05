import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Plus, Trash2, Edit, Mail, Users, Send, Check, AlertCircle } from 'lucide-react';
import type { Candidate, EmailLog } from '@/types';

export function CandidatesManager() {
  const [candidates, setCandidates] = useLocalStorage<Candidate[]>('candidates', []);
  const [emailLogs, setEmailLogs] = useLocalStorage<EmailLog[]>('emailLogs', []);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [candidateForm, setCandidateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    manager: '',
    managerEmail: '',
    department: '',
    level: 'C1' as 'C1' | 'C2' | 'C3' | 'CS1' | 'CS2',
    role: 'Candidat' as 'Candidat' | 'Chef de mission' | 'RH',
  });
  const [sendingEmails, setSendingEmails] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const generateAccessCode = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const handleCreateCandidate = () => {
    if (Object.values(candidateForm).some(value => !value.trim())) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(candidateForm.email) || !emailRegex.test(candidateForm.managerEmail)) {
      toast({
        title: "Email invalide",
        description: "Veuillez saisir des adresses email valides.",
        variant: "destructive",
      });
      return;
    }

    const newCandidate: Candidate = {
      id: Date.now().toString(),
      firstName: candidateForm.firstName,
      lastName: candidateForm.lastName,
      email: candidateForm.email,
      manager: candidateForm.manager,
      managerEmail: candidateForm.managerEmail,
      department: candidateForm.department,
      level: candidateForm.level,
      role: candidateForm.role,
      accessCode: generateAccessCode(),
      createdAt: new Date(),
    };

    setCandidates([...candidates, newCandidate]);
    resetForm();
    setIsCreating(false);

    toast({
      title: "Candidat créé",
      description: `${newCandidate.firstName} ${newCandidate.lastName} a été ajouté avec le code ${newCandidate.accessCode}.`,
    });
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setCandidateForm({
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      manager: candidate.manager,
      managerEmail: candidate.managerEmail,
      department: candidate.department,
      level: candidate.level,
      role: candidate.role,
    });
    setIsCreating(true);
  };

  const handleUpdateCandidate = () => {
    if (!editingCandidate) return;

    const updatedCandidate = {
      ...editingCandidate,
      firstName: candidateForm.firstName,
      lastName: candidateForm.lastName,
      email: candidateForm.email,
      manager: candidateForm.manager,
      managerEmail: candidateForm.managerEmail,
      department: candidateForm.department,
      level: candidateForm.level,
      role: candidateForm.role,
    };

    setCandidates(candidates.map(c => c.id === editingCandidate.id ? updatedCandidate : c));
    resetForm();
    setIsCreating(false);
    setEditingCandidate(null);

    toast({
      title: "Candidat mis à jour",
      description: `Les informations de ${updatedCandidate.firstName} ${updatedCandidate.lastName} ont été mises à jour.`,
    });
  };

  const handleDeleteCandidate = (candidateId: string) => {
    setCandidates(candidates.filter(c => c.id !== candidateId));
    toast({
      title: "Candidat supprimé",
      description: "Le candidat a été supprimé avec succès.",
    });
  };

  const handleSendEmail = async (candidate: Candidate, quizCode?: string) => {
    if (!quizCode) {
      toast({
        title: "Code questionnaire requis",
        description: "Veuillez saisir le code du questionnaire à envoyer.",
        variant: "destructive",
      });
      return;
    }

    setSendingEmails(prev => new Set(prev).add(candidate.id));

    try {
      // Simulation d'envoi d'email (remplacer par vraie API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const emailLog: EmailLog = {
        id: Date.now().toString(),
        candidateId: candidate.id,
        managerEmail: candidate.managerEmail,
        quizCode: quizCode,
        candidateCode: candidate.accessCode,
        sentAt: new Date(),
        status: 'sent',
      };

      setEmailLogs([...emailLogs, emailLog]);

      toast({
        title: "Email envoyé",
        description: `Les codes ont été envoyés à ${candidate.managerEmail}`,
      });
    } catch (error) {
      const emailLog: EmailLog = {
        id: Date.now().toString(),
        candidateId: candidate.id,
        managerEmail: candidate.managerEmail,
        quizCode: quizCode,
        candidateCode: candidate.accessCode,
        sentAt: new Date(),
        status: 'failed',
      };

      setEmailLogs([...emailLogs, emailLog]);

      toast({
        title: "Erreur d'envoi",
        description: "L'email n'a pas pu être envoyé.",
        variant: "destructive",
      });
    } finally {
      setSendingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(candidate.id);
        return newSet;
      });
    }
  };

  const resetForm = () => {
    setCandidateForm({
      firstName: '',
      lastName: '',
      email: '',
      manager: '',
      managerEmail: '',
      department: '',
      level: 'C1',
      role: 'Candidat',
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Chef de mission': return 'bg-primary/10 text-primary border-primary/20';
      case 'RH': return 'bg-accent/10 text-accent-foreground border-accent/20';
      default: return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
    }
  };

  const getEmailStatus = (candidateId: string) => {
    const lastEmail = emailLogs
      .filter(log => log.candidateId === candidateId)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0];
    
    return lastEmail;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Gestion des Candidats</h2>
          <p className="text-muted-foreground mt-2">
            Gérez les candidats et envoyez les codes d'accès aux tests
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-primary hover:bg-primary/90 rounded-2xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Candidat
        </Button>
      </div>

      {isCreating && (
        <Card className="rounded-2xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {editingCandidate ? 'Modifier le Candidat' : 'Nouveau Candidat'}
            </CardTitle>
            <CardDescription>
              Saisissez les informations du candidat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={candidateForm.firstName}
                  onChange={(e) => setCandidateForm({ ...candidateForm, firstName: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={candidateForm.lastName}
                  onChange={(e) => setCandidateForm({ ...candidateForm, lastName: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email du candidat</Label>
                <Input
                  id="email"
                  type="email"
                  value={candidateForm.email}
                  onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager">Nom du manager</Label>
                <Input
                  id="manager"
                  value={candidateForm.manager}
                  onChange={(e) => setCandidateForm({ ...candidateForm, manager: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerEmail">Email du manager</Label>
                <Input
                  id="managerEmail"
                  type="email"
                  value={candidateForm.managerEmail}
                  onChange={(e) => setCandidateForm({ ...candidateForm, managerEmail: e.target.value })}
                  className="rounded-xl"
                  placeholder="manager@entreprise.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Département/Pôle</Label>
                <Input
                  id="department"
                  value={candidateForm.department}
                  onChange={(e) => setCandidateForm({ ...candidateForm, department: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Niveau</Label>
                <Select 
                  value={candidateForm.level} 
                  onValueChange={(value) => setCandidateForm({ ...candidateForm, level: value as any })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C1">C1 - Collaborateur niveau 1</SelectItem>
                    <SelectItem value="C2">C2 - Collaborateur niveau 2</SelectItem>
                    <SelectItem value="C3">C3 - Collaborateur niveau 3</SelectItem>
                    <SelectItem value="CS1">CS1 - Chef de service niveau 1</SelectItem>
                    <SelectItem value="CS2">CS2 - Chef de service niveau 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select 
                  value={candidateForm.role} 
                  onValueChange={(value) => setCandidateForm({ ...candidateForm, role: value as any })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Candidat">Candidat</SelectItem>
                    <SelectItem value="Chef de mission">Chef de mission</SelectItem>
                    <SelectItem value="RH">RH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={editingCandidate ? handleUpdateCandidate : handleCreateCandidate}
                className="bg-primary hover:bg-primary/90 rounded-xl"
              >
                {editingCandidate ? 'Mettre à jour' : 'Créer le candidat'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsCreating(false);
                  setEditingCandidate(null);
                }}
                className="rounded-xl"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {candidates.map((candidate) => {
          const emailStatus = getEmailStatus(candidate.id);
          return (
            <Card key={candidate.id} className="rounded-2xl hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-primary">
                        {candidate.firstName} {candidate.lastName}
                      </h3>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${getRoleColor(candidate.role)}`}>
                        <Users className="h-3 w-3" />
                        {candidate.role}
                      </div>
                      <div className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                        {candidate.level}
                      </div>
                      <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-mono">
                        {candidate.accessCode}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                      <div>Email: {candidate.email}</div>
                      <div>Manager: {candidate.manager}</div>
                      <div>Email Manager: {candidate.managerEmail}</div>
                      <div>Département: {candidate.department}</div>
                    </div>

                    {emailStatus && (
                      <div className="flex items-center gap-2 text-sm">
                        {emailStatus.status === 'sent' ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="h-4 w-4" />
                            Email envoyé le {new Date(emailStatus.sentAt).toLocaleString()}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            Échec d'envoi le {new Date(emailStatus.sentAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Code quiz"
                        className="w-32 h-8 text-xs rounded-lg"
                        id={`quiz-code-${candidate.id}`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById(`quiz-code-${candidate.id}`) as HTMLInputElement;
                          handleSendEmail(candidate, input.value);
                        }}
                        disabled={sendingEmails.has(candidate.id)}
                        className="rounded-lg h-8"
                      >
                        {sendingEmails.has(candidate.id) ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCandidate(candidate)}
                      className="rounded-xl"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCandidate(candidate.id)}
                      className="rounded-xl text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {candidates.length === 0 && !isCreating && (
          <Card className="rounded-2xl">
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Aucun candidat enregistré
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par ajouter votre premier candidat
              </p>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-primary hover:bg-primary/90 rounded-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un candidat
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}