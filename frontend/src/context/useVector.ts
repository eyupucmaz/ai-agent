import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { useAuth } from './AuthContext';

interface RepoStatus {
  repo: string;
  status: 'indexing' | 'completed' | 'error';
  progress?: {
    current: number;
    total: number;
    failed: number;
    lastUpdated: Date;
  };
  error?: string;
}

interface IndexedFilesType {
  indexedRepos: RepoStatus[];
  loading: boolean;
  error: string | null;
  refreshIndexedFiles: () => Promise<void>;
}

export const useIndexedFiles = (): IndexedFilesType => {
  const { token } = useAuth();
  const [indexedRepos, setIndexedRepos] = useState<RepoStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshIndexedFiles = async () => {
    if (!token) {
      setError('Oturum açmanız gerekiyor');
      return;
    }
    const api = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    try {
      console.log('İndekslenen repolar yükleniyor...');
      setLoading(true);
      setError(null);

      const response = await api.get('/api/vector/status', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('API yanıtı:', response.data);
      console.log('API yanıt tipi:', typeof response.data);
      console.log('API yanıt headers:', response.headers);

      if (response.headers['content-type']?.includes('text/html')) {
        throw new Error(
          'API yanıtı HTML formatında geldi, proxy ayarlarını kontrol edin'
        );
      }

      const repos = Array.isArray(response.data) ? response.data : [];
      console.log('İşlenmiş repo listesi:', repos);
      setIndexedRepos(repos);
    } catch (err) {
      const error = err as AxiosError;
      console.error('Vector status error detayı:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        headers: error.response?.headers,
      });
      setError(
        error.message || 'İndekslenen repolar alınırken bir hata oluştu'
      );
      setIndexedRepos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useIndexedFiles hook başlatıldı');
    if (token) {
      refreshIndexedFiles();
    }
  }, [token]);

  return { indexedRepos, loading, error, refreshIndexedFiles };
};
