import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { 
  Play, 
  PlayCircle, 
  CheckCircle, 
  Award, 
  Clock, 
  BookOpen, 
  Target,
  TrendingUp,
  Star
} from 'lucide-react';
import { progressService } from '@/services/progress.service';
import type { CourseProgress } from '@/services/progress.service';
import { useNavigate } from 'react-router-dom';

interface CourseProgressCardProps {
  courseProgress: CourseProgress;
  onContinue?: () => void;
  showDetailed?: boolean;
}

export const CourseProgressCard: React.FC<CourseProgressCardProps> = ({
  courseProgress,
  onContinue,
  showDetailed = false
}) => {
  const navigate = useNavigate();
  
  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      navigate(`/etudiant/cours/${courseProgress.courseId}`);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200';
    if (progress < 25) return 'bg-gradient-to-r from-blue-400 to-blue-500';
    if (progress < 50) return 'bg-gradient-to-r from-blue-500 to-purple-500';
    if (progress < 75) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (progress < 100) return 'bg-gradient-to-r from-pink-500 to-red-500';
    return 'bg-gradient-to-r from-green-400 to-green-600';
  };

  const getStatusIcon = (progress: number) => {
    if (progress === 0) return <Play className="w-4 h-4" />;
    if (progress === 100) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <PlayCircle className="w-4 h-4 text-blue-600" />;
  };

  const getActionButton = () => {
    if (courseProgress.progressPercentage === 0) {
      return (
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleContinue}
        >
          <Play className="w-4 h-4 mr-2" />
          Commencer le cours
        </Button>
      );
    }
    
    if (courseProgress.progressPercentage === 100) {
      return (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 border-green-500 text-green-700 hover:bg-green-50"
            onClick={handleContinue}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Revoir
          </Button>
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => navigate(`/etudiant/cours/${courseProgress.courseId}/certificat`)}
          >
            <Award className="w-4 h-4 mr-2" />
            Certificat
          </Button>
        </div>
      );
    }
    
    return (
      <Button 
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        onClick={handleContinue}
      >
        <PlayCircle className="w-4 h-4 mr-2" />
        Continuer le cours
      </Button>
    );
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {courseProgress.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={courseProgress.enrolled ? "default" : "secondary"}>
                {courseProgress.enrolled ? "Inscrit" : "Non inscrit"}
              </Badge>
              {courseProgress.completed && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Terminé
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {courseProgress.progressPercentage}%
            </div>
            <div className="text-xs text-muted-foreground">Complété</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progression</span>
            <span className="text-sm text-muted-foreground">
              {courseProgress.completedModules}/{courseProgress.totalModules} modules
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ease-out ${getProgressColor(courseProgress.progressPercentage)}`}
              style={{ width: `${courseProgress.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Message de motivation */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {progressService.getMotivationMessage(courseProgress.progressPercentage)}
          </p>
        </div>

        {/* Statistiques détaillées */}
        {showDetailed && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">
                  {progressService.formatTimeSpent(courseProgress.totalTimeSpent)}
                </div>
                <div className="text-xs text-muted-foreground">Temps passé</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">
                  {courseProgress.modules.length}
                </div>
                <div className="text-xs text-muted-foreground">Modules</div>
              </div>
            </div>
          </div>
        )}

        {/* Prochaine leçon */}
        {courseProgress.nextLesson && courseProgress.progressPercentage > 0 && courseProgress.progressPercentage < 100 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Prochaine étape
              </span>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              {courseProgress.nextLesson.moduleTitle} - {courseProgress.nextLesson.title}
            </p>
          </div>
        )}

        {/* Achievements récents */}
        {courseProgress.achievements && courseProgress.achievements.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Achievements récents</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {courseProgress.achievements.slice(0, 3).map((achievement) => (
                <Badge key={achievement.id} variant="outline" className="text-xs">
                  {achievement.icon} {achievement.title}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Bouton d'action */}
        <div className="pt-2">
          {getActionButton()}
        </div>

        {/* Recommandations pour nouveaux étudiants */}
        {courseProgress.progressPercentage === 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Conseils pour bien commencer
              </span>
            </div>
            <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
              {progressService.getRecommendations(courseProgress).map((rec, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-green-500 mt-0.5">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
