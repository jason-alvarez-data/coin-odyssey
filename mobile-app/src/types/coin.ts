import { Coin as BaseCoin } from '@coin-collecting/shared';

// Mobile-specific fields for series metadata
export interface Coin extends BaseCoin {
  seriesId: string | null;
  specificCoinId: string | null;
  specificCoinName: string | null;
  designer: string | null;
  theme: string | null;
  honoree: string | null;
  releaseDate: string | null;
  certificationNumber: string | null;
  gradingService: string | null;
  /** True when this coin has been queued in offline storage and is waiting to sync. */
  offlinePending?: boolean;
}

// Re-export everything else from shared
export { CoinValueHistory, SearchField, GradeFilter, ValueFilter } from '@coin-collecting/shared';
