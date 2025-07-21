import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Users, Copy, Trash2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Employee } from '@/types';

export function EmployeesManager() {
  const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', []);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    manager: '',
    department: '',
    level: 'C1' as 'C1' | 'C2' | 'C3',
  });
  const { toast } = useToast();

  const generateAccessCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const existingEmployee = employees.find(emp => emp.email === formData.email);
    if (existingEmployee) {
      toast({
        title: "Erreur",
        description: "Un collaborateur avec cet email existe déjà.",
        variant: "destructive",
      });
      return;
    }

    const newEmployee: Employee = {
      id: crypto.randomUUID(),
      ...formData,
      accessCode: generateAccessCode(),
      createdAt: new Date(),
    };

    setEmployees([...employees, newEmployee]);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      manager: '',
      department: '',
      level: 'C1',
    });

    toast({
      title: "Collaborateur ajouté",
      description: `Code d'accès généré : ${newEmployee.accessCode}`,
    });
  };

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copié",
      description: "Le code d'accès a été copié dans le presse-papiers.",
    });
  };

  const deleteEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
    toast({
      title: "Collaborateur supprimé",
      description: "Le collaborateur a été supprimé avec succès.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Ajouter un Collaborateur
          </CardTitle>
          <CardDescription>
            Créez un nouveau profil collaborateur avec un code d'accès unique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="manager">Manager</Label>
              <Input
                id="manager"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="department">Pôle</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="level">Niveau</Label>
              <Select value={formData.level} onValueChange={(value: 'C1' | 'C2' | 'C3') => setFormData({ ...formData, level: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C1">C1</SelectItem>
                  <SelectItem value="C2">C2</SelectItem>
                  <SelectItem value="C3">C3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                <UserPlus className="h-4 w-4 mr-2" />
                Ajouter le Collaborateur
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {employees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Liste des Collaborateurs ({employees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Nom</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Manager</th>
                    <th className="text-left p-2">Pôle</th>
                    <th className="text-left p-2">Niveau</th>
                    <th className="text-left p-2">Code d'accès</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b">
                      <td className="p-2">{employee.firstName} {employee.lastName}</td>
                      <td className="p-2">{employee.email}</td>
                      <td className="p-2">{employee.manager || '-'}</td>
                      <td className="p-2">{employee.department || '-'}</td>
                      <td className="p-2">{employee.level}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm">{employee.accessCode}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyAccessCode(employee.accessCode)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteEmployee(employee.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}