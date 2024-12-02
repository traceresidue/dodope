'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Pie, PieChart, Cell, AreaChart, Area } from 'recharts'
import { Skeleton } from "@/components/ui/skeleton"
import { ProgramDataPreviews } from '@/components/ProgramDataPreviews'

type SurveyEntry = {
  id: number
  programshortname: string
  month_year: string
  total_surveys: number
  total_dispensed_nasal: number
  total_dispensed_inject: number
  used_narcan_count: number
  new_registration_count: number
  unique_service_days: number
  [key: string]: any
}

type AggregatedData = {
  month_year: string
  total_surveys: number
  total_dispensed_nasal: number
  total_dispensed_inject: number
}

export function ProgramDashboard() {
  const [data, setData] = useState<SurveyEntry[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data, error } = await supabase
      .from('p_surveys')
      .select('*')
      .order('month_year', { ascending: true })

    if (error) {
      console.error('Error fetching data:', error)
    } else if (data) {
      setData(data)
    }
  }

  const aggregatedData: AggregatedData[] = data.reduce((acc, item) => {
    const existingEntry = acc.find(entry => entry.month_year === item.month_year)
    if (existingEntry) {
      existingEntry.total_surveys += item.total_surveys
      existingEntry.total_dispensed_nasal += item.total_dispensed_nasal
      existingEntry.total_dispensed_inject += item.total_dispensed_inject
    } else {
      acc.push({
        month_year: item.month_year,
        total_surveys: item.total_surveys,
        total_dispensed_nasal: item.total_dispensed_nasal,
        total_dispensed_inject: item.total_dispensed_inject
      })
    }
    return acc
  }, [] as AggregatedData[]).sort((a, b) => a.month_year.localeCompare(b.month_year))

  const barChartData = aggregatedData.map(item => ({
    month: item.month_year,
    total_surveys: item.total_surveys
  }))

  const pieChartData = [
    { name: 'Nasal', value: aggregatedData.reduce((sum, item) => sum + item.total_dispensed_nasal, 0) },
    { name: 'Inject', value: aggregatedData.reduce((sum, item) => sum + item.total_dispensed_inject, 0) }
  ]

  const COLORS = ['#0088FE', '#00C49F']

  const totals = data.reduce((acc, item) => ({
    total_surveys: (acc.total_surveys || 0) + (item.total_surveys || 0),
    total_dispensed: (acc.total_dispensed || 0) + ((item.total_dispensed_nasal || 0) + (item.total_dispensed_inject || 0)),
    used_narcan_count: (acc.used_narcan_count || 0) + (item.used_narcan_count || 0),
    new_registration_count: (acc.new_registration_count || 0) + (item.new_registration_count || 0),
    unique_service_days: (acc.unique_service_days || 0) + (item.unique_service_days || 0),
  }), {} as Record<string, number>)

  const exportToCSV = () => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const csvData = data.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = `${headers}\n${csvData}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'program_dashboard_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Program Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={exportToCSV}>Export to CSV</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-5 gap-4">
        {[
          { title: totals.total_surveys || 0, description: "Total Encounters" },
          { title: totals.total_dispensed || 0, description: "Naloxone Units Dispensed" },
          { title: totals.used_narcan_count || 0, description: "Naloxone Uses Reported" },
          { title: totals.new_registration_count || 0, description: "New Registrations/Participants" },
          { title: totals.unique_service_days || 0, description: "Days With Encounters" },
        ].map((stat, index) => (
          <Card key={index}>
            <CardHeader className="p-4 text-center">
              <CardTitle className="text-2xl font-bold">{stat.title}</CardTitle>
              <CardDescription>{stat.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap">
        <Card className="w-full md:w-1/2 p-2">
          <CardHeader>
            <CardTitle>Total Surveys Over Time (All Programs)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.length > 0 ? (
              <ChartContainer
                config={{
                  total_surveys: {
                    label: "Total Surveys",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={formatDate} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total_surveys" fill="var(--color-total_surveys)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="relative h-[300px] w-full">
                <Skeleton className="h-full w-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-500 text-lg">No data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full md:w-1/2 p-2">
          <CardHeader>
            <CardTitle>Naloxone Distribution Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {data.length > 0 ? (
              <ChartContainer
                config={{
                  nasal: {
                    label: "Nasal",
                    color: "hsl(var(--chart-1))",
                  },
                  inject: {
                    label: "Injectable",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={aggregatedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month_year" tickFormatter={formatDate} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="total_dispensed_nasal"
                      stackId="1"
                      stroke="var(--color-nasal)"
                      fill="var(--color-nasal)"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="total_dispensed_inject"
                      stackId="1"
                      stroke="var(--color-inject)"
                      fill="var(--color-inject)"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="relative h-[300px] w-full">
                <Skeleton className="h-full w-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-500 text-lg">No data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ProgramDataPreviews />
    </div>
  )
}

