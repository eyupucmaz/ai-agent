import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { useAuth } from './AuthContext';
import { VectorContext } from './VectorContext';
import { SearchResult, VectorData } from './vectorTypes';

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
        error.response?.data?.error || 'İndeksleme sırasında bir hata oluştu'
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
        error.response?.data?.error || 'Arama sırasında bir hata oluştu'
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
        error.response?.data?.error || 'Vektörler alınırken bir hata oluştu'
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
        error.response?.data?.error || 'Vektörler silinirken bir hata oluştu'
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
