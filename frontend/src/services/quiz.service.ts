import { apiService } from './api';
import { API_CONFIG } from '../config/api.config';
import type { AxiosResponse } from 'axios';
import type { 
  Question, 
  QuestionType,
  QuestionOption,
  Quiz, 
  QuizAttempt, 
  QuizResult, 
  QuizFeedback, 
  QuizAnalytics, 
  QuizSettings,
  UserAnswer, 
  ApiResponse,
  QuizMetadata
} from '../types/quiz';

// Définition du type de réponse de l'API pour un quiz
export interface QuizResponse {
  id: string | number;
  title: string;
  description?: string;
  courseId: number | string;
  questions: Array<{
    id: string | number;
    text: string;
    type: string;
    options: Array<{
      id: string | number;
      text: string;
      isCorrect: boolean;
    }>;
  }>;
  timeLimit?: number | null;
  passingScore?: number;
  dueDate?: string | null;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
  settings?: {
    passingScore?: number;
    showResults?: boolean;
    allowRetries?: boolean;
    shuffleQuestions?: boolean;
    shuffleAnswers?: boolean;
    showExplanations?: boolean;
    showCorrectAnswers?: boolean;
    showScore?: boolean;
    requireFullScreen?: boolean;
  };
  // Propriétés pour la réponse de l'API
  data?: QuizResponse;
  status?: number;
  error?: string;
}

export type { UserAnswer };

/**
 * Interface pour les quiz de l'enseignant avec des propriétés supplémentaires
 */
export interface TeacherQuiz extends Quiz {
  timeLimit: number;
  passingScore: number;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
  updatedAt: string;
  metadata: QuizMetadata;
}

/**
 * Classe d'erreur personnalisée pour les erreurs liées aux quiz
 */

/**
 * Classe d'erreur personnalisée pour les erreurs liées aux quiz
 */
class QuizError extends Error {
  statusCode: number;
  originalError?: unknown;

  constructor(message: string, statusCode = 500, originalError?: unknown) {
    super(message);
    this.name = 'QuizError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Service pour gérer les interactions avec l'API des quiz
 */
class QuizService {
  // Cache pour stocker les quiz récupérés
  private readonly quizCache: Map<string, { quiz: Quiz, timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes en millisecondes
  
  /**
   * Récupère un quiz du cache s'il existe et n'est pas expiré
   */
  private getCachedQuiz(quizId: string): Quiz | null {
    const cached = this.quizCache.get(quizId);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.quizCache.delete(quizId);
      return null;
    }
    
    return cached.quiz;
  }
  
  /**
   * Met en cache un quiz
   */
  private cacheQuiz(quiz: Quiz): void {
    this.quizCache.set(quiz.id, {
      quiz,
      timestamp: Date.now()
    });
  }
  

  /**
   * Récupère un quiz par son ID
   */
  async getQuiz(quizId: string): Promise<Quiz> {
    try {
      console.log(`getQuiz - Début de la récupération du quiz ${quizId}`);
      
      // Vérifier que l'ID est valide
      if (!quizId) {
        throw new QuizError('Aucun ID de quiz fourni', 400);
      }
      
      // Vérifier si le quiz est déjà en cache
      const cachedQuiz = this.getCachedQuiz(quizId);
      if (cachedQuiz) {
        console.log(`getQuiz - Quiz ${quizId} trouvé dans le cache`);
        return cachedQuiz;
      }
      
      // Vérifier l'authentification
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('getQuiz - Aucun token d\'authentification trouvé');
        throw new QuizError('Vous devez être connecté pour accéder à ce quiz', 401);
      }
      
      // Récupérer les informations de l'utilisateur pour déterminer son rôle
      const userString = localStorage.getItem('user');
      let role = 'student'; // Rôle par défaut
      
      if (userString) {
        try {
          const user = JSON.parse(userString);
          role = user.role || 'student';
          console.log(`getQuiz - Rôle de l'utilisateur: ${role}`);
        } catch (e) {
          console.error('getQuiz - Erreur lors de la récupération du rôle:', e);
        }
      }
      
      // Le backend attend un ID numérique
      if (!/^\d+$/.test(quizId)) {
        console.warn(`getQuiz - ID de quiz invalide: ${quizId}. L'ID doit être un nombre.`);
        throw new QuizError('ID de quiz invalide. L\'ID doit être un nombre.', 400);
      }

      // Utiliser le même endpoint pour tous les rôles, le backend gère les permissions
      const endpoint = `quizzes/${quizId}`;
      
      console.log(`getQuiz - Appel de l'API pour le quiz ${quizId} via l'endpoint: ${endpoint}`, { role });
      
      try {
        // Faire la requête avec un timeout
        // Le rôle est géré par le token d'authentification, pas besoin de le passer en paramètre
        const response = await apiService.get<Quiz>(endpoint, {
          timeout: 15000
        });

        console.log('getQuiz - Réponse du backend pour le quiz:', response);
        
        // Vérifier si la réponse est valide
        if (!response) {
          throw new QuizError('Réponse du serveur invalide', 500);
        }
        
        // La réponse est déjà typée comme Quiz, pas besoin d'accéder à response.data
        const quizData = response;
        
        // Vérifier si le quiz est disponible
        if (role === 'student' && quizData.isPublished === false) {
          throw new QuizError('Ce quiz n\'est pas disponible pour le moment', 403);
        }
        
        // Normaliser les données du quiz
        const normalizedQuiz = this.normalizeQuiz(quizData);
        
        // Mise en cache du quiz pour des accès plus rapides
        this.cacheQuiz(normalizedQuiz);
        
        return normalizedQuiz;
        
      } catch (error: any) {
        console.error(`getQuiz - Erreur API pour le quiz ${quizId}:`, error);
        
        // Gérer les erreurs spécifiques
        const statusCode = error?.response?.status || 500;
        let errorMessage = 'Erreur lors de la récupération du quiz';
        
        switch (statusCode) {
          case 401:
            errorMessage = 'Authentification requise';
            break;
          case 403:
            errorMessage = 'Accès non autorisé à ce quiz';
            break;
          case 404:
            errorMessage = 'Quiz non trouvé';
            break;
          case 422:
            errorMessage = 'Paramètres de requête invalides';
            break;
          default:
            errorMessage = error?.response?.data?.message || error.message || errorMessage;
        }
        
        throw new QuizError(errorMessage, statusCode, error);
      }
    } catch (error: unknown) {
      if (error instanceof QuizError) {
        throw error;
      }
      
      const axiosError = error as { response?: { status?: number, data?: any } };
      const statusCode = axiosError?.response?.status || 500;
      const responseData = axiosError?.response?.data;
      
      let errorMessage = 'Impossible de récupérer le quiz';
      
      // Traitement spécifique selon le type d'erreur
      if (statusCode === 404) {
        errorMessage = `Le quiz avec l'ID ${quizId} n'existe pas`;
      } else if (statusCode === 422) {
        errorMessage = 'Format d\'ID de quiz invalide ou paramètres incorrects';
        console.error('Erreur 422 lors de la récupération du quiz:', responseData);
      } else if (statusCode === 403) {
        errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder à ce quiz';
      }
      
      console.error(`Erreur ${statusCode} lors de la récupération du quiz ${quizId}:`, error);
      throw new QuizError(errorMessage, statusCode, error);
    }
  }

  /**
   * Soumet une tentative de quiz
   */
  async submitQuizAttempt(
    quizId: string,
    attempt: Omit<QuizAttempt, 'id' | 'startedAt' | 'completedAt' | 'score' | 'passed'>
  ): Promise<QuizResult> {
    try {
      console.log('Envoi de la tentative de quiz:', {
        quizId,
        attempt: {
          ...attempt,
          answers: attempt.answers, // Afficher les réponses (peut être volumineux)
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        }
      });

      let response: AxiosResponse<QuizResult>;
      try {
        console.log('Envoi de la requête de soumission du quiz:', {
          url: `quizzes/${quizId}/submit`,
          data: {
            ...attempt,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
          }
        });
        
        response = await apiService.post(
          `quizzes/${quizId}/submit`,
          {
            ...attempt,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
          }
        ) as AxiosResponse<QuizResult>;

        console.log('Réponse de l\'API (brute):', response);
        console.log('Réponse de l\'API (données):', {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          hasData: !!response.data,
          dataType: typeof response.data,
          dataKeys: response.data ? Object.keys(response.data) : 'no data'
        });

        if (!response.data) {
          console.error('Aucune donnée dans la réponse de l\'API');
          throw new Error('Aucune donnée reçue du serveur');
        }

        // Vérifier si le score est défini et valide
        if (typeof response.data.score !== 'number' || isNaN(response.data.score)) {
          console.warn('Score invalide ou manquant dans la réponse:', response.data.score);
          // Essayer de calculer le score à partir des réponses correctes si disponibles
          if (response.data.correctAnswers && response.data.totalQuestions) {
            const calculatedScore = Math.round((response.data.correctAnswers / response.data.totalQuestions) * 100);
            console.log(`Score calculé à partir des réponses correctes: ${calculatedScore}%`);
            response.data.score = calculatedScore;
          }
        }

        return response.data;
      } catch (error: any) {
        console.error('Erreur lors de l\'appel API:', {
          message: error.message,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data: error.response.data
          } : 'Pas de réponse du serveur',
          request: error.request ? 'Requête effectuée mais pas de réponse' : 'Erreur lors de la requête',
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
        
        const statusCode = error.response?.status || 500;
        let errorMessage = 'Impossible de soumettre votre quiz';

        if (statusCode === 401) {
          errorMessage = 'Votre session a expiré. Veuillez vous reconnecter pour soumettre votre quiz.';
          localStorage.removeItem('authToken');
        } else if (statusCode === 403) {
          errorMessage = 'Vous n\'avez pas les permissions nécessaires pour soumettre ce quiz.';
        } else if (statusCode === 404) {
          errorMessage = 'Ce quiz n\'existe pas ou n\'est plus disponible.';
        } else if (statusCode === 422) {
          errorMessage = 'Données de quiz invalides. Veuillez vérifier vos réponses.';
        } else if (!error.response) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
        }

        throw new QuizError(
          errorMessage,
          statusCode,
          error
        );
      }

      return response.data;
    } catch (error: unknown) {
      console.error('submitQuizAttempt - Erreur:', error);
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;

      // Message d'erreur plus informatif en fonction du code d'état
      let errorMessage = 'Impossible de soumettre votre quiz';

      if (statusCode === 401) {
        errorMessage = 'Votre session a expiré. Veuillez vous reconnecter pour soumettre votre quiz.';
        localStorage.removeItem('authToken');
      } else if (statusCode === 403) {
        errorMessage = 'Vous n\'avez pas les permissions nécessaires pour soumettre ce quiz.';
      } else if (statusCode === 404) {
        errorMessage = 'Ce quiz n\'existe pas ou n\'est plus disponible.';
      } else if (statusCode === 422) {
        errorMessage = 'Données de quiz invalides. Veuillez vérifier vos réponses.';
      }

      throw new QuizError(
        errorMessage,
        statusCode,
        error
      );
    }
  }

  /**
   * Récupère les résultats d'un quiz spécifique pour un étudiant
   */
  async getStudentQuizResultsById(quizId: string, userId: string): Promise<QuizResult[]> {
    try {
      const response = await apiService.get<ApiResponse<QuizResult[]>>(
      `/quizzes/${quizId}/results/${userId}`
    );
    // @ts-ignore - Ignorer l'erreur TypeScript car nous savons que la réponse a cette structure
    if (!response.data.success) {
      throw new QuizError('Erreur lors de la récupération des résultats de l\'élève');
    }
    // @ts-ignore - Ignorer l'erreur TypeScript car nous savons que la réponse a cette structure
    return response.data.data;
    } catch (error) {
      throw new QuizError('Erreur lors de la récupération des résultats de l\'élève', 500, error);
    }
  }

  /**
   * Récupère l'historique de tous les résultats de quiz pour l'étudiant connecté
   * Cette méthode récupère les résultats depuis la table user_quiz_results
   */
  async getStudentQuizResults(): Promise<any[]> {
    try {
      console.log('getStudentQuizResults - Récupération de l\'historique des résultats');
      
      // Récupérer l'utilisateur connecté
      const userString = localStorage.getItem('user');
      if (!userString) {
        console.warn('getStudentQuizResults - Aucun utilisateur trouvé dans localStorage');
        throw new QuizError('Vous devez être connecté pour accéder à l\'historique des résultats', 401);
      }
      
      // Vérifier l'authentification
      const token = apiService.getAuthToken();
      console.log('Token d\'authentification:', token ? 'Présent' : 'Absent');
      
      if (!token) {
        console.warn('getStudentQuizResults - Aucun token d\'authentification trouvé');
        throw new QuizError('Vous devez être connecté pour accéder à l\'historique des résultats', 401);
      }
      
      let user;
      try {
        user = JSON.parse(userString);
        console.log('getStudentQuizResults - Utilisateur connecté:', user.id);
      } catch (e) {
        console.error('getStudentQuizResults - Erreur lors du parsing des données utilisateur:', e);
        throw new QuizError('Erreur lors de la récupération des informations utilisateur', 500);
      }
      
      // Essayer d'abord avec l'endpoint user_quiz_results
      const url = `/user-quiz-results?userId=${user.id}`;
      console.log(`getStudentQuizResults - Envoi de la requête API à ${url}`);
      
      try {
        const response = await apiService.get(
          url,
          { timeout: 15000 }
        ) as AxiosResponse<any>;

        console.log('getStudentQuizResults - Réponse reçue:', response);
        
        // Vérifier si la réponse contient les données attendues
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else {
          console.warn('getStudentQuizResults - Format de réponse inattendu:', response.data);
          return [];
        }
      } catch (innerError: any) {
        console.error(`Erreur avec l'URL ${url}:`, innerError);
        
        // Essayer avec le deuxième endpoint
        try {
          console.log('Tentative avec l\'URL /quizzes/student/history');
          const secondResponse = await apiService.get(
            '/quizzes/student/history',
            { timeout: 15000 }
          ) as AxiosResponse<any>;
          
          console.log('Réponse reçue avec l\'URL /quizzes/student/history:', secondResponse);
          
          if (secondResponse.data && Array.isArray(secondResponse.data)) {
            return secondResponse.data;
          } else if (secondResponse.data && secondResponse.data.data && Array.isArray(secondResponse.data.data)) {
            return secondResponse.data.data;
          }
        } catch (secondError) {
          console.error('Erreur avec l\'URL /quizzes/student/history:', secondError);
        }
        
        // Essayer avec le troisième endpoint
        try {
          console.log('Tentative avec l\'URL /quizzes/student/results');
          const thirdResponse = await apiService.get(
            '/quizzes/student/results',
            { timeout: 15000 }
          ) as AxiosResponse<any>;
          
          console.log('Réponse reçue avec l\'URL /quizzes/student/results:', thirdResponse);
          
          if (thirdResponse.data && Array.isArray(thirdResponse.data)) {
            return thirdResponse.data;
          } else if (thirdResponse.data && thirdResponse.data.data && Array.isArray(thirdResponse.data.data)) {
            return thirdResponse.data.data;
          }
        } catch (thirdError) {
          console.error('Erreur avec l\'URL /quizzes/student/results:', thirdError);
        }
        
        // Si toutes les tentatives échouent, retourner un tableau vide
        console.warn('getStudentQuizResults - Toutes les tentatives ont échoué, retour d\'un tableau vide');
        return [];
      }
    } catch (error: unknown) {
      console.error('getStudentQuizResults - Erreur détaillée:', error);
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new QuizError(
        'Impossible de récupérer l\'historique des résultats', 
        statusCode, 
        error
      );
    }
  }

  /**
   * Récupère les résultats d'un quiz
   */
  async getQuizResults(quizId: string, userId?: string): Promise<QuizResult[]> {
    try {
      console.log(`getQuizResults - Début de la récupération des résultats pour le quiz ${quizId}`);
      
      // Vérifier l'authentification
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('getQuizResults - Aucun token d\'authentification trouvé');
        throw new QuizError('Vous devez être connecté pour accéder aux résultats du quiz', 401);
      }
      
      // Récupérer les informations de l'utilisateur pour déterminer son rôle
      const userString = localStorage.getItem('user');
      let role = 'student'; // Rôle par défaut
      let currentUserId = userId;
      
      if (userString) {
        try {
          const user = JSON.parse(userString);
          role = user.role || 'student';
          // Si aucun userId n'est spécifié, utiliser l'ID de l'utilisateur connecté
          if (!currentUserId && user.id) {
            currentUserId = user.id;
          }
          console.log(`getQuizResults - Rôle de l'utilisateur: ${role}, ID: ${currentUserId}`);
        } catch (e) {
          console.error('getQuizResults - Erreur lors de la récupération du rôle:', e);
        }
      }

      // Construire l'URL complète avec les paramètres
      const endpoint = `api/v1/quizzes/${quizId}/results`;
      const queryParams = new URLSearchParams();
      
      // Ajouter les paramètres de requête
      if (currentUserId) {
        queryParams.append('userId', currentUserId.toString());
      }
      
      // Utiliser le rôle correct (etudiant au lieu de student)
      const userRole = role === 'student' ? 'etudiant' : role;
      queryParams.append('role', userRole);
      
      const fullUrl = `${API_CONFIG.baseUrl}/${endpoint}?${queryParams.toString()}`;
      
      console.log('=== DÉTAILS DE LA REQUÊTE ===');
      console.log('Méthode: GET');
      console.log('URL complète:', fullUrl);
      console.log('En-têtes:', {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer [TOKEN]' // Le token est ajouté par l'intercepteur
      });
      console.log('============================');

      // Variable pour stocker la réponse finale
      let finalResponse: AxiosResponse<any>;
      
      try {
        console.log('Envoi de la requête avec apiService...');
        
        // Utiliser l'instance apiService qui gère déjà l'authentification
        // Construire l'URL sans le préfixe /api/v1 car il est déjà inclus dans apiService
        const cleanEndpoint = endpoint.replace('/api/v1', '');
        
        // Créer une configuration pour la requête
        const requestConfig = {
          params: Object.fromEntries(queryParams.entries()),
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          withCredentials: true
        };
        
        console.log('Configuration de la requête:', {
          endpoint: cleanEndpoint,
          params: requestConfig.params,
          headers: requestConfig.headers
        });
        
        // Effectuer la requête avec apiService qui gère déjà l'authentification
        finalResponse = await apiService.get(cleanEndpoint, requestConfig);
      } catch (endpointError) {
        console.error('getQuizResults - Erreur lors de la récupération des résultats:', endpointError);
        throw new QuizError(
          'Erreur lors de la récupération des résultats. Veuillez vérifier votre connexion et réessayer.',
          500,
          endpointError
        );
      }

      console.log('getQuizResults - Réponse reçue:', finalResponse);
      
      // Gérer différents formats de réponse possibles
      let responseData: any[] = [];
      
      if (Array.isArray(finalResponse.data)) {
        responseData = finalResponse.data;
      } else if (finalResponse.data && typeof finalResponse.data === 'object') {
        if (Array.isArray(finalResponse.data.data)) {
          responseData = finalResponse.data.data;
        } else if (finalResponse.data.results && Array.isArray(finalResponse.data.results)) {
          responseData = finalResponse.data.results;
        }
      }
      
      console.log(`getQuizResults - ${responseData.length} résultats trouvés`);
      return responseData;
    } catch (error: unknown) {
      console.error('getQuizResults - Erreur:', error);
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      
      // Message d'erreur plus informatif en fonction du code d'état
      let errorMessage = 'Impossible de récupérer les résultats du quiz';
      
      if (statusCode === 401) {
        errorMessage = 'Votre session a expiré ou n\'est plus valide. Veuillez vous reconnecter pour accéder aux résultats du quiz.';
        // Nettoyer le localStorage pour forcer une nouvelle connexion
        localStorage.removeItem('authToken');
      } else if (statusCode === 403) {
        errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder à ces résultats.';
      } else if (statusCode === 404) {
        errorMessage = 'Les résultats de ce quiz n\'ont pas été trouvés.';
      }
      
      throw new QuizError(
        errorMessage, 
        statusCode, 
        error
      );
    }
  }

  /**
   * Récupère tous les quiz disponibles pour un étudiant
        metadata: {
          ...(normalizedQuiz.metadata || {}),
          totalSubmissions: typeof quiz.totalSubmissions === 'number' ? quiz.totalSubmissions : 0,
          averageScore: typeof quiz.averageScore === 'number' ? quiz.averageScore : undefined,
   */
  async submitQuizFeedback(
    quizId: string,
    attemptId: string,
    feedback: Omit<QuizFeedback, 'id' | 'createdAt'>
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiService.post(
        `quizzes/${quizId}/attempts/${attemptId}/feedback`,
        {
          ...feedback,
          createdAt: new Date().toISOString()
        },
        { timeout: 8000 }
      ) as AxiosResponse<ApiResponse<{ success: boolean }>>;

      const responseData = response.data;
      
      return { success: responseData.success };
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new QuizError('Failed to submit quiz feedback', statusCode, error);
    }
  }

  /**
   * Récupère la liste des quiz d'un enseignant
   * @param courseId Optionnel - Filtre par ID de cours
   * @returns Un tableau de quiz de l'enseignant connecté
   */
  async getTeacherQuizzes(courseId?: number): Promise<Quiz[]> {
    try {
      console.log('Récupération des quiz de l\'enseignant...');
      
      // Construire les paramètres de requête
      const params: Record<string, any> = {};
      if (courseId) {
        params.course_id = courseId;
      }
      
      // Essayer d'abord l'endpoint standard pour les quiz
      // Le backend devrait filtrer selon le rôle de l'utilisateur connecté
      console.log('🔍 Tentative avec l\'endpoint standard /quizzes');
      let response;
      
      try {
        // Essayer l'endpoint standard d'abord
        response = await apiService.get('quizzes', { params });
        console.log('✅ Réponse reçue de /quizzes:', response);
      } catch (standardError) {
        console.log('❌ Échec avec /quizzes, tentative avec /quizzes/teacher');
        try {
          // Si l'endpoint standard échoue, essayer /quizzes/teacher
          response = await apiService.get('quizzes/teacher', { params });
          console.log('✅ Réponse reçue de /quizzes/teacher:', response);
        } catch (teacherError) {
          console.log('❌ Échec avec /quizzes/teacher, tentative avec /teacher/quizzes');
          // Dernier essai avec /teacher/quizzes
          response = await apiService.get('teacher/quizzes', { params });
          console.log('✅ Réponse reçue de /teacher/quizzes:', response);
        }
      }
      
      // Gérer différents formats de réponse
      let responseData: any[] = [];
      
      if (Array.isArray(response)) {
        // Si la réponse est directement un tableau
        responseData = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        // Si la réponse suit le format ApiResponse standard
        responseData = Array.isArray((response as any).data) ? (response as any).data : [];
      }
      
      console.log('Quiz de l\'enseignant reçus:', responseData);
      
      // S'assurer que nous avons un tableau
      const quizzes = Array.isArray(responseData) ? responseData : [];
      console.log(`🔍 getTeacherQuizzes - ${quizzes.length} quiz(s) récupéré(s) depuis l'API`);
      
      // Enrichir chaque quiz avec ses questions complètes
      const enrichedQuizzes = await Promise.all(
        quizzes.map(async (quiz, index) => {
          console.log(`🔍 Quiz ${index + 1} - Données brutes:`, quiz);
          
          try {
            // Récupérer les détails complets du quiz (avec questions)
            console.log(`🔄 Quiz ${index + 1} - Récupération des détails complets...`);
            const fullQuiz = await this.getQuiz(String(quiz.id));
            console.log(`✅ Quiz ${index + 1} - Détails récupérés:`, fullQuiz);
            console.log(`📊 Quiz ${index + 1} - Nombre de questions: ${fullQuiz.questions?.length ?? 0}`);
            
            // Analyser les données de soumissions disponibles
            console.log(`📊 Quiz ${index + 1} - Analyse des soumissions:`);
            console.log(`  - quiz.submissionsCount:`, (quiz as any).submissionsCount);
            console.log(`  - quiz.submissions:`, (quiz as any).submissions);
            console.log(`  - quiz.totalSubmissions:`, (quiz as any).totalSubmissions);
            console.log(`  - fullQuiz.metadata?.attemptsCount:`, fullQuiz.metadata?.attemptsCount);
            console.log(`  - fullQuiz.metadata?.totalSubmissions:`, fullQuiz.metadata?.totalSubmissions);
            console.log(`  - fullQuiz.submissionsCount:`, (fullQuiz as any).submissionsCount);
            
            // Déterminer le nombre de soumissions le plus fiable
            const submissionsCount = (quiz as any).submissionsCount ?? 
                                   (quiz as any).submissions?.length ?? 
                                   (quiz as any).totalSubmissions ?? 
                                   fullQuiz.metadata?.attemptsCount ?? 
                                   fullQuiz.metadata?.totalSubmissions ?? 
                                   (fullQuiz as any).submissionsCount ?? 0;
            
            console.log(`  - Nombre final de soumissions:`, submissionsCount);
            
            // Fusionner les métadonnées de la liste avec les détails complets
            return {
              ...fullQuiz,
              // Conserver certaines métadonnées spécifiques à la liste si elles existent
              metadata: {
                ...fullQuiz.metadata,
                courseName: quiz.courseName ?? fullQuiz.metadata?.courseName ?? '',
                lessonName: quiz.lessonName ?? fullQuiz.metadata?.lessonName ?? '',
                attemptsCount: submissionsCount,
                totalSubmissions: submissionsCount,
                averageScore: quiz.averageScore ?? fullQuiz.metadata?.averageScore ?? 0
              }
            };
            
          } catch (error) {
            console.warn(`⚠️ Quiz ${index + 1} - Impossible de récupérer les détails complets:`, error);
            
            // En cas d'erreur, utiliser les données de base avec questions vides
            const { questions = [], ...quizData } = quiz;
            
            return {
              ...quizData,
              id: String(quizData.id),
              courseId: String(quizData.courseId ?? quizData.lessonId),
              lessonId: quizData.lessonId,
              isPublished: quizData.isActive ?? true,
              settings: {
                timeLimit: 30,
                passingScore: quizData.passingScore ?? 70,
                showResults: true,
                allowRetries: true,
                shuffleQuestions: false,
                shuffleAnswers: false,
                showExplanations: true,
                showCorrectAnswers: true,
                showScore: true,
                requireFullScreen: false
              } as QuizSettings,
              metadata: {
                createdAt: quizData.createdAt ?? new Date().toISOString(),
                updatedAt: quizData.updatedAt ?? new Date().toISOString(),
                difficulty: 'intermediate',
                tags: [],
                categories: [],
                author: '',
                averageScore: (quizData as any).averageScore ?? 0,
                attemptsCount: (quizData as any).submissionsCount ?? 0,
                courseName: (quizData as any).courseName ?? '',
                lessonName: (quizData as any).lessonName ?? '',
                totalSubmissions: (quizData as any).submissionsCount ?? 0
              } as QuizMetadata,
              questions: Array.isArray(questions) ? questions : []
            };
          }
        })
      );
      
      console.log(`✅ getTeacherQuizzes - ${enrichedQuizzes.length} quiz(s) enrichi(s) avec succès`);
      return enrichedQuizzes;
      
    } catch (error) {
      console.error('Erreur lors de la récupération des quiz de l\'enseignant:', error);
      
      // Fallback: essayer de récupérer via les cours de l'enseignant
      console.log('🔄 Tentative de fallback via les cours de l\'enseignant');
      try {
        const coursesResponse = await apiService.get('courses/teacher');
        console.log('📚 Cours de l\'enseignant:', coursesResponse);
        
        // Si on a des cours, essayer de récupérer les quiz pour chaque cours
        if (Array.isArray(coursesResponse) && coursesResponse.length > 0) {
          const allQuizzes: any[] = [];
          
          for (const course of coursesResponse) {
            try {
              const courseQuizzes = await apiService.get(`courses/${course.id}/quizzes`);
              if (Array.isArray(courseQuizzes)) {
                allQuizzes.push(...courseQuizzes);
              }
            } catch (courseError) {
              console.warn(`Erreur lors de la récupération des quiz pour le cours ${course.id}:`, courseError);
            }
          }
          
          console.log('🎆 Quiz récupérés via fallback:', allQuizzes);
          return allQuizzes.map(quiz => this.normalizeQuiz(quiz));
        }
      } catch (fallbackError) {
        console.error('Erreur lors du fallback:', fallbackError);
      }
      
      // En cas d'échec complet, retourner un tableau vide
      return [];
    }
  }

  /**
   * Publie ou dépublie un quiz
   * @param quizId ID du quiz à publier/dépublier
   * @param isPublished true pour publier, false pour dépublier
   * @returns Réponse de l'API avec le statut mis à jour
   */
  async toggleQuizPublication(quizId: string | number, isPublished: boolean): Promise<{ id: string | number; title: string; isPublished: boolean; message: string }> {
    try {
      console.log(`${isPublished ? 'Publication' : 'Dépublication'} du quiz ${quizId}...`);
      
      const response = await apiService.patch(
        `quizzes/${quizId}/publish`,
        { isPublished, is_active: isPublished }, // Envoyer les deux formats pour compatibilité
        { timeout: 8000 }
      );
      
      console.log('Réponse de publication/dépublication:', response);
      return response;
      
    } catch (error: unknown) {
      console.error('Erreur lors de la publication/dépublication du quiz:', error);
      
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      let errorMessage = `Erreur lors de la ${isPublished ? 'publication' : 'dépublication'} du quiz`;
      
      if (statusCode === 401) {
        errorMessage = 'Authentification requise';
      } else if (statusCode === 403) {
        errorMessage = 'Vous n\'avez pas les permissions pour modifier ce quiz';
      } else if (statusCode === 404) {
        errorMessage = 'Quiz non trouvé';
      }
      
      throw new QuizError(errorMessage, statusCode, error);
    }
  }

  /**
   * Récupère la liste des quiz disponibles pour l'étudiant connecté
   * @param courseId Optionnel - Filtre par ID de cours
   */
  async getAvailableQuizzes(courseId?: number): Promise<Quiz[]> {
    try {
      console.log('Récupération des quiz disponibles...');
      
      // Construire les paramètres de requête
      const params: Record<string, any> = {};
      if (courseId) {
        params.course_id = courseId;
      }
      
      // Appeler l'endpoint du backend
      const response = await apiService.get('quizzes/student/available', { params });
      
      // Gérer différents formats de réponse
      let responseData: any[] = [];
      
      if (Array.isArray(response)) {
        // Si la réponse est directement un tableau
        responseData = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        // Si la réponse suit le format ApiResponse standard
        responseData = Array.isArray((response as any).data) ? (response as any).data : [];
      }
      
      console.log('Données reçues du serveur:', responseData);
      
      // S'assurer que nous avons un tableau
      const quizzes = Array.isArray(responseData) ? responseData : [];
      return quizzes.map(quiz => {
        // Extraire les propriétés du quiz
        const { settings = {}, metadata = {}, ...quizData } = quiz;
        
        // Créer un nouvel objet de quiz avec les valeurs par défaut
        return {
          ...quizData,
          id: String(quizData.id), // S'assurer que l'ID est une chaîne
          courseId: String(quizData.courseId),
          settings: {
            timeLimit: 30,
            passingScore: 70, // Valeur par défaut
            showResults: true,
            allowRetries: true,
            shuffleQuestions: false,
            shuffleAnswers: false,
            showExplanations: true,
            showCorrectAnswers: true,
            showScore: true,
            requireFullScreen: false,
            ...settings // Écraser avec les paramètres du serveur si fournis
          } as QuizSettings,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            difficulty: 'intermediate',
            tags: [],
            categories: [],
            author: '',
            averageScore: 0,
            attemptsCount: 0,
            ...metadata // Écraser avec les métadonnées du serveur si fournies
          } as QuizMetadata,
          questions: Array.isArray(quizData.questions) ? quizData.questions : []
        };
      });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des quiz disponibles:', error);
      // En cas d'erreur, retourner un tableau vide
      return [];
    }
  }



  /**
   * Récupère l'historique des résultats récents du quiz de l'étudiant connecté
   * Utilise l'endpoint /student/results qui renvoie une réponse formatée
   */
  async getRecentQuizResults(): Promise<QuizResult[]> {
    try {
      // Appeler l'endpoint qui utilise le token d'authentification pour identifier l'utilisateur
      const response = await apiService.get<ApiResponse<QuizResult[]>>('quizzes/student/results');
      
      // Vérifier si la réponse est valide
      if (!response.success || !response.data) {
        console.warn('Réponse du serveur invalide ou vide:', response);
        return [];
      }
      
      // Retourner les données
      return response.data;
      
    } catch (error: any) {
      console.error('Error fetching recent quiz results:', error);
      
      // Gestion des erreurs spécifiques
      let statusCode = 500;
      let errorMessage = 'Erreur lors de la récupération des résultats récents';
      
      if (error.response) {
        statusCode = error.response.status;
        
        if (statusCode === 401) {
          errorMessage = 'Vous devez être connecté pour accéder à vos résultats';
        } else if (statusCode === 404) {
          errorMessage = 'Aucun résultat récent trouvé';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.statusCode) {
        statusCode = error.statusCode;
      }
      
      throw new QuizError(errorMessage, statusCode, error);
    }
  }

  /**
   * Récupère les analyses d'un quiz pour un cours
   */
  async getQuizAnalytics(courseId: string): Promise<QuizAnalytics[]> {
    try {
      const response = await apiService.get(`courses/${courseId}/analytics/quizzes`,
        { timeout: 10000 }
      ) as AxiosResponse<ApiResponse<QuizAnalytics[]>>;
      
      const responseData = response.data;

      if (!responseData.success) {
        throw new QuizError(
          responseData.message || 'Failed to fetch quiz analytics',
          500,
          responseData.error
        );
      }

      if (!responseData.data || !Array.isArray(responseData.data)) {
        throw new QuizError(
          'Invalid quiz analytics format',
          500
        );
      }

      return responseData.data;
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status || 500;
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch quiz analytics';
      
      throw new QuizError(
        errorMessage,
        status,
        error
      );
    }
  }

  /**
   * Creates an empty quiz with default values
   */
  private createEmptyQuiz(): Quiz {
    const emptyMetadata: QuizMetadata = {
      difficulty: 'beginner',
      category: 'general',
      tags: [],
      author: '',
      version: '1.0.0',
      language: 'fr',
      isPublic: false,
      requiresAuthentication: true,
      createdAt: new Date().toISOString(),
      averageScore: 0,
      attemptsCount: 0,
      averageTimeSpent: 0
    };

    return {
      id: '',
      title: 'Nouveau Quiz',
      description: '',
      courseId: '',
      questions: [],
      settings: {
        passingScore: 70,
        showResults: true,
        allowRetries: true,
        shuffleQuestions: false,
        shuffleAnswers: false,
        showExplanations: true,
        showCorrectAnswers: true,
        showScore: true,
        requireFullScreen: false
      },
      metadata: emptyMetadata,
      version: '1.0',
      isPublished: false
    } as Quiz;
  }
  

  /**
   * Normalise les données d'un quiz pour assurer la conformité avec l'interface Quiz
   */
  /**
      return this.createEmptyQuiz();
    }
  }

  // If it's not an object after processing, create an empty quiz
  if (typeof quizData !== 'object' || quizData === null) {
    console.warn('normalizeQuiz - Format de données invalide, pas un objet');
    return this.createEmptyQuiz();
  }

  const rawQuiz = quizData as Record<string, unknown>;

  /**
   * Normalize quiz data to ensure it matches the Quiz interface
   * @param quizData Raw quiz data to normalize
   * @returns Normalized Quiz object
   */
  /**
   * Normalise un type de question vers un type valide
   * @param rawType Type de question à normaliser (peut être en kebab-case ou autre format)
   * @returns Un type de question valide
   */
  private normalizeQuestionType(rawType: unknown): QuestionType {
    // Mappage des types de questions vers les types valides
    const typeMappings: Record<string, QuestionType> = {
      'multiple_choice': 'multiple_choice',
      'multiple-choice': 'multiple_choice',
      'single_choice': 'single_choice',
      'single-choice': 'single_choice',
      'true_false': 'true_false',
      'true-false': 'true_false',
      'text': 'text',
      'code': 'code',
      'matching': 'matching',
      'ordering': 'ordering',
      'single': 'single',
      'multiple': 'multiple'
    };
    
    if (typeof rawType === 'string') {
      // Normalise la chaîne en minuscules et remplace les tirets par des underscores
      const normalized = rawType
        .toLowerCase()
        .replace(/-/g, '_');
      
      // Retourne le type mappé ou le type par défaut
      return typeMappings[normalized] || 'multiple_choice';
    }
    
    // Retourne une valeur par défaut si le type n'est pas une chaîne valide
    return 'multiple_choice';
  }

  /**
   * Traite les options d'une question
   */
  private processQuestionOptions(options: any[]): QuestionOption[] {
    return options.map((opt, idx) => ({
      id: typeof opt.id === 'string' ? opt.id : `opt-${Date.now()}-${idx}`,
      text: typeof opt.text === 'string' ? opt.text : '',
      isCorrect: typeof opt.isCorrect === 'boolean' ? opt.isCorrect : false
    }));
  }

  /**
   * Normalise les métadonnées d'une question
   */
  private normalizeQuestionMetadata(raw: unknown): Record<string, any> {
    if (typeof raw === 'object' && raw !== null) {
      return raw as Record<string, any>;
    }
    return {};
  }

  private normalizeQuiz(quizData: unknown): Quiz {
    // Si les données d'entrée sont invalides, retourne un quiz vide
    if (!quizData) {
      console.warn('normalizeQuiz - Données de quiz vides ou non définies, retour d\'un quiz vide');
      return this.createEmptyQuiz();
    }

    // Si c'est déjà un objet Quiz, on le retourne tel quel
    if (typeof quizData === 'object' && quizData !== null && 'id' in quizData) {
      return quizData as Quiz;
    }

    // Si c'est une réponse d'API avec une propriété data
    let rawData = quizData;
    if (typeof quizData === 'object' && quizData !== null && 'data' in quizData) {
      const response = quizData as { data?: unknown };
      rawData = response.data || {};
    }

    // Si après extraction, ce n'est toujours pas un objet, on crée un quiz vide
    if (typeof rawData !== 'object' || rawData === null) {
      console.warn('normalizeQuiz - Format de données invalide, pas un objet');
      return this.createEmptyQuiz();
    }

    const rawQuiz = rawData as Record<string, unknown>;
    console.log('Normalizing quiz with raw data:', JSON.stringify(rawQuiz, null, 2));

    // Les métadonnées et paramètres sont extraits directement dans l'objet retourné plus bas
    // pour éviter les déclarations de variables inutilisées

    // Traiter les questions
    const questions: Question[] = [];
    if (Array.isArray(rawQuiz.questions)) {
      console.log(`normalizeQuiz - Traitement de ${rawQuiz.questions.length} questions`);
      
      rawQuiz.questions.forEach((q: unknown, index: number) => {
        if (typeof q !== 'object' || q === null) {
          console.warn(`normalizeQuiz - Question ${index + 1} a un format invalide`);
          return;
        }

        const question = q as Record<string, unknown>;

        // Déterminer le texte de la question
        const questionText = typeof question.text === 'string' ? question.text :
                           typeof question.question === 'string' ? question.question :
                           typeof question.question_text === 'string' ? question.question_text :
                           '';

        // Déterminer le type de question
        const questionType = this.normalizeQuestionType(
          (question.type || question.question_type || 'multiple_choice') as string
        );

        // Traiter les options de la question
        let options: QuestionOption[] = [];
        if (Array.isArray(question.options)) {
          options = this.processQuestionOptions(question.options);
        } else {
          console.warn(`normalizeQuiz - La question ${index + 1} n'a pas d'options ou le format est invalide`);
        }

        // Déterminer les réponses correctes
        let correctAnswers: string[] = [];
        if (Array.isArray(question.correctAnswers)) {
          correctAnswers = question.correctAnswers
            .filter((answer): answer is string => typeof answer === 'string');
        } else if (question.correctAnswer !== undefined) {
          // Support pour une seule réponse correcte
          correctAnswers = [String(question.correctAnswer)];
        } else if (options.length > 0) {
          // Si pas de réponses correctes spécifiées, utiliser les options marquées comme correctes
          correctAnswers = options
            .filter(opt => opt.isCorrect)
            .map(opt => String(opt.id));
        }

        questions.push({
          id: typeof question.id === 'string' || typeof question.id === 'number' 
            ? String(question.id) 
            : `q-${Date.now()}-${index}`,
          type: questionType,
          text: questionText,
          description: typeof question.description === 'string' ? question.description : '',
          codeSnippet: typeof question.codeSnippet === 'string' ? question.codeSnippet : '',
          options: options,
          correctAnswers: correctAnswers,
          explanation: typeof question.explanation === 'string' ? question.explanation : '',
          points: typeof question.points === 'number' ? question.points : 1,
          metadata: this.normalizeQuestionMetadata(question.metadata)
        });
      });
    } else {
      console.warn('normalizeQuiz - No questions found in quiz data');
    }

    // Normaliser les métadonnées
    const normalizedMetadata = this.normalizeQuestionMetadata(rawQuiz.metadata);

    // Create normalized quiz object with default values
    const normalizedQuiz: Quiz = {
      id: rawQuiz.id ? String(rawQuiz.id) : `quiz-${Date.now()}`,
      title: typeof rawQuiz.title === 'string' ? rawQuiz.title : 'Untitled Quiz',
      description: typeof rawQuiz.description === 'string' ? rawQuiz.description : '',
      courseId: typeof rawQuiz.courseId === 'string' ? rawQuiz.courseId : '',
      questions: questions,
      settings: {
        timeLimit: 0,
        passingScore: 70,
        showResults: true,
        allowRetries: false,
        shuffleQuestions: false,
        shuffleAnswers: false,
        showExplanations: false,
        showCorrectAnswers: false,
        showScore: true,
        requireFullScreen: false,
        ...(rawQuiz.settings && typeof rawQuiz.settings === 'object' 
          ? rawQuiz.settings as Partial<Quiz['settings']> 
          : {})
      },
      metadata: {
        difficulty: 'beginner',
        category: 'general',
        tags: [],
        author: '',
        version: '1.0.0',
        language: 'fr',
        isPublic: false,
        requiresAuthentication: true,
        createdAt: new Date().toISOString(),
        averageScore: 0,
        attemptsCount: 0,
        averageTimeSpent: 0,
        ...(normalizedMetadata as Record<string, unknown>)
      },
      version: typeof rawQuiz.version === 'string' ? rawQuiz.version : '1.0',
      isPublished: typeof rawQuiz.isPublished === 'boolean' ? rawQuiz.isPublished : false
    };

    return normalizedQuiz;
  }

  /**
   * Récupère un quiz par son ID
   */
  async getQuizById(quizId: string): Promise<Quiz> {
    try {
      // Définir le type de réponse attendu
      interface QuizApiResponse {
        data: QuizResponse;
      }
      
      const response = await apiService.get<QuizResponse | QuizApiResponse>(`quizzes/${quizId}`);
      
      // Vérifier si la réponse est de type QuizApiResponse
      const responseData = 'data' in response ? response.data : response;
      
      if (!responseData) {
        throw new QuizError('Impossible de récupérer le quiz mis à jour', 500);
      }
      
      return this.normalizeQuiz(responseData);
    } catch (error) {
      console.error('Erreur lors de la récupération du quiz:', error);
      throw new QuizError('Erreur lors de la récupération du quiz mis à jour', 500, error);
    }
  }

  /**
   * Met à jour un quiz existant
   */
  async updateQuiz(quizId: string, quizData: any): Promise<Quiz> {
    console.group('🔄 updateQuiz - Début');
    try {
      console.log(`📌 ID du quiz: ${quizId}`);
      console.log('📥 Données reçues:', JSON.stringify(quizData, null, 2));
      
      // Vérifier que l'ID du quiz est valide
      if (!quizId) {
        const error = new QuizError('ID de quiz manquant', 400);
        console.error('❌ Erreur:', error.message);
        throw error;
      }
      
      // Vérifier que nous avons des données à mettre à jour
      if (!quizData) {
        const error = new QuizError('Aucune donnée fournie pour la mise à jour', 400);
        console.error('❌ Erreur:', error.message);
        throw error;
      }

      // Valider les données requises
      if (!quizData.title || typeof quizData.title !== 'string') {
        throw new QuizError('Le titre du quiz est requis et doit être une chaîne de caractères', 400);
      }

      // Rendre lessonId optionnel en vérifiant s'il est défini avant de le convertir
      const lessonId = quizData.lessonId !== undefined && quizData.lessonId !== null 
        ? parseInt(String(quizData.lessonId))
        : null;
      
      // Définir les types pour les questions et options
      interface QuizOptionInput {
        id?: number;
        text: string;
        is_correct?: boolean;
        isCorrect?: boolean;
        order_index?: number;
      }

      interface QuizQuestionInput {
        id?: number;
        text: string;
        type?: string;
        order_index?: number;
        points?: number;
        options?: QuizOptionInput[];
      }
      
      interface QuizOptionOutput {
        id: string;
        text: string;
        is_correct: boolean;
        order_index: number;
      }
      
      interface QuizQuestionOutput {
        id?: number;
        text: string;
        type: string;
        order_index: number;
        points: number;
        options: QuizOptionOutput[];
      }

      // Préparer les questions pour l'API
      const formattedQuestions = (quizData.questions || []).map((q: QuizQuestionInput, index: number): QuizQuestionOutput => {
        // Valider la question
        if (!q.text || typeof q.text !== 'string') {
          throw new QuizError(`Le texte de la question ${index + 1} est requis et doit être une chaîne de caractères`, 400);
        }

        // Valider les options
        if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
          throw new QuizError(`La question "${q.text}" doit avoir au moins une option`, 400);
        }
        
        // Mapper les types de questions du frontend vers le backend
        let questionType = q.type ? q.type.toLowerCase() : 'single';
        
        // Conversion des types frontend vers backend
        const typeMapping: Record<string, string> = {
          'multiple_choice': 'single', // Choix unique
          'multiple_select': 'multiple', // Choix multiples
          'text_input': 'text', // Réponse libre
          'single': 'single',
          'multiple': 'multiple',
          'text': 'text'
        };
        
        questionType = typeMapping[questionType] || 'single';
        
        if (!['single', 'multiple', 'text'].includes(questionType)) {
          throw new QuizError(`Le type de question "${q.type}" n'est pas valide. Les types valides sont: single, multiple, text`, 400);
        }

        // Vérifier qu'il y a au moins une réponse correcte pour les questions à choix
        if (questionType !== 'text') {
          const hasCorrectAnswer = q.options.some((opt: any) => opt.isCorrect || opt.correct || opt.is_correct);
          if (!hasCorrectAnswer) {
            throw new QuizError(`La question "${q.text}" doit avoir au moins une réponse correcte`, 400);
          }
        }

        const options = q.options.map((opt: any, optIndex: number) => {
          if (!opt.text || typeof opt.text !== 'string') {
            throw new QuizError(`Le texte de l'option ${optIndex + 1} de la question "${q.text}" est requis`, 400);
          }
          
          // Pour les questions de type texte, ignorer le statut is_correct
          const isCorrect = questionType === 'text' 
            ? false 
            : Boolean(opt.isCorrect || opt.correct || opt.is_correct || false);
          
          return {
            id: opt.id ? String(opt.id) : `opt-${Date.now()}-${index}-${optIndex}`,
            text: opt.text.trim(),
            is_correct: isCorrect,
            order_index: optIndex + 1
          } as QuizOptionOutput;
        });
        
        console.log(`📝 Question ${index + 1}:`, {
          id: q.id,
          text: q.text,
          type: q.type,
          options: options.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.isCorrect
          }))
        });
        
        return {
          id: q.id ? parseInt(String(q.id)) : undefined,
          text: q.text.trim(),
          type: questionType, // Utiliser le type mappé
          order_index: index + 1,
          points: typeof q.points === 'number' ? q.points : 1,
          options
        };
      });
      
      // S'assurer que courseId est défini
      const courseId = quizData.courseId || quizData.course_id;
      if (!courseId) {
        throw new QuizError('L\'ID du cours est requis', 400);
      }

      // Préparer les données pour l'API en suivant exactement le schéma attendu
      const updateData = {
        id: Number(quizId),
        title: String(quizData.title || 'Quiz sans titre').trim(),
        description: String(quizData.description || '').trim(),
        courseId: Number(courseId),
        lessonId: lessonId,
        timeLimit: Number(quizData.timeLimit || 30),
        passingScore: Number(quizData.passingScore || 60),
        isPublished: Boolean(quizData.isPublished || quizData.status === 'published' || false),
        questions: formattedQuestions.map((q: QuizQuestionOutput, index: number) => ({
          id: String(q.id || `q-${Date.now()}-${index}`),
          text: String(q.text || `Question ${index + 1}`).trim(),
          type: (() => {
            const originalType = String(q.type || 'single').toLowerCase();
            const typeMapping: Record<string, string> = {
              'multiple_choice': 'single',
              'multiple_select': 'multiple', 
              'text_input': 'text',
              'single': 'single',
              'multiple': 'multiple',
              'text': 'text'
            };
            return typeMapping[originalType] || 'single';
          })(),
          order_index: index + 1,
          points: Number(q.points || 1),
          options: q.options.map((opt: QuizOptionOutput, optIndex: number) => ({
            id: String(opt.id || `opt-${Date.now()}-${index}-${optIndex}`),
            text: String(opt.text).trim(),
            isCorrect: Boolean(opt.is_correct || (opt as any).isCorrect || false),
            order_index: optIndex + 1
          }))
        }))
      };
      
      console.log('📤 Données à envoyer à l\'API:', JSON.stringify(updateData, null, 2));
      
      // Type de réponse attendu
      interface QuizApiResponse {
        data: QuizResponse;
        status: number;
      }

      try {
        console.log('🌐 Envoi de la requête PUT à l\'API...');
        
        // Valider les données avant envoi
        if (!updateData.questions || updateData.questions.length === 0) {
          throw new QuizError('Le quiz doit contenir au moins une question', 400);
        }
        
        // S'assurer que le passingScore est entre 0 et 100
        if (updateData.passingScore < 0 || updateData.passingScore > 100) {
          throw new QuizError('Le score de passage doit être compris entre 0 et 100', 400);
        }
        
        // S'assurer que le timeLimit est positif
        if (updateData.timeLimit < 0) {
          throw new QuizError('La durée du quiz doit être un nombre positif', 400);
        }
        
        const response = await apiService.put<QuizApiResponse>(`quizzes/${quizId}`, updateData);
        
        // Vérifier si la réponse est vide
        if (!response) {
          const error = new QuizError('Aucune réponse reçue du serveur', 500);
          console.error('❌ Erreur:', error.message);
          throw error;
        }
        
        // Le backend renvoie directement l'objet quiz, pas dans une structure { data: ... }
        const responseData = response as unknown as QuizResponse;
        
        console.log('✅ Réponse du serveur:', {
          id: responseData.id,
          title: responseData.title,
          hasQuestions: !!(responseData.questions && responseData.questions.length > 0)
        });
        
        // Vérifier si les données sont valides
        if (!responseData || !responseData.id) {
          throw new QuizError('Données de réponse invalides', 500);
        }
        
        // Normaliser et mettre en cache le quiz mis à jour
        const updatedQuiz = this.normalizeQuiz(responseData);
        this.cacheQuiz(updatedQuiz);
        
        console.log('✅ Quiz mis à jour avec succès:', updatedQuiz);
        return updatedQuiz;
      } catch (apiError: any) {
        console.error('❌ Erreur lors de l\'appel API:', apiError);
        
        // Si l'erreur contient une réponse du serveur, essayer de la traiter
        if (apiError.response) {
          console.error('Détails de l\'erreur:', {
          status: apiError.response.status,
          data: apiError.response.data,
          headers: apiError.response.headers
        });
        
        // Log détaillé de la réponse d'erreur pour debug
        console.error('🔍 Réponse d\'erreur complète:', JSON.stringify(apiError.response.data, null, 2));
          
          // Si le serveur a répondu avec un statut 200 mais que la réponse est vide
          if (apiError.response.status === 200 && !apiError.response.data) {
            console.log('Le serveur a répondu avec succès mais sans données, tentative de récupération du quiz...');
            return this.getQuizById(quizId);
          }
          
          // Relancer l'erreur pour qu'elle soit gérée par le bloc catch externe
          throw apiError;
        }
        
        // Si c'est une erreur de réseau ou autre, relancer l'erreur
        throw apiError;
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la mise à jour du quiz ${quizId}:`, error);
      
      // Gestion des erreurs spécifiques
      if (error.response) {
        // Erreur de l'API (4xx, 5xx)
        const status = error.response.status;
        let message = 'Erreur inconnue';
        
        // Gestion des erreurs de validation 422
        if (status === 422 && error.response.data?.detail) {
          try {
            // Si c'est un tableau d'erreurs, on les formate
            if (Array.isArray(error.response.data.detail)) {
              message = error.response.data.detail
                .map((err: any) => {
                  if (typeof err === 'string') return err;
                  if (err.msg) return err.msg;
                  if (err.loc && err.msg) return `${err.loc.join('.')}: ${err.msg}`;
                  return JSON.stringify(err);
                })
                .join('\n');
            } else if (typeof error.response.data.detail === 'object') {
              // Si c'est un objet d'erreur, on le formate
              message = Object.entries(error.response.data.detail)
                .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                .join('\n');
            } else {
              // Sinon, on utilise le détail tel quel
              message = String(error.response.data.detail);
            }
          } catch (e) {
            console.error('Erreur lors du formatage des erreurs de validation:', e);
            message = 'Erreur de validation des données';
          }
        } else {
          // Pour les autres types d'erreurs
          message = error.response.data?.detail || 
                   error.response.data?.message || 
                   error.message || 
                   'Erreur inconnue';
        }
        
        if (status === 404) {
          throw new QuizError(`Le quiz avec l'ID ${quizId} n'existe pas`, status, error);
        } else if (status === 403) {
          throw new QuizError('Vous n\'avez pas les permissions pour modifier ce quiz', status, error);
        } else if (status === 400) {
          throw new QuizError(`Données invalides: ${message}`, status, error);
        } else if (status === 401) {
          throw new QuizError('Veuillez vous reconnecter', status, error);
        } else if (status === 422) {
          throw new QuizError(`Erreur de validation:\n${message}`, status, error);
        } else {
          throw new QuizError(
            `Erreur serveur (${status}): ${message}`,
            status,
            error
          );
        }
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        throw new QuizError(
          'Le serveur ne répond pas. Vérifiez votre connexion internet et réessayez.',
          0,
          error
        );
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        throw new QuizError(
          'Erreur lors de la configuration de la requête. Veuillez réessayer.',
          -1,
          error
        );
      }
    }
  }

  /**
   * Supprime un quiz par son ID
   * @param quizId ID du quiz à supprimer
   * @returns Un objet indiquant le succès de l'opération
   */
  async deleteQuiz(quizId: string): Promise<{ success: boolean }> {
    try {
      if (!quizId) {
        throw new QuizError('Aucun ID de quiz fourni', 400);
      }

      console.log(`Tentative de suppression du quiz ${quizId}`);
      await apiService.delete(`/quizzes/${quizId}`);
      
      // Supprimer le quiz du cache s'il y est
      this.quizCache.delete(quizId);
      
      console.log(`Quiz ${quizId} supprimé avec succès`);
      return { success: true };
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status || 500;
      const errorMessage = error instanceof Error ? error.message : 'Échec de la suppression du quiz';
      
      throw new QuizError(
        errorMessage,
        status,
        error
      );
    }
  }



  /**
   * Crée un nouveau quiz
   * @param quizData Données du quiz à créer
   * @returns Le quiz créé
   */
  async createQuiz(quizData: any): Promise<Quiz> {
    try {
      console.log('🆕 Création d\'un nouveau quiz');
      console.log('📝 Données reçues:', JSON.stringify(quizData, null, 2));
      
      // Format EXACT attendu par le backend (QuizCreate hérite de QuizBase)
      const createData = {
        title: quizData.title ?? 'Quiz sans titre',
        description: quizData.description ?? '',
        courseId: parseInt(String(quizData.courseId)) || 1,
        timeLimit: quizData.timeLimit ?? null,
        passingScore: quizData.passingScore ?? 60,
        dueDate: quizData.dueDate ?? null,
        isPublished: quizData.isPublished ?? false,
        questions: (quizData.questions || []).map((q: any) => ({
          id: q.id || String(Math.random()),
          text: q.text || q.question || '',
          type: q.type || 'single',
          options: (q.options || []).map((opt: any) => ({
            id: opt.id || String(Math.random()),
            text: opt.text || opt.label || '',
            isCorrect: Boolean(opt.isCorrect || opt.correct)
          }))
        }))
      };
      
      console.log('📝 Format pour création:', JSON.stringify(createData, null, 2));
      
      const response: AxiosResponse<Quiz> = await apiService.post('/quizzes', createData);
      console.log('✅ Quiz créé avec succès:', response.data);
      
      const createdQuiz = this.normalizeQuiz(response.data);
      this.cacheQuiz(createdQuiz);
      
      return createdQuiz;
    } catch (error: any) {
      console.error('❌ Erreur lors de la création du quiz:', error);
      throw new QuizError(
        'Erreur lors de la création du quiz. Veuillez réessayer plus tard.',
        error.response?.status || 500,
        error
      );
    }
  }
}

// Exporter une instance du service
export const quizService = new QuizService();
// Exposer le service en mode développement pour faciliter le débogage
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // @ts-ignore
  window.quizService = quizService;
}

// Exporter les types
export type { Quiz, Question, QuizAttempt, QuizResult, QuizFeedback };
