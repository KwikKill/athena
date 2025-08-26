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
}

interface DashboardsListProps {
  dashboards: Dashboard[]
}

export function DashboardsList({ dashboards }: DashboardsListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboards</h2>
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
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
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

      <DashboardDialog isOpen={isDialogOpen} onClose={handleCloseDialog} editingDashboard={editingDashboard} />
    </div>
  )
}
