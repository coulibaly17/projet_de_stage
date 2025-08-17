import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Calendar, 
  ArrowLeft,
  BookOpen,
  Award,
  ClipboardCheck,
  Activity
} from 'lucide-react';
import { apiService } from '@/services/api';
import type { User as UserType } from '@/services/auth.service';

export default function StudentProfilePage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!studentId) {
        setError('ID étudiant manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Ici vous devriez appeler votre API pour récupérer les informations de l'étudiant
        // const response = await apiService.get(`/users/${studentId}`);
        // setStudent(response);
        
        // Pour l'instant, simulation avec des données fictives
        const mockStudent: UserType = {
          id: parseInt(studentId),
          email: 'etudiant@example.com',
          username: 'etudiant123',
          firstName: 'Jean',
          lastName: 'Dupont',
          role: 'etudiant',
          isActive: true,
          createdAt: '2024-01-15T10:00:00Z'
        };
        
        setStudent(mockStudent);
      } catch (err) {
        console.error('Erreur lors de la récupération du profil étudiant:', err);
        setError('Impossible de charger le profil de l\'étudiant');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, [studentId]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'enseignant':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'etudiant':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'enseignant':
        return 'Enseignant';
      case 'etudiant':
        return 'Étudiant';
      default:
        return 'Utilisateur';
    }
  };

  const getStudentStats = () => {
    return [
      { label: 'Cours suivis', value: '8', icon: BookOpen },
      { label: 'Quiz complétés', value: '24', icon: ClipboardCheck },
      { label: 'Score moyen', value: '85%', icon: Award },
      { label: 'Heures d\'étude', value: '127h', icon: Activity }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Chargement du profil étudiant...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-red-500">{error || 'Étudiant non trouvé'}</p>
        <Button onClick={() => navigate('/enseignant/etudiants')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  const stats = getStudentStats();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Bouton retour */}
        <Button 
          onClick={() => navigate('/enseignant/etudiants')} 
          variant="outline" 
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste des étudiants
        </Button>

        {/* En-tête du profil */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={student.avatar} alt={`${student.firstName} ${student.lastName}`} />
                <AvatarFallback className="text-2xl">
                  {student.firstName?.[0]}{student.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">
                    {student.firstName} {student.lastName}
                  </h1>
                  <Badge className={getRoleBadgeColor(student.role)}>
                    {getRoleLabel(student.role)}
                  </Badge>
                </div>
                <p className="text-gray-600">{student.email}</p>
                <p className="text-sm text-gray-500">
                  Membre depuis {new Date(student.createdAt ?? Date.now()).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>



        {/* Onglets du profil */}
        <Tabs defaultValue="informations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="informations">Informations</TabsTrigger>
            <TabsTrigger value="activite">Activité</TabsTrigger>
            <TabsTrigger value="resultats">Résultats</TabsTrigger>
          </TabsList>

          {/* Onglet Informations */}
          <TabsContent value="informations">
            <Card>
              <CardHeader>
                <CardTitle>Informations de l'étudiant</CardTitle>
                <CardDescription>
                  Informations personnelles et de contact de l'étudiant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prénom</label>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{student.firstName ?? 'Non renseigné'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom</label>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{student.lastName ?? 'Non renseigné'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{student.email}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom d'utilisateur</label>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{student.username}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Activité */}
          <TabsContent value="activite">
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
                <CardDescription>
                  Activité récente de l'étudiant sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Dernière connexion</p>
                      <p className="text-sm text-gray-600">
                        Il y a 2 heures
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Dernier cours consulté</p>
                      <p className="text-sm text-gray-600">
                        Mathématiques avancées - Il y a 3 heures
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <ClipboardCheck className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Dernier quiz complété</p>
                      <p className="text-sm text-gray-600">
                        Quiz Algèbre - Score: 18/20 - Il y a 1 jour
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Résultats */}
          <TabsContent value="resultats">
            <Card>
              <CardHeader>
                <CardTitle>Notes et évaluations</CardTitle>
                <CardDescription>
                  Notes obtenues dans les évaluations de mes cours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Mes cours */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg">Mes cours</h4>
                    <p className="text-sm text-gray-600">Cours que j'ai créés - Aucune évaluation passée pour le moment</p>
                    
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-medium">Introduction à l'Algorithmique</h5>
                            <p className="text-sm text-gray-600">Cours créé par moi</p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg text-gray-500">Aucune évaluation</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-medium">Programmation Orientée Objet</h5>
                            <p className="text-sm text-gray-600">Cours créé par moi</p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg text-gray-500">Aucune évaluation</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-medium">Bases de Données Relationnelles</h5>
                            <p className="text-sm text-gray-600">Cours créé par moi</p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg text-gray-500">Aucune évaluation</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-medium">Structures de Données Avancées</h5>
                            <p className="text-sm text-gray-600">Cours créé par moi</p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg text-gray-500">Aucune évaluation</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistiques de mes cours */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium mb-3 text-gray-700">Statistiques de mes cours</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-500">0</div>
                        <div className="text-sm text-gray-600">Évaluations passées</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-500">0%</div>
                        <div className="text-sm text-gray-600">Score moyen</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-500">0 min</div>
                        <div className="text-sm text-gray-600">Temps moyen</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-center text-gray-600">
                        <p>Cet étudiant n'a encore passé aucune évaluation dans mes cours.</p>
                        <p className="text-sm mt-1">Les statistiques apparaîtront après les premières évaluations.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
