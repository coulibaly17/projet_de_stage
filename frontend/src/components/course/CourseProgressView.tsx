import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { courseService } from '../../services/course.service';
import type { CourseProgress } from '../../types/course';

import type { Module } from '../../types/course';

interface ModuleAccordionProps {
  module: Module & {
    completed_lessons: number;
    total_lessons: number;
  };
  isExpanded: boolean;
  onToggle: () => void;
  onLessonClick: (lessonId: number) => void;
}

const ModuleAccordion = ({
  module,
  isExpanded,
  onToggle,
  onLessonClick,
}: ModuleAccordionProps) => {
  const completedLessons = module.lessons.filter(l => l.is_completed).length;
  const progress = module.lessons.length > 0 
    ? Math.round((completedLessons / module.lessons.length) * 100) 
    : 0;

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader 
        className="pb-2 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 mr-2 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 mr-2 text-muted-foreground" />
            )}
            <CardTitle className="text-lg">
              {module.order_index}. {module.title}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {module.completed_lessons} / {module.total_lessons} leçons
            </span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
        </div>
        <div className="ml-7 mt-2">
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 pb-4">
          <ul className="space-y-2">
            {module.lessons.map((lesson) => (
              <li key={lesson.id} className="flex items-center">
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-auto py-2 ${lesson.is_completed ? 'text-green-600' : 'text-foreground'}`}
                  onClick={() => onLessonClick(lesson.id)}
                >
                  <div className="flex items-center w-full">
                    {lesson.is_completed ? (
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-gray-300 mr-2" />
                    )}
                    <div className="text-left">
                      <div className="font-medium">
                        {lesson.order_index}. {lesson.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lesson.completion_percentage || 0}% complété
                      </div>
                    </div>
                  </div>
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
};

export default function CourseProgressView() {
  const { courseId } = useParams<{ courseId: string }>();
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchCourseProgress = async () => {
      if (!courseId) return;
      
      try {
        setIsLoading(true);
        const data = await courseService.getCourseProgress(parseInt(courseId));
        setCourseProgress(data);
        
        // Développer le premier module par défaut
        if (data.modules.length > 0) {
          setExpandedModules({ [data.modules[0].id]: true });
        }
      } catch (err) {
        console.error('Erreur lors du chargement de la progression du cours:', err);
        setError('Impossible de charger la progression du cours. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseProgress();
  }, [courseId]);

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleLessonClick = (lessonId: number) => {
    // Naviguer vers la leçon
    console.log('Naviguer vers la leçon:', lessonId);
    // Ici, vous pouvez ajouter la logique pour naviguer vers la leçon
    // Par exemple: navigate(`/cours/${courseId}/lecons/${lessonId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Erreur ! </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!courseProgress) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune donnée de progression disponible</h3>
        <p className="mt-1 text-gray-500">Commencez à suivre le cours pour voir votre progression.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 p-6 bg-card rounded-lg border">
        <h1 className="text-2xl font-bold mb-2">{courseProgress.course_title}</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Progress 
                value={courseProgress.progress_percentage} 
                className="h-3 w-32" 
              />
              <span className="absolute -top-6 left-0 text-xs text-muted-foreground">
                Progression globale
              </span>
            </div>
            <span className="text-lg font-medium">
              {Math.round(courseProgress.progress_percentage)}%
            </span>
            {courseProgress.is_completed && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" />
                Terminé
              </span>
            )}
          </div>
          <Button variant="outline">
            Continuer le cours
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Modules et leçons</h2>
        {courseProgress.modules.map((module) => {
          const moduleId = module.id;
          return (
            <ModuleAccordion
              key={moduleId}
              module={{
                ...module,
                completed_lessons: module.lessons.filter(l => l.is_completed).length,
                total_lessons: module.lessons.length,
                lessons: module.lessons.map(lesson => ({
                  ...lesson,
                  is_completed: lesson.is_completed || false,
                  completion_percentage: lesson.completion_percentage || 0,
                  last_accessed: lesson.last_accessed || null
                }))
              }}
              isExpanded={!!expandedModules[moduleId]}
              onToggle={() => toggleModule(moduleId)}
              onLessonClick={handleLessonClick}
            />
          );
        })}
      </div>
    </div>
  );
}
