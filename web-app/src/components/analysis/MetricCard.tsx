import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
  icon?: string;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow' | 'gray';
  progress?: number; // 0-100
  size?: 'small' | 'medium' | 'large';
}

const colorSchemes = {
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    background: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    progress: 'bg-blue-500'
  },
  green: {
    gradient: 'from-green-500 to-green-600',
    background: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-400',
    progress: 'bg-green-500'
  },
  red: {
    gradient: 'from-red-500 to-red-600',
    background: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-400',
    progress: 'bg-red-500'
  },
  purple: {
    gradient: 'from-purple-500 to-purple-600',
    background: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    progress: 'bg-purple-500'
  },
  yellow: {
    gradient: 'from-yellow-500 to-yellow-600',
    background: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    text: 'text-yellow-400',
    progress: 'bg-yellow-500'
  },
  gray: {
    gradient: 'from-gray-500 to-gray-600',
    background: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    text: 'text-gray-400',
    progress: 'bg-gray-500'
  }
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
  progress,
  size = 'medium'
}) => {
  const scheme = colorSchemes[color];
  
  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };
  
  const titleClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };
  
  const valueClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl'
  };

  return (
    <div className={`
      bg-[#2a2a2a] rounded-xl border ${scheme.border} 
      ${sizeClasses[size]}
      hover:bg-[#303030] transition-all duration-300
      relative overflow-hidden group
    `}>
      {/* Background gradient overlay */}
      <div className={`
        absolute inset-0 bg-gradient-to-br ${scheme.gradient} opacity-5 
        group-hover:opacity-10 transition-opacity duration-300
      `} />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {icon && <span className="text-lg">{icon}</span>}
            <h3 className={`${titleClasses[size]} text-gray-400 font-medium`}>
              {title}
            </h3>
          </div>
          {trend && (
            <div className="flex items-center space-x-1">
              <span className={`
                text-xs px-2 py-1 rounded-full
                ${trend.isPositive !== false ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}
              `}>
                {trend.isPositive !== false ? '↗' : '↘'} {Math.abs(trend.value).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          <div className={`${valueClasses[size]} font-bold text-white mb-1`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-400">{subtitle}</p>
          )}
        </div>

        {/* Progress bar */}
        {progress !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Progress</span>
              <span className="text-xs font-medium text-white">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${scheme.progress} transition-all duration-500`}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}

        {/* Trend label */}
        {trend?.label && (
          <p className="text-xs text-gray-500 mt-2">{trend.label}</p>
        )}
      </div>
    </div>
  );
};

export default MetricCard; 