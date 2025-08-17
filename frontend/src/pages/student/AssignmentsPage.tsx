import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock, CheckCircle, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { assignmentService } from '@/services';
// Nous n'importons plus le type ServiceAssignment car nous définissons notre propre interface

// Définition locale du type Assignment pour s'assurer que le status est toujours défini
// Définition du type pour le status des devoirs
type AssignmentStatus = 'pending' | 'submitted' | 'graded' | 'late';

// Type pour les soumissions
interface AssignmentSubmission {
  id: string;
  submittedAt: string;
  content?: string;
  attachments?: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
  }[];
}

// Type pour les notes
interface AssignmentGrade {
  score: number;
  maxScore: number;
  feedback?: string;
  gradedAt: string;
  gradedBy: {
    id: string;
    name: string;
  };
}

interface Assignment {
  // Propriétés obligatoires
  id: string;
  title: string;
  description?: string;
  courseId: string;
  courseName?: string;
  dueDate: string;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  attachments?: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
  }[];
  
  // Propriétés pour les soumissions
  submission?: AssignmentSubmission;
  
  // Propriétés pour les notes
  grade?: AssignmentGrade;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchAssignments = async (status?: string) => {
    try {
      setLoading(true);
      // Utiliser le service d'assignment pour récupérer les devoirs
      const userAssignments = await assignmentService.getStudentAssignments(status);
      // Conversion des assignments du service en assignments locaux avec status garanti
      setAssignments(userAssignments.map(assignment => {
        // Création d'un objet Assignment correctement typé
        const typedAssignment: Assignment = {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          courseId: assignment.courseId,
          courseName: assignment.courseName,
          dueDate: assignment.dueDate,
          status: (assignment.status as AssignmentStatus) || 'pending',
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt,
          attachments: assignment.attachments
        };
        
        // Ajout des propriétés optionnelles seulement si elles existent
        if ('submission' in assignment && assignment.submission) {
          typedAssignment.submission = assignment.submission as AssignmentSubmission;
        }
        
        if ('grade' in assignment && assignment.grade) {
          typedAssignment.grade = assignment.grade as AssignmentGrade;
        }
        
        return typedAssignment;
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des devoirs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const status = activeTab !== 'all' ? activeTab : undefined;
    fetchAssignments(status);
  }, [activeTab]);

  const filteredAssignments = assignments.filter(assignment => {
    if (activeTab === 'pending') return assignment.status === 'pending';
    if (activeTab === 'submitted') return assignment.status === 'submitted';
    if (activeTab === 'graded') return assignment.status === 'graded';
    if (activeTab === 'late') return assignment.status === 'late';
    return true;
  });


  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'À faire';
      case 'submitted':
        return 'Soumis';
      case 'graded':
        return 'Évalué';
      case 'late':
        return 'En retard';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mes devoirs</h1>
      </div>

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="pending">À faire</TabsTrigger>
          <TabsTrigger value="submitted">Soumis</TabsTrigger>
          <TabsTrigger value="graded">Évalués</TabsTrigger>
          <TabsTrigger value="late">En retard</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
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
                <h3 className="mt-2 text-lg font-medium">Aucun devoir {getStatusText(activeTab).toLowerCase()}</h3>
                <p className="mt-1 text-gray-500">
                  {activeTab === 'pending' && "Vous n'avez pas de devoirs à faire pour le moment."}
                  {activeTab === 'submitted' && "Vous n'avez pas encore soumis de devoirs."}
                  {activeTab === 'graded' && "Aucun de vos devoirs n'a encore été évalué."}
                  {activeTab === 'late' && "Vous n'avez pas de devoirs en retard. Continuez comme ça !"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAssignments.map((assignment) => (
                  <Card key={assignment.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <Badge className={getStatusColor(assignment.status)}>
                          {getStatusText(assignment.status)}
                        </Badge>
                      </div>
                      <CardDescription>
                        <Link to={`/etudiant/cours/${assignment.courseId}`} className="text-blue-600 hover:underline">
                          {assignment.courseName || 'Cours non spécifié'}
                        </Link>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Clock className="h-4 w-4" />
                        <span>Date limite: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      
                      {assignment.description && (
                        <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                      )}
                      
                      {assignment.status === 'submitted' && assignment.submission && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Upload className="h-4 w-4" />
                          <span>Soumis le: {new Date(assignment.submission.submittedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {assignment.status === 'graded' && assignment.grade && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Note: {assignment.grade.score}/{assignment.grade.maxScore}</span>
                          </div>
                          {assignment.grade.feedback && (
                            <p className="text-sm italic mt-1">{assignment.grade.feedback}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      {assignment.status === 'pending' || assignment.status === 'late' ? (
                        <Button>
                          <Upload className="h-4 w-4 mr-2" />
                          Soumettre
                        </Button>
                      ) : assignment.status === 'submitted' ? (
                        <Button variant="outline">Voir soumission</Button>
                      ) : (
                        <Button variant="outline">Voir évaluation</Button>
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
