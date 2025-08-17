import React from 'react';
import { BookOpen, Award, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@mui/material';
import { styled } from '@mui/material/styles';

// Types
export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  color: 'indigo' | 'blue' | 'yellow' | 'green';
}

// Styled components
const StyledCard = styled(Card)(({ theme }) => {
  const borderRadius = (typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 4) * 2;
  return {
    borderRadius: borderRadius,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
    },
  };
});

const IconContainer = styled('div')<{ color: string }>(({ theme, color }) => {
  const colors = {
    indigo: {
      bg: theme.palette.primary.light,
      text: theme.palette.primary.contrastText,
    },
    blue: {
      bg: theme.palette.info.light,
      text: theme.palette.info.contrastText,
    },
    yellow: {
      bg: theme.palette.warning.light,
      text: theme.palette.warning.contrastText,
    },
    green: {
      bg: theme.palette.success.light,
      text: theme.palette.success.contrastText,
    },
  };

  return {
    padding: theme.spacing(1.5),
    borderRadius: '50%',
    backgroundColor: colors[color as keyof typeof colors].bg,
    color: colors[color as keyof typeof colors].text,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
});

const StatValue = styled('h2')(({ theme }) => ({
  fontSize: '1.75rem',
  fontWeight: 700,
  margin: `${theme.spacing(1)} 0`,
}));

const StatTitle = styled('p')(({ theme }) => ({
  color: theme.palette.text.secondary,
  margin: 0,
}));

const TrendIndicator = styled('p')<{ positive: boolean }>(({ theme, positive }) => ({
  color: positive ? theme.palette.success.main : theme.palette.error.main,
  fontSize: '0.875rem',
  margin: `${theme.spacing(1)} 0 0 0`,
  display: 'flex',
  alignItems: 'center',
}));

// Components
export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color }) => {
  return (
    <StyledCard>
      <CardContent>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <StatTitle>{title}</StatTitle>
            <StatValue>{value}</StatValue>
            {trend && (
              <TrendIndicator positive={trend.positive}>
                {trend.positive ? <TrendingUp size={16} /> : <TrendingUp size={16} style={{ transform: 'rotate(180deg)' }} />}
                <span style={{ marginLeft: '4px' }}>{trend.value}</span>
              </TrendIndicator>
            )}
          </div>
          <IconContainer color={color}>{icon}</IconContainer>
        </div>
      </CardContent>
    </StyledCard>
  );
};

// Dashboard Stats Component
const StudentDashboardStats: React.FC<{
  stats: {
    coursesEnrolled: number;
    completedCourses: number;
    hoursSpent: number;
    averageScore: number;
  };
}> = ({ stats }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
      <StatCard
        title="Cours inscrits"
        value={stats.coursesEnrolled}
        icon={<BookOpen size={24} />}
        trend={{ value: '2 nouveaux ce mois-ci', positive: true }}
        color="indigo"
      />
      <StatCard
        title="Cours complétés"
        value={stats.completedCourses}
        icon={<Award size={24} />}
        trend={{ value: '1 cette semaine', positive: true }}
        color="green"
      />
      <StatCard
        title="Heures d'apprentissage"
        value={stats.hoursSpent}
        icon={<Clock size={24} />}
        trend={{ value: '5h de plus que la semaine dernière', positive: true }}
        color="blue"
      />
      <StatCard
        title="Score moyen"
        value={`${stats.averageScore}%`}
        icon={<TrendingUp size={24} />}
        trend={{ value: '3% depuis le dernier quiz', positive: true }}
        color="yellow"
      />
    </div>
  );
};

export default StudentDashboardStats;
