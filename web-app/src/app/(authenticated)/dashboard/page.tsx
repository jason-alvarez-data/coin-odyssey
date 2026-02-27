"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
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

interface DashboardCoin {
  id: string
  title: string
  denomination: string
  year: number
  country: string
  purchase_price: number
  grade?: string
  mint_mark?: string
  series?: string
  notes?: string
  created_at: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCoins: 0,
    totalCountries: 0,
    yearsSpan: "-",
    totalValue: 0,
    countryDistribution: {},
  })
  const [topCoins, setTopCoins] = useState<DashboardCoin[]>([])
  const [selectedCoin, setSelectedCoin] = useState<DashboardCoin | null>(null)

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

      const years = coins.map((coin) => coin.year)
      const oldestYear = years.length ? Math.min(...years) : 0
      const newestYear = years.length ? Math.max(...years) : 0
      const yearsSpan = years.length ? `${oldestYear} - ${newestYear}` : "-"
      const totalValue = coins.reduce(
        (sum, coin) => sum + (parseFloat(coin.purchase_price) || 0),
        0
      )

      const countryDistribution = coins.reduce(
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
        totalCoins: coins.length,
        totalCountries: Object.keys(countryDistribution).length,
        yearsSpan,
        totalValue,
        countryDistribution,
      })

      // Get top coins by value for featured section
      const sorted = [...coins]
        .filter((c) => parseFloat(c.purchase_price) > 0)
        .sort(
          (a, b) =>
            parseFloat(b.purchase_price || "0") -
            parseFloat(a.purchase_price || "0")
        )
        .slice(0, 4)
      setTopCoins(sorted)
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      setStats((prev) => ({ ...prev }))
    }
  }

  // Map a dashboard coin to the Coin type expected by DetailPanel
  const mapToDetailCoin = (coin: DashboardCoin | null) => {
    if (!coin) return null
    return {
      id: coin.id,
      name: coin.title || coin.denomination,
      title: coin.title || `${coin.year} ${coin.denomination}`,
      year: coin.year,
      mintMark: coin.mint_mark || null,
      grade: coin.grade || null,
      faceValue: null,
      purchasePrice: coin.purchase_price ?? null,
      currentMarketValue: null,
      lastValueUpdate: null,
      pcgsId: null,
      createdAt: coin.created_at,
      updatedAt: coin.created_at,
      userId: "",
      collectionId: "",
      denomination: coin.denomination,
      purchaseDate: null,
      personalValue: null,
      lastAppraisalValue: null,
      lastAppraisalDate: null,
      mintage: null,
      rarityScale: null,
      historicalNotes: null,
      varietyNotes: null,
      notes: coin.notes || null,
      images: null,
      obverseImage: null,
      reverseImage: null,
      country: coin.country || null,
      series: coin.series || null,
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
          onSelect={(coin) => setSelectedCoin(coin as DashboardCoin)}
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
              onSelect={(coin) => setSelectedCoin(coin as DashboardCoin)}
              selectedId={selectedCoin?.id}
            />
          </div>
        </div>
      </div>

      {/* Detail Panel — only shown when a coin is selected */}
      {selectedCoin && (
        <DetailPanel
          coin={mapToDetailCoin(selectedCoin)}
          onClose={() => setSelectedCoin(null)}
        />
      )}
    </div>
  )
}
