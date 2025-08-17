import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Target,
  Trophy
} from 'lucide-react';
import { progressService } from '@/services/progress.service';
import type { StudySession } from '@/services/progress.service';

interface Lesson {
  id: string;
  title: string;
  duration: number; // en minutes
  completed: boolean;
  score?: number;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface LessonProgressTrackerProps {
  courseId: string;
  modules: Module[];
  currentLessonId?: string;
  onLessonComplete?: (lessonId: string, score?: number) => void;
  onLessonChange?: (lessonId: string) => void;
}

export const LessonProgressTracker: React.FC<LessonProgressTrackerProps> = ({
  courseId,
  modules,
  currentLessonId,
  onLessonComplete,
  onLessonChange
}) => {
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isStudying, setIsStudying] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isStudying && currentSession) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStudying, currentSession]);

  const startStudySession = async (lessonId: string) => {
    try {
      const session = await progressService.startStudySession(courseId, lessonId);
      setCurrentSession(session);
      setIsStudying(true);
      setSessionTime(0);
    } catch (error) {
      console.error('Erreur lors du démarrage de la session:', error);
    }
  };

  const pauseStudySession = () => {
    setIsStudying(false);
  };

  const resumeStudySession = () => {
    setIsStudying(true);
  };

  const endStudySession = async (completed: boolean = false) => {
    if (currentSession) {
      try {
        await progressService.endStudySession(currentSession.id, completed);
        setCurrentSession(null);
        setIsStudying(false);
        setSessionTime(0);
      } catch (error) {
        console.error('Erreur lors de la fin de la session:', error);
      }
    }
  };

  const completeLesson = async (lessonId: string, score?: number) => {
    try {
      const module = modules.find(m => m.lessons.some(l => l.id === lessonId));
      if (module) {
        await progressService.completeLesson(courseId, module.id, lessonId, score);
        await endStudySession(true);
        
        if (onLessonComplete) {
          onLessonComplete(lessonId, score);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la completion de la leçon:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalLessons = () => {
    return modules.reduce((total, module) => total + module.lessons.length, 0);
  };

  const getCompletedLessons = () => {
    return modules.reduce((total, module) => 
      total + module.lessons.filter(lesson => lesson.completed).length, 0
    );
  };

  const getOverallProgress = () => {
    const total = getTotalLessons();
    const completed = getCompletedLessons();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getCurrentLesson = () => {
    if (!currentLessonId) return null;
    
    for (const module of modules) {
      const lesson = module.lessons.find(l => l.id === currentLessonId);
      if (lesson) {
        return { lesson, module };
      }
    }
    return null;
  };

  const getNextLesson = () => {
    const current = getCurrentLesson();
    if (!current) return null;

    const moduleIndex = modules.findIndex(m => m.id === current.module.id);
    const lessonIndex = current.module.lessons.findIndex(l => l.id === current.lesson.id);

    // Prochaine leçon dans le même module
    if (lessonIndex < current.module.lessons.length - 1) {
      return {
        lesson: current.module.lessons[lessonIndex + 1],
        module: current.module
      };
    }

    // Première leçon du module suivant
    if (moduleIndex < modules.length - 1) {
      const nextModule = modules[moduleIndex + 1];
      if (nextModule.lessons.length > 0) {
        return {
          lesson: nextModule.lessons[0],
          module: nextModule
        };
      }
    }

    return null;
  };

  const getPreviousLesson = () => {
    const current = getCurrentLesson();
    if (!current) return null;

    const moduleIndex = modules.findIndex(m => m.id === current.module.id);
    const lessonIndex = current.module.lessons.findIndex(l => l.id === current.lesson.id);

    // Leçon précédente dans le même module
    if (lessonIndex > 0) {
      return {
        lesson: current.module.lessons[lessonIndex - 1],
        module: current.module
      };
    }

    // Dernière leçon du module précédent
    if (moduleIndex > 0) {
      const prevModule = modules[moduleIndex - 1];
      if (prevModule.lessons.length > 0) {
        return {
          lesson: prevModule.lessons[prevModule.lessons.length - 1],
          module: prevModule
        };
      }
    }

    return null;
  };

  const currentLesson = getCurrentLesson();
  const nextLesson = getNextLesson();
  const previousLesson = getPreviousLesson();

  return (
    <div className="space-y-4">
      {/* Progression générale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Progression du cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {getCompletedLessons()} / {getTotalLessons()} leçons terminées
              </span>
              <span className="text-lg font-bold text-primary">
                {getOverallProgress()}%
              </span>
            </div>
            <Progress value={getOverallProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Session d'étude actuelle */}
      {currentLesson && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {currentLesson.lesson.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chronomètre de session */}
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-mono font-bold">
                    {formatTime(sessionTime)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Temps de session
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {!currentSession ? (
                  <Button 
                    onClick={() => startStudySession(currentLesson.lesson.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Commencer
                  </Button>
                ) : (
                  <>
                    {isStudying ? (
                      <Button 
                        onClick={pauseStudySession}
                        variant="outline"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button 
                        onClick={resumeStudySession}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Reprendre
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => endStudySession(false)}
                      variant="outline"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Arrêter
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Informations sur la leçon */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Durée estimée: {currentLesson.lesson.duration} min
                </span>
              </div>
              <div className="flex items-center gap-2">
                {currentLesson.lesson.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm">
                  {currentLesson.lesson.completed ? 'Terminée' : 'En cours'}
                </span>
              </div>
            </div>

            {/* Bouton de completion */}
            {currentSession && !currentLesson.lesson.completed && (
              <Button 
                onClick={() => completeLesson(currentLesson.lesson.id)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marquer comme terminée
              </Button>
            )}

            {/* Score si disponible */}
            {currentLesson.lesson.completed && currentLesson.lesson.score && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Trophy className="w-5 h-5 text-green-600" />
                <span className="font-medium">
                  Score: {currentLesson.lesson.score}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation entre leçons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => previousLesson && onLessonChange?.(previousLesson.lesson.id)}
          disabled={!previousLesson}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Précédent
        </Button>
        
        <Button 
          onClick={() => nextLesson && onLessonChange?.(nextLesson.lesson.id)}
          disabled={!nextLesson}
        >
          Suivant
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Liste des modules et leçons */}
      <Card>
        <CardHeader>
          <CardTitle>Plan du cours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Module {moduleIndex + 1}: {module.title}
                </h4>
                <div className="space-y-1 ml-4">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div 
                      key={lesson.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        lesson.id === currentLessonId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => onLessonChange?.(lesson.id)}
                    >
                      {lesson.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm flex-1">
                        {lessonIndex + 1}. {lesson.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {lesson.duration} min
                      </span>
                      {lesson.score && (
                        <Badge variant="secondary" className="text-xs">
                          {lesson.score}%
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
