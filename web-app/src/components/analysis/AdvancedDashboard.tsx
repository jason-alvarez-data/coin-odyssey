import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
  FinancialInsights,
  CollectionHealthMetrics,
  SmartInsight,
  calculateFinancialInsights,
  calculateCollectionHealth,
  generateSmartInsights,
  calculateValueDistribution,
  getRecentActivity
} from '@/utils/analyticsUtils';
import MetricCard from './MetricCard';
import InsightCard from './InsightCard';
import TopPerformers from './TopPerformers';

interface AdvancedDashboardProps {
  coins: Coin[];
}

interface AnalyticsSummary {
  totalValue: number;
  averageValue: number;
  totalPurchaseValue: number;
  totalFaceValue: number;
  potentialProfit: number;
  oldestCoin: number;
  newestCoin: number;
  totalCoins: number;
  gradeDistribution: { [key: string]: number };
  denominationDistribution: { [key: string]: number };
  yearDistribution: { [key: string]: number };
  mintMarkDistribution: { [key: string]: number };
  valueOverTime: { date: string; totalValue: number }[];
  acquisitionTrend: { month: string; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  percent: number;
  name: string;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: CustomLabelProps) => {
  const radius = outerRadius * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.02) return null;

  return (
    <text
      x={x}
      y={y}
      fill="#888"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
    >
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ coins }) => {
  const calculateAnalytics = (coins: Coin[]): AnalyticsSummary => {
    const summary: AnalyticsSummary = {
      totalValue: 0,
      averageValue: 0,
      totalPurchaseValue: 0,
      totalFaceValue: 0,
      potentialProfit: 0,
      oldestCoin: Math.min(...coins.map(c => c.year)),
      newestCoin: Math.max(...coins.map(c => c.year)),
      totalCoins: coins.length,
      gradeDistribution: {},
      denominationDistribution: {},
      yearDistribution: {},
      mintMarkDistribution: {},
      valueOverTime: [],
      acquisitionTrend: []
    };

    summary.totalFaceValue = coins.reduce((sum, coin) => sum + (coin.face_value || 0), 0);
    summary.totalPurchaseValue = coins.reduce((sum, coin) => sum + (coin.purchase_price || 0), 0);
    summary.totalValue = coins.reduce((sum, coin) => {
      const value = coin.current_market_value || coin.purchase_price || 0;
      return sum + value;
    }, 0);

    summary.potentialProfit = summary.totalValue - summary.totalPurchaseValue;
    summary.averageValue = coins.length > 0 ? summary.totalValue / coins.length : 0;

    // Calculate distributions
    coins.forEach(coin => {
      if (coin.grade) {
        summary.gradeDistribution[coin.grade] = (summary.gradeDistribution[coin.grade] || 0) + 1;
      }

      summary.denominationDistribution[coin.denomination] = 
        (summary.denominationDistribution[coin.denomination] || 0) + 1;

      const decade = Math.floor(coin.year / 10) * 10;
      summary.yearDistribution[decade] = (summary.yearDistribution[decade] || 0) + 1;

      const mintMark = coin.mint_mark || 'None';
      summary.mintMarkDistribution[mintMark] = (summary.mintMarkDistribution[mintMark] || 0) + 1;
    });

    // Calculate value over time
    let runningValue = 0;
    summary.valueOverTime = coins.map(coin => {
      runningValue += coin.purchase_price || 0;
      return {
        date: new Date(coin.purchase_date).toLocaleDateString(),
        totalValue: runningValue
      };
    });

    // Calculate acquisition trend
    const acquisitionsByMonth: { [key: string]: number } = {};
    coins.forEach(coin => {
      const month = new Date(coin.purchase_date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      acquisitionsByMonth[month] = (acquisitionsByMonth[month] || 0) + 1;
    });
    summary.acquisitionTrend = Object.entries(acquisitionsByMonth)
      .map(([month, count]) => ({ month, count }))
      .slice(-12);

    return summary;
  };

  const analytics = calculateAnalytics(coins);
  const financialInsights = calculateFinancialInsights(coins);
  const healthMetrics = calculateCollectionHealth(coins);
  const smartInsights = generateSmartInsights(coins, financialInsights, healthMetrics);
  const recentActivity = getRecentActivity(coins);
  const valueDistribution = calculateValueDistribution(coins);

  if (coins.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-500 text-6xl mb-4">🚀</div>
        <div className="text-white text-2xl mb-2">Advanced Analytics Ready</div>
        <div className="text-gray-400 mb-6">Add coins to unlock comprehensive insights and smart analytics</div>
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
      {/* Smart Insights */}
      {smartInsights.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">🧠</span>
            Smart Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {smartInsights.map((insight, index) => (
              <InsightCard
                key={index}
                type={insight.type}
                title={insight.title}
                message={insight.message}
                icon={insight.icon}
              />
            ))}
          </div>
        </div>
      )}

      {/* Key Financial Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">💰</span>
          Financial Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Portfolio Value"
            value={formatCurrency(analytics.totalValue)}
            subtitle="Current market value"
            icon="💎"
            color="blue"
            trend={{
              value: financialInsights.totalROI,
              isPositive: financialInsights.totalROI >= 0,
              label: "vs purchase price"
            }}
          />
          
          <MetricCard
            title="Total Investment"
            value={formatCurrency(analytics.totalPurchaseValue)}
            subtitle="Amount invested"
            icon="🏦"
            color="purple"
          />
          
          <MetricCard
            title="Gain/Loss"
            value={formatCurrency(financialInsights.totalGainLoss)}
            subtitle={`${financialInsights.totalROI.toFixed(1)}% ROI`}
            icon={financialInsights.totalGainLoss >= 0 ? "📈" : "📉"}
            color={financialInsights.totalGainLoss >= 0 ? "green" : "red"}
          />
          
          <MetricCard
            title="Collection Face Value"
            value={formatCurrency(analytics.totalFaceValue)}
            subtitle="Nominal value"
            icon="🪙"
            color="yellow"
          />
        </div>
      </div>

      {/* Collection Health */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">🎯</span>
          Collection Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Diversification Score"
            value={`${healthMetrics.diversificationScore.toFixed(0)}/100`}
            subtitle="Portfolio balance"
            icon="🔄"
            color="blue"
            progress={healthMetrics.diversificationScore}
          />
          
          <MetricCard
            title="Quality Index"
            value={`${healthMetrics.qualityIndex.toFixed(0)}/100`}
            subtitle={`${healthMetrics.gradedCoinsPercentage.toFixed(0)}% graded`}
            icon="⭐"
            color="purple"
            progress={healthMetrics.qualityIndex}
          />
          
          <MetricCard
            title="Average Age"
            value={`${healthMetrics.averageAge.toFixed(0)} years`}
            subtitle={`${healthMetrics.vintageCoinsPercentage.toFixed(0)}% vintage`}
            icon="⏰"
            color="gray"
          />
          
          <MetricCard
            title="Countries"
            value={healthMetrics.countryDiversity}
            subtitle="Geographic diversity"
            icon="🌍"
            color="green"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">⚡</span>
          Recent Activity (30 days)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="New Additions"
            value={recentActivity.recentCoins.length}
            subtitle="coins added"
            icon="🆕"
            color="green"
            size="small"
          />
          
          <MetricCard
            title="Amount Spent"
            value={formatCurrency(recentActivity.totalSpent)}
            subtitle="recent investment"
            icon="💸"
            color="blue"
            size="small"
          />
          
          <MetricCard
            title="Average Cost"
            value={formatCurrency(recentActivity.averageValue)}
            subtitle="per coin"
            icon="📊"
            color="purple"
            size="small"
          />
          
          <MetricCard
            title="Active Days"
            value={recentActivity.daysActive}
            subtitle="collecting days"
            icon="📅"
            color="yellow"
            size="small"
          />
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPerformers
          performers={financialInsights.topPerformers}
          title="🏆 Top Performers"
          type="best"
        />
        
        <TopPerformers
          performers={[...financialInsights.topPerformers].reverse()}
          title="📉 Needs Attention"
          type="worst"
        />
      </div>

      {/* Charts Section */}
      <div className="space-y-8">
        {/* Portfolio Growth & Monthly Spending */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
            <h3 className="text-white text-lg mb-4 flex items-center">
              <span className="mr-2">📈</span>
              Portfolio Growth Over Time
            </h3>
            <div className="h-80">
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

          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
            <h3 className="text-white text-lg mb-4 flex items-center">
              <span className="mr-2">💳</span>
              Monthly Spending Pattern
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialInsights.monthlySpending}>
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
                  <Bar dataKey="amount" fill="#00C49F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Value Distribution & Acquisition Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
            <h3 className="text-white text-lg mb-4 flex items-center">
              <span className="mr-2">💰</span>
              Value Distribution
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valueDistribution} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis type="number" stroke="#888" />
                  <YAxis dataKey="range" type="category" stroke="#888" width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#3a3a3a',
                      border: '1px solid #555',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="count" fill="#FFBB28" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
            <h3 className="text-white text-lg mb-4 flex items-center">
              <span className="mr-2">📅</span>
              Acquisition Timeline
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.acquisitionTrend}>
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
                    stroke="#8884D8" 
                    strokeWidth={3}
                    dot={{ fill: '#8884D8', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
            <h3 className="text-white text-lg mb-4 flex items-center">
              <span className="mr-2">🏛️</span>
              Denomination Breakdown
            </h3>
            <div className="h-80">
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
                    labelLine={{ stroke: '#888', strokeWidth: 1 }}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
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

          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
            <h3 className="text-white text-lg mb-4 flex items-center">
              <span className="mr-2">📍</span>
              Mint Mark Distribution
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.mintMarkDistribution).map(([mark, count]) => ({
                      name: mark,
                      value: count
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    labelLine={{ stroke: '#888', strokeWidth: 1 }}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                  >
                    {Object.entries(analytics.mintMarkDistribution).map((entry, index) => (
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
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard; 