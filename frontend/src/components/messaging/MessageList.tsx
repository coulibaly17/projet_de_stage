import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileIcon, Paperclip, Send, X } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { messagingService, type Message } from '@/services/messaging.service';
import { useToast } from '@/components/ui/use-toast';

interface MessageListProps {
  readonly currentUserId: string;
  readonly className?: string;
}

// Fonction utilitaire pour formater la taille des fichiers
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export function MessageList({ currentUserId, className }: MessageListProps) {
  const { discussionId = '' } = useParams<{ discussionId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Charger les messages depuis l'API
  const loadMessages = useCallback(async () => {
    if (!discussionId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('\n=== Début du chargement des messages ===');
      console.log('Discussion ID:', discussionId);
      
      const fetchedMessages = await messagingService.getMessages(discussionId);
      
      console.log('\n=== Messages bruts reçus du service ===');
      console.log('Type de données:', Array.isArray(fetchedMessages) ? 'Tableau' : typeof fetchedMessages);
      console.log('Nombre de messages:', Array.isArray(fetchedMessages) ? fetchedMessages.length : 'N/A');
      
      if (Array.isArray(fetchedMessages)) {
        fetchedMessages.forEach((msg: any, index: number) => {
          console.log(`\nMessage #${index + 1}:`);
          console.log('- ID:', msg.id);
          // Utiliser l'opérateur de chaînage optionnel avec une valeur par défaut
          console.log('- Auteur ID:', msg.userId ?? msg.authorId ?? 'Inconnu');
          
          // Formater le contenu pour l'affichage
          let contentPreview = 'Aucun contenu';
          if (msg.content) {
            const maxLength = 50;
            const truncated = msg.content.length > maxLength 
              ? `${msg.content.substring(0, maxLength)}...` 
              : msg.content;
            contentPreview = `"${truncated}"`;
          }
          
          console.log('- Contenu:', contentPreview);
          console.log('- Date:', msg.createdAt ?? 'Date inconnue');
          console.log('- Lu:', msg.isRead !== undefined ? msg.isRead : 'Non spécifié');
        });
      }
      
      if (!Array.isArray(fetchedMessages)) {
        console.error('\nERREUR: Les messages reçus ne sont pas un tableau:', fetchedMessages);
        throw new Error('Format de données invalide');
      }
      
      console.log('\n=== Mise à jour de l\'état des messages ===');
      setMessages(fetchedMessages);
    } catch (err) {
      console.error('Erreur lors du chargement des messages:', err);
      setError('Impossible de charger les messages. Veuillez réessayer.');
      
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement des messages.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [discussionId, toast]);

  // Charger les messages au montage du composant et quand la discussion change
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Faire défiler vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gestion des fichiers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('=== handleFileSelect appelé ===');
    console.log('Fichiers sélectionnés:', files);
    console.log('Nombre de fichiers:', files.length);
    
    if (files.length > 0) {
      // Vérifier la taille des fichiers (max 10MB par fichier)
      const maxSize = 10 * 1024 * 1024; // 10MB
      const validFiles = files.filter(file => {
        if (file.size > maxSize) {
          toast({
            title: 'Fichier trop volumineux',
            description: `Le fichier "${file.name}" dépasse la limite de 10MB.`,
            variant: 'destructive',
          });
          return false;
        }
        return true;
      });
      
      console.log('Fichiers valides après validation:', validFiles);
      setSelectedFiles(prev => {
        const newFiles = [...prev, ...validFiles];
        console.log('Nouveaux selectedFiles après ajout:', newFiles);
        return newFiles;
      });
    }
    // Réinitialiser l'input pour permettre de sélectionner le même fichier
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };



  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageContent = newMessage.trim();
    
    console.log('=== handleSendMessage début ===');
    console.log('messageContent:', messageContent);
    console.log('selectedFiles.length:', selectedFiles.length);
    console.log('selectedFiles state:', selectedFiles);
    console.log('discussionId:', discussionId);
    
    if ((!messageContent && selectedFiles.length === 0) || !discussionId) {
      console.log('Condition d\'arrêt atteinte - pas d\'envoi');
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('Envoi du message...', { discussionId, content: messageContent, files: selectedFiles.length });
      console.log('selectedFiles détaillés:', selectedFiles);
      console.log('selectedFiles types:', selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      // Utiliser le service de messagerie pour envoyer le message avec pièces jointes
      console.log('=== AVANT APPEL SERVICE ===');
      console.log('Paramètres pour sendMessage:');
      console.log('- discussionId:', discussionId);
      console.log('- content:', messageContent || '[Fichier joint]');
      console.log('- selectedFiles:', selectedFiles);
      console.log('- selectedFiles.length:', selectedFiles.length);
      
      const sentMessage = await messagingService.sendMessage(discussionId, messageContent || '[Fichier joint]', selectedFiles);
      console.log('Message envoyé avec succès:', sentMessage);
      
      // Mettre à jour la liste des messages avec le nouveau message
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      setSelectedFiles([]);
      
      // Recharger les messages pour s'assurer d'avoir les données à jour
      await loadMessages();
      
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible d\'envoyer le message. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!discussionId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Sélectionnez une discussion pour commencer à discuter</p>
      </div>
    );
  }
  
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Chargement des messages...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button 
          variant="outline" 
          onClick={loadMessages}
          disabled={isLoading}
        >
          {isLoading ? 'Chargement...' : 'Réessayer'}
        </Button>
      </div>
    );
  }

  // Récupérer les informations du participant (à partir du premier message ou des données de la discussion)
  const participant = messages[0]?.userId !== currentUserId ? {
    name: messages[0]?.userName || 'Utilisateur',
    avatar: messages[0]?.userAvatar || '',
    status: 'online'
  } : {
    name: 'Moi',
    avatar: '',
    status: 'online'
  };
  
  // Gérer le chargement et les erreurs
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* En-tête de la discussion */}
      <div className="border-b p-4 flex items-center">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={participant.avatar} alt={participant.name} />
            <AvatarFallback>
              {participant.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{participant.name}</h2>
            <p className="text-xs text-muted-foreground">
              {participant.status === 'online' ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3 max-w-4xl mx-auto w-full">
            {messages.map((message) => {
              const isCurrentUser = message.userId === currentUserId;
              const messageDate = new Date(message.createdAt);
              const formattedDate = format(messageDate, 'HH:mm', { locale: fr });
              const formattedDay = format(messageDate, 'dd/MM/yyyy', { locale: fr });
              
              // Vérifier si c'est un nouveau jour par rapport au message précédent
              const previousMessage = messages[messages.indexOf(message) - 1];
              const showDate = !previousMessage || 
                new Date(previousMessage.createdAt).toDateString() !== messageDate.toDateString();

              return (
                <div key={message.id} className="w-full">
                  {/* Affichage de la date si c'est un nouveau jour */}
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                        {formattedDay}
                      </span>
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      'flex items-start gap-2 w-full',
                      isCurrentUser ? 'justify-end' : 'justify-start',
                      isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={message.userAvatar} alt={message.userName} />
                        <AvatarFallback className="text-xs">
                          {message.userName?.charAt(0)?.toUpperCase() ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={cn(
                        'rounded-lg px-4 py-2 max-w-[80%] shadow-sm',
                        isCurrentUser
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'bg-muted rounded-tl-none'
                      )}
                    >
                      {!isCurrentUser && (
                        <p className="font-medium text-xs text-muted-foreground mb-1">
                          {message.userName ?? 'Utilisateur inconnu'}
                        </p>
                      )}
                      
                      <p className="text-sm break-words">{message.content}</p>
                      
                      {/* Affichage des pièces jointes */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded border",
                                isCurrentUser 
                                  ? "bg-primary-foreground/10 border-primary-foreground/20" 
                                  : "bg-background border-border"
                              )}
                            >
                              <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <a
                                  href={`http://localhost:8000${attachment.downloadUrl}`}
                                  download={attachment.originalFilename}
                                  className={cn(
                                    "text-sm font-medium hover:underline truncate block",
                                    isCurrentUser ? "text-primary-foreground" : "text-foreground"
                                  )}
                                  title={attachment.originalFilename}
                                >
                                  {attachment.originalFilename}
                                </a>
                                <p className={cn(
                                  "text-xs",
                                  isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}>
                                  {formatFileSize(attachment.fileSize)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p
                        className={cn(
                          'text-xs mt-1 text-right',
                          isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}
                      >
                        {formattedDate}
                      </p>
                    </div>
                    
                    {isCurrentUser && (
                      <div className="w-8"></div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} className="h-4" />
          </div>
      </div>

      {/* Zone de saisie */}
      <div className="border-t p-4 bg-background sticky bottom-0">
        {/* Affichage des fichiers sélectionnés */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <span className="truncate max-w-[150px]">{file.name}</span>
                <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="*/*"
        />
        
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            placeholder="Écrire un message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="sm" 
            className="px-4"
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || isLoading}
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Envoyer</span>
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="p-2"
            disabled={isLoading}
            onClick={handleFileButtonClick}
          >
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Joindre un fichier</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
