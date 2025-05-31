'use client';

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Header from '@/components/layout/Header'
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
  ResponsiveContainer
} from 'recharts'
import { formatCurrency } from '@/utils/formatters'

interface Coin {
  id: string;
  denomination: string;
  year: number;
  mint_mark?: string;
  grade?: string;
  purchase_price?: number;
  face_value: number;
  purchase_date: string;
  notes?: string;
  images?: string[];
  title?: string;
  current_market_value?: number;
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: CustomLabelProps) => {
  const radius = outerRadius * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if percentage is greater than 2%
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

export default function AnalysisPage() {
  const [user, setUser] = useState<User | null>(null)
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)

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
      const { data: collections } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', userId)

      if (!collections?.length) {
        setCoins([])
        return
      }

      const { data: coins } = await supabase
        .from('coins')
        .select('*')
        .in('collection_id', collections.map(c => c.id))
        .order('purchase_date', { ascending: true })

      setCoins(coins || [])
      if (coins) {
        calculateAnalytics(coins)
      }
    } catch (error) {
      console.error('Error fetching coins:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (coins: Coin[]) => {
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
    }

    // Calculate total face value
    summary.totalFaceValue = coins.reduce((sum, coin) => sum + (coin.face_value || 0), 0);

    // Calculate total current value and purchase value
    summary.totalPurchaseValue = coins.reduce((sum, coin) => sum + (coin.purchase_price || 0), 0);
    summary.totalValue = coins.reduce((sum, coin) => {
      const value = coin.current_market_value || coin.purchase_price || 0;
      return sum + value;
    }, 0);

    // Calculate potential profit/loss based on purchase price vs market value
    summary.potentialProfit = summary.totalValue - summary.totalPurchaseValue;

    // Calculate average value only if there are coins
    summary.averageValue = coins.length > 0 ? summary.totalValue / coins.length : 0;

    // Calculate distributions
    coins.forEach(coin => {
      // Grade distribution
      if (coin.grade) {
        summary.gradeDistribution[coin.grade] = (summary.gradeDistribution[coin.grade] || 0) + 1
      }

      // Denomination distribution
      summary.denominationDistribution[coin.denomination] = 
        (summary.denominationDistribution[coin.denomination] || 0) + 1

      // Year distribution (by decade)
      const decade = Math.floor(coin.year / 10) * 10
      summary.yearDistribution[decade] = (summary.yearDistribution[decade] || 0) + 1

      // Mint mark distribution
      const mintMark = coin.mint_mark || 'None'
      summary.mintMarkDistribution[mintMark] = (summary.mintMarkDistribution[mintMark] || 0) + 1
    })

    // Calculate value over time
    let runningValue = 0
    summary.valueOverTime = coins.map(coin => {
      runningValue += coin.purchase_price || 0
      return {
        date: new Date(coin.purchase_date).toLocaleDateString(),
        totalValue: runningValue
      }
    })

    // Calculate acquisition trend (by month)
    const acquisitionsByMonth: { [key: string]: number } = {}
    coins.forEach(coin => {
      const month = new Date(coin.purchase_date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
      acquisitionsByMonth[month] = (acquisitionsByMonth[month] || 0) + 1
    })
    summary.acquisitionTrend = Object.entries(acquisitionsByMonth)
      .map(([month, count]) => ({ month, count }))
      .slice(-12) // Last 12 months

    setAnalytics(summary)
  }

  if (loading) {
    return (
      <div className="flex-1 bg-[#1e1e1e] p-8">
        <div className="text-white">Loading analysis...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex-1 bg-[#1e1e1e] p-8">
        <div className="text-white">No data available for analysis</div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#1e1e1e]">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Collection Analysis</h1>
          <Header />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#2a2a2a] p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Collection Face Value</h3>
            <p className="text-2xl font-bold text-white">{formatCurrency(analytics.totalFaceValue)}</p>
            <p className="text-sm text-gray-400 mt-1">Total nominal value</p>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Market Value</h3>
            <p className="text-2xl font-bold text-white">{formatCurrency(analytics.totalValue)}</p>
            <p className="text-sm text-gray-400 mt-1">Current collector value</p>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Total Investment</h3>
            <p className="text-2xl font-bold text-white">{formatCurrency(analytics.totalPurchaseValue)}</p>
            <p className="text-sm text-gray-400 mt-1">Amount invested</p>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Collection Size</h3>
            <p className="text-2xl font-bold text-white">{analytics.totalCoins} coins</p>
            <p className="text-sm text-gray-400 mt-1">{analytics.oldestCoin} - {analytics.newestCoin}</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Value Over Time */}
          <div className="bg-[#2a2a2a] p-6 rounded-lg">
            <h3 className="text-white text-lg mb-4">Collection Value Growth</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.valueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#3a3a3a',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="totalValue" stroke="#0088FE" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Acquisition Trend */}
          <div className="bg-[#2a2a2a] p-6 rounded-lg">
            <h3 className="text-white text-lg mb-4">Monthly Acquisitions</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.acquisitionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#3a3a3a',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Grade Distribution */}
          <div className="bg-[#2a2a2a] p-6 rounded-lg">
            <h3 className="text-white text-lg mb-4">Grade Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.gradeDistribution).map(([grade, count]) => ({
                      name: grade || 'Ungraded',
                      value: count
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    labelLine={{ stroke: '#888', strokeWidth: 1 }}
                    label={renderCustomizedLabel}
                    outerRadius={90}
                    fill="#8884d8"
                  >
                    {Object.entries(analytics.gradeDistribution).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#3a3a3a',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Year Distribution */}
          <div className="bg-[#2a2a2a] p-6 rounded-lg">
            <h3 className="text-white text-lg mb-4">Coins by Decade</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(analytics.yearDistribution).map(([decade, count]) => ({
                    decade: `${decade}s`,
                    count
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="decade" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#3a3a3a',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Denomination Distribution */}
          <div className="bg-[#2a2a2a] p-6 rounded-lg">
            <h3 className="text-white text-lg mb-4">Denomination Distribution</h3>
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
                    outerRadius={90}
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
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mint Mark Distribution */}
          <div className="bg-[#2a2a2a] p-6 rounded-lg">
            <h3 className="text-white text-lg mb-4">Mint Mark Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
                    outerRadius={90}
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
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend 
                    layout="vertical" 
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ paddingLeft: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 