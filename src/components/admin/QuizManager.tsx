
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
import { Plus, Edit, Trash2, Eye, Copy, RotateCcw, Target, Shuffle, FileText } from 'lucide-react';
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
    hasClassificationGame: false,
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
      hasClassificationGame: quizForm.hasClassificationGame,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setQuizzes([...quizzes, newQuiz]);
    setQuizForm({ name: '', description: '', hasClassificationGame: false });
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
      hasClassificationGame: quiz.hasClassificationGame || false,
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
      hasClassificationGame: quizForm.hasClassificationGame,
      updatedAt: new Date(),
    };

    setQuizzes(quizzes.map(q => q.id === editingQuiz.id ? updatedQuiz : q));
    setEditingQuiz(null);
    setQuizForm({ name: '', description: '', hasClassificationGame: false });
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
          hasClassificationGame: false,
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
    setQuizForm({ name: '', description: '', hasClassificationGame: false });
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

            <div className="space-y-3 p-4 bg-accent/5 rounded-xl border border-accent/10">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="classification-game"
                  checked={quizForm.hasClassificationGame}
                  onCheckedChange={(checked) => setQuizForm({ ...quizForm, hasClassificationGame: !!checked })}
                />
                <Label htmlFor="classification-game" className="text-sm font-medium">
                  Inclure le jeu de classification comptable
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Un jeu interactif de drag-and-drop sera proposé à la fin du questionnaire pour classer des termes comptables dans un bilan et un compte de résultat.
              </p>
            </div>

            {!editingQuiz && (
              <div className="space-y-4">
                {/* Primary: Template Selection */}
                <div className="space-y-4 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border-2 border-primary/20">
                  <div className="flex items-center gap-2">
                    <Target className="h-6 w-6 text-primary" />
                    <Label className="text-lg font-semibold text-primary">Méthode recommandée : Utiliser un modèle</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez un modèle prédéfini pour créer rapidement un questionnaire optimisé.
                  </p>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder="🎯 Choisir un modèle de questionnaire..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <p>Aucun modèle disponible</p>
                          <p className="text-xs">Créez d'abord des modèles dans l'onglet "Modèles"</p>
                        </div>
                      ) : (
                        templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-3 py-1">
                              <Target className="h-4 w-4 text-primary" />
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {template.name} - {template.level}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {template.questions.length} questions • 
                                  {template.level.startsWith('C') ? ' Collaborateur' : ' Chef de service'}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedTemplate && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <Shuffle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">
                        Modèle sélectionné avec {templates.find(t => t.id === selectedTemplate)?.questions.length || 0} questions.
                        {(templates.find(t => t.id === selectedTemplate)?.questions.length || 0) >= 40 
                          ? " ✨ 20 questions seront sélectionnées aléatoirement pour optimiser le test."
                          : " Toutes les questions seront incluses dans le questionnaire."
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* Secondary: Manual Selection */}
                {!selectedTemplate && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-muted">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-muted-foreground/50" />
                      <Label className="text-base font-medium text-muted-foreground">Option avancée : Sélection manuelle</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sélectionnez individuellement les questions (non recommandé - utilisez plutôt les modèles).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Questions Selection - Only show if no template selected or editing */}
            {(!selectedTemplate || editingQuiz) && (
              <div>
                <Label>
                  Questions sélectionnées ({selectedQuestions.length}
                  {questions.length > 0 && `/${questions.length}`})
                  {!selectedTemplate && !editingQuiz && (
                    <span className="text-xs text-amber-600 ml-2">
                      ⚠️ Sélection manuelle - Utilisez plutôt un modèle
                    </span>
                  )}
                </Label>
                <div className="mt-2 max-h-64 overflow-y-auto space-y-2">
                  {questions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune question disponible.</p>
                      <p className="text-xs">Créez des questions dans l'onglet "Modèles" → "Banque de Questions".</p>
                    </div>
                  ) : (
                    questions.map((question) => (
                      <div key={question.id} className="flex items-start space-x-2 p-3 border rounded-xl hover:bg-muted/50">
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
                          {question.category && (
                            <span className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">
                              {question.category}
                            </span>
                          )}
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
            )}

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
