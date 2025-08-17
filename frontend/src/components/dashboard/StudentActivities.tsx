import React from 'react';
import { 
  Box, Typography, Card, CardContent, Avatar, 
  List, ListItem, ListItemAvatar, ListItemText, 
  Divider, Button, Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Calendar, Clock, Award, BookOpen, 
  MessageSquare, FileText, CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Types
export interface Activity {
  id: number;
  type: 'quiz' | 'course' | 'message' | 'assignment' | 'certificate';
  title: string;
  description: string;
  time: string;
  course?: {
    id: number;
    title: string;
  };
}

export interface UpcomingQuiz {
  id: number;
  title: string;
  courseTitle: string;
  courseId: number;
  dueDate: string;
  timeRemaining: string;
  isImportant: boolean;
}

interface StudentActivitiesProps {
  recentActivities: Activity[];
  upcomingQuizzes: UpcomingQuiz[];
  onViewAllActivities?: () => void;
}

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const CardHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledAvatar = styled(Avatar)<{ activitytype: string }>(({ theme, activitytype }) => {
  const colors = {
    quiz: theme.palette.warning.main,
    course: theme.palette.info.main,
    message: theme.palette.success.main,
    assignment: theme.palette.secondary.main,
    certificate: theme.palette.error.main,
  };

  return {
    backgroundColor: colors[activitytype as keyof typeof colors] || theme.palette.primary.main,
    color: '#fff',
    width: 40,
    height: 40,
  };
});

const TimeText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
  display: 'flex',
  alignItems: 'center',
}));

const QuizItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(2),
  '&:last-child': {
    marginBottom: 0,
  },
}));

const QuizHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(1),
}));

const ImportantChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.error.light,
  color: theme.palette.error.dark,
  fontWeight: 'bold',
}));

const TimeRemainingText = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
  marginTop: theme.spacing(1),
}));

// Helper function to get icon by activity type
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'quiz':
      return <Award size={24} />;
    case 'course':
      return <BookOpen size={24} />;
    case 'message':
      return <MessageSquare size={24} />;
    case 'assignment':
      return <FileText size={24} />;
    case 'certificate':
      return <CheckCircle size={24} />;
    default:
      return <BookOpen size={24} />;
  }
};

// Component
const StudentActivities: React.FC<StudentActivitiesProps> = ({ 
  recentActivities, 
  upcomingQuizzes,
  onViewAllActivities
}) => {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
      {/* Recent Activities */}
      <StyledCard>
        <CardHeader>
          <Typography variant="h6" fontWeight="bold">
            Activités récentes
          </Typography>
          <Button 
            color="primary" 
            onClick={onViewAllActivities}
            sx={{ 
              '&:hover': { 
                backgroundColor: 'transparent', 
                textDecoration: 'underline' 
              } 
            }}
          >
            Voir tout
          </Button>
        </CardHeader>
        
        <CardContent sx={{ p: 0, flexGrow: 1 }}>
          <List sx={{ p: 0 }}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem sx={{ px: 3, py: 2 }}>
                    <ListItemAvatar>
                      <StyledAvatar activitytype={activity.type}>
                        {getActivityIcon(activity.type)}
                      </StyledAvatar>
                    </ListItemAvatar>
                    <ListItemText
                      primaryTypographyProps={{ component: 'div' }}
                      secondaryTypographyProps={{ component: 'div' }}
                      primary={
                        <Typography variant="body1" fontWeight="medium" component="div">
                          {activity.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }} component="div">
                            {activity.description}
                          </Typography>
                          {activity.course && (
                            <Link 
                              to={`/courses/${activity.course.id}`}
                              style={{ 
                                textDecoration: 'none'
                              }}
                            >
                              <Typography 
                                variant="body2" 
                                color="primary"
                                sx={{ 
                                  display: 'block', 
                                  mb: 0.5,
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                              >
                                {activity.course.title}
                              </Typography>
                            </Link>
                          )}
                          <TimeText>
                            <Clock size={14} style={{ marginRight: 4 }} />
                            {activity.time}
                          </TimeText>
                        </>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Aucune activité récente
                </Typography>
              </Box>
            )}
          </List>
        </CardContent>
      </StyledCard>
      
      {/* Upcoming Quizzes */}
      <StyledCard>
        <CardHeader>
          <Typography variant="h6" fontWeight="bold">
            Quiz à venir
          </Typography>
          <Link 
            to="/quizzes"
            style={{ 
              textDecoration: 'none'
            }}
          >
            <Button 
              color="primary" 
              sx={{ 
                '&:hover': { 
                  backgroundColor: 'transparent', 
                  textDecoration: 'underline' 
                } 
              }}
            >
              Tous les quiz
            </Button>
          </Link>
        </CardHeader>
        
        <CardContent sx={{ p: 3, flexGrow: 1 }}>
          {upcomingQuizzes.length > 0 ? (
            upcomingQuizzes.map((quiz) => (
              <QuizItem key={quiz.id}>
                <QuizHeader>
                  <Typography variant="body1" fontWeight="medium">
                    {quiz.title}
                  </Typography>
                  {quiz.isImportant && (
                    <ImportantChip 
                      label="Important" 
                      size="small" 
                    />
                  )}
                </QuizHeader>
                
                <Link 
                  to={`/courses/${quiz.courseId}`}
                  style={{ 
                    textDecoration: 'none'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    color="primary"
                    sx={{ 
                      display: 'block', 
                      mb: 1,
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {quiz.courseTitle}
                  </Typography>
                </Link>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <Calendar size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
                    Échéance: {quiz.dueDate}
                  </Typography>
                </Box>
                
                <TimeRemainingText>
                  <Clock size={14} style={{ marginRight: 4 }} />
                  Temps restant: {quiz.timeRemaining}
                </TimeRemainingText>
                
                <Box sx={{ mt: 2 }}>
                  <Link 
                    to={`/quizzes/${quiz.id}`}
                    style={{ 
                      textDecoration: 'none',
                      width: '100%'
                    }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ borderRadius: 2 }}
                    >
                      Commencer le quiz
                    </Button>
                  </Link>
                </Box>
              </QuizItem>
            ))
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Typography color="text.secondary">
                Aucun quiz à venir
              </Typography>
            </Box>
          )}
        </CardContent>
      </StyledCard>
    </Box>
  );
};

export default StudentActivities;
