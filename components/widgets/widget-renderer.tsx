"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, RefreshCw, AlertCircle, GripVertical } from "lucide-react"
import { ChartWidget } from "./chart-widget"
import { TableWidget } from "./table-widget"
import { KpiWidget } from "./kpi-widget"
import { TextWidget } from "./text-widget"
import { IframeWidget } from "./iframe-widget"
import { useWidgetData } from "@/hooks/use-widget-data"
import { useEffect } from "react"

interface Widget {
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
}

interface WidgetRendererProps {
  widget: Widget
  isEditMode?: boolean
  onEdit?: (widget: Widget) => void
  onDelete?: (widgetId: string) => void
  onRegisterRefresh?: (widgetId: string, refreshFn: () => void) => void
  onUnregisterRefresh?: (widgetId: string) => void
}

export function WidgetRenderer({
  widget,
  isEditMode = false,
  onEdit,
  onDelete,
  onRegisterRefresh,
  onUnregisterRefresh,
}: WidgetRendererProps) {
  const { data, loading, error, refresh } = useWidgetData(widget.id, {
    enabled: widget.widget_type !== "text" && widget.widget_type !== "iframe",
    refreshInterval: widget.config?.auto_refresh ? (widget.config?.refresh_interval || 30) * 1000 : 0,
  })

  useEffect(() => {
    if (onRegisterRefresh && widget.widget_type !== "text" && widget.widget_type !== "iframe") {
      onRegisterRefresh(widget.id, refresh)
    }

    return () => {
      if (onUnregisterRefresh) {
        onUnregisterRefresh(widget.id)
      }
    }
  }, [widget.id, widget.widget_type, refresh, onRegisterRefresh, onUnregisterRefresh])

  const renderWidgetContent = () => {
    if (loading) {
      return (
        <div className="h-24 sm:h-32 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-4 w-4 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Loading data...</span>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="h-24 sm:h-32 flex items-center justify-center text-center p-2 sm:p-4">
          <div className="space-y-2">
            <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6 text-destructive mx-auto" />
            <p className="text-xs sm:text-sm text-destructive">Failed to load data</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{error}</p>
            <Button size="sm" variant="outline" onClick={refresh}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )
    }

    switch (widget.widget_type) {
      case "chart":
        return <ChartWidget data={data} config={widget.config} />
      case "table":
        return <TableWidget data={data} config={widget.config} />
      case "kpi":
        return <KpiWidget data={data} config={widget.config} />
      case "text":
        return <TextWidget config={widget.config} />
      case "iframe":
        return <IframeWidget config={widget.config} />
      default:
        return (
          <div className="h-24 sm:h-32 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground mx-auto mb-2" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Unknown widget type: {widget.widget_type}
              </span>
            </div>
          </div>
        )
    }
  }

  return (
    <Card
      className={`relative group h-full widget-content overflow-hidden ${widget.widget_type === "kpi" ? "py-0" : ""}`}
    >
      {isEditMode && (
        <div className="absolute top-1 left-1 sm:top-2 sm:left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="widget-drag-handle p-1 rounded bg-background/80 backdrop-blur-sm border">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      )}

      {isEditMode && (
        <div className="widget-interract absolute top-1 right-1 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 bg-primary"
              onClick={() => onEdit?.(widget)}
            >
              <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
              onClick={() => onDelete?.(widget.id)}
            >
              <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </Button>
          </div>
        </div>
      )}

      {widget.widget_type !== "kpi" && (
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base truncate pr-2">{widget.title}</CardTitle>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Badge variant="outline" className="text-xs">
                {widget.widget_type}
              </Badge>
              {widget.config?.auto_refresh && (
                <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                  Auto
                </Badge>
              )}
              {widget.config?.jquery_expression && (
                <Badge variant="outline" className="text-xs bg-accent/10 hidden sm:inline-flex">
                  Transform
                </Badge>
              )}
            </div>
          </div>
          {widget.data_sources && (
            <CardDescription className="text-xs truncate">Source: {widget.data_sources.name}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className="pt-0 h-full overflow-auto widget-interract">
        <div className="h-full">{renderWidgetContent()}</div>
      </CardContent>
    </Card>
  )
}
