"use client"

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface ChartWidgetProps {
  data: any[]
  config: {
    chart_type?: string
    x_field?: string
    y_field?: string
    [key: string]: any
  }
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function ChartWidget({ data, config }: ChartWidgetProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">No data available</div>
  }

  const chartType = config?.chart_type || "line"

  const xField = config?.x_field || Object.keys(data[0])[0]
  const yField =
    config?.y_field || Object.keys(data[0]).find((key) => typeof data[0][key] === "number") || Object.keys(data[0])[1]

  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xField} />
            <YAxis />
            <Tooltip
              contentStyle={{
                background: "#222",
                color: "#fff"
              }}
              labelStyle={{
                color: "#fff"
              }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="p-2 bg-gray-800 border border-gray-700 rounded flexl flex-col gap-3">
                      <p className="text-md">{`${xField}: ${data[xField]}`}</p>
                      <p className="text-sm text-gray-400">{`${yField}: ${data[yField]}`}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend />
            <Line type="monotone" dataKey={yField} stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        )

      case "area":
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xField} />
            <YAxis />
            <Tooltip
              contentStyle={{
                background: "#222",
                color: "#fff"
              }}
              labelStyle={{
                color: "#fff"
              }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="p-2 bg-gray-800 border border-gray-700 rounded flexl flex-col gap-3">
                      <p className="text-md">{`${xField}: ${data[xField]}`}</p>
                      <p className="text-sm text-gray-400">{`${yField}: ${data[yField]}`}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend />
            <Area type="monotone" dataKey={yField} stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        )

      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xField} />
            <YAxis />
            <Tooltip
              contentStyle={{
                background: "#222",
                color: "#fff"
              }}
              labelStyle={{
                color: "#fff"
              }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="p-2 bg-gray-800 border border-gray-700 rounded flexl flex-col gap-3">
                      <p className="text-md">{`${xField}: ${data[xField]}`}</p>
                      <p className="text-sm text-gray-400">{`${yField}: ${data[yField]}`}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend />
            <Bar dataKey={yField} fill="#8884d8" />
          </BarChart>
        )

      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={yField}
              nameKey={xField}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#222",
                color: "#fff"
              }}
              labelStyle={{
                color: "#fff"
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="p-2 bg-gray-800 border border-gray-700 rounded">
                      <p className="text-sm">{`${data[xField]} : ${data[yField]}`}</p>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        )

      default:
        return <div className="text-center text-muted-foreground">Unsupported chart type</div>
    }
  }

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%" className="widget-interract">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}
