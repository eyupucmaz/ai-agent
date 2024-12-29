import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

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
}

export default function Repos() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // URL'deki username ile giriş yapan kullanıcı eşleşmiyorsa ana sayfaya yönlendir
    if (user?.username && username !== user.username) {
      navigate(`/${user.username}`);
      return;
    }

    const fetchRepos = async () => {
      try {
        const response = await axios.get('/api/github/repos', {
          baseURL: import.meta.env.VITE_API_URL,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setRepos(response.data);
      } catch (error) {
        console.error('Repolar yüklenirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [token, isAuthenticated, navigate, username, user]);

  const handleIndex = async (repo: Repository) => {
    try {
      // Reponun indeksleme durumunu güncelle
      setRepos((prevRepos) =>
        prevRepos.map((r) =>
          r.id === repo.id ? { ...r, isIndexing: true } : r
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

      // İndeksleme tamamlandığında durumu güncelle
      setRepos((prevRepos) =>
        prevRepos.map((r) =>
          r.id === repo.id ? { ...r, isIndexing: false } : r
        )
      );
    } catch (error) {
      console.error('Repo indekslenirken hata oluştu:', error);
      // Hata durumunda indeksleme durumunu sıfırla
      setRepos((prevRepos) =>
        prevRepos.map((r) =>
          r.id === repo.id ? { ...r, isIndexing: false } : r
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          GitHub Repolarınız
        </h1>
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
                {repo.description || 'Açıklama bulunmuyor'}
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
              <button
                onClick={() => handleIndex(repo)}
                disabled={repo.isIndexing}
                className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors duration-200 ${
                  repo.isIndexing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {repo.isIndexing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>İndeksleniyor...</span>
                  </div>
                ) : (
                  'Repoyu İndeksle'
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
