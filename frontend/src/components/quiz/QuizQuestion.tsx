import React, { useMemo } from 'react';
import { Box, Typography, Radio, RadioGroup, FormControlLabel, Checkbox, TextField, FormControl, FormLabel, FormGroup } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { Question } from '../../types/quiz';

interface QuizQuestionProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  questionNumber: number;
  totalQuestions?: number;
  showFeedback?: boolean;
}

const QuestionContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  '&:not(:last-child)': {
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(4),
  },
}));

const QuestionText = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  marginBottom: theme.spacing(2),
  lineHeight: 1.5,
}));

const QuestionNumber = styled('span')(({ theme }) => ({
  display: 'inline-block',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: '50%',
  width: '28px',
  height: '28px',
  textAlign: 'center',
  lineHeight: '28px',
  marginRight: theme.spacing(1.5),
  fontWeight: 'bold',
  fontSize: '0.9rem',
}));

const OptionContainer = styled(Box)(({ theme }) => ({
  marginLeft: theme.spacing(4),
  marginTop: theme.spacing(1),
}));

const Feedback = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isCorrect'
})<{ isCorrect?: boolean }>(({ theme, isCorrect }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: isCorrect 
    ? theme.palette.success.light 
    : theme.palette.error.light,
  color: isCorrect 
    ? theme.palette.success.contrastText 
    : theme.palette.error.contrastText,
  '& strong': {
    display: 'block',
    marginBottom: theme.spacing(1),
  },
}));

const renderQuestionContent = (
  question: Question,
  value: any,
  onChange: (value: any) => void
) => {
  const handleChange = (newValue: string) => {
    if (question.type === 'multiple') {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(newValue)
        ? currentValues.filter((v: string) => v !== newValue)
        : [...currentValues, newValue];
      onChange(newValues);
    } else {
      onChange(newValue);
    }
  };

  switch (question.type) {
    case 'single':
      return (
        <FormControl component="fieldset">
          <RadioGroup
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            {question.options?.map((option, index) => (
              <FormControlLabel
                key={index}
                value={option.id}
                control={<Radio color="primary" />}
                label={option.text}
                sx={{ mb: 1 }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      );

    case 'multiple':
      return (
        <FormControl component="fieldset">
          <FormLabel component="legend">Sélectionnez une ou plusieurs réponses :</FormLabel>
          <FormGroup>
            {question.options?.map((option, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={Array.isArray(value) && value.includes(option.id)}
                    onChange={() => handleChange(option.id)}
                    color="primary"
                  />
                }
                label={option.text}
                sx={{ mb: 1 }}
              />
            ))}
          </FormGroup>
        </FormControl>
      );

    case 'text':
      return (
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="Votre réponse..."
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'code':
      return (
        <TextField
          fullWidth
          multiline
          rows={8}
          variant="outlined"
          placeholder="Écrivez votre code ici..."
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          sx={{
            fontFamily: '"Fira Code", "Roboto Mono", monospace',
            '& textarea': {
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              lineHeight: 1.5,
            },
          }}
        />
      );

    default:
      return null;
  }
};

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  value,
  onChange,
  questionNumber,
  totalQuestions,
  showFeedback = false,
}) => {
  const showExplanation = useMemo(() => {
    return showFeedback && question.explanation;
  }, [showFeedback, question.explanation]);

  const isCorrect = useMemo(() => {
    if (!showFeedback || !question.correctAnswers) return undefined;
    
    if (question.type === 'multiple') {
      const correctIds = question.correctAnswers;
      const selectedIds = Array.isArray(value) ? value : [];
      
      return (
        selectedIds.length === correctIds.length &&
        selectedIds.every(id => correctIds.includes(id))
      );
    }
    
    return question.correctAnswers.includes(value);
  }, [showFeedback, question, value]);

  return (
    <QuestionContainer>
      <Box component="div">
        <QuestionText variant="h6">
          <QuestionNumber>{questionNumber}</QuestionNumber>
          {question.text}
        </QuestionText>
      </Box>
      
      {question.codeSnippet && (
        <Box 
          component="pre" 
          sx={{ 
            backgroundColor: 'grey.100',
            p: 2,
            borderRadius: 1,
            overflowX: 'auto',
            mb: 3,
            fontFamily: '"Fira Code", "Roboto Mono", monospace',
            fontSize: '0.9rem',
          }}
        >
          <code>{question.codeSnippet}</code>
        </Box>
      )}

      <OptionContainer>
        {renderQuestionContent(question, value, onChange)}
      </OptionContainer>

      {showFeedback && (
        <Box mt={3}>
          {showExplanation && (
            <Feedback isCorrect={isCorrect}>
              <strong>
                {isCorrect ? '✓ Bonne réponse !' : '✗ Réponse incorrecte'}
              </strong>
              <div>{question.explanation}</div>
            </Feedback>
          )}
          
          {question.metadata?.resources && question.metadata.resources.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Ressources pour en savoir plus :
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '24px' }}>
                {question.metadata.resources.map((resource, index) => (
                  <li key={index}>
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'inherit' }}
                    >
                      {resource.title || resource.url}
                    </a>
                  </li>
                ))}
              </ul>
            </Box>
          )}
        </Box>
      )}
    </QuestionContainer>
  );
};

export default QuizQuestion;
