"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { BarChart3, Table, TrendingUp, Type, Globe, Settings, Code, Plus } from "lucide-react"

const widgetSchema = z.object({
  widget_type: z.enum(["table", "chart", "kpi", "text", "iframe"]),
  title: z.string().min(1, "Title is required"),
  data_source_id: z.string().optional(),
  config: z
    .object({
      chart_type: z.string().optional(),
      content: z.string().optional(),
      url: z.string().optional(),
      metric_field: z.string().optional(),
      format: z.string().optional(),
      auto_refresh: z.boolean().optional(),
      refresh_interval: z.number().optional(),
      transformation_rules: z.array(z.any()).optional(),
      cache_duration: z.number().optional(),
      jquery_expression: z.string().optional(),
    })
    .optional(),
})

type WidgetFormData = z.infer<typeof widgetSchema>

interface DataSource {
  id: string
  name: string
  url: string
  is_active: boolean
}

interface WidgetCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dashboardId: string
  dataSources: DataSource[]
  onWidgetCreated: (widget: any) => void
  editingWidget?: any
}

const widgetTypes = [
  {
    value: "chart",
    label: "Chart",
    description: "Visualize data with charts and graphs",
    icon: BarChart3,
  },
  {
    value: "table",
    label: "Table",
    description: "Display data in a structured table",
    icon: Table,
  },
  {
    value: "kpi",
    label: "KPI Card",
    description: "Show key performance indicators",
    icon: TrendingUp,
  },
  {
    value: "text",
    label: "Text Widget",
    description: "Add custom text or markdown content",
    icon: Type,
  },
  {
    value: "iframe",
    label: "Embed",
    description: "Embed external content via iframe",
    icon: Globe,
  },
]

const chartTypes = [
  { value: "line", label: "Line Chart" },
  { value: "area", label: "Area Chart" },
  { value: "bar", label: "Bar Chart" },
  { value: "pie", label: "Pie Chart" },
]

const transformationExamples = [
  // 🔎 Navigation & extraction
  {
    name: "Find nested array",
    expression: "$(data).find('items_list').get()",
    description: "Access a nested array property by key",
  },
  {
    name: "Get first item",
    expression: "$(data).first().get()",
    description: "Return the first element of the dataset",
  },
  {
    name: "Get last item",
    expression: "$(data).last().get()",
    description: "Return the last element of the dataset",
  },
  {
    name: "Limit results",
    expression: "$(data).first(5).get()",
    description: "Keep only the first 5 items",
  },

  // 🎯 Filtering
  {
    name: "Filter by exact match",
    expression: "$(data).filter('[status=active]').get()",
    description: "Keep only items with status = active",
  },
  {
    name: "Filter by nested field",
    expression: "$(data).filter('[details.price>10]').get()",
    description: "Keep items where nested price > 10",
  },

  // 📊 Sorting & ordering
  {
    name: "Sort ascending",
    expression: "$(data).sort('name').get()",
    description: "Sort items by 'name' field ascending",
  },
  {
    name: "Sort descending",
    expression: "$(data).sort('created_at', 'desc').get()",
    description: "Sort items by 'created_at' descending",
  },

  // 📑 Projection
  {
    name: "Select specific fields",
    expression: "$(data).select(['name', 'details.price']).get()",
    description: "Return only chosen fields (supports nested paths)",
  },
  {
    name: "Select with alias",
    expression: "$(data).select(['name', 'details.price as price']).get()",
    description: "Rename selected fields with aliases",
  },

  // 📈 Aggregations
  {
    name: "Count items",
    expression: "$(data).count()",
    description: "Return the number of items",
  },
  {
    name: "Sum field values",
    expression: "$(data).sum('amount')",
    description: "Sum the values of the 'amount' field",
  },
  {
    name: "Average field",
    expression: "$(data).avg('amount')",
    description: "Calculate average of the 'amount' field",
  },
  {
    name: "Min / Max",
    expression: "$(data).min('score') / $(data).max('score')",
    description: "Get the min or max value of a field",
  },

  // 🗂️ Grouping
  {
    name: "Group by category",
    expression: "$(data).groupBy('category')",
    description: "Group items by a field",
  },
  {
    name: "Group by nested field",
    expression: "$(data).groupBy('details.type')",
    description: "Group items by nested property",
  },

  // 🔗 Chaining
  {
    name: "Filter + Sort + Limit",
    expression: "$(data).filter('[status=active]').sort('score','desc').first(3).get()",
    description: "Combine multiple operations in a single chain",
  },
  {
    name: "Convert Object to Array",
    expression: "$([data])",
    description: "Wrap an object into an array so you can apply transformations like filter, map, or sort",
  },
]


export function WidgetCreationDialog({
  open,
  onOpenChange,
  dashboardId,
  dataSources,
  onWidgetCreated,
  editingWidget,
}: WidgetCreationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  const form = useForm<WidgetFormData>({
    resolver: zodResolver(widgetSchema),
    values: editingWidget
      ? {
          widget_type: editingWidget.widget_type,
          title: editingWidget.title,
          data_source_id: editingWidget.data_sources?.id || "",
          config: {
            chart_type: editingWidget.config?.chart_type || "",
            content: editingWidget.config?.content || "",
            url: editingWidget.config?.url || "",
            metric_field: editingWidget.config?.metric_field || "",
            format: editingWidget.config?.format || "number",
            auto_refresh: editingWidget.config?.auto_refresh || false,
            refresh_interval: editingWidget.config?.refresh_interval || 30,
            cache_duration: editingWidget.config?.cache_duration || 300,
            transformation_rules: editingWidget.config?.transformation_rules || [],
            jquery_expression: editingWidget.config?.jquery_expression || "",
          },
        }
      : {
          widget_type: "chart",
          title: "",
          data_source_id: "",
          config: {
            chart_type: "line",
            content: "",
            url: "",
            metric_field: "",
            format: "number",
            auto_refresh: false,
            refresh_interval: 30,
            cache_duration: 300,
            transformation_rules: [],
            jquery_expression: "",
          },
        },
  })

  const selectedWidgetType = form.watch("widget_type")

  const onSubmit = async (data: WidgetFormData) => {
    setIsLoading(true)
    try {
      const url = editingWidget ? `/api/widgets/${editingWidget.id}` : "/api/widgets"
      const method = editingWidget ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dashboard_id: dashboardId,
          ...data,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingWidget ? "update" : "create"} widget`)
      }

      const widget = await response.json()
      onWidgetCreated(widget)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error(`Error ${editingWidget ? "updating" : "creating"} widget:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const insertExample = (expression: string) => {
    form.setValue("config.jquery_expression", expression)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingWidget ? "Edit Widget" : "Create New Widget"}</DialogTitle>
          <DialogDescription>
            {editingWidget
              ? "Update widget settings and configuration."
              : "Add a new widget to your dashboard. Configure basic settings and advanced options."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                <TabsTrigger value="transform">Data Transform</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <FormField
                  control={form.control}
                  name="widget_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Widget Type</FormLabel>
                      <div className="grid grid-cols-2 gap-3">
                        {widgetTypes.map((type) => {
                          const Icon = type.icon
                          return (
                            <div
                              key={type.value}
                              className={`group relative cursor-pointer rounded-lg border p-4 hover:bg-accent text-white ${
                                field.value === type.value ? "border-accent bg-primary" : ""
                              }`}
                              onClick={() => field.onChange(type.value)}
                            >
                              <div className="flex items-start space-x-3">
                                <Icon className="h-5 w-5 mt-0.5" />
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">{type.label}</p>
                                  <p className={`text-xs group-hover:text-white
                                    ${field.value === type.value ? "text-white/90" : "text-muted-foreground"}
                                    `}>{type.description}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Widget Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter widget title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedWidgetType !== "text" && selectedWidgetType !== "iframe" && (
                  <FormField
                    control={form.control}
                    name="data_source_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Source</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a data source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dataSources.map((source) => (
                              <SelectItem key={source.id} value={source.id}>
                                {source.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Choose the data source for this widget</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {selectedWidgetType === "chart" && (
                  <FormField
                    control={form.control}
                    name="config.chart_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chart Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select chart type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {chartTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {selectedWidgetType === "text" && (
                  <FormField
                    control={form.control}
                    name="config.content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter text content (supports basic markdown)"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>You can use basic markdown formatting</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {selectedWidgetType === "iframe" && (
                  <FormField
                    control={form.control}
                    name="config.url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormDescription>URL of the content to embed</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {selectedWidgetType === "kpi" && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="config.metric_field"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Metric Field</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., total_sales, user_count" {...field} />
                          </FormControl>
                          <FormDescription>The field name from your data source to display as KPI</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="config.format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number Format</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="number">Number (1,234)</SelectItem>
                              <SelectItem value="currency">Currency ($1,234)</SelectItem>
                              <SelectItem value="percentage">Percentage (12.34%)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transform" className="space-y-6">
                {selectedWidgetType !== "text" && selectedWidgetType !== "iframe" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Code className="h-4 w-4" />
                      <h4 className="text-sm font-medium">Data Transformation</h4>
                    </div>

                    <FormField
                      control={form.control}
                      name="config.jquery_expression"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>jQuery-like Expression</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="$(data).filter('[status=active]').sort('date', 'desc').get()"
                              className="min-h-[120px] font-mono text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Transform your data using jQuery-like syntax. Use $(data) to access the API response.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Transformation Examples</CardTitle>
                        <CardDescription>Click any example to insert it into the expression field</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          {transformationExamples.map((example, index) => (
                            <div
                              key={index}
                              className="flex items-start justify-between p-3 rounded-lg border hover:bg-accent group cursor-pointer"
                              onClick={() => insertExample(example.expression)}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {example.name}
                                  </Badge>
                                </div>
                                <code className="text-xs text-muted-foreground font-mono group-hover:text-white">{example.expression}</code>
                                <p className="text-xs text-muted-foreground group-hover:text-white">{example.description}</p>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-white" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {(selectedWidgetType === "text" || selectedWidgetType === "iframe") && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Data transformation is not available for {selectedWidgetType} widgets</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Advanced Settings
                  </h4>

                  <FormField
                    control={form.control}
                    name="config.auto_refresh"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Auto Refresh</FormLabel>
                          <FormDescription>Automatically refresh widget data at regular intervals</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("config.auto_refresh") && (
                    <FormField
                      control={form.control}
                      name="config.refresh_interval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refresh Interval (seconds)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="10"
                              max="3600"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>How often to refresh the data (minimum 10 seconds)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="config.cache_duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cache Duration (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="3600"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>How long to cache API responses (0 to disable caching)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? editingWidget
                    ? "Updating..."
                    : "Creating..."
                  : editingWidget
                    ? "Update Widget"
                    : "Create Widget"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
