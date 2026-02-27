"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { AchievementService } from "@/services/achievementService"
import { Achievement, ACHIEVEMENTS, RARITY_COLORS } from "@coin-collecting/shared"
import AchievementCard from "@/components/achievements/AchievementCard"
import { Trophy, Sparkles, Zap, Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<
    (Achievement & { progress?: { current: number; required: number } })[]
  >([])
  const [stats, setStats] = useState({
    totalUnlocked: 0,
    totalAvailable: ACHIEVEMENTS.length,
    recentUnlocked: [] as Achievement[],
    nearCompletion: [] as Achievement[],
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<
    | "all"
    | "unlocked"
    | "locked"
    | "common"
    | "uncommon"
    | "rare"
    | "epic"
    | "legendary"
  >("all")
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "goal" | "collection" | "milestone" | "special"
  >("all")

  useEffect(() => {
    loadAchievements()
  }, [])

  const loadAchievements = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const [achievementsData, statsData] = await Promise.all([
        AchievementService.getAvailableAchievements(user.id),
        AchievementService.getAchievementStats(user.id),
      ])

      setAchievements(achievementsData)
      setStats(statsData)
    } catch (error) {
      console.error("Error loading achievements:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAchievements = achievements.filter((achievement) => {
    const isUnlocked =
      achievement.progress &&
      achievement.progress.current >= achievement.progress.required

    if (filter === "unlocked" && !isUnlocked) return false
    if (filter === "locked" && isUnlocked) return false
    if (
      filter !== "all" &&
      filter !== "unlocked" &&
      filter !== "locked" &&
      achievement.rarity !== filter
    )
      return false

    if (categoryFilter !== "all" && achievement.category !== categoryFilter)
      return false

    return true
  })

  const rarityDistribution = {
    common: achievements.filter(
      (a) =>
        a.rarity === "common" &&
        a.progress &&
        a.progress.current >= a.progress.required
    ).length,
    uncommon: achievements.filter(
      (a) =>
        a.rarity === "uncommon" &&
        a.progress &&
        a.progress.current >= a.progress.required
    ).length,
    rare: achievements.filter(
      (a) =>
        a.rarity === "rare" &&
        a.progress &&
        a.progress.current >= a.progress.required
    ).length,
    epic: achievements.filter(
      (a) =>
        a.rarity === "epic" &&
        a.progress &&
        a.progress.current >= a.progress.required
    ).length,
    legendary: achievements.filter(
      (a) =>
        a.rarity === "legendary" &&
        a.progress &&
        a.progress.current >= a.progress.required
    ).length,
  }

  const FilterButton = ({
    value,
    current,
    onClick,
    children,
  }: {
    value: string
    current: string
    onClick: () => void
    children: React.ReactNode
  }) => (
    <Button
      variant={current === value ? "default" : "secondary"}
      size="sm"
      onClick={onClick}
      className="text-xs"
    >
      {children}
    </Button>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your collecting accomplishments and unlock rewards
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Unlocked</p>
                <p className="text-xl font-bold text-yellow-500 mt-0.5">
                  {stats.totalUnlocked}/{stats.totalAvailable}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
            <Progress
              value={(stats.totalUnlocked / stats.totalAvailable) * 100}
              className="h-1.5 mt-3"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Recent</p>
                <p className="text-xl font-bold text-green-500 mt-0.5">
                  {stats.recentUnlocked.length}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Sparkles className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Near Completion
                </p>
                <p className="text-xl font-bold text-primary mt-0.5">
                  {stats.nearCompletion.length}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              &ge;75% progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Rarity</p>
            <div className="space-y-1.5">
              {Object.entries(rarityDistribution).map(
                ([rarity, count]) =>
                  count > 0 && (
                    <div
                      key={rarity}
                      className="flex items-center justify-between text-xs"
                    >
                      <span
                        className="capitalize font-medium"
                        style={{
                          color:
                            RARITY_COLORS[
                              rarity as keyof typeof RARITY_COLORS
                            ],
                        }}
                      >
                        {rarity}
                      </span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Status
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "unlocked", "locked"] as const).map((f) => (
                  <FilterButton
                    key={f}
                    value={f}
                    current={filter}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </FilterButton>
                ))}
              </div>
            </div>

            <Separator orientation="vertical" className="hidden sm:block" />

            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Rarity
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {(
                  [
                    "all",
                    "common",
                    "uncommon",
                    "rare",
                    "epic",
                    "legendary",
                  ] as const
                ).map((r) => (
                  <FilterButton
                    key={r}
                    value={r}
                    current={filter}
                    onClick={() => setFilter(r)}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </FilterButton>
                ))}
              </div>
            </div>

            <Separator orientation="vertical" className="hidden sm:block" />

            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Category
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {(
                  [
                    "all",
                    "goal",
                    "collection",
                    "milestone",
                    "special",
                  ] as const
                ).map((c) => (
                  <FilterButton
                    key={c}
                    value={c}
                    current={categoryFilter}
                    onClick={() => setCategoryFilter(c)}
                  >
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </FilterButton>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAchievements.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center text-center">
            <Lock className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="font-medium mb-1">No achievements found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters to see more achievements
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}
    </div>
  )
}
