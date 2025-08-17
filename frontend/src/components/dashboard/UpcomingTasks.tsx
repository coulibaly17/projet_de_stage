import React from 'react';
import { Box, Typography, Paper, Checkbox, Button, styled } from '@mui/material';
import { Plus } from 'lucide-react';

// Types
export interface Task {
  id: number;
  title: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low' | 'normal';
  completed: boolean;
}

interface UpcomingTasksProps {
  tasks: Task[];
  onTaskToggle: (id: number, completed: boolean) => void;
  onAddTask: () => void;
}

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  height: '100%',
}));

const TaskItem = styled(Box)<{ priority: string }>(({ theme, priority }) => {
  const colors = {
    high: theme.palette.error.main,
    medium: theme.palette.warning.main,
    low: theme.palette.success.main,
    normal: theme.palette.info.main,
  };

  const bgColors = {
    high: theme.palette.error.light,
    medium: theme.palette.warning.light,
    low: theme.palette.success.light,
    normal: theme.palette.info.light,
  };

  return {
    display: 'flex',
    alignItems: 'flex-start',
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
    backgroundColor: bgColors[priority as keyof typeof bgColors],
    borderRadius: theme.shape.borderRadius,
    borderLeft: `4px solid ${colors[priority as keyof typeof colors]}`,
  };
});

const StyledCheckbox = styled(Checkbox)<{ priority: string }>(({ theme, priority }) => {
  const colors = {
    high: theme.palette.error.main,
    medium: theme.palette.warning.main,
    low: theme.palette.success.main,
    normal: theme.palette.info.main,
  };

  return {
    color: colors[priority as keyof typeof colors],
    '&.Mui-checked': {
      color: colors[priority as keyof typeof colors],
    },
  };
});

const AddTaskButton = styled(Button)(({ theme }) => ({
  width: '100%',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  marginTop: theme.spacing(2),
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const TaskHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

const AddButton = styled(Button)(({ theme }) => ({
  minWidth: 'unset',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

// Component
const UpcomingTasks: React.FC<UpcomingTasksProps> = ({ 
  tasks, 
  onTaskToggle,
  onAddTask
}) => {
  return (
    <StyledPaper>
      <TaskHeader>
        <Typography variant="h6" fontWeight="bold">
          Tâches à venir
        </Typography>
        <AddButton 
          color="primary" 
          variant="text" 
          onClick={onAddTask}
          aria-label="Ajouter une tâche"
        >
          <Plus size={20} />
        </AddButton>
      </TaskHeader>
      
      <Box>
        {tasks.map((task) => (
          <TaskItem key={task.id} priority={task.priority}>
            <StyledCheckbox
              priority={task.priority}
              checked={task.completed}
              onChange={(e) => onTaskToggle(task.id, e.target.checked)}
            />
            <Box>
              <Typography 
                variant="body2" 
                fontWeight="medium"
                sx={{ 
                  textDecoration: task.completed ? 'line-through' : 'none',
                  opacity: task.completed ? 0.7 : 1,
                }}
              >
                {task.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Date limite: {task.deadline}
              </Typography>
            </Box>
          </TaskItem>
        ))}
      </Box>
      
      <AddTaskButton 
        variant="contained" 
        startIcon={<Plus size={16} />}
        onClick={onAddTask}
      >
        Ajouter une tâche
      </AddTaskButton>
    </StyledPaper>
  );
};

export default UpcomingTasks;
