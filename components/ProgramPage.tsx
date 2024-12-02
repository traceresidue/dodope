'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Pie, PieChart, Cell, Legend, Area, AreaChart, ReferenceDot } from 'recharts'
import { Skeleton } from "@/components/ui/skeleton"

type SurveyEntry = {
  id: number
  programshortname: string
  programname: string
  month_year: string
  total_surveys: number
  total_dispensed: number
  total_dispensed_nasal: number
  total_dispensed_inject: number
  female_count: number
  male_count: number
  trans_female_count: number
  trans_male_count: number
  genderqueer_nonbinary_count: number
  other_gender_count: number
  afam_count: number
  native_count: number
  asian_count: number
  pi_count: number
  white_count: number
  latinx_count: number
  used_narcan_count: number
  new_registration_count: number
  unique_service_days: number
  [key: string]: any
}


interface ProgramPageProps {
  programShortname: string
}

const GENDER_COLORS = {
  'Man': '#2A9D8F',
  'Woman': '#FF8C7C',
  'Trans man': '#264653',
  'Trans woman': '#FFA07A',
  'Genderqueer/Non-Binary': '#4CAF50',
  'Other': '#FF69B4'
}

const RACE_COLORS = {
  'Black': '#2A9D8F',
  'American Indian': '#FF8C7C',
  'Asian': '#40CCC3',
  'Pacific Islander': '#FFD700',
  'White': '#87CEEB',
  'Latino': '#FF7F7F'
}

export function ProgramPage({ programShortname }: ProgramPageProps) {
  const [data, setData] = useState<SurveyEntry[]>([])
  const [programName, setProgramName] = useState('')
  const [months, setMonths] = useState<string[]>([])
  const [startMonth, setStartMonth] = useState<string>('Select Month')
  const [endMonth, setEndMonth] = useState<string>('Select Month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [programShortname])

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch program details
      const { data: programData, error: programError } = await supabase
        .from('program_details')
        .select('programname')
        .eq('programshortname', programShortname)
        .single()

      if (programError) throw programError
      setProgramName(programData?.programname || '')

      // Fetch survey data
      const { data: surveyData, error: surveyError } = await supabase
        .from('p_surveys')
        .select('*')
        .eq('programshortname', programShortname)
        .order('month_year', { ascending: true })

      if (surveyError) throw surveyError
      setData(surveyData || [])
      const uniqueMonths = Array.from(new Set((surveyData || []).map(item => item.month_year)))
      setMonths(uniqueMonths.sort())

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }


  const filteredData = data.filter(item => {
    const startMonthMatch = startMonth === 'Select Month' || item.month_year >= startMonth
    const endMonthMatch = endMonth === 'Select Month' || item.month_year <= endMonth
    return startMonthMatch && endMonthMatch
  })

  const handleStartMonthChange = (value: string) => {
    setStartMonth(value)
    if (value !== 'Select Month' && endMonth !== 'Select Month' && value > endMonth) {
      setEndMonth(value)
    }
  }

  const handleEndMonthChange = (value: string) => {
    setEndMonth(value)
    if (value !== 'Select Month' && startMonth !== 'Select Month' && value < startMonth) {
      setStartMonth(value)
    }
  }

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
  }, [])

  const monthlyDistributionData = filteredData.map(item => ({
    month: item.month_year,
    'Nasal Naloxone': item.total_dispensed_nasal || 0,
    'Injectable Naloxone': item.total_dispensed_inject || 0
  }))

  const raceData = filteredData.map(item => ({
    month: item.month_year,
    'Black': item.afam_count || 0,
    'American Indian': item.native_count || 0,
    'Asian': item.asian_count || 0,
    'Pacific Islander': item.pi_count || 0,
    'White': item.white_count || 0,
    'Latino': item.latinx_count || 0,
    total: (item.afam_count || 0) + (item.native_count || 0) + (item.asian_count || 0) + 
           (item.pi_count || 0) + (item.white_count || 0) + (item.latinx_count || 0)
  })).map(item => ({
    month: formatDate(item.month),
    ...Object.fromEntries(
      Object.entries(item).filter(([key]) => key !== 'month' && key !== 'total')
        .map(([key, value]) => [key, (value as number / (item.total || 1) * 100)])
    )
  }))

  const totals = filteredData.reduce((acc, item) => ({
    total_surveys: (acc.total_surveys || 0) + (item.total_surveys || 0),
    total_dispensed: (acc.total_dispensed || 0) + (item.total_dispensed || 0),
    used_narcan_count: (acc.used_narcan_count || 0) + (item.used_narcan_count || 0),
    new_registration_count: (acc.new_registration_count || 0) + (item.new_registration_count || 0),
    unique_service_days: (acc.unique_service_days || 0) + (item.unique_service_days || 0),
    total_dispensed_nasal: (acc.total_dispensed_nasal || 0) + (item.total_dispensed_nasal || 0),
    total_dispensed_inject: (acc.total_dispensed_inject || 0) + (item.total_dispensed_inject || 0),
  }), {} as Record<string, number>)

  const exportToCSV = () => {
    const headers = Object.keys(data[0] || {}).join(',')
    const csvData = data.map(row => Object.values(row).join(',')).join('\n')
    const csvContent = `${headers}\n${csvData}`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${programShortname}_p_surveys_data.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }


  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Skeleton className="w-32 h-32" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold">{programName}</h1>
        <div className="flex flex-wrap gap-2 justify-end">
          {[
            { title: totals.total_surveys || 0, description: "Total Encounters" },
            { title: totals.total_dispensed || 0, description: "Naloxone Units Dispensed" },
            { title: totals.used_narcan_count || 0, description: "Naloxone Uses Reported" },
            { title: totals.new_registration_count || 0, description: "New Registrations/Participants" },
          ].map((stat, index) => (
            <Card key={index} className="w-[200px]">
              <CardHeader className="p-2 text-center">
                <CardTitle className="text-lg font-bold">{stat.title}</CardTitle>
                <CardDescription className="text-xs">{stat.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/*Removed this section as per update 1*/}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cumulative Naloxone Uses Reported (All Programs)</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
              <ChartContainer
                config={{
                  'Cumulative Uses': {
                    label: "Cumulative Uses",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[180px]"
              >
                <ResponsiveContainer width="90%" height="100%">
                  <AreaChart
                    data={filteredData.reduce((acc, item) => {
                      const lastItem = acc[acc.length - 1];
                      const cumulativeUses = (lastItem ? lastItem.cumulativeUses : 0) + (item.used_narcan_count || 0);
                      return [...acc, { ...item, cumulativeUses }];
                    }, [] as (SurveyEntry & { cumulativeUses: number })[])}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month_year" tickFormatter={formatDate} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="cumulativeUses" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1) / 0.2)" />
                    <ReferenceDot
                      x={filteredData[filteredData.length - 1]?.month_year}
                      y={filteredData.reduce((sum, item) => sum + (item.used_narcan_count || 0), 0)}
                      r={4}
                      fill="hsl(var(--chart-1))"
                      stroke="none"
                    />
                    <Label
                      content={({ viewBox: { x, y } }) => (
                        <g>
                          <circle cx={x} cy={y} r="4" fill="hsl(var(--chart-1))" />
                          <text 
                            x={x} 
                            y={y - 15} 
                            fill="hsl(var(--chart-1))" 
                            fontSize={14} 
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            {filteredData.reduce((sum, item) => sum + (item.used_narcan_count || 0), 0)}
                          </text>
                        </g>
                      )}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex justify-center items-center h-[360px]">
                <p className="text-gray-500 text-lg">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly distribution of nasal and injectable naloxone (All Programs)</CardTitle>
            <div className="flex justify-end gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#047857] rounded-sm mr-1" />
                <span>Nasal Naloxone</span>
                <span className="ml-2 text-[#047857] font-medium">{totals.total_dispensed_nasal || 0}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#F97066] rounded-sm mr-1" />
                <span>Injectable Naloxone</span>
                <span className="ml-2 text-[#F97066] font-medium">{totals.total_dispensed_inject || 0}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
              <ChartContainer
                config={{
                  'Nasal Naloxone': {
                    label: "Nasal Naloxone",
                    color: "#047857",
                  },
                  'Injectable Naloxone': {
                    label: "Injectable Naloxone",
                    color: "#F97066",
                  },
                }}
                className="h-[180px]"
              >
                <ResponsiveContainer width="90%" height="100%">
                  <BarChart data={monthlyDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={formatDate} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="Nasal Naloxone" stackId="a" fill="#047857" />
                    <Bar dataKey="Injectable Naloxone" stackId="a" fill="#F97066" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex justify-center items-center h-[360px]">
                <p className="text-gray-500 text-lg">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
            <div className="text-sm">
              {formatDate(startMonth === 'Select Month' ? months[0] : startMonth)} - {formatDate(endMonth === 'Select Month' ? months[months.length - 1] : endMonth)}
            </div>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
              <ChartContainer 
                config={Object.fromEntries(
                  Object.entries(GENDER_COLORS).map(([key, color]) => [
                    key,
                    { label: key, color: color }
                  ])
                )}
                className="h-[360px]"
              >
                <ResponsiveContainer width="90%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Man', value: filteredData.reduce((sum, item) => sum + (item.male_count || 0), 0) },
                        { name: 'Woman', value: filteredData.reduce((sum, item) => sum + (item.female_count || 0), 0) },
                        { name: 'Trans man', value: filteredData.reduce((sum, item) => sum + (item.trans_male_count || 0), 0) },
                        { name: 'Trans woman', value: filteredData.reduce((sum, item) => sum + (item.trans_female_count || 0), 0) },
                        { name: 'Genderqueer/Non-Binary', value: filteredData.reduce((sum, item) => sum + (item.genderqueer_nonbinary_count || 0), 0) },
                        { name: 'Other', value: filteredData.reduce((sum, item) => sum + (item.other_gender_count || 0), 0) }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={false}
                    >
                      {Object.entries(GENDER_COLORS).map(([key, color]) => (
                        <Cell key={key} fill={color} />
                      ))}
                    </Pie>
                    <Legend 
                      layout="horizontal"
                      align="center"
                      verticalAlign="bottom"
                      iconType="square"
                    />
                    <ChartTooltip 
                      content={({ payload }) => {
                        if (payload && payload.length) {
                          const total = payload.reduce((sum, entry) => sum + entry.value, 0);
                          return (
                            <div className="bg-white p-2 border border-gray-300 rounded shadow">
                              <p className="font-bold">{payload[0].name}</p>
                              <p>{`${payload[0].value} (${((payload[0].value / total) * 100).toFixed(2)}%)`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex justify-center items-center h-[360px]">
                <p className="text-gray-500 text-lg">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Race & Ethnicity</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
              <ChartContainer
                config={Object.fromEntries(
                  Object.entries(RACE_COLORS).map(([key, color]) => [
                    key,
                    { label: key, color: color }
                  ])
                )}
                className="h-[360px]"
              >
                <ResponsiveContainer width="90%" height="100%">
                  <BarChart
                    data={raceData}
                    layout="vertical"
                    stackOffset="expand"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <XAxis type="number" tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                    <YAxis type="category" dataKey="month" />
                    <ChartTooltip 
                      content={({ payload, label }) => {
                        if (payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border border-gray-300 rounded shadow">
                              <p className="font-bold">{label}</p>
                              {payload.map((entry, index) => (
                                <p key={index}>{`${entry.name}: ${(entry.value * 100).toFixed(2)}%`}</p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      layout="horizontal"
                      align="center"
                      verticalAlign="bottom"
                      iconType="square"
                    />
                    {Object.entries(RACE_COLORS).map(([key, color]) => (
                      <Bar key={key} dataKey={key} stackId="a" fill={color} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex justify-center items-center h-[360px]">
                <p className="text-gray-500 text-lg">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

