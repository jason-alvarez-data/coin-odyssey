'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';

interface Coin {
  id: string;
  title: string;
  denomination: string;
  year: number;
  mint_mark?: string;
  grade?: string;
  face_value: number;
  purchase_price?: number;
  purchase_date: string;
  notes?: string;
  country?: string;
}

export default function EditCoinPage() {
  const params = useParams();
  const router = useRouter();
  const [coin, setCoin] = useState<Coin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCoin();
  }, []);

  const fetchCoin = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coins')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setCoin(data);
    } catch (error) {
      console.error('Error fetching coin:', error);
      setError('Could not load coin details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coin) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('coins')
        .update({
          title: coin.title,
          denomination: coin.denomination,
          year: coin.year,
          mint_mark: coin.mint_mark,
          grade: coin.grade,
          face_value: coin.face_value,
          purchase_price: coin.purchase_price,
          purchase_date: coin.purchase_date,
          notes: coin.notes,
          country: coin.country,
        })
        .eq('id', coin.id);

      if (error) throw error;
      router.push('/collection');
    } catch (error) {
      console.error('Error updating coin:', error);
      setError('Failed to update coin');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCoin(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#1e1e1e] text-white p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Coin</h1>
          <Header />
        </div>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="flex-1 bg-[#1e1e1e] text-white p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Coin</h1>
          <Header />
        </div>
        <div className="text-red-400">Coin not found</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#1e1e1e] text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Coin</h1>
        <Header />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="bg-[#2a2a2a] rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={coin.title}
              onChange={handleInputChange}
              required
              className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Year <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="year"
                value={coin.year}
                onChange={handleInputChange}
                required
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Face Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="face_value"
                value={coin.face_value}
                onChange={handleInputChange}
                required
                step="0.01"
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <input
                type="text"
                name="denomination"
                value={coin.denomination || ''}
                onChange={handleInputChange}
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Country</label>
              <input
                type="text"
                name="country"
                value={coin.country || ''}
                onChange={handleInputChange}
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mint Mark</label>
              <input
                type="text"
                name="mint_mark"
                value={coin.mint_mark || ''}
                onChange={handleInputChange}
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Grade</label>
              <input
                type="text"
                name="grade"
                value={coin.grade || ''}
                onChange={handleInputChange}
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Purchase Price</label>
              <input
                type="number"
                name="purchase_price"
                value={coin.purchase_price || ''}
                onChange={handleInputChange}
                step="0.01"
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Date Acquired <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="purchase_date"
                value={coin.purchase_date}
                onChange={handleInputChange}
                required
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Notes</label>
            <textarea
              name="notes"
              value={coin.notes || ''}
              onChange={handleInputChange}
              rows={4}
              className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/collection')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 