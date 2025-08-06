import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, GripVertical } from 'lucide-react';
import { ClassificationTerm, ClassificationGameResult } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ClassificationGameProps {
  onComplete: (result: ClassificationGameResult) => void;
}

const CLASSIFICATION_TERMS: ClassificationTerm[] = [
  { id: '1', term: 'Capital', correctCategory: 'bilan-passif' },
  { id: '2', term: 'Créances clients', correctCategory: 'bilan-actif' },
  { id: '3', term: 'Découvert bancaire', correctCategory: 'bilan-passif' },
  { id: '4', term: 'Matériel informatique', correctCategory: 'bilan-actif' },
  { id: '5', term: 'Chiffre d\'affaires', correctCategory: 'resultat-produits' },
  { id: '6', term: 'Salaires', correctCategory: 'resultat-charges' },
  { id: '7', term: 'Fournisseurs', correctCategory: 'bilan-passif' },
  { id: '8', term: 'Stock de marchandises', correctCategory: 'bilan-actif' },
  { id: '9', term: 'Charges sociales', correctCategory: 'resultat-charges' },
  { id: '10', term: 'Produits financiers', correctCategory: 'resultat-produits' },
  { id: '11', term: 'Emprunts bancaires', correctCategory: 'bilan-passif' },
  { id: '12', term: 'Banque', correctCategory: 'bilan-actif' }
];

const CATEGORIES = {
  'bilan-actif': 'Actif',
  'bilan-passif': 'Passif',
  'resultat-produits': 'Produits',
  'resultat-charges': 'Charges'
};

export default function ClassificationGame({ onComplete }: ClassificationGameProps) {
  const [playerAnswers, setPlayerAnswers] = useState<{ [termId: string]: string }>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const unclassifiedTerms = CLASSIFICATION_TERMS.filter(term => !playerAnswers[term.id]);
  const activeItem = activeId ? CLASSIFICATION_TERMS.find(term => term.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const termId = active.id as string;
      const category = over.id as string;
      
      setPlayerAnswers(prev => ({
        ...prev,
        [termId]: category
      }));
    }
  };

  const getTermsInCategory = (category: string) => {
    return CLASSIFICATION_TERMS.filter(term => playerAnswers[term.id] === category);
  };

  const handleValidate = () => {
    const allTermsClassified = CLASSIFICATION_TERMS.every(term => playerAnswers[term.id]);
    
    if (!allTermsClassified) {
      toast({
        title: "Classification incomplète",
        description: "Veuillez classer tous les termes avant de valider.",
        variant: "destructive"
      });
      return;
    }

    setIsValidated(true);
    setShowResults(true);

    // Calculate score
    const correctAnswers = CLASSIFICATION_TERMS.filter(
      term => playerAnswers[term.id] === term.correctCategory
    ).length;
    const score = Math.round((correctAnswers / CLASSIFICATION_TERMS.length) * 100);

    const result: ClassificationGameResult = {
      terms: CLASSIFICATION_TERMS,
      playerAnswers,
      score,
      completedAt: new Date()
    };

    // Show completion message
    setTimeout(() => {
      onComplete(result);
    }, 3000);

    toast({
      title: "Jeu de classification terminé",
      description: `Score: ${score}% (${correctAnswers}/${CLASSIFICATION_TERMS.length})`,
      variant: score >= 70 ? "default" : "destructive"
    });
  };

  const isTermCorrect = (term: ClassificationTerm) => {
    return playerAnswers[term.id] === term.correctCategory;
  };

  const TermCard = ({ term }: { term: ClassificationTerm }) => (
    <Card className={`p-2 cursor-grab ${showResults ? (isTermCorrect(term) ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}>
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{term.term}</span>
        {showResults && (
          isTermCorrect(term) ? 
            <CheckCircle className="h-4 w-4 text-green-600 ml-auto" /> :
            <XCircle className="h-4 w-4 text-red-600 ml-auto" />
        )}
      </div>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Jeu de Classification Comptable</h2>
        <p className="text-muted-foreground">
          Glissez-déposez chaque terme comptable dans la bonne catégorie
        </p>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Unclassified Terms */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Termes à classer</CardTitle>
              <Badge variant="outline">{unclassifiedTerms.length} restants</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {unclassifiedTerms.map(term => (
                <div
                  key={term.id}
                  draggable
                  onDragStart={() => setActiveId(term.id)}
                >
                  <TermCard term={term} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Classification Tables */}
          <div className="md:col-span-2 space-y-4">
            {/* Bilan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bilan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Actif */}
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 min-h-32"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (activeId) {
                        setPlayerAnswers(prev => ({
                          ...prev,
                          [activeId]: 'bilan-actif'
                        }));
                        setActiveId(null);
                      }
                    }}
                  >
                    <h4 className="font-semibold text-center mb-3">Actif</h4>
                    <div className="space-y-2">
                      {getTermsInCategory('bilan-actif').map(term => (
                        <TermCard key={term.id} term={term} />
                      ))}
                    </div>
                  </div>

                  {/* Passif */}
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 min-h-32"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (activeId) {
                        setPlayerAnswers(prev => ({
                          ...prev,
                          [activeId]: 'bilan-passif'
                        }));
                        setActiveId(null);
                      }
                    }}
                  >
                    <h4 className="font-semibold text-center mb-3">Passif</h4>
                    <div className="space-y-2">
                      {getTermsInCategory('bilan-passif').map(term => (
                        <TermCard key={term.id} term={term} />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compte de Résultat */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compte de Résultat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Produits */}
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 min-h-32"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (activeId) {
                        setPlayerAnswers(prev => ({
                          ...prev,
                          [activeId]: 'resultat-produits'
                        }));
                        setActiveId(null);
                      }
                    }}
                  >
                    <h4 className="font-semibold text-center mb-3">Produits</h4>
                    <div className="space-y-2">
                      {getTermsInCategory('resultat-produits').map(term => (
                        <TermCard key={term.id} term={term} />
                      ))}
                    </div>
                  </div>

                  {/* Charges */}
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 min-h-32"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (activeId) {
                        setPlayerAnswers(prev => ({
                          ...prev,
                          [activeId]: 'resultat-charges'
                        }));
                        setActiveId(null);
                      }
                    }}
                  >
                    <h4 className="font-semibold text-center mb-3">Charges</h4>
                    <div className="space-y-2">
                      {getTermsInCategory('resultat-charges').map(term => (
                        <TermCard key={term.id} term={term} />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DragOverlay>
          {activeItem ? <TermCard term={activeItem} /> : null}
        </DragOverlay>
      </DndContext>

      <div className="text-center">
        <Button 
          onClick={handleValidate}
          disabled={isValidated || unclassifiedTerms.length > 0}
          size="lg"
        >
          {isValidated ? "Classification validée" : "Valider la classification"}
        </Button>
        {showResults && (
          <p className="text-sm text-muted-foreground mt-2">
            Redirection automatique dans quelques secondes...
          </p>
        )}
      </div>
    </div>
  );
}