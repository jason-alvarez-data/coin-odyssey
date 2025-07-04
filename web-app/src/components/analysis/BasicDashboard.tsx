import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '@/utils/formatters';
import { Coin } from '@/utils/analyticsUtils';

interface BasicDashboardProps {
  coins: Coin[];
}

interface BasicAnalytics {
  totalCoins: number;
  totalValue: number;
  totalFaceValue: number;
  oldestCoin: number;
  newestCoin: number;
  averageValue: number;
  denominationDistribution: { [key: string]: number };
  yearRanges: { range: string; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const BasicDashboard: React.FC<BasicDashboardProps> = ({ coins }) => {
  const calculateBasicAnalytics = (): BasicAnalytics => {
    if (coins.length === 0) {
      return {
        totalCoins: 0,
        totalValue: 0,
        totalFaceValue: 0,
        oldestCoin: 0,
        newestCoin: 0,
        averageValue: 0,
        denominationDistribution: {},
        yearRanges: []
      };
    }

    const totalCoins = coins.length;
    const totalValue = coins.reduce((sum, coin) => 
      sum + (coin.current_market_value || coin.purchase_price || 0), 0);
    const totalFaceValue = coins.reduce((sum, coin) => sum + (coin.face_value || 0), 0);
    const oldestCoin = Math.min(...coins.map(c => c.year));
    const newestCoin = Math.max(...coins.map(c => c.year));
    const averageValue = totalValue / totalCoins;

    // Calculate denomination distribution
    const denominationDistribution: { [key: string]: number } = {};
    coins.forEach(coin => {
      denominationDistribution[coin.denomination] = 
        (denominationDistribution[coin.denomination] || 0) + 1;
    });

    // Calculate year ranges
    const currentYear = new Date().getFullYear();
    const yearRanges = [
      { range: 'Modern (2000+)', count: 0 },
      { range: 'Late 20th (1950-1999)', count: 0 },
      { range: 'Mid 20th (1900-1949)', count: 0 },
      { range: 'Early 20th (1850-1899)', count: 0 },
      { range: 'Vintage (Before 1850)', count: 0 }
    ];

    coins.forEach(coin => {
      if (coin.year >= 2000) yearRanges[0].count++;
      else if (coin.year >= 1950) yearRanges[1].count++;
      else if (coin.year >= 1900) yearRanges[2].count++;
      else if (coin.year >= 1850) yearRanges[3].count++;
      else yearRanges[4].count++;
    });

    return {
      totalCoins,
      totalValue,
      totalFaceValue,
      oldestCoin,
      newestCoin,
      averageValue,
      denominationDistribution,
      yearRanges: yearRanges.filter(range => range.count > 0)
    };
  };

  const analytics = calculateBasicAnalytics();

  if (coins.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-500 text-6xl mb-4">🪙</div>
        <div className="text-white text-2xl mb-2">No Coins Yet</div>
        <div className="text-gray-400 mb-6">Add some coins to see your collection analytics</div>
        <button 
          onClick={() => window.location.href = '/dashboard/add'}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Your First Coin
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Essential Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">📊 Collection Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-gray-700">
            <div className="text-center">
              <div className="text-3xl mb-2">🪙</div>
              <div className="text-2xl font-bold text-white mb-1">
                {analytics.totalCoins}
              </div>
              <div className="text-sm text-gray-400">Total Coins</div>
            </div>
          </div>

          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-gray-700">
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatCurrency(analytics.totalValue)}
              </div>
              <div className="text-sm text-gray-400">Total Value</div>
            </div>
          </div>

          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-gray-700">
            <div className="text-center">
              <div className="text-3xl mb-2">📈</div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatCurrency(analytics.averageValue)}
              </div>
              <div className="text-sm text-gray-400">Average Value</div>
            </div>
          </div>

          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-gray-700">
            <div className="text-center">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-2xl font-bold text-white mb-1">
                {analytics.oldestCoin} - {analytics.newestCoin}
              </div>
              <div className="text-sm text-gray-400">Year Range</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Denomination Distribution */}
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <h3 className="text-white text-lg mb-4 flex items-center">
            <span className="mr-2">🏛️</span>
            Coins by Denomination
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(analytics.denominationDistribution).map(([denom, count]) => ({
                    name: denom,
                    value: count
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, percent }) => 
                    percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''
                  }
                >
                  {Object.entries(analytics.denominationDistribution).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#3a3a3a',
                    border: '1px solid #555',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Year Ranges */}
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <h3 className="text-white text-lg mb-4 flex items-center">
            <span className="mr-2">📆</span>
            Coins by Era
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.yearRanges}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="range" 
                  stroke="#888" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#3a3a3a',
                    border: '1px solid #555',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="count" fill="#00C49F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Simple Summary */}
      <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
        <h3 className="text-white text-lg mb-4 flex items-center">
          <span className="mr-2">📋</span>
          Collection Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-[#1e1e1e] rounded-lg">
            <div className="text-green-400 text-lg font-bold">
              {formatCurrency(analytics.totalFaceValue)}
            </div>
            <div className="text-sm text-gray-400">Face Value</div>
          </div>
          
          <div className="p-4 bg-[#1e1e1e] rounded-lg">
            <div className="text-blue-400 text-lg font-bold">
              {Object.keys(analytics.denominationDistribution).length}
            </div>
            <div className="text-sm text-gray-400">Different Types</div>
          </div>
          
          <div className="p-4 bg-[#1e1e1e] rounded-lg">
            <div className="text-purple-400 text-lg font-bold">
              {analytics.newestCoin - analytics.oldestCoin + 1}
            </div>
            <div className="text-sm text-gray-400">Year Span</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicDashboard; 