import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useLocation, 
  Outlet,
  useParams
} from 'react-router-dom';

// Composant de redirection personnalisé pour les paramètres d'URL
const CourseRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/etudiant/cours/${id}`} replace />;
};

const StudentCourseRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/etudiant/cours/${id}`} replace />;
};
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Suspense, lazy, Component, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { ErrorInfo, ReactNode } from 'react';
import './index.css';

// Layouts
import { MainLayout } from './components/layout/MainLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { TeacherLayout } from './components/layout/TeacherLayout';
import { StudentLayout } from './components/layout/StudentLayout';

// Composants de chargement
import { PageLoading } from './components/ui/PageLoading';

// Auth
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoleBasedRoute } from './components/auth/RoleBasedRoute';

// Toast Provider
import { Toaster } from './components/ui/toaster';
import { ToastProvider } from './components/ui/use-toast';

// Composant ErrorBoundary pour gérer les erreurs de rendu
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-red-600">Une erreur est survenue. Veuillez recharger la page.</div>;
    }

    return this.props.children;
  }
}

// Fonction utilitaire pour le chargement paresseux avec gestion d'erreur
const lazyLoad = (path: string) => {
  return lazy(() =>
    (async () => {
      try {
        // Remove any leading './' or './src/' from the path
        const cleanPath = path.replace(/^\.\/src\//, '').replace(/^\.\//, '');
        // Import from the correct path
        const module = await import(/* @vite-ignore */ `./${cleanPath}`);
        return { default: module.default };
      } catch (error) {
        console.error(`Failed to load module: ${path}`, error);
        return { 
          default: () => <div>Erreur de chargement du module: {path}</div> 
        };
      }
    })()
  );
};

// Chargement paresseux des pages avec gestion d'erreur
const HomePage = lazyLoad('pages/public/HomePage');
const CoursesPage = lazyLoad('pages/public/CoursesPage');
const MessagingPage = lazy(() => import('@/components/messaging/MessagingPage').then(module => ({ default: module.default })));
const ContactPage = lazyLoad('pages/public/ContactPage');
const LoginPage = lazyLoad('pages/auth/LoginPage');
const RegisterPage = lazyLoad('pages/auth/RegisterPage');
const NotFoundPage = lazyLoad('pages/error/NotFoundPage');

// Tableaux de bord
const StudentDashboard = lazyLoad('pages/student/StudentDashboardPage');
const TeacherDashboard = lazyLoad('pages/teacher/ProDashboardPage');
const AdminDashboard = lazyLoad('pages/admin/DashboardPage');

// Pages de quiz pour les étudiants
const QuizHistoryPage = lazyLoad('pages/student/QuizHistoryPage');
const QuizResultDetailPage = lazyLoad('pages/student/QuizResultDetailPage');

// Pages de cours
const CourseViewPage = lazyLoad('pages/student/CourseViewPage');

// Pages étudiant
const StudentCourses = lazyLoad('pages/student/CoursesPage');
const StudentCourseView = lazyLoad('pages/student/CourseViewPage');
const StudentQuizzes = lazyLoad('pages/student/QuizzesPage');
const StudentQuiz = lazyLoad('pages/student/QuizPage');
const StudentQuizResults = lazyLoad('pages/student/QuizResultPage');
const StudentQuizResultsHistory = lazyLoad('pages/student/QuizResultsHistoryPage');
const StudentAssignments = lazyLoad('pages/student/AssignmentsPage');
const StudentRecommendations = lazyLoad('pages/student/RecommendationsPage');
const StudentProfile = lazyLoad('pages/student/ProfilePage');

// Page de profil unifiée
const ProfilePage = lazyLoad('pages/ProfilePage');

// Pages enseignant
const TeacherCourses = lazyLoad('pages/teacher/CoursesPage');
const TeacherCourseDetails = lazyLoad('pages/teacher/CourseDetailsPage');
const TeacherNewCourse = lazyLoad('pages/teacher/NewCoursePage');
const TeacherNewCourseWorkflow = lazyLoad('pages/teacher/NewCourseWorkflow');
const TeacherQuizzes = lazyLoad('pages/teacher/QuizzesPage');
const TeacherNewQuiz = lazyLoad('pages/teacher/NewQuizPage');
const TeacherQuizDetail = lazyLoad('pages/teacher/QuizDetailPage');
const TeacherQuizEdit = lazyLoad('pages/teacher/QuizEditPage');
const TeacherAssignments = lazyLoad('pages/teacher/AssignmentsPage');
const TeacherStudents = lazyLoad('pages/teacher/StudentsPage');
const TeacherStudentProfile = lazyLoad('pages/teacher/StudentProfilePage');
const TeacherStudentQuizResults = lazyLoad('pages/teacher/StudentQuizResultsPage');

// Pages admin
const AdminUsers = lazyLoad('pages/admin/UsersPage');
const AdminSettings = lazyLoad('pages/admin/SettingsPage');

// Pages de débogage temporaires
const AuthDebugPage = lazyLoad('pages/debug/AuthDebugPage');
const QuizDebugPage = lazyLoad('pages/debug/QuizDebugPage');

/**
 * Wrapper pour le chargement des pages
 */
const SuspenseWrapper = ({ children }: { readonly children: React.ReactNode }) => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoading />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Wrapper pour les routes protégées
 */
const ProtectedRoute = ({ children }: { readonly children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    // Marquer que la vérification initiale est terminée après le premier rendu
    setInitialCheckDone(true);
  }, []);

  // Vérifier manuellement le localStorage pour plus de sécurité
  const token = localStorage.getItem('authToken');
  const userJson = localStorage.getItem('user');

  // Logs pour le débogage
  useEffect(() => {
    console.log('ProtectedRoute - État:', { 
      isAuthenticated, 
      isLoading, 
      userExists: !!user,
      path: location.pathname,
      hasToken: !!token,
      hasUserJson: !!userJson
    });
  }, [isAuthenticated, isLoading, user, location.pathname, token, userJson]);

  // Afficher un écran de chargement pendant l'initialisation
  if (isLoading || !initialCheckDone) {
    console.log('ProtectedRoute - Chargement en cours...');
    return <PageLoading />;
  }

  // Si pas de token, rediriger vers la page de connexion
  if (!token) {
    console.log('ProtectedRoute - Pas de token, redirection vers /connexion');
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }

  // Si token mais utilisateur non chargé (mais chargement terminé)
  if (token && !user && !isLoading) {
    console.log('ProtectedRoute - Token présent mais utilisateur non chargé, tentative de rafraîchissement...');
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  // Si tout est bon, afficher le contenu protégé
  console.log('ProtectedRoute - Accès autorisé à', location.pathname);
  return <>{children}</>;
}

/**
 * Wrapper pour les routes invité uniquement
 */
const GuestOnlyRoute = ({ children }: { readonly children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoading />;
  }

  if (isAuthenticated) {
    // Vérifier si on est sur la page d'inscription et qu'on vient du dashboard admin
    const urlParams = new URLSearchParams(location.search);
    const fromAdmin = urlParams.get('from') === 'admin';
    const isInscriptionPage = location.pathname === '/inscription';
    
    // Permettre l'accès à l'inscription si on vient du dashboard admin
    if (isInscriptionPage && fromAdmin && user?.role === 'admin') {
      return <>{children}</>;
    }
    
    // Rediriger vers la page précédente ou le tableau de bord par défaut
    const from = location.state?.from ?? '/tableau-de-bord';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <ToastProvider>
      <AuthProvider>
        <Routes>
          {/* Redirections pour les URLs en anglais */}
          <Route path="/courses" element={<Navigate to="/cours" replace />} />
          <Route path="/courses/:id" element={<CourseRedirect />} />
          
          {/* Routes publiques */}
          <Route path="/" element={
            <MainLayout>
              <SuspenseWrapper><Outlet /></SuspenseWrapper>
            </MainLayout>
          }>
            <Route index element={<HomePage />} />
            <Route path="cours" element={<CoursesPage />} />
            <Route path="cours/:id" element={<CourseViewPage />} />
            
            {/* Routes d'authentification (uniquement pour les invités) */}
            <Route path="connexion" element={
              <GuestOnlyRoute>
                <LoginPage />
              </GuestOnlyRoute>
            } />
            <Route path="inscription" element={
              <GuestOnlyRoute>
                <RegisterPage />
              </GuestOnlyRoute>
            } />
            
            {/* Page de contact */}
            <Route path="contact" element={<ContactPage />} />
            
            {/* Pages de débogage temporaires */}
            <Route path="debug-auth" element={
              <div>
                <AuthDebugPage />
              </div>
            } />
            <Route path="debug-quiz" element={
              <div>
                <QuizDebugPage />
              </div>
            } />

            {/* Route 404 */}
            <Route path="*" element={
              <MainLayout>
                <NotFoundPage />
              </MainLayout>
            } />
          </Route>

          {/* Redirections pour le tableau de bord étudiant */}
          <Route path="/student" element={<Navigate to="/etudiant" replace />} />
          <Route path="/student/courses" element={<Navigate to="/etudiant/cours" replace />} />
          <Route path="/student/courses/:id" element={<StudentCourseRedirect />} />
          
          {/* Tableau de bord étudiant */}
          <Route path="/etudiant" element={
            <ProtectedRoute>
              <StudentLayout>
                <SuspenseWrapper><Outlet /></SuspenseWrapper>
              </StudentLayout>
            </ProtectedRoute>
          }>
            <Route index element={<StudentDashboard />} />
            <Route path="cours" element={<StudentCourses />} />
            <Route path="cours/:courseId" element={<StudentCourseView />} />
            <Route path="cours/:courseId/lecons/:lessonId" element={<StudentCourseView />} />
            <Route path="quiz" element={<StudentQuizzes />} />
            <Route path="quiz/:id" element={<StudentQuiz />} />
            <Route path="quiz/:id/resultats" element={<StudentQuizResults />} />
            <Route path="quiz-history" element={<QuizHistoryPage />} />
            <Route path="quiz-results/:resultId" element={<QuizResultDetailPage />} />
            <Route path="resultats" element={<StudentQuizResultsHistory />} />
            <Route path="devoirs" element={<StudentAssignments />} />
            <Route path="discussions" element={<Navigate to="/etudiant/messagerie" replace />} />
            <Route path="messagerie" element={<MessagingPage />}>
              <Route path=":discussionId" element={<MessagingPage />} />
            </Route>
            <Route path="recommandations" element={<StudentRecommendations />} />
            <Route path="profil" element={<StudentProfile />} />
          </Route>

          {/* Tableau de bord enseignant */}
          <Route path="/enseignant" element={
            <ProtectedRoute>
              <TeacherLayout>
                <SuspenseWrapper><Outlet /></SuspenseWrapper>
              </TeacherLayout>
            </ProtectedRoute>
          }>
            <Route index element={<TeacherDashboard />} />
            <Route path="cours" element={<TeacherCourses />} />
            <Route path="cours/:courseId" element={<TeacherCourseDetails />} />
            <Route path="cours/nouveau" element={<TeacherNewCourse />} />
            <Route path="cours/workflow" element={<TeacherNewCourseWorkflow />} />
            <Route path="quiz" element={<TeacherQuizzes />} />
            <Route path="quiz/nouveau" element={<TeacherNewQuiz />} />
            <Route path="quiz/:id" element={<TeacherQuizDetail />} />
            <Route path="quiz/:id/modifier" element={<TeacherQuizEdit />} />
            <Route path="devoirs" element={<TeacherAssignments />} />
            <Route path="etudiants" element={<TeacherStudents />} />
            <Route path="etudiants/:studentId/profil" element={<TeacherStudentProfile />} />
            <Route path="etudiants/:studentId/resultats" element={<TeacherStudentQuizResults />} />
            <Route path="messagerie" element={<MessagingPage />}>
              <Route path=":discussionId" element={<MessagingPage />} />
            </Route>
            <Route path="messages" element={<Navigate to="/enseignant/messagerie" replace />} />
            <Route path="messages/:discussionId" element={<Navigate to="/enseignant/messagerie/$1" replace />} />
            <Route path="profil" element={<ProfilePage />} />
          </Route>

          {/* Tableau de bord administrateur */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout>
                <SuspenseWrapper><Outlet /></SuspenseWrapper>
              </AdminLayout>
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="utilisateurs" element={<AdminUsers />} />
            <Route path="messagerie" element={<MessagingPage />}>
              <Route path=":discussionId" element={<MessagingPage />} />
            </Route>
            <Route path="messages" element={<Navigate to="/admin/messagerie" replace />} />
            <Route path="messages/:discussionId" element={<Navigate to="/admin/messagerie/$1" replace />} />
            <Route path="profil" element={<ProfilePage />} />
            #<Route path="parametres" element={<AdminSettings />} />
          </Route>

          {/* Redirection par défaut vers le tableau de bord approprié */}
          <Route path="/tableau-de-bord" element={
            <ProtectedRoute>
              <RoleBasedRoute 
                studentPath="/etudiant" 
                teacherPath="/enseignant" 
                adminPath="/admin"
              />
            </ProtectedRoute>
          } />

          {/* Page 404 - Doit être la dernière route */}
          <Route path="*" element={
            <MainLayout>
              <SuspenseWrapper>
                <NotFoundPage />
              </SuspenseWrapper>
            </MainLayout>
          } />
        </Routes>

        {/* React Query DevTools */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        
        {/* Toaster pour afficher les notifications */}
        <Toaster />
      </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
