import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users, Search, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { messagingService } from '@/services/messaging.service';

interface Discussion {
  id: string;
  title: string;
  description?: string;
  courseId?: string;
  courseName?: string;
  createdBy: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  participants: {
    id: string;
    name: string;
    profilePicture?: string;
  }[];
  tags: string[];
  messageCount: number;
  unreadCount: number;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      profilePicture?: string;
    };
    attachments?: {
      id: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      url: string;
    }[];
  };
}

export default function DiscussionsPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDiscussions = async (unreadOnly = false) => {
    try {
      setLoading(true);
      // Utiliser le service de messagerie unifié pour récupérer les discussions
      const userDiscussions = await messagingService.getDiscussions({
        unreadOnly: unreadOnly,
        includeParticipants: true,
        includeLastMessage: true
      });
      
      // Convertir le format des discussions pour correspondre à l'interface attendue
      const formattedDiscussions: Discussion[] = userDiscussions.map(discussion => ({
        ...discussion,
        description: discussion.lastMessage?.content,
        createdBy: {
          id: discussion.createdBy,
          name: discussion.createdByName || 'Utilisateur inconnu'
        },
        participants: discussion.participants?.map(p => ({
          id: p.id,
          name: p.name || [p.firstName, p.lastName].filter(Boolean).join(' ') || p.username || 'Utilisateur inconnu',
          profilePicture: p.avatar
        })) || [],
        lastActivity: discussion.lastMessageAt,
        unreadCount: discussion.isRead ? 0 : 1,
        lastMessage: discussion.lastMessage ? {
          id: discussion.lastMessage.id,
          content: discussion.lastMessage.content,
          createdAt: discussion.lastMessage.createdAt,
          author: {
            id: discussion.lastMessage.userId,
            name: discussion.lastMessage.userName || 'Utilisateur inconnu',
            profilePicture: discussion.lastMessage.userAvatar
          },
          attachments: discussion.lastMessage.attachments
        } : undefined
      }));
      
      setDiscussions(formattedDiscussions);
    } catch (error) {
      console.error("Erreur lors de la récupération des discussions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions(activeTab === 'unread');
  }, [activeTab]);

  const filteredDiscussions = discussions.filter(discussion => {
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        discussion.title.toLowerCase().includes(query) ||
        (discussion.courseName && discussion.courseName.toLowerCase().includes(query)) ||
        (discussion.description && discussion.description.toLowerCase().includes(query)) ||
        discussion.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filtre par onglet
    if (activeTab === 'unread') return discussion.unreadCount > 0;
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Discussions</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouvelle
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="unread">Non lues</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <TabsContent value={activeTab} className="mt-0">
            {filteredDiscussions.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">Aucune discussion trouvée</h3>
                <p className="mt-1 text-gray-500">
                  {searchQuery 
                    ? "Aucune discussion ne correspond à votre recherche." 
                    : activeTab === 'unread' 
                      ? "Vous avez lu tous vos messages." 
                      : "Vous n'avez pas encore de discussions."}
                </p>
                <Button className="mt-4">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Créer une discussion
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDiscussions.map((discussion) => (
                  <Card key={discussion.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            {discussion.title}
                            {discussion.unreadCount > 0 && (
                              <Badge className="ml-2 bg-blue-500 hover:bg-blue-600">
                                {discussion.unreadCount} nouveau{discussion.unreadCount > 1 ? 'x' : ''}
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            <Link to={`/etudiant/cours/${discussion.courseId}`} className="text-blue-600 hover:underline">
                              {discussion.courseName || 'Cours non spécifié'}
                            </Link>
                            <span className="text-gray-400 mx-2">•</span>
                            <span>Dernière activité: {new Date(discussion.lastActivity).toLocaleDateString()}</span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{discussion.participants.length}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {discussion.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="bg-gray-100">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    {discussion.lastMessage && (
                      <CardContent className="pb-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={discussion.lastMessage.author.profilePicture} 
                              alt={discussion.lastMessage.author.name} 
                            />
                            <AvatarFallback>{discussion.lastMessage.author.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-sm font-medium">{discussion.lastMessage.author.name}</p>
                              <span className="text-xs text-gray-500">
                                {new Date(discussion.lastMessage.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{discussion.lastMessage.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    )}
                    <CardFooter>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to={`/etudiant/discussions/${discussion.id}`}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Voir la discussion
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
