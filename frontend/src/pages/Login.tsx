import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.username) {
      navigate(`/${user.username}`, { replace: true });
    }
  }, [navigate, isAuthenticated, user]);

  const handleGitHubLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${apiUrl}/api/auth/github/login`;
  };

  if (isAuthenticated && !user?.username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-space_cadet-500 via-electric_purple-500 to-french_mauve-500">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-fairy_tale-300"></div>
      </div>
    );
  }

  if (isAuthenticated && user?.username) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-space_cadet-500 via-electric_purple-500 to-french_mauve-500">
      <div className="bg-space_cadet-400/30 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md space-y-8 shadow-2xl border border-fairy_tale-200/20">
        <div className="text-center">
          <div className="flex justify-center">
            <svg
              className="h-20 w-20 text-fairy_tale-300 mb-4"
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
          <h1 className="text-4xl font-bold text-fairy_tale-200 mb-2">
            AI Agent
          </h1>
          <h2 className="text-xl text-fairy_tale-300 mb-8">
            Your Enterprise AI Assistant
          </h2>
          <button
            onClick={handleGitHubLogin}
            className="w-full bg-iris-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-iris-600 transform hover:scale-102 transition-all duration-300 shadow-xl flex items-center justify-center space-x-3 border border-iris-400"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>Continue with GitHub</span>
          </button>
        </div>
      </div>
    </div>
  );
}
