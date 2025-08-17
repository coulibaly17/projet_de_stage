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
import { ArrowLeft, ArrowRight, Save, Plus, BookOpen, Video, DollarSign } from 'lucide-react';
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

  const [modules, setModules] = useState<Module[]>([{
    id: '1', title: 'Introduction', lessons: [{ id: '1-1', title: 'Bienvenue', type: 'video' }]
  }]);
  const [lessonsDetails, setLessonsDetails] = useState<Record<string, Partial<Lesson>>>({});
  const [price, setPrice] = useState(0);
  const [isPublished, setIsPublished] = useState(false);

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      level: ''
    }
  });

  const getStepProgress = () => (currentStep / 4) * 100;

  // Gestion des modules
  const addModule = () => {
    setModules([...modules, {
      id: uuidv4(),
      title: `Module ${modules.length + 1}`,
      lessons: []
    }]);
  };

  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    setModules(modules.map(m => m.id === moduleId ? { ...m, ...updates } : m));
  };

  const addLesson = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;
    const newLesson: Lesson = {
      id: uuidv4(),
      title: `Leçon ${module.lessons.length + 1}`,
      type: 'video'
    };
    updateModule(moduleId, { lessons: [...module.lessons, newLesson] });
  };

  const updateLesson = (moduleId: string, lessonId: string, updates: Partial<Lesson>) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;
    updateModule(moduleId, {
      lessons: module.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l)
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
    try {
      setIsSubmitting(true);
      
      // Récupérer les données du formulaire étape 1
      const step1Data = step1Form.getValues();
      
      // Préparer les données du cours
      const courseData = {
        title: step1Data.title,
        description: step1Data.description,
        short_description: step1Data.description.substring(0, 300),
        category_id: parseInt(step1Data.category),
        level: step1Data.level,
        price: price,
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
      
      // Créer le cours avec tout son contenu
      const result = await courseService.createCourseWithContent(courseData);
      
      toast.success(result.message);
      
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
      setIsSubmitting(false);
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
                      <Input placeholder="Ex: Introduction à React.js" {...field} />
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
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Décrivez votre cours..." className="min-h-32" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={step1Form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Mathématiques</SelectItem>
                          <SelectItem value="2">Informatique</SelectItem>
                          <SelectItem value="3">Langues</SelectItem>
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
                            <SelectValue placeholder="Choisir..." />
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
                <FormLabel>Image de couverture (Lien YouTube)</FormLabel>
                <Input
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
                  className="mb-2"
                />
                {thumbnailUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Aperçu de l'image :</p>
                    <img 
                      src={thumbnailUrl} 
                      alt="Aperçu de l'image de couverture" 
                      className="w-full h-48 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Utilisez un lien d'image YouTube (ex: https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg)
                </p>
              </div>
            </div>
          )}

          {/* Étape 2: Structure */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Modules et leçons</h3>
                <Button onClick={addModule} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un module
                </Button>
              </div>

              {modules.map((module) => (
                <Card key={module.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Input
                        value={module.title}
                        onChange={(e) => updateModule(module.id, { title: e.target.value })}
                        className="text-lg font-medium"
                        placeholder="Titre du module"
                      />
                      <Button variant="outline" size="sm" onClick={() => addLesson(module.id)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Leçon
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {module.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <BookOpen className="h-4 w-4 text-gray-500" />
                          <Input
                            value={lesson.title}
                            onChange={(e) => updateLesson(module.id, lesson.id, { title: e.target.value })}
                            className="flex-1"
                            placeholder="Titre de la leçon"
                          />
                          <Select 
                            value={lesson.type} 
                            onValueChange={(value: any) => updateLesson(module.id, lesson.id, { type: value })}
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
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Étape 3: Contenu des leçons */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Contenu des leçons</h3>
              {modules.flatMap(module => 
                module.lessons.map(lesson => {
                  const details = lessonsDetails[lesson.id] ?? {};
                  return (
                    <Card key={lesson.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Video className="h-5 w-5" />
                          {lesson.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <FormLabel>Description</FormLabel>
                            <Textarea
                              value={details.description ?? ''}
                              onChange={(e) => setLessonsDetails(prev => ({
                                ...prev,
                                [lesson.id]: { ...prev[lesson.id], description: e.target.value }
                              }))}
                              placeholder="Description de la leçon..."
                            />
                          </div>
                          <div>
                            <FormLabel>URL vidéo</FormLabel>
                            <Input
                              value={details.videoUrl ?? ''}
                              onChange={(e) => setLessonsDetails(prev => ({
                                ...prev,
                                [lesson.id]: { ...prev[lesson.id], videoUrl: e.target.value }
                              }))}
                              placeholder="https://youtube.com/..."
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* Étape 4: Prix et publication */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <FormLabel>Prix du cours</FormLabel>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setPrice(isNaN(value) ? 0 : value);
                      }}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    label="Publier immédiatement"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Résumé du cours</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Modules:</span>
                    <span>{modules.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Leçons:</span>
                    <span>{modules.reduce((total, module) => total + module.lessons.length, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prix:</span>
                    <span>{price}€</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>
          
          {currentStep < 4 ? (
            <Button onClick={nextStep}>
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={submitCourse} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full inline-block" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer le cours
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
