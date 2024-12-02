"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface FormulationChartProps {
  data: Array<{
    month_year: string
    total_dispensed_nasal: number
    total_dispensed_inject: number
  }>
  title?: string
  className?: string
}

const chartConfig = {
    total_dispensed_nasal: {
      label: "Nasal Naloxone",
      color: "#2a9d90",
    },
    total_dispensed_inject: {
      label: "Injectable Naloxone",
      color: "#e76e50",
    },
  }

export function FormulationChart({ data, title = "Naloxone Distribution by Formulation", className }: FormulationChartProps) {
  const formattedData = React.useMemo(() => 
    data
      .sort((a, b) => new Date(a.month_year).getTime() - new Date(b.month_year).getTime())
      .map(item => ({
        ...item,
        date: new Date(item.month_year).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short'
        })
      })),
    [data]
  )

  const totals = React.useMemo(
    () => ({
      total_dispensed_nasal: formattedData.reduce((acc, curr) => acc + (curr.total_dispensed_nasal || 0), 0),
      total_dispensed_inject: formattedData.reduce((acc, curr) => acc + (curr.total_dispensed_inject || 0), 0),
    }),
    [formattedData]
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4 space-x-6">
          {Object.entries(totals).map(([key, value]) => (
            <div key={key} className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground">
                {chartConfig[key as keyof typeof chartConfig]?.label}
              </span>
              <span 
                className="text-lg font-bold" 
                style={{ color: chartConfig[key as keyof typeof chartConfig]?.color }}
              >
                {value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        {formattedData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={formattedData}
                margin={{
                  top: 5,
                  right: 5,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month_year" 
                  tickFormatter={formatDate}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar 
                  dataKey="total_dispensed_nasal" 
                  stackId="a" 
                  fill="var(--color-total_dispensed_nasal)"
                  name="Nasal Naloxone"
                />
                <Bar 
                  dataKey="total_dispensed_inject" 
                  stackId="a" 
                  fill="var(--color-total_dispensed_inject)"
                  name="Injectable Naloxone"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex justify-center items-center h-[300px] text-gray-500">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}