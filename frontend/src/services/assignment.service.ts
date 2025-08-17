import { apiService } from './api';
import type { AxiosResponse } from 'axios';

// Types pour les devoirs
export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName?: string;
  dueDate: string;
  totalPoints: number;
  attachments?: AssignmentAttachment[];
  createdAt: string;
  updatedAt: string;
  status?: AssignmentStatus;
  submissionCount?: number;
  gradedCount?: number;
}

export interface AssignmentAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  userName?: string;
  submittedAt: string;
  attachments: AssignmentAttachment[];
  comment?: string;
  grade?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  status: SubmissionStatus;
}

export type AssignmentStatus = 'active' | 'draft' | 'archived' | 'upcoming' | 'past';
export type SubmissionStatus = 'submitted' | 'graded' | 'late' | 'pending';

// Classe d'erreur personnalisée pour les erreurs liées aux devoirs
class AssignmentError extends Error {
  statusCode: number;
  originalError?: unknown;

  constructor(message: string, statusCode = 500, originalError?: unknown) {
    super(message);
    this.name = 'AssignmentError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Service pour gérer les interactions avec l'API des devoirs
 */
class AssignmentService {
  /**
   * Récupère tous les devoirs disponibles
   */
  async getAssignments(courseId?: string, status?: AssignmentStatus): Promise<Assignment[]> {
    try {
      const params: Record<string, string> = {};
      
      if (courseId) {
        params.courseId = courseId;
      }
      
      if (status) {
        params.status = status;
      }

      const response = await apiService.get('/api/v1/assignments', { params }) as AxiosResponse<Assignment[]>;
      return response.data;
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new AssignmentError('Failed to fetch assignments', statusCode, error);
    }
  }

  /**
   * Récupère un devoir par son ID
   */
  async getAssignment(assignmentId: string): Promise<Assignment> {
    try {
      if (!assignmentId) {
        throw new AssignmentError('Assignment ID is required', 400);
      }

      const response = await apiService.get(`/api/v1/assignments/${assignmentId}`) as AxiosResponse<Assignment>;
      return response.data;
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new AssignmentError('Failed to fetch assignment', statusCode, error);
    }
  }

  /**
   * Crée un nouveau devoir
   */
  async createAssignment(assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assignment> {
    try {
      const response = await apiService.post('/api/v1/assignments', assignment) as AxiosResponse<Assignment>;
      return response.data;
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new AssignmentError('Failed to create assignment', statusCode, error);
    }
  }

  /**
   * Met à jour un devoir existant
   */
  async updateAssignment(assignmentId: string, assignment: Partial<Assignment>): Promise<Assignment> {
    try {
      const response = await apiService.put(`/api/v1/assignments/${assignmentId}`, assignment) as AxiosResponse<Assignment>;
      return response.data;
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new AssignmentError('Failed to update assignment', statusCode, error);
    }
  }

  /**
   * Supprime un devoir
   */
  async deleteAssignment(assignmentId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiService.delete(`/api/v1/assignments/${assignmentId}`) as AxiosResponse<{ success: boolean }>;
      return response.data;
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new AssignmentError('Failed to delete assignment', statusCode, error);
    }
  }

  /**
   * Soumet un devoir
   */
  async submitAssignment(
    assignmentId: string, 
    submission: { 
      comment?: string, 
      attachments: File[] 
    }
  ): Promise<AssignmentSubmission> {
    try {
      // Créer un FormData pour l'envoi des fichiers
      const formData = new FormData();
      
      if (submission.comment) {
        formData.append('comment', submission.comment);
      }
      
      // Ajouter chaque fichier au formData
      submission.attachments.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      const response = await apiService.post(
        `/api/v1/assignments/${assignmentId}/submit`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      ) as AxiosResponse<AssignmentSubmission>;
      
      return response.data;
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new AssignmentError('Failed to submit assignment', statusCode, error);
    }
  }

  /**
   * Récupère les soumissions pour un devoir
   */
  async getSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    try {
      const response = await apiService.get(`/api/v1/assignments/${assignmentId}/submissions`) as AxiosResponse<AssignmentSubmission[]>;
      return response.data;
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new AssignmentError('Failed to fetch submissions', statusCode, error);
    }
  }

  /**
   * Récupère une soumission spécifique
   */
  async getSubmission(assignmentId: string, submissionId: string): Promise<AssignmentSubmission> {
    try {
      const response = await apiService.get(`/api/v1/assignments/${assignmentId}/submissions/${submissionId}`) as AxiosResponse<AssignmentSubmission>;
      return response.data;
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new AssignmentError('Failed to fetch submission', statusCode, error);
    }
  }

  /**
   * Note une soumission
   */
  async gradeSubmission(
    assignmentId: string, 
    submissionId: string, 
    gradeData: { 
      grade: number, 
      feedback?: string 
    }
  ): Promise<AssignmentSubmission> {
    try {
      const response = await apiService.put(
        `/api/v1/assignments/${assignmentId}/submissions/${submissionId}/grade`, 
        gradeData
      ) as AxiosResponse<AssignmentSubmission>;
      
      return response.data;
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new AssignmentError('Failed to grade submission', statusCode, error);
    }
  }

  /**
   * Récupère les devoirs pour un étudiant avec leur statut
   */
  async getStudentAssignments(status?: string): Promise<Assignment[]> {
    try {
      const params: Record<string, string> = {};
      
      if (status) {
        params.status = status;
      }

      const response = await apiService.get('/api/v1/assignments/student', { params }) as AxiosResponse<Assignment[]>;
      return response.data;
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new AssignmentError('Failed to fetch student assignments', statusCode, error);
    }
  }
}

// Exporter une instance du service
export const assignmentService = new AssignmentService();

// Exposer le service en mode développement pour faciliter le débogage
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore
  window.assignmentService = assignmentService;
}
