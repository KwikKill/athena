"use client"

import { useState, useEffect, useCallback } from "react"

interface UseWidgetDataOptions {
  enabled?: boolean
  refreshInterval?: number
}

interface UseWidgetDataReturn {
  data: any
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useWidgetData(widgetId: string, options: UseWidgetDataOptions = {}): UseWidgetDataReturn {
  const { enabled = true, refreshInterval = 0 } = options
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/widgets/${widgetId}/data`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
      console.error("Error fetching widget data:", err)
    } finally {
      setLoading(false)
    }
  }, [widgetId, enabled])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return

    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchData, enabled, refreshInterval])

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  }
}
