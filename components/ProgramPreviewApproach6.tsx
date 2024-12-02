import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'

export function ProgramPreviewApproach6({ program }) {
  const chartData = program.monthly_surveys.map(entry => ({
    month: entry.month,
    newParticipants: entry.new_registration_count
  }))

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>New Participants Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500 font-medium">Data Not Available</p>
          </div>
        ) : (
          <ChartContainer
            config={{
              newParticipants: {
                label: "New Participants",
                color: "#F97066",
              },
            }}
            className="h-[250px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="newParticipants" 
                  stroke="#F97066" 
                  strokeWidth={2}
                  dot={{ fill: "#F97066" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

