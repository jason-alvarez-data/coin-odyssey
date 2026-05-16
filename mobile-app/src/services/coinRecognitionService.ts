import { supabase } from './supabase';
import {
  CoinRecognitionResult,
  RecognitionAPIResponse,
  RecognitionErrorCode,
} from '../types/recognition';
import { Logger } from './logger';
import * as FileSystem from 'expo-file-system/legacy';

export class RecognitionError extends Error {
  code: RecognitionErrorCode;
  constructor(message: string, code: RecognitionErrorCode) {
    super(message);
    this.code = code;
  }
}

export class CoinRecognitionService {
  /**
   * Convert a local image URI to base64 and compress it via canvas-like approach.
   * For React Native, we use expo-file-system to read the file as base64.
   */
  static async imageToBase64(uri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    return base64;
  }

  /**
   * Recognize a coin from one or two images by calling the Supabase Edge Function.
   */
  static async recognizeCoin(
    obverseUri: string | null,
    reverseUri: string | null
  ): Promise<CoinRecognitionResult> {
    if (!obverseUri && !reverseUri) {
      throw new Error('At least one image is required');
    }

    // Get the current session for auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Please sign in to use coin recognition');
    }

    // Convert images to base64
    const body: Record<string, string> = {
      mediaType: 'image/jpeg',
    };

    if (obverseUri) {
      body.obverseImage = await this.imageToBase64(obverseUri);
    }
    if (reverseUri) {
      body.reverseImage = await this.imageToBase64(reverseUri);
    }

    Logger.info('Calling coin recognition service', {
      hasObverse: !!obverseUri,
      hasReverse: !!reverseUri,
    });

    const { data, error } = await supabase.functions.invoke('recognize-coin', {
      body,
    });

    if (error) {
      Logger.error('Coin recognition edge function error', error);
      throw new RecognitionError(
        'Recognition service unavailable. Please try again.',
        'service_unavailable'
      );
    }

    const response = data as RecognitionAPIResponse;

    if (!response.success || !response.result) {
      throw new RecognitionError(
        response.error ?? 'Recognition failed',
        response.code ?? 'unknown'
      );
    }

    Logger.info('Coin recognized', {
      confidence: response.result.confidence,
      denomination: response.result.denomination,
    });

    return response.result;
  }
}
