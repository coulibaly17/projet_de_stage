import React from 'react';
import { 
  Box, Grid, Typography, Card, CardContent, 
  CardMedia, LinearProgress, Button, Chip, Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Play, Clock, Award } from 'lucide-react';

// Types
export interface Course {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  instructor: {
    id: number;
    name: string;
    avatar: string;
  };
  progress: number;
  duration: string;
  lessonsCount: number;
  completedLessons: number;
  tags: string[];
  isRecommended?: boolean;
}

interface CoursesListProps {
  title: string;
  courses: Course[];
  showViewAll?: boolean;
  onViewAll?: () => void;
  emptyMessage?: string;
  onEnroll?: (courseId: number) => Promise<void>;
}

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
  },
}));

const CourseImage = styled(CardMedia)(() => ({
  height: 160,
  position: 'relative',
}));



const RecommendedBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.secondary.contrastText,
  padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.75rem',
  fontWeight: 'bold',
}));

const CourseContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
}));

const CourseTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  marginBottom: theme.spacing(1),
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  height: '3rem',
}));

const CourseDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  height: '3rem',
}));

const ProgressSection = styled(Box)(({ theme }) => ({
  marginTop: 'auto',
  paddingTop: theme.spacing(2),
}));

const ProgressText = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(0.5),
}));

const TagsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const InstructorInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const CourseStats = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
}));

const StatItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

// Component
const CoursesList: React.FC<CoursesListProps> = ({ 
  title, 
  courses, 
  showViewAll = true,
  onViewAll,
  emptyMessage = "Aucun cours disponible",
  onEnroll
}) => {
  if (courses.length === 0) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={3}>
          {title}
        </Typography>
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        {showViewAll && (
          <Button 
            color="primary" 
            onClick={onViewAll}
            sx={{ 
              '&:hover': { 
                backgroundColor: 'transparent', 
                textDecoration: 'underline' 
              } 
            }}
          >
            Voir tout
          </Button>
        )}
      </Box>
      
      <Grid container sx={{ display: 'flex', flexWrap: 'wrap', margin: -1 }}>
        {courses.map((course) => (
          <Grid key={course.id} spacing={3} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 1 }}>
            <StyledCard>
              <CourseImage
                image={course.imageUrl}
                title={course.title}
              >
                {course.isRecommended && (
                  <RecommendedBadge>Recommandé</RecommendedBadge>
                )}
              </CourseImage>
              
              <CourseContent>
                <TagsContainer>
                  {course.tags.map((tag, index) => (
                    <Chip 
                      key={index} 
                      label={tag} 
                      size="small" 
                      sx={{ 
                        backgroundColor: (theme) => theme.palette.primary.light,
                        color: (theme) => theme.palette.primary.main,
                      }} 
                    />
                  ))}
                </TagsContainer>
                
                <CourseTitle variant="h6">
                  {course.title}
                </CourseTitle>
                
                <CourseDescription variant="body2">
                  {course.description}
                </CourseDescription>
                
                <InstructorInfo>
                  <Avatar 
                    src={course.instructor.avatar} 
                    alt={course.instructor.name}
                    sx={{ width: 32, height: 32, mr: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {course.instructor.name}
                  </Typography>
                </InstructorInfo>
                
                <CourseStats>
                  <StatItem>
                    <Clock size={16} />
                    <span>{course.duration}</span>
                  </StatItem>
                  <StatItem>
                    <Award size={16} />
                    <span>{course.completedLessons}/{course.lessonsCount} leçons</span>
                  </StatItem>
                </CourseStats>
                
                <ProgressSection>
                  <ProgressText>
                    <Typography variant="body2" color="text.secondary">
                      Progression
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {course.progress}%
                    </Typography>
                  </ProgressText>
                  <LinearProgress 
                    variant="determinate" 
                    value={course.progress} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: (theme) => theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: (theme) => 
                          course.progress >= 75 
                            ? theme.palette.success.main 
                            : course.progress >= 25 
                              ? theme.palette.warning.main 
                              : theme.palette.error.main,
                      }
                    }} 
                  />
                </ProgressSection>
                
                {course.isRecommended ? (
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    onClick={() => onEnroll?.(course.id)}
                    sx={{ mt: 2, borderRadius: 2 }}
                  >
                    S'inscrire
                  </Button>
                ) : (
                  <Button
                    component="a"
                    href={`/courses/${course.id}`}
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<Play size={16} />}
                    sx={{ mt: 2, borderRadius: 2 }}
                  >
                    {course.progress > 0 ? "Continuer" : "Commencer"}
                  </Button>
                )}
              </CourseContent>
            </StyledCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CoursesList;
