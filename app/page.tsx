import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6">Welcome to the Naloxone Distribution Dashboard</h1>
      <p className="text-xl mb-8">This dashboard provides comprehensive data visualization and management tools for Naloxone distribution programs.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Program Dashboard</CardTitle>
            <CardDescription>View and analyze program-specific data</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/program-dashboard" className="text-blue-500 hover:underline">Go to Program Dashboard</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Public Dashboard</CardTitle>
            <CardDescription>Access publicly available Naloxone distribution data</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/public-dashboard" className="text-blue-500 hover:underline">Go to Public Dashboard</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Programs</CardTitle>
            <CardDescription>View all active programs and their data</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/programs" className="text-blue-500 hover:underline">View Programs</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Simple Query</CardTitle>
            <CardDescription>Perform custom queries on the data</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/simple-query" className="text-blue-500 hover:underline">Go to Simple Query</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}