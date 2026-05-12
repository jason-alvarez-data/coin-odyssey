export type RecognitionConfidence = 'high' | 'medium' | 'low' | 'unrecognized';

export interface CoinRecognitionResult {
  denomination: string | null;
  year: number | null;
  country: string | null;
  currency: string | null;
  mintMark: string | null;
  composition: string | null;
  confidence: RecognitionConfidence;
  notes: string | null;
  error?: string;
}

export interface RecognitionAPIResponse {
  success: boolean;
  result?: CoinRecognitionResult;
  error?: string;
}
