// src/services/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coin } from '../types/coin';
import { supabase } from './supabase';

export class OfflineStorage {
  private static readonly OFFLINE_COINS_KEY = 'offline_coins';
  private static readonly OFFLINE_CHANGES_KEY = 'offline_changes';

  static async saveCoin(coin: Omit<Coin, 'id'>) {
    const offlineCoins = await this.getOfflineCoins();
    const coinWithOfflineFlag = { 
      ...coin, 
      id: `offline_${Date.now()}`,
      offline: true, 
      timestamp: Date.now() 
    };
    
    offlineCoins.push(coinWithOfflineFlag);
    await AsyncStorage.setItem(this.OFFLINE_COINS_KEY, JSON.stringify(offlineCoins));
    return coinWithOfflineFlag.id;
  }

  static async getOfflineCoins(): Promise<(Coin & { offline?: boolean; timestamp?: number })[]> {
    const coinsJson = await AsyncStorage.getItem(this.OFFLINE_COINS_KEY);
    return coinsJson ? JSON.parse(coinsJson) : [];
  }

  static async syncOfflineData() {
    const offlineCoins = await this.getOfflineCoins();
    const syncedIds: string[] = [];
    
    for (const coin of offlineCoins) {
      try {
        const { id, offline, timestamp, ...coinData } = coin;
        // Map camelCase Coin fields to snake_case for Supabase insert
        const dbData = {
          collection_id: coinData.collectionId,
          name: coinData.name,
          title: coinData.title || null,
          denomination: coinData.denomination,
          year: coinData.year,
          mint_mark: coinData.mintMark || null,
          grade: coinData.grade || null,
          face_value: coinData.faceValue ?? null,
          purchase_price: coinData.purchasePrice ?? null,
          current_market_value: coinData.currentMarketValue ?? null,
          purchase_date: coinData.purchaseDate || null,
          notes: coinData.notes || null,
          country: coinData.country || null,
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
          images: coinData.images || null,
        };
        const { data, error } = await supabase.from('coins').insert(dbData);
        
        if (!error) {
          syncedIds.push(id);
        }
      } catch (error) {
        console.error('Sync error for coin:', coin.id, error);
      }
    }

    // Remove synced coins from offline storage
    const remainingCoins = offlineCoins.filter(coin => !syncedIds.includes(coin.id));
    await AsyncStorage.setItem(this.OFFLINE_COINS_KEY, JSON.stringify(remainingCoins));
    
    return { synced: syncedIds.length, remaining: remainingCoins.length };
  }

  static async clearOfflineData() {
    await AsyncStorage.removeItem(this.OFFLINE_COINS_KEY);
    await AsyncStorage.removeItem(this.OFFLINE_CHANGES_KEY);
  }

  static async getPendingChanges() {
    const changesJson = await AsyncStorage.getItem(this.OFFLINE_CHANGES_KEY);
    return changesJson ? JSON.parse(changesJson) : [];
  }

  static async markChangeAsSynced(changeId: string) {
    const changes = await this.getPendingChanges();
    const updatedChanges = changes.filter((change: any) => change.id !== changeId);
    await AsyncStorage.setItem(this.OFFLINE_CHANGES_KEY, JSON.stringify(updatedChanges));
  }
}