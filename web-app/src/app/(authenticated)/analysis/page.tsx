'use client';

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Header from '@/components/layout/Header'
import DashboardSelector, { DashboardTier } from '@/components/analysis/DashboardSelector'
import BasicDashboard from '@/components/analysis/BasicDashboard'
import BetterDashboard from '@/components/analysis/BetterDashboard'
import AdvancedDashboard from '@/components/analysis/AdvancedDashboard'
import { Coin } from '@/utils/analyticsUtils'

const STORAGE_KEY = 'coin-collection-dashboard-tier';

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [coins, setCoins] = useState<Coin[]>([])
  const [dashboardTier, setDashboardTier] = useState<DashboardTier>('advanced')

  // Load saved dashboard tier preference
  useEffect(() => {
    const savedTier = localStorage.getItem(STORAGE_KEY) as DashboardTier;
    if (savedTier && ['basic', 'better', 'advanced'].includes(savedTier)) {
      setDashboardTier(savedTier);
    }
  }, []);

  // Save dashboard tier preference
  const handleTierChange = (newTier: DashboardTier) => {
    setDashboardTier(newTier);
    localStorage.setItem(STORAGE_KEY, newTier);
  };

  useEffect(() => {
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
      } catch (error) {
        console.error('Error fetching coins:', error)
      } finally {
        setLoading(false)
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetchCoins(user.id)
      }
    })
  }, [])



  const renderDashboard = () => {
    switch (dashboardTier) {
      case 'basic':
        return <BasicDashboard coins={coins} />;
      case 'better':
        return <BetterDashboard coins={coins} />;
      case 'advanced':
        return <AdvancedDashboard coins={coins} />;
      default:
        return <AdvancedDashboard coins={coins} />;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#1e1e1e] p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-white text-lg">Analyzing your collection...</div>
            <div className="text-gray-400 text-sm mt-2">Calculating insights and metrics</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#1e1e1e] min-h-screen">
      <div className="p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Collection Analytics</h1>
            <p className="text-gray-400">
              {dashboardTier === 'basic' && 'Essential insights into your coin collection'}
              {dashboardTier === 'better' && 'Enhanced analytics with performance tracking'}
              {dashboardTier === 'advanced' && 'Comprehensive analytics and smart insights'}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <DashboardSelector 
              currentTier={dashboardTier}
              onTierChange={handleTierChange}
            />
            <Header />
          </div>
        </div>

        {/* Dashboard Content */}
        {renderDashboard()}
      </div>
    </div>
  );
} 