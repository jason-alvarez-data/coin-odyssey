"use client"

import { TrendingUp, Coins } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface FeaturedCoin {
  id: string
  title?: string
  denomination: string
  year: number
  country?: string
  purchase_price?: number
  grade?: string
}

interface FeaturedItemsProps {
  coins: FeaturedCoin[]
  onSelect: (coin: FeaturedCoin) => void
  selectedId?: string
}

export function FeaturedItems({ coins, onSelect, selectedId }: FeaturedItemsProps) {
  if (coins.length === 0) return null

  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Top Items
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {coins.map((coin) => (
          <Card
            key={coin.id}
            className={`cursor-pointer transition-all hover:shadow-md hover:shadow-primary/5 hover:border-primary/30 ${
              selectedId === coin.id
                ? "border-primary/50 shadow-md shadow-primary/10"
                : "border-border"
            }`}
            onClick={() => onSelect(coin)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Coins className="h-4 w-4 text-primary" />
                </div>
                {coin.grade && (
                  <Badge variant="secondary" className="text-[10px]">
                    {coin.grade}
                  </Badge>
                )}
              </div>
              <h3 className="text-sm font-semibold leading-tight truncate">
                {coin.title || `${coin.year} ${coin.denomination}`}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {coin.country} {coin.year && `· ${coin.year}`}
              </p>
              {coin.purchase_price != null && coin.purchase_price > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-sm font-bold text-primary">
                    ${Number(coin.purchase_price).toFixed(2)}
                  </span>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
