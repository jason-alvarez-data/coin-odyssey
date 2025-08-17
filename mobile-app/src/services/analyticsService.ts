// src/services/analyticsService.ts
import { CoinService } from './coinService';
import { Coin } from '../types/coin';

export interface AnalyticsData {
  overview: {
    totalCoins: number;
    totalValue: number;
    averageValue: number;
    uniqueCountries: number;
    yearSpan: string;
    mostValuableCoin: Coin | null;
    recentlyAdded: number; // Last 30 days
  };
  valueProgression: Array<{
    date: string;
    value: number;
  }>;
  countryDistribution: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;
  yearDistribution: Array<{
    year: number;
    count: number;
    value: number;
  }>;
  acquisitionTimeline: Array<{
    period: string;
    count: number;
    value: number;
    label: string;
  }>;
  topPerformers: Array<{
    coin: Coin;
    value: number;
    appreciation?: number;
  }>;
  insights: Array<{
    type: 'growth' | 'diversity' | 'value' | 'activity';
    title: string;
    description: string;
    metric?: string;
  }>;
}

export class AnalyticsService {
  static async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      const coins = await CoinService.getUserCoins();
      
      if (coins.length === 0) {
        return this.getEmptyAnalytics();
      }

      return {
        overview: this.calculateOverview(coins),
        valueProgression: this.calculateValueProgression(coins),
        countryDistribution: this.calculateCountryDistribution(coins),
        yearDistribution: this.calculateYearDistribution(coins),
        acquisitionTimeline: this.calculateAcquisitionTimeline(coins),
        topPerformers: this.calculateTopPerformers(coins),
        insights: this.generateInsights(coins),
      };
    } catch (error) {
      console.error('Error calculating analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  private static getEmptyAnalytics(): AnalyticsData {
    return {
      overview: {
        totalCoins: 0,
        totalValue: 0,
        averageValue: 0,
        uniqueCountries: 0,
        yearSpan: 'No coins',
        mostValuableCoin: null,
        recentlyAdded: 0,
      },
      valueProgression: [],
      countryDistribution: [],
      yearDistribution: [],
      acquisitionTimeline: [],
      topPerformers: [],
      insights: [],
    };
  }

  private static calculateOverview(coins: Coin[]) {
    const totalCoins = coins.length;
    const totalValue = coins.reduce((sum, coin) => sum + (coin.purchasePrice || 0), 0);
    const averageValue = totalValue / totalCoins;
    
    const countries = new Set(coins.map(coin => coin.country).filter(Boolean));
    const uniqueCountries = countries.size;
    
    const years = coins.map(coin => coin.year).filter(Boolean);
    const yearSpan = years.length > 0 
      ? `${Math.min(...years)} - ${Math.max(...years)}`
      : 'No coins';
    
    const mostValuableCoin = coins.reduce((max, coin) => 
      (coin.purchasePrice || 0) > (max?.purchasePrice || 0) ? coin : max, 
      null as Coin | null
    );

    // Calculate recently added (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyAdded = coins.filter(coin => 
      new Date(coin.createdAt) >= thirtyDaysAgo
    ).length;

    return {
      totalCoins,
      totalValue,
      averageValue,
      uniqueCountries,
      yearSpan,
      mostValuableCoin,
      recentlyAdded,
    };
  }

  private static calculateValueProgression(coins: Coin[]) {
    // Sort coins by creation date
    const sortedCoins = coins
      .filter(coin => coin.createdAt && coin.purchasePrice)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (sortedCoins.length === 0) return [];

    // Create cumulative value progression
    let cumulativeValue = 0;
    const progression = [];

    for (let i = 0; i < sortedCoins.length; i++) {
      cumulativeValue += sortedCoins[i].purchasePrice || 0;
      progression.push({
        date: new Date(sortedCoins[i].createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        value: cumulativeValue,
      });
    }

    // If we have many data points, sample them to keep the chart readable
    if (progression.length > 20) {
      const step = Math.ceil(progression.length / 20);
      return progression.filter((_, index) => index % step === 0 || index === progression.length - 1);
    }

    return progression;
  }

  private static calculateCountryDistribution(coins: Coin[]) {
    const countryCount = new Map<string, number>();
    
    coins.forEach(coin => {
      if (coin.country) {
        countryCount.set(coin.country, (countryCount.get(coin.country) || 0) + 1);
      }
    });

    const totalCoins = coins.length;
    const distribution = Array.from(countryCount.entries())
      .map(([country, count]) => ({
        country,
        count,
        percentage: (count / totalCoins) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    return distribution;
  }

  private static calculateYearDistribution(coins: Coin[]) {
    const yearData = new Map<number, { count: number; value: number }>();
    
    coins.forEach(coin => {
      if (coin.year) {
        const existing = yearData.get(coin.year) || { count: 0, value: 0 };
        yearData.set(coin.year, {
          count: existing.count + 1,
          value: existing.value + (coin.purchasePrice || 0),
        });
      }
    });

    return Array.from(yearData.entries())
      .map(([year, data]) => ({ year, ...data }))
      .sort((a, b) => a.year - b.year);
  }

  private static calculateAcquisitionTimeline(coins: Coin[]) {
    // Group by month for the last 12 months
    const monthlyData = new Map<string, { count: number; value: number }>();
    const now = new Date();
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyData.set(key, { count: 0, value: 0 });
    }

    // Add coin data
    coins.forEach(coin => {
      if (coin.createdAt) {
        const date = new Date(coin.createdAt);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const existing = monthlyData.get(key);
        if (existing) {
          existing.count += 1;
          existing.value += coin.purchasePrice || 0;
        }
      }
    });

    return Array.from(monthlyData.entries()).map(([key, data]) => {
      const [year, month] = key.split('-').map(Number);
      const date = new Date(year, month, 1);
      return {
        period: key,
        count: data.count,
        value: data.value,
        label: date.toLocaleDateString('en-US', { month: 'short' }),
      };
    });
  }

  private static calculateTopPerformers(coins: Coin[]) {
    return coins
      .filter(coin => coin.purchasePrice && coin.purchasePrice > 0)
      .sort((a, b) => (b.purchasePrice || 0) - (a.purchasePrice || 0))
      .slice(0, 10)
      .map(coin => ({
        coin,
        value: coin.purchasePrice || 0,
        // Note: For real appreciation calculation, we'd need current market values
        appreciation: undefined,
      }));
  }

  private static generateInsights(coins: Coin[]) {
    const insights = [];
    
    // Growth insight
    const totalValue = coins.reduce((sum, coin) => sum + (coin.purchasePrice || 0), 0);
    if (totalValue > 1000) {
      insights.push({
        type: 'value' as const,
        title: 'Strong Collection Value',
        description: `Your collection is worth over $${Math.round(totalValue).toLocaleString()}`,
        metric: `$${Math.round(totalValue).toLocaleString()}`,
      });
    }

    // Diversity insight
    const countries = new Set(coins.map(coin => coin.country).filter(Boolean));
    if (countries.size >= 5) {
      insights.push({
        type: 'diversity' as const,
        title: 'Global Collection',
        description: `You have coins from ${countries.size} different countries`,
        metric: `${countries.size} countries`,
      });
    }

    // Activity insight
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCoins = coins.filter(coin => new Date(coin.createdAt) >= thirtyDaysAgo);
    if (recentCoins.length > 0) {
      insights.push({
        type: 'activity' as const,
        title: 'Active Collector',
        description: `You've added ${recentCoins.length} coins in the last 30 days`,
        metric: `+${recentCoins.length}`,
      });
    }

    // Historical span insight
    const years = coins.map(coin => coin.year).filter(Boolean);
    if (years.length > 0) {
      const span = Math.max(...years) - Math.min(...years);
      if (span >= 50) {
        insights.push({
          type: 'diversity' as const,
          title: 'Historical Range',
          description: `Your collection spans ${span} years of history`,
          metric: `${span} years`,
        });
      }
    }

    return insights;
  }
}