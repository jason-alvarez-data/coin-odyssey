"use client"

import { useState, useEffect } from "react"
import ConsentManager from "@/components/ConsentManager"
import GlobalPrivacyControl from "@/components/GlobalPrivacyControl"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { Download, Upload, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [settings, setSettings] = useState({
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
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const handleCheckboxChange = (field: string) => {
    setSettings((prev) => ({
      ...prev,
      visibleColumns: {
        ...prev.visibleColumns,
        [field]:
          !prev.visibleColumns[
            field as keyof typeof prev.visibleColumns
          ],
      },
    }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleExportBackup = () => {
    console.log("Exporting backup...")
  }

  const handleImportBackup = () => {
    console.log("Importing backup...")
  }

  const handleClearData = () => {
    console.log("Clearing data...")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your application preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Application Preferences */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              Application Preferences
            </CardTitle>
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
            <div className="space-y-2">
              <Label>Backup Collection</Label>
              <Button
                className="w-full"
                onClick={handleExportBackup}
              >
                <Download className="mr-1.5 h-4 w-4" />
                Export Backup
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Import Backup</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleImportBackup}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                Import Backup
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Clear Application Data</Label>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleClearData}
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
    </div>
  )
}
