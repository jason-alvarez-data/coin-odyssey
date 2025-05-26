"use client";

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import WorldMap from '@/components/WorldMap'

// Sample data - replace with actual data from Supabase
const sampleCollectedCountries = {
  "United States": 5,
  "Canada": 3,
  "United Kingdom": 2,
  "France": 1,
  "Germany": 4,
  "Australia": 2,
  "Japan": 3,
  "Brazil": 1,
  "China": 2,
  "India": 1,
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [collectedCountries, setCollectedCountries] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      {user && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div>
                <h2 className="text-sm text-gray-400">Total Coins</h2>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div>
                <h2 className="text-sm text-gray-400">Countries</h2>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div>
                <h2 className="text-sm text-gray-400">Years Span</h2>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div>
                <h2 className="text-sm text-gray-400">Estimated Value</h2>
                <p className="text-2xl font-bold">$0</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Collection Distribution</h2>
              <WorldMap collectedCountries={collectedCountries} />
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <p>Welcome to Coin Odyssey! Start by adding your first coin.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
            <div className="space-y-4">
              <div className="border-b border-gray-700 pb-4">
                <p className="text-gray-300">Email: {user.email}</p>
                <p className="text-gray-300">Last Sign In: {new Date(user.last_sign_in_at || '').toLocaleString()}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}