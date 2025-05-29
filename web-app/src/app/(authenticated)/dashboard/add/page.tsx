'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';

export default function AddCoinPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    country: '',
    unit: 'Cent',
    type: 'Regular Issue',
    series: '',
    storage: 'Clear Coin Bin',
    mark: '',
    purchasePrice: '0.00',
    year: new Date().getFullYear().toString(),
    value: '',
    mint: '',
    format: 'Single',
    region: 'Americas',
    status: 'Owned',
    dateCollected: new Date().toISOString().split('T')[0],
    quantity: '1'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add Supabase integration
    console.log(formData);
  };

  return (
    <div className="flex-1 bg-[#1e1e1e] text-white">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Add New Coin</h1>
          <Header />
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Title:</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Country:</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Search country..."
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Unit:</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              >
                <option value="Cent">Cent</option>
                <option value="Dollar">Dollar</option>
                <option value="Euro">Euro</option>
                {/* Add more options as needed */}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Type:</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              >
                <option value="Regular Issue">Regular Issue</option>
                <option value="Commemorative">Commemorative</option>
                {/* Add more options as needed */}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Series:</label>
              <input
                type="text"
                name="series"
                value={formData.series}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Storage:</label>
              <select
                name="storage"
                value={formData.storage}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              >
                <option value="Clear Coin Bin">Clear Coin Bin</option>
                <option value="Album">Album</option>
                <option value="Display Case">Display Case</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Mark:</label>
              <input
                type="text"
                name="mark"
                value={formData.mark}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Purchase Price:</label>
              <input
                type="number"
                step="0.01"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Year:</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Value:</label>
              <input
                type="number"
                step="0.01"
                name="value"
                value={formData.value}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Mint:</label>
              <input
                type="text"
                name="mint"
                value={formData.mint}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Format:</label>
              <select
                name="format"
                value={formData.format}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              >
                <option value="Single">Single</option>
                <option value="Set">Set</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Region:</label>
              <select
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              >
                <option value="Americas">Americas</option>
                <option value="Europe">Europe</option>
                <option value="Asia">Asia</option>
                <option value="Africa">Africa</option>
                <option value="Oceania">Oceania</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Status:</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              >
                <option value="Owned">Owned</option>
                <option value="Wishlist">Wishlist</option>
                <option value="On Order">On Order</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Date Collected:</label>
              <input
                type="date"
                name="dateCollected"
                value={formData.dateCollected}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Quantity:</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                className="w-full bg-[#2a2a2a] rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>

          {/* Image Upload Section - Full Width */}
          <div className="col-span-2 grid grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Obverse (Front)</label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
                <div className="text-gray-400">Click to upload image</div>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Reverse (Back)</label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
                <div className="text-gray-400">Click to upload image</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="col-span-2 flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Coin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 