import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        // Get the dashboard
        const { data: originalDashboard, error: dashboardError } = await supabase
            .from("dashboards")
            .select("*")
            .eq("id", dashboardId)
            .single()

        if (dashboardError || !originalDashboard) {
            return NextResponse.json({ error: "Dashboard not found" }, { status: 404 })
        }

        // Check if user owns the dashboard or if it's public
        if (originalDashboard.user_id !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Delete the dashboard
        const { error: deleteError } = await supabase.from("dashboards").delete().eq("id", dashboardId)

        if (deleteError) {
            return NextResponse.json({ error: "Failed to delete dashboard" }, { status: 500 })
        }

        return NextResponse.json({ message: "Dashboard deleted successfully" }, { status: 200 })
    } catch (error) {
        console.error("Dashboard duplication error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        // Get the dashboard with its widgets
        const { data: dashboard, error: dashboardError } = await supabase
            .from("dashboards")
            .select(`
            *,
            dashboard_widgets(
            *,
            data_sources(id, name, url)
            )
        `)
            .eq("id", dashboardId)
            .single()

        if (dashboardError || !dashboard) {
            return NextResponse.json({ error: "Dashboard not found" }, { status: 404 })
        }

        // Check if user has access to this dashboard
        if (dashboard.user_id !== user.id && !dashboard.is_public) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        return NextResponse.json({ dashboard }, { status: 200 })
    } catch (error) {
        console.error("Dashboard fetch error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
