// Simple coin service for web app
import { supabase } from '@/lib/supabase';
import { Coin } from '@/types/coin';

export class CoinService {
  static async getUserCoins(userId?: string): Promise<Coin[]> {
    try {
      // If no userId provided, get current user
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        userId = user.id;
      }

      // First get all collections for the user
      const { data: collections } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', userId);

      if (!collections?.length) return [];

      // Then get all coins from those collections
      const { data: coins, error } = await supabase
        .from('coins')
        .select('*')
        .in('collection_id', collections.map(c => c.id))
        .order('purchase_date', { ascending: false });

      if (error) {
        console.error('Error fetching coins:', error);
        return [];
      }

      return coins || [];
    } catch (error) {
      console.error('Error in getUserCoins:', error);
      return [];
    }
  }
}
