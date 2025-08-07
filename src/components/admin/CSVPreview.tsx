import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CSVPreview() {
  const sampleCSV = `question,choix1,choix2,choix3,bonne_reponse,catégorie
"Quel est le traitement TVA pour l'achat de fournitures 300€ HT avec TVA 20% payé en espèces ?","TVA récupérable","TVA non récupérable","TVA à proratiser","choix1","TVA"
"Quelle est la bonne période pour comptabiliser une facture fournisseur reçue en septembre mais datant de juillet ?","Septembre","Juillet","Octobre","choix1","Comptabilisation"
"Dans un bilan, où classe-t-on les dotations aux amortissements ?","Actif","Passif","Compte de résultat","choix3","Bilan"`;

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
            <strong>Formats supportés :</strong> Le fichier CSV peut utiliser l'un de ces formats :
            <div className="space-y-2 mt-2">
              <div>
                <strong>Format recommandé :</strong>
                <code className="block mt-1 p-2 bg-muted rounded text-sm">
                  question,choix1,choix2,choix3,bonne_reponse,catégorie
                </code>
              </div>
              <div>
                <strong>Format alternatif :</strong>
                <code className="block mt-1 p-2 bg-muted rounded text-sm">
                  question,choix1,choix2,choix3,réponse,catégorie
                </code>
              </div>
            </div>
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
              <li><strong>bonne_reponse :</strong> Le texte exact du bon choix ("choix1", "choix2" ou "choix3")</li>
              <li><strong>réponse :</strong> Alternative - Le numéro de la bonne réponse (1, 2 ou 3)</li>
              <li><strong>catégorie :</strong> La catégorie de la question (optionnel)</li>
              <li><strong>temps :</strong> Temps par question en secondes (optionnel, défaut: 60s)</li>
            </ul>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Important :</strong>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Encodage UTF-8 requis pour les caractères accentués</li>
              <li>Utilisez des guillemets pour les textes contenant des virgules</li>
              <li>Format recommandé : utilisez "choix1", "choix2" ou "choix3" dans la colonne bonne_reponse</li>
              <li>Format alternatif : utilisez 1, 2 ou 3 dans la colonne réponse</li>
              <li>Détection automatique du format lors de l'import</li>
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