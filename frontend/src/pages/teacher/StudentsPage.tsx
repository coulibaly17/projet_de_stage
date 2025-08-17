import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Users,
  UserPlus,
  Mail,
  MoreVertical,
  FileSpreadsheet,
  UserX,
  UserCheck
} from 'lucide-react';
import { apiService } from '@/services/api';
import API_CONFIG from '@/config/api';
import { Link } from 'react-router-dom';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Interface pour représenter un étudiant
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  courseCount: number;
  lastActive?: string;
  progress?: number;
  status: 'active' | 'inactive';
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fonction pour gérer l'activation/désactivation d'un étudiant
  const handleToggleStudentStatus = async (studentId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      // Ici vous pouvez ajouter l'appel API pour changer le statut
      // await apiService.updateStudentStatus(studentId, newStatus);
      
      // Mise à jour locale pour l'instant
      setStudents(prevStudents => 
        prevStudents.map(student => 
          student.id === studentId 
            ? { ...student, status: newStatus }
            : student
        )
      );
      
      console.log(`Étudiant ${studentId} ${newStatus === 'active' ? 'activé' : 'désactivé'}`);
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await apiService.get<Student[]>(API_CONFIG.ENDPOINTS.TEACHER.STUDENTS);
        console.log('Étudiants récupérés:', response);
        
        if (Array.isArray(response)) {
          setStudents(response);
        } else {
          console.error('Format de réponse inattendu:', response);
          setStudents([]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des étudiants:', error);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Filtrer les étudiants en fonction de l'onglet actif et de la recherche
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      searchQuery === '' || 
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'active' && student.status === 'active') ||
      (activeTab === 'inactive' && student.status === 'inactive');
    
    return matchesSearch && matchesTab;
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Étudiants</h1>
          <p className="text-muted-foreground">
            Gérez vos étudiants et suivez leur progression.
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link to="/enseignant/etudiants/ajouter">
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un étudiant
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="active">Actifs</TabsTrigger>
          <TabsTrigger value="inactive">Inactifs</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <TabsContent value={activeTab} className="mt-0">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-10">
                <Users className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">Aucun étudiant trouvé</h3>
                <p className="mt-1 text-gray-500">
                  {searchQuery !== "" 
                    ? "Aucun étudiant ne correspond à votre recherche."
                    : activeTab === 'active'
                      ? "Vous n'avez pas d'étudiants actifs."
                      : activeTab === 'inactive'
                        ? "Vous n'avez pas d'étudiants inactifs."
                        : "Vous n'avez pas encore ajouté d'étudiants."}
                </p>
                <Button className="mt-4" asChild>
                  <Link to="/enseignant/etudiants/ajouter">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ajouter un étudiant
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStudents.map((student, index) => (
                  <Card key={student.id ? student.id : `student-${index}`} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            <Link to={`/enseignant/etudiants/${student.id}`} className="hover:underline">
                              {student.firstName} {student.lastName}
                            </Link>
                          </CardTitle>
                          <CardDescription className="flex flex-col gap-1">
                            <a href={`mailto:${student.email}`} className="hover:underline text-blue-600">
                              {student.email}
                            </a>
                            <span>Inscrit à {student.courseCount} cours</span>
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/enseignant/messagerie?user=${student.id}`}>
                                <Mail className="h-4 w-4 mr-2" />
                                <span>Envoyer un message</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/enseignant/etudiants/${student.id}/profil`}>
                                <Users className="h-4 w-4 mr-2" />
                                <span>Voir profil</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/enseignant/etudiants/${student.id}/resultats`}>
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                <span>Voir les résultats</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleToggleStudentStatus(student.id, student.status)}
                              className={student.status === 'active' ? 'text-red-600' : 'text-green-600'}
                            >
                              {student.status === 'active' ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  <span>Désactiver</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  <span>Activer</span>
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>Statut: {student.status === 'active' ? 'Actif' : 'Inactif'}</span>
                        </div>
                        {student.lastActive && (
                          <div key={`last-active-${student.id}`} className="flex items-center gap-2">
                            <span className="text-gray-500">Dernière activité: {new Date(student.lastActive).toLocaleDateString()}</span>
                          </div>
                        )}
                        {student.progress !== undefined && (
                          <div key={`progress-${student.id}`} className="flex items-center gap-2">
                            <span className="text-gray-500">Progression globale: {student.progress}%</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button variant="outline" asChild>
                        <Link to={`/enseignant/etudiants/${student.id}`}>
                          <Users className="h-4 w-4 mr-2" />
                          Voir le profil
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
