import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Discussion, UserInfo, Message } from '@/services/messaging.service';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle } from 'lucide-react';
import { messagingService } from '@/services/messaging.service';

interface DiscussionListProps {
  onRefreshRequest?: () => void;
  refreshTrigger?: number; // Prop pour déclencher un rafraîchissement
}

export function DiscussionList({ refreshTrigger }: DiscussionListProps = {}) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const location = useLocation();
  const navigate = useNavigate();
  
  // Déterminer le chemin de base en fonction de l'URL actuelle
  const getBasePath = useCallback(() => {
    if (location.pathname.startsWith('/etudiant')) {
      return '/etudiant/messagerie';
    } else if (location.pathname.startsWith('/enseignant')) {
      return '/enseignant/messagerie';
    } else if (location.pathname.startsWith('/admin')) {
      return '/admin/messagerie';
    }
    return '/messages'; // Fallback par défaut
  }, [location.pathname]);
  
  const basePath = getBasePath();

  // Fonction pour formater la date relative
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays < 1) {
        // Aujourd'hui - afficher l'heure
        return format(date, 'HH:mm');
      } else if (diffInDays < 7) {
        // Moins d'une semaine - afficher le jour de la semaine
        return format(date, 'EEEE', { locale: fr });
      } else {
        // Plus d'une semaine - afficher la date complète
        return format(date, 'dd/MM/yyyy');
      }
    } catch (e) {
      return '';
    }
  };

  // Fonction pour obtenir les initiales d'un nom
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Fonction pour charger le dernier message d'une discussion
  const fetchLastMessage = useCallback(async (discussionId: string) => {
    try {
      const messages = await messagingService.getMessages(discussionId, {
        limit: 1,
        sortBy: '-created_at'
      });
      
      if (messages && messages.length > 0) {
        setLastMessages(prev => ({
          ...prev,
          [discussionId]: messages[0]
        }));
      }
    } catch (error) {
      console.error(`Erreur lors du chargement du dernier message pour la discussion ${discussionId}:`, error);
    }
  }, []);

  // Fonction utilitaire pour obtenir le nom complet d'un participant
  const getParticipantName = (participant?: UserInfo) => {
    if (!participant) return 'Utilisateur inconnu';
    const name = [participant.firstName, participant.lastName].filter(Boolean).join(' ');
    return name || participant.name || participant.username || 'Utilisateur inconnu';
  };
  
  // Fonction pour obtenir le titre d'une discussion
  const getDiscussionTitle = (discussion: Discussion, participants: UserInfo[]) => {
    // Le backend s'occupe maintenant de définir les titres
    // On utilise directement le titre fourni par le backend
    if (discussion.title) return discussion.title;
    
    // Fallback au cas où le titre ne serait pas défini
    if (discussion.isGroup) {
      const participantCount = participants.length;
      return `Groupe avec ${participantCount} personnes`;
    }
    
    // Pour les discussions individuelles, afficher le nom du contact
    if (participants.length === 1) {
      const participant = participants[0];
      return `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim() || 
             participant.name || 
             'Utilisateur inconnu';
    }
    
    // Par défaut, retourner un titre générique
    return 'Nouvelle discussion';
  };

  // Obtenir la liste des participants ou un tableau vide
  const getParticipants = (discussion: Discussion) => {
    return discussion.participants ?? [];
  };

  // Fonction pour afficher le dernier message d'une discussion
  const renderLastMessage = (discussion: Discussion) => {
    const message = discussion.lastMessage || lastMessages[discussion.id];
    if (!message) return 'Aucun message';
    
    const prefix = message.sender?.id === 'current-user' ? 'Vous: ' : '';
    return prefix + (message.content || 'Pièce jointe');
  };

  // Charger les discussions
  const fetchDiscussions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Récupération des discussions...');
      
      // Récupérer les discussions avec les participants et le dernier message
      const serviceDiscussions = await messagingService.getDiscussions({ 
        limit: 50,
        offset: 0,
        includeParticipants: true,
        includeLastMessage: true,
      });
      
      console.log('Discussions récupérées:', serviceDiscussions);
      setDiscussions(serviceDiscussions);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Une erreur est survenue lors du chargement des discussions'
      );
      // Réinitialiser les discussions en cas d'erreur
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchDiscussions();
    };
    
    loadData();
    
    // Configurer un intervalle pour rafraîchir périodiquement les discussions
    const intervalId = setInterval(() => {
      fetchDiscussions();
    }, 30000); // Rafraîchir toutes les 30 secondes
    
    return () => clearInterval(intervalId);
  }, [fetchDiscussions]);

  // Effet pour rafraîchir quand refreshTrigger change
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchDiscussions();
    }
  }, [refreshTrigger, fetchDiscussions]);

  useEffect(() => {
    if (discussions.length > 0) {
      discussions.forEach(discussion => {
        if (!lastMessages[discussion.id] && !discussion.lastMessage) {
          fetchLastMessage(discussion.id);
        }
      });
    }
  }, [discussions, fetchLastMessage, lastMessages]);

  // Filtrer les discussions en fonction du terme de recherche
  const filteredDiscussions = useMemo(() => {
    if (!searchTerm) return discussions;
    
    const searchLower = searchTerm.toLowerCase();
    return discussions.filter(discussion => {
      // Vérifier le titre
      if (discussion.title?.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Vérifier les noms des participants
      return getParticipants(discussion).some(participant => 
        participant.name?.toLowerCase().includes(searchLower)
      );
    });
  }, [discussions, searchTerm]);

  // Rendu de l'état de chargement
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Messages</h2>
          <div className="relative">
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center p-3 space-x-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Rendu en cas d'erreur
  if (error) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 p-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Erreur de chargement</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={fetchDiscussions}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Rendu quand il n'y a pas de discussions
  if (filteredDiscussions.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Rechercher des discussions..."
              className="w-full pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <MessageCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            {searchTerm ? 'Aucun résultat' : 'Aucune discussion'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm 
              ? 'Aucune discussion ne correspond à votre recherche.'
              : 'Commencez une nouvelle discussion pour démarrer la conversation.'}
          </p>
        </div>
      </div>
    );
  }

  // Rendu principal de la liste des discussions
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* En-tête avec barre de recherche */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Rechercher des discussions..."
            className="w-full pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Liste des discussions */}
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredDiscussions.map((discussion) => {
            const lastMessage = discussion.lastMessage || lastMessages[discussion.id];
            const isUnread = !discussion.isRead;
            const participants = getParticipants(discussion);
            const mainParticipant = participants[0];
            const isGroup = discussion.isGroup || participants.length > 1;
            
            return (
              <li key={discussion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Link
                  to={`${basePath}/${discussion.id}`}
                  className={`block p-4 ${isUnread ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${
                    location.pathname === `${basePath}/${discussion.id}` ? 'bg-gray-100 dark:bg-gray-800' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="relative mr-3">
                      {isGroup ? (
                        <div className="relative h-12 w-12">
                          {participants.slice(0, 3).map((p, i) => (
                            <div 
                              key={p.id} 
                              className={`absolute rounded-full overflow-hidden border-2 border-white dark:border-gray-800 ${
                                i === 0 ? 'top-0 left-0 h-8 w-8 z-10' : 
                                i === 1 ? 'top-0 right-0 h-6 w-6' : 
                                'bottom-0 right-0 h-6 w-6'
                              }`}
                            >
                              <Avatar className="h-full w-full">
                                <AvatarImage src={p.avatar} alt={p.name} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(p.name)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={mainParticipant?.avatar} 
                            alt={getParticipantName(mainParticipant)}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(getParticipantName(mainParticipant))}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {isUnread && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 
                          className={`text-sm font-medium truncate ${
                            isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}
                          title={getDiscussionTitle(discussion, participants)}
                        >
                          {getDiscussionTitle(discussion, participants)}
                        </h3>
                        {lastMessage?.createdAt && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                            {formatDate(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      
                      {lastMessage ? (
                        <div className="mt-1">
                          <p className={`text-sm truncate ${
                            isUnread 
                              ? 'font-medium text-gray-900 dark:text-white' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {lastMessage.sender?.id === 'current-user' ? 'Vous: ' : ''}
                            {lastMessage.content || 'Pièce jointe'}
                          </p>
                          {lastMessage.attachments && lastMessage.attachments.length > 0 && (
                            <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              {lastMessage.attachments.length} pièce{lastMessage.attachments.length > 1 ? 's' : ''} jointe{lastMessage.attachments.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 italic">
                          Aucun message
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}