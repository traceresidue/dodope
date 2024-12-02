'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'

// Use the same Supabase client as PublicDashboard
const supabase = createClient('https://obheyqbxnhsejpjewtzs.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaGV5cWJ4bmhzZWpwamV3dHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzMzQzNTMsImV4cCI6MjA0MzkxMDM1M30.qNryur5BuccD0NUXobl_-ABEEaLbDb82zoRDtHvcImk')

type OrderEntry = {
  order_date: string
  order_program: string
  "IM Units": number
  "Nasal Units": number
  "Total Naloxone": number
}

export function OrdersProgram() {
  const [data, setData] = useState<OrderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [programs, setPrograms] = useState(['all'])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: orderData, error } = await supabase
        .from('old_orders')
        .select('*')
        .order('order_date', { ascending: true })

      if (error) throw error

      const validData = orderData.filter(item => {
        const date = new Date(item.order_date)
        return !isNaN(date.getTime())
      })

      // Process the data
      const processedData = validData.map(item => ({
        ...item,
        "IM Units": Number(item["IM Units"]) || 0,
        "Nasal Units": Number(item["Nasal Units"]) || 0,
        "Total Naloxone": Number(item["Total Naloxone"]) || 0,
      }))

      setData(processedData)
      setPrograms(['all', ...new Set(processedData.map(item => item.order_program))])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = selectedProgram === 'all' 
    ? data 
    : data.filter(item => item.order_program === selectedProgram)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    })
  }

  const handleExportCSV = () => {
    const csvContent = [
      ['Order Date', 'Program', 'IM Units', 'Nasal Units', 'Total Units'],
      ...filteredData.map(item => [
        item.order_date,
        item.order_program,
        item["IM Units"],
        item["Nasal Units"],
        item["Total Naloxone"]
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'orders_data.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={selectedProgram} onValueChange={setSelectedProgram}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a program" />
          </SelectTrigger>
          <SelectContent>
            {programs.map((program) => (
              <SelectItem key={program} value={program}>
                {program === 'all' ? 'All Programs' : program}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleExportCSV}>Export CSV</Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Orders Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="order_date" 
                      tickFormatter={formatDate}
                    />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar 
                      dataKey="IM Units" 
                      fill="var(--color-total_dispensed_inject)" 
                      name="IM Units"
                    />
                    <Bar 
                      dataKey="Nasal Units" 
                      fill="var(--color-total_dispensed_nasal)" 
                      name="Nasal Units"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>IM Units</TableHead>
                    <TableHead>Nasal Units</TableHead>
                    <TableHead>Total Units</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.slice(0, 5).map((order, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(order.order_date)}</TableCell>
                      <TableCell>{order.order_program}</TableCell>
                      <TableCell>{order["IM Units"]}</TableCell>
                      <TableCell>{order["Nasal Units"]}</TableCell>
                      <TableCell>{order["Total Naloxone"]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}