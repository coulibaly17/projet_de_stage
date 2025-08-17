import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';

const AuthDebugPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [localStorageData, setLocalStorageData] = useState<any>(null);
  const [apiData, setApiData] = useState<any>(null);

  useEffect(() => {
    // Récupérer les données du localStorage
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    setLocalStorageData({
      token: token ? 'Présent' : 'Absent',
      tokenLength: token?.length || 0,
      userData: userData ? JSON.parse(userData) : null,
      userDataRaw: userData
    });

    // Tester l'API
    const testAPI = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setApiData(currentUser);
      } catch (error: any) {
        setApiData({ error: error.message || 'Erreur inconnue' });
      }
    };

    testAPI();
  }, []);

  const handleLogout = () => {
    console.log('🚪 Test de déconnexion...');
    logout();
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    console.log('🧹 localStorage nettoyé');
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Page de Débogage Authentification</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleLogout} style={{ marginRight: '10px', padding: '10px' }}>
          🚪 Se déconnecter
        </button>
        <button onClick={clearLocalStorage} style={{ padding: '10px' }}>
          🧹 Nettoyer localStorage
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* AuthContext */}
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
          <h2>📱 AuthContext</h2>
          <p><strong>isAuthenticated:</strong> {isAuthenticated ? '✅ Oui' : '❌ Non'}</p>
          <p><strong>user:</strong> {user ? '✅ Présent' : '❌ Absent'}</p>
          {user && (
            <div style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px' }}>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Rôle:</strong> {user.role}</p>
              <p><strong>Type du rôle:</strong> {typeof user.role}</p>
              <p><strong>Nom:</strong> {user.firstName} {user.lastName}</p>
            </div>
          )}
        </div>

        {/* localStorage */}
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
          <h2>💾 localStorage</h2>
          <p><strong>Token:</strong> {localStorageData?.token}</p>
          <p><strong>Longueur token:</strong> {localStorageData?.tokenLength}</p>
          <p><strong>Données utilisateur:</strong> {localStorageData?.userData ? '✅ Présent' : '❌ Absent'}</p>
          {localStorageData?.userData && (
            <div style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px' }}>
              <p><strong>ID:</strong> {localStorageData.userData.id}</p>
              <p><strong>Email:</strong> {localStorageData.userData.email}</p>
              <p><strong>Rôle:</strong> {localStorageData.userData.role}</p>
              <p><strong>Type du rôle:</strong> {typeof localStorageData.userData.role}</p>
            </div>
          )}
          {localStorageData?.userDataRaw && (
            <div style={{ marginTop: '10px' }}>
              <strong>Raw JSON:</strong>
              <pre style={{ fontSize: '10px', background: '#eee', padding: '5px' }}>
                {localStorageData.userDataRaw}
              </pre>
            </div>
          )}
        </div>

        {/* API Response */}
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
          <h2>🌐 API Response</h2>
          {apiData ? (
            apiData.error ? (
              <p style={{ color: 'red' }}>❌ Erreur: {apiData.error}</p>
            ) : (
              <div style={{ background: '#f5f5f5', padding: '10px' }}>
                <p><strong>ID:</strong> {apiData.id}</p>
                <p><strong>Email:</strong> {apiData.email}</p>
                <p><strong>Rôle:</strong> {apiData.role}</p>
                <p><strong>Type du rôle:</strong> {typeof apiData.role}</p>
              </div>
            )
          ) : (
            <p>⏳ Chargement...</p>
          )}
        </div>

        {/* Navigation Test */}
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
          <h2>🧭 Test de Navigation</h2>
          <p><strong>URL actuelle:</strong> {window.location.pathname}</p>
          <div style={{ marginTop: '10px' }}>
            <a href="/connexion" style={{ display: 'block', marginBottom: '5px' }}>🔑 Page de connexion</a>
            <a href="/etudiant" style={{ display: 'block', marginBottom: '5px' }}>👨‍🎓 Dashboard étudiant</a>
            <a href="/enseignant" style={{ display: 'block', marginBottom: '5px' }}>👨‍🏫 Dashboard enseignant</a>
            <a href="/admin" style={{ display: 'block', marginBottom: '5px' }}>👨‍💼 Dashboard admin</a>
            <a href="/tableau-de-bord" style={{ display: 'block', marginBottom: '5px' }}>📊 Redirection automatique</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugPage;
