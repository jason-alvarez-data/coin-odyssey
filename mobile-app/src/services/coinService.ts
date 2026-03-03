// src/services/coinService.ts
import { supabase } from './supabase';
import { Coin } from '../types/coin';
import { Logger } from './logger';
import { ErrorService } from './errorService';

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
  // Series information
  series?: string;
  seriesId?: string;
  specificCoinId?: string;
  specificCoinName?: string;
  designer?: string;
  theme?: string;
  honoree?: string;
  releaseDate?: string;
  certificationNumber?: string;
  gradingService?: string;
}

/**
 * Service for managing coin-related operations
 * Handles CRUD operations, image uploads, and collection management
 */
export class CoinService {
  /**
   * Map raw Supabase row (snake_case) to Coin interface (camelCase)
   */
  static mapSupabaseToCoin(data: any): Coin {
    return {
      id: data.id,
      name: data.name || `${data.year} ${data.denomination}`,
      title: data.title || '',
      year: data.year,
      mintMark: data.mint_mark ?? null,
      grade: data.grade ?? null,
      faceValue: data.face_value ?? null,
      purchasePrice: data.purchase_price ?? null,
      currentMarketValue: data.current_market_value ?? null,
      lastValueUpdate: data.last_value_update ?? null,
      pcgsId: data.pcgs_id ?? null,
      createdAt: data.created_at ?? null,
      updatedAt: data.updated_at ?? null,
      userId: data.user_id ?? data.collections?.user_id ?? null,
      collectionId: data.collection_id ?? null,
      denomination: data.denomination,
      purchaseDate: data.purchase_date ?? null,
      personalValue: data.personal_value ?? null,
      lastAppraisalValue: data.last_appraisal_value ?? null,
      lastAppraisalDate: data.last_appraisal_date ?? null,
      mintage: data.mintage ?? null,
      rarityScale: data.rarity_scale ?? null,
      historicalNotes: data.historical_notes ?? null,
      varietyNotes: data.variety_notes ?? null,
      notes: data.notes ?? null,
      images: data.images ?? null,
      obverseImage: data.images?.[0] ?? null,
      reverseImage: data.images?.[1] ?? null,
      country: data.country ?? null,
      series: data.series ?? null,
      seriesId: data.series_id ?? null,
      specificCoinId: data.specific_coin_id ?? null,
      specificCoinName: data.specific_coin_name ?? null,
      designer: data.designer ?? null,
      theme: data.theme ?? null,
      honoree: data.honoree ?? null,
      releaseDate: data.release_date ?? null,
      certificationNumber: data.certification_number ?? null,
      gradingService: data.grading_service ?? null,
    };
  }

  /**
   * Map Coin interface (camelCase) to Supabase row (snake_case)
   * Only includes fields that are explicitly present (not undefined)
   */
  static mapCoinToSupabase(coin: Partial<Coin>): Record<string, any> {
    const result: Record<string, any> = {};

    if (coin.collectionId !== undefined) result.collection_id = coin.collectionId;
    if (coin.name !== undefined) result.name = coin.name;
    if (coin.title !== undefined) result.title = coin.title || null;
    if (coin.denomination !== undefined) result.denomination = coin.denomination;
    if (coin.year !== undefined) result.year = coin.year;
    if (coin.mintMark !== undefined) result.mint_mark = coin.mintMark || null;
    if (coin.grade !== undefined) result.grade = coin.grade || null;
    if (coin.faceValue !== undefined) result.face_value = coin.faceValue ?? null;
    if (coin.purchasePrice !== undefined) result.purchase_price = coin.purchasePrice ?? null;
    if (coin.currentMarketValue !== undefined) result.current_market_value = coin.currentMarketValue ?? null;
    if (coin.purchaseDate !== undefined) result.purchase_date = coin.purchaseDate || null;
    if (coin.notes !== undefined) result.notes = coin.notes || null;
    if (coin.country !== undefined) result.country = coin.country || null;
    if (coin.series !== undefined) result.series = coin.series || null;
    if (coin.seriesId !== undefined) result.series_id = coin.seriesId || null;
    if (coin.specificCoinId !== undefined) result.specific_coin_id = coin.specificCoinId || null;
    if (coin.specificCoinName !== undefined) result.specific_coin_name = coin.specificCoinName || null;
    if (coin.designer !== undefined) result.designer = coin.designer || null;
    if (coin.theme !== undefined) result.theme = coin.theme || null;
    if (coin.honoree !== undefined) result.honoree = coin.honoree || null;
    if (coin.releaseDate !== undefined) result.release_date = coin.releaseDate || null;
    if (coin.certificationNumber !== undefined) result.certification_number = coin.certificationNumber || null;
    if (coin.gradingService !== undefined) result.grading_service = coin.gradingService || null;
    if (coin.images !== undefined) result.images = coin.images || null;

    return result;
  }

  /**
   * Get or create a default collection for a user
   * If the user already has collections, returns the first one.
   * Otherwise, creates a new default collection.
   *
   * @param userId - The unique identifier for the user
   * @returns Promise<string> - The collection ID
   * @throws Error if unable to fetch or create collection
   *
   * @example
   * const collectionId = await CoinService.getOrCreateDefaultCollection(user.id);
   */
  static async getOrCreateDefaultCollection(userId: string): Promise<string> {
    try {
      // First, check if user has a default collection
      const { data: existingCollections, error: fetchError } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (fetchError) {
        Logger.error('Failed to fetch collections', fetchError);
        throw new Error('Unable to access your collections. Please try again.');
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
        Logger.error('Failed to create collection', createError);
        throw new Error('Unable to create your collection. Please try again.');
      }

      return newCollection.id;
    } catch (error) {
      Logger.error('Error in getOrCreateDefaultCollection', error);
      throw error;
    }
  }

  /**
   * Upload a coin image to Supabase storage
   * Converts the image URI to a blob and uploads to the coin-images bucket
   *
   * @param imageUri - Local URI of the image to upload
   * @param coinId - Unique identifier for the coin (used in filename)
   * @param side - Which side of the coin ('obverse' or 'reverse')
   * @returns Promise<string | null> - Public URL of uploaded image, or null on error
   *
   * @example
   * const imageUrl = await CoinService.uploadImage(
   *   'file:///path/to/image.jpg',
   *   'coin-123',
   *   'obverse'
   * );
   */
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
        Logger.error('Image upload failed', { error: error.message });
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('coin-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      Logger.error('Error uploading image', error);
      return null;
    }
  }

  /**
   * Create a new coin in the user's collection
   * Handles authentication, collection creation, image uploads, and database insertion
   *
   * @param coinData - The coin data to create
   * @returns Promise<Coin> - The created coin with all fields populated
   * @throws Error if user not authenticated or unable to save coin
   *
   * @example
   * const newCoin = await CoinService.createCoin({
   *   name: 'Morgan Dollar',
   *   year: 1921,
   *   denomination: 'Dollar',
   *   purchasePrice: 45.00,
   * });
   */
  static async createCoin(coinData: CreateCoinData): Promise<Coin> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Logger.error('User not authenticated', userError);
        throw new Error('You must be signed in to add coins to your collection.');
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

      // Prepare coin data for database using centralized mapping
      const dbCoinData = {
        collection_id: collectionId,
        ...this.mapCoinToSupabase(coinData as unknown as Partial<Coin>),
        // Override images with uploaded URLs (preserve positions)
        images: (obverseImageUrl || reverseImageUrl) ? [obverseImageUrl, reverseImageUrl] : null,
      };

      // Insert coin into database
      const { data: newCoin, error: insertError } = await supabase
        .from('coins')
        .insert(dbCoinData)
        .select('*')
        .single();

      if (insertError) {
        Logger.error('Failed to insert coin into database', insertError);
        throw new Error('Unable to save your coin. Please check your connection and try again.');
      }

      const coin = this.mapSupabaseToCoin(newCoin);
      coin.userId = user.id;
      if (obverseImageUrl) coin.obverseImage = obverseImageUrl;
      if (reverseImageUrl) coin.reverseImage = reverseImageUrl;

      return coin;
    } catch (error) {
      Logger.error('Failed to create coin', error);
      throw error;
    }
  }

  /**
   * Retrieve all coins belonging to the authenticated user
   * Returns coins ordered by creation date (newest first)
   *
   * @returns Promise<Coin[]> - Array of user's coins
   * @throws Error if unable to fetch coins
   *
   * @example
   * const coins = await CoinService.getUserCoins();
   * console.log(`You have ${coins.length} coins`);
   */
  static async getUserCoins(): Promise<Coin[]> {
    const { data: coins, error } = await supabase
      .from('coins')
      .select(`
        *,
        collections!inner(user_id)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch coins: ${error.message}`);
    }

    return coins.map(this.mapSupabaseToCoin);
  }

  /**
   * Update an existing coin's information
   * Handles partial updates - only provided fields are updated
   * Can upload new images if provided
   *
   * @param coinId - The unique identifier of the coin to update
   * @param updates - Partial coin data with fields to update
   * @returns Promise<Coin> - The updated coin
   * @throws Error if user not authenticated or unable to update coin
   *
   * @example
   * const updatedCoin = await CoinService.updateCoin('coin-123', {
   *   grade: 'MS-65',
   *   purchasePrice: 50.00,
   * });
   */
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

    // Prepare update data using centralized mapping
    const updateData: Record<string, any> = {
      ...this.mapCoinToSupabase(updates as unknown as Partial<Coin>),
      images: (obverseImageUrl || reverseImageUrl) ? [obverseImageUrl, reverseImageUrl] : [],
      updated_at: new Date().toISOString(),
    };

    // Update coin in database
    const { data: updatedCoin, error: updateError } = await supabase
      .from('coins')
      .update(updateData)
      .eq('id', coinId)
      .select('*')
      .single();

    if (updateError) {
      throw new Error(`Failed to update coin: ${updateError.message}`);
    }

    const coin = this.mapSupabaseToCoin(updatedCoin);
    coin.userId = user.id;
    if (obverseImageUrl) coin.obverseImage = obverseImageUrl;
    if (reverseImageUrl) coin.reverseImage = reverseImageUrl;

    return coin;
  }

  /**
   * Delete a coin from the database
   * This operation is permanent and cannot be undone
   *
   * @param coinId - The unique identifier of the coin to delete
   * @returns Promise<void>
   * @throws Error if unable to delete coin
   *
   * @example
   * await CoinService.deleteCoin('coin-123');
   */
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