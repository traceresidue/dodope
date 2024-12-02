'use client'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Legend, Area, AreaChart, Line, LineChart } from 'recharts'
import { useState } from 'react'


interface ExpandedChartsProps {
  program: {
    monthly_surveys: Array<{
      month: string
      total_dispensed_nasal: number
      total_dispensed_inject: number
      used_narcan_count: number
      male_count: number
      female_count: number
      trans_male_count: number
      trans_female_count: number
      genderqueer_nonbinary_count: number
      other_gender_count: number
      afam_count: number
      native_count: number
      asian_count: number
      pi_count: number
      white_count: number
      latinx_count: number
    }>
    total_encounters: number
    total_dispensed_nasal: number
    total_dispensed_inject: number
    new_registrations: number
    total_naloxone_uses: number
  }
}

export function ExpandedCharts({ program }: ExpandedChartsProps) {
  // Calculate cumulative naloxone usage
  const cumulativeData = program.monthly_surveys.reduce((acc, entry) => {
    const lastValue = acc.length > 0 ? acc[acc.length - 1].value : 0
    acc.push({
      month: entry.month,
      value: lastValue + (entry.used_narcan_count || 0)
    })
    return acc
  }, [] as Array<{ month: string; value: number }>)

  // Calculate dot visualization max value
  const maxValue = Math.max(
    program.total_encounters,
    program.total_dispensed_nasal + program.total_dispensed_inject,
    program.new_registrations,
    program.total_naloxone_uses
  )

  const renderDot = (value: number) => {
    if (value === 0) {
      return <div className="inline-block w-2 h-2 rounded-full border border-black" />
    }
    return '•'.repeat(Math.round((value / maxValue) * 50))
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Naloxone Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Approach 1: Naloxone Distribution Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              Nasal: {
                label: "Nasal",
                color: "#047857",
              },
              Injectable: {
                label: "Injectable",
                color: "#40CCC3",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={program.monthly_surveys}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="total_dispensed_nasal" name="Nasal" stackId="a" fill="#047857" />
                <Bar dataKey="total_dispensed_inject" name="Injectable" stackId="a" fill="#40CCC3" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Approach 2: Cumulative Reported Naloxone Uses</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              value: { 
                label: "Cumulative Reported Uses",
                color: "#047857",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#047857"
                  fill="#047857"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Cumulative Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Approach 3: Cumulative Naloxone Usage Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              value: { 
                label: "Cumulative Uses",
                color: "#047857",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#047857"
                  strokeWidth={2}
                  dot={{ fill: "#047857" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Dot Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Approach 4: Data Representation as Dots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: 'Total Encounters', value: program.total_encounters, color: '#047857' },
              { label: 'Naloxone Dispensed', value: program.total_dispensed_nasal + program.total_dispensed_inject, color: '#40CCC3' },
              { label: 'New Registrations', value: program.new_registrations, color: '#F97066' },
              { label: 'Reported Uses', value: program.total_naloxone_uses, color: '#047857' },
            ].map(({ label, value, color }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">{label}:</span>
                  <span>{value}</span>
                </div>
                <div style={{ color }} className="font-mono">
                  {renderDot(value)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

