'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CollectionProvider } from '@/contexts/CollectionContext';

interface RootProviderProps {
  children: ReactNode;
}

export default function RootProvider({ children }: RootProviderProps) {
  return (
    <ThemeProvider>
      <CollectionProvider>
        {children}
      </CollectionProvider>
    </ThemeProvider>
  );
} 