import React, { useEffect, useState } from 'react';
import { useVector } from '../hooks/useVector';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Repository {
  id: number;
  name: string;
  owner: {
    login: string;
  };
  description: string;
  html_url: string;
}

interface RepoListProps {
  onSelectRepo: (repoId: string) => void;
}

const RepoList: React.FC<RepoListProps> = ({ onSelectRepo }) => {
  const { token } = useAuth();
  const { indexRepo, indexingStatus, isLoading, error } = useVector();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await axios.get<Repository[]>('/api/github/repos', {
          baseURL: import.meta.env.VITE_API_URL,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setRepos(response.data);
      } catch (error) {
        console.error('Repolar yüklenirken hata:', error);
      } finally {
        setLoadingRepos(false);
      }
    };

    fetchRepos();
  }, [token]);

  const handleIndex = async (owner: string, repo: string) => {
    try {
      await indexRepo(owner, repo);
      // İndeksleme başarılı olduğunda repo'yu seç
      onSelectRepo(`${owner}/${repo}`);
    } catch (error) {
      console.error('İndeksleme hatası:', error);
    }
  };

  if (loadingRepos) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">GitHub Repolarınız</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repos.map((repo) => (
          <div
            key={repo.id}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">{repo.name}</h3>
            <p className="text-gray-600 mb-2">{repo.description}</p>
            <p className="text-sm text-gray-500 mb-4">
              Sahibi: {repo.owner.login}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  GitHub'da Görüntüle
                </a>
                {indexingStatus[`${repo.owner.login}/${repo.name}`] ===
                  'completed' && (
                  <button
                    onClick={() =>
                      onSelectRepo(`${repo.owner.login}/${repo.name}`)
                    }
                    className="text-green-500 hover:text-green-700"
                  >
                    Ara
                  </button>
                )}
              </div>

              {indexingStatus[`${repo.owner.login}/${repo.name}`] ? (
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    indexingStatus[`${repo.owner.login}/${repo.name}`] ===
                    'completed'
                      ? 'bg-green-100 text-green-800'
                      : indexingStatus[`${repo.owner.login}/${repo.name}`] ===
                        'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {indexingStatus[`${repo.owner.login}/${repo.name}`] ===
                  'completed'
                    ? 'İndekslenmiş'
                    : indexingStatus[`${repo.owner.login}/${repo.name}`] ===
                      'failed'
                    ? 'Hata'
                    : 'İndeksleniyor...'}
                </span>
              ) : (
                <button
                  onClick={() => handleIndex(repo.owner.login, repo.name)}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg text-white ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isLoading ? 'İndeksleniyor...' : 'İndeksle'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RepoList;
