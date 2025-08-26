"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KpiWidgetProps {
  data: any[]
  config: {
    metric_field?: string
    format?: string
    [key: string]: any
  }
}

export function KpiWidget({ data, config }: KpiWidgetProps) {
  console.log("KPI Widget Data:", data)
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="h-32 flex items-center justify-center text-muted-foreground">No data available</div>
  }

  const metricField =
    config?.metric_field ||
    Object.keys(data[0]).find((key) => typeof data[0][key] === "number") ||
    Object.keys(data[0])[0]
  const currentValue = data[data.length - 1]?.[metricField] || 0
  const previousValue = data.length > 1 ? data[data.length - 2]?.[metricField] || 0 : currentValue

  const trend = currentValue > previousValue ? "up" : currentValue < previousValue ? "down" : "neutral"
  const trendPercentage = previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0

  const formatValue = (value: number) => {
    const format = config?.format || "number"

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value)
      case "percentage":
        return `${value.toFixed(2)}%`
      default:
        return new Intl.NumberFormat("en-US").format(value)
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="h-full flex flex-col justify-center space-y-2 text-center">
      <div className="text-3xl text-muted-foreground">
        {metricField.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </div>
      <div className="text-5xl font-bold">{formatValue(currentValue)}</div>

      {data.length > 1 && (
        <div className={`flex items-center justify-center gap-1 text-sm ${getTrendColor()}`}>
          {getTrendIcon()}
          <span>{Math.abs(trendPercentage).toFixed(1)}%</span>
          <span className="text-muted-foreground">vs previous</span>
        </div>
      )}
    </div>
  )
}
