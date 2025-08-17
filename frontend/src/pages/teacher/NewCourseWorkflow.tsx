import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Save, Plus } from 'lucide-react';
import { courseService } from '@/services/course.service';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Schémas de validation
const step1Schema = z.object({
  title: z.string().min(5, "Titre requis (min 5 caractères)").max(200),
  description: z.string().min(20, "Description requise (min 20 caractères)"),
  category: z.string().min(1, "Catégorie obligatoire"),
  level: z.string().min(1, "Niveau obligatoire"),
});

// Types
type Step1Data = z.infer<typeof step1Schema>;
type Module = {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
};
type Lesson = {
  id: string;
  title: string;
  type?: 'video' | 'text' | 'quiz';
  description?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  isFree?: boolean;
};

export default function NewCourseWorkflow() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [thumbnailError, setThumbnailError] = useState(false);
  // Prix par défaut à 0 (gratuit)
  const [isPublished, setIsPublished] = useState(false);

  // États pour les modules et leçons avec IDs stables
  const [modules, setModules] = useState<Module[]>([
    {
      id: uuidv4(),
      title: 'Module 1',
      lessons: [
        {
          id: uuidv4(),
          title: 'Leçon 1',
          type: 'video'
        }
      ]
    }
  ]);

  const [lessonsDetails, setLessonsDetails] = useState<Record<string, any>>({});

  // Formulaire étape 1
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      level: '',
    }
  });

  const getStepProgress = () => {
    return (currentStep / 4) * 100;
  };

  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    setModules(modules.map(m => m.id === moduleId ? { ...m, ...updates } : m));
  };

  const addModule = () => {
    const newModule = {
      id: uuidv4(),
      title: `Module ${modules.length + 1}`,
      lessons: []
    };
    console.log('Ajout d\'un module avec ID:', newModule.id);
    setModules([...modules, newModule]);
  };

  const addLesson = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;
    const newLesson: Lesson = {
      id: uuidv4(),
      title: `Leçon ${module.lessons.length + 1}`,
      type: 'video'
    };
    console.log('Ajout d\'une leçon à', moduleId, 'avec ID', newLesson.id);
    updateModule(moduleId, { lessons: [...module.lessons, newLesson] });
  };

  const updateLesson = (moduleId: string, lessonId: string, updates: Partial<Lesson>) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;
    updateModule(moduleId, {
      lessons: module.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l)
    });
  };

  const removeModule = (moduleId: string) => {
    setModules(modules.filter(m => m.id !== moduleId));
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;
    updateModule(moduleId, {
      lessons: module.lessons.filter(l => l.id !== lessonId)
    });
  };

  const nextStep = async () => {
    if (currentStep === 1) {
      const isValid = await step1Form.trigger();
      if (isValid) {
        setCurrentStep(2);
      }
    } else if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const submitCourse = async () => {
    // Éviter les soumissions multiples
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Attendre un tick pour stabiliser l'état
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Récupérer les données du formulaire étape 1
      const step1Data = step1Form.getValues();
      
      // Préparer les données du cours
      const courseData = {
        title: step1Data.title,
        description: step1Data.description,
        short_description: step1Data.description.substring(0, 300),
        category_id: parseInt(step1Data.category),
        level: step1Data.level,
        price: 0, // Cours gratuit par défaut
        thumbnail_url: thumbnailUrl || undefined,
        status: isPublished ? 'published' as const : 'draft' as const,
        modules: modules.map(module => ({
          title: module.title,
          description: module.description,
          lessons: module.lessons.map(lesson => {
            const details = lessonsDetails[lesson.id] || {};
            return {
              title: lesson.title,
              description: details.description ?? lesson.description,
              content: details.content ?? '',
              video_url: details.videoUrl ?? lesson.videoUrl,
              duration: details.duration ?? lesson.duration ?? 0,
              type: lesson.type,
              is_free: details.isFree ?? lesson.isFree ?? false
            };
          })
        }))
      };
      
      console.log('Envoi des données vers le backend:', courseData);
      
      // Créer le cours avec tout son contenu
      const result = await courseService.createCourseWithContent(courseData);
      
      toast.success(result.message);
      
      // Attendre avant la redirection pour éviter les conflits DOM
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Rediriger vers la page des cours
      navigate('/enseignant/cours');
      
    } catch (error: any) {
      console.error('Erreur lors de la création du cours:', error);
      toast.error(
        error?.response?.data?.detail ?? 
        error?.message ?? 
        'Erreur lors de la création du cours'
      );
    } finally {
      // Attendre avant de réinitialiser l'état
      setTimeout(() => {
        setIsSubmitting(false);
      }, 100);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Créer un nouveau cours</h1>
        <p className="text-gray-600 mt-2">Suivez les étapes pour créer votre cours complet</p>
        
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Étape {currentStep} sur 4</span>
            <span>{Math.round(getStepProgress())}%</span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && "Informations générales"}
            {currentStep === 2 && "Structure du cours"}
            {currentStep === 3 && "Contenu des leçons"}
            {currentStep === 4 && "Prix et publication"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Étape 1: Informations générales */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <FormField
                control={step1Form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre du cours *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Introduction à React" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={step1Form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description complète *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Décrivez votre cours..." className="min-h-32" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={step1Form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">informatique</SelectItem>
                          <SelectItem value="2">mathematique</SelectItem>
                          <SelectItem value="3">anglais</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Niveau *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un niveau" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Débutant</SelectItem>
                          <SelectItem value="intermediate">Intermédiaire</SelectItem>
                          <SelectItem value="advanced">Avancé</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormLabel>Image de couverture</FormLabel>
                <div className="mt-2">
                  <Input
                    type="url"
                    placeholder="URL de l'image de couverture"
                    value={thumbnailUrl}
                    onChange={(e) => {
                      setThumbnailUrl(e.target.value);
                      setThumbnailError(false);
                    }}
                  />
                  {thumbnailUrl && (
                    <div className="mt-4">
                      {thumbnailError ? (
                        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500">Image non disponible</span>
                        </div>
                      ) : (
                        <img
                          src={thumbnailUrl}
                          alt="Aperçu"
                          className="w-full h-48 object-cover rounded-lg"
                          onError={() => setThumbnailError(true)}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Structure du cours */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Modules du cours</h3>
                <Button onClick={addModule} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un module
                </Button>
              </div>

              <div className="space-y-4">
                {modules.map((module) => (
                  <Card key={module.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Input
                            value={module.title}
                            onChange={(e) => updateModule(module.id, { title: e.target.value })}
                            className="font-semibold text-lg border-none p-0 focus:ring-0"
                            placeholder="Titre du module"
                          />
                          <Textarea
                            value={module.description || ''}
                            onChange={(e) => updateModule(module.id, { description: e.target.value })}
                            placeholder="Description du module (optionnel)"
                            className="mt-2 min-h-20"
                          />
                        </div>
                        {modules.length > 1 && (
                          <Button
                            onClick={() => removeModule(module.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-sm text-gray-700">Leçons</h4>
                          <Button
                            onClick={() => addLesson(module.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Ajouter une leçon
                          </Button>
                        </div>

                        {module.lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <Input
                                value={lesson.title}
                                onChange={(e) => updateLesson(module.id, lesson.id, { title: e.target.value })}
                                placeholder="Titre de la leçon"
                                className="mb-2"
                              />
                              <Select
                                value={lesson.type}
                                onValueChange={(value) => updateLesson(module.id, lesson.id, { type: value as any })}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="video">Vidéo</SelectItem>
                                  <SelectItem value="text">Texte</SelectItem>
                                  <SelectItem value="quiz">Quiz</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {module.lessons.length > 1 && (
                              <Button
                                onClick={() => removeLesson(module.id, lesson.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                              >
                                ×
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Étape 3: Contenu des leçons */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Contenu détaillé des leçons</h3>
              
              {modules.map((module) => (
                <Card key={module.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{module.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {module.lessons.map((lesson) => (
                      <div key={lesson.id} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">{lesson.title}</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                              value={lessonsDetails[lesson.id]?.description || ''}
                              onChange={(e) => setLessonsDetails(prev => ({
                                ...prev,
                                [lesson.id]: { ...prev[lesson.id], description: e.target.value }
                              }))}
                              placeholder="Description de la leçon"
                              className="mt-1"
                            />
                          </div>

                          {lesson.type === 'video' && (
                            <>
                              <div>
                                <label className="text-sm font-medium">URL de la vidéo</label>
                                <Input
                                  value={lessonsDetails[lesson.id]?.videoUrl || ''}
                                  onChange={(e) => setLessonsDetails(prev => ({
                                    ...prev,
                                    [lesson.id]: { ...prev[lesson.id], videoUrl: e.target.value }
                                  }))}
                                  placeholder="https://..."
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Durée (minutes) - Optionnel</label>
                                <Input
                                  type="number"
                                  value={lessonsDetails[lesson.id]?.duration || ''}
                                  onChange={(e) => setLessonsDetails(prev => ({
                                    ...prev,
                                    [lesson.id]: { ...prev[lesson.id], duration: parseInt(e.target.value) || 0 }
                                  }))}
                                  placeholder="Laissez vide si inconnue"
                                  className="mt-1"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  La durée peut être ajoutée plus tard ou calculée automatiquement
                                </p>
                              </div>
                            </>
                          )}

                          {lesson.type === 'text' && (
                            <div>
                              <label className="text-sm font-medium">Contenu</label>
                              <Textarea
                                value={lessonsDetails[lesson.id]?.content || ''}
                                onChange={(e) => setLessonsDetails(prev => ({
                                  ...prev,
                                  [lesson.id]: { ...prev[lesson.id], content: e.target.value }
                                }))}
                                placeholder="Contenu de la leçon..."
                                className="mt-1 min-h-32"
                              />
                            </div>
                          )}

                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={lessonsDetails[lesson.id]?.isFree || false}
                              onChange={(e) => setLessonsDetails(prev => ({
                                ...prev,
                                [lesson.id]: { ...prev[lesson.id], isFree: e.target.checked }
                              }))}
                            />
                            <label className="text-sm">Leçon gratuite</label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Étape 4: Publication */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Publication du cours</h3>
              
              <div className="flex items-center space-x-3">
                <Switch
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                <div>
                  <label className="font-medium">Publier immédiatement</label>
                  <p className="text-sm text-gray-500">
                    Si désactivé, le cours sera sauvegardé en brouillon
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">💡 À propos du prix</h4>
                <p className="text-sm text-blue-800">
                  Votre cours sera créé gratuitement par défaut. Vous pourrez définir un prix plus tard 
                  depuis la page de gestion de vos cours si vous le souhaitez.
                </p>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Résumé du cours</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Titre:</span> {step1Form.watch('title') || 'Non défini'}</p>
                    <p><span className="font-medium">Modules:</span> {modules.length}</p>
                    <p><span className="font-medium">Leçons totales:</span> {modules.reduce((acc, m) => acc + m.lessons.length, 0)}</p>
                    <p><span className="font-medium">Prix:</span> Gratuit</p>
                    <p><span className="font-medium">Statut:</span> {isPublished ? 'Publié' : 'Brouillon'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            onClick={prevStep}
            variant="outline"
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>

          {currentStep < 4 ? (
            <Button onClick={nextStep}>
              <span className="flex items-center">
                <span>Suivant</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </span>
            </Button>
          ) : (
            <Button onClick={submitCourse} disabled={isSubmitting}>
              <span className="flex items-center">
                {isSubmitting ? (
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full inline-block" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                <span>{isSubmitting ? 'Création...' : 'Créer le cours'}</span>
              </span>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
