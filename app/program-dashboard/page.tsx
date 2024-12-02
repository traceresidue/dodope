'use client'

import { ProgramDashboard } from '@/components/ProgramDashboard'
import { OrdersProgram } from '@/components/ui/orders-program'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProgramDashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="programs">Program Dashboard</TabsTrigger>
          <TabsTrigger value="orders">Orders Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="programs" className="mt-6">
          <ProgramDashboard />
        </TabsContent>
        
        <TabsContent value="orders" className="mt-6">
          <OrdersProgram />
        </TabsContent>
      </Tabs>
    </div>
  )
}

