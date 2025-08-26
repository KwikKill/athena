import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DataSourcesList } from "@/components/dashboard/data-sources-list"
import { DashboardsList } from "@/components/dashboard/dashboards-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's data sources
  const { data: dataSources } = await supabase
    .from("data_sources")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch user's dashboards
  const { data: dashboards } = await supabase
    .from("dashboards")
    .select(`
      *,
      dashboard_widgets(count)
    `)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader user={user} />
      <main className="mx-4 flex-1 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Manage your data sources and build custom dashboards</p>
          </div>

          <Separator
            className="my-4"
            style={{
              borderColor: "var(--border)",
            }}
          />

          <Tabs defaultValue="dashboards" className="w-full">
            <TabsList>
              <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
              <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboards" className="space-y-6">
              <DashboardsList dashboards={dashboards || []} />
            </TabsContent>

            <TabsContent value="data-sources" className="space-y-6">
              <DataSourcesList dataSources={dataSources || []} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
