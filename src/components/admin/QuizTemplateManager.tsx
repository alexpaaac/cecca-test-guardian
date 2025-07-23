import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Plus, Trash2, Edit, Copy, Users, Target, Clock } from 'lucide-react';
import type { QuizTemplate, Question } from '@/types';

export function QuizTemplateManager() {
  const [templates, setTemplates] = useLocalStorage<QuizTemplate[]>('quizTemplates', []);
  const [allQuestions] = useLocalStorage<Question[]>('questions', []);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuizTemplate | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    role: 'Chef de mission' as 'Chef de mission' | 'RH' | 'Auditeur',
    level: 'C1' as 'C1' | 'C2' | 'C3',
    timePerQuestion: 60,
  });
  const { toast } = useToast();

  const handleCreateTemplate = () => {
    if (!templateForm.name || !templateForm.description || selectedQuestions.length === 0) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs et sélectionner au moins une question.",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: QuizTemplate = {
      id: Date.now().toString(),
      name: templateForm.name,
      description: templateForm.description,
      role: templateForm.role,
      level: templateForm.level,
      questions: selectedQuestions,
      timePerQuestion: templateForm.timePerQuestion,
      createdAt: new Date(),
    };

    setTemplates([...templates, newTemplate]);
    resetForm();
    setIsCreating(false);

    toast({
      title: "Modèle créé",
      description: `Le modèle "${newTemplate.name}" a été créé avec succès.`,
    });
  };

  const handleEditTemplate = (template: QuizTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description,
      role: template.role,
      level: template.level,
      timePerQuestion: template.timePerQuestion,
    });
    setSelectedQuestions(template.questions);
    setIsCreating(true);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;

    const updatedTemplate = {
      ...editingTemplate,
      name: templateForm.name,
      description: templateForm.description,
      role: templateForm.role,
      level: templateForm.level,
      questions: selectedQuestions,
      timePerQuestion: templateForm.timePerQuestion,
    };

    setTemplates(templates.map(t => t.id === editingTemplate.id ? updatedTemplate : t));
    resetForm();
    setIsCreating(false);
    setEditingTemplate(null);

    toast({
      title: "Modèle mis à jour",
      description: `Le modèle "${updatedTemplate.name}" a été mis à jour.`,
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    toast({
      title: "Modèle supprimé",
      description: "Le modèle a été supprimé avec succès.",
    });
  };

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const resetForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      role: 'Chef de mission',
      level: 'C1',
      timePerQuestion: 60,
    });
    setSelectedQuestions([]);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Chef de mission': return <Target className="h-4 w-4" />;
      case 'RH': return <Users className="h-4 w-4" />;
      case 'Auditeur': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Chef de mission': return 'bg-primary/10 text-primary border-primary/20';
      case 'RH': return 'bg-accent/10 text-accent-foreground border-accent/20';
      case 'Auditeur': return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Modèles de Questionnaires</h2>
          <p className="text-muted-foreground mt-2">
            Créez des modèles prédéfinis pour différents rôles et niveaux
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-primary hover:bg-primary/90 rounded-2xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Modèle
        </Button>
      </div>

      {isCreating && (
        <Card className="rounded-2xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {editingTemplate ? 'Modifier le Modèle' : 'Nouveau Modèle'}
            </CardTitle>
            <CardDescription>
              Configurez un modèle de questionnaire pour un rôle spécifique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="templateName">Nom du modèle</Label>
                <Input
                  id="templateName"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="ex: Test Chef de Mission Junior"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timePerQuestion">Temps par question (secondes)</Label>
                <Input
                  id="timePerQuestion"
                  type="number"
                  min="30"
                  max="300"
                  value={templateForm.timePerQuestion}
                  onChange={(e) => setTemplateForm({ ...templateForm, timePerQuestion: parseInt(e.target.value) })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rôle cible</Label>
                <Select 
                  value={templateForm.role} 
                  onValueChange={(value) => setTemplateForm({ ...templateForm, role: value as any })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chef de mission">Chef de mission</SelectItem>
                    <SelectItem value="RH">RH</SelectItem>
                    <SelectItem value="Auditeur">Auditeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Niveau</Label>
                <Select 
                  value={templateForm.level} 
                  onValueChange={(value) => setTemplateForm({ ...templateForm, level: value as any })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C1">C1</SelectItem>
                    <SelectItem value="C2">C2</SelectItem>
                    <SelectItem value="C3">C3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                placeholder="Décrivez ce modèle de questionnaire..."
                className="rounded-xl min-h-[100px]"
              />
            </div>

            <div className="space-y-4">
              <Label>Questions sélectionnées ({selectedQuestions.length})</Label>
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-xl p-4">
                {allQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-start space-x-3 p-3 border rounded-xl hover:bg-muted/30"
                  >
                    <Checkbox
                      id={`question-${question.id}`}
                      checked={selectedQuestions.includes(question.id)}
                      onCheckedChange={() => handleQuestionToggle(question.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`question-${question.id}`} className="cursor-pointer">
                        {question.question}
                      </Label>
                      {question.category && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Catégorie: {question.category}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                className="bg-primary hover:bg-primary/90 rounded-xl"
              >
                {editingTemplate ? 'Mettre à jour' : 'Créer le modèle'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsCreating(false);
                  setEditingTemplate(null);
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
        {templates.map((template) => (
          <Card key={template.id} className="rounded-2xl hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-primary">{template.name}</h3>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${getRoleColor(template.role)}`}>
                      {getRoleIcon(template.role)}
                      {template.role}
                    </div>
                    <div className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                      Niveau {template.level}
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{template.description}</p>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {template.questions.length} questions
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {template.timePerQuestion}s par question
                    </div>
                    <div className="text-xs">
                      Créé le {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                    className="rounded-xl"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="rounded-xl text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && !isCreating && (
          <Card className="rounded-2xl">
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Aucun modèle créé
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par créer votre premier modèle de questionnaire
              </p>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-primary hover:bg-primary/90 rounded-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer un modèle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}