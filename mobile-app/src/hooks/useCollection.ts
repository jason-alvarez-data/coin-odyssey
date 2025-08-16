// src/hooks/useCollection.ts
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Coin } from '../types/coin';
import { useAuth } from './useAuth';

export function useCollection() {
  const { user } = useAuth();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoins = async () => {
    if (!user) {
      setCoins([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get user's collections
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', user.id);

      if (collectionsError) throw collectionsError;

      if (!collections?.length) {
        setCoins([]);
        return;
      }

      // Get coins from collections
      const { data: coinsData, error: coinsError } = await supabase
        .from('coins')
        .select('*')
        .in('collection_id', collections.map(c => c.id))
        .order('purchase_date', { ascending: false });

      if (coinsError) throw coinsError;

      setCoins(coinsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch coins');
      console.error('Error fetching coins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
  }, [user]);

  const addCoin = async (coinData: Omit<Coin, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get or create default collection
      let { data: collections } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      let collectionId: string;

      if (!collections?.length) {
        // Create default collection
        const { data: newCollection, error: createError } = await supabase
          .from('collections')
          .insert({
            name: 'My Collection',
            user_id: user.id,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        collectionId = newCollection.id;
      } else {
        collectionId = collections[0].id;
      }

      const { data, error } = await supabase
        .from('coins')
        .insert({
          ...coinData,
          collection_id: collectionId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setCoins(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding coin:', err);
      throw err;
    }
  };

  const updateCoin = async (coinId: string, updates: Partial<Coin>) => {
    try {
      const { data, error } = await supabase
        .from('coins')
        .update(updates)
        .eq('id', coinId)
        .select()
        .single();

      if (error) throw error;

      setCoins(prev => prev.map(coin => coin.id === coinId ? data : coin));
      return data;
    } catch (err) {
      console.error('Error updating coin:', err);
      throw err;
    }
  };

  const deleteCoin = async (coinId: string) => {
    try {
      const { error } = await supabase
        .from('coins')
        .delete()
        .eq('id', coinId);

      if (error) throw error;

      setCoins(prev => prev.filter(coin => coin.id !== coinId));
    } catch (err) {
      console.error('Error deleting coin:', err);
      throw err;
    }
  };

  return {
    coins,
    loading,
    error,
    refetch: fetchCoins,
    addCoin,
    updateCoin,
    deleteCoin,
  };
}