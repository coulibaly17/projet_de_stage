import { apiService } from './api';
import API_CONFIG from '@/config/api';
import type { Course } from './course.service';

export interface Activity {
  id: number;
  type: 'quiz' | 'course' | 'message' | 'assignment' | 'certificate';
  title: string;
  description: string;
  time: string;
  course?: {
    id: number;
    title: string;
  };
}

export interface UpcomingQuiz {
  id: number;
  title: string;
  courseTitle: string;
  courseId: number;
  dueDate: string;
  timeRemaining: string;
  isImportant: boolean;
}

export interface DashboardData {
  stats: {
    coursesEnrolled: number;
    completedCourses: number;
    hoursSpent: number;
    averageScore: number;
    passedQuizzes: number;
  };
  inProgressCourses: Course[];
  recommendedCourses: Course[];
  recentActivities: Activity[];
  upcomingQuizzes: UpcomingQuiz[];
}

export interface TeacherDashboardStats {
  students: number;
  courses: number;
  assignments: number;
  engagement: number;
}

export interface UnreadMessagesCount {
  count: number;
}

class DashboardService {
  private static instance: DashboardService;
  
  private constructor() {}

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  public async getStudentDashboard(): Promise<DashboardData> {
    try {
      return await apiService.get<DashboardData>(
        API_CONFIG.ENDPOINTS.STUDENT.DASHBOARD
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des données du tableau de bord étudiant:', error);
      throw error;
    }
  }

  public async getRecentActivities(): Promise<Activity[]> {
    try {
      const response = await apiService.get<{ items: Activity[] }>(
        API_CONFIG.ENDPOINTS.STUDENT.ACTIVITIES
      );
      return response.items;
    } catch (error) {
      console.error('Erreur lors de la récupération des activités récentes:', error);
      return [];
    }
  }

  public async getUpcomingQuizzes(): Promise<UpcomingQuiz[]> {
    try {
      const response = await apiService.get<{ items: UpcomingQuiz[] }>(
        API_CONFIG.ENDPOINTS.STUDENT.UPCOMING_QUIZZES
      );
      return response.items;
    } catch (error) {
      console.error('Erreur lors de la récupération des quiz à venir:', error);
      return [];
    }
  }

  public async getQuizHistory(): Promise<QuizHistory> {
    try {
      console.log('Appel de getQuizHistory - endpoint: /student/quiz-history');
      // Utilisation du chemin direct pour correspondre à l'endpoint backend
      const response = await apiService.get<QuizHistory>('/student/quiz-history');
      console.log('Réponse de getQuizHistory:', response);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des quiz:', error);
      throw error;
    }
  }

  public async getQuizResultDetails(quizResultId: number | string): Promise<QuizResultDetail> {
    try {
      const endpoint = `/student/quiz-results/${quizResultId}`;
      console.log(`Appel de getQuizResultDetails - endpoint: ${endpoint}`);
      
      // Utilisation du chemin direct pour correspondre à l'endpoint backend
      const response = await apiService.get<QuizResultDetail>(endpoint);
      console.log('Réponse de getQuizResultDetails:', response);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du résultat de quiz:', error);
      throw error;
    }
  }

  // Méthodes pour le dashboard enseignant
  public async getTeacherDashboardStats(): Promise<TeacherDashboardStats> {
    try {
      console.log('Récupération des statistiques du dashboard enseignant');
      const response = await apiService.get<TeacherDashboardStats>('/teacher/dashboard/stats');
      console.log('Statistiques du dashboard enseignant:', response);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du dashboard enseignant:', error);
      throw error;
    }
  }

  public async getUnreadMessagesCount(): Promise<UnreadMessagesCount> {
    try {
      console.log('Récupération du nombre de messages non lus');
      // Utiliser le service de messagerie pour récupérer les discussions non lues
      const discussions = await apiService.get('/discussions', {
        params: { unreadOnly: true, limit: 100 }
      });
      
      // Compter les messages non lus
      let unreadCount = 0;
      if (Array.isArray(discussions)) {
        unreadCount = discussions.length;
      }
      
      console.log('Nombre de messages non lus:', unreadCount);
      return { count: unreadCount };
    } catch (error) {
      console.error('Erreur lors de la récupération des messages non lus:', error);
      // Retourner 0 en cas d'erreur pour éviter de casser l'interface
      return { count: 0 };
    }
  }
}

export interface UserAnswer {
  question_id: number;
  question_text: string;
  selected_option_id?: number;
  selected_option_text?: string;
  answer_text?: string;
  is_correct: boolean;
  correct_option_text?: string;
}

export interface QuizResultDetail {
  quiz_id: number;
  quiz_title: string;
  score: number;
  passed: boolean;
  completed_at: string;
  answers: UserAnswer[];
  total_questions: number;
  correct_answers: number;
}

export interface QuizResultSummary {
  id: number;
  quiz_id: number;
  quiz_title: string;
  score: number;
  passed: boolean;
  completed_at: string;
  total_questions: number;
  correct_answers: number;
  course_id: number;
  course_title: string;
}

export interface QuizHistory {
  results: QuizResultSummary[];
  total_quizzes: number;
  average_score: number;
  passed_quizzes: number;
}

export const dashboardService = DashboardService.getInstance();
