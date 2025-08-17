import { courseService } from '../../services/course.service';
import { Box, CircularProgress, Container, Typography, Card, CardContent, Button, CardActions } from '@mui/material';
import { useEffect, useState } from 'react';

interface Course {
  id: number;
  title: string;
  description: string;
  short_description: string;
  status: string;
  price: number;
  thumbnail_url: string;
  image: string;
  category_id: number;
  category: {
    id: number;
    name: string;
  } | null;
  instructor_id: number;
  instructor: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  student_count: number;
  created_at: string | null;
  updated_at: string | null;
  is_enrolled: boolean;
  progress: number;
  difficulty_level: string;
  total_lessons: number;
  average_rating: number;
  tags: string[];
  instructor_name?: string;
  category_name?: string;
  level?: string;
  duration?: number;
}


const RecommendationsPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    const fetchUnenrolledCourses = async () => {
      try {
        setLoading(true);
        
        // Utiliser le service pour récupérer les cours non inscrits
        const response = await courseService.getUnenrolledCourses({
          skip: 0,
          limit: 10
        });
        
        console.log('Données des cours reçues:', response);
        
        // Transformer les données pour correspondre à l'interface attendue
        const transformedCourses = (response as any).courses.map((course: any) => ({
          ...course,
          // S'assurer que l'image est définie
          image: course.thumbnail_url ?? '',
          // Créer un champ instructor_name à partir de l'objet instructor
          instructor_name: course.instructor 
            ? `${course.instructor.first_name} ${course.instructor.last_name}`.trim()
            : 'Instructeur inconnu',
          // Créer un champ category_name à partir de l'objet category
          category_name: course.category?.name ?? 'Non catégorisé',
          // Utiliser difficulty_level comme level
          level: course.difficulty_level ?? 'intermediate',
          // Utiliser total_lessons comme durée
          duration: course.total_lessons ?? 0
        }));
        
        setCourses(transformedCourses);
        setError(null);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des cours non inscrits:', err);
        
        let errorMessage = 'Impossible de charger les cours. Veuillez réessayer plus tard.';
        
        if (err.response) {
          // La requête a été faite et le serveur a répondu avec un statut hors 2xx
          console.error('Détails de l\'erreur:', {
            status: err.response.status,
            data: err.response.data,
            headers: err.response.headers
          });
          
          if (err.response.status === 422) {
            errorMessage = 'Erreur de validation des données. Veuillez vérifier les informations fournies.';
          } else if (err.response.data?.detail) {
            errorMessage = err.response.data.detail;
          }
        } else if (err.request) {
          // La requête a été faite mais aucune réponse n'a été reçue
          console.error('Aucune réponse du serveur:', err.request);
          errorMessage = 'Le serveur ne répond pas. Vérifiez votre connexion internet.';
        } else {
          // Une erreur s'est produite lors de la configuration de la requête
          console.error('Erreur de configuration de la requête:', err.message);
          errorMessage = `Erreur de configuration: ${err.message}`;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUnenrolledCourses();
  }, []);

  const handleEnroll = async (courseId: number) => {
    try {
      const result = await courseService.enrollInCourse(courseId);
      
      // Afficher un message de succès
      setError(null);
      alert(`Inscription réussie au cours: ${result.course_title}`);
      
      // Mettre à jour la liste des cours après inscription
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
    } catch (err: any) {
      console.error('Erreur lors de l\'inscription au cours:', err);
      
      let errorMessage = 'Une erreur est survenue lors de l\'inscription au cours.';
      
      if (err.response) {
        // La requête a été faite et le serveur a répondu avec un statut hors 2xx
        console.error('Détails de l\'erreur:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
        
        if (err.response.status === 403) {
          errorMessage = 'Accès refusé. Vous devez être un étudiant pour vous inscrire à un cours.';
        } else if (err.response.status === 404) {
          errorMessage = 'Cours non trouvé.';
        } else if (err.response.status === 409) {
          errorMessage = 'Vous êtes déjà inscrit à ce cours.';
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        }
      } else if (err.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error('Aucune réponse du serveur:', err.request);
        errorMessage = 'Le serveur ne répond pas. Vérifiez votre connexion internet.';
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error('Erreur de configuration de la requête:', err.message);
        errorMessage = `Erreur de configuration: ${err.message}`;
      }
      
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Cours recommandés pour vous
      </Typography>
      
      {courses.length === 0 ? (
        <Typography variant="body1">
          Aucun cours recommandé pour le moment. Revenez plus tard pour de nouvelles suggestions.
        </Typography>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {courses.map((course) => (
            <div key={course.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {course.thumbnail_url && (
                  <Box
                    component="img"
                    src={course.thumbnail_url}
                    alt={course.title}
                    sx={{
                      width: '100%',
                      height: 140,
                      objectFit: 'cover',
                    }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2">
                    {course.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {course.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Instructeur:</strong> {course.instructor_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Catégorie:</strong> {course.category_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Niveau:</strong> {course.level}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Durée:</strong> {course.duration} heures
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2 }}>
                  <Button 
                    size="small" 
                    color="primary" 
                    variant="contained"
                    onClick={() => handleEnroll(course.id)}
                    fullWidth
                  >
                    S'inscrire
                  </Button>
                </CardActions>
              </Card>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
};

export default RecommendationsPage;