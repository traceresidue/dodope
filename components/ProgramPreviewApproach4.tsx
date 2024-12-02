import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ProgramPreviewApproach4({ program }) {
  const maxValue = Math.max(
    program.total_encounters,
    program.total_dispensed_nasal + program.total_dispensed_inject,
    program.new_registrations,
    program.total_naloxone_uses
  )

  const renderDot = (value: number) => {
    if (value === 0) {
      return (
        <div className="inline-block w-2 h-2 rounded-full border border-black"></div>
      );
    }
    return '•'.repeat(Math.round((value / maxValue) * 50));
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Approach 4: Data Representation as Dots</CardTitle>
      </CardHeader>
      <CardContent className="h-[250px] overflow-y-auto">
        <div className="space-y-2">
          {[
            { label: 'Total Encounters', value: program.total_encounters, color: '#047857' },
            { label: 'Naloxone Dispensed', value: program.total_dispensed_nasal + program.total_dispensed_inject, color: '#40CCC3' },
            { label: 'New Registrations', value: program.new_registrations, color: '#F97066' },
            { label: 'Reported Uses', value: program.total_naloxone_uses, color: '#047857' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <span className="font-semibold">{label}:</span> {value}
              <div style={{ color }}>{renderDot(value)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

