// src/services/coinService.ts
import { supabase } from './supabase';
import { Coin } from '../types/coin';

interface CreateCoinData {
  name: string;
  title?: string;
  year: number;
  denomination: string;
  country?: string;
  mintMark?: string;
  grade?: string;
  faceValue?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  notes?: string;
  obverseImage?: string;
  reverseImage?: string;
}

export class CoinService {
  // Get or create default collection for user
  static async getOrCreateDefaultCollection(userId: string) {
    // First, check if user has a default collection
    const { data: existingCollections, error: fetchError } = await supabase
      .from('collections')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (fetchError) {
      throw new Error(`Failed to fetch collections: ${fetchError.message}`);
    }

    // If user has collections, use the first one
    if (existingCollections && existingCollections.length > 0) {
      return existingCollections[0].id;
    }

    // Create default collection if none exists
    const { data: newCollection, error: createError } = await supabase
      .from('collections')
      .insert({
        user_id: userId,
        name: 'My Coin Collection',
        description: 'My personal coin collection'
      })
      .select('id')
      .single();

    if (createError) {
      throw new Error(`Failed to create collection: ${createError.message}`);
    }

    return newCollection.id;
  }

  // Upload image to Supabase storage
  static async uploadImage(imageUri: string, coinId: string, side: 'obverse' | 'reverse'): Promise<string | null> {
    try {
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create file name
      const fileName = `${coinId}_${side}_${Date.now()}.jpg`;
      const filePath = `coins/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('coin-images')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Image upload error:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('coin-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }

  // Create a new coin
  static async createCoin(coinData: CreateCoinData): Promise<Coin> {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get or create default collection
    const collectionId = await this.getOrCreateDefaultCollection(user.id);

    // Generate temporary coin ID for image upload
    const tempCoinId = `temp_${Date.now()}`;

    // Upload images if provided
    let obverseImageUrl = null;
    let reverseImageUrl = null;

    if (coinData.obverseImage) {
      obverseImageUrl = await this.uploadImage(coinData.obverseImage, tempCoinId, 'obverse');
    }

    if (coinData.reverseImage) {
      reverseImageUrl = await this.uploadImage(coinData.reverseImage, tempCoinId, 'reverse');
    }

    // Prepare coin data for database
    const dbCoinData = {
      collection_id: collectionId,
      denomination: coinData.denomination,
      year: coinData.year,
      mint_mark: coinData.mintMark || null,
      grade: coinData.grade || null,
      purchase_price: coinData.purchasePrice || null,
      purchase_date: coinData.purchaseDate || null,
      notes: coinData.notes || null,
      country: coinData.country || null,
      // Store images in array format for compatibility
      images: [obverseImageUrl, reverseImageUrl].filter(Boolean),
    };

    // Insert coin into database
    const { data: newCoin, error: insertError } = await supabase
      .from('coins')
      .insert(dbCoinData)
      .select(`
        id,
        collection_id,
        denomination,
        year,
        mint_mark,
        grade,
        purchase_price,
        purchase_date,
        notes,
        images,
        country,
        created_at,
        updated_at
      `)
      .single();

    if (insertError) {
      throw new Error(`Failed to create coin: ${insertError.message}`);
    }

    // Transform database response to match Coin interface
    const coin: Coin = {
      id: newCoin.id,
      name: coinData.name,
      title: coinData.title || '',
      year: newCoin.year,
      mintMark: newCoin.mint_mark,
      grade: newCoin.grade,
      faceValue: coinData.faceValue || null,
      purchasePrice: newCoin.purchase_price,
      currentMarketValue: null,
      lastValueUpdate: null,
      pcgsId: null,
      createdAt: newCoin.created_at,
      updatedAt: newCoin.updated_at,
      userId: user.id,
      collectionId: newCoin.collection_id,
      denomination: newCoin.denomination,
      purchaseDate: newCoin.purchase_date,
      personalValue: null,
      lastAppraisalValue: null,
      lastAppraisalDate: null,
      mintage: null,
      rarityScale: null,
      historicalNotes: null,
      varietyNotes: null,
      notes: newCoin.notes,
      images: newCoin.images,
      obverseImage: obverseImageUrl,
      reverseImage: reverseImageUrl,
      country: newCoin.country,
    };

    return coin;
  }

  // Get user's coins
  static async getUserCoins(): Promise<Coin[]> {
    const { data: coins, error } = await supabase
      .from('coins')
      .select(`
        id,
        collection_id,
        denomination,
        year,
        mint_mark,
        grade,
        purchase_price,
        purchase_date,
        notes,
        images,
        country,
        created_at,
        updated_at,
        collections!inner(user_id)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch coins: ${error.message}`);
    }

    return coins.map(coin => ({
      id: coin.id,
      name: `${coin.year} ${coin.denomination}`,
      title: '',
      year: coin.year,
      mintMark: coin.mint_mark,
      grade: coin.grade,
      faceValue: null,
      purchasePrice: coin.purchase_price,
      currentMarketValue: null,
      lastValueUpdate: null,
      pcgsId: null,
      createdAt: coin.created_at,
      updatedAt: coin.updated_at,
      userId: coin.collections.user_id,
      collectionId: coin.collection_id,
      denomination: coin.denomination,
      purchaseDate: coin.purchase_date,
      personalValue: null,
      lastAppraisalValue: null,
      lastAppraisalDate: null,
      mintage: null,
      rarityScale: null,
      historicalNotes: null,
      varietyNotes: null,
      notes: coin.notes,
      images: coin.images,
      obverseImage: coin.images?.[0] || null,
      reverseImage: coin.images?.[1] || null,
      country: coin.country,
    }));
  }

  // Update an existing coin
  static async updateCoin(coinId: string, updates: Partial<CreateCoinData>): Promise<Coin> {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get current coin data
    const { data: currentCoin, error: fetchError } = await supabase
      .from('coins')
      .select('*')
      .eq('id', coinId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch coin: ${fetchError.message}`);
    }

    // Handle image uploads if new images provided
    let obverseImageUrl = currentCoin.images?.[0] || null;
    let reverseImageUrl = currentCoin.images?.[1] || null;

    if (updates.obverseImage) {
      const newObverseUrl = await this.uploadImage(updates.obverseImage, coinId, 'obverse');
      if (newObverseUrl) obverseImageUrl = newObverseUrl;
    }

    if (updates.reverseImage) {
      const newReverseUrl = await this.uploadImage(updates.reverseImage, coinId, 'reverse');
      if (newReverseUrl) reverseImageUrl = newReverseUrl;
    }

    // Prepare update data
    const updateData: any = {};
    
    if (updates.year !== undefined) updateData.year = updates.year;
    if (updates.denomination !== undefined) updateData.denomination = updates.denomination;
    if (updates.country !== undefined) updateData.country = updates.country || null;
    if (updates.mintMark !== undefined) updateData.mint_mark = updates.mintMark || null;
    if (updates.grade !== undefined) updateData.grade = updates.grade || null;
    if (updates.purchasePrice !== undefined) updateData.purchase_price = updates.purchasePrice || null;
    if (updates.purchaseDate !== undefined) updateData.purchase_date = updates.purchaseDate || null;
    if (updates.notes !== undefined) updateData.notes = updates.notes || null;
    
    // Update images array
    updateData.images = [obverseImageUrl, reverseImageUrl].filter(Boolean);
    updateData.updated_at = new Date().toISOString();

    // Update coin in database
    const { data: updatedCoin, error: updateError } = await supabase
      .from('coins')
      .update(updateData)
      .eq('id', coinId)
      .select(`
        id,
        collection_id,
        denomination,
        year,
        mint_mark,
        grade,
        purchase_price,
        purchase_date,
        notes,
        images,
        country,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      throw new Error(`Failed to update coin: ${updateError.message}`);
    }

    // Transform database response to match Coin interface
    const coin: Coin = {
      id: updatedCoin.id,
      name: updates.name || `${updatedCoin.year} ${updatedCoin.denomination}`,
      title: updates.title || '',
      year: updatedCoin.year,
      mintMark: updatedCoin.mint_mark,
      grade: updatedCoin.grade,
      faceValue: updates.faceValue || null,
      purchasePrice: updatedCoin.purchase_price,
      currentMarketValue: null,
      lastValueUpdate: null,
      pcgsId: null,
      createdAt: updatedCoin.created_at,
      updatedAt: updatedCoin.updated_at,
      userId: user.id,
      collectionId: updatedCoin.collection_id,
      denomination: updatedCoin.denomination,
      purchaseDate: updatedCoin.purchase_date,
      personalValue: null,
      lastAppraisalValue: null,
      lastAppraisalDate: null,
      mintage: null,
      rarityScale: null,
      historicalNotes: null,
      varietyNotes: null,
      notes: updatedCoin.notes,
      images: updatedCoin.images,
      obverseImage: obverseImageUrl,
      reverseImage: reverseImageUrl,
      country: updatedCoin.country,
    };

    return coin;
  }

  // Delete a coin
  static async deleteCoin(coinId: string): Promise<void> {
    const { error } = await supabase
      .from('coins')
      .delete()
      .eq('id', coinId);

    if (error) {
      throw new Error(`Failed to delete coin: ${error.message}`);
    }
  }
}