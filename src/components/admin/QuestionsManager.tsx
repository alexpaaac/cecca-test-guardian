import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Question } from '@/types';

export function QuestionsManager() {
  const [questions, setQuestions] = useLocalStorage<Question[]>('questions', []);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

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
        const columns = lines[i].split(',').map(col => col.trim());
        
        if (columns.length !== 5) {
          toast({
            title: "Erreur de format",
            description: `Ligne ${i + 1}: Format attendu: question, choix1, choix2, choix3, réponse`,
            variant: "destructive",
          });
          return;
        }

        const [question, choice1, choice2, choice3, correctAnswer] = columns;
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
        });
      }

      setQuestions(newQuestions);
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

  const clearQuestions = () => {
    setQuestions([]);
    toast({
      title: "Questions supprimées",
      description: "Toutes les questions ont été supprimées.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import des Questions (CSV)
          </CardTitle>
          <CardDescription>
            Importez vos questions au format CSV : question, choix1, choix2, choix3, réponse (1, 2 ou 3)
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
                  Vider
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Aperçu des Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">
                    {index + 1}. {question.question}
                  </h4>
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