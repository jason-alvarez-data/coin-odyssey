"use client"

import Link from "next/link"
import { Plus, Upload, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function CtaCard() {
  return (
    <Card className="border-border bg-gradient-to-r from-primary/5 via-card to-primary/5 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] to-transparent pointer-events-none" />
      <CardContent className="p-6 flex items-center justify-between relative">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Grow Your Collection</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add coins individually or import your entire collection at once.
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 ml-4">
          <Button asChild size="sm">
            <Link href="/dashboard/add">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Coin
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/upload">
              <Upload className="mr-1.5 h-4 w-4" />
              Import
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
