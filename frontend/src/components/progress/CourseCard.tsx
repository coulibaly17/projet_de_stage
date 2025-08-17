import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  BookOpen, 
  User, 
  Star, 
  Play,
  CheckCircle,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    instructor: {
      name: string;
      avatar?: string;
    };
    progress?: number;
    imageUrl?: string;
    duration?: string;
    lessonsCount?: number;
    completedLessons?: number;
    tags?: string[];
    difficulty?: 'Débutant' | 'Intermédiaire' | 'Avancé';
    rating?: number;
    studentsCount?: number;
  };
  showProgress?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, showProgress = true }) => {
  const navigate = useNavigate();
  
  const handleCourseClick = () => {
    navigate(`/etudiant/cours/${course.id}`);
  };

  const getProgressMessage = (progress: number) => {
    if (progress === 0) return "Prêt à commencer";
    if (progress < 25) return "Bon début !";
    if (progress < 50) return "Bien avancé";
    if (progress < 75) return "Presque fini !";
    if (progress < 100) return "Dernière ligne droite";
    return "Terminé !";
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Débutant': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Intermédiaire': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Avancé': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const progress = course.progress ?? 0;
  const isCompleted = progress >= 100;
  const isStarted = progress > 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:shadow-xl hover:-translate-y-1">
      <button 
        onClick={handleCourseClick}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        type="button"
      >
      <div>
        {/* Image du cours */}
        <div className="relative overflow-hidden rounded-t-lg">
          <img 
            src={course.imageUrl ?? '/images/course-placeholder.jpg'} 
            alt={course.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Badge de difficulté */}
          {course.difficulty && (
            <Badge 
              className={`absolute top-3 left-3 ${getDifficultyColor(course.difficulty)}`}
            >
              {course.difficulty}
            </Badge>
          )}
          
          {/* Badge de progression */}
          {showProgress && isStarted && (
            <div className="absolute top-3 right-3">
              {isCompleted ? (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Terminé
                </Badge>
              ) : (
                <Badge className="bg-blue-500 text-white">
                  <Target className="w-3 h-3 mr-1" />
                  {progress}%
                </Badge>
              )}
            </div>
          )}
          
          {/* Overlay de lecture */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-3">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Titre et description */}
          <div className="mb-3">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {course.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {course.description}
            </p>
          </div>

          {/* Instructeur */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {course.instructor.name}
            </span>
          </div>

          {/* Métadonnées */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
            {course.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{course.duration}</span>
              </div>
            )}
            {course.lessonsCount && (
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>{course.lessonsCount} leçons</span>
              </div>
            )}
            {course.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{course.rating}</span>
              </div>
            )}
          </div>

          {/* Barre de progression */}
          {showProgress && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getProgressMessage(progress)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {course.completedLessons ?? 0}/{course.lessonsCount ?? 0}
                </span>
              </div>
              <Progress 
                value={progress} 
                className="h-2"
              />
            </div>
          )}

          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {course.tags.slice(0, 3).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                >
                  {tag}
                </Badge>
              ))}
              {course.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  +{course.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Bouton d'action */}
          <Button 
            className="w-full"
            variant={isCompleted ? "outline" : "primary"}
            onClick={(e) => {
              e.stopPropagation();
              handleCourseClick();
            }}
          >
            {(() => {
              if (isCompleted) {
                return (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Revoir le cours
                  </>
                );
              }
              if (isStarted) {
                return (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Continuer
                  </>
                );
              }
              return (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Commencer
                </>
              );
            })()}
          </Button>
        </CardContent>
      </div>
      </button>
    </Card>
  );
};
