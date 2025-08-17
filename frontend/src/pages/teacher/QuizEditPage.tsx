import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown,
  AlertCircle,
  Pencil
} from 'lucide-react';
import { quizService } from '@/services';
import type { TeacherQuiz, Question } from '@/services/quiz.service';
import { QuestionEditor } from '@/components/quiz/QuestionEditor';

// Schéma de validation pour le formulaire
const quizSchema = z.object({
  title: z.string().min(3, { message: 'Le titre doit contenir au moins 3 caractères' }),
  description: z.string().optional(),
  timeLimit: z.number().min(1, { message: 'La durée doit être d\'au moins 1 minute' }),
  passingScore: z.number().min(0, { message: 'Le score de réussite doit être positif' }).max(100, { message: 'Le score de réussite ne peut pas dépasser 100%' }),
  showResults: z.boolean(),
  allowRetries: z.boolean(),
  shuffleQuestions: z.boolean(),
  shuffleAnswers: z.boolean(),
  status: z.enum(['draft', 'published', 'closed'])
});

type QuizFormValues = z.infer<typeof quizSchema>;

export default function QuizEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<TeacherQuiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('questions');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: '',
      description: '',
      timeLimit: 30,
      passingScore: 70,
      showResults: true,
      allowRetries: false,
      shuffleQuestions: false,
      shuffleAnswers: false,
      status: 'draft' as const
    }
  });

  useEffect(() => {
    const fetchQuizDetails = async () => {
      if (!id) {
        setError("ID du quiz non spécifié");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const quizData = await quizService.getQuiz(id);
        setQuiz(quizData as TeacherQuiz);
        setQuestions(quizData.questions || []);
        
        // Mettre à jour les valeurs du formulaire
        reset({
          title: quizData.title,
          description: quizData.description ?? '',
          timeLimit: quiz?.timeLimit as number || 30,
          passingScore: quiz?.passingScore as number || 70,
          showResults: quizData.settings?.showResults !== false,
          allowRetries: quizData.settings?.allowRetries === true,
          shuffleQuestions: quizData.settings?.shuffleQuestions === true,
          shuffleAnswers: quizData.settings?.shuffleAnswers === true,
          status: (quiz?.status as 'draft' | 'published' | 'closed') || 'draft' as const
        });
        
        setError(null);
      } catch (err) {
        console.error("Erreur lors de la récupération du quiz:", err);
        setError("Impossible de charger les détails du quiz. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [id, reset]);

  const onSubmit = async (formData: QuizFormValues) => {
    console.log(' onSubmit appelé avec:', formData);
    if (!quiz) {
      console.error(' Pas de quiz à modifier');
      return;
    }
    
    console.log('📝 Quiz actuel:', quiz);
    setSaving(true);
    try {
      // Préparer les questions avec les options
      const formattedQuestions = questions.map((question, index) => {
        // Préparer les options de la question
        const questionOptions = (question.options ?? []).map((opt: any, optIndex) => ({
          id: opt.id ? parseInt(String(opt.id)) : undefined,
          text: opt.text ?? `Option ${optIndex + 1}`,
          is_correct: Boolean(opt.isCorrect || opt.correct || opt.is_correct),
          order_index: optIndex + 1
        }));
        
        // S'assurer qu'il y a au moins une option correcte
        const hasCorrectAnswer = questionOptions.some((opt: any) => opt.is_correct);
        if (questionOptions.length > 0 && !hasCorrectAnswer && questionOptions[0]) {
          questionOptions[0].is_correct = true; // Marquer la première option comme correcte par défaut
        }
        
        return {
          id: question.id ? parseInt(String(question.id)) : undefined,
          text: question.text ?? `Question ${index + 1}`,
          type: question.type ?? 'multiple_choice',
          order_index: index + 1,
          points: question.points ?? 1,
          options: questionOptions
        };
      });
      
      // Préparer les données pour l'API en utilisant l'interface TeacherQuiz
      const updateData: any = {
        id: quiz.id ? parseInt(String(quiz.id)) : undefined,
        title: formData.title ?? 'Sans titre',
        description: formData.description ?? '',
        // Utilisation des propriétés de l'interface TeacherQuiz
        courseId: quiz.courseId ?? (quiz as any).course_id ?? '1',
        lessonId: quiz.lessonId ?? (quiz as any).lesson_id ?? null,
        timeLimit: formData.timeLimit ?? 30,
        passingScore: formData.passingScore ?? 70,
        isPublished: formData.status === 'published',
        status: formData.status ?? 'draft',
        settings: {
          passingScore: formData.passingScore ?? 70,
          showResults: formData.showResults ?? true,
          allowRetries: formData.allowRetries ?? true,
          shuffleQuestions: formData.shuffleQuestions ?? false,
          shuffleAnswers: formData.shuffleAnswers ?? false,
          showExplanations: true,
          showCorrectAnswers: true,
          showScore: true,
          requireFullScreen: false
        },
        questions: formattedQuestions,
        // Ajout des champs requis par le backend
        createdAt: quiz.createdAt ?? (quiz as any).created_at ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creatorId: (quiz as any).creator_id ?? (quiz as any).creatorId ?? 1,
        metadata: (quiz as any).metadata ?? {}
      };
      
      // Ajout des alias pour la compatibilité avec le backend
      updateData.course_id = updateData.courseId;
      updateData.lesson_id = updateData.lessonId;
      updateData.time_limit = updateData.timeLimit;
      updateData.passing_score = updateData.passingScore;
      updateData.is_published = updateData.isPublished;
      updateData.created_at = updateData.createdAt;
      updateData.updated_at = updateData.updatedAt;
      updateData.creator_id = updateData.creatorId;
      
      console.log("📤 Données à sauvegarder:", JSON.stringify(updateData, null, 2));
      console.log("🔗 ID du quiz:", id);
      
      // Appel réel à l'API
      console.log("⏳ Appel de quizService.updateQuiz...");
      if (!id) {
        throw new Error('ID du quiz non défini');
      }
      const result = await quizService.updateQuiz(id, updateData);
      console.log("✅ Résultat de l'API:", result);
      
      // Rediriger vers la liste des quiz avec un message de succès
      navigate('/enseignant/quiz', {
        state: {
          notification: {
            type: 'success',
            message: 'Quiz modifié avec succès !'
          }
        }
      });
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du quiz:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Impossible de sauvegarder les modifications. Veuillez réessayer plus tard.");
      }
    } finally {
      setSaving(false);
    }
  };

  const moveQuestionUp = (index: number) => {
    if (index === 0) {
      return;
    }

    const newQuestions = [...questions];
    const newIndex = index - 1;
    
    // Échanger les questions
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    
    setQuestions(newQuestions);
  };

  const moveQuestionDown = (index: number) => {
    if (index === questions.length - 1) {
      return;
    }

    const newQuestions = [...questions];
    const newIndex = index + 1;
    
    // Échanger les questions
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    
    setQuestions(newQuestions);
  };



  const addNewQuestion = () => {
    const timestamp = Date.now();
    const newQuestion: Question = {
      id: `new-question-${timestamp}`,
      text: 'Nouvelle question',
      type: 'multiple_choice',
      points: 1,
      order_index: questions.length + 1,
      options: [
        { 
          id: `option-1-${timestamp}`, 
          text: 'Option 1',
          isCorrect: true
        },
        { 
          id: `option-2-${timestamp}`, 
          text: 'Option 2',
          isCorrect: false
        }
      ],
      correctAnswers: [`option-1-${timestamp}`]
    };
    
    setQuestions([...questions, newQuestion]);
    setEditingQuestionIndex(questions.length);
  };
  
  const updateQuestion = (index: number, updatedQuestion: Question) => {
    console.group('🔄 Mise à jour de la question', index);
    try {
      console.log('📝 Question avant mise à jour:', questions[index]);
      console.log('📝 Nouvelles données:', updatedQuestion);
      
      // Créer une copie profonde du tableau des questions
      const newQuestions = questions.map(q => ({...q, options: [...(q.options || [])]}));
      
      // S'assurer que les options existent
      if (!updatedQuestion.options) {
        updatedQuestion.options = [];
      }
      
      // Formater les options
      const formattedOptions = updatedQuestion.options.map((opt, i) => {
        // Créer un nouvel objet d'option avec les propriétés nécessaires
        const option = {
          ...opt,
          id: opt.id || `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: opt.text || `Option ${i + 1}`,
          isCorrect: Boolean(opt.isCorrect),
          order_index: i + 1
        };
        
        console.log(`📌 Option ${i + 1}:`, option);
        return option;
      });
      
      // Mettre à jour la question avec les options formatées
      newQuestions[index] = {
        ...updatedQuestion,
        id: updatedQuestion.id || `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        options: formattedOptions,
        order_index: index + 1
      };
      
      console.log('✅ Question après mise à jour:', newQuestions[index]);
      
      // Mettre à jour l'état
      setQuestions(newQuestions);
      setEditingQuestionIndex(null);
      
      return newQuestions[index];
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la question:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  };
  
  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
    } else if (editingQuestionIndex !== null && editingQuestionIndex > index) {
      setEditingQuestionIndex(editingQuestionIndex - 1);
    }
  };
  
  const startEditing = (index: number) => {
    setEditingQuestionIndex(index);
  };
  
  const cancelEditing = () => {
    setEditingQuestionIndex(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!quiz) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Quiz non trouvé</AlertTitle>
        <AlertDescription>Le quiz demandé n'existe pas ou a été supprimé.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <form id="quiz-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/enseignant/quiz/${id}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Modifier le quiz</h1>
          </div>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
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
                      <Input id="title" {...field} />
                    )}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Textarea id="description" {...field} />
                    )}
                  />
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
                      <div key={question.id || index} className="mb-4">
                        {editingQuestionIndex === index ? (
                          <QuestionEditor
                            question={question}
                            index={index}
                            onUpdate={(updated) => updateQuestion(index, updated)}
                            onCancel={cancelEditing}
                            onRemove={() => removeQuestion(index)}
                          />
                        ) : (
                          <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium">Question {index + 1}</p>
                                <p className="mt-1">{question.text}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => startEditing(index)}
                                  title="Modifier"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => moveQuestionUp(index)}
                                  disabled={index === 0}
                                  title="Déplacer vers le haut"
                                >
                                  <MoveUp className="h-4 w-4" />
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => moveQuestionDown(index)}
                                  disabled={index === questions.length - 1}
                                  title="Déplacer vers le bas"
                                >
                                  <MoveDown className="h-4 w-4" />
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => removeQuestion(index)}
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {question.options && question.options.length > 0 && (
                              <div className="mt-3 pl-2">
                                <p className="text-sm font-medium text-gray-500 mb-1">Options :</p>
                                <ul className="space-y-1">
                                  {question.options.map((option, optIndex) => (
                                    <li key={optIndex} className="text-sm flex items-center">
                                      <span className={`inline-flex items-center justify-center w-5 h-5 mr-2 rounded-full text-xs ${
                                        question.correctAnswers?.includes(option.id) 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-gray-100 text-gray-500'
                                      }`}>
                                        {optIndex + 1}
                                      </span>
                                      <span className={question.correctAnswers?.includes(option.id) ? 'font-medium text-green-700' : ''}>
                                        {option.text}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Aucune question dans ce quiz. Cliquez sur "Ajouter une question" pour commencer.</p>
                )}
              </CardContent>
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
      </form>
    </div>
  );
}
