"use client";

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Header from '@/components/layout/Header'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface Coin {
  id: string;
  denomination: string;
  year: number;
  mint_mark?: string;
  grade?: string;
  purchase_price?: number;
  face_value: number;
  purchase_date: string;
  notes?: string;
  images?: string[];
  title?: string;
}

export default function CollectionPage() {
  const [user, setUser] = useState<User | null>(null)
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [isClearing, setIsClearing] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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

  const handleClearCollection = async () => {
    if (!user) return;
    
    try {
      setIsClearing(true);
      
      // First get all collections for the user
      const { data: collections } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', user.id);

      if (!collections?.length) return;

      // Delete all coins from those collections
      const { error } = await supabase
        .from('coins')
        .delete()
        .in('collection_id', collections.map(c => c.id));

      if (error) throw error;

      // Refresh the coins list
      setCoins([]);
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Error clearing collection:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDelete = async (coinId: string) => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('coins')
        .delete()
        .eq('id', coinId);

      if (error) throw error;

      // Remove the coin from the local state
      setCoins(coins.filter(coin => coin.id !== coinId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting coin:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (coinId: string) => {
    // Navigate to the edit page
    window.location.href = `/collection/edit/${coinId}`;
  };

  // Filter coins based on search query
  const filteredCoins = coins.filter(coin => {
    const searchLower = searchQuery.toLowerCase()
    return (
      coin.title?.toLowerCase().includes(searchLower) ||
      coin.denomination.toLowerCase().includes(searchLower) ||
      coin.year.toString().includes(searchQuery) ||
      coin.mint_mark?.toLowerCase().includes(searchLower) ||
      coin.grade?.toLowerCase().includes(searchLower)
    )
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredCoins.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCoins = filteredCoins.slice(startIndex, startIndex + itemsPerPage)

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  return (
    <div className="flex-1 bg-[#1e1e1e]">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Collection</h1>
            <p className="text-sm text-gray-400 mt-1">
              {filteredCoins.length} {filteredCoins.length === 1 ? 'coin' : 'coins'} in collection
            </p>
          </div>
          <div className="flex items-center gap-4">
            {coins.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={isClearing}
              >
                {isClearing ? 'Clearing...' : 'Clear Collection'}
              </button>
            )}
            <Header />
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search coins by title, denomination, year, mint mark, or grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#2a2a2a] text-white rounded-lg px-4 py-2 pl-10 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Clear Confirmation Dialog */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold text-white mb-4">Clear Collection</h2>
              <p className="text-gray-300 mb-6">
                Are you sure you want to clear your entire collection? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  disabled={isClearing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCollection}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  disabled={isClearing}
                >
                  {isClearing ? (
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
                      Clearing...
                    </>
                  ) : (
                    'Clear Collection'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold text-white mb-4">Delete Coin</h2>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this coin? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
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
                      Deleting...
                    </>
                  ) : (
                    'Delete Coin'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-gray-400">Loading collection...</div>
        ) : filteredCoins.length === 0 ? (
          <div className="bg-[#2a2a2a] rounded-lg p-6 text-center">
            {searchQuery ? (
              <p className="text-gray-400 mb-4">No coins found matching your search</p>
            ) : (
              <>
                <p className="text-gray-400 mb-4">Your collection is empty</p>
                <button 
                  onClick={() => window.location.href = '/dashboard/add'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Coin
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#1e1e1e] text-gray-400">
                  <tr>
                    <th className="px-6 py-4">Date Acquired</th>
                    <th className="px-6 py-4">Coin Details</th>
                    <th className="px-6 py-4">Year</th>
                    <th className="px-6 py-4">Mint Mark</th>
                    <th className="px-6 py-4">Grade</th>
                    <th className="px-6 py-4">Face Value</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {paginatedCoins.map((coin) => (
                    <tr key={coin.id} className="border-t border-[#1e1e1e] hover:bg-[#353535] transition-colors">
                      <td className="px-6 py-4">{formatDate(coin.purchase_date)}</td>
                      <td className="px-6 py-4">
                        <div className="text-base font-medium">{coin.title || 'Untitled Coin'}</div>
                        {coin.denomination && (
                          <div className="text-sm text-gray-400">{coin.denomination}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">{coin.year}</td>
                      <td className="px-6 py-4">{coin.mint_mark || '-'}</td>
                      <td className="px-6 py-4">{coin.grade || '-'}</td>
                      <td className="px-6 py-4">{formatCurrency(coin.face_value)}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleEdit(coin.id)}
                          className="text-blue-400 hover:text-blue-300 mr-4 transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(coin.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex items-center justify-between px-4 py-3 bg-[#2a2a2a] rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center text-sm text-gray-400">
                  <p>
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, filteredCoins.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredCoins.length}</span> coins
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="itemsPerPage" className="text-sm text-gray-400">
                    Items per page:
                  </label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-[#1e1e1e] text-white border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md bg-[#1e1e1e] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#353535] transition-colors"
                >
                  Previous
                </button>
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-md transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#1e1e1e] text-white hover:bg-[#353535]'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md bg-[#1e1e1e] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#353535] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 