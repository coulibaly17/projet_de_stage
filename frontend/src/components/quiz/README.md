# Module de Quiz

Un ensemble de composants React pour créer et gérer des quiz interactifs dans une application éducative.

## Fonctionnalités

- Création de quiz avec différents types de questions (choix unique, choix multiples, texte, code)
- Gestion du temps avec minuteur configurable
- Navigation entre les questions
- Affichage des résultats détaillés
- Gestion des tentatives et des scores
- Mode hors ligne avec synchronisation automatique
- Interface utilisateur réactive et accessible

## Installation

Assurez-vous d'avoir installé les dépendances requises :

```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material axios
```

## Utilisation

### Composant clé en main

```tsx
import { Quiz } from './components/quiz';

function App() {
  return (
    <Quiz 
      quizId="mon-quiz"
      onComplete={(result) => console.log('Résultats:', result)}
    />
  );
}
```

### Utilisation avancée avec le hook useQuiz

```tsx
import { useQuiz, QuizQuestion } from './components/quiz';

function CustomQuiz() {
  const {
    quiz,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    submit,
    goToNextQuestion,
    saveAnswer,
    userAnswers,
    result
  } = useQuiz({
    quizId: 'mon-quiz',
    onComplete: (result) => console.log('Terminé!', result)
  });

  if (!currentQuestion) return <div>Chargement...</div>;

  return (
    <div>
      <h2>{quiz?.title}</h2>
      <p>Question {currentQuestionIndex + 1} sur {totalQuestions}</p>
      
      <QuizQuestion
        question={currentQuestion}
        value={userAnswers[currentQuestion.id]}
        onChange={(value) => saveAnswer(currentQuestion.id, value)}
      />
      
      <button 
        onClick={goToNextQuestion}
        disabled={!userAnswers[currentQuestion.id]}
      >
        Suivant
      </button>
    </div>
  );
}
```

## API

### Composants

#### `<Quiz />`

Le composant principal qui gère tout le flux du quiz.

**Props :**

| Prop | Type | Requis | Description |
|------|------|--------|-------------|
| `quizId` | string | Oui | L'identifiant unique du quiz à charger |
| `onComplete` | (result: QuizResult) => void | Non | Callback appelé lorsque le quiz est terminé |
| `showNavigation` | boolean | Non | Afficher la navigation entre les questions (défaut: `true`) |
| `showTimer` | boolean | Non | Afficher le minuteur (défaut: `true`) |
| `showProgress` | boolean | Non | Afficher la barre de progression (défaut: `true`) |
| `showResults` | boolean | Non | Afficher les résultats à la fin (défaut: `true`) |
| `autoStart` | boolean | Non | Démarrer automatiquement le quiz (défaut: `true`) |

#### `<QuizQuestion />`

Affiche une question individuelle avec ses options de réponse.

**Props :**

| Prop | Type | Requis | Description |
|------|------|--------|-------------|
| `question` | Question | Oui | L'objet question à afficher |
| `value` | any | Non | La valeur actuelle de la réponse |
| `onChange` | (value: any) => void | Oui | Callback appelé lorsque la réponse change |
| `questionNumber` | number | Non | Le numéro de la question à afficher |
| `totalQuestions` | number | Non | Le nombre total de questions |
| `showFeedback` | boolean | Non | Afficher le feedback immédiat (défaut: `false`) |

#### `<QuizResults />`

Affiche les résultats détaillés du quiz.

**Props :**

| Prop | Type | Requis | Description |
|------|------|--------|-------------|
| `result` | QuizResult | Oui | Les résultats du quiz à afficher |
| `quiz` | Quiz | Oui | L'objet quiz correspondant |
| `onRetry` | () => void | Non | Callback appelé lorsque l'utilisateur clique sur "Réessayer" |
| `showDetails` | boolean | Non | Afficher les détails des réponses (défaut: `true`) |

### Hooks

#### `useQuiz`

Hook personnalisé pour gérer l'état du quiz.

**Paramètres :**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `quizId` | string | Oui | L'identifiant du quiz à charger |
| `autoLoad` | boolean | Non | Charger automatiquement le quiz (défaut: `true`) |
| `onComplete` | (result: QuizResult) => void | Non | Callback appelé lorsque le quiz est terminé |
| `onError` | (error: Error) => void | Non | Callback appelé en cas d'erreur |

**Valeurs de retour :**

| Propriété | Type | Description |
|-----------|------|-------------|
| `quiz` | Quiz \| null | L'objet quiz chargé |
| `loading` | boolean | État de chargement |
| `error` | Error \| null | Erreur éventuelle |
| `currentQuestion` | Question \| undefined | Question actuelle |
| `currentQuestionIndex` | number | Index de la question actuelle |
| `totalQuestions` | number | Nombre total de questions |
| `progress` | number | Progression du quiz (0-100) |
| `timeRemaining` | number \| null | Temps restant en secondes |
| `submit` | () => Promise<void> | Soumettre le quiz |
| `goToNextQuestion` | () => void | Aller à la question suivante |
| `goToPreviousQuestion` | () => void | Revenir à la question précédente |
| `goToQuestion` | (index: number) => void | Aller à une question spécifique |
| `saveAnswer` | (questionId: string, answer: any) => void | Enregistrer une réponse |
| `userAnswers` | Record<string, any> | Réponses de l'utilisateur |
| `result` | QuizResult \| null | Résultats du quiz |

### Services

#### `quizService`

Service pour interagir avec l'API des quiz.

**Méthodes :**

- `getQuiz(quizId: string): Promise<Quiz>` - Récupère un quiz par son ID
- `startQuizAttempt(quizId: string): Promise<QuizAttempt>` - Commence une nouvelle tentative de quiz
- `submitQuizAttempt(quizId: string, attempt: Partial<QuizAttempt>): Promise<QuizResult>` - Soumet une tentative de quiz
- `getQuizResults(quizId: string, userId?: string): Promise<QuizResult[]>` - Récupère les résultats d'un quiz
- `submitQuizFeedback(quizId: string, attemptId: string, feedback: Partial<QuizFeedback>): Promise<{ success: boolean }>` - Soumet un feedback sur un quiz

## Personnalisation

### Thème

Vous pouvez personnaliser l'apparence des composants en utilisant le thème Material-UI :

```tsx
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    // Personnalisations supplémentaires...
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Quiz quizId="mon-quiz" />
    </ThemeProvider>
  );
}
```

### Styles

Chaque composant expose des classes CSS que vous pouvez surcharger :

```css
.quiz-container {
  max-width: 800px;
  margin: 0 auto;
}

.quiz-question {
  margin-bottom: 2rem;
}

/* Styles personnalisés... */
```

## Accessibilité

Tous les composants sont conçus pour être accessibles et respectent les directives WCAG 2.1. Les fonctionnalités clés incluent :

- Navigation au clavier
- Étiquettes ARIA appropriées
- Contraste de couleurs suffisant
- Support des lecteurs d'écran
- Gestion du focus

## Compatibilité

- React 17+
- TypeScript 4.0+
- Navigateurs modernes (Chrome, Firefox, Safari, Edge)
- Compatible avec les appareils mobiles

## Licence

MIT
