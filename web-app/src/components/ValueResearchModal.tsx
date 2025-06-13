import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ValueResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValueSelect: (value: number) => void;
  coinInfo: {
    denomination: string;
    year: number;
    mintMark: string;
    grade: string;
  };
}

export default function ValueResearchModal({ isOpen, onClose, onValueSelect, coinInfo }: ValueResearchModalProps) {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API call
      const mockResults = [
        {
          grade: coinInfo.grade || 'MS-65',
          value: 125.00,
          source: 'PCGS Price Guide',
          date: '2024-03-20'
        },
        {
          grade: coinInfo.grade || 'MS-63',
          value: 85.00,
          source: 'NGC Price Guide',
          date: '2024-03-20'
        },
        {
          grade: coinInfo.grade || 'AU-58',
          value: 45.00,
          source: 'Recent Sales',
          date: '2024-03-19'
        }
      ];
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error fetching value data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-[#2a2a2a] p-6">
          <Dialog.Title className="text-xl font-medium text-white mb-4">
            Research Coin Value
          </Dialog.Title>

          <div className="space-y-4">
            {/* Search Info */}
            <div className="bg-[#1e1e1e] rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Coin Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Denomination:</span>
                  <span className="text-white ml-2">{coinInfo.denomination}</span>
                </div>
                <div>
                  <span className="text-gray-400">Year:</span>
                  <span className="text-white ml-2">{coinInfo.year}</span>
                </div>
                <div>
                  <span className="text-gray-400">Mint Mark:</span>
                  <span className="text-white ml-2">{coinInfo.mintMark || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Grade:</span>
                  <span className="text-white ml-2">{coinInfo.grade || '-'}</span>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                {isLoading ? 'Searching...' : 'Search Values'}
              </button>
            </div>

            {/* Results */}
            {searchResults.length > 0 && (
              <div className="mt-6">
                <h3 className="text-white font-medium mb-3">Value Estimates</h3>
                <div className="space-y-3">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="bg-[#1e1e1e] rounded-lg p-4 hover:bg-[#353535] cursor-pointer transition-colors"
                      onClick={() => {
                        onValueSelect(result.value);
                        onClose();
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-white font-medium">${result.value.toFixed(2)}</div>
                          <div className="text-sm text-gray-400">{result.grade}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">{result.source}</div>
                          <div className="text-xs text-gray-500">{result.date}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 