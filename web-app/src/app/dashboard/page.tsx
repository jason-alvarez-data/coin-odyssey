"use client";

import { useState } from 'react';
import WorldMap from '@/components/WorldMap';

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
  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Collection Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-gray-800 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🪙</span>
            <div>
              <h2 className="text-sm text-gray-400">Total Coins</h2>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-800 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌍</span>
            <div>
              <h2 className="text-sm text-gray-400">Countries</h2>
              <p className="text-2xl font-bold">10</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <h2 className="text-sm text-gray-400">Years Span</h2>
              <p className="text-2xl font-bold">25</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <h2 className="text-sm text-gray-400">Estimated Value</h2>
              <p className="text-2xl font-bold">$250.00</p>
            </div>
          </div>
        </div>
      </div>

      {/* World Map Section */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Collection Map</h2>
        <div className="aspect-[16/9] bg-gray-700 rounded-lg overflow-hidden">
          <WorldMap collectedCountries={sampleCollectedCountries} />
        </div>
      </div>
    </div>
  );
}