import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, LineChart, PieChart } from '@/components/ui/charts';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon, Download, Calendar } from 'lucide-react';

// Type pour les données d'analyse
type AnalyticsData = {
  studentEngagement: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
    }[];
  };
  quizPerformance: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
    }[];
  };
  completionRates: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
    }[];
  };
};

// Données fictives pour la démo
const mockAnalyticsData: AnalyticsData = {
  studentEngagement: {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Heures de visionnage',
        data: [4.5, 3.8, 5.2, 6.1, 4.3, 2.9, 1.5],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
      },
      {
        label: 'Interactions',
        data: [25, 18, 30, 35, 28, 15, 10],
        backgroundColor: 'rgba(139, 92, 246, 0.5)',
        borderColor: 'rgb(139, 92, 246)',
      }
    ],
  },
  quizPerformance: {
    labels: ['Quiz 1', 'Quiz 2', 'Quiz 3', 'Quiz 4', 'Quiz 5'],
    datasets: [
      {
        label: 'Score moyen',
        data: [78, 82, 75, 88, 80],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
        ],
      }
    ],
  },
  completionRates: {
    labels: ['Terminé', 'En cours', 'Non commencé'],
    datasets: [
      {
        label: 'Taux de complétion',
        data: [65, 25, 10],
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
        ],
      }
    ],
  },
};

type TeacherAnalyticsSectionProps = {
  courseId?: string;
  className?: string;
};

export function TeacherAnalyticsSection({ courseId, className }: TeacherAnalyticsSectionProps) {
  const [timeRange, setTimeRange] = useState('week');
  const [selectedCourse, setSelectedCourse] = useState(courseId || 'all');
  
  // Récupérer les données d'analyse depuis l'API
  const { data, isLoading, error } = useQuery({
    queryKey: ['teacherAnalytics', selectedCourse, timeRange],
    queryFn: async () => {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockAnalyticsData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Analyse des performances</CardTitle>
          <CardDescription>Chargement des données d'analyse...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Analyse des performances</CardTitle>
          <CardDescription>Une erreur est survenue lors du chargement des données</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <BarChart2 className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">Impossible de charger les analyses</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 text-center">
              Nous rencontrons des difficultés à récupérer vos données d'analyse.
              Veuillez réessayer plus tard.
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
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle>Analyse des performances</CardTitle>
            <CardDescription>Visualisez les performances de vos étudiants</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sélectionner un cours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les cours</SelectItem>
                <SelectItem value="course1">Développement Web Avancé</SelectItem>
                <SelectItem value="course2">Introduction à React</SelectItem>
                <SelectItem value="course3">UI/UX Design</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="engagement" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="engagement" className="flex items-center gap-2">
              <LineChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Engagement</span>
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              <span className="hidden sm:inline">Quiz</span>
            </TabsTrigger>
            <TabsTrigger value="completion" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Complétion</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="engagement" className="mt-4">
            <div className="h-[350px]">
              <LineChart
                data={data?.studentEngagement}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Engagement des étudiants',
                    },
                  },
                }}
              />
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>L'engagement des étudiants est mesuré par le temps passé sur la plateforme et le nombre d'interactions.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="quiz" className="mt-4">
            <div className="h-[350px]">
              <BarChart
                data={data?.quizPerformance}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Performance aux quiz',
                    },
                  },
                }}
              />
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Les performances aux quiz montrent le score moyen obtenu par les étudiants pour chaque quiz.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="completion" className="mt-4">
            <div className="h-[350px]">
              <PieChart
                data={data?.completionRates}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                    title: {
                      display: true,
                      text: 'Taux de complétion des cours',
                    },
                  },
                }}
              />
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Le taux de complétion indique la proportion d'étudiants ayant terminé, en cours ou n'ayant pas commencé le cours.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <Button variant="outline" size="sm" className="gap-2">
          <Calendar className="h-4 w-4" />
          Personnaliser la période
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter les données
        </Button>
      </CardFooter>
    </Card>
  );
}
