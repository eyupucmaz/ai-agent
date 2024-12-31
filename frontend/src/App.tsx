import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Repos from './pages/Repos';
import Chat from './pages/Chat';
import Navbar from './components/Navbar';
import { VectorProvider } from './context/VectorContext';

// Korumalı route bileşeni
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" />;
};

const TokenHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      console.log("Token bulundu, AuthContext'e aktarılıyor");
      setToken(token);
      navigate('/', { replace: true });
    }
  }, [location, setToken, navigate]);

  return null;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <VectorProvider>
        <Router>
          <TokenHandler />
          <div className="min-h-screen bg-gray-100">
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/:username"
                element={
                  <ProtectedRoute>
                    <Repos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/repos"
                element={
                  <ProtectedRoute>
                    <Repos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/:username/chat/:owner/:repo"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </VectorProvider>
    </AuthProvider>
  );
};

export default App;
