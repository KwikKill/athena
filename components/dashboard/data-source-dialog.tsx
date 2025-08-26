"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface DataSource {
  id: string
  name: string
  description: string | null
  url: string
  method: string
  last_fetched_at: string | null
  last_error: string | null
  created_at: string
  headers: Record<string, string>
  query_params: Record<string, string>
  auth_type: string
  auth_config: Record<string, string>
  refresh_interval: number
  is_active: boolean
}

interface DataSourceDialogProps {
  isOpen: boolean
  onClose: () => void
  editingSource?: DataSource | null
}

export function DataSourceDialog({ isOpen, onClose, editingSource }: DataSourceDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [url, setUrl] = useState("")
  const [method, setMethod] = useState("GET")
  const [authType, setAuthType] = useState("none")
  const [isActive, setIsActive] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(300)

  // Headers and query params
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([])
  const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string }>>([])

  // Auth config
  const [bearerToken, setBearerToken] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [apiKeyHeader, setApiKeyHeader] = useState("X-API-Key")
  const [basicUsername, setBasicUsername] = useState("")
  const [basicPassword, setBasicPassword] = useState("")

  // Reset form when dialog opens/closes or editing source changes
  useEffect(() => {
    if (isOpen) {
      if (editingSource) {
        setName(editingSource.name)
        setDescription(editingSource.description || "")
        setUrl(editingSource.url)
        setMethod(editingSource.method)
        setAuthType(editingSource.auth_type)
        setIsActive(editingSource.is_active)
        setRefreshInterval(editingSource.refresh_interval)

        // Convert headers object to array
        const headersArray = Object.entries(editingSource.headers || {}).map(([key, value]) => ({
          key,
          value,
        }))
        setHeaders(headersArray)

        // Convert query params object to array
        const queryParamsArray = Object.entries(editingSource.query_params || {}).map(([key, value]) => ({
          key,
          value,
        }))
        setQueryParams(queryParamsArray)

        // Set auth config
        const authConfig = editingSource.auth_config || {}
        setBearerToken(authConfig.token || "")
        setApiKey(authConfig.api_key || "")
        setApiKeyHeader(authConfig.header || "X-API-Key")
        setBasicUsername(authConfig.username || "")
        setBasicPassword(authConfig.password || "")
      } else {
        // Reset form for new data source
        setName("")
        setDescription("")
        setUrl("")
        setMethod("GET")
        setAuthType("none")
        setIsActive(true)
        setRefreshInterval(300)
        setHeaders([])
        setQueryParams([])
        setBearerToken("")
        setApiKey("")
        setApiKeyHeader("X-API-Key")
        setBasicUsername("")
        setBasicPassword("")
      }
      setError(null)
    }
  }, [isOpen, editingSource])

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }])
  }

  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const newHeaders = [...headers]
    newHeaders[index][field] = value
    setHeaders(newHeaders)
  }

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: "", value: "" }])
  }

  const updateQueryParam = (index: number, field: "key" | "value", value: string) => {
    const newParams = [...queryParams]
    newParams[index][field] = value
    setQueryParams(newParams)
  }

  const removeQueryParam = (index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Convert arrays back to objects
      const headersObj = headers.reduce(
        (acc, { key, value }) => {
          if (key.trim()) acc[key.trim()] = value
          return acc
        },
        {} as Record<string, string>,
      )

      const queryParamsObj = queryParams.reduce(
        (acc, { key, value }) => {
          if (key.trim()) acc[key.trim()] = value
          return acc
        },
        {} as Record<string, string>,
      )

      // Build auth config based on auth type
      let authConfig = {}
      switch (authType) {
        case "bearer":
          authConfig = { token: bearerToken }
          break
        case "api_key":
          authConfig = { api_key: apiKey, header: apiKeyHeader }
          break
        case "basic":
          authConfig = { username: basicUsername, password: basicPassword }
          break
      }

      const dataSourceData = {
        name: name.trim(),
        description: description.trim() || null,
        url: url.trim(),
        method,
        headers: headersObj,
        query_params: queryParamsObj,
        auth_type: authType,
        auth_config: authConfig,
        refresh_interval: refreshInterval,
        is_active: isActive,
      }

      if (editingSource) {
        // Update existing data source
        const { error } = await supabase.from("data_sources").update(dataSourceData).eq("id", editingSource.id)

        if (error) throw error
      } else {
        // Create new data source
        const { error } = await supabase.from("data_sources").insert([dataSourceData])

        if (error) throw error
      }

      router.refresh()
      onClose()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingSource ? "Edit Data Source" : "Add Data Source"}</DialogTitle>
          <DialogDescription>
            Connect to an external REST API to use as a data source for your dashboards.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="auth">Authentication</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="My API Data Source"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this data source"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="url">API URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder={`${process.env.NEXT_PUBLIC_APP_URL}/api/example`}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                  <span className="text-sm text-muted-foreground">
                    You can use
                    <a
                      href={`${process.env.NEXT_PUBLIC_APP_URL}/api/example`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline mx-1"
                    >
                      {process.env.NEXT_PUBLIC_APP_URL}/api/example
                    </a>
                    to test.
                  </span>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="method">HTTP Method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Active</Label>
                    <div className="text-sm text-muted-foreground">Enable this data source</div>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Refresh Interval (seconds)</Label>
                  <Input
                    type="number"
                    min="60"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number.parseInt(e.target.value) || 300)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Headers</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addHeader}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Header
                    </Button>
                  </div>
                  {headers.map((header, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Header name"
                        value={header.key}
                        onChange={(e) => updateHeader(index, "key", e.target.value)}
                      />
                      <Input
                        placeholder="Header value"
                        value={header.value}
                        onChange={(e) => updateHeader(index, "value", e.target.value)}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => removeHeader(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Query Parameters</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addQueryParam}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Parameter
                    </Button>
                  </div>
                  {queryParams.map((param, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Parameter name"
                        value={param.key}
                        onChange={(e) => updateQueryParam(index, "key", e.target.value)}
                      />
                      <Input
                        placeholder="Parameter value"
                        value={param.value}
                        onChange={(e) => updateQueryParam(index, "value", e.target.value)}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => removeQueryParam(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="auth" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Authentication Type</Label>
                  <Select value={authType} onValueChange={setAuthType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {authType === "bearer" && (
                  <div className="grid gap-2">
                    <Label htmlFor="bearerToken">Bearer Token</Label>
                    <Input
                      id="bearerToken"
                      type="password"
                      placeholder="Enter bearer token"
                      value={bearerToken}
                      onChange={(e) => setBearerToken(e.target.value)}
                    />
                  </div>
                )}

                {authType === "api_key" && (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="apiKeyHeader">Header Name</Label>
                      <Input
                        id="apiKeyHeader"
                        placeholder="X-API-Key"
                        value={apiKeyHeader}
                        onChange={(e) => setApiKeyHeader(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="Enter API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {authType === "basic" && (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="basicUsername">Username</Label>
                      <Input
                        id="basicUsername"
                        placeholder="Enter username"
                        value={basicUsername}
                        onChange={(e) => setBasicUsername(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="basicPassword">Password</Label>
                      <Input
                        id="basicPassword"
                        type="password"
                        placeholder="Enter password"
                        value={basicPassword}
                        onChange={(e) => setBasicPassword(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : editingSource ? "Update Data Source" : "Create Data Source"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
