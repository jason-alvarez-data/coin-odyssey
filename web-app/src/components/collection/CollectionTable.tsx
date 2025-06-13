"use client";

import { useState } from 'react';
import { Coin } from '@/types/coin';

interface CollectionTableProps {
  coins: Coin[];
  onEdit: (coin: Coin) => void;
  onDelete: (coin: Coin) => void;
}

export default function CollectionTable({ coins, onEdit, onDelete }: CollectionTableProps) {
  const [sortConfig] = useState<{
    key: keyof Coin;
    direction: 'ascending' | 'descending';
  } | null>(null);

  const sortedCoins = [...coins].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    const aValue = a[key];
    const bValue = b[key];

    if (aValue === bValue) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;

    const comparison = aValue < bValue ? -1 : 1;
    return direction === 'ascending' ? comparison : -comparison;
  });

  const formatValue = (value: number | null): string => {
    if (value === null) return 'N/A';
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Year
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Denomination
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Grade
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Value
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-700">
          {sortedCoins.map((coin) => (
            <tr key={coin.id} className="hover:bg-gray-800">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {coin.year}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {coin.denomination}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {coin.grade}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {formatValue(coin.currentMarketValue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                <button
                  onClick={() => onEdit(coin)}
                  className="text-blue-400 hover:text-blue-300 mr-4"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(coin)}
                  className="text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 