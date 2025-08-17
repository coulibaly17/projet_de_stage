import { apiService } from './api';
import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Types pour les discussions
export interface Discussion {
  id: string;
  title: string;
  courseId: string;
  courseName?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messageCount: number;
  tags: string[];
  isRead?: boolean;
  isPinned?: boolean;
  lastMessage?: DiscussionMessage;
}

export interface DiscussionMessage {
  id: string;
  discussionId: string;
  content: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  attachments?: MessageAttachment[];
  isRead?: boolean;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

export interface CreateDiscussionRequest {
  title: string;
  courseId: string;
  tags?: string[];
  initialMessage: string;
  attachments?: File[];
}

export interface AddMessageRequest {
  content: string;
  attachments?: File[];
}

// Classe d'erreur personnalisée pour les erreurs liées aux discussions
class DiscussionError extends Error {
  statusCode: number;
  originalError?: unknown;

  constructor(message: string, statusCode = 500, originalError?: unknown) {
    super(message);
    this.name = 'DiscussionError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Service pour gérer les interactions avec l'API des discussions
 */
class DiscussionService {
  /**
   * Récupère toutes les discussions
   */
  async getDiscussions(params?: {
    courseId?: string;
    tags?: string[];
    unreadOnly?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Discussion[]> {
    try {
      const queryParams: Record<string, any> = { ...params };
      
      if (params?.tags && Array.isArray(params.tags) && params.tags.length > 0) {
        queryParams.tags = params.tags.join(',');
      }

      const response = await apiService.get('/discussions', { 
        params: queryParams 
      });
      
      // S'assurer que la réponse est bien un tableau
      if (!Array.isArray(response)) {
        console.error('La réponse de l\'API n\'est pas un tableau:', response);
        return [];
      }
      
      return response as Discussion[];
    } catch (error) {
      console.error('Erreur lors de la récupération des discussions:', error);
      
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status ?? 500;
        const message = error.response?.data?.message ?? 'Échec de la récupération des discussions';
        throw new DiscussionError(message, statusCode, error);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
      throw new DiscussionError(errorMessage, 500, error);
    }
  }

  /**
   * Récupère une discussion par son ID
   */
  async getDiscussion(discussionId: string): Promise<Discussion> {
    try {
      if (!discussionId) {
        throw new DiscussionError('Discussion ID is required', 400);
      }

      const response = await apiService.get(`/discussions/${discussionId}`) as AxiosResponse<Discussion>;
      return response.data;
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new DiscussionError('Failed to fetch discussion', statusCode, error);
    }
  }

  /**
   * Crée une nouvelle discussion
   */
  async createDiscussion(discussion: CreateDiscussionRequest): Promise<Discussion> {
    try {
      // Si des pièces jointes sont fournies, utiliser FormData
      if (discussion.attachments && discussion.attachments.length > 0) {
        const formData = new FormData();
        formData.append('title', discussion.title);
        formData.append('courseId', discussion.courseId);
        formData.append('initialMessage', discussion.initialMessage);
        
        if (discussion.tags && discussion.tags.length > 0) {
          formData.append('tags', JSON.stringify(discussion.tags));
        }
        
        discussion.attachments.forEach((file, index) => {
          formData.append(`file${index}`, file);
        });

        const response = await apiService.post('/discussions', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }) as AxiosResponse<Discussion>;
        
        return response.data;
      } else {
        // Sans pièces jointes, utiliser JSON standard
        const response = await apiService.post('/discussions', discussion) as AxiosResponse<Discussion>;
        return response.data;
      }
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new DiscussionError('Failed to create discussion', statusCode, error);
    }
  }

  /**
   * Met à jour une discussion existante
   */
  async updateDiscussion(discussionId: string, updates: { title?: string; tags?: string[]; isPinned?: boolean }): Promise<Discussion> {
    try {
      const response = await apiService.put(`/discussions/${discussionId}`, updates) as AxiosResponse<Discussion>;
      return response.data;
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new DiscussionError('Failed to update discussion', statusCode, error);
    }
  }

  /**
   * Récupère les messages d'une discussion
   */
  async getMessages(discussionId: string, limit = 20, offset = 0): Promise<DiscussionMessage[]> {
    try {
      const response = await apiService.get(`/discussions/${discussionId}/messages`, {
        params: { limit, offset }
      }) as AxiosResponse<DiscussionMessage[]>;
      
      return response.data;
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new DiscussionError('Failed to fetch messages', statusCode, error);
    }
  }

  /**
   * Ajoute un message à une discussion
   */
  async addMessage(discussionId: string, message: AddMessageRequest): Promise<DiscussionMessage> {
    try {
      // Si des pièces jointes sont fournies, utiliser FormData
      if (message.attachments && message.attachments.length > 0) {
        const formData = new FormData();
        formData.append('content', message.content);
        
        message.attachments.forEach((file, index) => {
          formData.append(`file${index}`, file);
        });

        const response = await apiService.post(`/discussions/${discussionId}/messages`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }) as AxiosResponse<DiscussionMessage>;
        
        return response.data;
      } else {
        // Sans pièces jointes, utiliser JSON standard
        const response = await apiService.post(`/discussions/${discussionId}/messages`, {
          content: message.content
        }) as AxiosResponse<DiscussionMessage>;
        
        return response.data;
      }
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new DiscussionError('Failed to add message', statusCode, error);
    }
  }

  /**
   * Marque une discussion comme lue
   */
  async markAsRead(discussionId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiService.put(`/discussions/${discussionId}/read`) as AxiosResponse<{ success: boolean }>;
      return response.data;
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status || 500;
      throw new DiscussionError('Failed to mark discussion as read', statusCode, error);
    }
  }
}

// Exporter une instance du service
export const discussionService = new DiscussionService();

// Exposer le service en mode développement pour faciliter le débogage
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore
  window.discussionService = discussionService;
}
