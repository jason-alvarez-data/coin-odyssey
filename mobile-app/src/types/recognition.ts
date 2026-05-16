export type RecognitionConfidence = 'high' | 'medium' | 'low' | 'unrecognized';

export interface CoinRecognitionResult {
  denomination: string | null;
  year: number | null;
  country: string | null;
  currency: string | null;
  mintMark: string | null;
  composition: string | null;
  confidence: RecognitionConfidence;
  grade: string | null;
  gradeConfidence: RecognitionConfidence;
  notes: string | null;
  error?: string;
}

export type RecognitionErrorCode =
  | 'rate_limit'
  | 'service_unavailable'
  | 'auth'
  | 'unknown';

export interface RecognitionAPIResponse {
  success: boolean;
  result?: CoinRecognitionResult;
  error?: string;
  code?: RecognitionErrorCode;
}
