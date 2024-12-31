import React, { createContext, useContext } from 'react';
import { useVectorOperations } from './useVectorOperations';
import { VectorContextType } from './vectorTypes';

export const VectorContext = createContext<VectorContextType | undefined>(
  undefined
);

export const useVector = () => {
  const context = useContext(VectorContext);
  if (context === undefined) {
    throw new Error('useVector must be used within a VectorProvider');
  }
  return context;
};

export const VectorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = useVectorOperations();

  return (
    <VectorContext.Provider value={value}>{children}</VectorContext.Provider>
  );
};
