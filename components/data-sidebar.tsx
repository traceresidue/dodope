'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { filterData } from '@/utils/data-filter'
import { Database } from '@/types/supabase'

type ProgramSurveyEntry = Database['public']['Tables']['program_survey_entries']['Row']

interface DataSidebarProps {
  entries: ProgramSurveyEntry[]
  onFilterChange: (filteredEntries: ProgramSurveyEntry[]) => void
}

export function DataSidebar({ entries, onFilterChange }: DataSidebarProps) {
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [dispensedRange, setDispensedRange] = useState<[number, number]>([0, 1000])

  const programs = Array.from(new Set(entries.map(entry => entry.programshortname)))

  const handleFilterChange = () => {
    const filteredEntries = filterData(entries, {
      dateRange: { start: startDate, end: endDate },
      program: selectedProgram,
      additionalFilters: (item) => 
        item.total_dispensed >= dispensedRange[0] && 
        item.total_dispensed <= dispensedRange[1]
    })
    onFilterChange(filteredEntries)
  }

  return (
    <div className="w-64 bg-white p-4 border-r border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Filter Data</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="program">Program</Label>
          <Select onValueChange={setSelectedProgram} value={selectedProgram}>
            <SelectTrigger id="program">
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Programs</SelectItem>
              {programs.map((program) => (
                <SelectItem key={program} value={program}>
                  {program}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="month"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="month"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div>
          <Label>Dispensed Range</Label>
          <Slider
            min={0}
            max={1000}
            step={10}
            value={dispensedRange}
            onValueChange={setDispensedRange}
          />
          <div className="flex justify-between mt-2">
            <span>{dispensedRange[0]}</span>
            <span>{dispensedRange[1]}</span>
          </div>
        </div>

        <Button onClick={handleFilterChange} className="w-full">
          Apply Filters
        </Button>
      </div>
    </div>
  )
}

