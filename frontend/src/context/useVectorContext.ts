import { useContext } from 'react';
import { VectorContext } from './VectorContext';

export const useVectorContext = () => {
  const context = useContext(VectorContext);
  if (context === undefined) {
    throw new Error('useVectorContext must be used within a VectorProvider');
  }
  return context;
};
