import { apiService } from './api';
import axios from 'axios';

// Types pour les utilisateurs
export interface UserInfo {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
}

// Types pour les pièces jointes
export interface MessageAttachment {
  id: number;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
}

// Types pour les messages
export interface Message {
  id: string;
  content: string;
  userId: string;
  discussionId: string;
  userName?: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  isRead?: boolean;
  isDeleted?: boolean;
  attachments?: MessageAttachment[];
  sender?: UserInfo;
}

// Types pour les discussions
export interface Discussion {
  id: string;
  title: string;
  courseId?: string;
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
  isGroup?: boolean;
  lastMessage?: Message;
  participants?: UserInfo[];
}

// Types pour les requêtes
export interface CreateDiscussionRequest {
  title: string;
  courseId?: string;
  participantIds?: string[];
  initialMessage?: string;
  isGroup?: boolean;
  tags?: string[];
  attachments?: File[];
}

export interface AddMessageRequest {
  content: string;
  attachments?: File[];
  discussionId?: string;
}

// Classe d'erreur personnalisée
class MessagingError extends Error {
  statusCode: number;
  originalError?: unknown;

  constructor(message: string, statusCode = 500, originalError?: unknown) {
    super(message);
    this.name = 'MessagingError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Service unifié pour gérer les discussions et les messages
 */
class MessagingService {
  //#region Discussions
  
  /**
   * Récupère toutes les discussions avec pagination et filtres
   */
  async getDiscussions(params?: {
    courseId?: string;
    tags?: string[];
    unreadOnly?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    includeParticipants?: boolean;
    includeLastMessage?: boolean;
  }): Promise<Discussion[]> {
    try {
      const queryParams: Record<string, any> = { 
        ...params,
        include_participants: params?.includeParticipants ?? true,
        include_last_message: params?.includeLastMessage ?? true
      };
      
      if (params?.tags?.length) {
        queryParams.tags = params.tags.join(',');
      }

      const response = await apiService.get<Discussion[]>('/discussions', { 
        params: queryParams 
      });
      
      if (!Array.isArray(response)) {
        console.error('La réponse de l\'API n\'est pas un tableau:', response);
        return [];
      }
      
      return this.formatDiscussions(response);
    } catch (error) {
      this.handleError('Erreur lors de la récupération des discussions', error);
      throw error;
    }
  }

  /**
   * Récupère une discussion par son ID
   */
  async getDiscussion(discussionId: string, options: {
    includeParticipants?: boolean;
    includeMessages?: boolean;
    messagesLimit?: number;
  } = {}): Promise<Discussion> {
    try {
      if (!discussionId) {
        throw new MessagingError('ID de discussion requis', 400);
      }

      const response = await apiService.get<Discussion>(`/discussions/${discussionId}`, {
        params: {
          include_participants: options.includeParticipants ?? true,
          include_messages: options.includeMessages ?? false,
          messages_limit: options.messagesLimit
        }
      });
      
      return this.formatDiscussion(response);
    } catch (error) {
      this.handleError('Erreur lors de la récupération de la discussion', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle discussion
   */
  async createDiscussion(data: CreateDiscussionRequest): Promise<Discussion> {
    try {
      // Vérifier qu'il y a au moins un participant
      if (!data.participantIds?.length) {
        throw new Error('Au moins un participant est requis pour créer une discussion');
      }

      // Préparer les données pour l'API
      const requestData = {
        title: data.title || `Discussion avec ${data.participantIds.length} participant(s)`,
        initialMessage: data.initialMessage || '',
        participantIds: data.participantIds,
        tags: data.tags || []
      };

      console.log('Création de la discussion avec les données:', requestData);

      // Envoyer la requête avec le bon Content-Type
      const response = await apiService.post<Discussion>('/discussions', requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Réponse de la création de discussion:', response);
      
      return this.formatDiscussion(response);
    } catch (error) {
      this.handleError('Erreur lors de la création de la discussion', error);
      throw error;
    }
  }

  /**
   * Met à jour une discussion existante
   */
  async updateDiscussion(
    discussionId: string, 
    updates: { 
      title?: string; 
      tags?: string[]; 
      isPinned?: boolean;
      isRead?: boolean;
    }
  ): Promise<Discussion> {
    try {
      const response = await apiService.put<Discussion>(`/discussions/${discussionId}`, updates);
      return this.formatDiscussion(response);
    } catch (error) {
      this.handleError('Erreur lors de la mise à jour de la discussion', error);
      throw error;
    }
  }

  /**
   * Supprime une discussion
   */
  async deleteDiscussion(discussionId: string): Promise<{ success: boolean }> {
    try {
      await apiService.delete(`/discussions/${discussionId}`);
      return { success: true };
    } catch (error) {
      this.handleError('Erreur lors de la suppression de la discussion', error);
      throw error;
    }
  }

  /**
   * Marque une discussion comme lue
   */
  async markAsRead(discussionId: string): Promise<{ success: boolean }> {
    try {
      await apiService.put(`/discussions/${discussionId}/read`);
      return { success: true };
    } catch (error) {
      this.handleError('Erreur lors du marquage de la discussion comme lue', error);
      throw error;
    }
  }

  //#endregion

  //#region Messages

  /**
   * Récupère les messages d'une discussion
   */
  async getMessages(
    discussionId: string, 
    params: {
      limit?: number;
      offset?: number;
      sortBy?: 'created_at' | '-created_at';
      unreadOnly?: boolean;
    } = {}
  ): Promise<Message[]> {
    try {
      const response = await apiService.get<Message[]>(`/discussions/${discussionId}/messages`, {
        params: {
          include_sender: true,
          ...params
        }
      });
      
      if (!Array.isArray(response)) {
        console.error('La réponse de l\'API n\'est pas un tableau:', response);
        return [];
      }
      
      return response.map(msg => this.formatMessage(msg));
    } catch (error) {
      this.handleError('Erreur lors de la récupération des messages', error);
      throw error;
    }
  }

  /**
   * Envoie un message dans une discussion
   */
  async sendMessage(
    discussionId: string, 
    content: string, 
    attachments: File[] = []
  ): Promise<Message> {
    try {
      console.log('=== SERVICE sendMessage DÉBUT ===');
      console.log('discussionId:', discussionId);
      console.log('content:', content);
      console.log('attachments.length:', attachments.length);
      console.log('attachments détail:', attachments.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      let response: Message;
      
      if (attachments.length > 0) {
        console.log('=== UTILISATION DE FORMDATA ===');
        // Utiliser FormData pour envoyer des fichiers
        const formData = new FormData();
        formData.append('content', content);
        
        console.log('FormData content ajouté:', content);
        
        // Ajouter chaque fichier au FormData
        attachments.forEach((file, index) => {
          console.log(`Ajout fichier ${index}:`, { name: file.name, size: file.size, type: file.type });
          formData.append(`attachments`, file);
        });
        
        console.log('FormData créé, envoi vers:', `/discussions/${discussionId}/messages`);
        
        // Envoyer avec FormData
        response = await apiService.post<Message>(
          `/discussions/${discussionId}/messages`,
          formData
        );
        
        console.log('Réponse FormData reçue:', response);
      } else {
        console.log('=== UTILISATION DE JSON ===');
        // Envoyer un message texte simple en JSON
        const messageData = {
          content: content,
        };
        
        console.log('Données JSON à envoyer:', messageData);
        
        response = await apiService.post<Message>(
          `/discussions/${discussionId}/messages`,
          messageData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        console.log('Réponse JSON reçue:', response);
      }
      
      console.log('Réponse du serveur:', response);
      
      // Formater la réponse avant de la retourner
      return this.formatMessage(response);
    } catch (error) {
      console.error('Erreur détaillée lors de l\'envoi du message:', error);
      this.handleError('Erreur lors de l\'envoi du message', error);
      throw error;
    }
  }

  /**
   * Met à jour un message existant
   */
  async updateMessage(
    messageId: string, 
    updates: { content: string }
  ): Promise<Message> {
    try {
      const response = await apiService.put<Message>(
        `/messages/${messageId}`, 
        { content: updates.content }
      );
      
      return this.formatMessage(response);
    } catch (error) {
      this.handleError('Erreur lors de la mise à jour du message', error);
      throw error;
    }
  }

  /**
   * Supprime un message
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    try {
      await apiService.delete(`/messages/${messageId}`);
      return { success: true };
    } catch (error) {
      this.handleError('Erreur lors de la suppression du message', error);
      throw error;
    }
  }

  /**
   * Marque un message comme lu
   */
  async markMessageAsRead(messageId: string): Promise<{ success: boolean }> {
    try {
      await apiService.put(`/messages/${messageId}/read`);
      return { success: true };
    } catch (error) {
      this.handleError('Erreur lors du marquage du message comme lu', error);
      throw error;
    }
  }

  //#endregion

  //#region Méthodes utilitaires

  /**
   * Formate une discussion
   */
  private formatDiscussion(discussion: any): Discussion {
    return {
      ...discussion,
      participants: (discussion.participants || []).map((p: any) => this.formatUser(p)),
      lastMessage: discussion.lastMessage ? this.formatMessage(discussion.lastMessage) : undefined
    };
  }

  /**
   * Formate une liste de discussions
   */
  private formatDiscussions(discussions: any[]): Discussion[] {
    return discussions.map(discussion => this.formatDiscussion(discussion));
  }

  /**
   * Formate un message
   */
  private formatMessage(message: any): Message {
    // Afficher la structure complète du message pour le débogage
    console.log('Formatage du message:', JSON.parse(JSON.stringify(message)));
    
    // Extraire les informations de l'expéditeur
    const authorId = message.authorId || message.sender_id || message.sender?.id;
    const authorName = message.authorName || 
                      (message.sender ? `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() : '') ||
                      message.sender?.username ||
                      'Utilisateur';
    
    // Créer l'objet utilisateur si nécessaire
    let senderInfo: UserInfo | undefined;
    if (message.sender) {
      senderInfo = this.formatUser(message.sender);
    } else if (authorId) {
      senderInfo = {
        id: authorId.toString(),
        name: authorName,
        username: message.sender?.username || '',
        firstName: message.sender?.firstName || '',
        lastName: message.sender?.lastName || '',
        avatar: message.sender?.avatar || ''
      };
    }
    
    // Formater le message
    const formattedMessage: Message = {
      id: message.id?.toString() ?? '',
      content: message.content || '',
      userId: authorId?.toString() || message.userId?.toString() || '',
      discussionId: message.discussionId?.toString() || message.discussion_id?.toString() || '',
      userName: authorName,
      userAvatar: message.sender?.avatar || message.userAvatar || '',
      createdAt: message.createdAt || message.sent_at || new Date().toISOString(),
      updatedAt: message.updatedAt,
      isRead: message.isRead !== undefined ? message.isRead : true,
      isDeleted: message.isDeleted || false,
      attachments: message.attachments || [],
      sender: senderInfo
    };
    
    console.log('Message formaté:', formattedMessage);
    return formattedMessage;
  }

  /**
   * Formate un utilisateur
   */
  private formatUser(user: any): UserInfo {
    return {
      id: user.id,
      name: user.name ?? [user.firstName, user.lastName].filter(Boolean).join(' ') ?? user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      avatar: user.avatar
    };
  }

  /**
   * Gère les erreurs
   */
  private handleError(message: string, error: any): never {
    console.error(message, error);
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status ?? 500;
      const errorMessage = error.response?.data?.message ?? message;
      throw new MessagingError(errorMessage, statusCode, error);
    }
    
    const errorMessage = error instanceof Error ? error.message : message;
    throw new MessagingError(errorMessage, 500, error);
  }

  //#endregion
}

// Exporter une instance du service
export const messagingService = new MessagingService();

// Exposer le service en mode développement pour faciliter le débogage
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore
  window.messagingService = messagingService;
}
