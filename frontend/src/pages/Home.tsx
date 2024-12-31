import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { VectorProvider } from '../context/VectorProvider';
import VectorSearch from '../components/VectorSearch';

interface Repository {
  id: number;
  name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  owner: {
    login: string;
  };
}

const Home: React.FC = () => {
  const { user, token } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/github/repos`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setRepositories(data);
      } catch (error) {
        console.error('Error fetching repositories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepositories();
  }, [token]);

  return (
    <VectorProvider>
      <div className="min-h-screen bg-space_cadet-100">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-12 bg-space_cadet-200 rounded-xl p-8 shadow-lg border border-space_cadet-300">
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-iris-500 flex items-center justify-center text-3xl font-bold text-white">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-fairy_tale-200 mb-2">
                    {user?.username}
                  </h1>
                  <div className="flex items-center space-x-4">
                    <span className="px-3 py-1 rounded-full text-sm bg-electric_purple-500 text-white">
                      GitHub User
                    </span>
                    <span className="text-fairy_tale-400">
                      Member since {new Date().getFullYear()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 border-t border-space_cadet-400 pt-6">
                <p className="text-fairy_tale-300 text-lg">
                  Analyze your GitHub repositories with advanced AI
                  capabilities. Use semantic search to find code snippets, get
                  AI-powered suggestions, and more.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-space_cadet-200 rounded-xl p-6 border border-space_cadet-300 shadow-md">
                <div className="text-iris-400 text-sm font-semibold mb-2">
                  Total Repositories
                </div>
                <div className="text-fairy_tale-200 text-3xl font-bold">
                  {repositories.length}
                </div>
              </div>
              <div className="bg-space_cadet-200 rounded-xl p-6 border border-space_cadet-300 shadow-md">
                <div className="text-french_mauve-400 text-sm font-semibold mb-2">
                  Indexed Files
                </div>
                <div className="text-fairy_tale-200 text-3xl font-bold">
                  234
                </div>
              </div>
              <div className="bg-space_cadet-200 rounded-xl p-6 border border-space_cadet-300 shadow-md">
                <div className="text-electric_purple-400 text-sm font-semibold mb-2">
                  AI Interactions
                </div>
                <div className="text-fairy_tale-200 text-3xl font-bold">56</div>
              </div>
            </div>

            <div className="bg-space_cadet-200 rounded-xl p-6 shadow-lg border border-space_cadet-300">
              <h2 className="text-2xl font-bold text-fairy_tale-200 mb-6">
                Semantic Code Search
              </h2>

              <div className="mb-6">
                <label
                  htmlFor="repo-select"
                  className="block text-sm font-medium text-fairy_tale-300 mb-2"
                >
                  Select Repository
                </label>
                <div className="relative">
                  <select
                    id="repo-select"
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="block w-full bg-space_cadet-100 border border-space_cadet-300 text-fairy_tale-200 rounded-lg py-2.5 px-4 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-iris-400"
                    disabled={isLoading}
                  >
                    <option value="">Select a repository</option>
                    {repositories.map((repo) => (
                      <option key={repo.id} value={repo.name}>
                        {repo.owner.login}/{repo.name}{' '}
                        {repo.language && `(${repo.language})`}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-fairy_tale-400">
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                {isLoading && (
                  <div className="mt-2 text-fairy_tale-400 text-sm">
                    Loading repositories...
                  </div>
                )}
              </div>

              <VectorSearch selectedRepo={selectedRepo} />
            </div>
          </div>
        </div>
      </div>
    </VectorProvider>
  );
};

export default Home;
