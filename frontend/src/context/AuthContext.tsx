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
    console.log('AuthContext - Initial token:', savedToken ? 'exists' : 'null');
    return savedToken;
  });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('AuthContext - State:', {
    hasToken: !!token,
    user,
    isLoading,
  });

  const setToken = (newToken: string | null) => {
    console.log(
      'AuthContext - setToken called:',
      newToken ? 'new token' : 'null'
    );
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
        console.log('AuthContext - No token, clearing user data');
        setUser(null);
        setIsLoading(false);
        return;
      }

      console.log('AuthContext - Fetching user data');
      setIsLoading(true);

      try {
        const response = await axios.get('/api/auth/me', {
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('AuthContext - User data received:', response.data);
        setUser(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('AuthContext - Error fetching user:', error);
        // Token geçersizse veya hata varsa temizle
        setToken(null);
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [token]); // setToken'ı dependency'den çıkardık

  const login = async (code: string) => {
    try {
      console.log('AuthContext - Login started');
      const response = await axios.get(
        `/api/auth/github/callback?code=${code}`,
        {
          baseURL: import.meta.env.VITE_API_URL,
        }
      );
      const { token: newToken } = response.data;
      console.log('AuthContext - Login successful, setting token');
      setToken(newToken);
    } catch (error) {
      console.error('AuthContext - Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('AuthContext - Logout');
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
