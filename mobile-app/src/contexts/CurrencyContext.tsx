import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Logger } from '../services/logger';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

export const CURRENCY_OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
];

const STORAGE_KEY = 'pref_currency_v1';
const DEFAULT_CURRENCY: CurrencyCode = 'USD';

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => Promise<void>;
  format: (n: number | null | undefined, options?: { compact?: boolean }) => string;
  symbol: string;
  ready: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function symbolFor(code: CurrencyCode): string {
  return CURRENCY_OPTIONS.find((o) => o.code === code)?.symbol ?? '$';
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && CURRENCY_OPTIONS.some((o) => o.code === stored)) {
          setCurrencyState(stored as CurrencyCode);
        }
      } catch (err) {
        Logger.warn('Failed to load currency preference, using default', err);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setCurrency = useCallback(async (next: CurrencyCode) => {
    setCurrencyState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (err) {
      Logger.error('Failed to persist currency preference', err);
    }
  }, []);

  const format = useCallback(
    (n: number | null | undefined, options?: { compact?: boolean }): string => {
      const value = typeof n === 'number' && Number.isFinite(n) ? n : 0;
      try {
        const fractionDigits = currency === 'JPY' ? 0 : 2;
        return value.toLocaleString('en-US', {
          style: 'currency',
          currency,
          maximumFractionDigits: options?.compact ? 0 : fractionDigits,
          minimumFractionDigits: options?.compact ? 0 : fractionDigits,
        });
      } catch {
        return `${symbolFor(currency)}${value.toFixed(2)}`;
      }
    },
    [currency]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      format,
      symbol: symbolFor(currency),
      ready,
    }),
    [currency, setCurrency, format, ready]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
