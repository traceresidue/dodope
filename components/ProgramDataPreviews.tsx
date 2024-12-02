import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ArrowUpRight, Activity, Users2, FileDown, ChevronDown } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { ProgramPreviewApproach1 } from './ProgramPreviewApproach1'
import { ProgramPreviewApproach4 } from './ProgramPreviewApproach4'
import { ProgramPreviewApproach5 } from './ProgramPreviewApproach5'
import { ProgramPreviewApproach6 } from './ProgramPreviewApproach6'
import { Iframe } from './Iframe'

type ProgramData = {
  programshortname: string
  programname: string
  total_encounters: number
  total_naloxone_uses: number
  new_registrations: number
  days_with_encounters: number
  total_dispensed_nasal: number
  total_dispensed_inject: number
  total_surveys: number
  monthly_surveys: { 
    month: string
    surveys: number
    total_dispensed_nasal: number
    total_dispensed_inject: number
    afam_count: number
    asian_count: number
    latinx_count: number
    native_count: number
    pi_count: number
    white_count: number
    new_registration_count: number
    used_narcan_count: number
  }[]
}

export function ProgramDataPreviews() {
  const [programsData, setProgramsData] = useState<ProgramData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  useEffect(() => {
    fetchProgramsData()
  }, [])

  useEffect(() => {
    const filteredPrograms = programsData.filter(program => 
      program.programname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.programshortname.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (filteredPrograms.length === 1) {
      setExpandedItem(filteredPrograms[0].programshortname)
    } else {
      setExpandedItem(null)
    }
  }, [searchQuery, programsData])

  async function fetchProgramsData() {
    setLoading(true)
    try {
      const { data: programs, error: programsError } = await supabase
        .from('program_details')
        .select('programname, programshortname')
        .eq('disabled', false)
        .order('programname')

      if (programsError) throw programsError

      const programsWithData = await Promise.all(programs.map(async (program) => {
        const { data, error } = await supabase
          .from('program_survey_entries')
          .select('*')
          .eq('programshortname', program.programshortname)
          .order('month_year', { ascending: true })

        if (error) throw error

        const stats = calculateStats(data)
        const monthly_surveys = data.map(item => ({
          month: item.month_year,
          surveys: item.total_surveys || 0,
          total_dispensed_nasal: item.total_dispensed_nasal || 0,
          total_dispensed_inject: item.total_dispensed_inject || 0,
          afam_count: item.afam_count || 0,
          asian_count: item.asian_count || 0,
          latinx_count: item.latinx_count || 0,
          native_count: item.native_count || 0,
          pi_count: item.pi_count || 0,
          white_count: item.white_count || 0,
          new_registration_count: item.new_registration_count || 0,
          used_narcan_count: item.used_narcan_count || 0
        }))

        return {
          ...program,
          ...stats,
          monthly_surveys
        }
      }))

      setProgramsData(programsWithData)
    } catch (error) {
      console.error('Error fetching programs data:', error)
    } finally {
      setLoading(false)
    }
  }

  function calculateStats(data: any[]): Omit<ProgramData, 'programshortname' | 'programname' | 'monthly_surveys'> {
    return data.reduce((acc, item) => ({
      total_encounters: (acc.total_encounters || 0) + (item.total_surveys || 0),
      total_naloxone_uses: (acc.total_naloxone_uses || 0) + (item.used_narcan_count || 0),
      new_registrations: (acc.new_registrations || 0) + (item.new_registration_count || 0),
      days_with_encounters: (acc.days_with_encounters || 0) + (item.unique_service_days || 0),
      total_dispensed_nasal: (acc.total_dispensed_nasal || 0) + (item.total_dispensed_nasal || 0),
      total_dispensed_inject: (acc.total_dispensed_inject || 0) + (item.total_dispensed_inject || 0),
      total_surveys: (acc.total_surveys || 0) + (item.total_surveys || 0)
    }), {} as Omit<ProgramData, 'programshortname' | 'programname' | 'monthly_surveys'>)
  }

  const exportAllData = async () => {
    try {
      const { data, error } = await supabase
        .from('program_survey_entries')
        .select('*')
        .order('month_year', { ascending: true })

      if (error) throw error

      const headers = Object.keys(data[0]).join(',')
      const csvData = data.map(row => Object.values(row).join(',')).join('\n')
      const csvContent = `${headers}\n${csvData}`
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', 'all_program_survey_entries.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const filteredPrograms = programsData.filter(program => 
    program.programname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.programshortname.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <Skeleton className="w-full h-96" />
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Program Data Previews</CardTitle>
        <div className="flex items-center gap-4">
          <Button onClick={exportAllData} variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            Export All Data
          </Button>
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion 
          type="single" 
          collapsible 
          className="w-full"
          value={expandedItem}
          onValueChange={setExpandedItem}
        >
          {filteredPrograms.map((program) => (
            <AccordionItem key={program.programshortname} value={program.programshortname}>
              <AccordionTrigger className="flex justify-between px-4 w-full py-2">
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg font-semibold truncate max-w-[300px]">{program.programname}</span>
                  <div className="flex items-center gap-6">
                    <div className={`flex items-center gap-1 ${program.total_surveys ? 'text-blue-600' : 'text-gray-400'}`}>
                      <Users2 className="h-3 w-3" />
                      <span className="text-sm font-medium">{program.total_surveys ? program.total_surveys : 'No Data'}</span>
                      {program.total_surveys && <span className="text-xs text-gray-500 ml-1">Encounters</span>}
                    </div>
                    <div className={`flex items-center gap-1 ${program.total_naloxone_uses ? 'text-green-600' : 'text-gray-400'}`}>
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12h6m-3-3v6m-8-3h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4v-8zm0 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8M4 12h16v8a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-8" />
                      </svg>
                      <span className="text-sm font-medium">{program.total_naloxone_uses ? program.total_naloxone_uses : 'No Data'}</span>
                      {program.total_naloxone_uses && <span className="text-xs text-gray-500 ml-1">Uses</span>}
                    </div>
                    <div className={`flex items-center gap-1 ${program.total_dispensed_nasal + program.total_dispensed_inject > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M5 12a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2M5 12a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2" />
                        <path d="M12 16v-4" />
                      </svg>
                      <span className="text-sm font-medium">
                        {program.total_dispensed_nasal + program.total_dispensed_inject > 0
                          ? `${program.total_dispensed_nasal + program.total_dispensed_inject}`
                          : 'No Data'}
                      </span>
                      {program.total_dispensed_nasal + program.total_dispensed_inject > 0 && (
                        <span className="text-xs text-gray-500 ml-1">Units Total</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-gray-500 mb-1">Preview Data</span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                    <Link 
                      href={`/program/${program.programshortname}`}
                      className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 ml-4 border border-blue-200 rounded px-2 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>View Full Data</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4">
                  <div className="flex flex-col space-y-4">
                    {program.total_surveys < 2 ? (
                      <div className="col-span-2">
                        <Skeleton className="w-full h-[250px] flex items-center justify-center">
                          <p className="text-gray-500 font-medium">Data Not Available</p>
                        </Skeleton>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <ProgramPreviewApproach4 program={program} />
                          <Iframe />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <ProgramPreviewApproach5 program={program} />
                          <ProgramPreviewApproach6 program={program} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <ProgramPreviewApproach1 program={program} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}

