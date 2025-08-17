import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, BookOpen, Clock, Brain, TrendingUp, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { recommendationService } from '@/services/recommendation.service';
import { Skeleton } from '@/components/ui/skeleton';

type RecommendationType = 'courses' | 'resources' | 'skills';

export function AIRecommendationsSection() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<RecommendationType>('courses');
  
  const { data: recommendations, isLoading, error } = useQuery({
    queryKey: ['recommendations', user?.id, activeTab],
    queryFn: () => {
      if (!user?.id) return Promise.resolve([]);
      
      switch (activeTab) {
        case 'courses':
          return recommendationService.getPersonalizedRecommendations(user.id.toString(), { limit: 6 });
        case 'resources':
          return recommendationService.getPopularRecommendations({ limit: 6 });
        case 'skills':
          return recommendationService.getPersonalizedRecommendations(user.id.toString(), { limit: 6 });
        default:
          return recommendationService.getPersonalizedRecommendations(user.id.toString(), { limit: 6 });
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Recommandations IA
              </CardTitle>
              <CardDescription>Suggestions personnalisées basées sur votre profil d'apprentissage</CardDescription>
            </div>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              Propulsé par IA
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="courses">Cours</TabsTrigger>
              <TabsTrigger value="resources">Ressources</TabsTrigger>
              <TabsTrigger value="skills">Compétences</TabsTrigger>
            </TabsList>
            <TabsContent value="courses" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[125px] w-full rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommandations IA</CardTitle>
          <CardDescription>Suggestions personnalisées basées sur votre profil d'apprentissage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">Impossible de charger les recommandations</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Nous rencontrons des difficultés à générer vos recommandations personnalisées.
            </p>
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderCourseRecommendations = () => {
    const courses = recommendations ?? [];
    
    if (courses.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">Pas encore de recommandations</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Continuez à utiliser la plateforme pour obtenir des recommandations personnalisées.
          </p>
          <Button asChild variant="outline">
            <Link to="/etudiant/cours">Explorer les cours</Link>
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((recommendation: any) => {
          const course = recommendation.content || recommendation;
          return (
            <div key={course.id} className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground transition-all hover:shadow-md">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description || course.content?.description || 'Pas de description disponible'}</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {course.difficulty || course.content?.difficulty || 'Débutant'}
                  </Badge>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration || course.content?.duration || 'N/A'} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {recommendation.score || 85}% correspondance
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button asChild size="sm" className="w-full">
                    <Link to={`/etudiant/cours/${course.id}`}>
                      Voir le cours
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderResourceRecommendations = () => {
    const resources = recommendations ?? [];
    
    if (resources.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">Pas encore de ressources recommandées</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Nous vous recommanderons des ressources supplémentaires basées sur vos intérêts.
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {resources.map((resource: any) => (
          <div key={resource.id} className="flex items-start space-x-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
            <div className={`rounded-md p-2 ${resource.type === 'video' ? 'bg-red-100 text-red-700' : resource.type === 'article' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
              {resource.type === 'video' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              ) : resource.type === 'article' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{resource.title}</h3>
                <Badge variant="outline" className="text-xs">
                  {resource.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{resource.duration}</div>
                <Button variant="ghost" size="sm" className="h-8" asChild>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    Consulter
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSkillRecommendations = () => {
    const skills = recommendations ?? [];
    
    if (skills.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">Pas encore de compétences recommandées</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Continuez à apprendre pour découvrir les compétences à développer.
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill: any) => (
          <div key={skill.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{skill.name}</h3>
              <Badge 
                variant={skill.priority === 'high' ? 'destructive' : skill.priority === 'medium' ? 'default' : 'outline'}
                className="text-xs"
              >
                {skill.priority === 'high' ? 'Prioritaire' : skill.priority === 'medium' ? 'Recommandé' : 'Optionnel'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{skill.description}</p>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Niveau actuel</span>
                <span className="font-medium">{skill.currentLevel}/5</span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                  style={{ width: `${(skill.currentLevel / 5) * 100}%` }}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to={`/etudiant/competences/${skill.id}`}>
                  Développer cette compétence
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Recommandations IA
            </CardTitle>
            <CardDescription>Suggestions personnalisées basées sur votre profil d'apprentissage</CardDescription>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            Propulsé par IA
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="courses" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as RecommendationType)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses">Cours</TabsTrigger>
            <TabsTrigger value="resources">Ressources</TabsTrigger>
            <TabsTrigger value="skills">Compétences</TabsTrigger>
          </TabsList>
          <TabsContent value="courses" className="mt-4">
            {renderCourseRecommendations()}
          </TabsContent>
          <TabsContent value="resources" className="mt-4">
            {renderResourceRecommendations()}
          </TabsContent>
          <TabsContent value="skills" className="mt-4">
            {renderSkillRecommendations()}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Dernière mise à jour: {new Date().toLocaleDateString()}
        </p>
        <Button variant="ghost" size="sm" className="gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21h5v-5"></path></svg>
          Actualiser
        </Button>
      </CardFooter>
    </Card>
  );
}
