"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { CoinService } from "@/services/coinService"
import { Coin } from "@coin-collecting/shared"
import type { User } from "@supabase/supabase-js"
import Link from "next/link"
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  FileDown,
  FileText,
  Plus,
  Coins,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/utils/formatters"
import {
  getDisplayCurrency,
  getDisplayGrade,
  getDisplayMintMark,
  formatSortableValue,
} from "@/utils/coinUtils"
import { DetailPanel } from "@/components/detail-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function CollectionPage() {
  const [user, setUser] = useState<User | null>(null)
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [isClearing, setIsClearing] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "asc" | "desc"
  } | null>(null)
  const [selectedCoins, setSelectedCoins] = useState<string[]>([])
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        fetchCoins(user.id)
      }
    })
  }, [])

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
        .order("purchase_date", { ascending: false })

      setCoins((coins || []).map(CoinService.mapSupabaseToCoin))
    } catch (error) {
      console.error("Error fetching coins:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearCollection = async () => {
    if (!user) return
    try {
      setIsClearing(true)
      const { data: collections } = await supabase
        .from("collections")
        .select("id")
        .eq("user_id", user.id)

      if (!collections?.length) return

      const { error } = await supabase
        .from("coins")
        .delete()
        .in(
          "collection_id",
          collections.map((c) => c.id)
        )

      if (error) throw error
      setCoins([])
      setShowClearConfirm(false)
    } catch (error) {
      console.error("Error clearing collection:", error)
    } finally {
      setIsClearing(false)
    }
  }

  const handleDelete = async (coinId: string) => {
    try {
      setIsDeleting(true)
      const { error } = await supabase
        .from("coins")
        .delete()
        .eq("id", coinId)

      if (error) throw error
      setCoins(coins.filter((coin) => coin.id !== coinId))
      setShowDeleteConfirm(null)
      if (selectedCoin?.id === coinId) setSelectedCoin(null)
    } catch (error) {
      console.error("Error deleting coin:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const getSortedCoins = (coinsToSort: Coin[]) => {
    if (!sortConfig) return coinsToSort
    return [...coinsToSort].sort((a, b) => {
      const { key, direction } = sortConfig
      let aValue: string | number
      let bValue: string | number

      switch (key) {
        case "purchaseDate":
          aValue = a.purchaseDate
            ? new Date(a.purchaseDate).getTime()
            : 0
          bValue = b.purchaseDate
            ? new Date(b.purchaseDate).getTime()
            : 0
          break
        case "faceValue":
          aValue = a.faceValue || 0
          bValue = b.faceValue || 0
          break
        case "purchasePrice":
          aValue = a.purchasePrice || 0
          bValue = b.purchasePrice || 0
          break
        case "currentMarketValue":
          aValue = a.currentMarketValue || 0
          bValue = b.currentMarketValue || 0
          break
        case "year":
          aValue = a.year || 0
          bValue = b.year || 0
          break
        case "title":
          aValue = (a.title || "").toLowerCase()
          bValue = (b.title || "").toLowerCase()
          break
        case "denomination":
          aValue = (a.denomination || "").toLowerCase()
          bValue = (b.denomination || "").toLowerCase()
          break
        case "mintMark":
          aValue = (a.mintMark || "").toLowerCase()
          bValue = (b.mintMark || "").toLowerCase()
          break
        case "grade":
          aValue = (a.grade || "").toLowerCase()
          bValue = (b.grade || "").toLowerCase()
          break
        case "country":
          aValue = (a.country || "").toLowerCase()
          bValue = (b.country || "").toLowerCase()
          break
        default:
          aValue = formatSortableValue(a[key as keyof Coin])
          bValue = formatSortableValue(b[key as keyof Coin])
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1
      if (aValue > bValue) return direction === "asc" ? 1 : -1
      return 0
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCoins(paginatedCoins.map((coin) => coin.id))
    } else {
      setSelectedCoins([])
    }
  }

  const handleSelectCoin = (coinId: string, checked: boolean) => {
    if (checked) {
      setSelectedCoins([...selectedCoins, coinId])
    } else {
      setSelectedCoins(selectedCoins.filter((id) => id !== coinId))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCoins.length === 0) return
    try {
      setIsDeleting(true)
      const { error } = await supabase
        .from("coins")
        .delete()
        .in("id", selectedCoins)

      if (error) throw error
      setCoins(coins.filter((coin) => !selectedCoins.includes(coin.id)))
      setSelectedCoins([])
      if (selectedCoin && selectedCoins.includes(selectedCoin.id))
        setSelectedCoin(null)
    } catch (error) {
      console.error("Error deleting coins:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExportCSV = () => {
    const coinsToExport = coins.filter((coin) =>
      selectedCoins.includes(coin.id)
    )
    const csvContent = [
      [
        "Title",
        "Denomination",
        "Year",
        "Mint Mark",
        "Grade",
        "Face Value",
        "Purchase Price",
        "Current Value",
        "Country",
        "Purchase Date",
        "Notes",
      ],
      ...coinsToExport.map((coin) => [
        coin.title || "",
        coin.denomination || "",
        coin.year?.toString() || "",
        coin.mintMark || "",
        coin.grade || "",
        coin.faceValue?.toString() || "",
        coin.purchasePrice?.toString() || "",
        coin.currentMarketValue?.toString() || "",
        coin.country || "",
        coin.purchaseDate || "",
        coin.notes || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `coin-collection-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const coinsToExport = coins.filter((coin) =>
      selectedCoins.includes(coin.id)
    )
    const htmlContent = `<!DOCTYPE html><html><head><title>Coin Collection Export</title><style>body{font-family:Arial,sans-serif;margin:20px}h1{color:#333;border-bottom:2px solid #333;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#f2f2f2;font-weight:bold}tr:nth-child(even){background-color:#f9f9f9}</style></head><body><h1>Coin Collection Export</h1><p>Export Date: ${new Date().toLocaleDateString()}</p><p>Total Coins: ${coinsToExport.length}</p><table><thead><tr><th>Title</th><th>Denomination</th><th>Year</th><th>Country</th><th>Grade</th><th>Purchase Price</th><th>Current Value</th></tr></thead><tbody>${coinsToExport
      .map(
        (coin) =>
          `<tr><td>${coin.title || "Untitled"}</td><td>${coin.denomination || ""}</td><td>${coin.year || ""}</td><td>${coin.country || ""}</td><td>${coin.grade || ""}</td><td>${coin.purchasePrice ? formatCurrency(coin.purchasePrice) : ""}</td><td>${coin.currentMarketValue ? formatCurrency(coin.currentMarketValue) : ""}</td></tr>`
      )
      .join("")}</tbody></table></body></html>`

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  // Filter, sort, paginate
  const filteredCoins = coins.filter((coin) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      coin.title?.toLowerCase().includes(searchLower) ||
      coin.denomination?.toLowerCase().includes(searchLower) ||
      coin.year?.toString().includes(searchQuery) ||
      coin.mintMark?.toLowerCase().includes(searchLower) ||
      coin.grade?.toLowerCase().includes(searchLower)
    )
  })

  const sortedAndFilteredCoins = getSortedCoins(filteredCoins)
  const totalPages = Math.ceil(sortedAndFilteredCoins.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCoins = sortedAndFilteredCoins.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column)
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary" />
    )
  }

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              My Collection
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {sortedAndFilteredCoins.length}{" "}
              {sortedAndFilteredCoins.length === 1 ? "coin" : "coins"} in
              collection
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/dashboard/add">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Coin
              </Link>
            </Button>
            {coins.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                disabled={isClearing}
              >
                {isClearing ? "Clearing..." : "Clear All"}
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, denomination, year, mint mark, or grade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Bulk Actions */}
        {selectedCoins.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {selectedCoins.length} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCoins([])}
                >
                  Clear
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                >
                  <FileDown className="mr-1.5 h-3.5 w-3.5" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  PDF
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading collection...</p>
          </div>
        ) : sortedAndFilteredCoins.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center text-center">
              <Coins className="h-12 w-12 text-muted-foreground/40 mb-3" />
              {searchQuery ? (
                <p className="text-muted-foreground">
                  No coins found matching your search
                </p>
              ) : (
                <>
                  <p className="text-muted-foreground mb-3">
                    Your collection is empty
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/add">Add Your First Coin</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={
                            selectedCoins.length ===
                              paginatedCoins.length &&
                            paginatedCoins.length > 0
                          }
                          onChange={(e) =>
                            handleSelectAll(e.target.checked)
                          }
                          className="h-4 w-4 rounded border-border"
                        />
                      </TableHead>
                      {[
                        { key: "purchaseDate", label: "Date" },
                        { key: "title", label: "Coin" },
                        { key: "year", label: "Year" },
                        { key: "country", label: "Country" },
                        { key: "mintMark", label: "Mint" },
                        { key: "grade", label: "Grade" },
                        { key: "purchasePrice", label: "Price" },
                        { key: "currentMarketValue", label: "Value" },
                      ].map((col) => (
                        <TableHead
                          key={col.key}
                          className="cursor-pointer select-none hover:bg-accent/50"
                          onClick={() => handleSort(col.key)}
                        >
                          <div className="flex items-center gap-1">
                            <span>{col.label}</span>
                            <SortIcon column={col.key} />
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCoins.map((coin) => (
                      <TableRow
                        key={coin.id}
                        className={`cursor-pointer ${
                          selectedCoin?.id === coin.id
                            ? "bg-accent"
                            : ""
                        }`}
                        onClick={() => setSelectedCoin(coin)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedCoins.includes(coin.id)}
                            onChange={(e) =>
                              handleSelectCoin(
                                coin.id,
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 rounded border-border"
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(coin.purchaseDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {coin.images && coin.images.length > 0 && (
                              <img
                                src={coin.images[0]}
                                alt={coin.title || "Coin"}
                                className="h-7 w-7 rounded-full object-cover border border-border"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium leading-tight">
                                {coin.title || "Untitled Coin"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {coin.denomination}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {coin.year}
                        </TableCell>
                        <TableCell className="text-sm">
                          {coin.country || (
                            <span className="text-muted-foreground italic">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getDisplayMintMark(coin.mintMark)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {coin.grade ? (
                            <Badge variant="outline" className="text-xs">
                              {getDisplayGrade(coin.grade)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground italic">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-primary">
                          {coin.purchasePrice
                            ? formatCurrency(coin.purchasePrice)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {coin.currentMarketValue
                            ? formatCurrency(coin.currentMarketValue)
                            : "—"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              asChild
                            >
                              <Link
                                href={`/collection/edit/${coin.id}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() =>
                                setShowDeleteConfirm(coin.id)
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium">{startIndex + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(
                      startIndex + itemsPerPage,
                      sortedAndFilteredCoins.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">
                    {sortedAndFilteredCoins.length}
                  </span>
                </p>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(v) => setItemsPerPage(Number(v))}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {totalPages > 1 &&
                  Array.from(
                    { length: Math.min(totalPages, 5) },
                    (_, i) => {
                      let page: number
                      if (totalPages <= 5) {
                        page = i + 1
                      } else if (currentPage <= 3) {
                        page = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i
                      } else {
                        page = currentPage - 2 + i
                      }
                      return (
                        <Button
                          key={page}
                          variant={
                            currentPage === page
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      )
                    }
                  )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(totalPages, p + 1)
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Panel — only shown when a coin is selected */}
      {selectedCoin && (
        <DetailPanel
          coin={selectedCoin}
          onClose={() => setSelectedCoin(null)}
        />
      )}

      {/* Clear Confirmation Dialog */}
      <Dialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear your entire collection? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearCollection}
              disabled={isClearing}
            >
              {isClearing ? "Clearing..." : "Clear Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!showDeleteConfirm}
        onOpenChange={(open) => !open && setShowDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coin</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this coin? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                showDeleteConfirm && handleDelete(showDeleteConfirm)
              }
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Coin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
