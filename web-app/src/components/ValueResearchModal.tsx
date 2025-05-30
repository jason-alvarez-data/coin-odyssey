import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ValueResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  coinInfo?: {
    denomination: string;
    year: number;
    mintMark?: string | null;
    grade?: string | null;
  };
}

const ValueResearchModal: React.FC<ValueResearchModalProps> = ({ isOpen, onClose, coinInfo }) => {
  const researchSites = [
    {
      name: 'PCGS Price Guide',
      url: 'https://www.pcgs.com/prices',
      description: 'Professional Coin Grading Service price guide - one of the most trusted sources for coin values.'
    },
    {
      name: 'NGC Price Guide',
      url: 'https://www.ngccoin.com/price-guide/united-states/',
      description: 'Numismatic Guaranty Corporation price guide - another highly respected source for coin values.'
    },
    {
      name: 'USA Coin Book',
      url: 'https://www.usacoinbook.com/',
      description: 'Comprehensive U.S. coin reference with current market prices.'
    },
    {
      name: 'Heritage Auctions',
      url: 'https://coins.ha.com/',
      description: 'See recent auction prices for similar coins.'
    }
  ];

  const searchTips = [
    'Look up your specific coin denomination, year, and mint mark',
    'Compare prices across multiple sources',
    'Consider the grade/condition when comparing prices',
    'Check recent auction results for the most up-to-date values',
    'Factor in whether the coin is certified/graded by PCGS or NGC'
  ];

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-700">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <Dialog.Title className="text-xl font-semibold text-white">
                Research Coin Value
                {coinInfo && (
                  <span className="block text-sm text-gray-400 mt-1">
                    {coinInfo.year} {coinInfo.denomination} {coinInfo.mintMark && `(${coinInfo.mintMark})`}
                    {coinInfo.grade && ` - Grade: ${coinInfo.grade}`}
                  </span>
                )}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-white mb-3">Recommended Research Sites</h3>
              <div className="space-y-4">
                {researchSites.map((site) => (
                  <div key={site.name} className="border border-gray-700 rounded-lg p-4 bg-[#2a2a2a]">
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      {site.name}
                    </a>
                    <p className="text-sm text-gray-400 mt-1">{site.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-white mb-3">Research Tips</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-400">
                {searchTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ValueResearchModal; 