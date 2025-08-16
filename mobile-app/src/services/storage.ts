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
        const { data, error } = await supabase.from('coins').insert(coinData);
        
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