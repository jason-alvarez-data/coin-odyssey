import React from 'react';
import { TopPerformer } from '@/utils/analyticsUtils';
import { formatCurrency } from '@/utils/formatters';

interface TopPerformersProps {
  performers: TopPerformer[];
  title: string;
  type: 'best' | 'worst';
}

const TopPerformers: React.FC<TopPerformersProps> = ({ performers, title, type }) => {
  const isEmpty = performers.length === 0;
  
  if (isEmpty) {
    return (
      <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="text-center py-8">
          <div className="text-gray-500 text-4xl mb-2">📊</div>
          <p className="text-gray-400">No performance data available</p>
          <p className="text-gray-500 text-sm mt-1">
            Add purchase prices to see performance metrics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-400">
            {type === 'best' ? '📈' : '📉'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {performers.slice(0, 5).map((performer, index) => {
          const isPositive = performer.roi >= 0;
          const isTop = index === 0;
          
          return (
            <div
              key={performer.coin.id}
              className={`
                p-4 rounded-lg border transition-all duration-200
                ${isTop 
                  ? (type === 'best' 
                      ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/15' 
                      : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/15')
                  : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`
                      text-xs px-2 py-1 rounded-full font-medium
                      ${isTop ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-600/50 text-gray-400'}
                    `}>
                      #{index + 1}
                    </span>
                    {performer.coin.images && performer.coin.images.length > 0 && (
                      <img
                        src={performer.coin.images[0]}
                        alt={performer.coin.title || 'Coin'}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                  </div>
                  
                  <h4 className="text-white font-medium text-sm truncate">
                    {performer.coin.title || 'Untitled Coin'}
                  </h4>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                    <span>{performer.coin.year}</span>
                    <span>•</span>
                    <span>{performer.coin.denomination}</span>
                    {performer.coin.grade && (
                      <>
                        <span>•</span>
                        <span>{performer.coin.grade}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-4">
                  <div className={`
                    text-sm font-bold
                    ${isPositive ? 'text-green-400' : 'text-red-400'}
                  `}>
                    {isPositive ? '+' : ''}{performer.roi.toFixed(1)}%
                  </div>
                  
                  <div className={`
                    text-xs
                    ${isPositive ? 'text-green-300' : 'text-red-300'}
                  `}>
                    {isPositive ? '+' : ''}{formatCurrency(performer.gain)}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(performer.coin.purchase_price || 0)} → {formatCurrency(performer.coin.current_market_value || performer.coin.purchase_price || 0)}
                  </div>
                </div>
              </div>

              {/* Progress bar for visual representation */}
              <div className="mt-3">
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`
                      h-1.5 rounded-full transition-all duration-500
                      ${isPositive ? 'bg-green-500' : 'bg-red-500'}
                    `}
                    style={{ 
                      width: `${Math.min(100, Math.abs(performer.roi) * 2)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {performers.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
            View all {performers.length} performers →
          </button>
        </div>
      )}
    </div>
  );
};

export default TopPerformers; 