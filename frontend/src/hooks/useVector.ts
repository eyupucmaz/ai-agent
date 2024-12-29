import { useContext } from 'react';
import { VectorContext } from '../context/VectorContext';

export const useVector = () => {
  const context = useContext(VectorContext);
  if (context === undefined) {
    throw new Error('useVector must be used within a VectorProvider');
  }
  return context;
};
