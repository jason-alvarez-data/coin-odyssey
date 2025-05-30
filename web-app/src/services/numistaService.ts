import axios from 'axios';

export interface NumistaConfig {
  apiKey: string;
  baseUrl: string;
  cacheTimeout: number; // in minutes
}

export interface NumistaCoinInfo {
  id: string;
  title: string;
  year: string;
  mintMark?: string;
  grade?: string;
  metal: string;
  rarity_index: string;
  images: {
    obverse?: { preview: string; fullsize: string };
    reverse?: { preview: string; fullsize: string };
  };
}

export interface NumistaPriceInfo {
  min: number;
  max: number;
  average: number;
  median: number;
  count: number;
  year: string;
}

class NumistaService {
  private config: NumistaConfig;
  private cache: Map<string, { data: any; timestamp: number }>;

  constructor() {
    this.config = {
      apiKey: process.env.NEXT_PUBLIC_NUMISTA_API_KEY || '',
      baseUrl: 'https://qmegas.info/numista-api',
      cacheTimeout: 15 // 15 minutes
    };
    this.cache = new Map();
  }

  private async makeRequest(endpoint: string, params: any = {}) {
    const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.config.cacheTimeout * 60 * 1000) {
      return cached.data;
    }

    try {
      const response = await axios.get(`${this.config.baseUrl}${endpoint}`, {
        params: {
          ...params,
          api_key: this.config.apiKey
        }
      });

      const data = response.data;
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Numista API Error:', error);
      throw error;
    }
  }

  async getCoinInfo(coinId: string): Promise<NumistaCoinInfo> {
    const data = await this.makeRequest('/coin', { coin_id: coinId });
    return data;
  }

  async getCoinPrices(coinId: string): Promise<NumistaPriceInfo[]> {
    const data = await this.makeRequest('/coin/prices', { coin_id: coinId });
    return data.prices;
  }

  async searchCoins(query: string, country?: string, page: number = 1): Promise<any> {
    const params: any = {
      q: query,
      page
    };

    if (country) {
      params.country_id = country;
    }

    const data = await this.makeRequest('/country/coins', params);
    return data;
  }

  async getCountries(): Promise<any> {
    const data = await this.makeRequest('/country/list');
    return data.countries;
  }

  // Helper method to format price for display
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  // Helper method to calculate value trend
  calculateValueTrend(currentValue: number, previousValue: number): {
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  } {
    if (!currentValue || !previousValue) {
      return { trend: 'stable', percentage: 0 };
    }

    const difference = currentValue - previousValue;
    const percentage = (difference / previousValue) * 100;

    return {
      trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'stable',
      percentage: Math.abs(percentage)
    };
  }
}

export const numistaService = new NumistaService();
export default NumistaService; 