import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { quizService } from '@/services/quiz.service';

const QuizDebugPage: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({
    loading: true,
    endpoints: {},
    quizzes: [],
    error: null
  });

  useEffect(() => {
    const testAllEndpoints = async () => {
      const results: any = {
        endpoints: {},
        quizzes: [],
        error: null
      };

      // Liste des endpoints à tester
      const endpointsToTest = [
        'quizzes',
        'quiz',
        'quizzes/teacher',
        'quiz/teacher',
        'teacher/quizzes',
        'teacher/quiz',
        'courses/teacher',
        'courses'
      ];

      console.log('🔍 Test de tous les endpoints quiz...');

      // Tester chaque endpoint
      for (const endpoint of endpointsToTest) {
        try {
          console.log(`Testing ${endpoint}...`);
          const response = await apiService.get(endpoint);
          results.endpoints[endpoint] = {
            status: 'success',
            data: response,
            count: Array.isArray(response) ? response.length : 'N/A'
          };
          console.log(`✅ ${endpoint}: Success`, response);
        } catch (error: any) {
          results.endpoints[endpoint] = {
            status: 'error',
            error: error.response?.status || error.message,
            message: error.response?.data?.detail || error.message
          };
          console.log(`❌ ${endpoint}: Error`, error.response?.status, error.message);
        }
      }

      // Essayer de récupérer les quiz via le service
      try {
        console.log('🎯 Test du service getTeacherQuizzes...');
        const teacherQuizzes = await quizService.getTeacherQuizzes();
        results.quizzes = teacherQuizzes;
        console.log('✅ Service getTeacherQuizzes:', teacherQuizzes);
      } catch (serviceError: any) {
        results.error = serviceError.message;
        console.log('❌ Service getTeacherQuizzes error:', serviceError);
      }

      setDebugInfo({ ...results, loading: false });
    };

    testAllEndpoints();
  }, []);

  const testSpecificQuiz = async (quizId: string) => {
    console.log(`🔍 Test du quiz ID: ${quizId}`);
    
    const endpointsToTest = [
      `quizzes/${quizId}`,
      `quiz/${quizId}`,
      `teacher/quizzes/${quizId}`,
      `teacher/quiz/${quizId}`
    ];

    for (const endpoint of endpointsToTest) {
      try {
        const response = await apiService.get(endpoint);
        console.log(`✅ ${endpoint}: Quiz trouvé`, response);
        alert(`Quiz trouvé avec l'endpoint: ${endpoint}`);
        return;
      } catch (error: any) {
        console.log(`❌ ${endpoint}: ${error.response?.status} - ${error.message}`);
      }
    }
    
    alert(`Quiz ID ${quizId} introuvable sur tous les endpoints`);
  };

  const createTestQuiz = async () => {
    try {
      console.log('🆕 Tentative de création d\'un quiz de test...');
      
      const testQuizData = {
        title: 'Quiz de Test',
        description: 'Quiz créé pour les tests',
        courseId: 1,
        questions: []
      };

      const endpoints = ['quizzes', 'quiz', 'teacher/quizzes'];
      
      for (const endpoint of endpoints) {
        try {
          const response: any = await apiService.post(endpoint, testQuizData);
          console.log(`✅ Quiz créé avec ${endpoint}:`, response);
          alert(`Quiz créé avec succès via ${endpoint}! ID: ${response.id}`);
          return;
        } catch (error: any) {
          console.log(`❌ Échec création avec ${endpoint}:`, error.response?.status);
        }
      }
      
      alert('Impossible de créer un quiz sur tous les endpoints testés');
    } catch (error: any) {
      console.error('Erreur lors de la création du quiz:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  if (debugInfo.loading) {
    return <div style={{ padding: '20px' }}>🔄 Test des endpoints en cours...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>🔍 Debug Quiz Endpoints</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => testSpecificQuiz('1')} style={{ marginRight: '10px', padding: '10px' }}>
          🔍 Tester Quiz ID 1
        </button>
        <button onClick={() => testSpecificQuiz('2')} style={{ marginRight: '10px', padding: '10px' }}>
          🔍 Tester Quiz ID 2
        </button>
        <button onClick={createTestQuiz} style={{ padding: '10px' }}>
          🆕 Créer Quiz Test
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Endpoints Status */}
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
          <h2>📡 Status des Endpoints</h2>
          {Object.entries(debugInfo.endpoints).map(([endpoint, info]: [string, any]) => (
            <div key={endpoint} style={{ marginBottom: '10px', padding: '5px', background: info.status === 'success' ? '#e8f5e8' : '#ffe8e8' }}>
              <strong>{endpoint}</strong>: {info.status === 'success' ? '✅' : '❌'}
              {info.status === 'success' ? (
                <div>
                  <small>Count: {info.count}</small>
                  <details>
                    <summary>Voir données</summary>
                    <pre style={{ fontSize: '10px', maxHeight: '100px', overflow: 'auto' }}>
                      {JSON.stringify(info.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div>
                  <small style={{ color: 'red' }}>
                    {info.error} - {info.message}
                  </small>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quiz Service Results */}
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
          <h2>🎯 Service Quiz Results</h2>
          {debugInfo.error ? (
            <div style={{ color: 'red' }}>
              <strong>Erreur:</strong> {debugInfo.error}
            </div>
          ) : (
            <div>
              <p><strong>Quiz trouvés:</strong> {debugInfo.quizzes.length}</p>
              {debugInfo.quizzes.length > 0 ? (
                <div>
                  {debugInfo.quizzes.map((quiz: any, index: number) => (
                    <div key={index} style={{ marginBottom: '10px', padding: '5px', background: '#f0f0f0' }}>
                      <strong>ID:</strong> {quiz.id} <br />
                      <strong>Titre:</strong> {quiz.title} <br />
                      <strong>Course ID:</strong> {quiz.courseId}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'orange' }}>Aucun quiz trouvé</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Raw Debug Info */}
      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h2>🔧 Debug Info Complet</h2>
        <details>
          <summary>Voir toutes les données</summary>
          <pre style={{ fontSize: '10px', maxHeight: '300px', overflow: 'auto' }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default QuizDebugPage;
