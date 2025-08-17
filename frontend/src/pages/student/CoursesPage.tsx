import { Search, Filter, Clock, Play, PlayCircle, CheckCircle, Award, TrendingUp, Target } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '@/services/course.service';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CourseProgressCard } from '@/components/progress/CourseProgressCard';
import { progressService } from '@/services/progress.service';

const categories = [
  'Tous les cours',
  'Développement Web',
  'Data Science',
  'Design',
  'Marketing',
  'Business',
  'Photographie',
];

const difficultyLevels = [
  { label: 'Tous les niveaux', value: 'all' },
  { label: 'Débutant', value: 'beginner' },
  { label: 'Intermédiaire', value: 'intermediate' },
  { label: 'Avancé', value: 'advanced' },
];

interface Course {
  id: string;
  title: string;
  description: string;
  short_description: string;
  thumbnail_url: string;
  status: 'draft' | 'published' | 'archived';
  price: number;
  created_at: string;
  updated_at: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
    description?: string;
  };
  tags: Array<{ id: string; name: string }>;
  modules: Array<{
    id: string;
    title: string;
    description: string | null;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      description?: string;
      duration: number;
      order_index: number;
      is_completed?: boolean;
    }>;
  }>;
  progress: number;  // Toujours défini maintenant
  is_enrolled: boolean;  // Nouvelle propriété
  isNew?: boolean;
  isPopular?: boolean;
  students_count?: number;
  average_rating?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string; // Format: "2h30" ou "45min"
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  advanced: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const difficultyLabels = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

// Fonction utilitaire pour générer les messages de progression
const getProgressMessage = (progress: number): string => {
  if (progress === 0) return '🎯 Prêt à commencer cette aventure ?';
  if (progress < 10) return '🌱 Excellent début ! Continuez sur cette lancée !';
  if (progress < 25) return '🚀 Vous prenez de l\'élan ! Chaque leçon compte !';
  if (progress < 50) return '💪 Formidable progression ! Vous maîtrisez de plus en plus !';
  if (progress < 75) return '🎆 Vous êtes sur la bonne voie ! Plus que quelques efforts !';
  if (progress < 90) return '🏆 Presque au sommet ! La ligne d\'arrivée approche !';
  if (progress < 100) return '⭐ Dernière ligne droite ! Vous y êtes presque !';
  return '🎉 Félicitations ! Cours terminé avec succès !';
};

// Fonction utilitaire pour obtenir le libellé d'une catégorie
const getCategoryLabel = (category: string | { name: string } | undefined): string => {
  const categoryLabels: Record<string, string> = {
    'all': 'Toutes les catégories',
    'programming': 'Programmation',
    'design': 'Design',
    'business': 'Business',
    'marketing': 'Marketing',
    'data-science': 'Data Science',
    'languages': 'Langues'
  };
  
  if (!category) return 'Autre';
  const categoryName = typeof category === 'string' ? category : category.name;
  return categoryLabels[categoryName] ?? 'Autre';
};

// Fonction utilitaire pour formater et valider les URLs d'images
const formatImageUrl = (url: string | undefined | null): string => {
  // Vérifier si l'URL est null, undefined ou vide
  if (!url || url.trim() === '') {
    return `https://source.unsplash.com/random/800x600?education`;
  }
  
  try {
    // Si l'URL est une URL de recherche Bing ou contient "search"
    if (url.includes('bing.com/images/search') || url.includes('search?') || url.includes('view=detailV2')) {
      return `https://source.unsplash.com/random/800x600?education`;
    }
    
    // Si l'URL ne commence pas par http:// ou https://, ajouter https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    
    return url;
  } catch (error) {
    console.error('Erreur lors du formatage de l\'URL de l\'image:', error);
    return `https://source.unsplash.com/random/800x600?education`;
  }
};

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous les cours');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        // Récupérer les cours auxquels l'étudiant est inscrit
        const response = await courseService.getStudentEnrolledCourses();
        
        if (response && Array.isArray(response)) {
          // Les données viennent déjà formatées du backend avec la progression
          const coursesWithProgress = response.map((course: any) => ({
            ...course,
            // Formater la durée totale du cours
            duration: formatCourseDuration(course.modules),
            // S'assurer que l'instructeur a toujours un format cohérent
            instructor: course.instructor ?? { id: '0', name: 'Instructeur inconnu' },
            // Utiliser les données de progression du backend
            progress: course.progress ?? 0,
            is_enrolled: course.is_enrolled ?? false,
            isNew: course.isNew ?? false,
            isPopular: course.isPopular ?? false
          }));
          
          setCourses(coursesWithProgress);
        } else {
          throw new Error('Format de réponse inattendu de l\'API');
        }
      } catch (err) {
        console.error('Erreur lors du chargement des cours', err);
        setError('Impossible de charger les cours. Veuillez réessayer plus tard.');
        toast.error('Erreur de chargement des cours');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);
  
  // Fonction utilitaire pour formater la durée totale du cours
  const formatCourseDuration = (modules: any[] = []): string => {
    const totalMinutes = modules.reduce((sum, module) => {
      const moduleDuration = module.lessons?.reduce(
        (lessonSum: number, lesson: any) => lessonSum + (lesson.duration || 0), 
        0
      ) || 0;
      return sum + moduleDuration;
    }, 0);
    
    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h${minutes}` : `${hours}h`;
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  // Suppression des données de démonstration non utilisées

  // Filtrer les cours en fonction de la recherche et des filtres
  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchQuery === '' || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.instructor?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const courseCategory = course.category?.name || 'Général';
    const matchesCategory = selectedCategory === 'Tous les cours' || 
      courseCategory === selectedCategory;
    
    const difficulty = course.difficulty_level || 'intermediate';
    const matchesDifficulty = selectedDifficulty === 'all' || 
      difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Afficher les cours ou un message de chargement
  const displayCourses = loading ? [] : (filteredCourses.length > 0 ? filteredCourses : []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tous les cours</h1>
        <p className="text-muted-foreground">
          Parcourez notre catalogue de cours et commencez à apprendre dès aujourd'hui.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher des cours..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Catégories
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {categories.map((category) => (
                <DropdownMenuItem 
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Niveau
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {difficultyLevels.map((level) => (
                <DropdownMenuItem 
                  key={level.value}
                  onClick={() => setSelectedDifficulty(level.value)}
                >
                  {level.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {!loading && error && (
        <div className="py-12 text-center">
          <p className="text-red-500">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </Button>
        </div>
      )}

      {!loading && displayCourses.length === 0 && !error && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Aucun cours ne correspond à votre recherche.</p>
        </div>
      )}

      {/* Section spéciale pour les nouveaux étudiants */}
      {!loading && displayCourses.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                🎯 Nouveau sur la plateforme ?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Commencez votre parcours d'apprentissage avec nos cours recommandés pour débutants.
                Chaque cours inclut un suivi de progression personnalisé pour vous accompagner.
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span>Progression en temps réel</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span>Suivi personnalisé</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Certificats à l'issue</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayCourses.map((course) => {
          const courseCategory = course.category?.name || 'Général';
          const difficulty = course.difficulty_level || 'intermediate';
          const studentCount = course.students_count || 0;
          const rating = course.average_rating || 4.5;
          
          return (
            <div 
              key={course.id} 
              className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
              onClick={() => handleCourseClick(course.id)}
            >
              <div className="relative aspect-video">
                <img
                  src={formatImageUrl(course.thumbnail_url)}
                  alt={course.title}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.src = `https://source.unsplash.com/random/800x600?education,${courseCategory.toLowerCase()}`;
                  }}
                />
                {course.isNew && (
                  <Badge className="absolute top-2 left-2 bg-blue-500 hover:bg-blue-600">Nouveau</Badge>
                )}
                {course.isPopular && !course.isNew && (
                  <Badge className="absolute top-2 left-2 bg-orange-500 hover:bg-orange-600">Populaire</Badge>
                )}
              </div>
              
              <div className="p-4 space-y-2 flex-grow">
                <h3 className="font-semibold text-lg line-clamp-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground">{course.instructor?.name || 'Instructeur inconnu'}</p>
                
                <div className="flex items-center gap-1">
                  <div className="flex items-center">
                    <span className="text-amber-500">★</span>
                    <span className="text-sm font-medium ml-1">
                      {rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({studentCount.toLocaleString()} {studentCount > 1 ? 'étudiants' : 'étudiant'})
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {getCategoryLabel(course.category)}
                  </Badge>
                  <Badge className={`text-xs ${difficultyColors[difficulty]}`}>
                    {difficultyLabels[difficulty] || difficulty}
                  </Badge>
                  {course.tags?.slice(0, 2).map(tag => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {course.short_description || course.description?.substring(0, 100) + '...'}
                </p>
                
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{course.duration}</span>
                </div>
              </div>

            {/* Affichage de la progression amélioré */}
            {course.is_enrolled && (
              <div className="px-4 pb-3 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">Inscrit</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{Math.round(course.progress)}%</div>
                    <div className="text-xs text-muted-foreground">Complété</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="h-3 overflow-hidden rounded-full bg-gray-200 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-500 ease-out shadow-sm" 
                      style={{ width: `${Math.round(course.progress)}%` }}
                    />
                  </div>
                  
                  {course.progress > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-gray-600">
                        {getProgressMessage(course.progress)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {course.modules?.length || 0} modules
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Bouton d'action selon la progression */}
                <div className="pt-2">
                  {course.progress === 0 ? (
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      onClick={() => navigate(`/etudiant/cours/${course.id}`)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Commencer le cours
                    </Button>
                  ) : course.progress === 100 ? (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-green-500 text-green-700 hover:bg-green-50"
                        onClick={() => navigate(`/etudiant/cours/${course.id}`)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Revoir
                      </Button>
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => navigate(`/etudiant/cours/${course.id}/certificat`)}
                      >
                        <Award className="w-4 h-4 mr-2" />
                        Certificat
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                      onClick={() => navigate(`/etudiant/cours/${course.id}`)}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Continuer le cours
                    </Button>
                  )}
                </div>
              </div>
            )}
            </div>
          );
        })}
      </div>

      {!loading && displayCourses.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" className="mt-4">
            Charger plus de cours
          </Button>
        </div>
      )}
    </div>
  );
}
