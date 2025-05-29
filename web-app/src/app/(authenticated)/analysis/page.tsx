'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface CollectionData {
  totalFaceValue: number;
  totalMarketValue: number;
  averageFaceValue: number;
  averageMarketValue: number;
  valueChange: number;
  valueChangePercentage: number;
  geographicDistribution: { [key: string]: number };
  yearDistribution: { [key: string]: number };
  collectionComposition: { [key: string]: number };
}

// Country name mappings - keep in sync with WorldMap component
const countryMappings: { [key: string]: string } = {
  'United States of America': 'United States',
  'USA': 'United States',
  'US': 'United States',
  'UNITED STATES': 'United States',
  'United Kingdom': 'UK',
  'Great Britain': 'UK',
  'England': 'UK',
  'Russian Federation': 'Russia',
  'People\'s Republic of China': 'China',
  'PRC': 'China',
};

export default function AnalysisPage() {
  const [collectionData, setCollectionData] = useState<CollectionData>({
    totalFaceValue: 0,
    totalMarketValue: 0,
    averageFaceValue: 0,
    averageMarketValue: 0,
    valueChange: 0,
    valueChangePercentage: 0,
    geographicDistribution: {},
    yearDistribution: {},
    collectionComposition: {}
  });

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  const fetchAnalysisData = async () => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's collection
      const { data: collections } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', user.id);

      if (!collections?.length) return;

      // Get all coins from user's collections
      const { data: coins } = await supabase
        .from('coins')
        .select('*')
        .in('collection_id', collections.map(c => c.id));

      if (!coins || coins.length === 0) return;

      // Calculate total and average values
      const totalFaceValue = coins.reduce((sum, coin) => sum + (parseFloat(coin.face_value) || 0), 0);
      const totalMarketValue = coins.reduce((sum, coin) => sum + (parseFloat(coin.current_market_value) || parseFloat(coin.face_value) || 0), 0);
      const averageFaceValue = totalFaceValue / coins.length;
      const averageMarketValue = totalMarketValue / coins.length;

      // Calculate geographic distribution
      const geographicDistribution = coins.reduce((acc: { [key: string]: number }, coin) => {
        if (coin.country) {
          let country = coin.country.trim();
          country = countryMappings[country] || country;
          acc[country] = (acc[country] || 0) + 1;
        }
        return acc;
      }, {});

      // Calculate year distribution
      const yearDistribution = coins.reduce((acc: { [key: string]: number }, coin) => {
        if (coin.year) {
          const year = coin.year.toString();
          acc[year] = (acc[year] || 0) + 1;
        }
        return acc;
      }, {});

      // Sort years chronologically
      const sortedYearDistribution = Object.fromEntries(
        Object.entries(yearDistribution).sort(([a], [b]) => parseInt(a) - parseInt(b))
      );

      // Calculate collection composition
      const collectionComposition = coins.reduce((acc: { [key: string]: number }, coin) => {
        const type = coin.type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      // Calculate value change
      const valueChange = totalMarketValue - totalFaceValue;
      const valueChangePercentage = totalFaceValue > 0 ? (valueChange / totalFaceValue) * 100 : 0;

      setCollectionData({
        totalFaceValue,
        totalMarketValue,
        averageFaceValue,
        averageMarketValue,
        valueChange,
        valueChangePercentage,
        geographicDistribution,
        yearDistribution: sortedYearDistribution,
        collectionComposition
      });
    } catch (error) {
      console.error('Error fetching analysis data:', error);
    }
  };

  // Value Timeline Chart Data (mock data for now)
  const timelineData = {
    labels: [new Date().toISOString().split('T')[0]],
    datasets: [
      {
        label: 'Collection Value',
        data: [collectionData.totalMarketValue],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      }
    ]
  };

  // Geographic Distribution Chart Data
  const geoDistributionData = {
    labels: Object.keys(collectionData.geographicDistribution),
    datasets: [{
      data: Object.values(collectionData.geographicDistribution),
      backgroundColor: [
        '#ef4444', // red
        '#eab308', // yellow
        '#22c55e', // green
        '#14b8a6', // teal
        '#3b82f6', // blue
        '#a855f7', // purple
        '#ec4899', // pink
        '#f97316', // orange
        '#84cc16', // lime
        '#06b6d4', // cyan
      ],
    }],
  };

  // Year Distribution Chart Data
  const yearDistributionData = {
    labels: Object.keys(collectionData.yearDistribution),
    datasets: [{
      label: 'Coins per Year',
      data: Object.values(collectionData.yearDistribution),
      backgroundColor: 'rgb(59, 130, 246)',
    }],
  };

  // Collection Composition Chart Data
  const compositionData = {
    labels: Object.keys(collectionData.collectionComposition),
    datasets: [{
      data: Object.values(collectionData.collectionComposition),
      backgroundColor: [
        '#ef4444', // red
        '#22c55e', // green
        '#3b82f6', // blue
        '#f97316', // orange
        '#a855f7', // purple
      ],
    }],
  };

  // Chart Options
  const timelineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#9ca3af',
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#9ca3af',
        }
      },
      y: {
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#9ca3af',
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#9ca3af',
        }
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#9ca3af',
        }
      },
      y: {
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#9ca3af',
        }
      }
    }
  };

  return (
    <div className="flex-1 bg-[#1e1e1e] text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Collection Analysis</h1>
        <Header />
      </div>

      {/* Value Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#2a2a2a] p-6 rounded-lg">
          <h2 className="text-gray-400 text-sm mb-2">Total Market Value</h2>
          <p className="text-2xl font-bold text-blue-500">${collectionData.totalMarketValue.toFixed(2)}</p>
          <p className="text-sm text-gray-400">Face Value: ${collectionData.totalFaceValue.toFixed(2)}</p>
        </div>
        <div className="bg-[#2a2a2a] p-6 rounded-lg">
          <h2 className="text-gray-400 text-sm mb-2">Average Value</h2>
          <p className="text-2xl font-bold text-blue-500">${collectionData.averageMarketValue.toFixed(2)}</p>
          <p className="text-sm text-gray-400">Avg Face: ${collectionData.averageFaceValue.toFixed(2)}</p>
        </div>
        <div className="bg-[#2a2a2a] p-6 rounded-lg">
          <h2 className="text-gray-400 text-sm mb-2">Value Appreciation</h2>
          <p className="text-2xl font-bold text-blue-500">
            ${collectionData.valueChange.toFixed(2)} 
            <span className={collectionData.valueChange >= 0 ? 'text-green-500' : 'text-red-500'}>
              {collectionData.valueChange >= 0 ? '↑' : '↓'} ({collectionData.valueChangePercentage.toFixed(1)}%)
            </span>
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Value Timeline */}
        <div className="bg-[#2a2a2a] p-6 rounded-lg col-span-2">
          <h2 className="text-gray-400 text-sm mb-4">Value Timeline</h2>
          <div className="h-[300px]">
            <Line data={timelineData} options={timelineOptions} />
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-[#2a2a2a] p-6 rounded-lg">
          <h2 className="text-gray-400 text-sm mb-4">Geographic Distribution</h2>
          <div className="h-[300px]">
            <Pie data={geoDistributionData} options={pieOptions} />
          </div>
        </div>

        {/* Collection Composition */}
        <div className="bg-[#2a2a2a] p-6 rounded-lg">
          <h2 className="text-gray-400 text-sm mb-4">Collection Composition</h2>
          <div className="h-[300px]">
            <Doughnut data={compositionData} options={pieOptions} />
          </div>
        </div>

        {/* Year Distribution */}
        <div className="bg-[#2a2a2a] p-6 rounded-lg col-span-2">
          <h2 className="text-gray-400 text-sm mb-4">Year Distribution</h2>
          <div className="h-[300px]">
            <Bar data={yearDistributionData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
} 