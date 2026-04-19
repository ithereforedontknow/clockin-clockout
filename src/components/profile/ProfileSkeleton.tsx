import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-8">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <Card className="border-none bg-muted/20">
            <CardContent className="h-64" />
          </Card>
          <Card>
            <CardContent className="h-40" />
          </Card>
        </div>
        <div className="space-y-8 lg:col-span-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="h-48" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
