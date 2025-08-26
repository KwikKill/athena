"use client"

import { useEffect, useRef, useState } from "react"

interface UseAutoRefreshOptions {
  enabled: boolean
  interval: number // in milliseconds
  onRefresh: () => void | Promise<void>
}

export function useAutoRefresh({ enabled, interval, onRefresh }: UseAutoRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled || interval <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const refresh = async () => {
      setIsRefreshing(true)
      try {
        await onRefresh()
        setLastRefresh(new Date())
      } catch (error) {
        console.error("Auto-refresh error:", error)
      } finally {
        setIsRefreshing(false)
      }
    }

    intervalRef.current = setInterval(refresh, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval, onRefresh])

  const manualRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      await onRefresh()
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Manual refresh error:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return {
    isRefreshing,
    lastRefresh,
    manualRefresh,
  }
}
