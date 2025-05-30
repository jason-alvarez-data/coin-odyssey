import { pcgsService } from './pcgsService';
import { numistaService } from './numistaService';
import axios from 'axios';

export interface CoinPriceInfo {
  currentValue: number;
  lastUpdated: string;
  grade?: string;
  mintMark?: string;
  source: string;
}

export interface PriceHistory {
  value: number;
  date: string;
  grade?: string;
  source: string;
}

class CoinPricingService {
  private provider: string;
  private apiKey: string;
  private baseUrl: string;
  private cache: Map<string, { data: CoinPriceInfo; timestamp: number }>;
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.provider = process.env.NEXT_PUBLIC_COIN_API_PROVIDER || 'numista';
    this.apiKey = process.env.NEXT_PUBLIC_COIN_API_KEY || '';
    this.baseUrl = process.env.NEXT_PUBLIC_COIN_API_BASE_URL || '';
    this.cache = new Map();
  }

  private async fetchFromNumista(coinId: string, grade?: string): Promise<CoinPriceInfo> {
    try {
      const [coinInfo, priceInfo] = await Promise.all([
        numistaService.getCoinInfo(coinId),
        numistaService.getCoinPrices(coinId)
      ]);

      // Get the most recent price data
      const latestPrice = priceInfo[0];

      return {
        currentValue: latestPrice.median,
        lastUpdated: new Date().toISOString(),
        grade: grade || coinInfo.grade,
        mintMark: coinInfo.mintMark,
        source: 'Numista'
      };
    } catch (error) {
      console.error('Numista API Error:', error);
      throw error;
    }
  }

  private async fetchFromPCGS(coinId: string, grade?: string): Promise<CoinPriceInfo> {
    try {
      const data = await pcgsService.getCurrentValue(coinId, grade);
      return {
        currentValue: data.currentValue,
        lastUpdated: data.lastUpdated,
        grade: data.grade,
        mintMark: data.mintMark,
        source: 'PCGS'
      };
    } catch (error) {
      console.error('PCGS API Error:', error);
      throw error;
    }
  }

  private async fetchFromNGC(coinId: string, grade?: string): Promise<CoinPriceInfo> {
    // NGC API implementation would go here
    throw new Error('NGC API not implemented yet');
  }

  private async fetchFromCustom(coinId: string, grade?: string): Promise<CoinPriceInfo> {
    try {
      const response = await axios.get(`${this.baseUrl}/coin/value`, {
        params: {
          coin_id: coinId,
          grade,
          api_key: this.apiKey
        }
      });

      return {
        ...response.data,
        source: 'Custom'
      };
    } catch (error) {
      console.error('Custom API Error:', error);
      throw error;
    }
  }

  async getCurrentValue(coinId: string, grade?: string): Promise<CoinPriceInfo> {
    const cacheKey = `${coinId}-${grade || 'none'}`;
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    let result: CoinPriceInfo;

    try {
      switch (this.provider) {
        case 'numista':
          result = await this.fetchFromNumista(coinId, grade);
          break;
        case 'pcgs':
          result = await this.fetchFromPCGS(coinId, grade);
          break;
        case 'ngc':
          result = await this.fetchFromNGC(coinId, grade);
          break;
        case 'custom':
          result = await this.fetchFromCustom(coinId, grade);
          break;
        default:
          throw new Error(`Unknown provider: ${this.provider}`);
      }

      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      // If primary provider fails, try Numista as fallback
      if (this.provider !== 'numista') {
        try {
          result = await this.fetchFromNumista(coinId, grade);
          return result;
        } catch (fallbackError) {
          console.error('Fallback to Numista failed:', fallbackError);
          throw error; // Throw original error if fallback fails
        }
      }
      throw error;
    }
  }

  async getHistoricalValues(
    coinId: string,
    startDate: string,
    endDate: string,
    grade?: string
  ): Promise<PriceHistory[]> {
    try {
      switch (this.provider) {
        case 'numista':
          const priceInfo = await numistaService.getCoinPrices(coinId);
          return priceInfo.map(price => ({
            value: price.median,
            date: price.year,
            grade,
            source: 'Numista'
          }));
        case 'pcgs':
          const data = await pcgsService.getHistoricalValues(coinId, startDate, endDate);
          return data.map(item => ({
            ...item,
            source: 'PCGS'
          }));
        case 'ngc':
          throw new Error('NGC historical data not implemented yet');
        case 'custom':
          const response = await axios.get(`${this.baseUrl}/coin/historical`, {
            params: {
              coin_id: coinId,
              start_date: startDate,
              end_date: endDate,
              grade,
              api_key: this.apiKey
            }
          });
          return response.data.map((item: any) => ({
            ...item,
            source: 'Custom'
          }));
        default:
          throw new Error(`Unknown provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('Error fetching historical values:', error);
      throw error;
    }
  }

  async searchCoin(query: string): Promise<any> {
    try {
      switch (this.provider) {
        case 'numista':
          return await numistaService.searchCoins(query);
        case 'pcgs':
          return await pcgsService.searchCoin(query);
        case 'ngc':
          throw new Error('NGC search not implemented yet');
        case 'custom':
          const response = await axios.get(`${this.baseUrl}/coin/search`, {
            params: {
              q: query,
              api_key: this.apiKey
            }
          });
          return response.data;
        default:
          throw new Error(`Unknown provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('Error searching coin:', error);
      throw error;
    }
  }
}

export const coinPricingService = new CoinPricingService();
export default CoinPricingService; 