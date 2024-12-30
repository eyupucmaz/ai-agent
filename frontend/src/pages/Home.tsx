import React from 'react';
import { useAuth } from '../context/AuthContext';
import { VectorProvider } from '../context/VectorProvider';
import VectorSearch from '../components/VectorSearch';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <VectorProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Hoş Geldin, {user?.username}!
              </h1>
              <p className="mt-2 text-gray-600">
                GitHub repolarını AI ile analiz etmeye başla.
              </p>
            </div>
            <VectorSearch />
          </div>
        </div>
      </div>
    </VectorProvider>
  );
};

export default Home;
