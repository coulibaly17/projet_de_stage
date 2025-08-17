import { apiService } from './api.service';
import { API_CONFIG } from '@/config/api.config';

// Types pour les statistiques enseignant
export interface TeacherStats {
  students: number;
  courses: number;
  assignments: number;
  quizzes: number;
  discussions: number;
}

export interface TeacherCourse {
  id: string | number;
  title: string;
  students: number;
  completion: number;
  nextSession?: string;
  status: 'published' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface StudentActivity {
  id: string | number;
  name: string;
  lastActivity: string;
  progress: number;
  avatar: string;
}

export interface QuizStat {
  id: string | number;
  title: string;
  completions: number;
  averageScore: number;
}

class TeacherService {
  // Récupérer les statistiques générales de l'enseignant
  async getTeacherStats(): Promise<TeacherStats> {
    try {
      console.log('🔍 Récupération des statistiques enseignant...');
      
      // Essayer différents endpoints pour récupérer les statistiques
      const endpoints = [
        `${API_CONFIG.endpoints.teacherCourses}/stats`,
        '/api/v1/teacher/stats',
        '/api/v1/teacher/dashboard/stats',
        `${API_CONFIG.endpoints.teacherCourses}/dashboard-stats`
      ];

      let stats: TeacherStats = {
        students: 0,
        courses: 0,
        assignments: 0,
        quizzes: 0,
        discussions: 0
      };

      // Essayer de récupérer les cours pour calculer les statistiques
      try {
        const coursesResponse = await apiService.get<any>(API_CONFIG.endpoints.teacherCourses);
        console.log('📚 Réponse courses:', coursesResponse);
        
        let courses = [];
        if (Array.isArray(coursesResponse)) {
          courses = coursesResponse;
        } else if (coursesResponse?.data && Array.isArray(coursesResponse.data)) {
          courses = coursesResponse.data;
        }

        stats.courses = courses.length;
        
        // Calculer le nombre total d'étudiants
        stats.students = courses.reduce((total: number, course: any) => {
          const studentCount = course.students?.length || course.enrolled_students?.length || course.student_count || 0;
          return total + studentCount;
        }, 0);

        console.log('📊 Statistiques calculées:', stats);
      } catch (error) {
        console.error('❌ Erreur lors du calcul des statistiques:', error);
      }

      // Essayer de récupérer les quiz
      try {
        const quizResponse = await apiService.get<any>('/api/v1/quizzes/teacher');
        if (Array.isArray(quizResponse)) {
          stats.quizzes = quizResponse.length;
        } else if (quizResponse?.data && Array.isArray(quizResponse.data)) {
          stats.quizzes = quizResponse.data.length;
        }
      } catch (error) {
        console.warn('⚠️ Impossible de récupérer les quiz:', error);
      }

      return stats;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques enseignant:', error);
      // Retourner des statistiques par défaut en cas d'erreur
      return {
        students: 0,
        courses: 0,
        assignments: 0,
        quizzes: 0,
        discussions: 0
      };
    }
  }

  // Récupérer les cours de l'enseignant
  async getTeacherCourses(): Promise<TeacherCourse[]> {
    try {
      console.log('📚 Récupération des cours enseignant...');
      const response = await apiService.get<any>(API_CONFIG.endpoints.teacherCourses);
      console.log('📚 Réponse courses:', response);
      
      let courses = [];
      if (Array.isArray(response)) {
        courses = response;
      } else if (response?.data && Array.isArray(response.data)) {
        courses = response.data;
      }

      return courses.map((course: any) => ({
        id: course.id,
        title: course.title || course.name || 'Cours sans titre',
        students: course.students?.length || course.enrolled_students?.length || course.student_count || 0,
        completion: course.completion_rate || Math.floor(Math.random() * 100), // Temporaire
        nextSession: course.next_session || 'À définir',
        status: course.status || 'draft',
        created_at: course.created_at,
        updated_at: course.updated_at
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des cours:', error);
      return [];
    }
  }

  // Récupérer l'activité récente des étudiants
  async getStudentActivities(): Promise<StudentActivity[]> {
    try {
      console.log('👥 Récupération des activités étudiants...');
      // Pour l'instant, retourner des données par défaut
      // TODO: Implémenter l'endpoint réel quand disponible
      return [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des activités:', error);
      return [];
    }
  }

  // Récupérer les statistiques des quiz
  async getQuizStats(): Promise<QuizStat[]> {
    try {
      console.log('📝 Récupération des statistiques quiz...');
      const response = await apiService.get<any>('/api/v1/quizzes/teacher');
      
      let quizzes = [];
      if (Array.isArray(response)) {
        quizzes = response;
      } else if (response?.data && Array.isArray(response.data)) {
        quizzes = response.data;
      }

      return quizzes.map((quiz: any) => ({
        id: quiz.id,
        title: quiz.title || `Quiz ${quiz.id}`,
        completions: quiz.completions || 0,
        averageScore: quiz.average_score || 0
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques quiz:', error);
      return [];
    }
  }
}

export const teacherService = new TeacherService();
