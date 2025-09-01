'use client';

import { Dictionary } from '@/types';
import { createContext, ReactNode, useContext } from 'react';

const DictionaryContext = createContext<Dictionary | null>(null);

export const DictionaryProvider = ({ children, dictionary }: { children: ReactNode, dictionary: Dictionary }) => {
  return (
    <DictionaryContext.Provider value={dictionary}>
      {children}
    </DictionaryContext.Provider>
  );
};

export const useDictionary = (): Dictionary => {
  const context = useContext(DictionaryContext);
  if (!context) {
    throw new Error('useDictionary must be used within a DictionaryProvider');
  }
  return context;
};