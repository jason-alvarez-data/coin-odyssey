"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { CoinService } from "@/services/coinService"
import { Coin } from "@coin-collecting/shared"
import WorldMap from "@/components/WorldMap"
import { getStandardizedCountryName } from "@/utils/countryMappings"
import { StatsRow } from "@/components/dashboard/stats-row"
import { FeaturedItems } from "@/components/dashboard/featured-items"
import { CtaCard } from "@/components/dashboard/cta-card"
import { ActiveItemsList } from "@/components/dashboard/active-items-list"
import { DetailPanel } from "@/components/detail-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe } from "lucide-react"

interface DashboardStats {
  totalCoins: number
  totalCountries: number
  yearsSpan: string
  totalValue: number
  countryDistribution: { [key: string]: number }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCoins: 0,
    totalCountries: 0,
    yearsSpan: "-",
    totalValue: 0,
    countryDistribution: {},
  })
  const [topCoins, setTopCoins] = useState<Coin[]>([])
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await fetchDashboardStats(user.id)
      }
    }

    fetchData()

    const channel = supabase
      .channel("public:coins")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coins" },
        async () => {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            await fetchDashboardStats(user.id)
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const fetchDashboardStats = async (userId: string) => {
    try {
      const { data: collections, error: collectionsError } = await supabase
        .from("collections")
        .select("id")
        .eq("user_id", userId)

      if (collectionsError) throw collectionsError
      if (!collections?.length) {
        setStats({
          totalCoins: 0,
          totalCountries: 0,
          yearsSpan: "-",
          totalValue: 0,
          countryDistribution: {},
        })
        setTopCoins([])
        return
      }

      const { data: coins, error: coinsError } = await supabase
        .from("coins")
        .select("*")
        .in(
          "collection_id",
          collections.map((c) => c.id)
        )

      if (coinsError) throw coinsError
      if (!coins) {
        setStats((prev) => ({ ...prev, countryDistribution: {} }))
        return
      }

      const mappedCoins = coins.map(CoinService.mapSupabaseToCoin)

      const years = mappedCoins.map((coin) => coin.year)
      const oldestYear = years.length ? Math.min(...years) : 0
      const newestYear = years.length ? Math.max(...years) : 0
      const yearsSpan = years.length ? `${oldestYear} - ${newestYear}` : "-"
      const totalValue = mappedCoins.reduce(
        (sum, coin) => sum + (Number(coin.purchasePrice) || 0),
        0
      )

      const countryDistribution = mappedCoins.reduce(
        (acc: { [key: string]: number }, coin) => {
          if (coin.country) {
            const country = getStandardizedCountryName(coin.country)
            acc[country] = (acc[country] || 0) + 1
          }
          return acc
        },
        {}
      )

      setStats({
        totalCoins: mappedCoins.length,
        totalCountries: Object.keys(countryDistribution).length,
        yearsSpan,
        totalValue,
        countryDistribution,
      })

      // Get top coins by value for featured section
      const sorted = [...mappedCoins]
        .filter((c) => Number(c.purchasePrice) > 0)
        .sort(
          (a, b) =>
            (Number(b.purchasePrice) || 0) -
            (Number(a.purchasePrice) || 0)
        )
        .slice(0, 4)
      setTopCoins(sorted)
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      setStats((prev) => ({ ...prev }))
    }
  }

  return (
    <div className="flex">
      {/* Main Content Column */}
      <div className="flex-1 space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Collection Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your coin collection
          </p>
        </div>

        {/* Stats Row */}
        <StatsRow
          totalCoins={stats.totalCoins}
          totalCountries={stats.totalCountries}
          yearsSpan={stats.yearsSpan}
          totalValue={stats.totalValue}
        />

        {/* Featured Items */}
        <FeaturedItems
          coins={topCoins}
          onSelect={(coin) => setSelectedCoin(coin as Coin)}
          selectedId={selectedCoin?.id}
        />

        {/* CTA Card */}
        <CtaCard />

        {/* Map + Active Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Collection Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WorldMap
                  collectedCountries={stats.countryDistribution}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <ActiveItemsList
              onSelect={(coin) => setSelectedCoin(coin as Coin)}
              selectedId={selectedCoin?.id}
            />
          </div>
        </div>
      </div>

      {/* Detail Panel — only shown when a coin is selected */}
      {selectedCoin && (
        <DetailPanel
          coin={selectedCoin}
          onClose={() => setSelectedCoin(null)}
        />
      )}
    </div>
  )
}
