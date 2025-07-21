
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Trash2, Plus, Edit, Save, X } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Question } from '@/types';

export function QuestionsManager() {
  const [questions, setQuestions] = useLocalStorage<Question[]>('questions', []);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question: '',
    choices: ['', '', ''],
    correctAnswer: 0,
    category: '',
  });
  const { toast } = useToast();

  const resetForm = () => {
    setQuestionForm({
      question: '',
      choices: ['', '', ''],
      correctAnswer: 0,
      category: '',
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier CSV.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const newQuestions: Question[] = [];

      for (let i = 0; i < lines.length; i++) {
        const columns = lines[i].split(',').map(col => col.trim().replace(/"/g, ''));
        
        if (columns.length < 5) {
          toast({
            title: "Erreur de format",
            description: `Ligne ${i + 1}: Format attendu: question, choix1, choix2, choix3, réponse, [catégorie]`,
            variant: "destructive",
          });
          return;
        }

        const [question, choice1, choice2, choice3, correctAnswer, category] = columns;
        const correctIndex = parseInt(correctAnswer) - 1;

        if (correctIndex < 0 || correctIndex > 2) {
          toast({
            title: "Erreur de réponse",
            description: `Ligne ${i + 1}: La réponse doit être 1, 2 ou 3`,
            variant: "destructive",
          });
          return;
        }

        newQuestions.push({
          id: crypto.randomUUID(),
          question,
          choices: [choice1, choice2, choice3],
          correctAnswer: correctIndex,
          category: category || '',
          createdAt: new Date(),
        });
      }

      setQuestions([...questions, ...newQuestions]);
      toast({
        title: "Import réussi",
        description: `${newQuestions.length} questions importées avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Impossible de lire le fichier CSV.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleCreateQuestion = () => {
    if (!questionForm.question.trim()) {
      toast({
        title: "Erreur",
        description: "La question est requise.",
        variant: "destructive",
      });
      return;
    }

    if (questionForm.choices.some(choice => !choice.trim())) {
      toast({
        title: "Erreur",
        description: "Tous les choix doivent être remplis.",
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
      createdAt: new Date(),
    };

    setQuestions([...questions, newQuestion]);
    resetForm();
    setIsCreating(false);
    
    toast({
      title: "Question créée",
      description: "La question a été ajoutée avec succès.",
    });
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question: question.question,
      choices: [...question.choices],
      correctAnswer: question.correctAnswer,
      category: question.category || '',
    });
  };

  const handleUpdateQuestion = () => {
    if (!editingQuestion) return;

    const updatedQuestion: Question = {
      ...editingQuestion,
      question: questionForm.question,
      choices: questionForm.choices,
      correctAnswer: questionForm.correctAnswer,
      category: questionForm.category,
    };

    setQuestions(questions.map(q => q.id === editingQuestion.id ? updatedQuestion : q));
    setEditingQuestion(null);
    resetForm();
    
    toast({
      title: "Question mise à jour",
      description: "La question a été modifiée avec succès.",
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    toast({
      title: "Question supprimée",
      description: "La question a été supprimée avec succès.",
    });
  };

  const clearQuestions = () => {
    setQuestions([]);
    toast({
      title: "Questions supprimées",
      description: "Toutes les questions ont été supprimées.",
    });
  };

  const categories = Array.from(new Set(questions.map(q => q.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import des Questions (CSV)
          </CardTitle>
          <CardDescription>
            Importez vos questions au format CSV : question, choix1, choix2, choix3, réponse (1, 2 ou 3), catégorie (optionnel)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-upload">Fichier CSV</Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </div>
            {questions.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {questions.length} question(s) chargée(s)
                </span>
                <Button variant="destructive" size="sm" onClick={clearQuestions}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Tout supprimer
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Créer une question
            </div>
            {!isCreating && !editingQuestion && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle question
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        {(isCreating || editingQuestion) && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="question-text">Question</Label>
              <Textarea
                id="question-text"
                value={questionForm.question}
                onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                placeholder="Saisissez votre question..."
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
                      className={questionForm.correctAnswer === index ? 'border-green-500' : ''}
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
                <SelectTrigger>
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
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setEditingQuestion(null);
                  resetForm();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}>
                <Save className="h-4 w-4 mr-2" />
                {editingQuestion ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Banque de Questions ({questions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">
                      {index + 1}. {question.question}
                    </h4>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditQuestion(question)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
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
  );
}
