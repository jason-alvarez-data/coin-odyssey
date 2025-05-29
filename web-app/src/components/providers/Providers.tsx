'use client';

import { ReactNode } from 'react';
import { CollectionProvider } from '@/contexts/CollectionContext';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <CollectionProvider>
      {children}
    </CollectionProvider>
  );
} 