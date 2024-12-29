import { createContext } from 'react';
import { VectorContextType } from './vectorTypes';

export const VectorContext = createContext<VectorContextType | undefined>(
  undefined
);
