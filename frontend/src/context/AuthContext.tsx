import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface IndexedRepo {
  owner: string;
  name: string;
  status: 'indexing' | 'completed' | 'error';
  lastIndexed: Date;
  progress?: {
    current: number;
    total: number;
    failed: number;
    lastUpdated: Date;
  };
}

interface User {
  id: string;
  githubId: string;
  username: string;
  email: string;
  avatarUrl: string;
  indexedRepos: IndexedRepo[];
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
  const [token, _setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem('token');
    return savedToken;
  });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      _setToken(newToken);
    } else {
      localStorage.removeItem('token');
      _setToken(null);
      setUser(null);
    }
  };

  const isAuthenticated = Boolean(token);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const response = await axios.get('/api/auth/me', {
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setIsLoading(false);
      } catch {
        setToken(null);
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (code: string) => {
    const response = await axios.get(`/api/auth/github/callback?code=${code}`, {
      baseURL: import.meta.env.VITE_API_URL,
    });
    const { token: newToken } = response.data;
    setToken(newToken);
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
