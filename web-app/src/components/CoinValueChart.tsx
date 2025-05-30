import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CoinValueChartProps {
  coinId: string;
  timeRange?: '1w' | '1m' | '3m' | '6m' | '1y' | 'all';
}

interface ValueHistory {
  recorded_at: string;
  value: number;
}

const CoinValueChart: React.FC<CoinValueChartProps> = ({ coinId, timeRange = '1m' }) => {
  const [historicalData, setHistoricalData] = useState<ValueHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        switch (timeRange) {
          case '1w':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '1m':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
          case '3m':
            startDate.setMonth(endDate.getMonth() - 3);
            break;
          case '6m':
            startDate.setMonth(endDate.getMonth() - 6);
            break;
          case '1y':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
          case 'all':
            // No date filtering for all-time view
            break;
        }

        let query = supabase
          .from('coin_value_history')
          .select('recorded_at, value')
          .eq('coin_id', coinId)
          .order('recorded_at', { ascending: true });

        if (timeRange !== 'all') {
          query = query.gte('recorded_at', startDate.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        setHistoricalData(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [coinId, timeRange]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (historicalData.length === 0) return <div>No historical data available</div>;

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="w-full h-[400px] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={historicalData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="recorded_at"
            tickFormatter={formatDate}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatValue}
            domain={['auto', 'auto']}
          />
          <Tooltip
            formatter={(value: number) => [formatValue(value), 'Value']}
            labelFormatter={formatDate}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            name="Market Value"
            dot={false}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CoinValueChart; 