"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import DashboardSelector, {
  DashboardTier,
} from "@/components/analysis/DashboardSelector"
import BasicDashboard from "@/components/analysis/BasicDashboard"
import BetterDashboard from "@/components/analysis/BetterDashboard"
import AdvancedDashboard from "@/components/analysis/AdvancedDashboard"
import { Coin } from "@/utils/analyticsUtils"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

const STORAGE_KEY = "coin-collection-dashboard-tier"

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [coins, setCoins] = useState<Coin[]>([])
  const [dashboardTier, setDashboardTier] =
    useState<DashboardTier>("advanced")

  useEffect(() => {
    const savedTier = localStorage.getItem(STORAGE_KEY) as DashboardTier
    if (
      savedTier &&
      ["basic", "better", "advanced"].includes(savedTier)
    ) {
      setDashboardTier(savedTier)
    }
  }, [])

  const handleTierChange = (newTier: DashboardTier) => {
    setDashboardTier(newTier)
    localStorage.setItem(STORAGE_KEY, newTier)
  }

  useEffect(() => {
    const fetchCoins = async (userId: string) => {
      try {
        setLoading(true)
        const { data: collections } = await supabase
          .from("collections")
          .select("id")
          .eq("user_id", userId)

        if (!collections?.length) {
          setCoins([])
          return
        }

        const { data: coins } = await supabase
          .from("coins")
          .select("*")
          .in(
            "collection_id",
            collections.map((c) => c.id)
          )
          .order("purchase_date", { ascending: true })

        setCoins(coins || [])
      } catch (error) {
        console.error("Error fetching coins:", error)
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
      case "basic":
        return <BasicDashboard coins={coins} />
      case "better":
        return <BetterDashboard coins={coins} />
      case "advanced":
        return <AdvancedDashboard coins={coins} />
      default:
        return <AdvancedDashboard coins={coins} />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Collection Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dashboardTier === "basic" &&
              "Essential insights into your coin collection"}
            {dashboardTier === "better" &&
              "Enhanced analytics with performance tracking"}
            {dashboardTier === "advanced" &&
              "Comprehensive analytics and smart insights"}
          </p>
        </div>

        <DashboardSelector
          currentTier={dashboardTier}
          onTierChange={handleTierChange}
        />
      </div>

      {renderDashboard()}
    </div>
  )
}
