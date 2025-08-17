// Configuration de l'API
export const API_CONFIG = {
  // URL de base de l'API
  baseUrl: 'http://localhost:8000/api/v1', // Le préfixe /api/v1 est maintenant ici
  
  // Timeout par défaut pour les requêtes (en millisecondes)
  timeout: 30000,
  
  // Endpoints spécifiques (sans le préfixe /api/v1)
  endpoints: {
    // Authentification
    login: '/auth/login',
    register: '/auth/register',
    refreshToken: '/auth/refresh-token',
    studentLesson: (id: number | string) => `/student/lessons/${id}`,
    
    // Utilisateurs
    users: '/users',
    userProfile: '/users/profile',
    
    // Cours
    courses: '/courses',
    courseDetails: (id: number | string) => `/courses/${id}`,
    
    // Quiz
    quizzes: '/quizzes',
    quizDetails: (id: number) => `/quizzes/${id}`,
    quizSubmit: (id: number) => `/quizzes/${id}/submit`,
    quizResults: (id: number) => `/quizzes/${id}/results`,
    
    // Tableau de bord étudiant
    studentDashboard: '/student/dashboard',
    studentCourses: '/courses',  // Utilise le même endpoint que pour les cours normaux
    studentCourse: (id: string | number) => `/courses/${id}`,  // Utilise le même endpoint que pour les détails de cours normaux
    studentQuizzes: '/student/quizzes',
    studentQuizResults: '/student/quiz-results',
    
    // Tableau de bord enseignant
    teacherDashboard: '/teacher/dashboard',
    teacherCourses: '/teacher/dashboard/courses',
    teacherQuizzes: '/teacher/quizzes',
  }
};

// Export par défaut supprimé pour éviter la confusion avec l'export nommé
