"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Download, Upload, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Dashboard {
  id: string
  name: string
  description: string | null
  tags: string[]
  is_public: boolean
  layout_config: Record<string, any>
  dashboard_widgets: Array<{
    id: string
    widget_type: string
    title: string
    config: Record<string, any>
    position_x: number
    position_y: number
    width: number
    height: number
    data_sources: {
      id: string
      name: string
      url: string
    } | null
  }>
}

interface DashboardExportImportProps {
  dashboard: Dashboard
  onImport?: (config: any) => void
}

export function DashboardExportImport({ dashboard, onImport }: DashboardExportImportProps) {
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importConfig, setImportConfig] = useState("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const exportConfig = {
    version: "1.0",
    dashboard: {
      name: dashboard.name,
      description: dashboard.description,
      tags: dashboard.tags,
      layout_config: dashboard.layout_config,
    },
    widgets: dashboard.dashboard_widgets.map((widget) => ({
      widget_type: widget.widget_type,
      title: widget.title,
      config: widget.config,
      position_x: widget.position_x,
      position_y: widget.position_y,
      width: widget.width,
      height: widget.height,
      data_source_name: widget.data_sources?.name || null,
    })),
    exported_at: new Date().toISOString(),
  }

  const handleExport = () => {
    const configJson = JSON.stringify(exportConfig, null, 2)
    const blob = new Blob([configJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${dashboard.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_dashboard.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Dashboard Exported",
      description: "Dashboard configuration has been downloaded as JSON file.",
    })
  }

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportConfig, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copied to Clipboard",
        description: "Dashboard configuration copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy configuration to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleImport = () => {
    try {
      const config = JSON.parse(importConfig)

      if (!config.version || !config.dashboard || !config.widgets) {
        throw new Error("Invalid dashboard configuration format")
      }

      onImport?.(config)
      setShowImportDialog(false)
      setImportConfig("")

      toast({
        title: "Dashboard Imported",
        description: "Dashboard configuration has been imported successfully.",
      })
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Invalid JSON format or configuration structure.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Import
        </Button>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Export Dashboard</DialogTitle>
            <DialogDescription>
              Export your dashboard configuration as a JSON file or copy to clipboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={JSON.stringify(exportConfig, null, 2)}
              readOnly
              className="min-h-[300px] font-mono text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCopyConfig} className="gap-2 bg-transparent">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Download JSON
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Import Dashboard</DialogTitle>
            <DialogDescription>Paste a dashboard configuration JSON to import widgets and settings.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Paste dashboard JSON configuration here..."
              value={importConfig}
              onChange={(e) => setImportConfig(e.target.value)}
              className="min-h-[300px] font-mono text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importConfig.trim()}>
              Import Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
