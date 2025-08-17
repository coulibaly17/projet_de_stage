import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔵 Soumission du formulaire')
    setIsLoading(true)
    setError('')

    try {
      const loginSuccess = await login(email, password)
      
      if (loginSuccess) {
        console.log('🔄 Connexion réussie')
        
        // Si une redirection spécifique était demandée, l'utiliser
        if (redirectTo) {
          navigate(redirectTo, { replace: true })
        } else {
          // Rediriger vers la page d'accueil par défaut
          navigate('/', { replace: true });
        }
      }
    } catch (err: any) {
      console.log('Erreur lors de la connexion:', err);
      
      // Afficher le message d'erreur immédiatement
      const errorMessage = err.message || 'Une erreur inattendue est survenue. Veuillez réessayer.';
      setError(errorMessage);
      
      // Vérifier si c'est une erreur de compte désactivé
      const isAccountDisabled = err.message?.includes('désactivé') || err.isAccountDisabled;
      
      // Utiliser setTimeout pour s'assurer que l'état est mis à jour avant d'afficher l'alerte
      if (isAccountDisabled) {
        // Créer un élément d'alerte personnalisé
        const alertDiv = document.createElement('div');
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.left = '50%';
        alertDiv.style.transform = 'translateX(-50%)';
        alertDiv.style.backgroundColor = '#fef2f2';
        alertDiv.style.color = '#b91c1c';
        alertDiv.style.padding = '16px';
        alertDiv.style.borderRadius = '8px';
        alertDiv.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        alertDiv.style.zIndex = '1000';
        alertDiv.style.maxWidth = '90%';
        alertDiv.style.width = '400px';
        alertDiv.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 8px;">Compte désactivé</div>
          <div style="margin-bottom: 8px;">Votre compte a été désactivé par un administrateur.</div>
          <div>Pour plus d'informations, veuillez contacter : <a href="mailto:admin@eduai.com" style="color: #b91c1c; text-decoration: underline;">admin@eduai.com</a></div>
        `;
        
        // Ajouter l'alerte au document
        document.body.appendChild(alertDiv);
        
        // Supprimer l'alerte après 10 secondes
        setTimeout(() => {
          if (document.body.contains(alertDiv)) {
            document.body.removeChild(alertDiv);
          }
        }, 10000);
      }
      
      // Mettre le focus sur le champ email pour faciliter une nouvelle tentative
      setTimeout(() => {
        const emailField = document.getElementById('email');
        if (emailField) {
          emailField.focus();
        }
      }, 100);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 space-y-6"
      >
        {/* Titre */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Bienvenue sur EduAI
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Pas encore de compte ?{' '}
            <Link
              to="/inscription"
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Inscrivez-vous ici
            </Link>
          </p>
        </div>

        {/* Alerte erreur */}
        {error && (
          <Alert variant={error.includes('désactivé') ? 'warning' : 'destructive'} className="animate-pulse">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p>{error}</p>
              {error.includes('désactivé') && (
                <div className="mt-2">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Pour plus d'informations, veuillez contacter l'administrateur à l'adresse :
                  </p>
                  <a 
                    href="mailto:admin@eduai.com" 
                    className="text-sm font-medium text-amber-800 dark:text-amber-200 hover:underline"
                  >
                    admin@eduai.com
                  </a>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="relative">
            <Label htmlFor="email" className="sr-only">Email</Label>
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              id="email"
              type="email"
              required
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              autoComplete="email"
            />
          </div>

          {/* Mot de passe */}
          <div className="relative">
            <div className="flex justify-between mb-1">
              <Label htmlFor="password" className="sr-only">Mot de passe</Label>
              <Link
                to="/mot-de-passe-oublie"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              id="password"
              type="password"
              required
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              autoComplete="current-password"
            />
          </div>

          {/* Checkbox "remember me" */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(!!checked)}
            />
            <Label htmlFor="remember" className="text-sm text-gray-700 dark:text-gray-300">
              Se souvenir de moi
            </Label>
          </div>

          {/* Bouton */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-500">
          © {new Date().getFullYear()} EduAI. Tous droits réservés.
        </p>
      </motion.div>
    </main>
  )
}
