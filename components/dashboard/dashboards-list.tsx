"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, LayoutDashboard, Eye, Globe, Lock, MoreHorizontal, Pencil, Trash2, Copy, Download } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DashboardDialog } from "./dashboard-dialog"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Dashboard {
  id: string
  name: string
  description: string | null
  tags: string[]
  is_public: boolean
  is_template: boolean
  version: number
  created_at: string
  updated_at: string
  dashboard_widgets: Array<{ count: number }>
  layout_config?: any
}

interface DashboardsListProps {
  dashboards: Dashboard[]
  publicDashboards: Dashboard[]
}

export function DashboardsList({ dashboards, publicDashboards }: DashboardsListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleEdit = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingDashboard(null)
  }

  const getWidgetCount = (dashboard: Dashboard) => {
    return dashboard.dashboard_widgets?.[0]?.count || 0
  }

  const handleDuplicate = async (dashboard: Dashboard) => {
    setIsLoading(dashboard.id)
    try {
      const response = await fetch(`/api/dashboards/${dashboard.id}/duplicate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to duplicate dashboard")
      }

      toast({
        title: "Dashboard duplicated",
        description: `"${dashboard.name}" has been successfully duplicated.`,
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Duplication failed",
        description: error instanceof Error ? error.message : "Failed to duplicate dashboard",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleExport = async (dashboard: Dashboard) => {
    setIsLoading(dashboard.id)
    try {
      // Create export data structure
      const exportData = {
        dashboard: {
          name: dashboard.name,
          description: dashboard.description,
          tags: dashboard.tags,
          layout_config: dashboard.layout_config,
          version: dashboard.version,
        },
        widgets: [], // Will be populated with widget data
        exportedAt: new Date().toISOString(),
        exportVersion: "1.0",
      }

      // Create and download the JSON file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = `${dashboard.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_dashboard.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Dashboard exported",
        description: `"${dashboard.name}" has been exported successfully.`,
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export dashboard",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleDelete = (dashboardId: string) => {
    // Add confirmation dialog and implement deletion logic here
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Dashboards</h2>
          <p className="text-muted-foreground">Create and manage your custom dashboards</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Dashboard
        </Button>
      </div>

      {dashboards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No dashboards yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-sm">
              Create your first dashboard to start visualizing your data. You can add widgets, connect data sources, and
              customize the layout.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create your first dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((dashboard) => (
            <Card key={dashboard.id} className="relative group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                      <CardDescription className="text-sm">{dashboard.description}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isLoading === dashboard.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/${dashboard.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(dashboard)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(dashboard)}
                        disabled={isLoading === dashboard.id}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {isLoading === dashboard.id ? "Duplicating..." : "Duplicate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(dashboard)} disabled={isLoading === dashboard.id}>
                        <Download className="mr-2 h-4 w-4" />
                        {isLoading === dashboard.id ? "Exporting..." : "Export"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(dashboard.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {dashboard.is_public ? (
                      <Badge variant="outline" className="gap-1">
                        <Globe className="h-3 w-3" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="h-3 w-3" />
                        Private
                      </Badge>
                    )}
                    {dashboard.is_template && <Badge variant="default">Template</Badge>}
                  </div>
                </div>

                {dashboard.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {dashboard.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {dashboard.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{dashboard.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{getWidgetCount(dashboard)} widgets</span>
                  <span>Updated {formatDistanceToNow(new Date(dashboard.updated_at), { addSuffix: true })}</span>
                </div>

                <Link href={`/dashboard/${dashboard.id}`}>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Open Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Public Dashboards</h2>
          <p className="text-muted-foreground">View public dashboards</p>
        </div>
      </div>

      {publicDashboards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No public dashboards yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-sm">
              Create a public dashboard to share with others. Public dashboards can be viewed by anyone with the link.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {publicDashboards.map((dashboard) => (
            <Card key={dashboard.id} className="relative group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                      <CardDescription className="text-sm">{dashboard.description}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isLoading === dashboard.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/${dashboard.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(dashboard)}
                        disabled={isLoading === dashboard.id}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {isLoading === dashboard.id ? "Duplicating..." : "Duplicate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(dashboard)} disabled={isLoading === dashboard.id}>
                        <Download className="mr-2 h-4 w-4" />
                        {isLoading === dashboard.id ? "Exporting..." : "Export"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {dashboard.is_public ? (
                      <Badge variant="outline" className="gap-1">
                        <Globe className="h-3 w-3" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="h-3 w-3" />
                        Private
                      </Badge>
                    )}
                    {dashboard.is_template && <Badge variant="default">Template</Badge>}
                  </div>
                </div>

                {dashboard.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {dashboard.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {dashboard.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{dashboard.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{getWidgetCount(dashboard)} widgets</span>
                  <span>Updated {formatDistanceToNow(new Date(dashboard.updated_at), { addSuffix: true })}</span>
                </div>

                <Link href={`/dashboard/${dashboard.id}`}>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Open Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DashboardDialog isOpen={isDialogOpen} onClose={handleCloseDialog} editingDashboard={editingDashboard} />
    </div>
  )
}
