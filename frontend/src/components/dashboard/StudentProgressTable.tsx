import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Avatar, Typography, LinearProgress, Box, Select, MenuItem, FormControl
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Types
export interface StudentProgress {
  id: number;
  name: string;
  email: string;
  avatar: string;
  course: string;
  progress: number;
  lastActivity: string;
}

interface StudentProgressTableProps {
  students: StudentProgress[];
  courses: { id: number; name: string }[];
  onCourseChange: (courseId: number | string) => void;
  selectedCourse: number | string;
}

// Styled components
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  overflow: 'hidden',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ProgressWrapper = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
}));

const ProgressBar = styled(LinearProgress)<{ value: number }>(({ theme, value }) => {
  let color = theme.palette.error.main;
  if (value >= 75) color = theme.palette.success.main;
  else if (value >= 50) color = theme.palette.info.main;
  else if (value >= 25) color = theme.palette.warning.main;

  return {
    height: 8,
    borderRadius: 4,
    width: '100%',
    marginRight: theme.spacing(1),
    backgroundColor: theme.palette.grey[200],
    '& .MuiLinearProgress-bar': {
      backgroundColor: color,
    },
  };
});

const ProgressValue = styled(Typography)(() => ({
  minWidth: '40px',
  fontWeight: 'bold',
  fontSize: '0.875rem',
}));

// Component
const StudentProgressTable: React.FC<StudentProgressTableProps> = ({ 
  students, 
  courses,
  onCourseChange,
  selectedCourse
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">Progression des étudiants</Typography>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <Select
            value={selectedCourse}
            onChange={(e) => onCourseChange(e.target.value)}
            displayEmpty
          >
            <MenuItem value="all">Tous les cours</MenuItem>
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <StyledTableContainer>
        <Paper>
          <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Étudiant</StyledTableCell>
              <StyledTableCell>Cours</StyledTableCell>
              <StyledTableCell>Progression</StyledTableCell>
              <StyledTableCell>Dernière activité</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student, index) => (
              <TableRow key={`student-${student.id}-${index}`} hover>
                <StyledTableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar src={student.avatar} alt={student.name} sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="body1" fontWeight="medium">{student.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{student.email}</Typography>
                    </Box>
                  </Box>
                </StyledTableCell>
                <StyledTableCell>
                  <Typography variant="body2">{student.course}</Typography>
                </StyledTableCell>
                <StyledTableCell>
                  <ProgressWrapper>
                    <ProgressBar variant="determinate" value={student.progress} />
                    <ProgressValue>{student.progress}%</ProgressValue>
                  </ProgressWrapper>
                </StyledTableCell>
                <StyledTableCell>
                  <Typography variant="body2" color="text.secondary">{student.lastActivity}</Typography>
                </StyledTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Paper>
      </StyledTableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Typography 
          variant="body2" 
          color="primary" 
          sx={{ 
            cursor: 'pointer', 
            fontWeight: 'medium',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          Voir tout →
        </Typography>
      </Box>
    </Box>
  );
};

export default StudentProgressTable;
