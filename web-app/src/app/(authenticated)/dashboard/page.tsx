"use client";

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import WorldMap from '@/components/WorldMap'
import Header from '@/components/layout/Header'
import { getStandardizedCountryName } from '@/utils/countryMappings'

interface DashboardStats {
  totalCoins: number;
  totalCountries: number;
  yearsSpan: string;
  totalValue: number;
  countryDistribution: { [key: string]: number };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCoins: 0,
    totalCountries: 0,
    yearsSpan: '-',
    totalValue: 0,
    countryDistribution: {}
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchDashboardStats(user.id);
      }
    };

    fetchData();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:coins')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'coins',
      }, async (payload) => {
        // Refresh data when coins table changes
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await fetchDashboardStats(user.id);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchDashboardStats = async (userId: string) => {
    try {
      // Get all collections for the user
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', userId);

      if (collectionsError) throw collectionsError;
      if (!collections?.length) {
        setStats({
          totalCoins: 0,
          totalCountries: 0,
          yearsSpan: '-',
          totalValue: 0,
          countryDistribution: {}
        });
        return;
      }

      // Get all coins from user's collections
      const { data: coins, error: coinsError } = await supabase
        .from('coins')
        .select('*')
        .in('collection_id', collections.map(c => c.id));

      if (coinsError) throw coinsError;
      if (!coins) {
        setStats(prev => ({ ...prev, countryDistribution: {} }));
        return;
      }

      // Calculate stats
      const years = coins.map(coin => coin.year);
      const oldestYear = years.length ? Math.min(...years) : 0;
      const newestYear = years.length ? Math.max(...years) : 0;
      const yearsSpan = years.length ? `${oldestYear} - ${newestYear}` : '-';
      const totalValue = coins.reduce((sum, coin) => sum + (parseFloat(coin.purchase_price) || 0), 0);

      // Calculate country distribution with standardized names
      const countryDistribution = coins.reduce((acc: { [key: string]: number }, coin) => {
        if (coin.country) {
          const country = getStandardizedCountryName(coin.country);
          acc[country] = (acc[country] || 0) + 1;
        }
        return acc;
      }, {});

      setStats({
        totalCoins: coins.length,
        totalCountries: Object.keys(countryDistribution).length,
        yearsSpan,
        totalValue,
        countryDistribution
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Keep previous state on error
      setStats(prev => ({ ...prev }));
    }
  };

  return (
    <div className="flex-1 bg-[#1e1e1e]">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Collection Dashboard</h1>
          <Header />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#2a2a2a] p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-[#3b82f6] text-xl">🪙</span>
              <div>
                <h2 className="text-sm text-gray-400">Total Coins</h2>
                <p className="text-2xl font-bold text-[#3b82f6]">{stats.totalCoins}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#2a2a2a] p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-[#3b82f6] text-xl">🌎</span>
              <div>
                <h2 className="text-sm text-gray-400">Countries</h2>
                <p className="text-2xl font-bold text-[#3b82f6]">{stats.totalCountries}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#2a2a2a] p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-[#3b82f6] text-xl">📅</span>
              <div>
                <h2 className="text-sm text-gray-400">Years Range</h2>
                <p className="text-2xl font-bold text-[#3b82f6]">{stats.yearsSpan}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#2a2a2a] p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-[#3b82f6] text-xl">💰</span>
              <div>
                <h2 className="text-sm text-gray-400">Estimated Value</h2>
                <p className="text-2xl font-bold text-[#3b82f6]">${stats.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-4">Collection Map</h2>
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-[#2a2a2a] p-6 rounded-lg">
            <WorldMap collectedCountries={stats.countryDistribution} />
          </div>
        </div>
      </div>
    </div>
  );
} 