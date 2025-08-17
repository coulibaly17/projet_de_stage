import React from 'react';
import { Box, Typography, Paper, Button, styled } from '@mui/material';
import { BookOpen, CheckCircle, MessageSquare, Video } from 'lucide-react';

// Types
export interface Activity {
  id: number;
  type: 'assignment' | 'submission' | 'message' | 'resource';
  title: string;
  description: string;
  time: string;
}

interface RecentActivityProps {
  activities: Activity[];
  onViewAll: () => void;
}

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  height: '100%',
}));

const ActivityItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(3),
  '&:last-child': {
    marginBottom: 0,
  },
}));

const IconWrapper = styled(Box)<{ type: string }>(({ theme, type }) => {
  const colors = {
    assignment: {
      bg: theme.palette.primary.light,
      color: theme.palette.primary.main,
    },
    submission: {
      bg: theme.palette.success.light,
      color: theme.palette.success.main,
    },
    message: {
      bg: theme.palette.info.light,
      color: theme.palette.info.main,
    },
    resource: {
      bg: theme.palette.secondary.light,
      color: theme.palette.secondary.main,
    },
  };

  const colorSet = colors[type as keyof typeof colors];

  return {
    backgroundColor: colorSet.bg,
    color: colorSet.color,
    borderRadius: '50%',
    padding: theme.spacing(1),
    marginRight: theme.spacing(1.5),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
});

const ViewAllButton = styled(Button)(({ theme }) => ({
  width: '100%',
  border: `1px solid ${theme.palette.grey[300]}`,
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(2),
  '&:hover': {
    backgroundColor: theme.palette.grey[100],
  },
}));

// Component
const RecentActivity: React.FC<RecentActivityProps> = ({ activities, onViewAll }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <BookOpen size={18} />;
      case 'submission':
        return <CheckCircle size={18} />;
      case 'message':
        return <MessageSquare size={18} />;
      case 'resource':
        return <Video size={18} />;
      default:
        return <BookOpen size={18} />;
    }
  };

  return (
    <StyledPaper>
      <Typography variant="h6" fontWeight="bold" mb={3}>
        Activité récente
      </Typography>
      
      <Box>
        {activities.map((activity) => (
          <ActivityItem key={activity.id}>
            <IconWrapper type={activity.type}>
              {getIcon(activity.type)}
            </IconWrapper>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {activity.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activity.description}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                {activity.time}
              </Typography>
            </Box>
          </ActivityItem>
        ))}
      </Box>
      
      <ViewAllButton variant="outlined" onClick={onViewAll}>
        Voir toute l'activité
      </ViewAllButton>
    </StyledPaper>
  );
};

export default RecentActivity;
