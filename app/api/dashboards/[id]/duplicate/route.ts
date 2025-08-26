import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Dashboard ID is required" }, { status: 400 })
    }

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dashboardId = id

    // Get the original dashboard
    const { data: originalDashboard, error: dashboardError } = await supabase
      .from("dashboards")
      .select("*")
      .eq("id", dashboardId)
      .single()

    if (dashboardError || !originalDashboard) {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 })
    }

    // Check if user owns the dashboard or if it's public
    if (originalDashboard.user_id !== user.id && !originalDashboard.is_public) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Create duplicate dashboard
    const duplicateData = {
      name: `${originalDashboard.name} (Copy)`,
      description: originalDashboard.description,
      tags: originalDashboard.tags,
      is_public: false, // Always make duplicates private initially
      is_template: false,
      layout_config: originalDashboard.layout_config,
      user_id: user.id, // Assign to current user
    }

    const { data: newDashboard, error: createError } = await supabase
      .from("dashboards")
      .insert([duplicateData])
      .select()
      .single()

    if (createError || !newDashboard) {
      return NextResponse.json({ error: "Failed to create duplicate dashboard" }, { status: 500 })
    }

    // Get all widgets from the original dashboard
    const { data: originalWidgets, error: widgetsError } = await supabase
      .from("dashboard_widgets")
      .select("*")
      .eq("dashboard_id", dashboardId)

    if (widgetsError) {
      return NextResponse.json({ error: "Failed to fetch original widgets" }, { status: 500 })
    }

    // Duplicate all widgets if any exist
    if (originalWidgets && originalWidgets.length > 0) {
      const duplicateWidgets = originalWidgets.map((widget) => ({
        dashboard_id: newDashboard.id,
        title: widget.title,
        data_source_id: widget.data_source_id,
        widget_type: widget.widget_type,
        config: widget.config,
        position_x: widget.position_x,
        position_y: widget.position_y,
        width: widget.width,
        height: widget.height,
      }))

      const { error: widgetCreateError } = await supabase.from("dashboard_widgets").insert(duplicateWidgets)

      if (widgetCreateError) {
        // If widget creation fails, clean up the dashboard
        await supabase.from("dashboards").delete().eq("id", newDashboard.id)
        console.log("Widget duplication error:", widgetCreateError)
        return NextResponse.json({ error: "Failed to duplicate widgets" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      dashboard: newDashboard,
      message: "Dashboard duplicated successfully",
    })
  } catch (error) {
    console.error("Dashboard duplication error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
