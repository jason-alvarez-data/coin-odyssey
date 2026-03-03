// src/services/geographicService.ts
import { CoinService } from './coinService';
import { Coin } from '../types/coin';
import { Logger } from './logger';

export interface ContinentData {
  name: string;
  countries: number;
  coins: number;
  icon: string;
  countries_detail: CountryData[];
}

export interface CountryData {
  name: string;
  flag: string;
  coins: number;
}

export interface GeographicData {
  totalCoins: number;
  totalCountries: number;
  totalContinents: number;
  continents: ContinentData[];
  insights: {
    mostCollectedCountry: CountryData | null;
    rarestRegion: string;
    collectionGoal: {
      target: number;
      current: number;
      percentage: number;
    };
  };
}

export class GeographicService {
  // Map countries to continents and flags
  private static countryToContinent: Record<string, { continent: string; flag: string }> = {
    // North America
    'United States': { continent: 'North America', flag: '🇺🇸' },
    'USA': { continent: 'North America', flag: '🇺🇸' },
    'US': { continent: 'North America', flag: '🇺🇸' },
    'Canada': { continent: 'North America', flag: '🇨🇦' },
    'Mexico': { continent: 'North America', flag: '🇲🇽' },

    // Europe
    'United Kingdom': { continent: 'Europe', flag: '🇬🇧' },
    'UK': { continent: 'Europe', flag: '🇬🇧' },
    'Great Britain': { continent: 'Europe', flag: '🇬🇧' },
    'Britain': { continent: 'Europe', flag: '🇬🇧' },
    'England': { continent: 'Europe', flag: '🇬🇧' },
    'Germany': { continent: 'Europe', flag: '🇩🇪' },
    'France': { continent: 'Europe', flag: '🇫🇷' },
    'Italy': { continent: 'Europe', flag: '🇮🇹' },
    'Spain': { continent: 'Europe', flag: '🇪🇸' },
    'Netherlands': { continent: 'Europe', flag: '🇳🇱' },
    'Switzerland': { continent: 'Europe', flag: '🇨🇭' },
    'Austria': { continent: 'Europe', flag: '🇦🇹' },
    'Belgium': { continent: 'Europe', flag: '🇧🇪' },
    'Portugal': { continent: 'Europe', flag: '🇵🇹' },
    'Greece': { continent: 'Europe', flag: '🇬🇷' },
    'Poland': { continent: 'Europe', flag: '🇵🇱' },
    'Czech Republic': { continent: 'Europe', flag: '🇨🇿' },
    'Hungary': { continent: 'Europe', flag: '🇭🇺' },
    'Denmark': { continent: 'Europe', flag: '🇩🇰' },
    'Sweden': { continent: 'Europe', flag: '🇸🇪' },
    'Norway': { continent: 'Europe', flag: '🇳🇴' },
    'Finland': { continent: 'Europe', flag: '🇫🇮' },
    'Ireland': { continent: 'Europe', flag: '🇮🇪' },

    // Asia
    'Japan': { continent: 'Asia', flag: '🇯🇵' },
    'China': { continent: 'Asia', flag: '🇨🇳' },
    'India': { continent: 'Asia', flag: '🇮🇳' },
    'South Korea': { continent: 'Asia', flag: '🇰🇷' },
    'Korea': { continent: 'Asia', flag: '🇰🇷' },
    'Thailand': { continent: 'Asia', flag: '🇹🇭' },
    'Vietnam': { continent: 'Asia', flag: '🇻🇳' },
    'Philippines': { continent: 'Asia', flag: '🇵🇭' },
    'Indonesia': { continent: 'Asia', flag: '🇮🇩' },
    'Malaysia': { continent: 'Asia', flag: '🇲🇾' },
    'Singapore': { continent: 'Asia', flag: '🇸🇬' },

    // Oceania
    'Australia': { continent: 'Oceania', flag: '🇦🇺' },
    'New Zealand': { continent: 'Oceania', flag: '🇳🇿' },
    'Fiji': { continent: 'Oceania', flag: '🇫🇯' },

    // South America
    'Brazil': { continent: 'South America', flag: '🇧🇷' },
    'Argentina': { continent: 'South America', flag: '🇦🇷' },
    'Chile': { continent: 'South America', flag: '🇨🇱' },
    'Peru': { continent: 'South America', flag: '🇵🇪' },
    'Colombia': { continent: 'South America', flag: '🇨🇴' },
    'Venezuela': { continent: 'South America', flag: '🇻🇪' },

    // Africa
    'South Africa': { continent: 'Africa', flag: '🇿🇦' },
    'Egypt': { continent: 'Africa', flag: '🇪🇬' },
    'Morocco': { continent: 'Africa', flag: '🇲🇦' },
    'Nigeria': { continent: 'Africa', flag: '🇳🇬' },
    'Kenya': { continent: 'Africa', flag: '🇰🇪' },
  };

  private static continentIcons: Record<string, string> = {
    'North America': '🌎',
    'South America': '🌎',
    'Europe': '🌍',
    'Africa': '🌍',
    'Asia': '🌏',
    'Oceania': '🌏',
  };

  static async getGeographicData(): Promise<GeographicData> {
    try {
      const coins = await CoinService.getUserCoins();
      
      if (coins.length === 0) {
        return this.getEmptyGeographicData();
      }

      return this.processGeographicData(coins);
    } catch (error) {
      Logger.error('Error getting geographic data', error);
      return this.getEmptyGeographicData();
    }
  }

  private static getEmptyGeographicData(): GeographicData {
    return {
      totalCoins: 0,
      totalCountries: 0,
      totalContinents: 0,
      continents: [],
      insights: {
        mostCollectedCountry: null,
        rarestRegion: 'No data',
        collectionGoal: {
          target: 50,
          current: 0,
          percentage: 0,
        },
      },
    };
  }

  private static processGeographicData(coins: Coin[]): GeographicData {
    // Count coins by country
    const countryCount = new Map<string, number>();
    
    coins.forEach(coin => {
      if (coin.country) {
        const normalizedCountry = this.normalizeCountryName(coin.country);
        countryCount.set(normalizedCountry, (countryCount.get(normalizedCountry) || 0) + 1);
      }
    });

    // Group countries by continent
    const continentData = new Map<string, { countries: Set<string>; coins: number }>();
    
    countryCount.forEach((coinCount, country) => {
      const countryInfo = this.countryToContinent[country];
      const continent = countryInfo?.continent || 'Other';
      
      if (!continentData.has(continent)) {
        continentData.set(continent, { countries: new Set(), coins: 0 });
      }
      
      const data = continentData.get(continent)!;
      data.countries.add(country);
      data.coins += coinCount;
    });

    // Build continent array
    const continents: ContinentData[] = Array.from(continentData.entries())
      .map(([continentName, data]) => {
        const countries_detail: CountryData[] = Array.from(data.countries)
          .map(country => ({
            name: country,
            flag: this.countryToContinent[country]?.flag || '🏳️',
            coins: countryCount.get(country) || 0,
          }))
          .sort((a, b) => b.coins - a.coins);

        return {
          name: continentName,
          countries: data.countries.size,
          coins: data.coins,
          icon: this.continentIcons[continentName] || '🌍',
          countries_detail,
        };
      })
      .sort((a, b) => b.coins - a.coins);

    // Calculate insights
    const mostCollectedCountry = Array.from(countryCount.entries())
      .sort((a, b) => b[1] - a[1])[0];

    const rarestRegion = continents.length > 0 
      ? continents[continents.length - 1].name 
      : 'No data';

    const totalCountries = countryCount.size;
    const collectionGoal = {
      target: 50,
      current: totalCountries,
      percentage: Math.round((totalCountries / 50) * 100),
    };

    return {
      totalCoins: coins.length,
      totalCountries,
      totalContinents: continents.length,
      continents,
      insights: {
        mostCollectedCountry: mostCollectedCountry ? {
          name: mostCollectedCountry[0],
          flag: this.countryToContinent[mostCollectedCountry[0]]?.flag || '🏳️',
          coins: mostCollectedCountry[1],
        } : null,
        rarestRegion: `${rarestRegion} (${continents[continents.length - 1]?.countries || 0} countries)`,
        collectionGoal,
      },
    };
  }

  private static normalizeCountryName(country: string): string {
    // Handle common variations
    const normalized = country.trim();
    
    // Check if we have a direct match
    if (this.countryToContinent[normalized]) {
      return normalized;
    }
    
    // Check common variations
    const variations: Record<string, string> = {
      'US': 'United States',
      'USA': 'United States',
      'UK': 'United Kingdom',
      'Great Britain': 'United Kingdom',
      'Britain': 'United Kingdom',
      'England': 'United Kingdom',
    };
    
    return variations[normalized] || normalized;
  }
}