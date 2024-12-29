import React, { useState } from 'react';
import { useVector } from '../hooks/useVector';

interface SearchProps {
  repoId: string;
}

const VectorSearch: React.FC<SearchProps> = ({ repoId }) => {
  const { searchVectors, isLoading, error } = useVector();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<
    Array<{
      filePath: string;
      content: string;
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
    if (!query.trim()) return;

    try {
      const searchResults = await searchVectors(repoId, query);
      setResults(searchResults);
    } catch (error) {
      console.error('Arama hatası:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kod tabanında ara..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-2 rounded-lg text-white ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isLoading ? 'Aranıyor...' : 'Ara'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {results.map((result, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{result.filePath}</h3>
              <span className="text-sm text-gray-500">
                Benzerlik: {(result.similarity * 100).toFixed(2)}%
              </span>
            </div>

            <div className="bg-gray-50 rounded p-4 mb-2">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {result.content}
              </pre>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Dil: {result.metadata.language}</span>
              <span>
                Son Güncelleme:{' '}
                {new Date(result.metadata.lastModified).toLocaleDateString(
                  'tr-TR'
                )}
              </span>
              <span>Boyut: {(result.metadata.size / 1024).toFixed(2)} KB</span>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && query && !isLoading && (
        <div className="text-center text-gray-500 mt-8">Sonuç bulunamadı</div>
      )}
    </div>
  );
};

export default VectorSearch;
