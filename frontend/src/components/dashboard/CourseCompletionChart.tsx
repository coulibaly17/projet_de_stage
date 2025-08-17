import React from 'react';
import { Box, Typography, Paper, styled } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(ArcElement, Tooltip, Legend);

// Types
export interface CourseCompletion {
  id: number;
  name: string;
  completion: number;
  color: string;
}

interface CourseCompletionChartProps {
  courses: CourseCompletion[];
  overallCompletion: number;
}

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  height: '100%',
}));

const ProgressBar = styled(Box)<{ value: number; color: string }>(({ theme, value, color }) => ({
  width: '100%',
  height: '8px',
  backgroundColor: theme.palette.grey[200],
  borderRadius: '4px',
  position: 'relative',
  marginTop: theme.spacing(1),
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${value}%`,
    backgroundColor: color,
    borderRadius: '4px',
  },
}));

// Component
const CourseCompletionChart: React.FC<CourseCompletionChartProps> = ({ courses, overallCompletion }) => {
  // Configuration du graphique en donut
  const chartData = {
    labels: courses.map(course => course.name),
    datasets: [
      {
        data: courses.map(course => course.completion),
        backgroundColor: courses.map(course => course.color),
        borderColor: courses.map(course => course.color),
        borderWidth: 1,
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    cutout: '70%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.raw}%`;
          }
        }
      }
    },
  };

  return (
    <StyledPaper>
      <Typography variant="h6" fontWeight="bold" mb={3}>
        Achèvement des cours
      </Typography>
      
      <Box sx={{ position: 'relative', height: '180px', mb: 3 }}>
        <Doughnut data={chartData} options={chartOptions} />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" fontWeight="bold" color="primary">
            {overallCompletion}%
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ mt: 3 }}>
        {courses.map((course) => (
          <Box key={course.id} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                {course.name}
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {course.completion}%
              </Typography>
            </Box>
            <ProgressBar value={course.completion} color={course.color} />
          </Box>
        ))}
      </Box>
    </StyledPaper>
  );
};

export default CourseCompletionChart;
