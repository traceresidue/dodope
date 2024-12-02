import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'

export function ProgramPreviewApproach5({ program }) {
  const chartData = program.monthly_surveys.map(entry => ({
    month: entry.month,
    encounters: entry.surveys
  }))

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Encounters Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500 font-medium">Data Not Available</p>
          </div>
        ) : (
          <ChartContainer
            config={{
              encounters: {
                label: "Encounters",
                color: "#9333ea",
              },
            }}
            className="h-[250px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="encounters" fill="#d8b4fe">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`}>
                      {({ width, height, x, y }) => (
                        <g>
                          <rect x={x} y={y} width={width} height={height} fill="#d8b4fe" />
                          <text
                            x={x + width / 2}
                            y={y + height / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#000000"
                            fontSize="12"
                          >
                            {entry.encounters}
                          </text>
                        </g>
                      )}
                    </Cell>
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

