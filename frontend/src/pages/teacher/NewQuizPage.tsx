import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  Plus, 
  Trash2,
  Check,
} from 'lucide-react';
import { quizService } from '@/services';
import { courseService } from '@/services/course.service';
import type { Question } from '@/services/quiz.service';

// Schéma de validation pour le formulaire
const quizSchema = z.object({
  title: z.string().min(3, { message: 'Le titre doit contenir au moins 3 caractères' }),
  description: z.string().optional(),
  courseId: z.number().positive({ message: 'Veuillez sélectionner un cours' }),
  lessonId: z.number().positive({ message: 'Veuillez sélectionner une leçon' }),
  timeLimit: z.number().min(1, { message: 'La durée doit être d\'au moins 1 minute' }),
  passingScore: z.number().min(0, { message: 'Le score de réussite doit être positif' }).max(100, { message: 'Le score de réussite ne peut pas dépasser 100%' }),
  showResults: z.boolean(),
  allowRetries: z.boolean(),
  shuffleQuestions: z.boolean(),
  shuffleAnswers: z.boolean(),
  status: z.enum(['draft', 'published', 'closed'])
});

type QuizFormValues = z.infer<typeof quizSchema>;

export default function NewQuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [courses, setCourses] = useState<{id: number, title: string}[]>([]);
  const [lessons, setLessons] = useState<{id: number, title: string}[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // Vérifier que l'enseignant a des cours et rediriger sinon
  useEffect(() => {
    const checkTeacherCoursesAndFetch = async () => {
      setLoadingCourses(true);
      try {
        console.log('Début de la récupération des cours du professeur...');
        const teacherCourses = await courseService.getTeacherCourses();
        console.log('Cours récupérés depuis l\'API:', teacherCourses);
        console.log('Nombre de cours récupérés:', teacherCourses?.length || 0);
        
        if (teacherCourses.length === 0) {
          // Rediriger vers la page des quiz avec un message d'erreur
          navigate('/enseignant/quiz', {
            state: {
              notification: {
                type: 'error',
                message: 'Vous devez avoir au moins un cours pour créer un quiz. Contactez l\'administrateur pour vous assigner un cours.'
              }
            }
          });
          return;
        }
        
        // Mapper les cours pour l'interface
        const mappedCourses = teacherCourses.map(course => ({
          id: course.id,
          title: (course as any).name || course.title || `Cours ${course.id}`
        }));
        
        setCourses(mappedCourses);
        
        // Sélectionner automatiquement le premier cours
        if (mappedCourses.length > 0) {
          setValue('courseId', mappedCourses[0].id);
          // Charger les leçons du premier cours
          loadLessonsForCourse(mappedCourses[0].id);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des cours:", err);
        setError('Impossible de charger les cours. Veuillez réessayer.');
        // Rediriger en cas d'erreur
        navigate('/enseignant/quiz', {
          state: {
            notification: {
              type: 'error',
              message: 'Erreur lors du chargement des cours. Veuillez réessayer.'
            }
          }
        });
      } finally {
        setLoadingCourses(false);
      }
    };

    checkTeacherCoursesAndFetch();
  }, [navigate]);

  // Fonction pour charger les leçons d'un cours
  const loadLessonsForCourse = async (courseId: number) => {
    if (!courseId) {
      setLessons([]);
      return;
    }

    setLoadingLessons(true);
    try {
      // Utiliser l'endpoint pour récupérer les modules et leçons d'un cours
      const courseWithModules = await courseService.getCourseWithModules(courseId);
      console.log('Cours avec modules récupéré:', courseWithModules);
      
      // Extraire toutes les leçons de tous les modules
      const allLessons: {id: number, title: string}[] = [];
      if (courseWithModules && courseWithModules.modules && Array.isArray(courseWithModules.modules)) {
        courseWithModules.modules.forEach((module: any) => {
          if (module.lessons && Array.isArray(module.lessons)) {
            module.lessons.forEach((lesson: any) => {
              allLessons.push({
                id: lesson.id,
                title: lesson.title || `Leçon ${lesson.id}`
              });
            });
          }
        });
      }
      
      console.log('Leçons extraites:', allLessons);
      setLessons(allLessons);
      
      // Sélectionner automatiquement la première leçon
      if (allLessons.length > 0) {
        setValue('lessonId', allLessons[0].id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des leçons:', error);
      setLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: '',
      description: '',
      courseId: 0,
      lessonId: 0,
      timeLimit: 30,
      passingScore: 70,
      showResults: true,
      allowRetries: false,
      shuffleQuestions: false,
      shuffleAnswers: false,
      status: 'draft' as const
    }
  });

  const onSubmit = async (data: QuizFormValues) => {
    setSaving(true);
    setError(null); // Réinitialiser les erreurs précédentes
    
    try {
      // Vérifier si des questions ont été ajoutées
      if (questions.length === 0) {
        throw new Error('Veuillez ajouter au moins une question à ce quiz.');
      }
      
      // Vérifier que chaque question a au moins une réponse correcte
      const invalidQuestions = questions.filter(q => !q.options?.some(o => o.isCorrect));
      if (invalidQuestions.length > 0) {
        throw new Error(`${invalidQuestions.length} question(s) n'ont pas de réponse correcte. Veuillez marquer au moins une réponse correcte pour chaque question.`);
      }

      // Formater les questions pour le backend
      const formattedQuestions = questions.map(question => ({
        ...question,
        // S'assurer que les options ont bien un champ isCorrect
        options: question.options?.map(option => ({
          ...option,
          isCorrect: Boolean(option.isCorrect) // S'assurer que c'est un booléen
        })) || [],
        // Pour la rétrocompatibilité, conserver correctAnswers
        correctAnswers: question.options
          ?.filter(opt => opt.isCorrect)
          .map(opt => opt.id) || []
      }));
      
      // Créer un nouveau quiz avec l'API
      const newQuizData = {
        ...data,
        questions: formattedQuestions,
        settings: {
          showResults: data.showResults,
          allowRetries: data.allowRetries,
          shuffleQuestions: data.shuffleQuestions,
          shuffleAnswers: data.shuffleAnswers,
          timeLimit: data.timeLimit,
          passingScore: data.passingScore,
          // Ajout des propriétés manquantes
          showExplanations: true,
          showCorrectAnswers: true,
          showScore: true,
          requireFullScreen: false
        },
        courseId: parseInt(String(data.courseId)) || 1, // S'assurer que c'est un nombre entier
        metadata: {
          difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
          categories: [],
          tags: [],
          createdAt: new Date().toISOString()
        }
      };
      
      console.log('Données du quiz à envoyer:', JSON.stringify(newQuizData, null, 2));
      
      try {
        // Afficher une notification de traitement
        const notificationElement = document.createElement('div');
        notificationElement.className = 'fixed top-4 right-4 bg-blue-500 text-white p-4 rounded shadow-lg z-50 flex items-center';
        notificationElement.innerHTML = `
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Création du quiz en cours...</span>
        `;
        document.body.appendChild(notificationElement);
        
        // Appeler l'API pour créer le quiz
        const response = await quizService.createQuiz(newQuizData);
        console.log("Quiz créé avec succès:", response);
        
        // Remplacer par une notification de succès
        document.body.removeChild(notificationElement);
        const successNotification = document.createElement('div');
        successNotification.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded shadow-lg z-50 flex items-center';
        successNotification.innerHTML = `
          <svg class="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Quiz créé avec succès! Redirection...</span>
        `;
        document.body.appendChild(successNotification);
        
        // Rediriger après un court délai
        const redirectTimer = setTimeout(() => {
          // Nettoyer la notification avant la redirection
          if (document.body.contains(successNotification)) {
            document.body.removeChild(successNotification);
          }
          console.log('Redirection vers /enseignant/quiz');
          navigate('/enseignant/quiz');
        }, 1500);
        
        // Redirection alternative au cas où setTimeout ne fonctionne pas
        setTimeout(() => {
          clearTimeout(redirectTimer);
          console.log('Redirection alternative vers /enseignant/quiz');
          window.location.href = '/enseignant/quiz';
        }, 3000);
      } catch (apiError: any) {
        console.error('Erreur API:', apiError);
        
        // En mode développement, simuler la création réussie si l'API n'est pas disponible
        if (process.env.NODE_ENV === 'development') {
          console.warn("API non disponible, simulation de création de quiz en mode développement");
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Afficher une notification de succès (simulation)
          const successNotification = document.createElement('div');
          successNotification.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded shadow-lg z-50 flex items-center';
          successNotification.innerHTML = `
            <svg class="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Quiz créé avec succès! (Mode développement) Redirection...</span>
          `;
          document.body.appendChild(successNotification);
          
          const redirectTimer = setTimeout(() => {
            // Nettoyer la notification avant la redirection
            if (document.body.contains(successNotification)) {
              document.body.removeChild(successNotification);
            }
            console.log('Redirection vers /enseignant/quiz (mode dev)');
            navigate('/enseignant/quiz');
          }, 1500);
          
          // Redirection alternative au cas où setTimeout ne fonctionne pas
          setTimeout(() => {
            clearTimeout(redirectTimer);
            console.log('Redirection alternative vers /enseignant/quiz (mode dev)');
            window.location.href = '/enseignant/quiz';
          }, 3000);
        } else {
          throw apiError;
        }
      }
    } catch (err: any) {
      console.error("Erreur lors de la création du quiz:", err);
      
      // Afficher l'erreur dans une notification visible
      const errorMessage = err.message || "Impossible de créer le quiz. Veuillez réessayer plus tard.";
      setError(errorMessage);
      
      // Créer une alerte d'erreur visible
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded shadow-lg z-50 flex items-center';
      errorNotification.innerHTML = `
        <svg class="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>${errorMessage}</span>
      `;
      document.body.appendChild(errorNotification);
      
      // Supprimer l'alerte après 5 secondes
      setTimeout(() => {
        if (document.body.contains(errorNotification)) {
          document.body.removeChild(errorNotification);
        }
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  const addNewQuestion = () => {
    const timestamp = Date.now();
    const option1Id = `option-1-${timestamp}`;
    const option2Id = `option-2-${timestamp}`;
    
    const newQuestion: Question = {
      id: `new-question-${timestamp}`,
      text: 'Nouvelle question',
      type: 'single',
      options: [
        { id: option1Id, text: 'Option 1', isCorrect: true },
        { id: option2Id, text: 'Option 2', isCorrect: false }
      ],
      points: 1
    };
    
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };
  
  const updateQuestionText = (index: number, text: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      text
    };
    setQuestions(updatedQuestions);
  };
  
  const updateOptionText = (questionIndex: number, optionIndex: number, text: string) => {
    const updatedQuestions = [...questions];
    // Vérifier que options existe avant de l'utiliser
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = [];
    }
    const updatedOptions = [...(updatedQuestions[questionIndex].options || [])];
    updatedOptions[optionIndex] = {
      ...updatedOptions[optionIndex],
      text
    };
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: updatedOptions
    };
    setQuestions(updatedQuestions);
  };
  
  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const newOption = {
      id: `option-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text: 'Nouvelle option',
      isCorrect: false
    };
    // Vérifier que options existe avant de l'utiliser
    const currentOptions = updatedQuestions[questionIndex].options || [];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: [...currentOptions, newOption]
    };
    setQuestions(updatedQuestions);
  };
  
  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    // Vérifier que options existe avant de l'utiliser
    if (!updatedQuestions[questionIndex].options) {
      return; // Ne rien faire si pas d'options
    }
    const updatedOptions = updatedQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: updatedOptions
    };
    setQuestions(updatedQuestions);
  };
  
  const toggleCorrectAnswer = (questionIndex: number, optionId: string) => {
    setQuestions(prevQuestions => {
      const updatedQuestions = [...prevQuestions];
      const question = { ...updatedQuestions[questionIndex] };
      
      // S'assurer que les options existent
      if (!question.options) {
        question.options = [];
      }
      
      // Mettre à jour la propriété isCorrect de l'option
      question.options = question.options.map(option => {
        // Pour les questions à choix unique, seule l'option cliquée est vraie
        if (question.type === 'single') {
          return {
            ...option,
            isCorrect: option.id === optionId
          };
        }
        // Pour les questions à choix multiples, inverser l'état de l'option cliquée
        if (option.id === optionId) {
          return {
            ...option,
            isCorrect: !option.isCorrect
          };
        }
        return option;
      });
      
      updatedQuestions[questionIndex] = question;
      return updatedQuestions;
    });
  };
  
  const toggleQuestionType = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    const newType = question.type === 'single' ? 'multiple' : 'single';
    
    // Si on passe de multiple à single, on ne garde que la première réponse correcte
    const options = question.options || [];
    if (newType === 'single' && options.some(opt => opt.isCorrect)) {
      // Trouver la première option correcte
      const firstCorrectIndex = options.findIndex(opt => opt.isCorrect);
      
      // Mettre à jour les options pour n'avoir qu'une seule réponse correcte
      const updatedOptions = options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === firstCorrectIndex
      }));
      
      updatedQuestions[questionIndex] = {
        ...question,
        type: newType,
        options: updatedOptions
      };
    } else {
      // Pour le passage de single à multiple, on garde les réponses actuelles
      updatedQuestions[questionIndex] = {
        ...question,
        type: newType
      };
    }
    
    setQuestions(updatedQuestions);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/enseignant/quiz">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Créer un nouveau quiz</h1>
        </div>
        <Button onClick={handleSubmit(onSubmit)} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Création...' : 'Créer le quiz'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du quiz</Label>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <Input id="title" placeholder="Titre du quiz" {...field} />
                    )}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm">{errors.title.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Textarea 
                        id="description" 
                        placeholder="Description du quiz" 
                        className="min-h-[100px]" 
                        {...field} 
                        value={field.value || ''}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseId">Cours associé</Label>
                  <Controller
                    name="courseId"
                    control={control}
                    render={({ field }) => (
                      <select 
                        id="courseId"
                        className="w-full p-2 border rounded-md"
                        disabled={loadingCourses}
                        {...field}
                        onChange={(e) => {
                          const courseId = parseInt(e.target.value);
                          field.onChange(courseId);
                          // Charger les leçons du cours sélectionné
                          if (courseId > 0) {
                            loadLessonsForCourse(courseId);
                          } else {
                            setLessons([]);
                            setValue('lessonId', 0);
                          }
                        }}
                        value={field.value}
                      >
                        <option value="0">Sélectionner un cours</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.courseId && (
                    <p className="text-red-500 text-sm">{errors.courseId.message}</p>
                  )}
                  {loadingCourses && <p className="text-gray-500 text-sm">Chargement des cours...</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessonId">Leçon associée</Label>
                  <Controller
                    name="lessonId"
                    control={control}
                    render={({ field }) => (
                      <select 
                        id="lessonId"
                        className="w-full p-2 border rounded-md"
                        disabled={loadingLessons || lessons.length === 0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        value={field.value}
                      >
                        <option value="0">Sélectionner une leçon</option>
                        {lessons.map(lesson => (
                          <option key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.lessonId && (
                    <p className="text-red-500 text-sm">{errors.lessonId.message}</p>
                  )}
                  {loadingLessons && <p className="text-gray-500 text-sm">Chargement des leçons...</p>}
                  {!loadingLessons && lessons.length === 0 && (
                    <p className="text-gray-500 text-sm">Aucune leçon disponible pour ce cours</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeLimit">Durée (minutes)</Label>
                    <Controller
                      name="timeLimit"
                      control={control}
                      render={({ field }) => (
                        <Input 
                          id="timeLimit" 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      )}
                    />
                    {errors.timeLimit && (
                      <p className="text-sm text-red-500">{errors.timeLimit.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passingScore">Score de réussite (%)</Label>
                    <Controller
                      name="passingScore"
                      control={control}
                      render={({ field }) => (
                        <Input 
                          id="passingScore" 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      )}
                    />
                    {errors.passingScore && (
                      <p className="text-sm text-red-500">{errors.passingScore.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <select 
                        id="status" 
                        className="w-full p-2 border rounded-md"
                        {...field}
                      >
                        <option value="draft">Brouillon</option>
                        <option value="published">Publié</option>
                        <option value="closed">Fermé</option>
                      </select>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Questions</CardTitle>
                <Button type="button" onClick={addNewQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une question
                </Button>
              </CardHeader>
              <CardContent>
                {questions.length > 0 ? (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div key={question.id || index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-medium mb-2">Question {index + 1}</p>
                            <Input
                              value={question.text}
                              onChange={(e) => updateQuestionText(index, e.target.value)}
                              placeholder="Texte de la question"
                              className="mb-2"
                            />
                            <div className="flex items-center gap-2 mb-3">
                              <Button 
                                type="button" 
                                size="sm" 
                                variant={question.type === 'single' ? 'secondary' : 'outline'}
                                onClick={() => toggleQuestionType(index)}
                              >
                                Choix unique
                              </Button>
                              <Button 
                                type="button" 
                                size="sm" 
                                variant={question.type === 'multiple' ? 'secondary' : 'outline'}
                                onClick={() => toggleQuestionType(index)}
                              >
                                Choix multiple
                              </Button>
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeQuestion(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        
                        <div className="mt-2 border-t pt-2">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-medium text-gray-500">Options:</p>
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline" 
                              onClick={() => addOption(index)}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Ajouter option
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {question.options && question.options.map((option, optIndex) => {
                              const isChecked = option.isCorrect || false;
                              const inputId = `option-${index}-${optIndex}`;
                              
                              return (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <div 
                                    className={`flex-shrink-0 w-5 h-5 rounded-full border cursor-pointer flex items-center justify-center ${
                                      isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                    }`}
                                    onClick={() => toggleCorrectAnswer(index, option.id)}
                                  >
                                    {isChecked && (
                                      <Check className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                  
                                  {question.type === 'single' ? (
                                    <label 
                                      htmlFor={inputId}
                                      className="flex-1 flex items-center cursor-pointer"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        toggleCorrectAnswer(index, option.id);
                                      }}
                                    >
                                      <input
                                        type="radio"
                                        id={inputId}
                                        name={`question-${index}`}
                                        checked={isChecked}
                                        onChange={() => toggleCorrectAnswer(index, option.id)}
                                        className="sr-only"
                                      />
                                      <Input
                                        value={option.text}
                                        onChange={(e) => updateOptionText(index, optIndex, e.target.value)}
                                        placeholder="Texte de l'option"
                                        className="flex-1 ml-2"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </label>
                                  ) : (
                                    <label 
                                      htmlFor={inputId}
                                      className="flex-1 flex items-center cursor-pointer"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        toggleCorrectAnswer(index, option.id);
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        id={inputId}
                                        checked={isChecked}
                                        onChange={() => toggleCorrectAnswer(index, option.id)}
                                        className="sr-only"
                                      />
                                      <Input
                                        value={option.text}
                                        onChange={(e) => updateOptionText(index, optIndex, e.target.value)}
                                        placeholder="Texte de l'option"
                                        className="flex-1 ml-2"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </label>
                                  )}
                                  
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeOption(index, optIndex);
                                    }}
                                    disabled={question.options && question.options.length <= 2}
                                    className="ml-2"
                                  >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Aucune question dans ce quiz. Cliquez sur "Ajouter une question" pour commencer.</p>
                )}
              </CardContent>
              <CardFooter>
                <p className="text-sm text-gray-500">
                  Vous pouvez ajouter autant de questions que nécessaire. Chaque question peut avoir plusieurs options.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du quiz</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showResults">Afficher les résultats</Label>
                  <Controller
                    name="showResults"
                    control={control}
                    render={({ field }) => (
                      <Switch 
                        id="showResults" 
                        checked={field.value} 
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allowRetries">Autoriser les tentatives multiples</Label>
                  <Controller
                    name="allowRetries"
                    control={control}
                    render={({ field }) => (
                      <Switch 
                        id="allowRetries" 
                        checked={field.value} 
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="shuffleQuestions">Mélanger les questions</Label>
                  <Controller
                    name="shuffleQuestions"
                    control={control}
                    render={({ field }) => (
                      <Switch 
                        id="shuffleQuestions" 
                        checked={field.value} 
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="shuffleAnswers">Mélanger les réponses</Label>
                  <Controller
                    name="shuffleAnswers"
                    control={control}
                    render={({ field }) => (
                      <Switch 
                        id="shuffleAnswers" 
                        checked={field.value} 
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-gray-500">
                  Ces paramètres déterminent comment le quiz sera présenté aux étudiants.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Bouton de soumission fixe en bas de la page */}
        <div className="fixed bottom-6 right-6 flex gap-2">
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2"
            disabled={saving}
          >
            <Save className="h-5 w-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer le quiz'}
          </Button>
        </div>
      </form>
    </div>
  );
}
