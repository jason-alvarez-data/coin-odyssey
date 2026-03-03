"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import ConsentManager from "@/components/ConsentManager"
import GlobalPrivacyControl from "@/components/GlobalPrivacyControl"
import { supabase } from "@/lib/supabase"
import { CoinService } from "@/services/coinService"
import type { User } from "@supabase/supabase-js"
import { Download, Upload, Trash2, KeyRound, User as UserIcon, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const SETTINGS_STORAGE_KEY = "coin-odyssey-settings"

const DEFAULT_SETTINGS = {
  theme: "Dark",
  currencyFormat: "USD ($)",
  dateFormat: "MM/DD/YYYY",
  defaultView: "Table View",
  defaultSorting: "Date Added",
  visibleColumns: {
    dateCollected: true,
    title: true,
    year: true,
    country: true,
    value: true,
    unit: true,
    mint: true,
    mintMark: true,
    status: true,
    type: true,
    series: true,
    storage: true,
    format: true,
    region: true,
    quantity: true,
  },
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [settingsSaved, setSettingsSaved] = useState(false)

  // Account section
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Data management
  const [exportLoading, setExportLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [dataMessage, setDataMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [clearLoading, setClearLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Load settings from localStorage
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      } catch {
        // Ignore invalid JSON
      }
    }
  }, [])

  // Save settings to localStorage whenever they change
  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings)
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings))
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  const handleCheckboxChange = (field: string) => {
    const newSettings = {
      ...settings,
      visibleColumns: {
        ...settings.visibleColumns,
        [field]: !settings.visibleColumns[field as keyof typeof settings.visibleColumns],
      },
    }
    saveSettings(newSettings)
  }

  const handleSelectChange = (field: string, value: string) => {
    saveSettings({ ...settings, [field]: value })
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (passwordForm.new.length < 6) {
      setPasswordMessage({ type: "error", text: "New password must be at least 6 characters" })
      return
    }

    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordMessage({ type: "error", text: "Passwords do not match" })
      return
    }

    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new })
      if (error) throw error
      setPasswordMessage({ type: "success", text: "Password updated successfully" })
      setPasswordForm({ current: "", new: "", confirm: "" })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to update password"
      setPasswordMessage({ type: "error", text: msg })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleExportBackup = async () => {
    if (!user) return
    setExportLoading(true)
    setDataMessage(null)

    try {
      const { data: collections } = await supabase
        .from("collections")
        .select("id")
        .eq("user_id", user.id)

      if (!collections?.length) {
        setDataMessage({ type: "error", text: "No collections found to export" })
        return
      }

      const { data: coins } = await supabase
        .from("coins")
        .select("*")
        .in("collection_id", collections.map((c) => c.id))

      const mapped = (coins || []).map(CoinService.mapSupabaseToCoin)

      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        coinCount: mapped.length,
        coins: mapped,
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `coin-odyssey-backup-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      setDataMessage({ type: "success", text: `Exported ${mapped.length} coins` })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Export failed"
      setDataMessage({ type: "error", text: msg })
    } finally {
      setExportLoading(false)
    }
  }

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setImportLoading(true)
    setDataMessage(null)

    try {
      const text = await file.text()
      const backup = JSON.parse(text)

      if (!backup.coins || !Array.isArray(backup.coins)) {
        throw new Error("Invalid backup file format")
      }

      // Get or create collection
      let { data: collections } = await supabase
        .from("collections")
        .select("id")
        .eq("user_id", user.id)

      let collectionId: string
      if (collections?.length) {
        collectionId = collections[0].id
      } else {
        const { data: newCollection, error } = await supabase
          .from("collections")
          .insert({ user_id: user.id, name: "My Collection" })
          .select("id")
          .single()
        if (error) throw error
        collectionId = newCollection.id
      }

      // Insert coins (map camelCase to snake_case)
      let imported = 0
      for (const coin of backup.coins) {
        const { error } = await supabase.from("coins").insert({
          collection_id: collectionId,
          title: coin.title || "",
          denomination: coin.denomination || "",
          year: coin.year || new Date().getFullYear(),
          mint_mark: coin.mintMark || null,
          grade: coin.grade || null,
          face_value: coin.faceValue || null,
          purchase_price: coin.purchasePrice || null,
          current_market_value: coin.currentMarketValue || null,
          purchase_date: coin.purchaseDate || new Date().toISOString().split('T')[0],
          notes: coin.notes || null,
          country: coin.country || null,
          series: coin.series || null,
          images: coin.images || null,
        })
        if (!error) imported++
      }

      setDataMessage({ type: "success", text: `Imported ${imported} of ${backup.coins.length} coins` })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Import failed"
      setDataMessage({ type: "error", text: msg })
    } finally {
      setImportLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleClearData = async () => {
    if (!user) return
    setClearLoading(true)
    setDataMessage(null)

    try {
      const { data: collections } = await supabase
        .from("collections")
        .select("id")
        .eq("user_id", user.id)

      if (collections?.length) {
        const collectionIds = collections.map((c) => c.id)
        await supabase.from("coins").delete().in("collection_id", collectionIds)
      }

      setClearDialogOpen(false)
      setDataMessage({ type: "success", text: "All coin data has been cleared" })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to clear data"
      setDataMessage({ type: "error", text: msg })
    } finally {
      setClearLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account and application preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Account */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Account
            </CardTitle>
            {user && (
              <CardDescription>{user.email}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Change Password</Label>
              </div>

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="New password"
                  autoComplete="new-password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                  required
                />
              </div>

              {passwordMessage && (
                <div className={`text-sm rounded-md p-3 ${
                  passwordMessage.type === "success"
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-destructive/10 text-destructive"
                }`}>
                  {passwordMessage.text}
                </div>
              )}

              <Button type="submit" disabled={passwordLoading} className="w-full" size="sm">
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Application Preferences */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              Application Preferences
            </CardTitle>
            {settingsSaved && (
              <CardDescription className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Save className="h-3 w-3" /> Saved
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={settings.theme}
                onValueChange={(v) => handleSelectChange("theme", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Light">Light</SelectItem>
                  <SelectItem value="Dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select
                value={settings.currencyFormat}
                onValueChange={(v) =>
                  handleSelectChange("currencyFormat", v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD ($)">USD ($)</SelectItem>
                  <SelectItem value="EUR (€)">EUR (€)</SelectItem>
                  <SelectItem value="GBP (£)">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(v) =>
                  handleSelectChange("dateFormat", v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Collection Display */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Collection Display</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default View</Label>
              <Select
                value={settings.defaultView}
                onValueChange={(v) =>
                  handleSelectChange("defaultView", v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Table View">Table View</SelectItem>
                  <SelectItem value="Grid View">Grid View</SelectItem>
                  <SelectItem value="List View">List View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Sorting</Label>
              <Select
                value={settings.defaultSorting}
                onValueChange={(v) =>
                  handleSelectChange("defaultSorting", v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Date Added">Date Added</SelectItem>
                  <SelectItem value="Title">Title</SelectItem>
                  <SelectItem value="Year">Year</SelectItem>
                  <SelectItem value="Value">Value</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Visible Columns</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {Object.entries(settings.visibleColumns).map(
                  ([key, value]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => handleCheckboxChange(key)}
                        className="h-4 w-4 rounded border-border"
                      />
                      <span className="text-sm">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .trim()}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataMessage && (
              <div className={`text-sm rounded-md p-3 ${
                dataMessage.type === "success"
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-destructive/10 text-destructive"
              }`}>
                {dataMessage.text}
              </div>
            )}

            <div className="space-y-2">
              <Label>Backup Collection</Label>
              <Button
                className="w-full"
                onClick={handleExportBackup}
                disabled={exportLoading}
              >
                <Download className="mr-1.5 h-4 w-4" />
                {exportLoading ? "Exporting..." : "Export Backup"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Import Backup</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                {importLoading ? "Importing..." : "Import Backup"}
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Clear Application Data</Label>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setClearDialogOpen(true)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Clear Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Consent */}
        {user && (
          <div className="lg:col-span-2 xl:col-span-3 space-y-4">
            <GlobalPrivacyControl user={user} />
            <ConsentManager user={user} />
          </div>
        )}
      </div>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete all coins from your collection. This action cannot be undone.
              Consider exporting a backup first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearData}
              disabled={clearLoading}
            >
              {clearLoading ? "Clearing..." : "Delete All Coins"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
