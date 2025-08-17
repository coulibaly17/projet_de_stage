import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileText, 
  ClipboardCheck, 
  MessageSquare,
  Award,
  Bell,
  Plus,
  PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface DashboardStatProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function DashboardStat({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  className 
}: DashboardStatProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className="p-2 bg-blue-50 rounded-full dark:bg-blue-900/20">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className={cn(
            "flex items-center text-xs mt-2",
            trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            <span className="text-gray-500 dark:text-gray-400 ml-1">
              depuis le mois dernier
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  stats: {
    students?: number;
    courses?: number;
    assignments?: number;
    quizzes?: number;
    discussions?: number;
    recommendations?: number;
    [key: string]: number | undefined;
  };
  role: 'student' | 'teacher' | 'admin';
}

export function DashboardStats({ stats, role }: DashboardStatsProps) {
  // Définir les statistiques en fonction du rôle
  const getStatItems = () => {
    switch (role) {
      case 'teacher':
        return [
          {
            title: "Étudiants",
            value: stats.students || 0,
            icon: <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
            description: "Étudiants inscrits à vos cours"
          },
          {
            title: "Cours",
            value: stats.courses || 0,
            icon: <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
            description: "Cours actifs"
          },
          {
            title: "Devoirs",
            value: stats.assignments || 0,
            icon: <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
            description: "Devoirs à évaluer"
          },
          {
            title: "Quiz",
            value: stats.quizzes || 0,
            icon: <ClipboardCheck className="h-4 w-4 text-green-600 dark:text-green-400" />,
            description: "Quiz actifs"
          }
        ];
      case 'student':
        return [
          {
            title: "Cours",
            value: stats.courses || 0,
            icon: <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
            description: "Cours suivis"
          },
          {
            title: "Devoirs",
            value: stats.assignments || 0,
            icon: <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
            description: "Devoirs en attente"
          },
          {
            title: "Quiz",
            value: stats.quizzes || 0,
            icon: <ClipboardCheck className="h-4 w-4 text-green-600 dark:text-green-400" />,
            description: "Quiz à compléter"
          },
          {
            title: "Discussions",
            value: stats.discussions || 0,
            icon: <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
            description: "Messages non lus"
          }
        ];
      case 'admin':
        return [
          {
            title: "Utilisateurs",
            value: stats.students || 0,
            icon: <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
            description: "Utilisateurs actifs"
          },
          {
            title: "Cours",
            value: stats.courses || 0,
            icon: <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
            description: "Cours disponibles"
          },
          {
            title: "Activité",
            value: stats.assignments || 0,
            icon: <LayoutDashboard className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
            description: "Actions aujourd'hui"
          },
          {
            title: "Notifications",
            value: stats.quizzes || 0,
            icon: <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />,
            description: "Alertes système"
          }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {getStatItems().map((stat, index) => (
        <DashboardStat
          key={index}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          icon={stat.icon}
        />
      ))}
    </div>
  );
}

interface UnifiedDashboardProps {
  title: string;
  subtitle?: string;
  stats: {
    students?: number;
    courses?: number;
    assignments?: number;
    quizzes?: number;
    discussions?: number;
    recommendations?: number;
    [key: string]: number | undefined;
  };
  role: 'student' | 'teacher' | 'admin';
  children?: React.ReactNode;
}

// Composant pour les actions rapides
function QuickActions({ role }: { role: 'student' | 'teacher' | 'admin' }) {
  if (role !== 'teacher') return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Actions rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/enseignant/cours/workflow">
            <Button className="w-full h-20 flex flex-col items-center justify-center gap-2">
              <BookOpen className="h-6 w-6" />
              <span>Créer un cours</span>
            </Button>
          </Link>
          <Link to="/enseignant/quiz">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
              <ClipboardCheck className="h-6 w-6" />
              <span>Créer un quiz</span>
            </Button>
          </Link>
          <Link to="/enseignant/cours">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
              <Users className="h-6 w-6" />
              <span>Gérer les cours</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function UnifiedDashboard({ 
  title, 
  subtitle, 
  stats, 
  role, 
  children 
}: UnifiedDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
      
      <DashboardStats stats={stats} role={role} />
      
      <QuickActions role={role} />
      
      {children}
    </div>
  );
}
