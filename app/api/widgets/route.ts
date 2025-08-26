import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    let { dashboard_id, widget_type, title, data_source_id, config, position_x, position_y, width, height } = body

    // Verify user owns the dashboard
    const { data: dashboard } = await supabase.from("dashboards").select("user_id").eq("id", dashboard_id).single()

    if (!dashboard || dashboard.user_id !== user.id) {
      return NextResponse.json({ error: "Dashboard not found or unauthorized" }, { status: 404 })
    }

    // if data_source_id is provided, verify it exists
    if (data_source_id && data_source_id !== null && data_source_id !== "") {
      const { data: dataSource } = await supabase
        .from("data_sources")
        .select("id")
        .eq("id", data_source_id)
        .single()

      if (!dataSource) {
        return NextResponse.json({ error: "Data source not found" }, { status: 404 })
      }
    } else {
      // If data_source_id is not provided, set it to null
      data_source_id = null
    }

    // Create the widget
    const { data: widget, error } = await supabase
      .from("dashboard_widgets")
      .insert({
        dashboard_id,
        widget_type,
        title,
        data_source_id,
        config: config || {},
        position_x: position_x || 0,
        position_y: position_y || 0,
        width: width || 4,
        height: height || 4,
      })
      .select(`
        *,
        data_sources(id, name, url)
      `)
      .single()

    if (error) {
      console.error("Error creating widget:", error)
      return NextResponse.json({ error: "Failed to create widget" }, { status: 500 })
    }

    return NextResponse.json(widget)
  } catch (error) {
    console.error("Error in widget creation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
