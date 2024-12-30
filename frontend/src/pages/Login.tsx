import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  console.log('Login - Component State:', {
    isAuthenticated,
    hasUser: !!user,
  });

  useEffect(() => {
    if (isAuthenticated && user?.username) {
      console.log('Login - User is authenticated, redirecting to profile', {
        username: user.username,
      });
      navigate(`/${user.username}`, { replace: true });
    }
  }, [navigate, isAuthenticated, user]);

  const handleGitHubLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('Login - Starting GitHub login flow', { apiUrl });
    window.location.href = `${apiUrl}/api/auth/github/login`;
  };

  // Kullanıcı bilgileri yükleniyorsa loading göster
  if (isAuthenticated && !user?.username) {
    console.log('Login - Loading user data');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  // Kullanıcı zaten giriş yapmışsa ve bilgileri varsa loading gösterme
  if (isAuthenticated && user?.username) {
    console.log('Login - User already logged in', {
      username: user.username,
    });
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md space-y-8 shadow-xl">
        <div className="text-center">
          <div className="flex justify-center">
            <svg
              className="h-20 w-20 text-white mb-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">AI Agent</h1>
          <h2 className="text-xl text-gray-200 mb-6">
            Yapay zeka asistanınız sizi bekliyor
          </h2>
          <button
            onClick={handleGitHubLogin}
            className="w-full bg-[#24292F] text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-[#1a1f24] transform hover:scale-105 transition duration-300 shadow-xl flex items-center justify-center space-x-2"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub ile Giriş Yap</span>
          </button>
        </div>
      </div>
    </div>
  );
}
