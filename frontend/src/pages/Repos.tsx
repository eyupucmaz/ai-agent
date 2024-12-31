import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import IndexedFilesModal from '../components/IndexedFilesModal';

interface Repository {
  id: number;
  name: string;
  owner: {
    login: string;
  };
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
  isIndexing?: boolean;
  indexStatus?: 'pending' | 'indexing' | 'completed' | 'error';
}

interface IndexedFile {
  path: string;
  lastModified: string;
  description: string;
}

interface IndexStatus {
  owner: string;
  name: string;
  status: 'pending' | 'indexing' | 'completed' | 'error';
  lastIndexed: string;
  stats?: {
    totalFiles: number;
    recentFiles: IndexedFile[];
  };
}

interface VectorFile {
  filePath: string;
  metadata: {
    lastModified: string;
  };
  description: string;
}

export default function Repos() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<{
    name: string;
    files: IndexedFile[];
  }>({ name: '', files: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();

  console.log('Repos - Render State:', {
    isAuthenticated,
    user,
    username,
    reposCount: repos.length,
  });

  const fetchRepos = useCallback(async () => {
    try {
      console.log('Repos - Loading repos');
      const response = await axios.get('/api/github/repos', {
        baseURL: import.meta.env.VITE_API_URL,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Repos - Repos loaded:', {
        count: response.data.length,
      });

      const indexStatusResponse = await axios.get('/api/vector/status', {
        baseURL: import.meta.env.VITE_API_URL,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const reposWithStatus = response.data.map((repo: Repository) => {
        const indexStatus = indexStatusResponse.data.find(
          (status: IndexStatus) =>
            status.owner === repo.owner.login && status.name === repo.name
        );
        return {
          ...repo,
          indexStatus: indexStatus?.status || 'pending',
          isIndexing: indexStatus?.status === 'indexing',
        };
      });

      setRepos(reposWithStatus);
      setLoading(false);
    } catch (error) {
      console.error('Repos - Loading error:', error);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('Repos - User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    if (user?.username && username !== user.username) {
      console.log('Repos - URL username mismatch:', {
        urlUsername: username,
        userUsername: user.username,
      });
      navigate(`/${user.username}`);
      return;
    }

    fetchRepos();

    const interval = setInterval(async () => {
      try {
        const indexStatusResponse = await axios.get('/api/vector/status', {
          baseURL: import.meta.env.VITE_API_URL,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRepos((prevRepos) =>
          prevRepos.map((repo) => {
            const indexStatus = indexStatusResponse.data.find(
              (status: IndexStatus) =>
                status.owner === repo.owner.login && status.name === repo.name
            );
            return {
              ...repo,
              indexStatus: indexStatus?.status || 'pending',
              isIndexing: indexStatus?.status === 'indexing',
            };
          })
        );
      } catch (error) {
        console.error('İndeksleme durumu kontrol hatası:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token, isAuthenticated, navigate, username, user, fetchRepos]);

  const handleIndex = async (repo: Repository) => {
    try {
      console.log('Repos - Starting indexing:', { repo: repo.name });
      // Reponun indeksleme durumunu güncelle
      setRepos((prevRepos) =>
        prevRepos.map((r) =>
          r.id === repo.id
            ? { ...r, isIndexing: true, indexStatus: 'indexing' }
            : r
        )
      );

      await axios.post(
        `/api/vector/index/${repo.owner.login}/${repo.name}`,
        {},
        {
          baseURL: import.meta.env.VITE_API_URL,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Repos - Indexing completed:', { repo: repo.name });
      // İndeksleme tamamlandığında durumu güncelle
      setRepos((prevRepos) =>
        prevRepos.map((r) =>
          r.id === repo.id
            ? { ...r, isIndexing: false, indexStatus: 'completed' }
            : r
        )
      );
    } catch (error) {
      console.error('Repos - Indexing error:', { repo: repo.name, error });
      // Hata durumunda indeksleme durumunu sıfırla
      setRepos((prevRepos) =>
        prevRepos.map((r) =>
          r.id === repo.id
            ? { ...r, isIndexing: false, indexStatus: 'error' }
            : r
        )
      );
    }
  };

  const handleReset = async () => {
    try {
      console.log('Resetting indexing data');
      await axios.post(
        '/api/vector/reset',
        {},
        {
          baseURL: import.meta.env.VITE_API_URL,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Indexing data has been reset');

      fetchRepos();
    } catch (error) {
      console.error('Reset error:', error);
    }
  };

  const handleViewFiles = async (repo: Repository) => {
    try {
      const response = await axios.get<VectorFile[]>(
        `/api/vector/${repo.owner.login}/${repo.name}`,
        {
          baseURL: import.meta.env.VITE_API_URL,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedRepo({
        name: repo.name,
        files: response.data.map((file) => ({
          path: file.filePath,
          lastModified: file.metadata.lastModified,
          description: file.description || 'No description available',
        })),
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Could not get file list:', error);
    }
  };

  if (loading) {
    console.log('Repos - Loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Your GitHub Repositories
          </h1>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Reset Indexing Data
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600"
                >
                  {repo.name}
                </a>
              </h2>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {repo.description || 'No description available'}
              </p>
              <div className="flex items-center justify-between mb-4">
                {repo.language && (
                  <span className="text-sm text-gray-500">{repo.language}</span>
                )}
                <div className="flex items-center space-x-1">
                  <svg
                    className="w-4 h-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm text-gray-500">
                    {repo.stargazers_count}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {repo.indexStatus === 'completed' ? (
                  <button
                    onClick={() => handleViewFiles(repo)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    View Indexed Files
                  </button>
                ) : (
                  <button
                    onClick={() => handleIndex(repo)}
                    disabled={repo.isIndexing}
                    className={`w-full px-4 py-2 text-white rounded-lg transition-colors duration-200 ${
                      repo.isIndexing
                        ? 'bg-yellow-500'
                        : repo.indexStatus === 'error'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {repo.isIndexing
                      ? 'Indexing...'
                      : repo.indexStatus === 'error'
                      ? 'Reindex'
                      : 'Index'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <IndexedFilesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        repoName={selectedRepo.name}
        files={selectedRepo.files}
      />
    </div>
  );
}
