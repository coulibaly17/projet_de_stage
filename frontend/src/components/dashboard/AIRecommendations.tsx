import React from 'react';
import { Box, Typography, Paper, Button, styled } from '@mui/material';
import { Bot, PieChart, BookOpen } from 'lucide-react';

// Types
export interface Recommendation {
  id: number;
  type: 'student' | 'class' | 'resource';
  title: string;
  description: string;
  actionText: string;
  icon: 'robot' | 'chart' | 'book';
}

interface AIRecommendationsProps {
  recommendations: Recommendation[];
  onRefresh: () => void;
  onAction: (id: number, action: string) => void;
}

// Styled components
const RecommendationCard = styled(Paper)<{ type: string }>(({ theme, type }) => {
  const colors = {
    student: {
      bg: theme.palette.info.light,
      border: theme.palette.info.main,
      icon: theme.palette.info.dark,
    },
    class: {
      bg: theme.palette.secondary.light,
      border: theme.palette.secondary.main,
      icon: theme.palette.secondary.dark,
    },
    resource: {
      bg: theme.palette.success.light,
      border: theme.palette.success.main,
      icon: theme.palette.success.dark,
    },
  };

  const colorSet = colors[type as keyof typeof colors];

  return {
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius * 1.5,
    backgroundColor: colorSet.bg,
    border: `1px solid ${colorSet.border}`,
    marginBottom: theme.spacing(2),
    transition: 'transform 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
    },
  };
});

const IconWrapper = styled(Box)<{ type: string }>(({ theme, type }) => {
  const colors = {
    student: theme.palette.info.dark,
    class: theme.palette.secondary.dark,
    resource: theme.palette.success.dark,
  };

  return {
    color: colors[type as keyof typeof colors],
    marginTop: theme.spacing(0.5),
  };
});

const ActionButton = styled(Button)<{ itemType: string }>(({ theme, itemType }) => {
  const colors = {
    student: theme.palette.info.main,
    class: theme.palette.secondary.main,
    resource: theme.palette.success.main,
  };

  return {
    backgroundColor: colors[itemType as keyof typeof colors],
    color: '#fff',
    fontSize: '0.75rem',
    padding: '4px 8px',
    minWidth: 'unset',
    '&:hover': {
      backgroundColor: colors[itemType as keyof typeof colors],
      opacity: 0.9,
    },
  };
});

const RefreshButton = styled(Button)(({ theme }) => ({
  width: '100%',
  border: `1px solid ${theme.palette.primary.main}`,
  color: theme.palette.primary.main,
  marginTop: theme.spacing(2),
  '&:hover': {
    backgroundColor: theme.palette.primary.light,
  },
}));

// Component
const AIRecommendations: React.FC<AIRecommendationsProps> = ({ 
  recommendations, 
  onRefresh,
  onAction
}) => {
  const getIcon = (icon: string) => {
    switch (icon) {
      case 'robot':
        return <Bot size={18} />;
      case 'chart':
        return <PieChart size={18} />;
      case 'book':
        return <BookOpen size={18} />;
      default:
        return <Bot size={18} />;
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" mb={3}>
        Recommandations IA
      </Typography>
      
      <Box>
        {recommendations.map((rec) => (
          <RecommendationCard key={rec.id} type={rec.type}>
            <Box display="flex">
              <IconWrapper type={rec.type} mr={1.5}>
                {getIcon(rec.icon)}
              </IconWrapper>
              <Box flex={1}>
                <Typography 
                  variant="subtitle2" 
                  fontWeight="medium"
                  sx={{ 
                    color: (theme) => 
                      rec.type === 'student' 
                        ? theme.palette.info.dark 
                        : rec.type === 'class' 
                          ? theme.palette.secondary.dark 
                          : theme.palette.success.dark
                  }}
                >
                  {rec.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  mt={0.5}
                  sx={{ 
                    color: (theme) => 
                      rec.type === 'student' 
                        ? theme.palette.info.dark 
                        : rec.type === 'class' 
                          ? theme.palette.secondary.dark 
                          : theme.palette.success.dark
                  }}
                >
                  {rec.description}
                </Typography>
                <Box mt={1}>
                  <ActionButton 
                    itemType={rec.type} 
                    size="small" 
                    onClick={() => onAction(rec.id, rec.actionText)}
                  >
                    {rec.actionText}
                  </ActionButton>
                </Box>
              </Box>
            </Box>
          </RecommendationCard>
        ))}
      </Box>
      
      <RefreshButton
        variant="outlined"
        startIcon={<span className="material-icons">sync</span>}
        onClick={onRefresh}
      >
        Actualiser les recommandations
      </RefreshButton>
    </Box>
  );
};

export default AIRecommendations;
