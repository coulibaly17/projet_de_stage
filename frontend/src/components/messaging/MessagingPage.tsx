import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import type { Discussion } from './types';
import { DiscussionList, MessageList, NewDiscussionDialog } from '.';
import { useAuth } from '@/context/AuthContext';

function MessagingPage() {
  const { discussionId } = useParams<{ discussionId?: string }>();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fonction utilitaire pour déterminer les routes selon le rôle
  const getMessagingRoutes = () => {
    const role = user?.role;
    switch (role) {
      case 'admin':
        return {
          base: '/admin/messagerie',
          discussion: (id: string | number) => `/admin/messagerie/${id}`
        };
      case 'teacher':
      case 'enseignant':
        return {
          base: '/enseignant/messagerie',
          discussion: (id: string | number) => `/enseignant/messagerie/${id}`
        };
      case 'student':
      case 'etudiant':
      default:
        return {
          base: '/etudiant/messagerie',
          discussion: (id: string | number) => `/etudiant/messagerie/${id}`
        };
    }
  };

  const routes = getMessagingRoutes();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    return null; // Ou un composant de chargement
  }

  const handleNewDiscussion = (discussion: Discussion) => {
    setShowNewDialog(false);
    // Déclencher le rafraîchissement de la liste des discussions
    setRefreshTrigger(prev => prev + 1);
    navigate(routes.discussion(discussion.id));
  };

  if (isMobile && discussionId) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(routes.base)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Messages</h1>
        </div>
        <MessageList currentUserId={user.id} />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-xl font-semibold">Messages</h1>
          <Button
            size="sm"
            onClick={() => setShowNewDialog(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <DiscussionList refreshTrigger={refreshTrigger} />
        <NewDiscussionDialog
          open={showNewDialog}
          onOpenChange={setShowNewDialog}
          onCreate={handleNewDiscussion}
          currentUserId={user.id}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-80 border-r">
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-xl font-semibold">Messages</h1>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNewDialog(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <DiscussionList refreshTrigger={refreshTrigger} />
      </div>
      
      <div className="flex-1 flex flex-col border-l">
        {discussionId ? (
          <MessageList currentUserId={user.id} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center p-8 max-w-md">
              <h2 className="text-xl font-semibold mb-2">Aucune discussion sélectionnée</h2>
              <p className="mb-4">Sélectionnez une discussion ou créez-en une nouvelle pour commencer à discuter.</p>
              <Button onClick={() => setShowNewDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle discussion
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <NewDiscussionDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onCreate={handleNewDiscussion}
        currentUserId={user.id}
      />
    </div>
  );
}

export default MessagingPage;
