import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Users, 
  MessageCircle,
  Search,
  Plus,
  Eye,
  UserCheck,
  GraduationCap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { courseService, type Course as CourseType } from '@/services/course.service';
import { userService, type User } from '@/services/user.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { discussionService } from '@/services/discussion.service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

export default function AdminDashboardNew() {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Gérer les messages de succès depuis la navigation
  useEffect(() => {
    if (location.state?.message && location.state?.type === 'success') {
      setSuccessMessage(location.state.message);
      // Nettoyer le state pour éviter que le message persiste
      window.history.replaceState({}, document.title);
      // Masquer le message après 5 secondes
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [location.state]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        console.log('Début du chargement des données...');
        
        // Chargement des cours
        try {
          console.log('=== DÉBUT CHARGEMENT COURS FRONTEND ===');
          
          // Essayer d'abord le service normal
          const coursesResult = await courseService.getAdminCourses();
          console.log('Réponse courseService.getCourses():', coursesResult);
          console.log('Type de la réponse:', typeof coursesResult);
          console.log('Clés de l\'objet:', coursesResult ? Object.keys(coursesResult) : 'null/undefined');
          
          // Vérifier si le service a retourné des cours valides
          if (coursesResult && coursesResult.courses && Array.isArray(coursesResult.courses) && coursesResult.courses.length > 0) {
            console.log('Service fonctionne normalement, cours trouvés:', coursesResult.courses.length);
            setCourses(coursesResult.courses);
          } else {
            console.log('Service retourne des données vides, tentative d\'appel direct API...');
            
            // Appel direct à l'API pour contourner le problème du service
            const directResponse = await fetch('/api/v1/courses/', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (directResponse.ok) {
              const directCourses = await directResponse.json();
              console.log('Appel direct API réussi:', directCourses);
              console.log('Type réponse directe:', typeof directCourses);
              console.log('Est tableau:', Array.isArray(directCourses));
              
              if (Array.isArray(directCourses)) {
                console.log('Cours récupérés directement:', directCourses.length);
                setCourses(directCourses);
              } else {
                console.warn('Réponse directe API pas un tableau');
                setCourses([]);
              }
            } else {
              console.error('Appel direct API échoué:', directResponse.status);
              setCourses([]);
            }
          }
          
          console.log('=== FIN CHARGEMENT COURS FRONTEND ===');
          
        } catch (courseError) {
          console.error('Erreur chargement cours:', courseError);
          setCourses([]);
        }
        
        // Chargement de tous les utilisateurs d'abord
        try {
          const allUsers = await userService.getUsers();
          console.log('Tous les utilisateurs (avant mapping):', allUsers);
          
          // Mapper manuellement les rôles si le service ne l'a pas fait
          const mappedUsers = allUsers.map(user => {
            let mappedRole = user.role;
            if (user.role === 'enseignant') mappedRole = 'teacher';
            if (user.role === 'etudiant') mappedRole = 'student';
            return { ...user, role: mappedRole };
          });
          
          console.log('Utilisateurs avec rôles mappés:', mappedUsers);
          
          // Filtrer par rôle
          const teachersData = mappedUsers.filter(user => user.role === 'teacher');
          const studentsData = mappedUsers.filter(user => user.role === 'student');
          
          setTeachers(teachersData);
          setStudents(studentsData);
          
          console.log('Utilisateurs filtrés:', {
            total: allUsers.length,
            teachers: teachersData.length,
            students: studentsData.length,
            originalRoles: [...new Set(allUsers.map(u => u.role))],
            mappedRoles: [...new Set(mappedUsers.map(u => u.role))]
          });
        } catch (userError) {
          console.error('Erreur chargement utilisateurs:', userError);
          setTeachers([]);
          setStudents([]);
        }
        
        // Chargement des discussions
        try {
          console.log('Chargement des discussions...');
          const discussionsData = await discussionService.getDiscussions();
          console.log('Discussions chargées:', discussionsData);
          setDiscussions(Array.isArray(discussionsData) ? discussionsData : []);
        } catch (discussionError) {
          console.error('Erreur chargement discussions:', discussionError);
          setDiscussions([]);
        }
        
      } catch (error) {
        console.error('Erreur générale lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrage des cours (s'assurer que courses est un tableau)
  const filteredCourses = (Array.isArray(courses) ? courses : []).filter(course => {
    if (!course || typeof course !== 'object') return false;
    const title = course.title || '';
    const description = course.description || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Filtrage des enseignants (s'assurer que teachers est un tableau)
  const filteredTeachers = (Array.isArray(teachers) ? teachers : []).filter(teacher => {
    if (!teacher || typeof teacher !== 'object') return false;
    const teacherName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
    const email = teacher.email || '';
    const matchesSearch = teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Filtrage des étudiants (s'assurer que students est un tableau)
  const filteredStudents = (Array.isArray(students) ? students : []).filter(student => {
    if (!student || typeof student !== 'object') return false;
    const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
    const email = student.email || '';
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Filtrage des discussions
  const filteredDiscussions = (Array.isArray(discussions) ? discussions : []).filter(discussion => {
    if (!discussion || typeof discussion !== 'object') return false;
    const title = discussion.title || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Statistiques calculées (s'assurer que les données sont des tableaux)
  const stats = {
    totalCourses: Array.isArray(courses) ? courses.length : 0,
    totalTeachers: Array.isArray(teachers) ? teachers.length : 0,
    totalStudents: Array.isArray(students) ? students.length : 0,
    totalDiscussions: Array.isArray(discussions) ? discussions.length : 0
  };

  const handleContactTeacher = (teacherId: string) => {
    // Utiliser la messagerie existante - naviguer vers la page de messagerie admin
    navigate('/admin/messages', { state: { recipientId: teacherId } });
  };

  const handleToggleTeacherStatus = async (teacherId: string, teacherName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'désactiver' : 'activer';
    console.log(`Tentative de ${action} l'enseignant:`, { teacherId, teacherName, currentStatus });
    
    // Demander confirmation avant de modifier le statut
    if (!window.confirm(`Êtes-vous sûr de vouloir ${action} l'enseignant "${teacherName}" ?`)) {
      return;
    }

    try {
      // 1. Mettre à jour l'interface utilisateur immédiatement pour un retour visuel rapide
      setTeachers(prevTeachers => {
        return prevTeachers.map(teacher => {
          if (teacher.id.toString() === teacherId.toString()) {
            return { ...teacher, is_active: !currentStatus };
          }
          return teacher;
        });
      });

      // 2. Appeler l'API pour activer/désactiver l'enseignant
      const result = await userService.toggleUserStatus(teacherId, !currentStatus);
      console.log('Résultat du changement de statut:', result);
      
      if (!result.success) {
        // Si l'API renvoie une erreur, recharger les données pour restaurer l'état
        throw new Error(result.message || `Erreur lors de la ${action}`);
      }
      
      // 3. Afficher un message de succès
      setSuccessMessage(`L'enseignant "${teacherName}" a été ${currentStatus ? 'désactivé' : 'activé'} avec succès.`);
      
      // 4. Recharger les données depuis le serveur pour s'assurer de la cohérence
      try {
        const allUsers = await userService.getUsers();
        console.log('Données rechargées après changement de statut:', allUsers);
        
        // Mettre à jour les listes avec les nouvelles données
        const updatedTeachers = allUsers.filter(user => 
          ['teacher', 'enseignant'].includes(user.role?.toLowerCase() || '')
        );
        
        const updatedStudents = allUsers.filter(user => 
          ['student', 'etudiant'].includes(user.role?.toLowerCase())
        );
        
        setTeachers(updatedTeachers);
        setStudents(updatedStudents);
        
      } catch (reloadError) {
        console.error('Erreur lors du rechargement des données:', reloadError);
        // Même en cas d'erreur, on garde l'interface à jour avec les données locales
      }
      
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'enseignant:', error);
      
      // Afficher un message d'erreur
      let errorMessage = 'Une erreur est survenue lors de la suppression';
      
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setSuccessMessage(`Erreur : ${errorMessage}`);
      
      // Recharger les données pour restaurer l'état
      try {
        const allUsers = await userService.getUsers();
        const updatedTeachers = allUsers.filter(user => 
          ['teacher', 'enseignant'].includes(user.role?.toLowerCase())
        );
        setTeachers(updatedTeachers);
      } catch (reloadError) {
        console.error('Erreur lors du rechargement après erreur:', reloadError);
      }
    }
    
    // Cacher le message après 5 secondes
    setTimeout(() => setSuccessMessage(null), 5000);
  };



  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du tableau de bord...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Tableau de bord administrateur
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez vos cours, enseignants et étudiants
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/inscription?role=enseignant&from=admin')} className="gap-2">
            <Plus className="w-4 h-4" />
            Inviter un enseignant
          </Button>
        </div>
      </div>

      {/* Message de succès */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des cours</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Cours disponibles sur la plateforme
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enseignants</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              Enseignants actifs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Étudiants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Étudiants inscrits
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDiscussions}</div>
            <p className="text-xs text-muted-foreground">
              Discussions actives
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher des cours, enseignants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Cours ({filteredCourses.length})
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Enseignants ({filteredTeachers.length})
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Étudiants ({filteredStudents.length})
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Messages ({filteredDiscussions.length})
          </TabsTrigger>
        </TabsList>

        {/* Onglet Cours */}
        <TabsContent value="courses" className="space-y-4">
          <div className="grid gap-4">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {course.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {course.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>Cours</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Bouton "Voir" supprimé pour éviter la redirection vers la page étudiant */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Onglet Enseignants */}
        <TabsContent value="teachers" className="space-y-4">
          <div className="grid gap-4">
            {filteredTeachers.map((teacher) => {
              const teacherName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || teacher.email.split('@')[0];
              return (
                <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={teacher.avatar_url} alt={teacherName} />
                          <AvatarFallback>
                            {teacherName.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {teacherName}
                            </h3>
                            <Badge variant="default">
                              Enseignant
                            </Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {teacher.email}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div>
                              Rôle: {teacher.role}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleContactTeacher(teacher.id)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                          <Button
                            variant={teacher.is_active ? "secondary" : "outline"}
                            size="sm"
                            className={teacher.is_active ? 'bg-red-100 text-red-700 hover:bg-red-200' : ''}
                            onClick={(e) => {
                              e.stopPropagation();
                              const teacherName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || teacher.email.split('@')[0];
                              handleToggleTeacherStatus(teacher.id, teacherName, teacher.is_active !== false);
                            }}
                          >
                            {teacher.is_active !== false ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                                  <path d="M18 6L6 18"></path>
                                  <path d="M6 6l12 12"></path>
                                </svg>
                                Désactiver
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                Activer
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Onglet Étudiants */}
        <TabsContent value="students" className="space-y-4">
          <div className="grid gap-4">
            {filteredStudents.map((student) => {
              const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.email.split('@')[0];
              return (
                <Card key={student.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={student.avatar_url} alt={studentName} />
                          <AvatarFallback>
                            {studentName.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {studentName}
                            </h3>
                            <Badge variant="secondary">
                              Étudiant
                            </Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {student.email}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div>
                              Rôle: {student.role}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Onglet Messages */}
        <TabsContent value="messages" className="space-y-4">
          <div className="grid gap-4">
            {filteredDiscussions.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Aucune discussion
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm ? 'Aucune discussion ne correspond à votre recherche.' : 'Aucune discussion n\'a été créée pour le moment.'}
                  </p>
                  <Button 
                    onClick={() => navigate('/admin/messagerie')} 
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Accéder à la messagerie
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredDiscussions.map((discussion) => {
                const participantNames = discussion.participants ? 
                  discussion.participants.map((p: any) => `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email).join(', ') :
                  'Participants inconnus';
                
                return (
                  <Card key={discussion.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <MessageCircle className="w-5 h-5 text-blue-500" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {discussion.title || 'Discussion sans titre'}
                            </h3>
                            {discussion.unread_count > 0 && (
                              <Badge variant="destructive">
                                {discussion.unread_count} nouveau{discussion.unread_count > 1 ? 'x' : ''}
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            Participants: {participantNames}
                          </p>
                          {discussion.last_message && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Dernier message: {discussion.last_message.content}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(discussion.last_message.created_at).toLocaleString()}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{discussion.participants?.length || 0} participant{(discussion.participants?.length || 0) > 1 ? 's' : ''}</span>
                            </div>
                            <div>
                              Créée le: {new Date(discussion.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/admin/messagerie/${discussion.id}`)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Voir
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
