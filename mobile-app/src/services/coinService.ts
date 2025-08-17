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
      name: coinData.name,
      title: coinData.title || null,
      denomination: coinData.denomination,
      year: coinData.year,
      mint_mark: coinData.mintMark || null,
      grade: coinData.grade || null,
      face_value: coinData.faceValue || null,
      purchase_price: coinData.purchasePrice || null,
      purchase_date: coinData.purchaseDate || null,
      notes: coinData.notes || null,
      country: coinData.country || null,
      // Series information
      series: coinData.series || null,
      series_id: coinData.seriesId || null,
      specific_coin_id: coinData.specificCoinId || null,
      specific_coin_name: coinData.specificCoinName || null,
      designer: coinData.designer || null,
      theme: coinData.theme || null,
      honoree: coinData.honoree || null,
      release_date: coinData.releaseDate || null,
      certification_number: coinData.certificationNumber || null,
      grading_service: coinData.gradingService || null,
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
        name,
        title,
        denomination,
        year,
        mint_mark,
        grade,
        face_value,
        purchase_price,
        purchase_date,
        notes,
        images,
        country,
        series,
        series_id,
        specific_coin_id,
        specific_coin_name,
        designer,
        theme,
        honoree,
        release_date,
        certification_number,
        grading_service,
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
      name: newCoin.name || coinData.name,
      title: newCoin.title || coinData.title || '',
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
      // Series information
      series: newCoin.series,
      seriesId: newCoin.series_id,
      specificCoinId: newCoin.specific_coin_id,
      specificCoinName: newCoin.specific_coin_name,
      designer: newCoin.designer,
      theme: newCoin.theme,
      honoree: newCoin.honoree,
      releaseDate: newCoin.release_date,
      certificationNumber: newCoin.certification_number,
      gradingService: newCoin.grading_service,
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
        name,
        title,
        denomination,
        year,
        mint_mark,
        grade,
        face_value,
        purchase_price,
        purchase_date,
        notes,
        images,
        country,
        series,
        series_id,
        specific_coin_id,
        specific_coin_name,
        designer,
        theme,
        honoree,
        release_date,
        certification_number,
        grading_service,
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
      name: coin.name || `${coin.year} ${coin.denomination}`,
      title: coin.title || '',
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
      // Series information
      series: coin.series,
      seriesId: coin.series_id,
      specificCoinId: coin.specific_coin_id,
      specificCoinName: coin.specific_coin_name,
      designer: coin.designer,
      theme: coin.theme,
      honoree: coin.honoree,
      releaseDate: coin.release_date,
      certificationNumber: coin.certification_number,
      gradingService: coin.grading_service,
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
    if (updates.name !== undefined) updateData.name = updates.name || null;
    if (updates.title !== undefined) updateData.title = updates.title || null;
    
    // Series information
    if (updates.series !== undefined) updateData.series = updates.series || null;
    if (updates.seriesId !== undefined) updateData.series_id = updates.seriesId || null;
    if (updates.specificCoinId !== undefined) updateData.specific_coin_id = updates.specificCoinId || null;
    if (updates.specificCoinName !== undefined) updateData.specific_coin_name = updates.specificCoinName || null;
    if (updates.designer !== undefined) updateData.designer = updates.designer || null;
    if (updates.theme !== undefined) updateData.theme = updates.theme || null;
    if (updates.honoree !== undefined) updateData.honoree = updates.honoree || null;
    if (updates.releaseDate !== undefined) updateData.release_date = updates.releaseDate || null;
    if (updates.certificationNumber !== undefined) updateData.certification_number = updates.certificationNumber || null;
    if (updates.gradingService !== undefined) updateData.grading_service = updates.gradingService || null;
    
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
        name,
        title,
        denomination,
        year,
        mint_mark,
        grade,
        purchase_price,
        purchase_date,
        notes,
        images,
        country,
        series,
        series_id,
        specific_coin_id,
        specific_coin_name,
        designer,
        theme,
        honoree,
        release_date,
        certification_number,
        grading_service,
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
      name: updatedCoin.name || `${updatedCoin.year} ${updatedCoin.denomination}`,
      title: updatedCoin.title || '',
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
      // Series information
      series: updatedCoin.series,
      seriesId: updatedCoin.series_id,
      specificCoinId: updatedCoin.specific_coin_id,
      specificCoinName: updatedCoin.specific_coin_name,
      designer: updatedCoin.designer,
      theme: updatedCoin.theme,
      honoree: updatedCoin.honoree,
      releaseDate: updatedCoin.release_date,
      certificationNumber: updatedCoin.certification_number,
      gradingService: updatedCoin.grading_service,
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