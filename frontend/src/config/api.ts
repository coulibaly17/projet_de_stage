// Configuration de base de l'API
export const API_CONFIG = {
  // L'URL de base de votre API backend
  BASE_URL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  
  // Timeout des requêtes en millisecondes
  TIMEOUT: 30000,
  
  // Configuration des headers par défaut
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Configuration des endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ME: '/auth/me',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
    },
    COURSES: {
      BASE: '/courses',  // Nouvel endpoint pour les étudiants avec progression
      POPULAR: '/courses/popular',
      FEATURED: '/courses/featured',
      SEARCH: '/courses/search',
    },
    USERS: {
      BASE: '/users',
      PROFILE: '/users/me',
      ENROLLMENTS: '/users/me/enrollments',
    },
    STUDENT: {
      DASHBOARD: '/student/dashboard',
      ACTIVITIES: '/student/dashboard/activities',
      UPCOMING_QUIZZES: '/student/dashboard/upcoming-quizzes',
      COURSES: '/student/courses',
      IN_PROGRESS_COURSES: '/student/dashboard/in-progress-courses',
      RECOMMENDED_COURSES: '/student/dashboard/recommended-courses',
      STATS: '/student/dashboard/stats',
      QUIZZES: '/student/quizzes',
      QUIZ_HISTORY: '/student/quiz-history',
      QUIZ_RESULTS: '/student/quiz-results',
    },
    TEACHER: {
      DASHBOARD: '/teacher/dashboard',
      COURSES: '/teacher/dashboard/courses', // Ancien endpoint qui renvoie des données minimales
      COURSE_DETAILS: '/teacher/dashboard/courses', // Endpoint de base pour les détails d'un cours
      // Nouveaux endpoints pour les cours complets
      COURSES_COMPLETE: '/courses', // Endpoint complet qui renvoie toutes les informations des cours
      CREATE_COURSE: '/courses/create',
      CREATE_MODULE: '/courses/{courseId}/modules',
      CREATE_LESSON: '/courses/{courseId}/modules/{moduleId}/lessons',
      STUDENT_PROGRESS: '/teacher/dashboard/student-progress',
      RECOMMENDATIONS: '/teacher/dashboard/recommendations',
      COURSE_COMPLETION: '/teacher/dashboard/course-completion',
      RECENT_ACTIVITIES: '/teacher/dashboard/recent-activities',
      UPCOMING_TASKS: '/teacher/dashboard/upcoming-tasks',
      STUDENTS: '/teacher/dashboard/students',
    },
  },
};

export default API_CONFIG;
