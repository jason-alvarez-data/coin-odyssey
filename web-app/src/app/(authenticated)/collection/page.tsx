"use client";

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Header from '@/components/layout/Header'

interface Coin {
  id: string;
  denomination: string;
  year: number;
  mint_mark?: string;
  grade?: string;
  purchase_price: number;
  purchase_date: string;
  notes?: string;
  images?: string[];
}

export default function CollectionPage() {
  const [user, setUser] = useState<User | null>(null)
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        fetchCoins(user.id)
      }
    })
  }, [])

  const fetchCoins = async (userId: string) => {
    try {
      setLoading(true)
      // First get all collections for the user
      const { data: collections } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', userId)

      if (!collections?.length) {
        setCoins([])
        return
      }

      // Then get all coins from those collections
      const { data: coins } = await supabase
        .from('coins')
        .select('*')
        .in('collection_id', collections.map(c => c.id))
        .order('purchase_date', { ascending: false })

      setCoins(coins || [])
    } catch (error) {
      console.error('Error fetching coins:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 bg-[#1e1e1e]">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">My Collection</h1>
          <Header />
        </div>

        {loading ? (
          <div className="text-gray-400">Loading collection...</div>
        ) : coins.length === 0 ? (
          <div className="bg-[#2a2a2a] rounded-lg p-6 text-center">
            <p className="text-gray-400 mb-4">Your collection is empty</p>
            <button 
              onClick={() => window.location.href = '/dashboard/add'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Coin
            </button>
          </div>
        ) : (
          <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#1e1e1e] text-gray-400">
                <tr>
                  <th className="px-6 py-4">Date Acquired</th>
                  <th className="px-6 py-4">Denomination</th>
                  <th className="px-6 py-4">Year</th>
                  <th className="px-6 py-4">Mint Mark</th>
                  <th className="px-6 py-4">Grade</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {coins.map((coin) => (
                  <tr key={coin.id} className="border-t border-[#1e1e1e] hover:bg-[#353535] transition-colors">
                    <td className="px-6 py-4">{new Date(coin.purchase_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{coin.denomination}</td>
                    <td className="px-6 py-4">{coin.year}</td>
                    <td className="px-6 py-4">{coin.mint_mark || '-'}</td>
                    <td className="px-6 py-4">{coin.grade || '-'}</td>
                    <td className="px-6 py-4">${coin.purchase_price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <button className="text-blue-400 hover:text-blue-300 mr-4">Edit</button>
                      <button className="text-red-400 hover:text-red-300">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 