import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    let { widget_type, title, data_source_id, config, position_x, position_y, width, height } = body

    // Verify user owns the widget through dashboard ownership
    const { data: widget } = await supabase
      .from("dashboard_widgets")
      .select(`
        *,
        dashboards!inner(user_id)
      `)
      .eq("id", id)
      .single()

    if (!widget || widget.dashboards.user_id !== user.id) {
      return NextResponse.json({ error: "Widget not found or unauthorized" }, { status: 404 })
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
    } else if (data_source_id === "") {
      // If data_source_id is not provided, set it to null
      data_source_id = null
    }

    // if type is text or iframe, remove data_source_id
    if (widget_type === "text" || widget_type === "iframe") {
      data_source_id = null
    }

    // Update the widget
    const { data: updatedWidget, error } = await supabase
      .from("dashboard_widgets")
      .update({
        widget_type,
        title,
        data_source_id,
        config: config || {},
        position_x,
        position_y,
        width,
        height,
      })
      .eq("id", id)
      .select(`
        *,
        data_sources(id, name, url)
      `)
      .single()

    if (error) {
      console.error("Error updating widget:", error)
      return NextResponse.json({ error: "Failed to update widget" }, { status: 500 })
    }

    return NextResponse.json(updatedWidget)
  } catch (error) {
    console.error("Error in widget update:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user owns the widget through dashboard ownership
    const { data: widget } = await supabase
      .from("dashboard_widgets")
      .select(`
        *,
        dashboards!inner(user_id)
      `)
      .eq("id", id)
      .single()

    if (!widget || widget.dashboards.user_id !== user.id) {
      return NextResponse.json({ error: "Widget not found or unauthorized" }, { status: 404 })
    }

    // Delete the widget
    const { error } = await supabase.from("dashboard_widgets").delete().eq("id", id)

    if (error) {
      console.error("Error deleting widget:", error)
      return NextResponse.json({ error: "Failed to delete widget" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in widget deletion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
