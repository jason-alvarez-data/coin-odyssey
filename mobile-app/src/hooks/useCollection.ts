// src/hooks/useCollection.ts
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { CoinService } from '../services/coinService';
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

      // Map snake_case DB data to camelCase Coin interface
      setCoins((coinsData || []).map(CoinService.mapSupabaseToCoin));
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

      // Map camelCase to snake_case for DB insert
      const { data, error } = await supabase
        .from('coins')
        .insert({
          collection_id: collectionId,
          name: coinData.name,
          title: coinData.title || null,
          denomination: coinData.denomination,
          year: coinData.year,
          mint_mark: coinData.mintMark || null,
          grade: coinData.grade || null,
          face_value: coinData.faceValue || null,
          purchase_price: coinData.purchasePrice || null,
          current_market_value: coinData.currentMarketValue || null,
          purchase_date: coinData.purchaseDate || null,
          notes: coinData.notes || null,
          country: coinData.country || null,
          series: coinData.series || null,
          images: coinData.images || null,
        })
        .select('*')
        .single();

      if (error) throw error;

      const mapped = CoinService.mapSupabaseToCoin(data);
      setCoins(prev => [mapped, ...prev]);
      return mapped;
    } catch (err) {
      console.error('Error adding coin:', err);
      throw err;
    }
  };

  const updateCoin = async (coinId: string, updates: Partial<Coin>) => {
    try {
      // Map camelCase updates to snake_case for DB
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.denomination !== undefined) dbUpdates.denomination = updates.denomination;
      if (updates.year !== undefined) dbUpdates.year = updates.year;
      if (updates.mintMark !== undefined) dbUpdates.mint_mark = updates.mintMark;
      if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
      if (updates.faceValue !== undefined) dbUpdates.face_value = updates.faceValue;
      if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;
      if (updates.currentMarketValue !== undefined) dbUpdates.current_market_value = updates.currentMarketValue;
      if (updates.purchaseDate !== undefined) dbUpdates.purchase_date = updates.purchaseDate;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.country !== undefined) dbUpdates.country = updates.country;
      if (updates.series !== undefined) dbUpdates.series = updates.series;
      if (updates.images !== undefined) dbUpdates.images = updates.images;

      const { data, error } = await supabase
        .from('coins')
        .update(dbUpdates)
        .eq('id', coinId)
        .select('*')
        .single();

      if (error) throw error;

      const mapped = CoinService.mapSupabaseToCoin(data);
      setCoins(prev => prev.map(coin => coin.id === coinId ? mapped : coin));
      return mapped;
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
