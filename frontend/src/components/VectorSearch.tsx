import React, { useState } from 'react';
import { useVector } from '../context/VectorContext';

interface VectorSearchProps {
  selectedRepo: string;
}

const VectorSearch: React.FC<VectorSearchProps> = ({ selectedRepo }) => {
  const { searchVectors, isLoading, error } = useVector();
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<
    Array<{
      filePath: string;
      content: string;
      description: string;
      similarity: number;
      metadata: {
        language: string;
        lastModified: Date;
        size: number;
      };
    }>
  >([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !selectedRepo) return;

    try {
      const searchResults = await searchVectors(selectedRepo, query);
      setResults(searchResults);
      setHasSearched(true);
    } catch (error) {
      console.error('Arama hatası:', error);
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="bg-french_mauve-100/10 border border-french_mauve-500 text-french_mauve-500 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      );
    }

    if (results.length === 0 && hasSearched) {
      return (
        <div className="bg-iris-100/10 border border-iris-500 text-fairy_tale-300 px-6 py-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg
              className="w-6 h-6 text-iris-500 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-fairy_tale-200 mb-1">
                Repository Not Indexed
              </h3>
              <p className="text-fairy_tale-300">
                This repository hasn't been indexed yet. Please use the "Index"
                button on the repositories page to index this repository first.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (results.length > 0) {
      return (
        <div className="space-y-6">
          {results.map((result, index) => (
            <div
              key={index}
              className="border border-space_cadet-300 bg-space_cadet-100 rounded-lg p-4 hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-fairy_tale-200">
                  {result.filePath}
                </h3>
                <span className="text-sm text-iris-400">
                  Similarity: {(result.similarity * 100).toFixed(2)}%
                </span>
              </div>

              <div className="bg-iris-100/10 border border-iris-500 text-fairy_tale-300 px-4 py-3 rounded-lg mb-4">
                {result.description}
              </div>

              <div className="bg-space_cadet-200 rounded-lg p-4 mb-2">
                <pre className="whitespace-pre-wrap font-mono text-sm text-fairy_tale-300">
                  {result.content}
                </pre>
              </div>

              <div className="flex items-center gap-4 text-sm text-fairy_tale-400">
                <span>Language: {result.metadata.language}</span>
                <span>
                  Last Update:{' '}
                  {new Date(result.metadata.lastModified).toLocaleDateString(
                    'en-US'
                  )}
                </span>
                <span>Size: {(result.metadata.size / 1024).toFixed(2)} KB</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in codebase..."
            className="flex-1 px-4 py-2 bg-space_cadet-100 border border-space_cadet-300 text-fairy_tale-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-iris-400 placeholder-fairy_tale-500"
          />
          <button
            type="submit"
            disabled={isLoading || !selectedRepo}
            className={`px-6 py-2 rounded-lg text-white shadow-md transition-all ${
              isLoading || !selectedRepo
                ? 'bg-space_cadet-400 cursor-not-allowed'
                : 'bg-electric_purple-500 hover:bg-electric_purple-600 hover:shadow-lg'
            }`}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {renderContent()}
    </div>
  );
};

export default VectorSearch;
