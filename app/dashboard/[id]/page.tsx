import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardBuilder } from "@/components/dashboard/dashboard-builder"

interface DashboardPageProps {
  params: Promise<{ id: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch dashboard with widgets
  const { data: dashboard, error } = await supabase
    .from("dashboards")
    .select(`
      *,
      dashboard_widgets(
        *,
        data_sources(id, name, url)
      )
    `)
    .eq("id", id)
    .single()

  if (error || !dashboard) {
    notFound()
  }

  // Check if user has access to this dashboard
  if (dashboard.user_id !== user.id && !dashboard.is_public) {
    notFound()
  }

  // Fetch user's data sources for widget creation
  const { data: dataSources } = await supabase
    .from("data_sources")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("name")

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader user={user} />
      <main className="flex-1">
        <DashboardBuilder
          dashboard={dashboard}
          dataSources={dataSources || []}
          isOwner={dashboard.user_id === user.id}
        />
      </main>
    </div>
  )
}
