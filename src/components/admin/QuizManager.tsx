
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, Copy, RotateCcw, Target, Shuffle } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Quiz, Question, QuizTemplate } from '@/types';

export function QuizManager() {
  const [quizzes, setQuizzes] = useLocalStorage<Quiz[]>('quizzes', []);
  const [questions] = useLocalStorage<Question[]>('questions', []);
  const [templates] = useLocalStorage<QuizTemplate[]>('quizTemplates', []);
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [quizForm, setQuizForm] = useState({
    name: '',
    description: '',
  });
  const { toast } = useToast();

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateQuiz = () => {
    if (!quizForm.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du questionnaire est requis.",
        variant: "destructive",
      });
      return;
    }

    if (selectedQuestions.length === 0) {
      toast({
        title: "Erreur",
        description: "Vous devez sélectionner au moins une question.",
        variant: "destructive",
      });
      return;
    }

    const newQuiz: Quiz = {
      id: crypto.randomUUID(),
      name: quizForm.name,
      description: quizForm.description,
      questions: selectedQuestions,
      accessCode: generateAccessCode(),
      status: 'active',
      timePerQuestion: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setQuizzes([...quizzes, newQuiz]);
    setQuizForm({ name: '', description: '' });
    setSelectedQuestions([]);
    setIsCreating(false);

    toast({
      title: "Questionnaire créé",
      description: `Le questionnaire "${newQuiz.name}" a été créé avec le code ${newQuiz.accessCode}`,
    });
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      name: quiz.name,
      description: quiz.description,
    });
    setSelectedQuestions(quiz.questions);
  };

  const handleUpdateQuiz = () => {
    if (!editingQuiz) return;

    const updatedQuiz: Quiz = {
      ...editingQuiz,
      name: quizForm.name,
      description: quizForm.description,
      questions: selectedQuestions,
      updatedAt: new Date(),
    };

    setQuizzes(quizzes.map(q => q.id === editingQuiz.id ? updatedQuiz : q));
    setEditingQuiz(null);
    setQuizForm({ name: '', description: '' });
    setSelectedQuestions([]);

    toast({
      title: "Questionnaire mis à jour",
      description: `Le questionnaire "${updatedQuiz.name}" a été modifié.`,
    });
  };

  const handleDeleteQuiz = (quizId: string) => {
    setQuizzes(quizzes.filter(q => q.id !== quizId));
    toast({
      title: "Questionnaire supprimé",
      description: "Le questionnaire a été supprimé avec succès.",
    });
  };

  const handleToggleStatus = (quizId: string) => {
    setQuizzes(quizzes.map(quiz => 
      quiz.id === quizId 
        ? { ...quiz, status: quiz.status === 'active' ? 'inactive' : 'active', updatedAt: new Date() }
        : quiz
    ));
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copié",
      description: "Le code d'accès a été copié dans le presse-papiers.",
    });
  };

  const handleRegenerateCode = (quizId: string) => {
    const newCode = generateAccessCode();
    setQuizzes(quizzes.map(quiz =>
      quiz.id === quizId
        ? { ...quiz, accessCode: newCode, updatedAt: new Date() }
        : quiz
    ));
    
    toast({
      title: "Code régénéré",
      description: `Nouveau code d'accès : ${newCode}`,
    });
  };

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setQuizForm({
          name: template.name,
          description: template.description,
        });
        
        // If template has 40 questions, select 20 random ones
        if (template.questions.length >= 40) {
          const shuffled = [...template.questions].sort(() => 0.5 - Math.random());
          setSelectedQuestions(shuffled.slice(0, 20));
          
          toast({
            title: "Modèle appliqué",
            description: `20 questions aléatoires sélectionnées parmi les ${template.questions.length} du modèle.`,
          });
        } else {
          setSelectedQuestions(template.questions);
        }
      }
    }
  };

  const resetForm = () => {
    setQuizForm({ name: '', description: '' });
    setSelectedQuestions([]);
    setSelectedTemplate('');
    setIsCreating(false);
    setEditingQuiz(null);
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default" className="bg-green-500">Actif</Badge>
    ) : (
      <Badge variant="secondary">Inactif</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Questionnaires</h2>
          <p className="text-muted-foreground">Créez et gérez vos questionnaires avec codes d'accès</p>
        </div>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating || !!editingQuiz}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Questionnaire
        </Button>
      </div>

      {/* Form for creating/editing quiz */}
      {(isCreating || editingQuiz) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingQuiz ? 'Modifier le questionnaire' : 'Créer un nouveau questionnaire'}
            </CardTitle>
            <CardDescription>
              Remplissez les informations du questionnaire et sélectionnez les questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="quiz-name">Nom du questionnaire</Label>
              <Input
                id="quiz-name"
                value={quizForm.name}
                onChange={(e) => setQuizForm({ ...quizForm, name: e.target.value })}
                placeholder="Ex: Test de connaissances RH"
              />
            </div>
            
            <div>
              <Label htmlFor="quiz-description">Description</Label>
              <Textarea
                id="quiz-description"
                value={quizForm.description}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                placeholder="Description du questionnaire..."
              />
            </div>

            {!editingQuiz && (
              <div className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <Label className="text-base font-medium">Utiliser un modèle prédéfini</Label>
                </div>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Sélectionner un modèle..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span>
                            {template.name} - {template.level}
                            {template.level.startsWith('C') ? ' (Collaborateur)' : ' (Chef de service)'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({template.questions.length} questions)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shuffle className="h-4 w-4" />
                    <span>
                      Modèle contenant {templates.find(t => t.id === selectedTemplate)?.questions.length || 0} questions.
                      {(templates.find(t => t.id === selectedTemplate)?.questions.length || 0) >= 40 
                        ? " 20 questions seront sélectionnées aléatoirement."
                        : " Toutes les questions seront incluses."
                      }
                    </span>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>Questions sélectionnées ({selectedQuestions.length}/{questions.length})</Label>
              <div className="mt-2 max-h-64 overflow-y-auto space-y-2">
                {questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune question disponible. Importez d'abord des questions.
                  </p>
                ) : (
                  questions.map((question) => (
                    <div key={question.id} className="flex items-start space-x-2 p-2 border rounded">
                      <Checkbox
                        id={`question-${question.id}`}
                        checked={selectedQuestions.includes(question.id)}
                        onCheckedChange={() => handleQuestionToggle(question.id)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`question-${question.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {question.question}
                        </label>
                        <ul className="text-xs text-muted-foreground mt-1">
                          {question.choices.map((choice, index) => (
                            <li key={index} className={index === question.correctAnswer ? 'text-green-600' : ''}>
                              {index + 1}. {choice} {index === question.correctAnswer && '✓'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button onClick={editingQuiz ? handleUpdateQuiz : handleCreateQuiz}>
                {editingQuiz ? 'Mettre à jour' : 'Créer le questionnaire'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz list */}
      <Card>
        <CardHeader>
          <CardTitle>Questionnaires existants ({quizzes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {quizzes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun questionnaire créé pour le moment.
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{quiz.name}</h3>
                      <p className="text-sm text-muted-foreground">{quiz.description}</p>
                    </div>
                    {getStatusBadge(quiz.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Code d'accès</Label>
                      <div className="flex items-center space-x-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {quiz.accessCode}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(quiz.accessCode)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerateCode(quiz.id)}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Questions</Label>
                      <p className="text-sm">{quiz.questions.length} question(s)</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Créé le</Label>
                      <p className="text-sm">
                        {new Date(quiz.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(quiz.id)}
                    >
                      {quiz.status === 'active' ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditQuiz(quiz)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
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
