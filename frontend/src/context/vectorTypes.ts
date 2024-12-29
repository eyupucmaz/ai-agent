export interface SearchResult {
  filePath: string;
  content: string;
  similarity: number;
  metadata: {
    language: string;
    lastModified: Date;
    size: number;
  };
}

export interface VectorData {
  repoId: string;
  filePath: string;
  content: string;
  vector: number[];
  metadata: {
    language: string;
    lastModified: Date;
    size: number;
  };
}

export interface VectorContextType {
  indexRepo: (owner: string, repo: string) => Promise<void>;
  searchVectors: (repoId: string, query: string) => Promise<SearchResult[]>;
  getRepoVectors: (owner: string, repo: string) => Promise<VectorData[]>;
  deleteRepoVectors: (owner: string, repo: string) => Promise<void>;
  indexingStatus: { [key: string]: string };
  isLoading: boolean;
  error: string | null;
}
