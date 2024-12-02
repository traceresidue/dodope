import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts'

export function ProgramPreviewApproach3({ program, allPrograms }) {
  // Calculate average used_narcan_count for all programs by month
  const monthlyAverages = program.monthly_surveys.reduce((acc, entry) => {
    const monthData = allPrograms.map(p => 
      p.monthly_surveys.find(m => m.month === entry.month)?.used_narcan_count || 0
    )
    const average = monthData.reduce((sum, val) => sum + val, 0
) / allPrograms.length
    
    acc[entry.month] = average
    return acc
  }, {})

  const chartData = program.monthly_surveys.map(entry => ({
    month: entry.month,
    programCount: entry.used_narcan_count || 0,
    averageCount: monthlyAverages[entry.month]
  }))

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Naloxone Usage Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500 font-medium">Data Not Available</p>
          </div>
        ) : (
          <ChartContainer
            config={{
              programCount: { 
                label: "Program Usage",
                color: "#047857",
              },
              averageCount: {
                label: "Average Usage",
                color: "#94a3b8",
              }
            }}
            className="h-[250px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="programCount" 
                  stroke="#047857" 
                  strokeWidth={2}
                  dot={{ fill: "#047857" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="averageCount" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#94a3b8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

