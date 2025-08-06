import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CSVPreview() {
  const sampleCSV = `question,choix1,choix2,choix3,réponse,catégorie
"Quel est le principe comptable fondamental ?","Image fidèle","Prudence","Continuité d'exploitation",1,"Principes comptables"
"Que représente l'actif du bilan ?","Les dettes","Les biens et créances","Le capital",2,"Bilan"
"Comment calcule-t-on le résultat net ?","Produits - Charges","Actif - Passif","Capital + Réserves",1,"Compte de résultat"`;

  const downloadSample = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exemple_questions.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Format CSV attendu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>Format requis :</strong> Le fichier CSV doit contenir exactement ces colonnes dans cet ordre :
            <code className="block mt-2 p-2 bg-muted rounded text-sm">
              question,choix1,choix2,choix3,réponse,catégorie
            </code>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-semibold">Exemple de contenu :</h4>
          <div className="bg-muted p-3 rounded text-sm font-mono overflow-x-auto">
            <pre>{sampleCSV}</pre>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="text-sm">
            <strong>Colonnes expliquées :</strong>
            <ul className="list-disc list-inside space-y-1 mt-2 text-muted-foreground">
              <li><strong>question :</strong> Le texte de la question (entre guillemets si elle contient des virgules)</li>
              <li><strong>choix1, choix2, choix3 :</strong> Les trois options de réponse</li>
              <li><strong>réponse :</strong> Le numéro de la bonne réponse (1, 2 ou 3)</li>
              <li><strong>catégorie :</strong> La catégorie de la question (optionnel)</li>
            </ul>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Important :</strong>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Encodage UTF-8 requis pour les caractères accentués</li>
              <li>Utilisez des guillemets pour les textes contenant des virgules</li>
              <li>La colonne "réponse" doit contenir 1, 2 ou 3 uniquement</li>
              <li>Maximum 100 questions par import</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Button 
          onClick={downloadSample}
          variant="outline" 
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Télécharger un exemple de fichier CSV
        </Button>
      </CardContent>
    </Card>
  );
}