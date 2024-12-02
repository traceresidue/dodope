import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = 'https://obheyqbxnhsejpjewtzs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaGV5cWJ4bmhzZWpwamV3dHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzMzQzNTMsImV4cCI6MjA0MzkxMDM1M30.qNryur5BuccD0NUXobl_-ABEEaLbDb82zoRDtHvcImk'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Test the connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('program_survey_entries').select('id').limit(1)
    if (error) throw error
    console.log('Successfully connected to Supabase')
    return true
  } catch (error) {
    console.error('Error connecting to Supabase:', error)
    return false
  }
}

