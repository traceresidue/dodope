import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function Iframe() {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Iframe</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500 font-medium">Iframe content will be added here</p>
        </div>
      </CardContent>
    </Card>
  )
}

