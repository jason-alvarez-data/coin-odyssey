import axios from 'axios';

interface PCGSConfig {
  apiKey: string;
  baseUrl: string;
  cacheTimeout: number; // in minutes
}

interface PCGSCoinValue {
  currentValue: number;
  lastUpdated: string;
  grade?: string;
  mintMark?: string;
}

interface PCGSHistoricalValue {
  value: number;
  date: string;
  grade?: string;
}

class PCGSService {
  private config: PCGSConfig;
  private cache: Map<string, { data: any; timestamp: number }>;

  constructor(config: PCGSConfig) {
    this.config = config;
    this.cache = new Map();
  }

  private async makeRequest(endpoint: string, params: any = {}) {
    const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    
    // Check cache validity (default 15 minutes)
    if (cached && (Date.now() - cached.timestamp) < (this.config.cacheTimeout * 60 * 1000)) {
      return cached.data;
    }

    try {
      const response = await axios.get(`${this.config.baseUrl}${endpoint}`, {
        params: {
          ...params,
          api_key: this.config.apiKey,
        },
        headers: {
          'Accept': 'application/json',
        }
      });

      // Cache the response
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });

      return response.data;
    } catch (error) {
      console.error('PCGS API Error:', error);
      throw error;
    }
  }

  async getCurrentValue(coinId: string, grade?: string): Promise<PCGSCoinValue> {
    return this.makeRequest('/coin/value', { coin_id: coinId, grade });
  }

  async getHistoricalValues(coinId: string, startDate: string, endDate: string): Promise<PCGSHistoricalValue[]> {
    return this.makeRequest('/coin/historical', {
      coin_id: coinId,
      start_date: startDate,
      end_date: endDate
    });
  }

  async searchCoin(query: string) {
    return this.makeRequest('/coin/search', { q: query });
  }

  async bulkValueLookup(coinIds: string[]) {
    return this.makeRequest('/coin/bulk-value', { coin_ids: coinIds.join(',') });
  }
}

export const pcgsService = new PCGSService({
  apiKey: process.env.NEXT_PUBLIC_PCGS_API_KEY || '',
  baseUrl: process.env.NEXT_PUBLIC_PCGS_API_BASE_URL || 'https://api.pcgs.com/v1',
  cacheTimeout: 15 // 15 minutes cache
});

export default PCGSService; 