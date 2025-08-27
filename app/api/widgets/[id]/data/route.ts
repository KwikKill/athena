import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { EnhancedDataTransformer } from "@/lib/data-transformer"

function transformData(data: any, rules: any[] = []) {
  if (!Array.isArray(data)) return data

  let result = data

  for (const rule of rules) {
    switch (rule.type) {
      case "filter":
        result = result.filter((item: any) => {
          // Simple field-value filtering
          return item[rule.field] === rule.value
        })
        break
      case "map":
        result = result.map((item: any) => {
          // Simple field mapping
          const newItem = { ...item }
          if (rule.from && rule.to) {
            newItem[rule.to] = item[rule.from]
            delete newItem[rule.from]
          }
          return newItem
        })
        break
      case "sort":
        result = result.sort((a: any, b: any) => {
          const aVal = a[rule.field]
          const bVal = b[rule.field]
          const direction = rule.direction === "desc" ? -1 : 1

          if (typeof aVal === "number" && typeof bVal === "number") {
            return (aVal - bVal) * direction
          }
          return String(aVal).localeCompare(String(bVal)) * direction
        })
        break
    }
  }

  return result
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Widget ID is required" }, { status: 400 })
    }

    // Get widget configuration
    const { data: widget, error: widgetError } = await supabase
      .from("dashboard_widgets")
      .select(`
        *,
        data_sources (*)
      `)
      .eq("id", id)
      .single()

    if (widgetError || !widget) {
      return NextResponse.json({ error: "Widget not found" }, { status: 404 })
    }

    // If no data source, return empty data
    if (!widget.data_sources) {
      return NextResponse.json({ data: [] })
    }

    const dataSource = widget.data_sources
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Add authentication headers
    if (dataSource.auth_type === "bearer" && dataSource.auth_token) {
      headers["Authorization"] = `Bearer ${dataSource.auth_token}`
    } else if (dataSource.auth_type === "api_key" && dataSource.auth_token) {
      headers["X-API-Key"] = dataSource.auth_token
    } else if (dataSource.auth_type === "basic" && dataSource.auth_token) {
      headers["Authorization"] = `Basic ${dataSource.auth_token}`
    }

    // Add custom headers
    if (dataSource.headers) {
      Object.assign(headers, dataSource.headers)
    }

    // Build URL with query parameters
    let url = dataSource.url
    let queryParams = new URLSearchParams()
    if (dataSource.query_params && Object.keys(dataSource.query_params).length > 0) {
      queryParams = new URLSearchParams(dataSource.query_params)
      url += `?${queryParams.toString()}`
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    console.log("Fetched data from:", url)

    let data = await response.json()

    if (widget.config?.jquery_expression) {
      try {
        data = EnhancedDataTransformer.transformWithJQuery(data, widget.config.jquery_expression)
      } catch (error) {
        console.error("jQuery transformation error:", error)
        // Fall back to original data if transformation fails
      }
    } else {
      // Fall back to legacy transformation rules
      const transformationRules = widget.config?.transformation_rules || []
      data = transformData(data, transformationRules)
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching widget data:", error)
    return NextResponse.json({ error: "Failed to fetch widget data" }, { status: 500 })
  }
}
