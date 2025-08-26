"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Settings, Plus, Save, Eye, EyeOff, RefreshCw, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { WidgetCreationDialog } from "./widget-creation-dialog"
import { DashboardExportImport } from "./dashboard-export-import"
import { useRouter } from "next/navigation"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { useToast } from "@/hooks/use-toast"
import { WidgetRenderer } from "@/components/widgets/widget-renderer"
import { Responsive, WidthProvider, type Layout } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { Checkbox } from "@radix-ui/react-checkbox"

const ResponsiveGridLayout = WidthProvider(Responsive)

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

interface DataSource {
  id: string
  name: string
  url: string
  is_active: boolean
}

interface DashboardBuilderProps {
  dashboard: Dashboard
  dataSources: DataSource[]
  isOwner: boolean
}

export function DashboardBuilder({ dashboard: initialDashboard, dataSources, isOwner }: DashboardBuilderProps) {
  const [dashboard, setDashboard] = useState(initialDashboard)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showWidgetDialog, setShowWidgetDialog] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds
  const [editingWidget, setEditingWidget] = useState<any>(null)

  const generateLayout = useCallback((): Layout[] => {
    return dashboard.dashboard_widgets.map((widget, index) => ({
      i: widget.id,
      x: widget.position_x ?? (index % 4) * 3,
      y: widget.position_y ?? Math.floor(index / 4) * 2,
      w: widget.width ?? 3,
      h: widget.height ?? 2,
      minW: 2,
      minH: 1,
    }))
  }, [dashboard.dashboard_widgets])

  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>(() => {
    const initialLayout = generateLayout()
    return {
      lg: initialLayout,
      md: initialLayout,
      sm: initialLayout,
      xs: initialLayout,
      xxs: initialLayout,
    }
  })
  const widgetRefreshFunctions = useRef<{ [widgetId: string]: () => void }>({})
  const router = useRouter()
  const { toast } = useToast()

  const refreshAllWidgets = useCallback(async () => {
    Object.values(widgetRefreshFunctions.current).forEach((refreshFn) => {
      if (refreshFn) refreshFn()
    })

    router.refresh()
  }, [router])

  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    enabled: autoRefreshEnabled,
    interval: refreshInterval,
    onRefresh: refreshAllWidgets,
  })

  const handleLayoutChange = useCallback(
    (layout: Layout[], layouts: { [key: string]: Layout[] }) => {
      if (!isEditMode) return

      setLayouts(layouts)

      const updatedWidgets = dashboard.dashboard_widgets.map((widget) => {
        const layoutItem = layout.find((item) => item.i === widget.id)
        if (layoutItem) {
          return {
            ...widget,
            position_x: layoutItem.x,
            position_y: layoutItem.y,
            width: layoutItem.w,
            height: layoutItem.h,
          }
        }
        return widget
      })

      setDashboard((prev) => ({
        ...prev,
        dashboard_widgets: updatedWidgets,
      }))
    },
    [isEditMode, dashboard.dashboard_widgets],
  )

  const registerWidgetRefresh = useCallback((widgetId: string, refreshFn: () => void) => {
    widgetRefreshFunctions.current[widgetId] = refreshFn
  }, [])

  const unregisterWidgetRefresh = useCallback((widgetId: string) => {
    delete widgetRefreshFunctions.current[widgetId]
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await Promise.all(
        dashboard.dashboard_widgets.map((widget) =>
          fetch(`/api/widgets/${widget.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: widget.title,
              config: widget.config,
              position_x: widget.position_x,
              position_y: widget.position_y,
              width: widget.width,
              height: widget.height,
            }),
          }),
        ),
      )

      router.refresh()
      toast({
        title: "Dashboard Saved",
        description: "Your dashboard changes have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving dashboard:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save dashboard changes.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleWidgetCreated = (newWidget: any) => {
    setDashboard((prev) => ({
      ...prev,
      dashboard_widgets: [...prev.dashboard_widgets, newWidget],
    }))
    router.refresh()
  }

  const handleDeleteWidget = async (widgetId: string) => {
    try {
      const response = await fetch(`/api/widgets/${widgetId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete widget")
      }

      setDashboard((prev) => ({
        ...prev,
        dashboard_widgets: prev.dashboard_widgets.filter((w) => w.id !== widgetId),
      }))
      router.refresh()
      toast({
        title: "Widget Deleted",
        description: "Widget has been removed from the dashboard.",
      })
    } catch (error) {
      console.error("Error deleting widget:", error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete widget.",
        variant: "destructive",
      })
    }
  }

  const handleImport = async (config: any) => {
    try {
      toast({
        title: "Import Successful",
        description: "Dashboard configuration imported. Refresh to see changes.",
      })
      router.refresh()
    } catch (error) {
      console.error("Error importing dashboard:", error)
      toast({
        title: "Import Failed",
        description: "Failed to import dashboard configuration.",
        variant: "destructive",
      })
    }
  }

  const handleEditWidget = (widget: any) => {
    setEditingWidget(widget)
    setShowWidgetDialog(true)
  }

  const handleWidgetUpdated = (updatedWidget: any) => {
    setDashboard((prev) => ({
      ...prev,
      dashboard_widgets: prev.dashboard_widgets.map((w) => (w.id === updatedWidget.id ? updatedWidget : w)),
    }))
    setEditingWidget(null)
    router.refresh()
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-4 flex min-h-16 py-2 items-center justify-between md:flex-row flex-col">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">{dashboard.name}</h1>
              {dashboard.description && <p className="text-sm text-muted-foreground">{dashboard.description}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-col md:flex-row">
            <div className="flex flex-row items-end gap-1 mr-2">
              {lastRefresh && (
                <div className="text-xs text-muted-foreground">Last updated: {lastRefresh.toLocaleTimeString()}</div>
              )}

              {dashboard.tags.length > 0 && (
                <div className="flex gap-1">
                  {dashboard.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-row items-end gap-1 mr-2">
              {dashboard.is_public && (
                <Badge variant="outline" className="gap-1">
                  <Eye className="h-3 w-3" />
                  Public
                </Badge>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={manualRefresh}
                disabled={isRefreshing}
                className="gap-2 bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              {isOwner && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}>
                        <Checkbox
                          checked={autoRefreshEnabled}
                          onCheckedChange={(checked) => setAutoRefreshEnabled(!!checked)}
                          className="mr-2 border border-muted-foreground data-[state=checked]:border-primary h-4 w-4 rounded-sm data-[state=checked]:bg-primary flex items-center justify-center"
                        >
                          <svg
                            className="h-3 w-3 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </Checkbox>
                        Auto-refresh
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DashboardExportImport dashboard={dashboard} onImport={handleImport} />
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="outline" size="sm" onClick={() => setIsEditMode(!isEditMode)} className="gap-2">
                    {isEditMode ? <EyeOff className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                    {isEditMode ? "View Mode" : "Edit Mode"}
                  </Button>

                  {isEditMode && (
                    <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2">
                      <Save className="h-4 w-4" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 mx-4 py-6">
        {dashboard.dashboard_widgets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Empty Dashboard</h3>
                  <p className="text-muted-foreground max-w-sm">
                    This dashboard doesn't have any widgets yet.
                    {isOwner ? " Start building by adding your first widget." : ""}
                  </p>
                </div>
                {isOwner && isEditMode && (
                  <Button className="gap-2" onClick={() => setShowWidgetDialog(true)}>
                    <Plus className="h-4 w-4" />
                    Add Widget
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            onLayoutChange={handleLayoutChange}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={120}
            isDraggable={isOwner && isEditMode}
            isResizable={isOwner && isEditMode}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            useCSSTransforms={true}
            draggableCancel=".widget-interract"
            key={dashboard.dashboard_widgets.length}
          >
            {dashboard.dashboard_widgets.map((widget) => (
              <div key={widget.id} className="widget-container">
                <WidgetRenderer
                  widget={widget}
                  isEditMode={isOwner && isEditMode}
                  onEdit={handleEditWidget}
                  onDelete={handleDeleteWidget}
                  onRegisterRefresh={registerWidgetRefresh}
                  onUnregisterRefresh={unregisterWidgetRefresh}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        )}

        {isOwner && isEditMode && dashboard.dashboard_widgets.length > 0 && (
          <div className="fixed bottom-8 right-8">
            <Button size="lg" className="rounded-full shadow-lg gap-2" onClick={() => setShowWidgetDialog(true)}>
              <Plus className="h-5 w-5" />
              Add Widget
            </Button>
          </div>
        )}
      </div>

      <WidgetCreationDialog
        open={showWidgetDialog}
        onOpenChange={(open) => {
          setShowWidgetDialog(open)
          if (!open) setEditingWidget(null)
        }}
        dashboardId={dashboard.id}
        dataSources={dataSources}
        onWidgetCreated={editingWidget ? handleWidgetUpdated : handleWidgetCreated}
        editingWidget={editingWidget}
      />
    </div>
  )
}
