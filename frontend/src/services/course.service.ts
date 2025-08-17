import { apiService } from './api';
import API_CONFIG from '@/config/api';
import type { 
  CourseProgress, 
  CourseProgressSummary, 
  UpdateProgressPayload 
} from '../types/course';

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  thumbnail_url: string;
  status: string | { value: string }; // Peut être une chaîne ou un objet avec une propriété value
  price: number;
  created_at: string;
  updated_at: string;
  instructor_id: number;
  instructor?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  category_id: number | null;
  category?: {
    id: number;
    name: string;
    description?: string;
  };
  tags: Array<{ id: number; name: string }>;
  modules?: Array<{
    id: number;
    title: string;
    description: string | null;
    order: number;
  }>;
  // Champs supplémentaires pour la transformation
  image?: string;
  category_name?: string;
  instructor_name?: string;
  level?: string;
  duration?: number;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  type: string;
  duration: number;
  order: number;
  content: string;
  video_url?: string;
  module_id: number;
}

export interface Module {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface CourseWithModules extends Omit<Course, 'modules'> {
  modules: Module[];
}

class CourseService {
  private static instance: CourseService;
  
  private constructor() {}

  public static getInstance(): CourseService {
    if (!CourseService.instance) {
      CourseService.instance = new CourseService();
    }
    return CourseService.instance;
  }

  public async getCourses(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    level?: string;
    tag?: string;
  }): Promise<{ courses: Course[]; total: number }> {
    try {
      const response = await apiService.get<{ items: Course[]; total: number }>(
        API_CONFIG.ENDPOINTS.COURSES.BASE,
        { params }
      );
      return {
        courses: response.items,
        total: response.total,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des cours:', error);
      throw error;
    }
  }

  public async getCourseBySlug(slug: string): Promise<Course> {
    try {
      return await apiService.get<Course>(`${API_CONFIG.ENDPOINTS.COURSES.BASE}/slug/${slug}`);
    } catch (error) {
      console.error('Erreur lors de la récupération du cours:', error);
      throw error;
    }
  }

  public async getFeaturedCourses(): Promise<Course[]> {
    try {
      const response = await apiService.get<{ items: Course[] }>(
        API_CONFIG.ENDPOINTS.COURSES.FEATURED
      );
      return response.items;
    } catch (error) {
      console.error('Erreur lors de la récupération des cours à la une:', error);
      return [];
    }
  }

  public async searchCourses(query: string): Promise<Course[]> {
    try {
      const response = await apiService.get<{ items: Course[] }>(
        API_CONFIG.ENDPOINTS.COURSES.SEARCH,
        { params: { q: query } }
      );
      return response.items;
    } catch (error) {
      console.error('Erreur lors de la recherche de cours:', error);
      return [];
    }
  }

  public async enrollCourse(courseId: number): Promise<{ success: boolean }> {
    try {
      await apiService.post(`${API_CONFIG.ENDPOINTS.COURSES.BASE}/${courseId}/enroll`);
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'inscription au cours:', error);
      throw error;
    }
  }

  /**
   * Met à jour la progression d'une leçon pour l'utilisateur connecté
   * @param courseId ID du cours
   * @param lessonId ID de la leçon
   * @param isCompleted Si la leçon est marquée comme terminée
   * @param completionPercentage Pourcentage de complétion (0-100)
   */
  /**
   * Met à jour la progression d'une leçon pour l'utilisateur connecté
   * @param courseId ID du cours
   * @param lessonId ID de la leçon
   * @param payload Données de progression à mettre à jour
   */
  public async updateLessonProgress(
    courseId: number,
    lessonId: number,
    payload: UpdateProgressPayload
  ): Promise<{ success: boolean }> {
    try {
      await apiService.put(`/api/v1/progress/courses/${courseId}/lessons/${lessonId}/progress`, payload);
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error);
      throw error;
    }
  }

  /**
   * Récupère la progression d'un cours pour l'utilisateur connecté
   * @param courseId ID du cours
   */
  public async getCourseProgress(courseId: number): Promise<CourseProgress> {
    try {
      return await apiService.get(`/api/v1/progress/courses/${courseId}/progress`);
    } catch (error) {
      console.error('Erreur lors de la récupération de la progression du cours:', error);
      throw error;
    }
  }

  /**
   * Récupère un résumé de la progression de l'utilisateur dans tous ses cours
   */
  public async getUserProgressSummary(): Promise<CourseProgressSummary[]> {
    try {
      return await apiService.get('/api/v1/progress/my-progress');
    } catch (error) {
      console.error('Erreur lors de la récupération du résumé de progression:', error);
      return [];
    }
  }

  /**
   * Marque une leçon comme terminée
   */
  public async completeLesson(courseId: number, lessonId: number): Promise<{ success: boolean }> {
    return this.updateLessonProgress(courseId, lessonId, { 
      is_completed: true, 
      completion_percentage: 100 
    });
  }

  /**
   * Récupère les cours de l'enseignant
   */
  public async getTeacherCourses(): Promise<Course[]> {
    try {
      // L'endpoint pour récupérer les cours de l'enseignant est /courses/
      // Le préfixe /api/v1 est déjà inclus dans la configuration de base de l'API
      const response = await apiService.get<Course[]>('/courses/');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching teacher courses:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les cours (admin uniquement)
   */
  public async getAdminCourses(params: {
    skip?: number;
    limit?: number;
  } = {}): Promise<{ courses: Course[]; total: number }> {
    try {
      const response = await apiService.get<Course[]>('/courses/admin/courses', { params });
      
      // Si la réponse est un tableau, c'est la liste des cours
      if (Array.isArray(response)) {
        return {
          courses: response,
          total: response.length
        };
      }
      
      // Si la réponse a une structure différente, essayer de l'adapter
      const courses = (response as any)?.data || [];
      const total = (response as any)?.total || courses.length;
      
      return {
        courses,
        total: typeof total === 'string' ? parseInt(total) : total
      };
    } catch (error) {
      console.error('Error fetching admin courses:', error);
      throw error;
    }
  }

  /**
   * Récupère les détails complets d'un cours avec ses modules et leçons
   */
  public async getCourseWithModules(courseId: number): Promise<CourseWithModules> {
    try {
      // 1. Récupérer les informations de base du cours
      const courseData = await apiService.get<any>(`teacher/dashboard/courses/${courseId}`);
      
      // 2. Récupérer les modules du cours
      const modulesData = await apiService.get<any>(`teacher/dashboard/courses/${courseId}/modules`);
      
      // 3. Pour chaque module, récupérer ses leçons
      const modules = [];
      for (const moduleData of Array.isArray(modulesData) ? modulesData : []) {
        try {
          const lessonsData = await apiService.get<any>(
            `teacher/dashboard/courses/${courseId}/modules/${moduleData.id}/lessons`
          );
          
          const lessons = Array.isArray(lessonsData) ? lessonsData.map((lesson: any) => ({
            id: lesson.id,
            title: lesson.title || 'Leçon sans titre',
            description: lesson.description || '',
            type: lesson.video_url ? 'video' : (lesson.type || 'text'),
            duration: lesson.duration_minutes || lesson.duration || 0,
            order: lesson.order_index || lesson.order || 0,
            content: lesson.content || '',
            video_url: lesson.video_url || '',
            module_id: lesson.module_id || moduleData.id
          })) : [];
          
          modules.push({
            id: moduleData.id,
            title: moduleData.title || 'Module sans titre',
            description: moduleData.description || '',
            order: moduleData.order_index || moduleData.order || 0,
            lessons
          });
        } catch (lessonError) {
          console.warn(`Impossible de récupérer les leçons du module ${moduleData.id}:`, lessonError);
          // Ajouter le module même sans leçons
          modules.push({
            id: moduleData.id,
            title: moduleData.title || 'Module sans titre',
            description: moduleData.description || '',
            order: moduleData.order_index || moduleData.order || 0,
            lessons: []
          });
        }
      }
      
      return {
        ...courseData,
        modules: modules.sort((a, b) => a.order - b.order)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du cours avec modules:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau cours pour l'enseignant
   */
  public async createCourse(courseData: {
    title: string;
    description: string;
    short_description?: string;
    category_id?: number;
    level?: string;
    price?: number;
    thumbnail_url?: string;
    status?: 'draft' | 'published';
  }): Promise<{ id: number; title: string; message: string }> {
    try {
      const response = await apiService.post<{ id: number; title: string; message: string }>(
        'courses/create',
        courseData
      );
      return response;
    } catch (error) {
      console.error('Erreur lors de la création du cours:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau module pour un cours
   */
  public async createModule(courseId: number, moduleData: {
    title: string;
    description?: string;
    order_index: number;
  }): Promise<{ id: number; title: string; message: string }> {
    try {
      const response = await apiService.post<{ id: number; title: string; message: string }>(
        `courses/${courseId}/modules`,
        moduleData
      );
      return response;
    } catch (error) {
      console.error('Erreur lors de la création du module:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle leçon pour un module
   */
  public async createLesson(courseId: number, moduleId: number, lessonData: {
    title: string;
    description?: string;
    content?: string;
    video_url?: string;
    duration?: number;
    order_index: number;
    is_free?: boolean;
  }): Promise<{ id: number; title: string; message: string }> {
    try {
      const response = await apiService.post<{ id: number; title: string; message: string }>(
        `courses/${courseId}/modules/${moduleId}/lessons`,
        lessonData
      );
      return response;
    } catch (error) {
      console.error('Erreur lors de la création de la leçon:', error);
      throw error;
    }
  }

  /**
   * Crée un cours complet avec modules et leçons
   */
  public async createCourseWithContent(courseData: {
    // Informations de base du cours
    title: string;
    description: string;
    short_description?: string;
    category_id?: number;
    level?: string;
    price?: number;
    thumbnail_url?: string;
    status?: 'draft' | 'published';
    // Structure du cours
    modules: Array<{
      title: string;
      description?: string;
      lessons: Array<{
        title: string;
        description?: string;
        content?: string;
        video_url?: string;
        duration?: number;
        type?: 'video' | 'text' | 'quiz';
        is_free?: boolean;
      }>;
    }>;
  }): Promise<{ courseId: number; message: string }> {
    try {
      // 1. Créer le cours de base
      const courseResponse = await this.createCourse({
        title: courseData.title,
        description: courseData.description,
        short_description: courseData.short_description,
        category_id: courseData.category_id,
        level: courseData.level,
        price: courseData.price,
        thumbnail_url: courseData.thumbnail_url,
        status: courseData.status ?? 'draft'
      });

      const courseId = courseResponse.id;

      // 2. Créer les modules et leçons
      for (let moduleIndex = 0; moduleIndex < courseData.modules.length; moduleIndex++) {
        const moduleData = courseData.modules[moduleIndex];
        
        const moduleResponse = await this.createModule(courseId, {
          title: moduleData.title,
          description: moduleData.description,
          order_index: moduleIndex + 1
        });

        const moduleId = moduleResponse.id;

        // Créer les leçons du module
        for (let lessonIndex = 0; lessonIndex < moduleData.lessons.length; lessonIndex++) {
          const lessonData = moduleData.lessons[lessonIndex];
          
          await this.createLesson(courseId, moduleId, {
            title: lessonData.title,
            description: lessonData.description,
            content: lessonData.content,
            video_url: lessonData.video_url,
            duration: lessonData.duration,
            order_index: lessonIndex + 1,
            is_free: lessonData.is_free || false
          });
        }
      }

      return {
        courseId,
        message: `Cours "${courseData.title}" créé avec succès avec ${courseData.modules.length} modules`
      };
    } catch (error) {
      console.error('Erreur lors de la création du cours complet:', error);
      throw error;
    }
  }

  /**
   * Récupère les catégories disponibles pour la création de cours
   */
  public async getCategories(): Promise<Array<{ id: number; name: string; description?: string }>> {
    try {
      const response = await apiService.get<Array<{ id: number; name: string; description?: string }>>(
        'categories'
      );
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      // Retourner des catégories par défaut en cas d'erreur
      return [
        { id: 1, name: 'Programmation', description: 'Cours de développement et programmation' },
        { id: 2, name: 'Design', description: 'Cours de design et créativité' },
        { id: 3, name: 'Business', description: 'Cours de business et entrepreneuriat' },
        { id: 4, name: 'Marketing', description: 'Cours de marketing et communication' },
        { id: 5, name: 'Général', description: 'Cours généraux' }
      ];
    }
  }

  /**
   * Récupère les cours auxquels l'étudiant est inscrit
   */
  public async getStudentEnrolledCourses(): Promise<CourseWithModules[]> {
    try {
      const response = await apiService.get<CourseWithModules[]>('courses/student/enrolled');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des cours inscrits de l\'étudiant:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des cours auxquels l'étudiant n'est pas inscrit
   * @param params Paramètres de pagination et de filtrage
   * @returns Liste des cours non inscrits et nombre total
   */
  public async getUnenrolledCourses(params: {
    skip?: number;
    limit?: number;
  } = {}): Promise<{ courses: Course[]; total: number }> {
    try {
      const { skip = 0, limit = 10 } = params;
      
      console.log('Envoi de la requête pour les cours non inscrits avec les paramètres:', { skip, limit });
      
      // Utiliser POST avec les paramètres dans le corps
      const response = await apiService.post<Course[]>('/student/courses/unenrolled', {
        skip,
        limit
      });

      console.log('Réponse du backend (brute):', response);
      
      // Le backend renvoie directement un tableau de cours
      const courses = Array.isArray(response) 
        ? response.map(course => ({
            ...course,
            // S'assurer que le statut est une chaîne et non un objet CourseStatus
            status: course.status && typeof course.status === 'object' 
              ? course.status.value ?? 'published' 
              : String(course.status ?? 'published'),
            // Ajouter des valeurs par défaut pour les champs optionnels
            thumbnail_url: course.thumbnail_url ?? '',
            image: course.thumbnail_url ?? '',
            short_description: course.short_description ?? '',
            // Extraire le nom de la catégorie si c'est un objet
            category_name: course.category?.name ?? 'Non catégorisé',
            // Extraire le nom de l'instructeur si c'est un objet
            instructor_name: course.instructor 
              ? `${course.instructor.first_name ?? ''} ${course.instructor.last_name ?? ''}`.trim() || 'Instructeur inconnu'
              : 'Instructeur inconnu'
          }))
        : [];
      
      // Le total est la longueur de la liste des cours dans ce cas
      const total = courses.length;
      
      console.log('Cours non inscrits récupérés:', courses);
      console.log('Nombre total de cours non inscrits:', total);

      return {
        courses,
        total
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des cours non inscrits:', error);
      throw error;
    }
  }

  /**
   * Inscrit un étudiant à un cours
   */
  public async enrollInCourse(courseId: number): Promise<{
    success: boolean;
    message: string;
    course_id: number;
    course_title: string;
  }> {
    try {
const response = await apiService.post<{
        success: boolean;
        message: string;
        course_id: number;
        course_title: string;
      }>(`/student/enroll/${courseId}`, {});
      
      console.log(`Inscription réussie au cours ${courseId}:`, response);
      return response;
    } catch (error) {
      console.error(`Erreur lors de l'inscription au cours ${courseId}:`, error);
      throw error;
    }
  }
}

export const courseService = CourseService.getInstance();
