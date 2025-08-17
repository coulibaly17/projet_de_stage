import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Mail, Lock, User, AlertCircle, School, Briefcase, ArrowLeft
} from 'lucide-react'


type UserRole = 'etudiant' | 'enseignant'

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('etudiant')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Détecter si on vient du dashboard admin
  const fromAdmin = searchParams.get('from') === 'admin'

  useEffect(() => {
    // Fixer le rôle selon le contexte
    if (fromAdmin) {
      setRole('enseignant') // Toujours enseignant si on vient du dashboard admin
    } else {
      setRole('etudiant') // Toujours étudiant pour l'inscription normale
    }
  }, [fromAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      return setError('Les mots de passe ne correspondent pas.')
    }

    if (!acceptTerms) {
      return setError('Vous devez accepter les conditions d’utilisation.')
    }

    setIsLoading(true)

    try {
      await registerUser({
        email,
        username: email.split('@')[0],
        firstName,
        lastName: lastName || ' ',
        password,
        role,
      })

      if (fromAdmin) {
        // Si on vient du dashboard admin, rediriger vers admin avec message de succès
        navigate('/admin', {
          state: { 
            message: 'Enseignant invité avec succès ! Un email de confirmation a été envoyé.',
            type: 'success'
          },
        })
      } else {
        // Redirection normale vers la connexion pour les inscriptions d'étudiants
        navigate('/connexion', {
          state: { message: 'Inscription réussie ! Connectez-vous.' },
        })
      }
    } catch (err) {
      setError("Une erreur s'est produite. Réessayez plus tard.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 space-y-6"
      >
        {fromAdmin && (
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin')} 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin')} 
              className="flex items-center gap-2"
            >
              Annuler
            </Button>
          </div>
        )}
        
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {fromAdmin ? 'Inviter un enseignant' : 'Créer un compte EduAI'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {fromAdmin ? (
              'Créez un compte pour un nouvel enseignant'
            ) : (
              <>
                Déjà inscrit ?{' '}
                <Link to="/connexion" className="text-blue-600 hover:underline dark:text-blue-400">
                  Connectez-vous
                </Link>
              </>
            )}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Label htmlFor="firstName">Prénom</Label>
              <User className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
              <Input
                id="firstName"
                required
                placeholder="Prénom"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Label htmlFor="lastName">Nom</Label>
              <User className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
              <Input
                id="lastName"
                required
                placeholder="Nom"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="relative">
            <Label htmlFor="email">Adresse email</Label>
            <Mail className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
            <Input
              id="email"
              required
              type="email"
              placeholder="votre@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>

          <div>
            <Label htmlFor="role">Type de compte</Label>
            <div className="flex items-center p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
              {role === 'enseignant' ? (
                <>
                  <Briefcase className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="text-sm font-medium">Compte Enseignant</span>
                </>
              ) : (
                <>
                  <School className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-sm font-medium">Compte Étudiant</span>
                </>
              )}
            </div>
          </div>

          <div className="relative">
            <Label htmlFor="password">Mot de passe</Label>
            <Lock className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
            <Lock className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
            <Input
              id="confirm-password"
              type="password"
              required
              placeholder="••••••••"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(v) => setAcceptTerms(!!v)}
            />
            <Label htmlFor="terms" className="text-sm">
              J’accepte les{' '}
              <Link to="/conditions" className="text-blue-600 hover:underline dark:text-blue-400">
                conditions d’utilisation
              </Link>{' '}
              et la{' '}
              <Link to="/confidentialite" className="text-blue-600 hover:underline dark:text-blue-400">
                politique de confidentialité
              </Link>
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Création du compte...' : 'S’inscrire'}
          </Button>
        </form>
      </motion.div>
    </main>
  )
}
