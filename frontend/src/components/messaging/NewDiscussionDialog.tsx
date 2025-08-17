import { useState } from 'react';
import { messagingService } from '@/services/messaging.service';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserSelect } from '.';
import type { Discussion, UserInfo } from './types';

interface NewDiscussionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (discussion: Discussion) => void;
  currentUserId: string;
}

export function NewDiscussionDialog({
  open,
  onOpenChange,
  onCreate,
  currentUserId,
}: NewDiscussionDialogProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !message.trim() || selectedUserIds.length === 0) return;

    try {
      setIsSubmitting(true);

      // Pour les discussions individuelles, le titre sera géré par le backend
      // Pour les groupes, on utilise le titre fourni ou un titre par défaut
      const isGroup = selectedUserIds.length > 1;
      let discussionTitle = isGroup ? title.trim() : '';
      
      // Créer la discussion via l'API
      const newDiscussion = await messagingService.createDiscussion({
        title: discussionTitle,
        participantIds: selectedUserIds,
        initialMessage: message.trim(),
        isGroup: selectedUserIds.length > 1
      });

      // Si on arrive ici, la création a réussi
      // Mettre à jour l'état local avec la nouvelle discussion
      if (onCreate) {
        onCreate(newDiscussion);
      }
      handleClose();
    } catch (error) {
      console.error('Erreur lors de la création de la discussion:', error);
      // Log l'erreur sans afficher d'alert
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setMessage('');
    setSelectedUserIds([]);
    setSelectedUsers([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouvelle discussion</DialogTitle>
          <DialogDescription>
            Créez une nouvelle discussion avec un ou plusieurs utilisateurs.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Sujet (optionnel pour les discussions individuelles)</Label>
              <Input
                id="title"
                placeholder="Sujet de la discussion"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipients">Destinataires</Label>
              <UserSelect
                id="recipients"
                value={selectedUserIds}
                onChange={(userIds, users = []) => {
                  setSelectedUserIds(userIds);
                  setSelectedUsers(users);
                }}
                currentUserId={currentUserId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Votre message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !message.trim() || selectedUsers.length === 0}>
              {isSubmitting ? 'Création...' : 'Créer la discussion'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
