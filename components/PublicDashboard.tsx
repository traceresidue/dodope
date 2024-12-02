'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Pie, PieChart, Cell, AreaChart, Area, LineChart, Line } from 'recharts'
import { Skeleton } from "@/components/ui/skeleton"
import * as d3 from 'd3'
import { FormulationChart } from '@/components/ui/formulation-chart'

// Initialize Supabase client
const supabase = createClient('https://obheyqbxnhsejpjewtzs.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaGV5cWJ4bmhzZWpwamV3dHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzMzQzNTMsImV4cCI6MjA0MzkxMDM1M30.qNryur5BuccD0NUXobl_-ABEEaLbDb82zoRDtHvcImk')

type SurveyEntry = {
  month_year: string
  programshortname: string
  total_surveys: number
  total_dispensed_nasal: number
  total_dispensed_inject: number
  used_narcan_count: number
  new_registration_count: number
  unique_service_days: number
  male_count?: number
  female_count?: number
  genderqueer_nonbinary_count?: number
  other_gender_count?: number
  afam_count?: number
  native_count?: number
  asian_count?: number
  pi_count?: number
  white_count?: number
  latinx_count?: number
  [key: string]: number | string | undefined
}

export function PublicDashboard() {
  const [data, setData] = useState<SurveyEntry[]>([])
  const [months, setMonths] = useState<string[]>([])
  const [startMonth, setStartMonth] = useState<string>('')
  const [endMonth, setEndMonth] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const d3ChartRef1 = useRef<SVGSVGElement>(null)
  const d3ChartRef2 = useRef<SVGSVGElement>(null)
  const miniChart1Ref = useRef<HTMLDivElement>(null)
  const miniChart2Ref = useRef<HTMLDivElement>(null)
  const miniChart3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (data.length > 0 && !loading) {
      drawD3BubbleChart()
      drawHeatmap()
      drawMiniCharts()
    }
  }, [data, loading, startMonth, endMonth])

  async function fetchData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('adapted_latest_surveys')
        .select('*')
        .order('month_year', { ascending: true })

      if (error) throw error

      const validData = data.filter(item => {
        const date = new Date(item.month_year)
        return !isNaN(date.getTime())
      })

      // Aggregate data by month_year
      const aggregatedData = validData.reduce((acc, item) => {
        const existingEntry = acc.find(e => e.month_year === item.month_year)
        if (existingEntry) {
          Object.keys(item).forEach(key => {
            if (typeof item[key] === 'number') {
              existingEntry[key] = (existingEntry[key] || 0) + item[key]
            }
          })
        } else {
          acc.push({ ...item })
        }
        return acc
      }, [] as SurveyEntry[])

      setData(aggregatedData)
      const uniqueMonths = Array.from(new Set(aggregatedData.map(item => item.month_year))).sort()
      setMonths(uniqueMonths)
      
      // Set default months to earliest and latest
      if (uniqueMonths.length > 0) {
        setStartMonth(uniqueMonths[0])
        setEndMonth(uniqueMonths[uniqueMonths.length - 1])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = data.filter(item => {
    const startMonthMatch = startMonth === '' || item.month_year >= startMonth
    const endMonthMatch = endMonth === '' || item.month_year <= endMonth
    return startMonthMatch && endMonthMatch
  })

  const handleStartMonthChange = (value: string) => {
    setStartMonth(value)
    if (value !== '' && endMonth !== '' && value > endMonth) {
      setEndMonth(value)
    }
  }

  const handleEndMonthChange = (value: string) => {
    setEndMonth(value)
    if (value !== '' && startMonth !== '' && value < startMonth) {
      setStartMonth(value)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`
  }

  const totals = filteredData.reduce((acc, item) => ({
    total_surveys: (acc.total_surveys || 0) + item.total_surveys,
    total_dispensed: (acc.total_dispensed || 0) + item.total_dispensed_nasal + item.total_dispensed_inject,
    used_narcan_count: (acc.used_narcan_count || 0) + item.used_narcan_count,
    new_registration_count: (acc.new_registration_count || 0) + item.new_registration_count,
  }), {} as Record<string, number>)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  const drawD3BubbleChart = () => {
    if (!d3ChartRef1.current) return

    const svg = d3.select(d3ChartRef1.current)
    svg.selectAll("*").remove()

    const width = 450
    const height = 300
    const margin = { top: 20, right: 20, bottom: 30, left: 40 }

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(filteredData, d => d.total_surveys) || 0])
      .range([20, 60])

    const simulation = d3.forceSimulation(filteredData)
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .force("collide", d3.forceCollide(d => radiusScale(d.total_surveys) + 2))

    const pieGenerator = d3.pie()
      .value(d => d[1])
      .sort(null)

    const arcGenerator = d3.arc()
      .innerRadius(0)
      .padAngle(0.01)

    const raceColors = {
      afam_count: "#FF6B6B",
      native_count: "#4ECDC4",
      asian_count: "#45B7D1",
      pi_count: "#F9D56E",
      white_count: "#C8E6C9",
      latinx_count: "#FFB74D"
    }

    const bubbles = g.selectAll(".bubble")
      .data(filteredData)
      .enter().append("g")
      .attr("class", "bubble")

    bubbles.each(function(d) {
      const raceData = Object.entries(raceColors).map(([key, color]) => [key, d[key] || 0])
      const pieData = pieGenerator(raceData)

      d3.select(this).selectAll("path")
        .data(pieData)
        .enter().append("path")
        .attr("fill", (d: any) => raceColors[d.data[0]])
        .attr("d", (d: any) => arcGenerator({
          ...d,
          outerRadius: radiusScale(d.data[1])
        }))
    })

    simulation.on("tick", () => {
      bubbles.attr("transform", d => `translate(${d.x},${d.y})`)
    })

    // Add labels
    bubbles.append("text")
      .text(d => formatDate(d.month_year))
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("font-size", "10px")
      .attr("fill", "white")

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 100}, 10)`)

    Object.entries(raceColors).forEach(([key, color], i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", color)

      legend.append("text")
        .attr("x", 15)
        .attr("y", i * 20 + 9)
        .text(key.replace("_count", ""))
        .attr("font-size", "10px")
    })
  }

  const drawHeatmap = () => {
    if (!d3ChartRef2.current) return

    const svg = d3.select(d3ChartRef2.current)
    svg.selectAll("*").remove()

    const width = 450
    const height = 300
    const margin = { top: 20, right: 20, bottom: 30, left: 40 }

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const x = d3.scaleBand()
      .range([0, width - margin.left - margin.right])
      .domain(filteredData.map(d => d.month_year))
      .padding(0.1)

    const y = d3.scaleBand()
      .range([height - margin.top - margin.bottom, 0])
      .domain(['total_surveys', 'total_dispensed_nasal', 'total_dispensed_inject', 'used_narcan_count'])
      .padding(0.1)

    const color = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([0, d3.max(filteredData, d => Math.max(d.total_surveys, d.total_dispensed_nasal, d.total_dispensed_inject, d.used_narcan_count)) || 0])

    g.selectAll("rect")
      .data(filteredData.flatMap(d => [
        { month: d.month_year, category: 'total_surveys', value: d.total_surveys },
        { month: d.month_year, category: 'total_dispensed_nasal', value: d.total_dispensed_nasal },
        { month: d.month_year, category: 'total_dispensed_inject', value: d.total_dispensed_inject },
        { month: d.month_year, category: 'used_narcan_count', value: d.used_narcan_count },
      ]))
      .enter().append("rect")
      .attr("x", d => x(d.month) || 0)
      .attr("y", d => y(d.category) || 0)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d.value))

    g.append("g")
      .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(formatDate))
      .selectAll("text")
      .attr("y", 0)
      .attr("x", 9)
      .attr("dy", ".35em")
      .attr("transform", "rotate(45)")
      .style("text-anchor", "start")

    g.append("g")
      .call(d3.axisLeft(y))

    // Add a title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("Survey Metrics Heatmap")
  }

  const drawMiniCharts = () => {
    // Mini Chart 1: Survey Trends
    if (miniChart1Ref.current) {
      const width = 200
      const height = 100
      const svg = d3.select(miniChart1Ref.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)

      const x = d3.scaleLinear()
        .domain([0, filteredData.length - 1])
        .range([0, width])

      const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.total_surveys) || 0])
        .range([height, 0])

      const line = d3.line<SurveyEntry>()
        .x((d, i) => x(i))
        .y(d => y(d.total_surveys))

      svg.append("path")
        .datum(filteredData)
        .attr("fill", "none")
        .attr("stroke", "#FF6B6B")
        .attr("stroke-width", 2)
        .attr("d", line)

      // Add title
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Survey Trends")
    }

    // Mini Chart 2: Distribution Cloud
    if (miniChart2Ref.current) {
      const width = 200
      const height = 100
      const svg = d3.select(miniChart2Ref.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)

      const x = d3.scaleTime()
        .domain(d3.extent(filteredData, d => new Date(d.month_year)) as [Date, Date])
        .range([0, width])

      const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.total_surveys) || 0])
        .range([height, 0])

      svg.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => x(new Date(d.month_year)))
        .attr("cy", d => y(d.total_surveys))
        .attr("r", d => Math.sqrt(d.total_surveys) / 2)
        .attr("fill", "#4ECDC4")
        .attr("opacity", 0.6)

      // Add x-axis
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(3).tickFormat(d3.timeFormat("%b %Y") as any))

      // Add title
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Distribution Cloud")
    }

    // Mini Chart 3: New Registrations
    if (miniChart3Ref.current) {
      const width = 200
      const height = 100
      const svg = d3.select(miniChart3Ref.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)

      const x = d3.scaleBand()
        .domain(filteredData.map(d => d.month_year))
        .range([0, width])
        .padding(0.1)

      const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.new_registration_count) || 0])
        .range([height, 0])

      svg.selectAll("rect")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.month_year) || 0)
        .attr("y", d => y(d.new_registration_count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.new_registration_count))
        .attr("fill", (d, i) => i % 2 === 0 ? "#556270" : "#C7F464")

      // Add title
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("New Registrations")
    }
  }

  const DemographicsChart = () => {
    const demographicData = filteredData.map(d => ({
      month: formatDate(d.month_year),
      male: d.male_count || 0,
      female: d.female_count || 0,
      nonbinary: d.genderqueer_nonbinary_count || 0,
      other: d.other_gender_count || 0
    }))

    return (
      <ChartContainer
        config={{
          male: {
            label: "Male",
            color: "#2196f3",
          },
          female: {
            label: "Female",
            color: "#f50057",
          },
          nonbinary: {
            label: "Non-binary",
            color: "#00bcd4",
          },
          other: {
            label: "Other",
            color: "#ff9800",
          },
        }}
        className="h-[300px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={demographicData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="male" stackId="a" fill="#2196f3" />
            <Bar dataKey="female" stackId="a" fill="#f50057" />
            <Bar dataKey="nonbinary" stackId="a" fill="#00bcd4" />
            <Bar dataKey="other" stackId="a" fill="#ff9800" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    )
  }

  const DotMatrixChart = () => {
    const maxUses = Math.max(...filteredData.map(d => d.used_narcan_count))
    const dotData = filteredData.map(d => ({
      month: formatDate(d.month_year),
      dots: Array(d.used_narcan_count).fill(0).map(() => ({
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      }))
    }))

    return (
      <div className="h-[300px] overflow-auto">
        {dotData.map((month, i) => (
          <div key={i} className="flex items-center mb-2">
            <span className="w-20 text-sm">{month.month}</span>
            <div className="flex flex-wrap gap-1">
              {month.dots.map((dot, j) => (
                <div
                  key={j}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: dot.color }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const OverallStatistics = () => {
    const stats = [
      { label: "Total Surveys", value: d3.sum(filteredData, d => d.total_surveys) },
      { label: "Total Dispensed (Nasal)", value: d3.sum(filteredData, d => d.total_dispensed_nasal) },
      { label: "Total Dispensed (Inject)", value: d3.sum(filteredData, d => d.total_dispensed_inject) },
      { label: "Naloxone Uses", value: d3.sum(filteredData, d => d.used_narcan_count) },
      { label: "New Registrations", value: d3.sum(filteredData, d => d.new_registration_count) },
      { label: "Unique Service Days", value: d3.sum(filteredData, d => d.unique_service_days) },
      { label: "Male Count", value: d3.sum(filteredData, d => d.male_count || 0) },
      { label: "Female Count", value: d3.sum(filteredData, d => d.female_count || 0) },
      { label: "Non-Binary Count", value: d3.sum(filteredData, d => d.genderqueer_nonbinary_count || 0) },
    ]

    return (
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">{stat.label}</h3>
            <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    )
  }

  const NewRegistrationsVsNaloxoneUses = () => {
    return (
      <ChartContainer
        config={{
          new_registration_count: {
            label: "New Registrations",
            color: "hsl(var(--chart-4))",
          },
          used_narcan_count: {
            label: "Naloxone Uses",
            color: "hsl(var(--chart-5))",
          },
        }}
        className="h-[300px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month_year" tickFormatter={formatDate} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line 
              type="monotone" 
              dataKey="new_registration_count" 
              stroke="var(--color-new_registration_count)" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="used_narcan_count" 
              stroke="var(--color-used_narcan_count)" 
              strokeWidth={2}
            />
            {filteredData.map((entry, index) => (
              <g key={index}>
                <text
                  x={index * (100 / (filteredData.length - 1)) + '%'}
                  y={100 - (entry.new_registration_count / d3.max(filteredData, d => d.new_registration_count)! * 100) + '%'}
                  textAnchor="middle"
                  fill="var(--color-new_registration_count)"
                  fontSize="12"
                >
                  {entry.new_registration_count}
                </text>
                <text
                  x={index * (100 / (filteredData.length - 1)) + '%'}
                  y={100 - (entry.used_narcan_count / d3.max(filteredData, d => d.used_narcan_count)! * 100) + '%'}
                  textAnchor="middle"
                  fill="var(--color-used_narcan_count)"
                  fontSize="12"
                >
                  {entry.used_narcan_count}
                </text>
              </g>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Public Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="start-month">Select Start Month</Label>
              <Select onValueChange={handleStartMonthChange} value={startMonth}>
                <SelectTrigger id="start-month">
                  <SelectValue placeholder="Select start month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {formatDate(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="end-month">Select End Month</Label>
              <Select onValueChange={handleEndMonthChange} value={endMonth}>
                <SelectTrigger id="end-month">
                  <SelectValue placeholder="Select end month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {formatDate(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={fetchData}>Refresh Data</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Surveys Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="w-full h-[300px]" />
            ) : (
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
                  <AreaChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month_year" tickFormatter={formatDate} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="total_surveys" stroke="var(--color-total_surveys)" fill="var(--color-total_surveys)" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Naloxone Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="w-full h-[300px]" />
            ) : (
              <ChartContainer
                config={{
                  total_dispensed_nasal: {
                    label: "Nasal",
                    color: "hsl(var(--chart-2))",
                  },
                  total_dispensed_inject: {
                    label: "Injectable",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month_year" tickFormatter={formatDate} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total_dispensed_nasal" stackId="a" fill="var(--color-total_dispensed_nasal)" />
                    <Bar dataKey="total_dispensed_inject" stackId="a" fill="var(--color-total_dispensed_inject)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New Registrations vs Naloxone Uses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="w-full h-[300px]" />
            ) : (
              <NewRegistrationsVsNaloxoneUses />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="w-full h-[300px]" />
            ) : (
              <OverallStatistics />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Race Distribution Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="w-full h-[300px]" />
            ) : (
              <svg ref={d3ChartRef1} width="450" height="300"></svg>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Survey Metrics Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="w-full h-[300px]" />
            ) : (
              <svg ref={d3ChartRef2} width="450" height="300"></svg>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Survey Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="w-full h-[100px]" />
            ) : (
              <div ref={miniChart1Ref}></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Distribution Cloud</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="w-full h-[100px]" />
            ) : (
              <div ref={miniChart2Ref}></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">New Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="w-full h-[100px]" />
            ) : (
              <div ref={miniChart3Ref}></div>
            )}
          </CardContent>
        </Card>
      </div>
      <FormulationChart 
        className="col-span-2 w-[40%]"
        data={filteredData} 
        title="Naloxone Distribution by Formulation"
      />
    </div>
  )
}

export default PublicDashboard

