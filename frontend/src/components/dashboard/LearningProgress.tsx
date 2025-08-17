import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { BookOpen, Award, Clock, CheckCircle } from 'lucide-react';

interface LearningStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalLessons: number;
  completedLessons: number;
  learningStreak: number;
  timeSpent: number; // in minutes
}

export const LearningProgress: React.FC = () => {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLearningStats = async () => {
      try {
        setLoading(true);
        // Remplacez par votre endpoint réel
        const response = await apiService.get('/users/me/learning-stats');
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch learning stats:', err);
        setError('Impossible de charger les statistiques de progression');
      } finally {
        setLoading(false);
      }
    };

    fetchLearningStats();
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center text-destructive">
          <p>{error || 'Aucune donnée de progression disponible'}</p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = Math.round((stats.completedCourses / stats.totalCourses) * 100) || 0;
  const lessonsProgress = Math.round((stats.completedLessons / stats.totalLessons) * 100) || 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>Ma progression</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Progression globale</span>
            <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<BookOpen className="h-5 w-5" />}
            title="Cours terminés"
            value={`${stats.completedCourses}/${stats.totalCourses}`}
            description="Cours complétés"
          />

          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-green-500" />}
            title="Leçons"
            value={`${stats.completedLessons}/${stats.totalLessons}`}
            description={`${lessonsProgress}% complétées`}
          />

          <StatCard
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            title="Temps passé"
            value={`${Math.round(stats.timeSpent / 60)}h`}
            description="Cette semaine"
          />

          <StatCard
            icon={<Award className="h-5 w-5 text-purple-500" />}
            title="Série active"
            value={`${stats.learningStreak} jours`}
            description="Consécutifs"
          />
        </div>
      </CardContent>
    </Card>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  title, 
  value, 
  description,
  className = ''
}) => (
  <div 
    className={`flex items-start space-x-4 rounded-lg border bg-card p-4 hover:shadow-md transition-shadow ${className}`}
    aria-label={`${title}: ${value} ${description}`}
  >
    <div className="rounded-full bg-primary/10 p-2 text-primary">
      {icon}
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium leading-none text-muted-foreground">
        {title}
      </p>
      <p className="text-2xl font-bold tracking-tight">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  </div>
);
