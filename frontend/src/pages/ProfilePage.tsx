import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit3, 
  Save, 
  X,
  BookOpen,
  Award,
  Users,
  ClipboardCheck,
  Settings,
  Activity
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    username: user?.username ?? ''
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Chargement du profil...</p>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'enseignant':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'etudiant':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'enseignant':
        return 'Enseignant';
      case 'etudiant':
        return 'Étudiant';
      default:
        return 'Utilisateur';
    }
  };

  const getStatsForRole = () => {
    switch (user.role) {
      case 'admin':
        return [
          { label: 'Utilisateurs', value: '1,234', icon: Users },
          { label: 'Cours actifs', value: '89', icon: BookOpen },
          { label: 'Quiz créés', value: '456', icon: ClipboardCheck },
          { label: 'Système', value: '99.9%', icon: Activity }
        ];
      case 'enseignant':
        return [
          { label: 'Cours créés', value: '12', icon: BookOpen },
          { label: 'Étudiants', value: '156', icon: Users },
          { label: 'Quiz créés', value: '34', icon: ClipboardCheck },
          { label: 'Taux de réussite', value: '87%', icon: Award }
        ];
      case 'etudiant':
        return [
          { label: 'Cours suivis', value: '8', icon: BookOpen },
          { label: 'Quiz complétés', value: '24', icon: ClipboardCheck },
          { label: 'Score moyen', value: '85%', icon: Award },
          { label: 'Heures d\'étude', value: '127h', icon: Activity }
        ];
      default:
        return [];
    }
  };

  const handleSave = () => {
    // Ici vous pourriez ajouter la logique pour sauvegarder les modifications
    console.log('Sauvegarde des modifications:', editedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      username: user?.username ?? ''
    });
    setIsEditing(false);
  };



  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* En-tête du profil */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="text-2xl">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">
                    {user.firstName} {user.lastName}
                  </h1>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500">
                  Membre depuis {new Date(user.createdAt ?? Date.now()).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </div>
          </CardHeader>
        </Card>



        {/* Onglets du profil */}
        <Tabs defaultValue="informations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="informations">Informations</TabsTrigger>
            <TabsTrigger value="activite">Activité</TabsTrigger>
            <TabsTrigger value="parametres">Paramètres</TabsTrigger>
          </TabsList>

          {/* Onglet Informations */}
          <TabsContent value="informations">
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Gérez vos informations personnelles et de contact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={editedUser.firstName}
                        onChange={(e) => setEditedUser({...editedUser, firstName: e.target.value})}
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{user.firstName ?? 'Non renseigné'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={editedUser.lastName}
                        onChange={(e) => setEditedUser({...editedUser, lastName: e.target.value})}
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{user.lastName ?? 'Non renseigné'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editedUser.email}
                        onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{user.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    {isEditing ? (
                      <Input
                        id="username"
                        value={editedUser.username}
                        onChange={(e) => setEditedUser({...editedUser, username: e.target.value})}
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{user.username}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex space-x-2 pt-4">
                    <Button onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Activité */}
          <TabsContent value="activite">
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
                <CardDescription>
                  Votre activité récente sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Connexion récente</p>
                      <p className="text-sm text-gray-600">
                        Dernière connexion: {new Date().toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  {/* Ici vous pourriez ajouter plus d'activités selon le rôle */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Paramètres */}
          <TabsContent value="parametres">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du compte</CardTitle>
                <CardDescription>
                  Gérez vos préférences et paramètres de sécurité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Settings className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Préférences</p>
                      <p className="text-sm text-gray-600">
                        Configurez vos préférences d'affichage et de notification
                      </p>
                    </div>
                  </div>
                  {/* Ici vous pourriez ajouter plus de paramètres */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
