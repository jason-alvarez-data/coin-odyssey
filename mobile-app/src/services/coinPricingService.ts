// src/services/coinPricingService.ts
import { Coin } from '../types/coin';

export interface CoinPricing {
  currentValue?: number;
  priceRange: {
    low: number;
    high: number;
  };
  marketTrend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  source: 'pcgs' | 'ngc' | 'numismedia' | 'manual';
  confidence: 'high' | 'medium' | 'low';
}

export interface PCGSCoinData {
  coinId: string;
  pcgsNumber?: string;
  year: number;
  denomination: string;
  designType: string;
  mintMark?: string;
  grade?: string;
  pricing: {
    [grade: string]: number;
  };
  population: {
    total: number;
    higherGrades: number;
  };
  auctionPrices: {
    recent: number[];
    average: number;
    highest: number;
  };
}

export class CoinPricingService {
  private static readonly PCGS_API_BASE = 'https://api.pcgs.com/publicapi';
  private static readonly PCGS_ACCESS_TOKEN = 'yT7hbYm5xvbNinYLTzgQgiWDGunztmZKIYPLYEAEb__bBBgDvqVUqFu98Ttvi4cEMUqw4XCGNnL0Lvq2UKKP-kBTAsEbrN4NmhfWxSZw3uNDxIIMdhn0tLscdJh4eVh3A87gaE0ZlXSwNWDhXV4eOpI_mZH48gDj6DZnMXOO26MkjWHcD7p93pRGT6VFs7ix7JaUizcZiIiI8y2TmIGySIBZk-SqZoB2Veqp9FYPq9Vv0Ob0fUi1F_xuCSz1I8HD8u7eSLE0oyQq2xS87l3pD71J2lg1Gv3BOgSQk6V2p089gFaN';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly DAILY_LIMIT = 1000;
  private static apiCallCount = 0;
  
  // Cache for pricing data
  private static pricingCache = new Map<string, { data: CoinPricing; timestamp: number }>();

  /**
   * Get comprehensive pricing data for a coin
   */
  static async getCoinPricing(coin: Coin): Promise<CoinPricing | null> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(coin);
      const cached = this.pricingCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      // Try PCGS API first
      const pcgsData = await this.fetchPCGSPricing(coin);
      if (pcgsData) {
        const pricing = this.processPCGSData(pcgsData);
        this.pricingCache.set(cacheKey, { data: pricing, timestamp: Date.now() });
        return pricing;
      }

      // Fallback to estimated pricing
      const estimatedPricing = this.getEstimatedPricing(coin);
      this.pricingCache.set(cacheKey, { data: estimatedPricing, timestamp: Date.now() });
      return estimatedPricing;

    } catch (error) {
      console.error('Error fetching coin pricing:', error);
      return this.getEstimatedPricing(coin);
    }
  }

  /**
   * Fetch pricing data from PCGS API
   */
  private static async fetchPCGSPricing(coin: Coin): Promise<PCGSCoinData | null> {
    try {
      // Check rate limit
      if (this.apiCallCount >= this.DAILY_LIMIT) {
        console.warn('PCGS API daily limit reached, using fallback pricing');
        return null;
      }

      // First, try to find the PCGS number for this coin
      const pcgsNumber = await this.findPCGSNumber(coin);
      if (!pcgsNumber) {
        console.log('PCGS number not found for coin:', coin.name);
        return null;
      }

      // Get coin facts and pricing data
      const coinFacts = await this.getCoinFactsByPCGSNumber(pcgsNumber, coin.grade);
      if (coinFacts) {
        this.apiCallCount++;
        return this.formatPCGSResponse(coinFacts, coin);
      }

      return null;
    } catch (error) {
      console.error('PCGS API error:', error);
      return null;
    }
  }

  /**
   * Find PCGS number for a coin (simplified search)
   */
  private static async findPCGSNumber(coin: Coin): Promise<string | null> {
    try {
      // For now, we'll use a basic search approach
      // In production, you'd have a comprehensive mapping system
      
      // Example PCGS numbers for common coins
      const commonPCGSNumbers: { [key: string]: string } = {
        // Morgan Dollars
        'morgan dollar 1921': '7296',
        'morgan silver dollar 1921': '7296',
        'morgan dollar 1921-s': '7298',
        'morgan dollar 1921-d': '7297',
        
        // Peace Dollars
        'peace dollar 1922': '7356',
        'peace silver dollar 1922': '7356',
        'peace dollar 1923': '7357',
        'peace dollar 1924': '7358',
        'peace dollar 1925': '7359',
        
        // Walking Liberty Half Dollars
        'walking liberty half 1943': '6611',
        'walking liberty half dollar 1943': '6611',
        'walking liberty half 1942': '6610',
        'walking liberty half 1944': '6612',
        
        // Mercury Dimes
        'mercury dime 1943': '4812',
        'winged liberty dime 1943': '4812',
        'mercury dime 1942': '4811',
        'mercury dime 1944': '4813',
        
        // American Women Quarters
        'american women quarter 2022': '98836',
        'american women quarter sally ride 2022': '98836',
        'sally ride quarter 2022': '98836',
        'american women quarter maya angelou 2022': '98834',
        'maya angelou quarter 2022': '98834',
        'american women quarter dr. sally ride 2022': '98836',
        
        // State Quarters (examples)
        'delaware quarter 1999': '932906',
        'pennsylvania quarter 1999': '932907',
        'new jersey quarter 1999': '932908',
        'georgia quarter 1999': '932909',
        'connecticut quarter 1999': '932910',
        
        // Kennedy Half Dollars
        'kennedy half dollar 1964': '6729',
        'kennedy half 1964': '6729',
        'kennedy half dollar 1965': '6730',
        
        // Washington Quarters
        'washington quarter 1932': '5792',
        'washington quarter 1964': '5892',
        
        // Common modern coins
        'quarter 2022': '98836', // Default to American Women
        'quarter 1999': '932906', // Default to Delaware
        'half dollar 1964': '6729', // Default to Kennedy
        'dollar 1921': '7296', // Default to Morgan
        'dime 1943': '4812', // Default to Mercury
      };

      // Try multiple search combinations
      const searchKeys = [
        `${coin.name?.toLowerCase()} ${coin.year}`.trim(),
        `${coin.denomination?.toLowerCase()} ${coin.year}`.trim(),
        `${coin.name?.toLowerCase()} ${coin.denomination?.toLowerCase()} ${coin.year}`.trim(),
        `${coin.title?.toLowerCase()} ${coin.year}`.trim(),
      ].filter(key => key.length > 4); // Filter out too short keys

      for (const searchKey of searchKeys) {
        const pcgsNumber = commonPCGSNumbers[searchKey];
        if (pcgsNumber) {
          console.log(`Found PCGS number ${pcgsNumber} for search key: ${searchKey}`);
          return pcgsNumber;
        }
      }

      // Try fallback to denomination only for very common coins
      const fallbackKey = `${coin.denomination?.toLowerCase()} ${coin.year}`.trim();
      const fallbackNumber = commonPCGSNumbers[fallbackKey];
      if (fallbackNumber) {
        console.log(`Using fallback PCGS number ${fallbackNumber} for ${fallbackKey}`);
        return fallbackNumber;
      }

      console.log(`No PCGS number found for coin:`, {
        name: coin.name,
        title: coin.title,
        denomination: coin.denomination,
        year: coin.year,
        searchKeys
      });
      return null;
    } catch (error) {
      console.error('Error finding PCGS number:', error);
      return null;
    }
  }

  /**
   * Get coin facts by PCGS number and grade
   */
  private static async getCoinFactsByPCGSNumber(pcgsNumber: string, grade?: string | null): Promise<any> {
    try {
      // Parse grade to get numeric value
      const gradeNumber = this.parseGradeNumber(grade);
      const plusGrade = grade?.includes('+') || false;

      const url = `${this.PCGS_API_BASE}/coindetail/GetCoinFactsByGrade?PCGSNo=${pcgsNumber}&GradeNo=${gradeNumber}&PlusGrade=${plusGrade}`;
      
      console.log('Calling PCGS API:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `bearer ${this.PCGS_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('PCGS API response:', data);
        return data;
      } else {
        console.warn('PCGS API request failed:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('PCGS API request error:', error);
      return null;
    }
  }

  /**
   * Parse grade string to numeric value
   */
  private static parseGradeNumber(grade?: string | null): number {
    if (!grade) return 60; // Default to MS-60 equivalent

    // Extract numeric value from grade string
    const match = grade.match(/(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }

    // Handle non-numeric grades
    const gradeMap: { [key: string]: number } = {
      'PR': 70, 'PF': 70, 'SP': 70,
      'MS': 65, 'AU': 58, 'XF': 45, 'EF': 45,
      'VF': 30, 'F': 15, 'VG': 10, 'G': 6,
      'AG': 3, 'FA': 2, 'PR': 1
    };

    for (const [key, value] of Object.entries(gradeMap)) {
      if (grade.toUpperCase().includes(key)) {
        return value;
      }
    }

    return 60; // Default fallback
  }

  /**
   * Format PCGS API response into our pricing format
   */
  private static formatPCGSResponse(pcgsData: any, coin: Coin): PCGSCoinData {
    try {
      // Extract relevant data from PCGS response
      const coinFacts = pcgsData.CoinFacts || pcgsData;
      
      return {
        coinId: coin.id,
        pcgsNumber: coinFacts.PCGSNo?.toString(),
        year: coin.year,
        denomination: coin.denomination,
        designType: coinFacts.DesignType || coin.name || '',
        mintMark: coin.mintMark,
        grade: coin.grade,
        pricing: {
          [coin.grade || 'MS-60']: coinFacts.Price || 0,
        },
        population: {
          total: coinFacts.Population || 0,
          higherGrades: coinFacts.PopulationHigher || 0,
        },
        auctionPrices: {
          recent: [coinFacts.Price || 0],
          average: coinFacts.Price || 0,
          highest: coinFacts.Price || 0,
        },
      };
    } catch (error) {
      console.error('Error formatting PCGS response:', error);
      throw error;
    }
  }

  /**
   * Process PCGS API response into our pricing format
   */
  private static processPCGSData(pcgsData: PCGSCoinData): CoinPricing {
    const grades = Object.keys(pcgsData.pricing);
    const prices = Object.values(pcgsData.pricing);
    
    return {
      currentValue: pcgsData.auctionPrices.average,
      priceRange: {
        low: Math.min(...prices),
        high: Math.max(...prices),
      },
      marketTrend: this.calculateTrend(pcgsData.auctionPrices.recent),
      lastUpdated: new Date().toISOString(),
      source: 'pcgs',
      confidence: 'high',
    };
  }

  /**
   * Generate estimated pricing when API data is unavailable
   */
  private static getEstimatedPricing(coin: Coin): CoinPricing {
    // Basic estimation logic based on coin characteristics
    let baseValue = 1; // Start with face value equivalent
    
    // Age factor
    const currentYear = new Date().getFullYear();
    const age = currentYear - coin.year;
    if (age > 100) baseValue *= 5;
    else if (age > 50) baseValue *= 2;
    
    // Country factor
    if (coin.country?.toLowerCase().includes('united states')) {
      baseValue *= 2;
    }
    
    // Grade factor
    if (coin.grade) {
      if (coin.grade.includes('MS') || coin.grade.includes('PR')) {
        baseValue *= 10;
      } else if (coin.grade.includes('AU')) {
        baseValue *= 5;
      } else if (coin.grade.includes('XF') || coin.grade.includes('EF')) {
        baseValue *= 3;
      }
    }
    
    // Use purchase price as base if available
    if (coin.purchasePrice && coin.purchasePrice > baseValue) {
      baseValue = coin.purchasePrice;
    }
    
    return {
      priceRange: {
        low: baseValue * 0.8,
        high: baseValue * 1.5,
      },
      marketTrend: 'stable',
      lastUpdated: new Date().toISOString(),
      source: 'manual',
      confidence: 'low',
    };
  }

  /**
   * Calculate market trend from recent auction prices
   */
  private static calculateTrend(recentPrices: number[]): 'up' | 'down' | 'stable' {
    if (recentPrices.length < 2) return 'stable';
    
    const recent = recentPrices.slice(-3);
    const older = recentPrices.slice(-6, -3);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.1) return 'up';
    if (change < -0.1) return 'down';
    return 'stable';
  }

  /**
   * Generate cache key for a coin
   */
  private static generateCacheKey(coin: Coin): string {
    return `${coin.year}-${coin.denomination}-${coin.country}-${coin.mintMark || 'no-mint'}-${coin.grade || 'no-grade'}`;
  }

  /**
   * Clear pricing cache
   */
  static clearCache(): void {
    this.pricingCache.clear();
  }

  /**
   * Get market insights for a collection
   */
  static async getCollectionInsights(coins: Coin[]): Promise<{
    totalValue: number;
    topPerformers: Coin[];
    marketTrends: { up: number; down: number; stable: number };
  }> {
    const pricingPromises = coins.map(coin => this.getCoinPricing(coin));
    const pricingData = await Promise.all(pricingPromises);
    
    let totalValue = 0;
    const trends = { up: 0, down: 0, stable: 0 };
    const coinValues: Array<{ coin: Coin; value: number; trend: string }> = [];
    
    pricingData.forEach((pricing, index) => {
      if (pricing) {
        const coinValue = pricing.currentValue || (pricing.priceRange.low + pricing.priceRange.high) / 2;
        totalValue += coinValue;
        trends[pricing.marketTrend]++;
        coinValues.push({ coin: coins[index], value: coinValue, trend: pricing.marketTrend });
      }
    });
    
    // Get top 5 most valuable coins
    const topPerformers = coinValues
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(item => item.coin);
    
    return {
      totalValue,
      topPerformers,
      marketTrends: trends,
    };
  }
}