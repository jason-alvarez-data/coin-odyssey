import React from 'react';
import Link from 'next/link';
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
import { Coins, DollarSign, TrendingUp, Calendar, Landmark, CalendarDays, ClipboardList } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { Coin } from '@coin-collecting/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
      sum + (coin.currentMarketValue || coin.purchasePrice || 0), 0);
    const totalFaceValue = coins.reduce((sum, coin) => sum + (coin.faceValue || 0), 0);
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
        <div className="text-muted-foreground text-6xl mb-4">
          <Coins className="mx-auto h-16 w-16" />
        </div>
        <div className="text-foreground text-2xl mb-2">No Coins Yet</div>
        <div className="text-muted-foreground mb-6">Add some coins to see your collection analytics</div>
        <Button asChild size="lg">
          <Link href="/dashboard/add">
            Add Your First Coin
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Essential Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Collection Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Coins className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <div className="text-2xl font-bold text-foreground mb-1">
                  {analytics.totalCoins}
                </div>
                <div className="text-sm text-muted-foreground">Total Coins</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <div className="text-2xl font-bold text-foreground mb-1">
                  {formatCurrency(analytics.totalValue)}
                </div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <div className="text-2xl font-bold text-foreground mb-1">
                  {formatCurrency(analytics.averageValue)}
                </div>
                <div className="text-sm text-muted-foreground">Average Value</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Calendar className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <div className="text-2xl font-bold text-foreground mb-1">
                  {analytics.oldestCoin} - {analytics.newestCoin}
                </div>
                <div className="text-sm text-muted-foreground">Year Range</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Denomination Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Landmark className="mr-2 h-5 w-5" />
              Coins by Denomination
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Year Ranges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CalendarDays className="mr-2 h-5 w-5" />
              Coins by Era
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Simple Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <ClipboardList className="mr-2 h-5 w-5" />
            Collection Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-lg font-bold text-foreground">
                {formatCurrency(analytics.totalFaceValue)}
              </div>
              <div className="text-sm text-muted-foreground">Face Value</div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="text-lg font-bold text-foreground">
                {Object.keys(analytics.denominationDistribution).length}
              </div>
              <div className="text-sm text-muted-foreground">Different Types</div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="text-lg font-bold text-foreground">
                {analytics.newestCoin - analytics.oldestCoin + 1}
              </div>
              <div className="text-sm text-muted-foreground">Year Span</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicDashboard;
