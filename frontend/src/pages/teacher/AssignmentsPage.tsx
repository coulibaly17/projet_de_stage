import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Search, 
  PlusCircle, 
  MoreVertical, 
  Copy, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock,
  Users,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { assignmentService } from '@/services/assignment.service';

interface Assignment {
  id: number;
  title: string;
  courseTitle: string;
  courseId: number;
  dueDate: string;
  status: 'draft' | 'published' | 'closed';
  submissionsCount: number;
  gradedCount: number;
  averageGrade?: number;
  createdAt: string;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        // Récupération des données depuis l'API via le service
        const assignments = await assignmentService.getAssignments();
        
        // Conversion des données de l'API au format attendu par le composant
        const formattedAssignments = assignments.map(assignment => ({
          id: parseInt(assignment.id),
          title: assignment.title,
          courseTitle: assignment.courseName || 'Cours sans nom',
          courseId: parseInt(assignment.courseId),
          dueDate: new Date(assignment.dueDate).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: assignment.status as 'draft' | 'published' | 'closed',
          submissionsCount: assignment.submissionCount || 0,
          gradedCount: assignment.gradedCount || 0,
          averageGrade: assignment.totalPoints,
          createdAt: new Date(assignment.createdAt).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })
        }));
        
        setAssignments(formattedAssignments);
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors de la récupération des devoirs:", error);
        setLoading(false);
        // En cas d'erreur, vous pourriez afficher un message à l'utilisateur
      }
    };

    fetchAssignments();
  }, []);

  const filteredAssignments = assignments.filter(assignment => {
    // Filtre par recherche
    if (searchQuery && !assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !assignment.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filtre par onglet
    if (activeTab === 'draft') return assignment.status === 'draft';
    if (activeTab === 'published') return assignment.status === 'published';
    if (activeTab === 'closed') return assignment.status === 'closed';
    if (activeTab === 'to-grade') return assignment.submissionsCount > assignment.gradedCount;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Brouillon</Badge>;
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Publié</Badge>;
      case 'closed':
        return <Badge className="bg-red-100 text-red-800">Fermé</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Devoirs</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link to="/enseignant/devoirs/nouveau">
              <PlusCircle className="h-4 w-4 mr-2" />
              Créer un devoir
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="draft">Brouillons</TabsTrigger>
          <TabsTrigger value="published">Publiés</TabsTrigger>
          <TabsTrigger value="closed">Fermés</TabsTrigger>
          <TabsTrigger value="to-grade">À évaluer</TabsTrigger>
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
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">Aucun devoir trouvé</h3>
                <p className="mt-1 text-gray-500">
                  {searchQuery 
                    ? "Aucun devoir ne correspond à votre recherche." 
                    : activeTab === 'draft' 
                      ? "Vous n'avez pas de devoirs en brouillon." 
                      : activeTab === 'published'
                        ? "Vous n'avez pas de devoirs publiés."
                        : activeTab === 'closed'
                          ? "Vous n'avez pas de devoirs fermés."
                          : activeTab === 'to-grade'
                            ? "Vous n'avez pas de devoirs à évaluer."
                            : "Vous n'avez pas encore créé de devoirs."}
                </p>
                <Button className="mt-4" asChild>
                  <Link to="/enseignant/devoirs/nouveau">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Créer un devoir
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => (
                  <Card key={assignment.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            {assignment.title}
                            <span className="ml-2">{getStatusBadge(assignment.status)}</span>
                          </CardTitle>
                          <CardDescription>
                            <Link to={`/enseignant/cours/${assignment.courseId}`} className="text-blue-600 hover:underline">
                              {assignment.courseTitle}
                            </Link>
                            <span className="text-gray-400 mx-2">•</span>
                            <span>Créé {assignment.createdAt}</span>
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              <span>Modifier</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              <span>Dupliquer</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              <span>Supprimer</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>Date limite: {assignment.dueDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span>{assignment.submissionsCount} soumissions</span>
                          </div>
                          {assignment.averageGrade !== undefined && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-gray-500" />
                              <span>Moyenne: {assignment.averageGrade}%</span>
                            </div>
                          )}
                        </div>
                        
                        {assignment.status === 'published' && assignment.submissionsCount > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Progression de l'évaluation</span>
                              <span className="font-medium">{assignment.gradedCount}/{assignment.submissionsCount}</span>
                            </div>
                            <Progress 
                              value={(assignment.gradedCount / assignment.submissionsCount) * 100} 
                              className="h-2"
                            />
                            {assignment.submissionsCount > assignment.gradedCount && (
                              <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                                <AlertTriangle className="h-3 w-3" />
                                <span>{assignment.submissionsCount - assignment.gradedCount} soumissions en attente d'évaluation</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button variant="outline" asChild>
                        <Link to={`/enseignant/devoirs/${assignment.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Link>
                      </Button>
                      {assignment.submissionsCount > 0 && (
                        <Button variant={assignment.submissionsCount > assignment.gradedCount ? "primary" : "outline"} asChild>
                          <Link to={`/enseignant/devoirs/${assignment.id}/soumissions`}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Évaluer
                          </Link>
                        </Button>
                      )}
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
