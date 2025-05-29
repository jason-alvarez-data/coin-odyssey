"use client";

import { useState, useEffect } from 'react';
import { Coin, SearchField, GradeFilter, ValueFilter } from '@/types/coin';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';

interface CollectionTableProps {
  searchQuery: string;
  searchField: SearchField;
  gradeFilter: GradeFilter;
  valueFilter: ValueFilter;
}

type SupabaseCoin = Database['public']['Tables']['coins']['Row'];

// Convert Supabase coin to our Coin type
const mapSupabaseCoinToCoin = (coin: SupabaseCoin): Coin => ({
  id: coin.id,
  collectionId: coin.collection_id,
  denomination: coin.denomination,
  year: coin.year,
  mintMark: coin.mint_mark,
  grade: coin.grade,
  purchasePrice: coin.purchase_price,
  purchaseDate: new Date(coin.purchase_date),
  notes: coin.notes,
  images: coin.images,
  faceValue: coin.face_value,
  currentMarketValue: coin.current_market_value,
  lastValueUpdate: coin.last_value_update ? new Date(coin.last_value_update) : null
});

export default function CollectionTable({
  searchQuery,
  searchField,
  gradeFilter,
  valueFilter,
}: CollectionTableProps) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof Coin>('purchaseDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Function to handle column sorting
  const handleSort = (column: keyof Coin) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Function to fetch coins from Supabase
  const fetchCoins = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('coins')
        .select('*')
        .order(sortColumn === 'purchaseDate' ? 'purchase_date' : sortColumn, { ascending: sortDirection === 'asc' });

      // Apply search filter
      if (searchQuery) {
        if (searchField === 'all') {
          query = query.or(
            `denomination.ilike.%${searchQuery}%,grade.ilike.%${searchQuery}%,mint_mark.ilike.%${searchQuery}%,year.eq.${
              !isNaN(parseInt(searchQuery)) ? parseInt(searchQuery) : 0
            }`
          );
        } else if (searchField === 'year' && !isNaN(parseInt(searchQuery))) {
          query = query.eq('year', parseInt(searchQuery));
        } else {
          query = query.ilike(searchField, `%${searchQuery}%`);
        }
      }

      // Apply grade filter
      if (gradeFilter) {
        const [high, low] = gradeFilter.split(' to ');
        query = query.gte('grade', low).lte('grade', high);
      }

      // Apply value filter - now using current_market_value instead of purchase_price
      if (valueFilter) {
        switch (valueFilter) {
          case 'Under $10':
            query = query.lt('current_market_value', 10);
            break;
          case '$10 - $50':
            query = query.gte('current_market_value', 10).lt('current_market_value', 50);
            break;
          case '$50 - $100':
            query = query.gte('current_market_value', 50).lt('current_market_value', 100);
            break;
          case '$100 - $500':
            query = query.gte('current_market_value', 100).lt('current_market_value', 500);
            break;
          case 'Over $500':
            query = query.gte('current_market_value', 500);
            break;
        }
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      setCoins(data.map(mapSupabaseCoinToCoin));
    } catch (error) {
      console.error('Error fetching coins:', error);
      setError('Failed to fetch coins');
    } finally {
      setLoading(false);
    }
  };

  // Fetch coins when filters or sort changes
  useEffect(() => {
    fetchCoins();
  }, [searchQuery, searchField, gradeFilter, valueFilter, sortColumn, sortDirection]);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400">
        Loading coins...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-[#2a2a2a] text-white">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="px-4 py-2">Image</th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('denomination')}>
              Denomination {sortColumn === 'denomination' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('year')}>
              Year {sortColumn === 'year' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('mintMark')}>
              Mint Mark {sortColumn === 'mintMark' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('grade')}>
              Grade {sortColumn === 'grade' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-2">Face Value</th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('currentMarketValue')}>
              Market Value {sortColumn === 'currentMarketValue' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('purchaseDate')}>
              Purchase Date {sortColumn === 'purchaseDate' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => (
            <tr key={coin.id} className="border-b border-gray-700 hover:bg-[#3a3a3a]">
              <td className="px-4 py-2">
                {coin.images && coin.images.length > 0 && (
                  <img src={coin.images[0]} alt={`${coin.year} ${coin.denomination}`} className="w-12 h-12 object-cover rounded" />
                )}
              </td>
              <td className="px-4 py-2">{coin.denomination}</td>
              <td className="px-4 py-2">{coin.year}</td>
              <td className="px-4 py-2">{coin.mintMark || '-'}</td>
              <td className="px-4 py-2">{coin.grade || '-'}</td>
              <td className="px-4 py-2">${coin.faceValue?.toFixed(2) || '-'}</td>
              <td className="px-4 py-2">
                ${coin.currentMarketValue?.toFixed(2) || '-'}
                {coin.lastValueUpdate && (
                  <span className="text-xs text-gray-400 ml-2" title={coin.lastValueUpdate.toLocaleString()}>
                    ({formatDistanceToNow(coin.lastValueUpdate, { addSuffix: true })})
                  </span>
                )}
              </td>
              <td className="px-4 py-2">{coin.purchaseDate.toLocaleDateString()}</td>
              <td className="px-4 py-2">
                <button className="text-blue-500 hover:text-blue-400 mr-2">Edit</button>
                <button className="text-red-500 hover:text-red-400">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 