import React from 'react';
import { 
  Box, Typography, List, ListItem, ListItemIcon, 
  ListItemText, ListItemButton, Divider, Chip, 
  LinearProgress, Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  PlayCircle, CheckCircle, Lock, FileText, 
  Clock, Video, Award
} from 'lucide-react';

// Types
export interface Lesson {
  id: string | number;
  title: string;
  description?: string;
  content?: string;
  video_url?: string;
  duration: string | number;
  order_index: number;
  is_completed?: boolean;
  completion_percentage?: number;
  last_accessed?: string | null;
  type?: 'video' | 'quiz' | 'text' | 'assignment';
  isLocked?: boolean;
  isCurrent?: boolean;
}

interface LessonsListProps {
  lessons: Lesson[];
  courseTitle: string;
  courseProgress: number;
  onSelectLesson: (lessonId: string | number) => void;
  currentLessonId?: string | number;
}

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: Number(theme.shape.borderRadius) * 2,
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
}));

const ListHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ProgressSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: theme.spacing(2),
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  flexGrow: 1,
  marginRight: theme.spacing(2),
}));

const StyledListItemButton = styled(ListItemButton)<{ 
  locked: number;
  current: number;
}>(({ theme, locked, current }) => ({
  borderLeft: current 
    ? `4px solid ${theme.palette.primary.main}` 
    : '4px solid transparent',
  backgroundColor: current 
    ? theme.palette.primary.light + '20'
    : 'transparent',
  opacity: locked ? 0.6 : 1,
  '&:hover': {
    backgroundColor: current 
      ? theme.palette.primary.light + '30'
      : theme.palette.action.hover,
  },
}));

const LessonTypeChip = styled(Chip)<{ lessontype?: string }>(({ theme, lessontype = 'text' }) => {
  const colors = {
    video: {
      bg: theme.palette.info.light,
      color: theme.palette.info.dark,
    },
    quiz: {
      bg: theme.palette.warning.light,
      color: theme.palette.warning.dark,
    },
    text: {
      bg: theme.palette.success.light,
      color: theme.palette.success.dark,
    },
    assignment: {
      bg: theme.palette.secondary.light,
      color: theme.palette.secondary.dark,
    },
  };

  const colorSet = colors[lessontype as keyof typeof colors];

  return {
    backgroundColor: colorSet.bg,
    color: colorSet.color,
    fontWeight: 500,
    fontSize: '0.75rem',
  };
});

const DurationText = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
  marginTop: theme.spacing(0.5),
}));

// Helper function to get icon by lesson type
const getLessonIcon = (type: string, isCompleted: boolean, isLocked: boolean) => {
  if (isLocked) return <Lock size={20} />;
  if (isCompleted) return <CheckCircle size={20} color="#4caf50" />;
  
  switch (type) {
    case 'video':
      return <Video size={20} color="#2196f3" />;
    case 'quiz':
      return <Award size={20} color="#ff9800" />;
    case 'text':
      return <FileText size={20} color="#4caf50" />;
    case 'assignment':
      return <PlayCircle size={20} color="#9c27b0" />;
    default:
      return <PlayCircle size={20} />;
  }
};

// Helper function to get label by lesson type
const getLessonTypeLabel = (type: string) => {
  switch (type) {
    case 'video':
      return 'Vidéo';
    case 'quiz':
      return 'Quiz';
    case 'text':
      return 'Lecture';
    case 'assignment':
      return 'Devoir';
    default:
      return 'Leçon';
  }
};

// Component
const LessonsList: React.FC<LessonsListProps> = ({ 
  lessons, 
  courseTitle,
  courseProgress,
  onSelectLesson,
  currentLessonId
}) => {
  // Calculer la progression du module basée sur la progression réelle des leçons
  const completedLessons = lessons.filter(lesson => lesson.is_completed).length;
  const totalProgress = lessons.reduce((sum, lesson) => sum + (lesson.completion_percentage ?? 0), 0);
  const moduleProgress = lessons.length > 0 ? Math.round(totalProgress / lessons.length) : 0;
  
  return (
    <StyledPaper>
      <ListHeader>
        <Typography variant="h6" fontWeight="bold">
          {courseTitle}
        </Typography>
        
        <ProgressSection>
          <ProgressBar 
            variant="determinate" 
            value={moduleProgress} 
            color={moduleProgress === 100 ? "success" : "primary"}
          />
          <Typography variant="body2" fontWeight="medium">
            {moduleProgress}%
          </Typography>
        </ProgressSection>
        
        <Typography variant="body2" color="text.secondary" mt={1}>
          {completedLessons} sur {lessons.length} leçons complétées
        </Typography>
      </ListHeader>
      
      <List disablePadding>
        {lessons.map((lesson, index) => (
          <React.Fragment key={lesson.id}>
            {index > 0 && <Divider component="li" />}
            <ListItem disablePadding>
              <StyledListItemButton
                onClick={() => !lesson.isLocked && onSelectLesson(lesson.id)}
                locked={lesson.isLocked ? 1 : 0}
                current={(currentLessonId === lesson.id) ? 1 : 0}
                disabled={lesson.isLocked}
              >
                <ListItemIcon>
                  {getLessonIcon(lesson.type || 'text', lesson.is_completed || false, lesson.isLocked || false)}
                </ListItemIcon>
                <ListItemText
                  primary={lesson.title}
                  primaryTypographyProps={{ component: 'div' }}
                  secondary={
                    <Box component="div" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <LessonTypeChip 
                        label={getLessonTypeLabel(lesson.type || 'text')} 
                        size="small"
                        lessontype={lesson.type}
                      />
                      <DurationText sx={{ ml: 1 }}>
                        <Clock size={14} style={{ marginRight: 4 }} />
                        {lesson.duration}
                      </DurationText>
                    </Box>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
                {lesson.completion_percentage !== undefined && lesson.completion_percentage > 0 && lesson.completion_percentage < 100 && (
                  <Chip 
                    label={`${lesson.completion_percentage}%`}
                    size="small"
                    sx={{ 
                      backgroundColor: (theme) => theme.palette.primary.light,
                      color: (theme) => theme.palette.primary.main,
                      fontWeight: 'medium',
                    }}
                  />
                )}
              </StyledListItemButton>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </StyledPaper>
  );
};

export default LessonsList;
