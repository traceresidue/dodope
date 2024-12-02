import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#047857', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4'];

export function ProgramPreviewApproach1({ program }) {
  const chartData = program.monthly_surveys.map((entry, index) => ({
    month: entry.month,
    total: (entry.total_dispensed_nasal || 0) + (entry.total_dispensed_inject || 0),
    nasal: entry.total_dispensed_nasal || 0,
    injectable: entry.total_dispensed_inject || 0,
    color: COLORS[index % COLORS.length]
  }))

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Naloxone Distribution Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500 font-medium">Data Not Available</p>
          </div>
        ) : (
          <ChartContainer
            config={{
              total: {
                label: "Total",
                color: "#047857",
              }
            }}
            className="h-[250px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border border-gray-200 rounded-lg shadow">
                          <p className="font-medium">{payload[0].payload.month}</p>
                          <p className="text-sm">Nasal: {payload[0].payload.nasal}</p>
                          <p className="text-sm">Injectable: {payload[0].payload.injectable}</p>
                          <p className="text-sm font-medium">Total: {payload[0].payload.total}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="total">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

