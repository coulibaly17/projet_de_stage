import { apiService } from './api';

// Types pour la progression
export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  timeSpent?: number; // en minutes
  score?: number;
}

export interface ModuleProgress {
  moduleId: string;
  title: string;
  completed: boolean;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  lessons: LessonProgress[];
}

export interface CourseProgress {
  courseId: string;
  title: string;
  enrolled: boolean;
  enrolledAt?: string;
  completed: boolean;
  completedAt?: string;
  progressPercentage: number;
  completedModules: number;
  totalModules: number;
  totalTimeSpent: number; // en minutes
  modules: ModuleProgress[];
  nextLesson?: {
    moduleId: string;
    lessonId: string;
    title: string;
    moduleTitle: string;
  };
  achievements?: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  type: 'lesson_completed' | 'module_completed' | 'course_completed' | 'streak' | 'perfect_score';
}

export interface ProgressStats {
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  averageScore: number;
  totalAchievements: number;
}

export interface StudySession {
  id: string;
  courseId: string;
  lessonId: string;
  startTime: string;
  endTime?: string;
  duration: number; // en minutes
  completed: boolean;
}

class ProgressService {
  private static instance: ProgressService;

  private constructor() {}

  public static getInstance(): ProgressService {
    if (!ProgressService.instance) {
      ProgressService.instance = new ProgressService();
    }
    return ProgressService.instance;
  }

  /**
   * Récupère la progression d'un cours spécifique
   */
  async getCourseProgress(courseId: string): Promise<CourseProgress> {
    try {
      const response = await apiService.get<CourseProgress>(`/progress/courses/${courseId}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération de la progression du cours:', error);
      throw error;
    }
  }

  /**
   * Récupère la progression de tous les cours de l'étudiant
   */
  async getAllCoursesProgress(): Promise<CourseProgress[]> {
    try {
      const response = await apiService.get<CourseProgress[]>('/progress/courses');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération de la progression des cours:', error);
      throw error;
    }
  }

  /**
   * Marque une leçon comme terminée
   */
  async completeLesson(courseId: string, moduleId: string, lessonId: string, score?: number): Promise<void> {
    try {
      await apiService.post('/progress/lessons/complete', {
        courseId,
        moduleId,
        lessonId,
        score,
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur lors de la completion de la leçon:', error);
      throw error;
    }
  }

  /**
   * Démarre une session d'étude
   */
  async startStudySession(courseId: string, lessonId: string): Promise<StudySession> {
    try {
      const response = await apiService.post<StudySession>('/progress/sessions/start', {
        courseId,
        lessonId,
        startTime: new Date().toISOString()
      });
      return response;
    } catch (error) {
      console.error('Erreur lors du démarrage de la session d\'étude:', error);
      throw error;
    }
  }

  /**
   * Termine une session d'étude
   */
  async endStudySession(sessionId: string, completed: boolean = false): Promise<void> {
    try {
      await apiService.put(`/progress/sessions/${sessionId}/end`, {
        endTime: new Date().toISOString(),
        completed
      });
    } catch (error) {
      console.error('Erreur lors de la fin de la session d\'étude:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques de progression de l'étudiant
   */
  async getProgressStats(): Promise<ProgressStats> {
    try {
      const response = await apiService.get<ProgressStats>('/progress/stats');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Récupère les achievements de l'étudiant
   */
  async getAchievements(): Promise<Achievement[]> {
    try {
      const response = await apiService.get<Achievement[]>('/progress/achievements');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des achievements:', error);
      throw error;
    }
  }

  /**
   * Calcule le pourcentage de progression d'un cours
   */
  calculateCourseProgress(modules: ModuleProgress[]): number {
    if (!modules || modules.length === 0) return 0;
    
    const totalLessons = modules.reduce((sum, module) => sum + module.totalLessons, 0);
    const completedLessons = modules.reduce((sum, module) => sum + module.completedLessons, 0);
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  }

  /**
   * Calcule le pourcentage de progression d'un module
   */
  calculateModuleProgress(lessons: LessonProgress[]): number {
    if (!lessons || lessons.length === 0) return 0;
    
    const completedLessons = lessons.filter(lesson => lesson.completed).length;
    return Math.round((completedLessons / lessons.length) * 100);
  }

  /**
   * Détermine la prochaine leçon à suivre
   */
  getNextLesson(courseProgress: CourseProgress): CourseProgress['nextLesson'] | null {
    for (const module of courseProgress.modules) {
      for (const lesson of module.lessons) {
        if (!lesson.completed) {
          return {
            moduleId: module.moduleId,
            lessonId: lesson.lessonId,
            title: `Leçon ${lesson.lessonId}`, // À adapter selon votre structure
            moduleTitle: module.title
          };
        }
      }
    }
    return null;
  }

  /**
   * Génère un message de motivation basé sur la progression
   */
  getMotivationMessage(progress: number, streak: number = 0): string {
    if (progress === 0) {
      return "🚀 Prêt à commencer votre aventure d'apprentissage ?";
    }
    
    if (progress < 10) {
      return "🌱 Excellent début ! Continuez sur cette lancée !";
    }
    
    if (progress < 25) {
      return "💪 Vous prenez de l'élan ! Chaque leçon vous rapproche du succès !";
    }
    
    if (progress < 50) {
      return "🎯 Vous êtes sur la bonne voie ! La moitié du chemin est déjà parcourue !";
    }
    
    if (progress < 75) {
      return "🔥 Formidable progression ! Vous maîtrisez de plus en plus !";
    }
    
    if (progress < 90) {
      return "🏆 Presque au sommet ! Plus que quelques efforts !";
    }
    
    if (progress < 100) {
      return "⭐ Dernière ligne droite ! Vous y êtes presque !";
    }
    
    return "🎉 Félicitations ! Cours terminé avec succès !";
  }

  /**
   * Génère des recommandations basées sur la progression
   */
  getRecommendations(courseProgress: CourseProgress): string[] {
    const recommendations: string[] = [];
    
    if (courseProgress.progressPercentage === 0) {
      recommendations.push("Commencez par la première leçon pour découvrir les bases");
      recommendations.push("Prenez votre temps pour bien comprendre chaque concept");
    } else if (courseProgress.progressPercentage < 50) {
      recommendations.push("Continuez à votre rythme, vous progressez bien !");
      recommendations.push("N'hésitez pas à revoir les leçons précédentes si nécessaire");
    } else if (courseProgress.progressPercentage < 100) {
      recommendations.push("Vous êtes sur la bonne voie ! Continuez ainsi !");
      recommendations.push("Préparez-vous pour les concepts plus avancés à venir");
    } else {
      recommendations.push("Félicitations ! Explorez d'autres cours pour approfondir vos connaissances");
      recommendations.push("Partagez votre expérience avec d'autres étudiants");
    }
    
    return recommendations;
  }

  /**
   * Formate le temps passé en format lisible
   */
  formatTimeSpent(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days}j`;
  }
}

export const progressService = ProgressService.getInstance();
