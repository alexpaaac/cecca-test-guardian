import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, User, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminRoleSelection() {
  const navigate = useNavigate();

  const selectRole = (role: 'administrator' | 'manager') => {
    navigate(`/admin/${role}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/src/assets/logo-cecca.png" alt="CECCA" className="h-8" />
            <div className="border-l border-primary-foreground/20 pl-4">
              <h1 className="text-xl font-semibold">Sélection du Rôle d'Administration</h1>
            </div>
          </div>
          <Button
            onClick={() => navigate('/')}
            variant="secondary"
            size="sm"
            className="rounded-xl"
          >
            <Home className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Button>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Accès Administration
          </h2>
          <p className="text-lg text-muted-foreground">
            Sélectionnez votre rôle pour accéder à l'interface d'administration
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => selectRole('administrator')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
                <Shield className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Administrateur</CardTitle>
              <CardDescription>
                Accès complet à toutes les fonctionnalités de gestion
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Gestion des modèles et questions</p>
                <p>• Création de questionnaires</p>
                <p>• Gestion des candidats</p>
                <p>• Consultation de tous les résultats</p>
                <p>• Surveillance des sessions</p>
              </div>
              <Button 
                onClick={() => selectRole('administrator')} 
                className="w-full bg-primary hover:bg-primary/90 rounded-xl"
                size="lg"
              >
                Accéder en tant qu'Administrateur
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => selectRole('manager')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-secondary/10 rounded-full w-fit">
                <User className="h-12 w-12 text-secondary-foreground" />
              </div>
              <CardTitle className="text-2xl">Manager</CardTitle>
              <CardDescription>
                Accès limité aux résultats de votre équipe
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Consultation des résultats de l'équipe</p>
                <p>• Suivi des performances</p>
                <p>• Analyse des données filtrées</p>
                <p>• Export des rapports</p>
              </div>
              <Button 
                onClick={() => selectRole('manager')} 
                variant="secondary"
                className="w-full rounded-xl"
                size="lg"
              >
                Accéder en tant que Manager
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}