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
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { formatCurrency } from '@/utils/formatters';
import { 
  Coin, 
  calculateFinancialInsights, 
  calculateCollectionHealth 
} from '@/utils/analyticsUtils';
import MetricCard from './MetricCard';

interface BetterDashboardProps {
  coins: Coin[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const BetterDashboard: React.FC<BetterDashboardProps> = ({ coins }) => {
  const calculateBetterAnalytics = () => {
    if (coins.length === 0) {
      return {
        totalCoins: 0,
        totalValue: 0,
        totalPurchaseValue: 0,
        totalFaceValue: 0,
        oldestCoin: 0,
        newestCoin: 0,
        averageValue: 0,
        denominationDistribution: {},
        valueOverTime: [],
        monthlyAcquisitions: [],
        gradeDistribution: {}
      };
    }

    const totalCoins = coins.length;
    const totalValue = coins.reduce((sum, coin) => 
      sum + (coin.current_market_value || coin.purchase_price || 0), 0);
    const totalPurchaseValue = coins.reduce((sum, coin) => sum + (coin.purchase_price || 0), 0);
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

    // Calculate grade distribution
    const gradeDistribution: { [key: string]: number } = {};
    coins.forEach(coin => {
      const grade = coin.grade || 'Ungraded';
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

    // Calculate value over time
    let runningValue = 0;
    const valueOverTime = coins.map(coin => {
      runningValue += coin.purchase_price || 0;
      return {
        date: new Date(coin.purchase_date).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        }),
        totalValue: runningValue
      };
    });

    // Calculate monthly acquisitions
    const acquisitionsByMonth: { [key: string]: number } = {};
    coins.forEach(coin => {
      const month = new Date(coin.purchase_date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      acquisitionsByMonth[month] = (acquisitionsByMonth[month] || 0) + 1;
    });
    
    const monthlyAcquisitions = Object.entries(acquisitionsByMonth)
      .map(([month, count]) => ({ month, count }))
      .slice(-12);

    return {
      totalCoins,
      totalValue,
      totalPurchaseValue,
      totalFaceValue,
      oldestCoin,
      newestCoin,
      averageValue,
      denominationDistribution,
      valueOverTime,
      monthlyAcquisitions,
      gradeDistribution
    };
  };

  const analytics = calculateBetterAnalytics();
  const financialInsights = calculateFinancialInsights(coins);
  const healthMetrics = calculateCollectionHealth(coins);

  if (coins.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-500 text-6xl mb-4">📈</div>
        <div className="text-white text-2xl mb-2">Ready for Better Analytics</div>
        <div className="text-gray-400 mb-6">Add some coins to unlock enhanced insights</div>
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
      {/* Key Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">📊 Collection Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Portfolio Value"
            value={formatCurrency(analytics.totalValue)}
            subtitle="Current market value"
            icon="💎"
            color="blue"
            trend={analytics.totalPurchaseValue > 0 ? {
              value: financialInsights.totalROI,
              isPositive: financialInsights.totalROI >= 0,
              label: "vs purchase price"
            } : undefined}
          />
          
          <MetricCard
            title="Collection Size"
            value={analytics.totalCoins}
            subtitle="total coins"
            icon="🪙"
            color="green"
          />
          
          <MetricCard
            title="Average Value"
            value={formatCurrency(analytics.averageValue)}
            subtitle="per coin"
            icon="📈"
            color="purple"
          />
          
          <MetricCard
            title="Total Investment"
            value={formatCurrency(analytics.totalPurchaseValue)}
            subtitle="amount spent"
            icon="💰"
            color="yellow"
          />
        </div>
      </div>

      {/* Collection Health */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">🎯 Collection Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Diversification"
            value={`${healthMetrics.diversificationScore.toFixed(0)}/100`}
            subtitle="portfolio balance"
            icon="🔄"
            color="blue"
            progress={healthMetrics.diversificationScore}
            size="small"
          />
          
          <MetricCard
            title="Quality Score"
            value={`${healthMetrics.qualityIndex.toFixed(0)}/100`}
            subtitle={`${healthMetrics.gradedCoinsPercentage.toFixed(0)}% graded`}
            icon="⭐"
            color="purple"
            progress={healthMetrics.qualityIndex}
            size="small"
          />
          
          <MetricCard
            title="Average Age"
            value={`${healthMetrics.averageAge.toFixed(0)} years`}
            subtitle={`${healthMetrics.vintageCoinsPercentage.toFixed(0)}% vintage`}
            icon="⏰"
            color="gray"
            size="small"
          />
        </div>
      </div>

      {/* Performance Summary */}
      {analytics.totalPurchaseValue > 0 && (
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <h3 className="text-white text-lg mb-4 flex items-center">
            <span className="mr-2">🏆</span>
            Performance Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-[#1e1e1e] rounded-lg">
              <div className={`text-2xl font-bold ${
                financialInsights.totalROI >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {financialInsights.totalROI >= 0 ? '+' : ''}{financialInsights.totalROI.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Total ROI</div>
            </div>
            
            <div className="text-center p-4 bg-[#1e1e1e] rounded-lg">
              <div className={`text-2xl font-bold ${
                financialInsights.totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {financialInsights.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(financialInsights.totalGainLoss)}
              </div>
              <div className="text-sm text-gray-400">Total Gain/Loss</div>
            </div>
            
            <div className="text-center p-4 bg-[#1e1e1e] rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {financialInsights.investmentEfficiency.toFixed(2)}x
              </div>
              <div className="text-sm text-gray-400">Investment Efficiency</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="space-y-6">
        {/* Portfolio Growth */}
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <h3 className="text-white text-lg mb-4 flex items-center">
            <span className="mr-2">📈</span>
            Portfolio Growth Over Time
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.valueOverTime}>
                <defs>
                  <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#3a3a3a',
                    border: '1px solid #555',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalValue"
                  stroke="#0088FE"
                  fillOpacity={1}
                  fill="url(#valueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Denomination Distribution */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
            <h3 className="text-white text-lg mb-4 flex items-center">
              <span className="mr-2">🏛️</span>
              Denomination Breakdown
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

          {/* Grade Distribution */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
            <h3 className="text-white text-lg mb-4 flex items-center">
              <span className="mr-2">⭐</span>
              Grade Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(analytics.gradeDistribution).map(([grade, count]) => ({
                    grade: grade === 'Ungraded' ? 'Ungraded' : grade,
                    count
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="grade" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#3a3a3a',
                      border: '1px solid #555',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="count" fill="#FFBB28" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly Acquisitions */}
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <h3 className="text-white text-lg mb-4 flex items-center">
            <span className="mr-2">📅</span>
            Monthly Acquisition Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.monthlyAcquisitions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#3a3a3a',
                    border: '1px solid #555',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#00C49F" 
                  strokeWidth={3}
                  dot={{ fill: '#00C49F', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
        <h3 className="text-white text-lg mb-4 flex items-center">
          <span className="mr-2">💡</span>
          Quick Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#1e1e1e] rounded-lg">
            <h4 className="text-white font-medium mb-2">Collection Span</h4>
            <p className="text-gray-400 text-sm">
              Your collection spans {analytics.newestCoin - analytics.oldestCoin + 1} years 
              ({analytics.oldestCoin} - {analytics.newestCoin})
            </p>
          </div>
          
          <div className="p-4 bg-[#1e1e1e] rounded-lg">
            <h4 className="text-white font-medium mb-2">Denomination Variety</h4>
            <p className="text-gray-400 text-sm">
              You collect {Object.keys(analytics.denominationDistribution).length} different 
              types of coins with an average of {(analytics.totalCoins / Object.keys(analytics.denominationDistribution).length).toFixed(1)} 
              coins per type
            </p>
          </div>
          
          {healthMetrics.gradedCoinsPercentage < 50 && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h4 className="text-blue-400 font-medium mb-2">📈 Opportunity</h4>
              <p className="text-blue-200 text-sm">
                Consider getting more coins professionally graded to potentially increase their value
              </p>
            </div>
          )}
          
          {healthMetrics.diversificationScore > 70 && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <h4 className="text-green-400 font-medium mb-2">🎯 Well Done</h4>
              <p className="text-green-200 text-sm">
                Your collection is well diversified across different denominations and time periods
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BetterDashboard; 