import { apiService } from './api';

// Types pour la messagerie
export interface UserInfo {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
}

export interface Message {
  id: string;
  content: string;
  discussionId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  isRead?: boolean;
  attachments?: MessageAttachment[];
  sender?: UserInfo;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

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
  lastMessage?: Message;
  participants?: UserInfo[];
}

export class MessageError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'MessageError';
    this.statusCode = statusCode ?? 500;
  }
}

class MessageService {
  /**
   * Récupère les messages d'une discussion
   * @param discussionId ID de la discussion
   * @param skip Nombre de messages à sauter (pour la pagination)
   * @param limit Nombre maximum de messages à récupérer
   */
  /**
   * Récupère les messages d'une discussion
   * @param discussionId ID de la discussion
   * @param skip Nombre de messages à sauter (pagination)
   * @param limit Nombre maximum de messages à récupérer
   */
  async getMessages(
    discussionId: string, 
    skip = 0, 
    limit = 50
  ): Promise<Message[]> {
    try {
      const response = await apiService.get<Array<Message & { sender?: UserInfo }>>(
        `/discussions/${discussionId}/messages`,
        { 
          params: { 
            skip, 
            limit,
            include_sender: true
          } 
        }
      );
      
      // S'assurer que la réponse est bien un tableau
      if (!Array.isArray(response)) {
        console.error('La réponse de l\'API n\'est pas un tableau:', response);
        return [];
      }
      
      // Formater les messages pour inclure les noms complets des expéditeurs
      return response.map(message => {
        // Créer une copie du message sans le sender pour éviter les doublons
        const { sender, ...messageData } = message;
        
        // Créer un nouvel objet message avec le sender formaté si disponible
        const formattedMessage: Message = { ...messageData };
        
        if (sender) {
          formattedMessage.sender = {
            ...sender,
            name: (sender.name ?? `${sender.firstName ?? ''} ${sender.lastName ?? ''}`.trim()) || sender.username
          };
        }
        
        return formattedMessage;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      
      if (error instanceof Error) {
        throw new MessageError(`Erreur lors de la récupération des messages: ${error.message}`);
      }
      throw new MessageError('Une erreur inattendue est survenue lors de la récupération des messages');
    }
  }

  /**
   * Envoie un message dans une discussion
   * @param discussionId ID de la discussion
   * @param content Contenu du message
   * @param attachments Fichiers joints (optionnel)
   */
  async sendMessage(
    discussionId: string, 
    content: string, 
    attachments: File[] = []
  ): Promise<Message> {
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      // Ajouter les pièces jointes si elles existent
      attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
      
      return await apiService.post<Message>(
        `/discussions/${discussionId}/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      
      if (error instanceof Error) {
        throw new MessageError(`Erreur lors de l'envoi du message: ${error.message}`);
      }
      throw new MessageError('Une erreur inattendue est survenue lors de l\'envoi du message');
    }
  }

  /**
   * Récupère la liste des discussions de l'utilisateur
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
      const queryParams: Record<string, any> = { 
        ...params,
        include_participants: true,
        include_last_message: true
      };
      
      // Convertir les tags en chaîne séparée par des virgules si nécessaire
      if (params?.tags && Array.isArray(params.tags) && params.tags.length > 0) {
        queryParams.tags = params.tags.join(',');
      }

      const response = await apiService.get<Array<Discussion & { 
        participants?: UserInfo[];
        lastMessage?: Message & { sender?: UserInfo };
      }>>('/discussions', { 
        params: queryParams 
      });
      
      // S'assurer que la réponse est bien un tableau
      if (!Array.isArray(response)) {
        console.error('La réponse de l\'API n\'est pas un tableau:', response);
        return [];
      }
      
      // Formater les discussions pour inclure les noms complets des participants
      return response.map(discussion => {
        // Créer une copie de la discussion sans les champs à formater
        const { participants = [], lastMessage, ...discussionData } = discussion;
        
        // Créer un nouvel objet discussion avec les données formatées
        const formattedDiscussion: Discussion = { ...discussionData };
        
        // Formater les participants
        if (participants) {
          formattedDiscussion.participants = participants.map(participant => ({
            ...participant,
            name: (participant.name ?? `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim()) || participant.username
          }));
        }
        
        // Formater le dernier message si disponible
        if (lastMessage) {
          const { sender, ...messageData } = lastMessage;
          const formattedLastMessage: Message = { ...messageData };
          
          if (sender) {
            formattedLastMessage.sender = {
              ...sender,
              name: (sender.name ?? `${sender.firstName ?? ''} ${sender.lastName ?? ''}`.trim()) || sender.username
            };
          }
          
          formattedDiscussion.lastMessage = formattedLastMessage;
        }
        
        return formattedDiscussion;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des discussions:', error);
      
      if (error instanceof Error) {
        throw new MessageError(`Erreur lors de la récupération des discussions: ${error.message}`);
      }
      throw new MessageError('Une erreur inattendue est survenue lors de la récupération des discussions');
    }
  }
}

export const messageService = new MessageService();
