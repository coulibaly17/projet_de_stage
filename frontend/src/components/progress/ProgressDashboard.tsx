import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Clock, 
  Target, 
  Award,
  Flame,
  CheckCircle2,
  PlayCircle
} from 'lucide-react';
import { progressService } from '@/services/progress.service';
import type { CourseProgress, ProgressStats, Achievement } from '@/services/progress.service';
import { CourseProgressCard } from './CourseProgressCard';

interface ProgressDashboardProps {
  userId?: string;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ userId }) => {
  const [coursesProgress, setCoursesProgress] = useState<CourseProgress[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgressData();
  }, [userId]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const [coursesData, statsData, achievementsData] = await Promise.all([
        progressService.getAllCoursesProgress(),
        progressService.getProgressStats(),
        progressService.getAchievements()
      ]);
      
      setCoursesProgress(coursesData);
      setStats(statsData);
      setAchievements(achievementsData);
    } catch (err) {
      console.error('Erreur lors du chargement des données de progression:', err);
      setError('Impossible de charger les données de progression');
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    if (!stats) return "Bienvenue dans votre espace d'apprentissage !";
    
    if (stats.totalCoursesEnrolled === 0) {
      return "🎯 Prêt à commencer votre parcours d'apprentissage ?";
    }
    
    if (stats.totalCoursesCompleted === 0) {
      return "🚀 Continuez sur cette lancée, vous progressez bien !";
    }
    
    return `🏆 Félicitations ! Vous avez terminé ${stats.totalCoursesCompleted} cours !`;
  };

  const getRecommendedCourses = () => {
    return coursesProgress
      .filter(course => course.enrolled && course.progressPercentage > 0 && course.progressPercentage < 100)
      .sort((a, b) => b.progressPercentage - a.progressPercentage)
      .slice(0, 3);
  };

  const getNewCourses = () => {
    return coursesProgress
      .filter(course => course.enrolled && course.progressPercentage === 0)
      .slice(0, 3);
  };

  const getCompletedCourses = () => {
    return coursesProgress
      .filter(course => course.completed)
      .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadProgressData}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message de bienvenue */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            {getWelcomeMessage()}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Voici un aperçu de votre progression et de vos prochaines étapes.
          </p>
        </CardContent>
      </Card>

      {/* Statistiques générales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCoursesEnrolled}</p>
                  <p className="text-sm text-muted-foreground">Cours inscrits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCoursesCompleted}</p>
                  <p className="text-sm text-muted-foreground">Cours terminés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {progressService.formatTimeSpent(stats.totalTimeSpent)}
                  </p>
                  <p className="text-sm text-muted-foreground">Temps d'étude</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Flame className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.currentStreak}</p>
                  <p className="text-sm text-muted-foreground">Jours consécutifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglets de progression */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            En cours
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            À commencer
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Terminés
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Cours en cours</h3>
            <Badge variant="secondary">
              {getRecommendedCourses().length} cours
            </Badge>
          </div>
          
          {getRecommendedCourses().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getRecommendedCourses().map((course) => (
                <CourseProgressCard 
                  key={course.courseId} 
                  courseProgress={course}
                  showDetailed={true}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <PlayCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">Aucun cours en cours</h4>
                <p className="text-muted-foreground mb-4">
                  Commencez un nouveau cours pour voir votre progression ici.
                </p>
                <Button>Explorer les cours</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Cours à commencer</h3>
            <Badge variant="secondary">
              {getNewCourses().length} cours
            </Badge>
          </div>
          
          {getNewCourses().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getNewCourses().map((course) => (
                <CourseProgressCard 
                  key={course.courseId} 
                  courseProgress={course}
                  showDetailed={true}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">Tous vos cours sont commencés !</h4>
                <p className="text-muted-foreground mb-4">
                  Continuez votre progression ou explorez de nouveaux cours.
                </p>
                <Button>Découvrir plus de cours</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Cours terminés</h3>
            <Badge variant="secondary">
              {getCompletedCourses().length} cours
            </Badge>
          </div>
          
          {getCompletedCourses().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getCompletedCourses().map((course) => (
                <CourseProgressCard 
                  key={course.courseId} 
                  courseProgress={course}
                  showDetailed={true}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">Aucun cours terminé</h4>
                <p className="text-muted-foreground mb-4">
                  Terminez vos premiers cours pour les voir apparaître ici.
                </p>
                <Button>Continuer un cours</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Vos achievements</h3>
            <Badge variant="secondary">
              {achievements.length} débloqués
            </Badge>
          </div>
          
          {achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Débloqué le {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">Aucun achievement débloqué</h4>
                <p className="text-muted-foreground mb-4">
                  Commencez à apprendre pour débloquer vos premiers achievements !
                </p>
                <Button>Commencer un cours</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
