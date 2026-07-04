// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Logger } from './logger';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase is not configured: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set. ' +
      'Copy mobile-app/.env.example to mobile-app/.env and fill in the values, then restart the dev server.'
  );
}

// SecureStore rejects values over 2048 bytes on some platforms. Supabase
// session payloads (access + refresh token JSON) regularly exceed that, so
// larger values are split across `${key}__chunk_${i}` entries with the head
// key holding a chunk-count marker.
const CHUNK_SIZE = 2000;
const CHUNK_MARKER = '__chunked__:';

const chunkKey = (key: string, index: number) => `${key}__chunk_${index}`;

function parseChunkCount(head: string | null): number {
  if (!head || !head.startsWith(CHUNK_MARKER)) return 0;
  const count = Number.parseInt(head.slice(CHUNK_MARKER.length), 10);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

async function deleteChunks(key: string, from: number, count: number): Promise<void> {
  for (let i = from; i < count; i++) {
    await SecureStore.deleteItemAsync(chunkKey(key, i));
  }
}

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const head = await SecureStore.getItemAsync(key);
    if (head === null || !head.startsWith(CHUNK_MARKER)) {
      return head;
    }
    const count = parseChunkCount(head);
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(chunkKey(key, i));
      if (part === null) {
        Logger.warn(`SecureStore: missing chunk ${i}/${count} for ${key}; treating as signed out`);
        return null;
      }
      parts.push(part);
    }
    return parts.join('');
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const previousCount = parseChunkCount(await SecureStore.getItemAsync(key));

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      await deleteChunks(key, 0, previousCount);
      return;
    }

    const count = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(
        chunkKey(key, i),
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
      );
    }
    await SecureStore.setItemAsync(key, `${CHUNK_MARKER}${count}`);
    await deleteChunks(key, count, previousCount);
  },
  removeItem: async (key: string): Promise<void> => {
    const count = parseChunkCount(await SecureStore.getItemAsync(key));
    await deleteChunks(key, 0, count);
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
