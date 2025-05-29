'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface Collection {
  id: string;
  name: string;
  description: string | null;
}

interface CollectionContextType {
  collection: Collection | null;
  loading: boolean;
  error: string | null;
  fetchCollection: () => Promise<void>;
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error: fetchError } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      setCollection(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching collection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, []);

  return (
    <CollectionContext.Provider
      value={{
        collection,
        loading,
        error,
        fetchCollection,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection() {
  const context = useContext(CollectionContext);
  if (context === undefined) {
    throw new Error('useCollection must be used within a CollectionProvider');
  }
  return context;
} 