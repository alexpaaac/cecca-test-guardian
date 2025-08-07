import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Plus, Trash2, Edit, Copy, Users, Target, Clock, Upload, FileText, Save, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { QuizTemplate, Question } from '@/types';
import CSVPreview from './CSVPreview';

export function QuizTemplateManager() {
  const [templates, setTemplates] = useLocalStorage<QuizTemplate[]>('quizTemplates', []);
  const [allQuestions, setAllQuestions] = useLocalStorage<Question[]>('questions', []);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuizTemplate | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [questionTimes, setQuestionTimes] = useState<{ [questionId: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    role: 'Chef de mission' as 'Chef de mission' | 'RH' | 'Auditeur',
    level: 'C1' as 'C1' | 'C2' | 'C3' | 'CS1' | 'CS2',
    timePerQuestion: 60,
  });
  const [questionForm, setQuestionForm] = useState({
    question: '',
    choices: ['', '', ''],
    correctAnswer: 0,
    category: '',
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
    
    // Initialiser les temps des questions depuis les questions existantes
    const times: { [questionId: string]: number } = {};
    template.questions.forEach(questionId => {
      const question = allQuestions.find(q => q.id === questionId);
      times[questionId] = question?.timePerQuestion || template.timePerQuestion;
    });
    setQuestionTimes(times);
    
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
    const question = allQuestions.find(q => q.id === questionId);
    if (!question) return;

    setSelectedQuestions(prev => {
      const newSelected = prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId];
      
      // Initialiser le temps pour la nouvelle question sélectionnée
      if (!prev.includes(questionId)) {
        setQuestionTimes(prevTimes => ({
          ...prevTimes,
          [questionId]: question.timePerQuestion || templateForm.timePerQuestion
        }));
      } else {
        // Supprimer le temps pour la question désélectionnée
        setQuestionTimes(prevTimes => {
          const newTimes = { ...prevTimes };
          delete newTimes[questionId];
          return newTimes;
        });
      }
      
      return newSelected;
    });
  };

  const handleQuestionTimeChange = (questionId: string, time: number) => {
    setQuestionTimes(prev => ({
      ...prev,
      [questionId]: time
    }));
  };

  const getTotalEstimatedTime = () => {
    return selectedQuestions.reduce((total, questionId) => {
      return total + (questionTimes[questionId] || templateForm.timePerQuestion);
    }, 0);
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
    setQuestionTimes({});
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

  // Question management functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Taille de fichier trop importante. Maximum autorisé : 5 MB');
      }

      // Check file format
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const supportedFormats = ['csv', 'xlsx', 'xls', 'numbers'];
      
      if (!fileExtension || !supportedFormats.includes(fileExtension)) {
        throw new Error(`Format de fichier non supporté. Formats acceptés : ${supportedFormats.join(', ')}`);
      }

      let worksheet: any;
      
      // Parse different file formats
      if (fileExtension === 'csv') {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('Le fichier doit contenir au moins une ligne d\'en-têtes et une ligne de données');
        }

        // Convert CSV to worksheet format for uniform processing
        const data = lines.map(line => {
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim().replace(/"/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim().replace(/"/g, ''));
          return values;
        });
        
        worksheet = XLSX.utils.aoa_to_sheet(data);
      } else {
        // Handle Excel/Numbers files
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        worksheet = workbook.Sheets[workbook.SheetNames[0]];
      }

      // Convert worksheet to array of arrays
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      
      if (data.length < 2) {
        throw new Error('Le fichier doit contenir au moins une ligne d\'en-têtes et une ligne de données');
      }

      // Strict header validation
      const headers = data[0].map(h => String(h || '').trim().toLowerCase());
      const requiredHeaders = ['question', 'choix1', 'choix2', 'choix3', 'bonne_reponse'];
      const optionalHeaders = ['catégorie', 'categorie', 'category', 'temps', 'time'];
      
      // Check for exact required headers
      const headerMapping: { [key: string]: number } = {};
      requiredHeaders.forEach(required => {
        const index = headers.findIndex(h => h === required || (required === 'bonne_reponse' && (h === 'bonne réponse' || h === 'bonne_réponse')));
        if (index === -1) {
          throw new Error(`Structure incorrecte. Colonne manquante : "${required}". Colonnes requises : ${requiredHeaders.join(', ')}`);
        }
        headerMapping[required] = index;
      });
      
      // Map optional headers
      optionalHeaders.forEach(optional => {
        const index = headers.findIndex(h => h === optional);
        if (index !== -1) {
          if (optional.includes('catég') || optional === 'category') {
            headerMapping['category'] = index;
          } else if (optional === 'temps' || optional === 'time') {
            headerMapping['time'] = index;
          }
        }
      });

      const importedQuestions: Question[] = [];
      
      // Process data rows
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.every(cell => !cell || String(cell).trim() === '')) continue;

        const questionText = String(row[headerMapping.question] || '').trim();
        const choice1 = String(row[headerMapping.choix1] || '').trim();
        const choice2 = String(row[headerMapping.choix2] || '').trim();
        const choice3 = String(row[headerMapping.choix3] || '').trim();
        const correctAnswerValue = String(row[headerMapping.bonne_reponse] || '').trim();

        // Validate required fields
        if (!questionText || !choice1 || !choice2 || !choice3 || !correctAnswerValue) {
          throw new Error(`Ligne ${i + 1}: Tous les champs obligatoires doivent être remplis (question, choix1, choix2, choix3, bonne_reponse)`);
        }

        // Strict validation for bonne_reponse
        let correctAnswer: number;
        if (correctAnswerValue === 'choix1') correctAnswer = 0;
        else if (correctAnswerValue === 'choix2') correctAnswer = 1;
        else if (correctAnswerValue === 'choix3') correctAnswer = 2;
        else {
          throw new Error(`Ligne ${i + 1}: "bonne_reponse" doit être exactement "choix1", "choix2" ou "choix3". Valeur trouvée: "${correctAnswerValue}"`);
        }

        const category = headerMapping.category !== undefined ? String(row[headerMapping.category] || '').trim() || undefined : undefined;
        const timePerQuestion = headerMapping.time !== undefined ? 
          parseInt(String(row[headerMapping.time] || '60')) || 60 : 60;

        const question: Question = {
          id: crypto.randomUUID(),
          question: questionText,
          choices: [choice1, choice2, choice3],
          correctAnswer,
          category,
          timePerQuestion,
          createdAt: new Date(),
        };

        importedQuestions.push(question);
      }

      if (importedQuestions.length === 0) {
        throw new Error('Aucune question valide trouvée dans le fichier');
      }

      if (importedQuestions.length > 100) {
        throw new Error(`Maximum 100 questions par import. Votre fichier contient ${importedQuestions.length} questions.`);
      }

      setAllQuestions([...allQuestions, ...importedQuestions]);
      toast({
        title: "✅ Import réussi !",
        description: `${importedQuestions.length} question(s) importée(s) avec succès`,
      });
      
      // Reset file input
      event.target.value = '';
      
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast({
        title: "Erreur d'import",
        description: error instanceof Error ? error.message : 'Erreur lors de l\'import du fichier',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateQuestion = () => {
    if (!questionForm.question.trim() || questionForm.choices.some(choice => !choice.trim())) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont requis.",
        variant: "destructive",
      });
      return;
    }

    const newQuestion: Question = {
      id: crypto.randomUUID(),
      question: questionForm.question,
      choices: questionForm.choices,
      correctAnswer: questionForm.correctAnswer,
      category: questionForm.category,
      timePerQuestion: questionForm.timePerQuestion,
      createdAt: new Date(),
    };

    setAllQuestions([...allQuestions, newQuestion]);
    resetQuestionForm();
    setIsCreatingQuestion(false);
    
    toast({
      title: "Question créée",
      description: "La question a été ajoutée avec succès.",
    });
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question: '',
      choices: ['', '', ''],
      correctAnswer: 0,
      category: '',
      timePerQuestion: 60,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Gestion des Modèles</h2>
          <p className="text-muted-foreground mt-2">
            Gérez vos questions et créez des modèles prédéfinis pour différents rôles et niveaux.
          </p>
        </div>
      </div>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="models">Modèles de Questionnaires</TabsTrigger>
          <TabsTrigger value="questions">Banque de Questions ({allQuestions.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="models" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Modèles de Questionnaires</h3>
                <p className="text-muted-foreground">
                  Créez des modèles prédéfinis pour différents rôles et niveaux. Chaque modèle peut contenir jusqu'à 40 questions.
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
                      <Label htmlFor="timePerQuestion">Temps par défaut (secondes)</Label>
                      <Input
                        id="timePerQuestion"
                        type="number"
                        min="30"
                        max="300"
                        value={templateForm.timePerQuestion}
                        onChange={(e) => setTemplateForm({ ...templateForm, timePerQuestion: parseInt(e.target.value) })}
                        className="rounded-xl"
                      />
                      <div className="text-xs text-muted-foreground">
                        ⏱️ Temps total estimé: <strong>{Math.round(getTotalEstimatedTime() / 60)} minutes</strong>
                      </div>
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
                          <SelectItem value="C1">C1 - Collaborateur niveau 1</SelectItem>
                          <SelectItem value="C2">C2 - Collaborateur niveau 2</SelectItem>
                          <SelectItem value="C3">C3 - Collaborateur niveau 3</SelectItem>
                          <SelectItem value="CS1">CS1 - Chef de service niveau 1</SelectItem>
                          <SelectItem value="CS2">CS2 - Chef de service niveau 2</SelectItem>
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
                    <div className="flex items-center justify-between">
                      <Label>Questions sélectionnées ({selectedQuestions.length}/40 max)</Label>
                      <span className="text-xs text-muted-foreground">
                        {selectedQuestions.length >= 40 ? '✅ Modèle complet - sélection aléatoire possible' : `${40 - selectedQuestions.length} questions restantes`}
                      </span>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 border rounded-xl p-4">
                      {allQuestions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Aucune question disponible.</p>
                          <p className="text-xs">Importez ou créez des questions dans l'onglet "Banque de Questions".</p>
                        </div>
                      ) : (
                        allQuestions.map((question) => (
                          <div
                            key={question.id}
                            className="flex items-start space-x-3 p-3 border rounded-xl hover:bg-muted/30"
                          >
                            <Checkbox
                              id={`question-${question.id}`}
                              checked={selectedQuestions.includes(question.id)}
                              onCheckedChange={() => handleQuestionToggle(question.id)}
                              disabled={!selectedQuestions.includes(question.id) && selectedQuestions.length >= 40}
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
                              {selectedQuestions.includes(question.id) && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Label className="text-xs">Temps (sec):</Label>
                                  <Input
                                    type="number"
                                    min="30"
                                    max="300"
                                    value={questionTimes[question.id] || question.timePerQuestion || templateForm.timePerQuestion}
                                    onChange={(e) => handleQuestionTimeChange(question.id, parseInt(e.target.value) || 60)}
                                    className="w-20 h-8 text-xs rounded"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
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
        </TabsContent>

        <TabsContent value="questions" className="mt-6">
          <div className="space-y-6">
            {/* CSV Preview */}
            <CSVPreview />

            {/* CSV Import */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import des Questions
                </CardTitle>
                <CardDescription>
                  Importez vos questions depuis un fichier CSV, Excel ou Numbers avec la structure obligatoire : question,choix1,choix2,choix3,bonne_reponse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csv-upload">Fichier de questions</Label>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls,.numbers"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Formats supportés : CSV, Excel (.xlsx, .xls), Numbers - Structure obligatoire avec "bonne_reponse" = "choix1", "choix2" ou "choix3"
                    </p>
                  </div>
                  {allQuestions.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {allQuestions.length} question(s) dans la banque
                      </span>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => {
                          setAllQuestions([]);
                          toast({ title: "Banque vidée", description: "Toutes les questions ont été supprimées." });
                        }}
                        className="rounded-xl"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Vider la banque
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Create Question */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Créer une question
                  </div>
                  {!isCreatingQuestion && (
                    <Button onClick={() => setIsCreatingQuestion(true)} className="rounded-xl">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle question
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              {isCreatingQuestion && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="question-text">Question</Label>
                    <Textarea
                      id="question-text"
                      value={questionForm.question}
                      onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                      placeholder="Saisissez votre question..."
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <Label>Choix de réponses</Label>
                    <div className="space-y-2">
                      {questionForm.choices.map((choice, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-sm font-medium w-4">{index + 1}.</span>
                          <Input
                            value={choice}
                            onChange={(e) => {
                              const newChoices = [...questionForm.choices];
                              newChoices[index] = e.target.value;
                              setQuestionForm({ ...questionForm, choices: newChoices });
                            }}
                            placeholder={`Choix ${index + 1}`}
                            className={`rounded-xl ${questionForm.correctAnswer === index ? 'border-green-500' : ''}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="correct-answer">Bonne réponse</Label>
                    <Select
                      value={questionForm.correctAnswer?.toString() || "0"}
                      onValueChange={(value) => setQuestionForm({ ...questionForm, correctAnswer: parseInt(value) })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Sélectionnez la bonne réponse" />
                      </SelectTrigger>
                      <SelectContent>
                        {questionForm.choices.map((choice, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {index + 1}. {choice || `Choix ${index + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Catégorie (optionnel)</Label>
                    <Input
                      id="category"
                      value={questionForm.category}
                      onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                      placeholder="Ex: RH, Management, etc."
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="questionTime">Temps alloué (secondes)</Label>
                    <Input
                      id="questionTime"
                      type="number"
                      min="30"
                      max="300"
                      value={questionForm.timePerQuestion}
                      onChange={(e) => setQuestionForm({ ...questionForm, timePerQuestion: parseInt(e.target.value) || 60 })}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Temps recommandé : 60-120 secondes par question
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreatingQuestion(false);
                        resetQuestionForm();
                      }}
                      className="rounded-xl"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                    <Button onClick={handleCreateQuestion} className="rounded-xl">
                      <Save className="h-4 w-4 mr-2" />
                      Créer
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Questions List */}
            {allQuestions.length > 0 && (
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Banque de Questions ({allQuestions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {allQuestions.map((question, index) => (
                      <div key={question.id} className="border rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">
                            {index + 1}. {question.question}
                          </h4>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAllQuestions(allQuestions.filter(q => q.id !== question.id));
                                toast({ title: "Question supprimée", description: "La question a été supprimée." });
                              }}
                              className="rounded-xl"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {question.category && (
                          <div className="mb-2">
                            <span className="text-xs bg-muted px-2 py-1 rounded">
                              {question.category}
                            </span>
                          </div>
                        )}
                        
                        <ul className="space-y-1 text-sm">
                          {question.choices.map((choice, choiceIndex) => (
                            <li
                              key={choiceIndex}
                              className={`${
                                choiceIndex === question.correctAnswer
                                  ? 'text-green-600 font-medium'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {choiceIndex + 1}. {choice}
                              {choiceIndex === question.correctAnswer && ' ✓'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}