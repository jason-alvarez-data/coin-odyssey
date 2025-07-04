import React, { useState, useEffect } from 'react';

export type DashboardTier = 'basic' | 'better' | 'advanced';

interface DashboardSelectorProps {
  currentTier: DashboardTier;
  onTierChange: (tier: DashboardTier) => void;
}

const tierInfo = {
  basic: {
    name: 'Basic',
    description: 'Essential metrics and simple charts',
    icon: '📊',
    features: ['Key metrics', 'Simple charts', 'Clean layout']
  },
  better: {
    name: 'Better',
    description: 'Enhanced insights and multiple charts',
    icon: '📈',
    features: ['Collection health', 'Multiple charts', 'Performance tracking']
  },
  advanced: {
    name: 'Advanced',
    description: 'Comprehensive analytics and smart insights',
    icon: '🚀',
    features: ['Smart insights', 'ROI analysis', 'Top performers', 'Advanced charts']
  }
};

const DashboardSelector: React.FC<DashboardSelectorProps> = ({ 
  currentTier, 
  onTierChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTierSelect = (tier: DashboardTier) => {
    onTierChange(tier);
    setIsOpen(false);
  };

  const currentTierInfo = tierInfo[currentTier];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] 
                   border border-gray-600 rounded-lg px-4 py-2 text-white 
                   transition-colors duration-200 min-w-[200px]"
      >
        <span className="text-lg">{currentTierInfo.icon}</span>
        <div className="flex-1 text-left">
          <div className="font-medium">{currentTierInfo.name}</div>
          <div className="text-xs text-gray-400 truncate">
            {currentTierInfo.description}
          </div>
        </div>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-[#2a2a2a] border border-gray-600 
                        rounded-lg shadow-lg z-50 overflow-hidden">
          {Object.entries(tierInfo).map(([tier, info]) => (
            <button
              key={tier}
              onClick={() => handleTierSelect(tier as DashboardTier)}
              className={`w-full p-4 text-left hover:bg-[#3a3a3a] transition-colors duration-200 
                         border-b border-gray-700 last:border-b-0 ${
                currentTier === tier ? 'bg-blue-500/10 border-blue-500/30' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{info.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-white">{info.name}</h3>
                    {currentTier === tier && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{info.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {info.features.map((feature, index) => (
                      <span 
                        key={index}
                        className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
          
          <div className="p-3 bg-[#1e1e1e] border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              Your selection will be remembered for future visits
            </p>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardSelector; 