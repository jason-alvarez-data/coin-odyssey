"use client"

import { Coins, Globe, Calendar, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface StatsRowProps {
  totalCoins: number
  totalCountries: number
  yearsSpan: string
  totalValue: number
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-xl font-bold text-primary truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsRow({ totalCoins, totalCountries, yearsSpan, totalValue }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="Total Coins" value={totalCoins} icon={Coins} />
      <StatCard label="Countries" value={totalCountries} icon={Globe} />
      <StatCard label="Years Range" value={yearsSpan} icon={Calendar} />
      <StatCard
        label="Estimated Value"
        value={`$${totalValue.toFixed(2)}`}
        icon={DollarSign}
      />
    </div>
  )
}
