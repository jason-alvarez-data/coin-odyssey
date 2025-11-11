"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ClockIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

interface RecentCoin {
  id: string;
  title: string;
  denomination: string;
  year: number;
  country: string;
  purchase_price: number;
  created_at: string;
  mint_mark?: string;
}

export default function RecentActivityFeed() {
  const [recentCoins, setRecentCoins] = useState<RecentCoin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('recent-coins')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coins'
        },
        () => {
          loadRecentActivity();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRecentActivity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's collections
      const { data: collections } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', user.id);

      if (!collections || collections.length === 0) {
        setRecentCoins([]);
        setLoading(false);
        return;
      }

      // Get recent coins (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: coins, error } = await supabase
        .from('coins')
        .select('id, title, denomination, year, country, purchase_price, created_at, mint_mark')
        .in('collection_id', collections.map(c => c.id))
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading recent activity:', error);
        return;
      }

      setRecentCoins(coins || []);
    } catch (error) {
      console.error('Error in loadRecentActivity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">Last 30 days</p>
      </div>

      {recentCoins.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <PlusCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No recent activity</p>
          <p className="text-sm text-gray-500 mt-1">Add coins to see them here</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {recentCoins.map((coin) => (
            <div
              key={coin.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🪙</span>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {coin.title || `${coin.year} ${coin.denomination}`}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{coin.country}</span>
                        {coin.mint_mark && (
                          <>
                            <span>•</span>
                            <span>Mint: {coin.mint_mark}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{coin.year}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4">
                  {coin.purchase_price && (
                    <div className="text-sm font-medium text-gray-900">
                      ${coin.purchase_price.toFixed(2)}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(coin.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {recentCoins.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{recentCoins.length}</span> {recentCoins.length === 1 ? 'coin' : 'coins'} added recently
          </div>
        </div>
      )}
    </div>
  );
}
