import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  username: string;
  githubUsername?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (code: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(token);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setIsLoading(true);
      axios
        .get('/api/auth/me', {
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => setUser(response.data))
        .catch(() => setToken(null))
        .finally(() => setIsLoading(false));
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setIsLoading(false);
    }
  }, [token]);

  const login = async (code: string) => {
    try {
      const response = await axios.get(
        `/api/auth/github/callback?code=${code}`,
        {
          baseURL: import.meta.env.VITE_API_URL,
        }
      );
      const { token } = response.data;
      setToken(token);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        user,
        login,
        logout,
        setToken,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
