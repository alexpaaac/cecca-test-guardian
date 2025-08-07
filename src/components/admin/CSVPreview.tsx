import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CSVPreview() {
  const sampleCSV = `question,choix1,choix2,choix3,bonne_reponse,catégorie
"Quel est le traitement TVA pour l'achat de fournitures 300€ HT avec TVA 20% payé en espèces ?","TVA récupérable","TVA non récupérable","TVA à proratiser","choix3","TVA"
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
          Format de fichier attendu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>Formats de fichier supportés :</strong>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>CSV</strong> (.csv) - Comma Separated Values</li>
              <li><strong>Excel</strong> (.xlsx, .xls) - Microsoft Excel</li>
              <li><strong>Numbers</strong> (.numbers) - Apple Numbers (via export CSV)</li>
            </ul>
            <div className="mt-3">
              <strong>Structure obligatoire :</strong>
              <code className="block mt-1 p-2 bg-muted rounded text-sm">
                question,choix1,choix2,choix3,bonne_reponse
              </code>
              <p className="text-sm text-muted-foreground mt-1">
                Colonnes optionnelles : catégorie, temps
              </p>
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
              <li><strong>bonne_reponse :</strong> OBLIGATOIRE - Doit être exactement "choix1", "choix2" ou "choix3"</li>
              <li><strong>catégorie :</strong> Catégorie de la question (optionnel)</li>
              <li><strong>temps :</strong> Temps par question en secondes (optionnel, défaut: 60s)</li>
            </ul>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Règles strictes :</strong>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Encodage UTF-8 requis pour les caractères accentués</li>
              <li>Utilisez des guillemets pour les textes contenant des virgules</li>
              <li><strong>Structure obligatoire :</strong> question,choix1,choix2,choix3,bonne_reponse</li>
              <li><strong>bonne_reponse</strong> doit contenir exactement "choix1", "choix2" ou "choix3"</li>
              <li>Formats numériques (1, 2, 3) ne sont plus supportés</li>
              <li>Maximum 100 questions par import</li>
              <li>Taille maximum : 5 MB</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="grid gap-2">
          <Button 
            onClick={downloadSample}
            variant="outline" 
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger un exemple de fichier CSV
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Compatible avec Excel, Numbers et autres tableurs
          </p>
        </div>
      </CardContent>
    </Card>
  );
}