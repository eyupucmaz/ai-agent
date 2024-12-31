import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { useAuth } from './AuthContext';
import { VectorContext } from './VectorContext';
import { SearchResult, VectorData } from './vectorTypes';

interface IndexStatus {
  owner: string;
  name: string;
  status: string;
  lastIndexed: string;
  stats?: {
    totalFiles: number;
    recentFiles: Array<{
      path: string;
      lastModified: string;
    }>;
  };
}

export const VectorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();
  const [indexingStatus, setIndexingStatus] = useState<{
    [key: string]: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await api.get<IndexStatus[]>('/api/vector/status');
        const statusMap: { [key: string]: string } = {};
        response.data.forEach((repo: IndexStatus) => {
          statusMap[`${repo.owner}/${repo.name}`] = repo.status || 'pending';
        });
        setIndexingStatus(statusMap);
      } catch (error) {
        console.error('İndeksleme durumu kontrol hatası:', error);
      }
    };

    checkStatus();

    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, [token]);

  const indexRepo = async (owner: string, repo: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setIndexingStatus((prev) => ({
        ...prev,
        [`${owner}/${repo}`]: 'indexing',
      }));

      await api.post(`/api/vector/index/${owner}/${repo}`);

      setIndexingStatus((prev) => ({
        ...prev,
        [`${owner}/${repo}`]: 'completed',
      }));
    } catch (err: unknown) {
      const error = err as AxiosError<{ error: string }>;
      setError(
        error.response?.data?.error || 'An error occurred during indexing'
      );
      setIndexingStatus((prev) => ({
        ...prev,
        [`${owner}/${repo}`]: 'failed',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const searchVectors = async (
    repoId: string,
    query: string
  ): Promise<SearchResult[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post<SearchResult[]>('/api/vector/search', {
        repoId,
        query,
      });
      return response.data;
    } catch (err: unknown) {
      const error = err as AxiosError<{ error: string }>;
      setError(
        error.response?.data?.error || 'An error occurred during search'
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getRepoVectors = async (
    owner: string,
    repo: string
  ): Promise<VectorData[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get<VectorData[]>(
        `/api/vector/${owner}/${repo}`
      );
      return response.data;
    } catch (err: unknown) {
      const error = err as AxiosError<{ error: string }>;
      setError(
        error.response?.data?.error ||
          'An error occurred while fetching vectors'
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRepoVectors = async (owner: string, repo: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await api.delete(`/api/vector/${owner}/${repo}`);
      setIndexingStatus((prev) => {
        const newStatus = { ...prev };
        delete newStatus[`${owner}/${repo}`];
        return newStatus;
      });
    } catch (err: unknown) {
      const error = err as AxiosError<{ error: string }>;
      setError(
        error.response?.data?.error ||
          'An error occurred while deleting vectors'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VectorContext.Provider
      value={{
        indexRepo,
        searchVectors,
        getRepoVectors,
        deleteRepoVectors,
        indexingStatus,
        isLoading,
        error,
      }}
    >
      {children}
    </VectorContext.Provider>
  );
};
