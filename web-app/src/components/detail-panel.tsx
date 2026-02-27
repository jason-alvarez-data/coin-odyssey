"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Pencil,
  Calendar,
  Globe,
  Hash,
  DollarSign,
  Star,
  BookOpen,
  Coins,
  X,
} from "lucide-react"
import type { Coin } from "@coin-collecting/shared"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DetailPanelProps {
  coin: Coin | null
  onClose?: () => void
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number | null | undefined
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-sm font-semibold truncate">
        {value ?? "—"}
      </p>
    </div>
  )
}

export function DetailPanel({ coin, onClose }: DetailPanelProps) {
  if (!coin) return null

  const coinImage = coin.obverseImage || coin.images?.[0]
  const displayValue =
    coin.purchasePrice != null
      ? `$${Number(coin.purchasePrice).toFixed(2)}`
      : "—"

  return (
    <div className="w-80 border-l border-border bg-card/50 flex flex-col">
      {/* Close Button */}
      {onClose && (
        <div className="flex justify-end p-2 pb-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <ScrollArea className="flex-1">
        {/* Header */}
        <CardHeader className="pb-3 pt-0">
          {/* Coin Image */}
          <div className="flex justify-center mb-3">
            {coinImage ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted">
                <Image
                  src={coinImage}
                  alt={coin.denomination || "Coin"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <Coins className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Name & Value */}
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-base leading-tight">
              {coin.title || coin.denomination}
            </h3>
            {coin.year && (
              <p className="text-xs text-muted-foreground">{coin.year}</p>
            )}
            <p className="text-xl font-bold text-primary">{displayValue}</p>
          </div>

          {/* Badges */}
          <div className="flex justify-center gap-1.5 mt-2 flex-wrap">
            {coin.grade && <Badge variant="secondary">{coin.grade}</Badge>}
            {coin.country && (
              <Badge variant="outline">{coin.country}</Badge>
            )}
            {coin.series && (
              <Badge variant="outline">{coin.series}</Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3 justify-center">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/collection/edit/${coin.id}`}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
          </div>
        </CardHeader>

        <Separator />

        {/* Tabbed Content */}
        <div className="p-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1 text-xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="details" className="flex-1 text-xs">
                Details
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex-1 text-xs">
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  label="Year"
                  value={coin.year}
                  icon={Calendar}
                />
                <MetricCard
                  label="Country"
                  value={coin.country}
                  icon={Globe}
                />
                <MetricCard
                  label="Denomination"
                  value={coin.denomination}
                  icon={Coins}
                />
                <MetricCard
                  label="Grade"
                  value={coin.grade}
                  icon={Star}
                />
                <MetricCard
                  label="Mint Mark"
                  value={coin.mintMark}
                  icon={Hash}
                />
                <MetricCard
                  label="Value"
                  value={displayValue}
                  icon={DollarSign}
                />
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  label="Series"
                  value={coin.series}
                  icon={BookOpen}
                />
                <MetricCard
                  label="Purchase Date"
                  value={
                    coin.purchaseDate
                      ? new Date(coin.purchaseDate).toLocaleDateString()
                      : null
                  }
                  icon={Calendar}
                />
                <MetricCard
                  label="Mintage"
                  value={
                    coin.mintage
                      ? coin.mintage.toLocaleString()
                      : null
                  }
                  icon={Hash}
                />
                <MetricCard
                  label="Rarity"
                  value={
                    coin.rarityScale
                      ? `${coin.rarityScale}/10`
                      : null
                  }
                  icon={Star}
                />
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-3">
              <Card className="bg-muted/30">
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {coin.notes || "No notes added yet."}
                  </p>
                  {coin.historicalNotes && (
                    <>
                      <Separator className="my-3" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Historical Notes
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {coin.historicalNotes}
                        </p>
                      </div>
                    </>
                  )}
                  {coin.varietyNotes && (
                    <>
                      <Separator className="my-3" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Variety Notes
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {coin.varietyNotes}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}
