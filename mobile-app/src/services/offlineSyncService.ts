// src/services/offlineSyncService.ts
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

import { OfflineStorage, PendingCoin } from './storage';
import { CoinService } from './coinService';
import { Logger } from './logger';

type StatusListener = (status: SyncStatus) => void;

export interface SyncStatus {
  online: boolean;
  pendingCount: number;
  syncing: boolean;
  lastSyncedAt: number | null;
}

const MAX_RETRIES = 5;

export class OfflineSyncService {
  private static unsubscribe: (() => void) | null = null;
  private static listeners = new Set<StatusListener>();
  private static status: SyncStatus = {
    online: true,
    pendingCount: 0,
    syncing: false,
    lastSyncedAt: null,
  };
  private static syncInFlight = false;

  static async start(): Promise<void> {
    if (this.unsubscribe) return; // already started
    const pending = await OfflineStorage.getPendingCoins();
    this.update({ pendingCount: pending.length });

    this.unsubscribe = NetInfo.addEventListener((state) => {
      this.handleNetChange(state);
    });

    // Kick once to pick up current state
    const initial = await NetInfo.fetch();
    this.handleNetChange(initial);
  }

  static stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  static subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    // Send initial status
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  static getStatus(): SyncStatus {
    return this.status;
  }

  static async refreshPendingCount(): Promise<void> {
    const pending = await OfflineStorage.getPendingCoins();
    this.update({ pendingCount: pending.length });
  }

  /**
   * Returns true if the device currently appears to be online.
   * Use this from CoinService.createCoin to decide whether to attempt a network call.
   */
  static async isOnline(): Promise<boolean> {
    try {
      const s = await NetInfo.fetch();
      return Boolean(s.isConnected && (s.isInternetReachable ?? true));
    } catch {
      return true; // optimistic if NetInfo fails
    }
  }

  /**
   * Iterate the pending queue and try to flush each entry through CoinService.createCoin.
   * On success, removes the entry. On failure, increments retryCount and leaves it.
   */
  static async flushPendingCoins(): Promise<void> {
    if (this.syncInFlight) return;
    this.syncInFlight = true;
    this.update({ syncing: true });
    try {
      const pending = await OfflineStorage.getPendingCoins();
      for (const entry of pending) {
        if (entry.retryCount >= MAX_RETRIES) {
          Logger.warn('Pending coin exceeded retry budget — skipping', {
            uuid: entry.uuid,
            retryCount: entry.retryCount,
          });
          continue;
        }
        try {
          await CoinService.createCoin(entry.data);
          await OfflineStorage.removePendingCoin(entry.uuid);
        } catch (err) {
          Logger.error('Failed to flush pending coin — leaving in queue', err);
          await OfflineStorage.markPendingFailure(
            entry.uuid,
            err instanceof Error ? err.message : 'Unknown error'
          );
        }
      }
      const remaining = await OfflineStorage.getPendingCoins();
      this.update({
        pendingCount: remaining.length,
        lastSyncedAt: Date.now(),
      });
    } finally {
      this.syncInFlight = false;
      this.update({ syncing: false });
    }
  }

  private static handleNetChange(state: NetInfoState) {
    const online = Boolean(state.isConnected && (state.isInternetReachable ?? true));
    const wasOnline = this.status.online;
    this.update({ online });
    if (online && !wasOnline) {
      // Just regained connectivity — flush
      Logger.info('Network reconnected — flushing offline queue');
      this.flushPendingCoins();
    }
  }

  private static update(patch: Partial<SyncStatus>) {
    this.status = { ...this.status, ...patch };
    this.listeners.forEach((l) => {
      try {
        l(this.status);
      } catch (err) {
        Logger.error('Sync status listener threw', err);
      }
    });
  }
}
