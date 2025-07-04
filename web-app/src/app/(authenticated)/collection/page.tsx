"use client";

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Header from '@/components/layout/Header'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { getDisplayCurrency, getDisplayGrade, getDisplayMintMark, formatSortableValue } from '@/utils/coinUtils'

interface Coin {
  id: string;
  denomination: string;
  year: number;
  mint_mark?: string;
  grade?: string;
  purchase_price?: number;
  face_value: number;
  current_market_value?: number;
  purchase_date: string;
  notes?: string;
  images?: string[];
  title?: string;
  country?: string;
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
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null)
  const [selectedCoins, setSelectedCoins] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedCoins = (coinsToSort: Coin[]) => {
    if (!sortConfig) return coinsToSort;

    return [...coinsToSort].sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue: any;
      let bValue: any;

      switch (key) {
        case 'purchase_date':
          aValue = a.purchase_date ? new Date(a.purchase_date).getTime() : 0;
          bValue = b.purchase_date ? new Date(b.purchase_date).getTime() : 0;
          break;
        case 'face_value':
          aValue = a.face_value || 0;
          bValue = b.face_value || 0;
          break;
        case 'purchase_price':
          aValue = a.purchase_price || 0;
          bValue = b.purchase_price || 0;
          break;
        case 'current_market_value':
          aValue = a.current_market_value || 0;
          bValue = b.current_market_value || 0;
          break;
        case 'year':
          aValue = a.year || 0;
          bValue = b.year || 0;
          break;
        case 'title':
          aValue = (a.title || '').toLowerCase();
          bValue = (b.title || '').toLowerCase();
          break;
        case 'denomination':
          aValue = a.denomination.toLowerCase();
          bValue = b.denomination.toLowerCase();
          break;
        case 'mint_mark':
          aValue = (a.mint_mark || '').toLowerCase();
          bValue = (b.mint_mark || '').toLowerCase();
          break;
        case 'grade':
          aValue = (a.grade || '').toLowerCase();
          bValue = (b.grade || '').toLowerCase();
          break;
        case 'country':
          aValue = (a.country || '').toLowerCase();
          bValue = (b.country || '').toLowerCase();
          break;
        case 'notes':
          aValue = (a.notes || '').toLowerCase();
          bValue = (b.notes || '').toLowerCase();
          break;
        default:
          aValue = formatSortableValue(a[key as keyof Coin]);
          bValue = formatSortableValue(b[key as keyof Coin]);
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCoins(paginatedCoins.map(coin => coin.id));
    } else {
      setSelectedCoins([]);
    }
  };

  const handleSelectCoin = (coinId: string, checked: boolean) => {
    if (checked) {
      setSelectedCoins([...selectedCoins, coinId]);
    } else {
      setSelectedCoins(selectedCoins.filter(id => id !== coinId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCoins.length === 0) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('coins')
        .delete()
        .in('id', selectedCoins);

      if (error) throw error;

      // Remove deleted coins from local state
      setCoins(coins.filter(coin => !selectedCoins.includes(coin.id)));
      setSelectedCoins([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error deleting coins:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const coinsToExport = coins.filter(coin => selectedCoins.includes(coin.id));
    const csvContent = [
      ['Title', 'Denomination', 'Year', 'Mint Mark', 'Grade', 'Face Value', 'Purchase Price', 'Current Value', 'Country', 'Purchase Date', 'Notes'],
      ...coinsToExport.map(coin => [
        coin.title || '',
        coin.denomination || '',
        coin.year?.toString() || '',
        coin.mint_mark || '',
        coin.grade || '',
        coin.face_value?.toString() || '',
        coin.purchase_price?.toString() || '',
        coin.current_market_value?.toString() || '',
        coin.country || '',
        coin.purchase_date || '',
        coin.notes || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coin-collection-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const coinsToExport = coins.filter(coin => selectedCoins.includes(coin.id));
    
    // Create a simple HTML structure for PDF generation
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Coin Collection Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .coin-title { font-weight: bold; }
            .value { color: #2563eb; }
            .date { font-size: 0.9em; color: #666; }
          </style>
        </head>
        <body>
          <h1>Coin Collection Export</h1>
          <p>Export Date: ${new Date().toLocaleDateString()}</p>
          <p>Total Coins: ${coinsToExport.length}</p>
          
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Denomination</th>
                <th>Year</th>
                <th>Country</th>
                <th>Mint Mark</th>
                <th>Grade</th>
                <th>Face Value</th>
                <th>Purchase Price</th>
                <th>Current Value</th>
                <th>Purchase Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${coinsToExport.map(coin => `
                <tr>
                  <td class="coin-title">${coin.title || 'Untitled Coin'}</td>
                  <td>${coin.denomination || ''}</td>
                  <td>${coin.year || ''}</td>
                  <td>${coin.country || ''}</td>
                  <td>${coin.mint_mark || ''}</td>
                  <td>${coin.grade || ''}</td>
                  <td class="value">${coin.face_value ? formatCurrency(coin.face_value) : ''}</td>
                  <td class="value">${coin.purchase_price ? formatCurrency(coin.purchase_price) : ''}</td>
                  <td class="value">${coin.current_market_value ? formatCurrency(coin.current_market_value) : ''}</td>
                  <td class="date">${coin.purchase_date ? formatDate(coin.purchase_date) : ''}</td>
                  <td>${coin.notes || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
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

  // Apply sorting to filtered coins
  const sortedAndFilteredCoins = getSortedCoins(filteredCoins)

  // Calculate pagination
  const totalPages = Math.ceil(sortedAndFilteredCoins.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCoins = sortedAndFilteredCoins.slice(startIndex, startIndex + itemsPerPage)

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
              {sortedAndFilteredCoins.length} {sortedAndFilteredCoins.length === 1 ? 'coin' : 'coins'} in collection
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

        {/* Bulk Actions Toolbar */}
        {selectedCoins.length > 0 && (
          <div className="mb-6 bg-blue-600 bg-opacity-10 border border-blue-500 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-blue-400 font-medium">
                  {selectedCoins.length} coin{selectedCoins.length === 1 ? '' : 's'} selected
                </span>
                <button
                  onClick={() => setSelectedCoins([])}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  Export PDF
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Selected'}
                </button>
              </div>
            </div>
          </div>
        )}

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
        ) : sortedAndFilteredCoins.length === 0 ? (
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
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-[#2a2a2a] rounded-lg overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1400px]">
                  <thead className="bg-[#1e1e1e] text-gray-400">
                    <tr>
                      <th className="px-4 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedCoins.length === paginatedCoins.length && paginatedCoins.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </th>
                      <th 
                        className="px-4 py-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors select-none"
                        onClick={() => handleSort('purchase_date')}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">Date</span>
                          {sortConfig?.key === 'purchase_date' && (
                            <span className="text-blue-400 text-sm">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors select-none"
                        onClick={() => handleSort('title')}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">Coin Details</span>
                          {sortConfig?.key === 'title' && (
                            <span className="text-blue-400 text-sm">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors select-none"
                        onClick={() => handleSort('year')}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">Year</span>
                          {sortConfig?.key === 'year' && (
                            <span className="text-blue-400 text-sm">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors select-none"
                        onClick={() => handleSort('country')}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">Country</span>
                          {sortConfig?.key === 'country' && (
                            <span className="text-blue-400 text-sm">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors select-none"
                        onClick={() => handleSort('mint_mark')}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">Mint</span>
                          {sortConfig?.key === 'mint_mark' && (
                            <span className="text-blue-400 text-sm">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors select-none"
                        onClick={() => handleSort('grade')}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">Grade</span>
                          {sortConfig?.key === 'grade' && (
                            <span className="text-blue-400 text-sm">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors select-none"
                        onClick={() => handleSort('face_value')}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">Face Value</span>
                          {sortConfig?.key === 'face_value' && (
                            <span className="text-blue-400 text-sm">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors select-none"
                        onClick={() => handleSort('purchase_price')}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">Purchase Price</span>
                          {sortConfig?.key === 'purchase_price' && (
                            <span className="text-blue-400 text-sm">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors select-none"
                        onClick={() => handleSort('current_market_value')}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">Current Value</span>
                          {sortConfig?.key === 'current_market_value' && (
                            <span className="text-blue-400 text-sm">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors select-none"
                        onClick={() => handleSort('notes')}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">Notes</span>
                          {sortConfig?.key === 'notes' && (
                            <span className="text-blue-400 text-sm">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-4 text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    {paginatedCoins.map((coin, index) => (
                      <tr 
                        key={coin.id} 
                        className={`border-t border-[#1e1e1e] hover:bg-[#353535] transition-colors ${
                          index % 2 === 0 ? 'bg-[#2a2a2a]' : 'bg-[#262626]'
                        }`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedCoins.includes(coin.id)}
                            onChange={(e) => handleSelectCoin(coin.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {formatDate(coin.purchase_date)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            {coin.images && coin.images.length > 0 && (
                              <div className="flex-shrink-0">
                                <img 
                                  src={coin.images[0]} 
                                  alt={coin.title || 'Coin'}
                                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-600"
                                />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium">
                                {coin.title || 'Untitled Coin'}
                              </div>
                              {coin.denomination && (
                                <div className="text-xs text-gray-400">
                                  {coin.denomination}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium text-sm">
                          {coin.year}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={coin.country ? 'text-white' : 'text-gray-500 italic'}>
                            {coin.country || 'Not specified'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={coin.mint_mark ? 'text-white' : 'text-gray-500 italic'}>
                            {getDisplayMintMark(coin.mint_mark)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={coin.grade ? 'text-white' : 'text-gray-500 italic'}>
                            {getDisplayGrade(coin.grade)}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-medium text-sm">
                          <span className={coin.face_value ? 'text-green-400' : 'text-gray-500 italic'}>
                            {getDisplayCurrency(coin.face_value, coin.denomination)}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-medium text-sm">
                          <span className={coin.purchase_price ? 'text-blue-400' : 'text-gray-500 italic'}>
                            {coin.purchase_price ? formatCurrency(coin.purchase_price) : 'Not specified'}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-medium text-sm">
                          <span className={coin.current_market_value ? 'text-yellow-400' : 'text-gray-500 italic'}>
                            {coin.current_market_value ? formatCurrency(coin.current_market_value) : 'Not specified'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="max-w-24 truncate">
                            <span className={coin.notes ? 'text-white' : 'text-gray-500 italic'} title={coin.notes || 'No notes'}>
                              {coin.notes || 'No notes'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEdit(coin.id)}
                              className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => setShowDeleteConfirm(coin.id)}
                              className="text-red-400 hover:text-red-300 transition-colors text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {/* Mobile Bulk Actions */}
              {selectedCoins.length > 0 && (
                <div className="bg-blue-600 bg-opacity-10 border border-blue-500 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 text-sm font-medium">
                      {selectedCoins.length} selected
                    </span>
                                         <div className="flex space-x-2">
                       <button
                         onClick={handleExportCSV}
                         className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                       >
                         CSV
                       </button>
                       <button
                         onClick={handleExportPDF}
                         className="px-3 py-1 bg-purple-600 text-white rounded text-sm"
                       >
                         PDF
                       </button>
                       <button
                         onClick={handleBulkDelete}
                         disabled={isDeleting}
                         className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                       >
                         Delete
                       </button>
                     </div>
                  </div>
                </div>
              )}

              {paginatedCoins.map((coin, index) => (
                <div
                  key={coin.id}
                  className={`bg-[#2a2a2a] rounded-lg p-4 border-l-4 ${
                    selectedCoins.includes(coin.id) ? 'border-blue-500 bg-blue-600 bg-opacity-10' : 'border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedCoins.includes(coin.id)}
                        onChange={(e) => handleSelectCoin(coin.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      {coin.images && coin.images.length > 0 && (
                        <img 
                          src={coin.images[0]} 
                          alt={coin.title || 'Coin'}
                          className="w-12 h-12 rounded-lg object-cover border-2 border-gray-600"
                        />
                      )}
                      <div>
                        <h3 className="text-white font-medium text-sm">
                          {coin.title || 'Untitled Coin'}
                        </h3>
                        <p className="text-gray-400 text-xs">{coin.denomination}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEdit(coin.id)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(coin.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Year:</span>
                      <span className="text-white ml-2">{coin.year}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Country:</span>
                      <span className="text-white ml-2">{coin.country || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Mint Mark:</span>
                      <span className="text-white ml-2">{getDisplayMintMark(coin.mint_mark)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Grade:</span>
                      <span className="text-white ml-2">{getDisplayGrade(coin.grade)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Face Value:</span>
                      <span className="text-green-400 ml-2 font-medium">
                        {getDisplayCurrency(coin.face_value, coin.denomination)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Purchase Price:</span>
                      <span className="text-blue-400 ml-2 font-medium">
                        {coin.purchase_price ? formatCurrency(coin.purchase_price) : 'Not specified'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Current Value:</span>
                      <span className="text-yellow-400 ml-2 font-medium">
                        {coin.current_market_value ? formatCurrency(coin.current_market_value) : 'Not specified'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Purchase Date:</span>
                      <span className="text-white ml-2">{formatDate(coin.purchase_date)}</span>
                    </div>
                    {coin.notes && (
                      <div className="col-span-2">
                        <span className="text-gray-400">Notes:</span>
                        <p className="text-white mt-1 text-sm">{coin.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex items-center justify-between px-4 py-3 bg-[#2a2a2a] rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center text-sm text-gray-400">
                  <p>
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, sortedAndFilteredCoins.length)}
                    </span>{' '}
                    of <span className="font-medium">{sortedAndFilteredCoins.length}</span> coins
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