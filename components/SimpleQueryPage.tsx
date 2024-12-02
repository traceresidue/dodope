'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Pie, PieChart, Cell } from 'recharts'
import { Skeleton } from "@/components/ui/skeleton"

type SurveyEntry = {
  id: number
  programshortname: string
  month_year: string
  total_surveys: number
  total_dispensed_nasal: number
  total_dispensed_inject: number
  [key: string]: any
}

type Program = {
  programname: string
  programshortname: string
}

type AggregatedData = {
  month_year: string
  total_surveys: number
  total_dispensed_nasal: number
  total_dispensed_inject: number
}

const tables = ['program_survey_entries', 'program_surveys', 'p_surveys'];

interface SimpleQueryPageProps {
  initialProgram?: string;
}

export function SimpleQueryPage({ initialProgram }: SimpleQueryPageProps) {
  const [data, setData] = useState<SurveyEntry[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [months, setMonths] = useState<string[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string>(initialProgram || 'All Programs')
  const [startMonth, setStartMonth] = useState<string>('all')
  const [endMonth, setEndMonth] = useState<string>('all')
  const [selectedTable, setSelectedTable] = useState<string>(tables[0])

  useEffect(() => {
    fetchData()
    fetchActivePrograms()
  }, [selectedTable])

  async function fetchData() {
    let query = supabase
      .from(selectedTable)
      .select('*')
      .order('month_year', { ascending: true })

    if (initialProgram) {
      query = query.eq('programshortname', initialProgram)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching data:', error)
    } else if (data) {
      setData(data)
      const uniqueMonths = Array.from(new Set(data.map(item => item.month_year)))
      setMonths(uniqueMonths.sort())
    }
  }

  async function fetchActivePrograms() {
    try {
      const { data: programs, error } = await supabase
        .from('program_details')
        .select('programname, programshortname')
        .eq('disabled', false)
        .order('programname')

      if (error) throw error
      setPrograms([{ programname: 'All Programs', programshortname: 'All Programs' }, ...(programs || [])])
    } catch (error) {
      console.error('Error fetching active programs:', error)
    }
  }

  const filteredData = data.filter(item => {
    const programMatch = selectedProgram === 'All Programs' || 
      programs.find(p => p.programname === selectedProgram)?.programshortname === item.programshortname
    const startMonthMatch = startMonth === 'all' || item.month_year >= startMonth
    const endMonthMatch = endMonth === 'all' || item.month_year <= endMonth
    return programMatch && startMonthMatch && endMonthMatch
  })

  const aggregatedData: AggregatedData[] = filteredData.reduce((acc, item) => {
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

  const handleStartMonthChange = (value: string) => {
    setStartMonth(value)
    if (value !== 'all' && endMonth !== 'all' && value > endMonth) {
      setEndMonth(value)
    }
  }

  const handleEndMonthChange = (value: string) => {
    setEndMonth(value)
    if (value !== 'all' && startMonth !== 'all' && value < startMonth) {
      setStartMonth(value)
    }
  }

  const barChartData = aggregatedData.map(item => ({
    month: item.month_year,
    total_surveys: item.total_surveys
  }))

  const pieChartData = [
    { name: 'Nasal', value: aggregatedData.reduce((sum, item) => sum + item.total_dispensed_nasal, 0) },
    { name: 'Inject', value: aggregatedData.reduce((sum, item) => sum + item.total_dispensed_inject, 0) }
  ]

  const COLORS = ['#0088FE', '#00C49F']

  function calculateStats(data: SurveyEntry[]) {
    const numericColumns = Object.keys(data[0]).filter(key => typeof data[0][key] === 'number');

    return numericColumns.reduce((acc, column) => {
      const values = data.map(item => item[column] as number);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length || 0;
      acc[column] = { sum, avg };
      return acc;
    }, {} as Record<string, { sum: number; avg: number }>);
  }

  const exportToCSV = useCallback(() => {
    if (filteredData.length === 0) return;

    const headers = Object.keys(filteredData[0]).join(',');
    const csvData = filteredData.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = `${headers}\n${csvData}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'filtered_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [filteredData]);

  const dateFormats = ['YYYY-MM', 'MM-YYYY', '01-MM-YYYY', 'MMM YYYY', 'MMMM YYYY'];
  const [currentDateFormatIndex, setCurrentDateFormatIndex] = useState(0);

  const changeDateFormat = useCallback(() => {
    setCurrentDateFormatIndex((prevIndex) => (prevIndex + 1) % dateFormats.length);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const format = dateFormats[currentDateFormatIndex];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    switch (format) {
      case 'YYYY-MM':
        return dateString;
      case 'MM-YYYY':
        return `${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
      case '01-MM-YYYY':
        return `01-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
      case 'MMM YYYY':
        return `${monthNamesShort[date.getMonth()]} ${date.getFullYear()}`;
      case 'MMMM YYYY':
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      default:
        return dateString;
    }
  }, [currentDateFormatIndex]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simple Query - {selectedTable}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="table-select">Select Table</Label>
              <Select onValueChange={setSelectedTable} value={selectedTable}>
                <SelectTrigger id="table-select">
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!initialProgram && (
              <div>
                <Label htmlFor="program-select">Select Program</Label>
                <Select onValueChange={setSelectedProgram} value={selectedProgram}>
                  <SelectTrigger id="program-select">
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.programshortname} value={program.programname}>
                        {program.programname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label htmlFor="start-month">Start Month</Label>
                <Select onValueChange={handleStartMonthChange} value={startMonth}>
                  <SelectTrigger id="start-month">
                    <SelectValue placeholder="Select start month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="end-month">End Month</Label>
                <Select onValueChange={handleEndMonthChange} value={endMonth}>
                  <SelectTrigger id="end-month">
                    <SelectValue placeholder="Select end month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button onClick={fetchData}>Refresh Data</Button>
              <Button onClick={changeDateFormat}>Change Date Format</Button>
              <Button onClick={exportToCSV}>Export to CSV</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap">
        <Card className="w-full md:w-1/2 p-2">
          <CardHeader>
            <CardTitle>
              {selectedProgram === 'All Programs' 
                ? 'Aggregated Total Surveys Over Time (All Programs)' 
                : `Total Surveys Over Time (${selectedProgram})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
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
            <CardTitle>Dispensed Naloxone Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
              <ChartContainer config={{
                Nasal: {
                  label: "Nasal",
                  color: "#0088FE",
                },
                Inject: {
                  label: "Inject",
                  color: "#00C49F",
                },
              }} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      
))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
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

      <Card>
        <CardHeader>
          <CardTitle>Column Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(calculateStats(filteredData)).map(([column, stats]) => (
                <div key={column} className="bg-gray-100 p-4 rounded-md">
                  <h3 className="font-bold">{column}</h3>
                  <p>Average: {stats.avg.toFixed(2)}</p>
                  <p>Sum: {stats.sum.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No data available for this period</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedTable} Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Total Surveys</TableHead>
                <TableHead>Nasal Dispensed</TableHead>
                <TableHead>Inject Dispensed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aggregatedData.length > 0 ? (
                aggregatedData.map((row) => (
                  <TableRow key={row.month_year}>
                    <TableCell>{formatDate(row.month_year)}</TableCell>
                    <TableCell>{row.total_surveys}</TableCell>
                    <TableCell>{row.total_dispensed_nasal}</TableCell>
                    <TableCell>{row.total_dispensed_inject}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">No data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

