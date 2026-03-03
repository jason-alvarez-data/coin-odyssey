// Simple coin service for web app
import { supabase } from '@/lib/supabase';
import { Coin } from '@coin-collecting/shared';

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

      return coins?.map(this.mapSupabaseToCoin) || [];
    } catch (error) {
      console.error('Error in getUserCoins:', error);
      return [];
    }
  }

  // Map Supabase snake_case columns to camelCase Coin interface
  static mapSupabaseToCoin(data: any): Coin {
    return {
      id: data.id,
      name: data.name || '',
      title: data.title || '',
      year: data.year,
      mintMark: data.mint_mark,
      grade: data.grade,
      faceValue: data.face_value,
      purchasePrice: data.purchase_price,
      currentMarketValue: data.current_market_value,
      lastValueUpdate: data.last_value_update,
      pcgsId: data.pcgs_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userId: data.user_id,
      collectionId: data.collection_id,
      denomination: data.denomination,
      purchaseDate: data.purchase_date ? String(data.purchase_date).split('T')[0] : null,
      personalValue: data.personal_value,
      lastAppraisalValue: data.last_appraisal_value,
      lastAppraisalDate: data.last_appraisal_date,
      mintage: data.mintage,
      rarityScale: data.rarity_scale,
      historicalNotes: data.historical_notes,
      varietyNotes: data.variety_notes,
      notes: data.notes,
      images: data.images,
      obverseImage: data.obverse_image,
      reverseImage: data.reverse_image,
      country: data.country,
      series: data.series,
    };
  }
}
