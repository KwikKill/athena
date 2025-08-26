"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Database, Globe, Clock, AlertCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataSourceDialog } from "./data-source-dialog"
import { formatDistanceToNow } from "date-fns"

interface DataSource {
  id: string
  name: string
  description: string | null
  url: string
  method: string
  is_active: boolean
  last_fetched_at: string | null
  last_error: string | null
  created_at: string
  auth_type: string
  headers: Record<string, string>
  query_params: Record<string, string>
  auth_config: Record<string, string>
  refresh_interval: number
}

interface DataSourcesListProps {
  dataSources: DataSource[]
}

export function DataSourcesList({ dataSources }: DataSourcesListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<DataSource | null>(null)

  const handleEdit = (source: DataSource) => {
    setEditingSource(source)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingSource(null)
  }

  const getStatusColor = (source: DataSource) => {
    if (!source.is_active) return "secondary"
    if (source.last_error) return "destructive"
    return "default"
  }

  const getStatusText = (source: DataSource) => {
    if (!source.is_active) return "Inactive"
    if (source.last_error) return "Error"
    return "Active"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Sources</h2>
          <p className="text-muted-foreground">Connect to external APIs to power your dashboards</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Data Source
        </Button>
      </div>

      {dataSources.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No data sources yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-sm">
              Get started by connecting to your first external API. You can add REST endpoints, configure
              authentication, and start building dashboards.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add your first data source
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dataSources.map((source) => (
            <Card key={source.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{source.name}</CardTitle>
                      <CardDescription className="text-sm">{source.description}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(source)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
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
                  <Badge variant={getStatusColor(source)}>{getStatusText(source)}</Badge>
                  <Badge variant="outline">{source.method}</Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1 mb-1">
                    <Globe className="h-3 w-3" />
                    <span className="truncate">{source.url}</span>
                  </div>
                  {source.auth_type !== "none" && (
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs">Auth: {source.auth_type}</span>
                    </div>
                  )}
                </div>

                {source.last_error && (
                  <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-md">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-destructive">{source.last_error}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Created {formatDistanceToNow(new Date(source.created_at), { addSuffix: true })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DataSourceDialog isOpen={isDialogOpen} onClose={handleCloseDialog} editingSource={editingSource} />
    </div>
  )
}
