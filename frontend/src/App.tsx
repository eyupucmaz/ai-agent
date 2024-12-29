import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VectorProvider } from './context/VectorProvider';
import Navbar from './components/Navbar';
import Repos from './pages/Repos';
import Login from './pages/Login';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated && user?.username) {
    return <VectorProvider>{children}</VectorProvider>;
  }

  return <Navigate to="/login" replace />;
};

// Ana sayfa yönlendirme bileşeni
const HomeRedirect: React.FC = () => {
  const { user } = useAuth();

  return user?.username ? (
    <Navigate to={`/${user.username}`} replace />
  ) : (
    <div>Yükleniyor...</div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <HomeRedirect />
                </PrivateRoute>
              }
            />
            <Route
              path="/:username"
              element={
                <PrivateRoute>
                  <Repos />
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
