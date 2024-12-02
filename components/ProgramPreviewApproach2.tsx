import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const COLORS = ['#047857', '#40CCC3', '#F97066', '#FF8C00', '#FFD700', '#90EE90', '#ADD8E6']

export function ProgramPreviewApproach2({ program }) {
  const [selectedVariable, setSelectedVariable] = useState('gender')

  const variables = [
    { value: 'gender', label: 'Gender Distribution' },
    { value: 'race', label: 'Race/Ethnicity Distribution' },
  ]

  const chartData = selectedVariable === 'gender'
  ? [
      { name: 'Man', value: program.male_count || 0 },
      { name: 'Woman', value: program.female_count || 0 },
      { name: 'Trans man', value: program.trans_male_count || 0 },
      { name: 'Trans woman', value: program.trans_female_count || 0 },
      { name: 'Genderqueer/Non-Binary', value: program.genderqueer_nonbinary_count || 0 },
      { name: 'Other', value: program.other_gender_count || 0 },
    ]
  : [
      { name: 'Black', value: program.afam_count || 0 },
      { name: 'American Indian', value: program.native_count || 0 },
      { name: 'Asian', value: program.asian_count || 0 },
      { name: 'Pacific Islander', value: program.pi_count || 0 },
      { name: 'White', value: program.white_count || 0 },
      { name: 'Latino', value: program.latinx_count || 0 },
    ]

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Approach 2: Variable Distribution Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select onValueChange={setSelectedVariable} value={selectedVariable}>
            <SelectTrigger>
              <SelectValue placeholder="Select variable" />
            </SelectTrigger>
            <SelectContent>
              {variables.map((variable) => (
                <SelectItem key={variable.value} value={variable.value}>
                  {variable.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {chartData.every(item => item.value === 0) ? (
          <div className="h-[250px] bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500 font-medium">Data Not Available</p>
          </div>
        ) : (
          <ChartContainer
            config={Object.fromEntries(
              chartData.map((entry, index) => [
                entry.name,
                { label: entry.name, color: COLORS[index % COLORS.length] }
              ])
            )}
            className="h-[250px]" // Updated height
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill={COLORS[0]}
                  dataKey="value"
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

